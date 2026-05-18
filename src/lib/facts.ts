import type { FunFact, FactCategory, ComparisonTokens } from './types';

/**
 * Fact reference data — the pool the editorial headline draws from.
 *
 * Each entry decomposes the noun into pieces so the renderer can place
 * an italic *intentionally* (the noun phrase) instead of guessing at the
 * "last word" of a baked sentence. That lets us handle:
 *
 *   - articles: "a Civic" vs "an elephant" vs "the Liberty Bell"
 *   - plurals:  "1 jelly bean" vs "47 jelly beans"
 *   - trailing copy: "a Boeing 737, empty" — italic stays on "Boeing 737"
 *   - fractional: "40% of a Civic"
 *
 * Curation rules (for whoever extends this list):
 *   - prefer SPECIFIC over generic ("1985 Honda Civic" > "a small car")
 *   - prefer FAMILIAR-but-WEIRD over abstract
 *   - keep `singular` short enough to fit one display line on mobile
 *   - if the default italic (the whole singular) reads poorly, set
 *     `emphasis` to the noun portion you want italicized
 *   - mix categories — see CATEGORY rotation logic in `nextFact`
 *
 * Weights span 0.01 lb (a paperclip) to ~12M lb (the Eiffel Tower) so
 * the matcher always has good candidates in [0.5×, 50×] of the user's
 * total, whether they're 100 lb in or 10M lb in.
 */
export interface FactReference {
  /** Reference weight in lb. */
  weight: number;
  /** Unprefixed singular form: "1985 Honda Civic". */
  singular: string;
  /** Plural form: "1985 Honda Civics". Hand-written when irregular. */
  plural: string;
  /**
   * Article for the singular form. "a" / "an" for indefinite nouns;
   * "the" for proper-noun references like "the Liberty Bell" or
   * "the bell of Notre-Dame" where the indefinite reading would be
   * wrong ("a Liberty Bell" — there's only one).
   */
  article: 'a' | 'an' | 'the';
  /**
   * Optional override for what to italicize. If absent, the whole
   * singular/plural is italicized. Use when the singular has a trailing
   * modifier that shouldn't be italicized — e.g. for "Boeing 737, empty"
   * set `emphasis = { singular: 'Boeing 737', plural: 'Boeing 737s' }`
   * so the comma-clause stays upright.
   */
  emphasis?: { singular: string; plural: string };
  category: FactCategory;
  /** Optional citation, used by the future build-time generator. */
  source?: string;
}

