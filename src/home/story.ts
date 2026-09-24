/** Narrative only: edit copy and shot coordinates without changing input or movement. */
export type StoryPhase = "OPENING" | "PROBLEM" | "DUNALIELLA" | "SOLUTION" | "HP" | "TRANSITION" | "WORLD";
export type StoryVisual = "needs" | "resources" | "alga" | "traits" | "hub" | "products" | "voices" | "decisions" | "journey";
export type StoryBeat = {
  phase: Exclude<StoryPhase, "OPENING" | "TRANSITION" | "WORLD">;
  chapter: string;
  speaker: string;
  text: string;
  visual: StoryVisual;
  /** Position on the existing route plus a small camera offset in world pixels. */
  shot: { u: number; x: number; y: number };
  voice?: number;
};
export const OPENING_HOOK = "In hypersaline deserts where life surrenders, a tiny alga thrives by turning harsh light and salt into golden survival.";
const shore = { u: 0.085, x: -65, y: -30 };
const cell = { u: 0.245, x: 20, y: -28 };
export const STORY_BEATS: readonly StoryBeat[] = [
  { phase: "PROBLEM", chapter: "01 · THE PAIN POINT", speaker: "Field guide", text: "From vivid food colours to essential nutrients, high-value terpenoids shape our daily lives.", visual: "needs", shot: shore },
  { phase: "PROBLEM", chapter: "01 · THE PAIN POINT", speaker: "Field guide", text: "Yet, getting them comes at a price: over-harvesting fragile crops, or relying on chemical synthesis with heavy environmental footprints.", visual: "resources", shot: shore },
  { phase: "PROBLEM", chapter: "01 · THE PAIN POINT", speaker: "Field guide", text: "Traditional microbial factories (like yeast or E. coli) could help, but they demand sterile freshwater and expensive energy—resources our planet can ill afford.", visual: "resources", shot: shore },
  { phase: "DUNALIELLA", chapter: "02 · WHY DUNALIELLA?", speaker: "Field guide", text: "What if the solution lies in extreme nature? Meet Dunaliella salina—nature’s ultimate survivor.", visual: "alga", shot: cell },
  { phase: "DUNALIELLA", chapter: "02 · WHY DUNALIELLA?", speaker: "Field guide", text: "We asked ourselves: why settle for one compound when nature gave us a goldmine?", visual: "traits", shot: cell },
  { phase: "DUNALIELLA", chapter: "02 · WHY DUNALIELLA?", speaker: "Field guide", text: "It doesn't need arable land or precious fresh water. It thrives in open, hyper-saline ponds where contamination dies, driven purely by sunlight and CO₂.", visual: "traits", shot: cell },
  { phase: "DUNALIELLA", chapter: "02 · WHY DUNALIELLA?", speaker: "Field guide", text: "Even better: it already naturally accumulates massive amounts of β-carotene inside its cells.", visual: "traits", shot: cell },
  { phase: "SOLUTION", chapter: "03 · OUR IDEA", speaker: "Researcher", text: "But nature only programmed D. salina for its own survival. What if we could reprogram its metabolic engine?", visual: "hub", shot: cell },
  { phase: "SOLUTION", chapter: "03 · OUR IDEA", speaker: "Researcher", text: "By engineering a shared β-Carotene Hub, we redirect this rich precursor pool to synthesize a spectrum of high-value compounds—like Astaxanthin, β-Ionone, and Crocetins.", visual: "products", shot: cell },
  { phase: "SOLUTION", chapter: "03 · OUR IDEA", speaker: "Researcher", text: "DunaTerp is born: turning a single extremophile into a versatile, sustainable photosynthetic chassis.", visual: "products", shot: cell },
  { phase: "HP", chapter: "04 · QUESTIONS BECOME DESIGN", speaker: "Field guide", text: "Bringing a lab breakthrough into the real world requires answering tough questions from industry, consumers, and regulators.", visual: "voices", shot: shore },
  { phase: "HP", chapter: "04 · QUESTIONS BECOME DESIGN", speaker: "Field guide", text: "How do we ensure food safety? How do we prevent escape? These questions directly shaped our biological design—incorporating biocontainment and food-grade selection tools.", visual: "decisions", shot: shore },
  { phase: "HP", chapter: "05 · YOUR JOURNEY", speaker: "Field guide", text: "Welcome to the DunaTerp Project. Step onto the Salt Route, explore our genetic designs, human practice insights, and dry-lab models—or wander freely!", visual: "journey", shot: shore },
];

export type StoryState = { phase: StoryPhase; beat: number };
export type StoryEvent = "NEXT" | "SKIP" | "ARRIVED" | "REPLAY";
export function initialStory(seen: boolean): StoryState { return { phase: seen ? "WORLD" : "OPENING", beat: -1 }; }
export function storyReducer(state: StoryState, event: StoryEvent): StoryState {
  if (event === "REPLAY" && state.phase === "WORLD") return initialStory(false);
  if (event === "ARRIVED") return state.phase === "TRANSITION" ? { ...state, phase: "WORLD" } : state;
  if (state.phase === "WORLD" || state.phase === "TRANSITION") return state;
  if (event === "SKIP") return { ...state, phase: "TRANSITION" };
  if (event !== "NEXT") return state;
  const beat = state.beat + 1;
  return beat >= STORY_BEATS.length ? { ...state, phase: "TRANSITION" } : { beat, phase: STORY_BEATS[beat].phase };
}
