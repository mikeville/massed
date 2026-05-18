import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * useSpeechRecognition — thin wrapper over the Web Speech API.
 *
 * Returns the live transcript while listening, plus a setter so the
 * user can edit it after stopping. Falls back to {supported:false}
 * in Firefox and other browsers without the API — callers should
 * keep the textarea editable so dictation via the OS still works.
 */

interface SpeechRecognitionLike extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((ev: SpeechRecognitionEventLike) => void) | null;
  onerror: ((ev: { error: string }) => void) | null;
  onend: (() => void) | null;
}

interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: ArrayLike<{
    0: { transcript: string };
    isFinal: boolean;
    length: number;
  }>;
}

interface RecognitionCtor {
  new (): SpeechRecognitionLike;
}

function getRecognitionCtor(): RecognitionCtor | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as {
    SpeechRecognition?: RecognitionCtor;
    webkitSpeechRecognition?: RecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export interface UseSpeechRecognition {
  supported: boolean;
  listening: boolean;
  transcript: string;
  error: string | null;
  start: () => void;
  stop: () => void;
  setTranscript: (t: string) => void;
}

export function useSpeechRecognition(): UseSpeechRecognition {
  const [supported] = useState<boolean>(() => getRecognitionCtor() !== null);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const recRef = useRef<SpeechRecognitionLike | null>(null);
  // The transcript at the moment listening (re)started — new speech
  // appends to this, so the user's prior text survives a stop/start.
  const baselineRef = useRef('');

  const stop = useCallback(() => {
    const rec = recRef.current;
    if (rec) {
      try {
        rec.stop();
      } catch {
        /* already stopped */
      }
    }
    setListening(false);
  }, []);

  const start = useCallback(() => {
    const Ctor = getRecognitionCtor();
    if (!Ctor) {
      setError('voice not supported in this browser.');
      return;
    }
    setError(null);
    const rec = new Ctor();
    rec.lang = 'en-US';
    rec.continuous = true;
    rec.interimResults = true;
    baselineRef.current = transcript ? transcript.replace(/\s+$/, '') + ' ' : '';
    rec.onresult = (ev) => {
      // `ev.results` accumulates across the whole start/stop cycle when
      // `continuous: true`. Iterate from 0 so finalized phrases stay
      // present even after the recognizer advances `resultIndex` past
      // them. Earlier code iterated from `resultIndex`, which dropped
      // every phrase as soon as the next one began.
      let full = '';
      for (let i = 0; i < ev.results.length; i++) {
        const result = ev.results[i];
        if (result && result[0]) full += result[0].transcript;
      }
      setTranscript(baselineRef.current + full);
    };
    rec.onerror = (ev) => {
      // 'no-speech' fires when the user opens the mic but says nothing —
      // not actually an error worth surfacing. Let onend handle teardown.
      if (ev.error !== 'no-speech' && ev.error !== 'aborted') {
        setError(ev.error || 'recognition error.');
      }
    };
    rec.onend = () => {
      setListening(false);
    };
    recRef.current = rec;
    try {
      rec.start();
      setListening(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'failed to start.');
      setListening(false);
    }
  }, [transcript]);

  // Make sure we don't leak a recognizer if the component unmounts mid-listen.
  useEffect(() => {
    return () => {
      const rec = recRef.current;
      if (rec) {
        try {
          rec.abort();
        } catch {
          /* noop */
        }
      }
    };
  }, []);

  return {
    supported,
    listening,
    transcript,
    error,
    start,
    stop,
    setTranscript,
  };
}