export const FACT_REFERENCES: FactReference[] = [
  // ── vehicles ─────────────────────────────────────────────
  { weight: 1.5,     article: 'a',  singular: 'Hot Wheels die-cast car',          plural: 'Hot Wheels die-cast cars',         category: 'vehicle' },
  { weight: 12,      article: 'a',  singular: 'unicycle',                          plural: 'unicycles',                         category: 'vehicle' },
  { weight: 17,      article: 'a',  singular: 'carbon-fiber road bike',           plural: 'carbon-fiber road bikes',
    emphasis: { singular: 'road bike', plural: 'road bikes' },                                                                  category: 'vehicle' },
  { weight: 29,      article: 'a',  singular: 'mountain bike',                     plural: 'mountain bikes',                   category: 'vehicle' },
  { weight: 35,      article: 'a',  singular: 'BMX bike',                          plural: 'BMX bikes',                        category: 'vehicle' },
  { weight: 50,      article: 'a',  singular: 'penny-farthing',                    plural: 'penny-farthings',                  category: 'vehicle' },
  { weight: 65,      article: 'a',  singular: 'electric scooter',                  plural: 'electric scooters',                category: 'vehicle' },
  { weight: 110,     article: 'a',  singular: 'Vespa 50 scooter',                  plural: 'Vespa 50 scooters',
    emphasis: { singular: 'Vespa', plural: 'Vespa 50' },                                                                        category: 'vehicle' },
  { weight: 280,     article: 'a',  singular: 'racing kayak',                      plural: 'racing kayaks',                    category: 'vehicle' },
  { weight: 400,     article: 'a',  singular: 'Harley Sportster',                  plural: 'Harley Sportsters',                category: 'vehicle' },
  { weight: 600,     article: 'a',  singular: 'Vespa Primavera scooter',           plural: 'Vespa Primaveras',
    emphasis: { singular: 'Vespa Primavera', plural: 'Vespa Primaveras' },                                                       category: 'vehicle' },
  { weight: 900,     article: 'a',  singular: 'Jet Ski',                           plural: 'Jet Skis',                         category: 'vehicle' },
  { weight: 1100,    article: 'a',  singular: 'Citroën 2CV',                       plural: 'Citroën 2CVs',                     category: 'vehicle' },
  { weight: 1200,    article: 'a',  singular: 'Ford Model T',                      plural: 'Ford Model Ts',                    category: 'vehicle' },
  { weight: 1500,    article: 'a',  singular: 'Smart Fortwo',                      plural: 'Smart Fortwos',                    category: 'vehicle' },
  { weight: 1700,    article: 'a',  singular: '1965 Volkswagen Beetle',            plural: '1965 Volkswagen Beetles',
    emphasis: { singular: 'Volkswagen Beetle', plural: 'Volkswagen Beetles' },                                                  category: 'vehicle' },
  { weight: 1800,    article: 'a',  singular: 'DeLorean DMC-12',                   plural: 'DeLorean DMC-12s',
    emphasis: { singular: 'DeLorean', plural: 'DeLorean DMC-12' },                                                              category: 'vehicle' },
  { weight: 1975,    article: 'a',  singular: '1985 Honda Civic',                  plural: '1985 Honda Civics',                category: 'vehicle' },
  { weight: 2400,    article: 'a',  singular: 'first-generation Mini Cooper',     plural: 'first-generation Mini Coopers',
    emphasis: { singular: 'Mini Cooper', plural: 'Mini Coopers' },                                                              category: 'vehicle' },
  { weight: 2425,    article: 'a',  singular: 'Ferrari F40',                       plural: 'Ferrari F40s',                     category: 'vehicle' },
  { weight: 2700,    article: 'a',  singular: 'Volkswagen Microbus',               plural: 'Volkswagen Microbuses',                                                                                                category: 'vehicle' },
  { weight: 2900,    article: 'a',  singular: 'Tesla Roadster',                    plural: 'Tesla Roadsters',                  category: 'vehicle' },
  { weight: 3300,    article: 'a',  singular: 'Lamborghini Countach',              plural: 'Lamborghini Countaches',
    emphasis: { singular: 'Countach', plural: 'Countaches' },                                                                   category: 'vehicle' },
  { weight: 3500,    article: 'a',  singular: '1957 Chevrolet Bel Air',            plural: '1957 Chevy Bel Airs',
    emphasis: { singular: 'Bel Air', plural: 'Bel Airs' },                                                                      category: 'vehicle' },
  { weight: 3700,    article: 'a',  singular: 'Ford Mustang GT',                   plural: 'Ford Mustang GTs',
    emphasis: { singular: 'Mustang GT', plural: 'Mustang GTs' },                                                                category: 'vehicle' },
  { weight: 4200,    article: 'a',  singular: 'London black cab',                  plural: 'London black cabs',                category: 'vehicle' },
  { weight: 4400,    article: 'a',  singular: 'Toyota Tacoma',                     plural: 'Toyota Tacomas',                   category: 'vehicle' },
  { weight: 4900,    article: 'a',  singular: 'Tesla Model 3',                     plural: 'Tesla Model 3s',                   category: 'vehicle' },
  { weight: 5700,    article: 'a',  singular: 'Cadillac Escalade',                 plural: 'Cadillac Escalades',               category: 'vehicle' },
  { weight: 6600,    article: 'a',  singular: 'Tesla Cybertruck',                  plural: 'Tesla Cybertrucks',                category: 'vehicle' },
  { weight: 8000,    article: 'a',  singular: 'Caterpillar D2 bulldozer',          plural: 'Caterpillar D2 bulldozers',
    emphasis: { singular: 'bulldozer', plural: 'bulldozers' },                                                                  category: 'vehicle' },
  { weight: 10_000,  article: 'a',  singular: 'monster truck tire',                plural: 'monster truck tires',              category: 'vehicle' },
  { weight: 12_000,  article: 'a',  singular: 'UPS delivery truck',                plural: 'UPS delivery trucks',              category: 'vehicle' },
  { weight: 17_000,  article: 'a',  singular: 'semi-truck cab',                    plural: 'semi-truck cabs',                  category: 'vehicle' },
  { weight: 24_000,  article: 'a',  singular: 'yellow school bus',                 plural: 'yellow school buses',              category: 'vehicle' },
  { weight: 33_000,  article: 'a',  singular: 'garbage truck',                     plural: 'garbage trucks',                   category: 'vehicle' },
  { weight: 40_000,  article: 'a',  singular: 'cement mixer truck',                plural: 'cement mixer trucks',              category: 'vehicle' },
  { weight: 66_000,  article: 'a',  singular: 'M4 Sherman tank',                   plural: 'M4 Sherman tanks',
    emphasis: { singular: 'Sherman tank', plural: 'Sherman tanks' },                                                            category: 'vehicle' },
  { weight: 88_000,  article: 'a',  singular: 'fully loaded city bus',             plural: 'fully loaded city buses',
    emphasis: { singular: 'city bus', plural: 'city buses' },                                                                   category: 'vehicle' },
  { weight: 140_000, article: 'an', singular: 'M1 Abrams tank',                    plural: 'M1 Abrams tanks',
    emphasis: { singular: 'Abrams tank', plural: 'Abrams tanks' },                                                              category: 'vehicle' },
  { weight: 165_000, article: 'a',  singular: 'Boeing 737, empty',                 plural: 'Boeing 737s, empty',
    emphasis: { singular: 'Boeing 737', plural: 'Boeing 737s' },                                                                category: 'vehicle' },
  { weight: 172_000, article: 'the', singular: 'Space Shuttle Discovery, dry',     plural: 'Space Shuttle Discoveries, dry',
    emphasis: { singular: 'Space Shuttle Discovery', plural: 'Space Shuttle Discoveries' },                                     category: 'vehicle' },
  { weight: 232_000, article: 'a',  singular: 'fully fueled Tesla Semi',           plural: 'fully fueled Tesla Semis',
    emphasis: { singular: 'Tesla Semi', plural: 'Tesla Semis' },                                                                category: 'vehicle' },
  { weight: 404_000, article: 'a',  singular: 'Boeing 747-400, empty',             plural: 'Boeing 747-400s, empty',
    emphasis: { singular: 'Boeing 747-400', plural: 'Boeing 747-400s' },                                                        category: 'vehicle' },
  { weight: 628_000, article: 'an', singular: 'Antonov An-225, empty',             plural: 'Antonov An-225s, empty',
    emphasis: { singular: 'An-225', plural: 'An-225s' },                                                                        category: 'vehicle' },
  { weight: 200_000_000, article: 'a', singular: 'fully loaded oil supertanker',  plural: 'fully loaded oil supertankers',
    emphasis: { singular: 'supertanker', plural: 'supertankers' },                                                              category: 'vehicle' },

  // ── animals ──────────────────────────────────────────────
  { weight: 0.05,    article: 'a',  singular: 'bee hummingbird',                   plural: 'bee hummingbirds',                 category: 'animal' },
  { weight: 0.2,     article: 'a',  singular: 'mouse',                             plural: 'mice',                             category: 'animal' },
  { weight: 0.5,     article: 'a',  singular: 'painted turtle',                    plural: 'painted turtles',                  category: 'animal' },
  { weight: 1,       article: 'a',  singular: 'pet rat',                           plural: 'pet rats',                         category: 'animal' },
  { weight: 2,       article: 'a',  singular: 'guinea pig',                        plural: 'guinea pigs',                      category: 'animal' },
  { weight: 6,       article: 'a',  singular: 'red-tailed hawk',                   plural: 'red-tailed hawks',                 category: 'animal' },
  { weight: 8,       article: 'a',  singular: 'chihuahua',                         plural: 'chihuahuas',                       category: 'animal' },
  { weight: 12,      article: 'a',  singular: 'house rabbit',                      plural: 'house rabbits',                    category: 'animal' },
  { weight: 18,      article: 'a',  singular: 'corgi',                             plural: 'corgis',                           category: 'animal' },
  { weight: 25,      article: 'a',  singular: 'house cat',                         plural: 'house cats',                       category: 'animal' },
  { weight: 40,      article: 'a',  singular: 'beagle',                            plural: 'beagles',                          category: 'animal' },
  { weight: 50,      article: 'a',  singular: 'bald eagle',                        plural: 'bald eagles',                      category: 'animal' },
  { weight: 70,      article: 'a',  singular: 'koala',                             plural: 'koalas',                           category: 'animal' },
  { weight: 90,      article: 'a',  singular: 'border collie',                     plural: 'border collies',                   category: 'animal' },
  { weight: 140,     article: 'a',  singular: 'capybara',                          plural: 'capybaras',                        category: 'animal' },
  { weight: 200,     article: 'a',  singular: 'giant panda cub',                   plural: 'giant panda cubs',                 category: 'animal' },
  { weight: 270,     article: 'an', singular: 'adult ostrich',                     plural: 'adult ostriches',
    emphasis: { singular: 'ostrich', plural: 'ostriches' },                                                                     category: 'animal' },
  { weight: 350,     article: 'a',  singular: 'reticulated python',                plural: 'reticulated pythons',              category: 'animal' },
  { weight: 400,     article: 'a',  singular: 'silverback gorilla',                plural: 'silverback gorillas',              category: 'animal' },
  { weight: 420,     article: 'an', singular: 'adult African lion',                plural: 'adult African lions',
    emphasis: { singular: 'African lion', plural: 'African lions' },                                                            category: 'animal' },
  { weight: 440,     article: 'an', singular: 'adult Bengal tiger',                plural: 'adult Bengal tigers',
    emphasis: { singular: 'Bengal tiger', plural: 'Bengal tigers' },                                                            category: 'animal' },
  { weight: 600,     article: 'a',  singular: 'reindeer',                          plural: 'reindeer',                         category: 'animal' },
  { weight: 800,     article: 'a',  singular: 'kodiak bear',                       plural: 'kodiak bears',                     category: 'animal' },
  { weight: 1000,    article: 'a',  singular: 'moose',                             plural: 'moose',                            category: 'animal' },
  { weight: 1200,    article: 'a',  singular: 'polar bear',                        plural: 'polar bears',                      category: 'animal' },
  { weight: 1500,    article: 'a',  singular: 'thoroughbred racehorse',            plural: 'thoroughbred racehorses',
    emphasis: { singular: 'racehorse', plural: 'racehorses' },                                                                  category: 'animal' },
  { weight: 1800,    article: 'a',  singular: 'cape buffalo',                      plural: 'cape buffalo',                     category: 'animal' },
  { weight: 2200,    article: 'a',  singular: 'giraffe',                           plural: 'giraffes',                         category: 'animal' },
  { weight: 2800,    article: 'a',  singular: 'walrus',                            plural: 'walruses',                         category: 'animal' },
  { weight: 3300,    article: 'a',  singular: 'male African elephant',             plural: 'male African elephants',
    emphasis: { singular: 'African elephant', plural: 'African elephants' },                                                    category: 'animal' },
  { weight: 4000,    article: 'a',  singular: 'white rhinoceros',                  plural: 'white rhinoceroses',
    emphasis: { singular: 'rhinoceros', plural: 'rhinoceroses' },                                                               category: 'animal' },
  { weight: 4500,    article: 'a',  singular: 'hippopotamus',                      plural: 'hippopotamuses',                   category: 'animal' },
  { weight: 6000,    article: 'a',  singular: 'saltwater crocodile, fully grown',  plural: 'saltwater crocodiles, fully grown',
    emphasis: { singular: 'saltwater crocodile', plural: 'saltwater crocodiles' },                                              category: 'animal' },
  { weight: 8000,    article: 'an', singular: 'orca',                              plural: 'orcas',                            category: 'animal' },
  { weight: 14_000,  article: 'a',  singular: 'great white shark',                 plural: 'great white sharks',               category: 'animal' },
  { weight: 22_000,  article: 'a',  singular: 'leatherback sea turtle, on land',   plural: 'leatherback sea turtles, on land',
    emphasis: { singular: 'leatherback sea turtle', plural: 'leatherback sea turtles' },                                        category: 'animal' },
  { weight: 30_000,  article: 'a',  singular: 'giant squid',                       plural: 'giant squids',                     category: 'animal' },
  { weight: 60_000,  article: 'a',  singular: 'humpback whale',                    plural: 'humpback whales',                  category: 'animal' },
  { weight: 90_000,  article: 'a',  singular: 'right whale',                       plural: 'right whales',                     category: 'animal' },
  { weight: 130_000, article: 'a',  singular: 'sperm whale',                       plural: 'sperm whales',                     category: 'animal' },
  { weight: 200_000, article: 'a',  singular: 'fin whale',                         plural: 'fin whales',                       category: 'animal' },
  { weight: 330_000, article: 'a',  singular: 'blue whale',                        plural: 'blue whales',                      category: 'animal' },
  { weight: 50,      article: 'a',  singular: 'wild turkey',                       plural: 'wild turkeys',                     category: 'animal' },
  { weight: 8,       article: 'a',  singular: 'tabby cat',                         plural: 'tabby cats',                       category: 'animal' },
  { weight: 3,       article: 'a',  singular: 'red-eared slider turtle',           plural: 'red-eared slider turtles',
    emphasis: { singular: 'slider turtle', plural: 'slider turtles' },                                                          category: 'animal' },
  { weight: 0.3,     article: 'a',  singular: 'desert tortoise hatchling',         plural: 'desert tortoise hatchlings',
    emphasis: { singular: 'tortoise hatchling', plural: 'tortoise hatchlings' },                                                category: 'animal' },
  { weight: 11,      article: 'a',  singular: 'pet ferret',                        plural: 'pet ferrets',                      category: 'animal' },
  { weight: 0.001,   article: 'a',  singular: 'house spider',                      plural: 'house spiders',                    category: 'animal' },

  // ── objects ──────────────────────────────────────────────
  { weight: 0.0006,  article: 'a',  singular: 'paperclip',                         plural: 'paperclips',                       category: 'object' },
  { weight: 0.005,   article: 'a',  singular: 'penny',                             plural: 'pennies',                          category: 'object' },
  { weight: 0.012,   article: 'a',  singular: 'credit card',                       plural: 'credit cards',                     category: 'object' },
  { weight: 0.014,   article: 'a',  singular: 'pencil',                            plural: 'pencils',                          category: 'object' },
  { weight: 0.04,    article: 'an', singular: 'AAA battery',                       plural: 'AAA batteries',                    category: 'object' },
  { weight: 0.08,    article: 'a',  singular: 'deck of playing cards',             plural: 'decks of playing cards',
    emphasis: { singular: 'deck of playing cards', plural: 'decks of playing cards' },                                          category: 'object' },
  { weight: 0.18,    article: 'a',  singular: 'pair of AirPods Pro',               plural: 'pairs of AirPods Pro',
    emphasis: { singular: 'pair of AirPods', plural: 'pairs of AirPods' },                                                      category: 'object' },
  { weight: 0.45,    article: 'an', singular: 'iPhone 15',                         plural: 'iPhone 15s',                                                                                                           category: 'object' },
  { weight: 1.1,     article: 'an', singular: 'AA battery',                        plural: 'AA batteries',                     category: 'object' },
  { weight: 1.3,     article: 'a',  singular: 'standard hardback novel',           plural: 'standard hardback novels',
    emphasis: { singular: 'hardback novel', plural: 'hardback novels' },                                                        category: 'object' },
  { weight: 1.5,     article: 'a',  singular: 'unopened bag of coffee beans',      plural: 'unopened bags of coffee beans',
    emphasis: { singular: 'bag of coffee', plural: 'bags of coffee' },                                                          category: 'object' },
  { weight: 2,       article: 'a',  singular: 'glass beer bottle, full',           plural: 'glass beer bottles, full',
    emphasis: { singular: 'beer bottle', plural: 'beer bottles' },                                                              category: 'object' },
  { weight: 3,       article: 'a',  singular: 'MacBook Pro',                       plural: 'MacBook Pros',                     category: 'object' },
  { weight: 4,       article: 'a',  singular: 'hardcover dictionary',              plural: 'hardcover dictionaries',           category: 'object' },
  { weight: 5,       article: 'a',  singular: 'ream of printer paper',             plural: 'reams of printer paper',                                                                                               category: 'object' },
  { weight: 5,       article: 'a',  singular: 'standard red brick',                plural: 'standard red bricks',
    emphasis: { singular: 'brick', plural: 'bricks' },                                                                          category: 'object' },
  { weight: 6,       article: 'a',  singular: 'cast-iron Dutch oven',              plural: 'cast-iron Dutch ovens',
    emphasis: { singular: 'Dutch oven', plural: 'Dutch ovens' },                                                                category: 'object' },
  { weight: 8,       article: 'a',  singular: 'gallon of paint',                   plural: 'gallons of paint',
    emphasis: { singular: 'gallon of paint', plural: 'gallons of paint' },                                                      category: 'object' },
  { weight: 10,      article: 'a',  singular: 'standard fire extinguisher',        plural: 'standard fire extinguishers',
    emphasis: { singular: 'fire extinguisher', plural: 'fire extinguishers' },                                                  category: 'object' },
  { weight: 12,      article: 'a',  singular: 'cast-iron skillet',                 plural: 'cast-iron skillets',               category: 'object' },
  { weight: 14,      article: 'a',  singular: 'kettlebell',                        plural: 'kettlebells',                      category: 'object' },
  { weight: 18,      article: 'a',  singular: 'carry-on suitcase, packed',         plural: 'carry-on suitcases, packed',
    emphasis: { singular: 'carry-on suitcase', plural: 'carry-on suitcases' },                                                  category: 'object' },
  { weight: 22,      article: 'a',  singular: 'bowling ball',                      plural: 'bowling balls',                    category: 'object' },
  { weight: 30,      article: 'a',  singular: 'bag of cement',                     plural: 'bags of cement',
    emphasis: { singular: 'bag of cement', plural: 'bags of cement' },                                                          category: 'object' },
  { weight: 35,      article: 'a',  singular: 'microwave oven',                    plural: 'microwave ovens',                  category: 'object' },
  { weight: 45,      article: 'a',  singular: 'Olympic barbell, no plates',        plural: 'Olympic barbells, no plates',
    emphasis: { singular: 'Olympic barbell', plural: 'Olympic barbells' },                                                      category: 'object' },
  { weight: 60,      article: 'a',  singular: 'sack of potatoes',                  plural: 'sacks of potatoes',
    emphasis: { singular: 'sack of potatoes', plural: 'sacks of potatoes' },                                                    category: 'object' },
  { weight: 80,      article: 'a',  singular: 'standard punching bag',             plural: 'standard punching bags',
    emphasis: { singular: 'punching bag', plural: 'punching bags' },                                                            category: 'object' },
  { weight: 110,     article: 'a',  singular: 'side of beef',                      plural: 'sides of beef',
    emphasis: { singular: 'side of beef', plural: 'sides of beef' },                                                            category: 'object' },
  { weight: 150,     article: 'a',  singular: 'standard car tire, mounted',        plural: 'standard car tires, mounted',
    emphasis: { singular: 'car tire', plural: 'car tires' },                                                                    category: 'object' },
  { weight: 175,     article: 'a',  singular: 'full beer keg',                     plural: 'full beer kegs',                   category: 'object' },
  { weight: 250,     article: 'a',  singular: 'vending machine',                   plural: 'vending machines',                 category: 'object' },
  { weight: 320,     article: 'a',  singular: 'claw-foot bathtub, cast iron',      plural: 'claw-foot bathtubs, cast iron',
    emphasis: { singular: 'claw-foot bathtub', plural: 'claw-foot bathtubs' },                                                  category: 'object' },
  { weight: 350,     article: 'an', singular: 'upright pinball machine',           plural: 'upright pinball machines',
    emphasis: { singular: 'pinball machine', plural: 'pinball machines' },                                                      category: 'object' },
  { weight: 450,     article: 'a',  singular: 'standard ATM',                      plural: 'standard ATMs',                    category: 'object' },
  { weight: 600,     article: 'a',  singular: 'home upright piano',                plural: 'home upright pianos',
    emphasis: { singular: 'upright piano', plural: 'upright pianos' },                                                          category: 'object' },
  { weight: 755,     article: 'a',  singular: 'Steinway baby grand',               plural: 'Steinway baby grands',
    emphasis: { singular: 'baby grand', plural: 'baby grands' },                                                                category: 'object' },
  { weight: 1100,    article: 'a',  singular: 'concert grand piano',               plural: 'concert grand pianos',
    emphasis: { singular: 'grand piano', plural: 'grand pianos' },                                                              category: 'object' },
  { weight: 1500,    article: 'a',  singular: 'restaurant walk-in freezer door',   plural: 'restaurant walk-in freezer doors',
    emphasis: { singular: 'freezer door', plural: 'freezer doors' },                                                            category: 'object' },
  { weight: 2000,    article: 'a',  singular: 'cast-iron church bell',             plural: 'cast-iron church bells',
    emphasis: { singular: 'church bell', plural: 'church bells' },                                                              category: 'object' },
  { weight: 3500,    article: 'a',  singular: 'studio upright safe',               plural: 'studio upright safes',
    emphasis: { singular: 'upright safe', plural: 'upright safes' },                                                            category: 'object' },
  { weight: 4500,    article: 'an', singular: 'office copier',                     plural: 'office copiers',                   category: 'object' },
  { weight: 8000,    article: 'a',  singular: 'standard shipping container, empty', plural: 'standard shipping containers, empty',
    emphasis: { singular: 'shipping container', plural: 'shipping containers' },                                                category: 'object' },
  { weight: 12_000,  article: 'a',  singular: 'compact household submarine',       plural: 'compact household submarines',                                                                                         category: 'object' },
  { weight: 22_000,  article: 'a',  singular: 'fully fueled hot-air balloon',      plural: 'fully fueled hot-air balloons',
    emphasis: { singular: 'hot-air balloon', plural: 'hot-air balloons' },                                                      category: 'object' },
  { weight: 60_000,  article: 'a',  singular: 'fully loaded shipping container',   plural: 'fully loaded shipping containers',
    emphasis: { singular: 'shipping container', plural: 'shipping containers' },                                                category: 'object' },
  { weight: 0.3,     article: 'a',  singular: 'TV remote',                         plural: 'TV remotes',                       category: 'object' },
  { weight: 0.6,     article: 'a',  singular: 'can of soup',                       plural: 'cans of soup',
    emphasis: { singular: 'can of soup', plural: 'cans of soup' },                                                              category: 'object' },
  { weight: 1.4,     article: 'a',  singular: 'pair of running shoes',             plural: 'pairs of running shoes',
    emphasis: { singular: 'pair of running shoes', plural: 'pairs of running shoes' },                                          category: 'object' },
  { weight: 7,       article: 'a',  singular: 'standard household toaster',        plural: 'standard household toasters',
    emphasis: { singular: 'toaster', plural: 'toasters' },                                                                      category: 'object' },

  // ── food ─────────────────────────────────────────────────
  { weight: 0.01,    article: 'a',  singular: 'single grape',                      plural: 'grapes',
    emphasis: { singular: 'grape', plural: 'grapes' },                                                                          category: 'food' },
  { weight: 0.05,    article: 'a',  singular: 'strawberry',                        plural: 'strawberries',                     category: 'food' },
  { weight: 0.1,     article: 'a',  singular: 'chicken egg',                       plural: 'chicken eggs',                     category: 'food' },
  { weight: 0.2,     article: 'a',  singular: 'lemon',                             plural: 'lemons',                           category: 'food' },
  { weight: 0.33,    article: 'a',  singular: 'glazed donut',                      plural: 'glazed donuts',                    category: 'food' },
  { weight: 0.4,     article: 'a',  singular: 'standard apple',                    plural: 'standard apples',
    emphasis: { singular: 'apple', plural: 'apples' },                                                                          category: 'food' },
  { weight: 0.55,    article: 'a',  singular: 'single jelly bean',                 plural: 'jelly beans',
    emphasis: { singular: 'jelly bean', plural: 'jelly beans' },                                                                category: 'food' },
  { weight: 0.7,     article: 'a',  singular: 'medium banana',                     plural: 'medium bananas',
    emphasis: { singular: 'banana', plural: 'bananas' },                                                                        category: 'food' },
  { weight: 1.2,     article: 'a',  singular: 'standard McDonald’s Big Mac',       plural: 'McDonald’s Big Macs',
    emphasis: { singular: 'Big Mac', plural: 'Big Macs' },                                                                      category: 'food' },
  { weight: 1.5,     article: 'a',  singular: 'pint of ice cream',                 plural: 'pints of ice cream',
    emphasis: { singular: 'pint of ice cream', plural: 'pints of ice cream' },                                                  category: 'food' },
  { weight: 2,       article: 'a',  singular: 'standard pineapple',                plural: 'standard pineapples',
    emphasis: { singular: 'pineapple', plural: 'pineapples' },                                                                  category: 'food' },
  { weight: 3,       article: 'a',  singular: 'family-size lasagna tray',          plural: 'family-size lasagna trays',
    emphasis: { singular: 'lasagna tray', plural: 'lasagna trays' },                                                            category: 'food' },
  { weight: 5,       article: 'a',  singular: 'Thanksgiving turkey, raw',          plural: 'Thanksgiving turkeys, raw',
    emphasis: { singular: 'Thanksgiving turkey', plural: 'Thanksgiving turkeys' },                                              category: 'food' },
  { weight: 6,       article: 'a',  singular: 'rotisserie chicken',                plural: 'rotisserie chickens',              category: 'food' },
  { weight: 8,       article: 'a',  singular: 'watermelon',                        plural: 'watermelons',                      category: 'food' },
  { weight: 12,      article: 'a',  singular: 'Costco birthday cake',              plural: 'Costco birthday cakes',
    emphasis: { singular: 'birthday cake', plural: 'birthday cakes' },                                                          category: 'food' },
  { weight: 20,      article: 'a',  singular: 'whole Iberian ham, bone-in',        plural: 'whole Iberian hams, bone-in',
    emphasis: { singular: 'Iberian ham', plural: 'Iberian hams' },                                                              category: 'food' },
  { weight: 25,      article: 'a',  singular: 'restaurant barrel of pizza dough',  plural: 'restaurant barrels of pizza dough',
    emphasis: { singular: 'barrel of pizza dough', plural: 'barrels of pizza dough' },                                          category: 'food' },
  { weight: 35,      article: 'a',  singular: 'wheel of cheddar',                  plural: 'wheels of cheddar',
    emphasis: { singular: 'wheel of cheddar', plural: 'wheels of cheddar' },                                                    category: 'food' },
  { weight: 50,      article: 'a',  singular: 'sack of flour',                     plural: 'sacks of flour',
    emphasis: { singular: 'sack of flour', plural: 'sacks of flour' },                                                          category: 'food' },
  { weight: 80,      article: 'a',  singular: 'wheel of parmigiano-reggiano',      plural: 'wheels of parmigiano-reggiano',
    emphasis: { singular: 'wheel of parmigiano', plural: 'wheels of parmigiano' },                                              category: 'food' },
  { weight: 120,     article: 'a',  singular: 'whole sushi-grade bluefin tuna belly', plural: 'whole bluefin tuna bellies',
    emphasis: { singular: 'bluefin tuna belly', plural: 'bluefin tuna bellies' },                                               category: 'food' },
  { weight: 200,     article: 'a',  singular: 'restaurant-size sack of basmati rice', plural: 'restaurant-size sacks of basmati rice',
    emphasis: { singular: 'sack of basmati', plural: 'sacks of basmati' },                                                      category: 'food' },
  { weight: 400,     article: 'a',  singular: 'whole roasted ox, suckling-style',  plural: 'whole roasted oxen, suckling-style',
    emphasis: { singular: 'roasted ox', plural: 'roasted oxen' },                                                               category: 'food' },
  { weight: 600,     article: 'a',  singular: 'industrial deep fryer of oil',      plural: 'industrial deep fryers of oil',
    emphasis: { singular: 'fryer of oil', plural: 'fryers of oil' },                                                            category: 'food' },
  { weight: 1200,    article: 'a',  singular: 'industrial silo of dry pasta',      plural: 'industrial silos of dry pasta',
    emphasis: { singular: 'silo of dry pasta', plural: 'silos of dry pasta' },                                                  category: 'food' },
  { weight: 2700,    article: 'the', singular: 'largest pumpkin ever weighed at the NY State Fair',
    plural: 'NY-State-Fair-grade prize pumpkins',
    emphasis: { singular: 'pumpkin', plural: 'prize pumpkins' },                                                                category: 'food' },
  { weight: 4400,    article: 'the', singular: 'largest wheel of cheese ever made',
    plural: 'world-record-class cheese wheels',
    emphasis: { singular: 'wheel of cheese', plural: 'cheese wheels' },                                                         category: 'food' },
  { weight: 12_000,  article: 'the', singular: 'largest birthday cake ever baked',
    plural: 'world-record-class birthday cakes',
    emphasis: { singular: 'birthday cake', plural: 'birthday cakes' },                                                          category: 'food' },
  { weight: 28_000,  article: 'the', singular: 'largest pizza ever made (Italy, 1990)',
    plural: 'world-record-class pizzas',
    emphasis: { singular: 'pizza', plural: 'pizzas' },                                                                          category: 'food' },

  // ── historical ───────────────────────────────────────────
  { weight: 2,       article: 'a',  singular: 'Roman gladius sword',               plural: 'Roman gladius swords',             category: 'historical' },
  { weight: 8,       article: 'a',  singular: 'medieval longbow',                  plural: 'medieval longbows',                category: 'historical' },
  { weight: 24,      article: 'a',  singular: "knight's plate harness, c. 1450",   plural: "knight's plate harnesses, c. 1450",
    emphasis: { singular: 'plate harness', plural: 'plate harnesses' },                                                         category: 'historical' },
  { weight: 60,      article: 'a',  singular: 'cannonball from a 12-pounder',      plural: 'cannonballs from a 12-pounder',
    emphasis: { singular: 'cannonball', plural: 'cannonballs' },                                                                category: 'historical' },
  { weight: 100,     article: 'a',  singular: 'Roman legionary kit, fully packed', plural: 'Roman legionary kits, fully packed',
    emphasis: { singular: 'legionary kit', plural: 'legionary kits' },                                                          category: 'historical' },
  { weight: 200,     article: 'a',  singular: 'medieval anvil',                    plural: 'medieval anvils',                  category: 'historical' },
  { weight: 450,     article: 'a',  singular: 'standard medieval longsword fencer’s kit',
    plural: 'medieval longsword fencer’s kits',
    emphasis: { singular: 'fencer’s kit', plural: 'fencer’s kits' },                                                            category: 'historical' },
  { weight: 800,     article: 'a',  singular: 'Viking longship oar bench',         plural: 'Viking longship oar benches',
    emphasis: { singular: 'longship oar bench', plural: 'longship oar benches' },                                               category: 'historical' },
  { weight: 1200,    article: 'a',  singular: 'medieval blacksmith’s anvil',       plural: 'medieval blacksmith’s anvils',
    emphasis: { singular: 'blacksmith’s anvil', plural: 'blacksmith’s anvils' },                                                category: 'historical' },
  { weight: 2080,    article: 'the', singular: 'Liberty Bell',                     plural: 'Liberty Bells',                    category: 'historical' },
  { weight: 3000,    article: 'a',  singular: 'sandstone block from the Great Pyramid', plural: 'sandstone blocks from the Great Pyramid',
    emphasis: { singular: 'block from the Great Pyramid', plural: 'blocks from the Great Pyramid' },                            category: 'historical' },
  { weight: 4500,    article: 'a',  singular: 'Roman triumphal arch keystone',     plural: 'Roman triumphal arch keystones',
    emphasis: { singular: 'arch keystone', plural: 'arch keystones' },                                                          category: 'historical' },
  { weight: 5500,    article: 'a',  singular: 'stone moai head from Easter Island', plural: 'stone moai heads from Easter Island',
    emphasis: { singular: 'moai head', plural: 'moai heads' },                                                                  category: 'historical' },
  { weight: 8000,    article: 'a',  singular: '24-pounder cannon from Old Ironsides', plural: '24-pounder cannons from Old Ironsides',
    emphasis: { singular: '24-pounder cannon', plural: '24-pounder cannons' },                                                  category: 'historical' },
  { weight: 13_000,  article: 'a',  singular: 'medieval trebuchet counterweight',  plural: 'medieval trebuchet counterweights',
    emphasis: { singular: 'trebuchet counterweight', plural: 'trebuchet counterweights' },                                      category: 'historical' },
  { weight: 18_000,  article: 'a',  singular: 'Roman ballista, fully assembled',   plural: 'Roman ballistae, fully assembled',
    emphasis: { singular: 'Roman ballista', plural: 'Roman ballistae' },                                                        category: 'historical' },
  { weight: 31_000,  article: 'the', singular: 'bell of Notre-Dame',               plural: 'bells of Notre-Dame',
    emphasis: { singular: 'bell of Notre-Dame', plural: 'bells of Notre-Dame' },                                                category: 'historical' },
  { weight: 50_000,  article: 'a',  singular: 'megalith from Stonehenge',          plural: 'megaliths from Stonehenge',                                                                                            category: 'historical' },
  { weight: 88_000,  article: 'a',  singular: 'Roman quadriga chariot, full kit',  plural: 'Roman quadriga chariots, full kit',
    emphasis: { singular: 'quadriga chariot', plural: 'quadriga chariots' },                                                    category: 'historical' },
  { weight: 200_000, article: 'the', singular: 'limestone capstone of the Great Pyramid',
    plural: 'limestone capstones of the Great Pyramid',
    emphasis: { singular: 'capstone of the Great Pyramid', plural: 'capstones of the Great Pyramid' },                          category: 'historical' },
  { weight: 450_000, article: 'the', singular: 'Statue of Liberty’s copper skin',  plural: 'Statue of Liberty’s copper skins',
    emphasis: { singular: 'Statue of Liberty’s copper skin', plural: 'Statue of Liberty’s copper skins' },                      category: 'historical' },
  { weight: 12_000_000, article: 'the', singular: 'wrought-iron mass of the Eiffel Tower',
    plural: 'wrought-iron masses of Eiffel Towers',
    emphasis: { singular: 'Eiffel Tower', plural: 'Eiffel Towers' },                                                            category: 'historical' },

  // ── mundane ──────────────────────────────────────────────
  { weight: 0.04,    article: 'a',  singular: 'standard #2 pencil',                plural: 'standard #2 pencils',
    emphasis: { singular: 'pencil', plural: 'pencils' },                                                                        category: 'mundane' },
  { weight: 0.07,    article: 'a',  singular: 'pat of butter',                     plural: 'pats of butter',
    emphasis: { singular: 'pat of butter', plural: 'pats of butter' },                                                          category: 'mundane' },
  { weight: 0.2,     article: 'a',  singular: 'pair of glasses',                   plural: 'pairs of glasses',
    emphasis: { singular: 'pair of glasses', plural: 'pairs of glasses' },                                                      category: 'mundane' },
  { weight: 0.3,     article: 'a',  singular: 'baseball',                          plural: 'baseballs',                        category: 'mundane' },
  { weight: 0.6,     article: 'a',  singular: 'tube of toothpaste',                plural: 'tubes of toothpaste',
    emphasis: { singular: 'tube of toothpaste', plural: 'tubes of toothpaste' },                                                category: 'mundane' },
  { weight: 0.9,     article: 'a',  singular: 'full mug of coffee',                plural: 'full mugs of coffee',
    emphasis: { singular: 'mug of coffee', plural: 'mugs of coffee' },                                                          category: 'mundane' },
  { weight: 1.2,     article: 'a',  singular: 'pair of leather work boots',        plural: 'pairs of leather work boots',                                                                                          category: 'mundane' },
  { weight: 2,       article: 'a',  singular: 'gallon of milk, full',              plural: 'gallons of milk, full',
    emphasis: { singular: 'gallon of milk', plural: 'gallons of milk' },                                                        category: 'mundane' },
  { weight: 3,       article: 'a',  singular: 'laptop',                            plural: 'laptops',                          category: 'mundane' },
  { weight: 4,       article: 'a',  singular: 'household vacuum cleaner',          plural: 'household vacuum cleaners',
    emphasis: { singular: 'vacuum cleaner', plural: 'vacuum cleaners' },                                                        category: 'mundane' },
  { weight: 6,       article: 'a',  singular: 'standard fire hose, dry',           plural: 'standard fire hoses, dry',
    emphasis: { singular: 'fire hose', plural: 'fire hoses' },                                                                  category: 'mundane' },
  { weight: 8,       article: 'a',  singular: 'gallon of paint, sealed',           plural: 'gallons of paint, sealed',
    emphasis: { singular: 'gallon of paint', plural: 'gallons of paint' },                                                      category: 'mundane' },
  { weight: 10,      article: 'a',  singular: 'family-size bag of dry dog food',   plural: 'family-size bags of dry dog food',
    emphasis: { singular: 'bag of dry dog food', plural: 'bags of dry dog food' },                                              category: 'mundane' },
  { weight: 14,      article: 'a',  singular: 'desktop printer',                   plural: 'desktop printers',                 category: 'mundane' },
  { weight: 18,      article: 'a',  singular: 'carry-on suitcase, packed',         plural: 'carry-on suitcases, packed',
    emphasis: { singular: 'carry-on suitcase', plural: 'carry-on suitcases' },                                                  category: 'mundane' },
  { weight: 22,      article: 'a',  singular: 'bowling ball',                      plural: 'bowling balls',                    category: 'mundane' },
  { weight: 30,      article: 'a',  singular: 'standard household toolbox, packed', plural: 'household toolboxes, packed',
    emphasis: { singular: 'toolbox', plural: 'toolboxes' },                                                                     category: 'mundane' },
  { weight: 35,      article: 'a',  singular: 'toddler',                           plural: 'toddlers',                         category: 'mundane' },
  { weight: 45,      article: 'a',  singular: 'mid-size dog crate, with dog',      plural: 'mid-size dog crates, with dog',
    emphasis: { singular: 'dog crate', plural: 'dog crates' },                                                                  category: 'mundane' },
  { weight: 50,      article: 'a',  singular: '5-gallon water cooler jug',         plural: '5-gallon water cooler jugs',
    emphasis: { singular: 'water cooler jug', plural: 'water cooler jugs' },                                                    category: 'mundane' },
  { weight: 60,      article: 'a',  singular: 'standard office chair, fully assembled',
    plural: 'standard office chairs, fully assembled',
    emphasis: { singular: 'office chair', plural: 'office chairs' },                                                            category: 'mundane' },
  { weight: 75,      article: 'a',  singular: 'household refrigerator door',       plural: 'household refrigerator doors',
    emphasis: { singular: 'refrigerator door', plural: 'refrigerator doors' },                                                  category: 'mundane' },
  { weight: 90,      article: 'a',  singular: 'large window AC unit',              plural: 'large window AC units',
    emphasis: { singular: 'window AC unit', plural: 'window AC units' },                                                        category: 'mundane' },
  { weight: 100,     article: 'a',  singular: 'standard household washing machine, empty',
    plural: 'standard washing machines, empty',
    emphasis: { singular: 'washing machine', plural: 'washing machines' },                                                      category: 'mundane' },
  { weight: 130,     article: 'a',  singular: 'home upright treadmill',            plural: 'home upright treadmills',
    emphasis: { singular: 'treadmill', plural: 'treadmills' },                                                                  category: 'mundane' },
  { weight: 150,     article: 'an', singular: 'average adult human',               plural: 'average adult humans',
    emphasis: { singular: 'adult human', plural: 'adult humans' },                                                              category: 'mundane' },
  { weight: 180,     article: 'a',  singular: 'household 2-seater sofa',           plural: 'household 2-seater sofas',
    emphasis: { singular: '2-seater sofa', plural: '2-seater sofas' },                                                          category: 'mundane' },
  { weight: 220,     article: 'a',  singular: 'queen-size mattress',               plural: 'queen-size mattresses',                                                                                                category: 'mundane' },
  { weight: 300,     article: 'a',  singular: 'household 3-seater sofa',           plural: 'household 3-seater sofas',
    emphasis: { singular: '3-seater sofa', plural: '3-seater sofas' },                                                          category: 'mundane' },
  { weight: 400,     article: 'a',  singular: 'small upright freezer, full',       plural: 'small upright freezers, full',
    emphasis: { singular: 'upright freezer', plural: 'upright freezers' },                                                      category: 'mundane' },
  { weight: 500,     article: 'a',  singular: 'cast-iron bathtub, vintage',        plural: 'cast-iron bathtubs, vintage',
    emphasis: { singular: 'cast-iron bathtub', plural: 'cast-iron bathtubs' },                                                  category: 'mundane' },
  { weight: 800,     article: 'a',  singular: 'standard front-loading washer-dryer pair',
    plural: 'standard washer-dryer pairs',
    emphasis: { singular: 'washer-dryer pair', plural: 'washer-dryer pairs' },                                                  category: 'mundane' },
  { weight: 1100,    article: 'a',  singular: 'home gun safe, fully loaded',
    plural: 'home gun safes, fully loaded',
    emphasis: { singular: 'home gun safe', plural: 'home gun safes' },                                                          category: 'mundane' },
  { weight: 1500,    article: 'a',  singular: 'standard hot tub, dry',             plural: 'standard hot tubs, dry',
    emphasis: { singular: 'hot tub', plural: 'hot tubs' },                                                                      category: 'mundane' },
  { weight: 2400,    article: 'a',  singular: 'compact car, curb weight',          plural: 'compact cars, curb weight',
    emphasis: { singular: 'compact car', plural: 'compact cars' },                                                              category: 'mundane' },
  { weight: 5000,    article: 'a',  singular: 'fully loaded U-Haul cargo trailer', plural: 'fully loaded U-Haul cargo trailers',
    emphasis: { singular: 'U-Haul cargo trailer', plural: 'U-Haul cargo trailers' },                                            category: 'mundane' },
  { weight: 12_000,  article: 'a',  singular: 'tiny home, fully built',            plural: 'tiny homes, fully built',
    emphasis: { singular: 'tiny home', plural: 'tiny homes' },                                                                  category: 'mundane' },
  { weight: 30_000,  article: 'a',  singular: 'two-bedroom house, gutted',         plural: 'two-bedroom houses, gutted',
    emphasis: { singular: 'two-bedroom house', plural: 'two-bedroom houses' },                                                  category: 'mundane' },
  { weight: 80_000,  article: 'a',  singular: 'standard suburban house, structure only',
    plural: 'standard suburban houses, structure only',
    emphasis: { singular: 'suburban house', plural: 'suburban houses' },                                                        category: 'mundane' },
];

/**
 * Build the renderer tokens for a (count, reference) pair.
 *
 * The split is deterministic per case:
 *
 *   count ≈ 1     →  lead "≈ {article}",                italic emphasis,  trail = remainder of singular
 *   count < 1     →  lead "≈ {pct}% of {article}",      italic emphasis,  trail = remainder of singular
 *   count whole   →  lead "≈ {n}",                      italic emphasis,  trail = remainder of plural
 *   count decimal →  lead "≈ {n.toFixed(1)}",           italic emphasis,  trail = remainder of plural
 *
 * Emphasis defaults to the whole noun phrase. If the entry sets an
 * explicit `emphasis`, the renderer italicizes only that substring and
 * the rest of the phrase ends up in `trail` (which keeps the upright
 * uppercase treatment).
 */
export function formatComparison(count: number, ref: FactReference): ComparisonTokens {
  // count ≈ 1 — singular form, with article
  if (count >= 0.9 && count <= 1.1) {
    const split = splitEmphasis(ref.singular, ref.emphasis?.singular);
    return {
      lead: composeLead(ref.article, split.prefix),
      italic: split.italic,
      trail: split.trail,
    };
  }

  // count < 1 — "% of a/an X" — still singular form
  if (count < 1) {
    const pct = Math.round(count * 100);
    const split = splitEmphasis(ref.singular, ref.emphasis?.singular);
    return {
      lead: composeLead(`${pct}% of ${ref.article}`, split.prefix),
      italic: split.italic,
      trail: split.trail,
    };
  }

  // count >= 1.1 — plural form, with a number prefix
  const rounded = Math.round(count);
  const isWhole = Math.abs(count - rounded) < 0.15;
  const n = isWhole ? rounded.toString() : count.toFixed(1);
  const split = splitEmphasis(ref.plural, ref.emphasis?.plural);
  return {
    lead: composeLead(n, split.prefix),
    italic: split.italic,
    trail: split.trail,
  };
}

/**
 * Split a noun phrase into prefix + italic + trail. If the caller
 * passed an `emphasis` substring that's found in `full`, only that
 * substring is the italic; anything before the substring becomes the
 * `prefix` (and is later concatenated into the lead by the caller),
 * and anything after becomes the `trail`. If no emphasis is given (or
 * it can't be located in `full`), the whole phrase is the italic.
 *
 * `prefix` and `trail` are omitted (rather than empty strings) when
 * nothing is there — keeps the rendered JSX free of empty text nodes.
 */
function splitEmphasis(full: string, emphasis: string | undefined):
  { prefix?: string; italic: string; trail?: string } {
  if (!emphasis) return { italic: full };
  const idx = full.indexOf(emphasis);
  if (idx < 0) return { italic: full };
  const prefix = full.slice(0, idx);
  const trail = full.slice(idx + emphasis.length);
  return {
    prefix: prefix.length > 0 ? prefix : undefined,
    italic: emphasis,
    trail: trail.length > 0 ? trail : undefined,
  };
}

/**
 * Glue the count/article portion (e.g. "≈ a", "≈ 7") to any text
 * that lived *before* the emphasis in the source noun phrase. The
 * prefix carries its source whitespace; we trim it so the join is
 * a single space.
 */
function composeLead(numPart: string, prefix: string | undefined): string {
  if (!prefix) return numPart;
  return `${numPart} ${prefix.trim()}`;
}

/**
 * Pick the best-fitting reference for a given total weight.
 *
 * "Best fit" = the reference whose weight, divided by the user's total,
 * gives a count between 0.5 and 50. Among survivors, the scorer prefers
 * counts close to whole numbers and penalizes large counts (a Civic
 * reads better than 47 of something).
 *
 * Category exclusion lets the caller suppress recently-shown categories.
 */
export function pickFact(
  totalWeight: number,
  excludeCategories: FactCategory[] = []
): FunFact | null {
  if (totalWeight <= 0) return null;
  const exclude = new Set(excludeCategories);

  const candidates = FACT_REFERENCES
    .filter((r) => !exclude.has(r.category))
    .map((r) => ({ r, count: totalWeight / r.weight }))
    .filter(({ count }) => count >= 0.5 && count <= 50);

  if (candidates.length === 0) return null;

  const scored = candidates.map(({ r, count }) => {
    const rounded = Math.round(count);
    const distFromRound = Math.abs(count - rounded);
    const sizePenalty = Math.log10(Math.max(count, 1)) * 0.5;
    return { r, count, score: distFromRound + sizePenalty };
  });
  scored.sort((a, b) => a.score - b.score);

  const best = scored[0];
  return {
    tokens: formatComparison(best.count, best.r),
    category: best.r.category,
    referenceWeight: best.r.weight,
  };
}

/**
 * Pick a *random* viable reference. Same eligibility window as `pickFact`
 * ([0.5×, 50×]), but instead of scoring and taking the best, we sample
 * uniformly from the survivors. Used by the dev fresh-fact toggle so
 * refreshes produce genuine variety — `pickFact`'s deterministic scorer
 * converges to a stable cycle when called repeatedly with a small
 * recent-categories window, so the dev path needs real randomness.
 */
export function pickRandomFact(
  totalWeight: number,
  excludeCategories: FactCategory[] = []
): FunFact | null {
  if (totalWeight <= 0) return null;
  const exclude = new Set(excludeCategories);

  const candidates = FACT_REFERENCES
    .filter((r) => !exclude.has(r.category))
    .map((r) => ({ r, count: totalWeight / r.weight }))
    .filter(({ count }) => count >= 0.5 && count <= 50);

  if (candidates.length === 0) return null;

  const pick = candidates[Math.floor(Math.random() * candidates.length)];
  return {
    tokens: formatComparison(pick.count, pick.r),
    category: pick.r.category,
    referenceWeight: pick.r.weight,
  };
}

/**
 * Stateful wrapper: pick a fact while remembering the last few categories
 * shown, so consecutive opens give variety. Stable-fact caching lives at
 * a higher layer (see `useStableFact`) — this function only tracks
 * category rotation. The pool is large enough now that within-category
 * repetition is rare even without further variety controls; the
 * category-exclusion list is here mostly to prevent a "five elephants in
 * a row" streak across consecutive picks.
 */
const RECENT_CATEGORIES_KEY = 'massed:recent-fact-categories';
const RECENT_LIMIT = 3;

function readRecent(): FactCategory[] {
  try {
    const raw = localStorage.getItem(RECENT_CATEGORIES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeRecent(cats: FactCategory[]) {
  try {
    localStorage.setItem(RECENT_CATEGORIES_KEY, JSON.stringify(cats));
  } catch {
    /* storage may be unavailable; degrade silently */
  }
}

export function nextFact(totalWeight: number): FunFact | null {
  const recent = readRecent();
  let fact = pickFact(totalWeight, recent);
  // If the exclusion emptied the pool, retry without it — better to
  // repeat a category than show no fact.
  if (!fact) fact = pickFact(totalWeight, []);
  if (fact) {
    const next = [fact.category, ...recent].slice(0, RECENT_LIMIT);
    writeRecent(next);
  }
  return fact;
}

/**
 * Random variant of `nextFact` for the dev fresh-fact path. Skips the
 * category-rotation memory — randomness already supplies variety, and
 * the rotation state was the thing pulling us into a deterministic
 * cycle in the first place.
 */
export function nextRandomFact(totalWeight: number): FunFact | null {
  return pickRandomFact(totalWeight, []);
}
