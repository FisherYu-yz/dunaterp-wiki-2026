/** Three short beats introduce the project before the visitor enters the world. */
export type StoryPhase = "OPENING" | "BACKGROUND" | "DESIGN" | "ROUTES" | "PROCESS" | "JOURNEY" | "TRANSITION" | "WORLD";
export type StoryVisual = "resources" | "traits" | "products" | "characterisation" | "journey";

export type StoryBeat = {
  phase: Exclude<StoryPhase, "OPENING" | "TRANSITION" | "WORLD">;
  chapter: string;
  speaker: string;
  speakerTone: string;
  text: string;
  visual: StoryVisual;
  /** Position on the existing route plus a small camera offset in world pixels. */
  shot: { u: number; x: number; y: number };
};

export const OPENING_HOOK = "A salt-lake alga. A carotenoid pathway ready to explore.";

export const STORY_BEATS: readonly StoryBeat[] = [
  {
    phase: "DESIGN",
    chapter: "01  Salt-adapted chassis",
    speaker: "Dr. Lin · algal biologist",
    speakerTone: "#cdf558",
    text: "Plant extraction is slow, while many microbial processes rely on sterile freshwater. Dunaliella salina grows in hypersaline ponds and already carries the carotenoid pathway we want to explore.",
    visual: "traits",
    shot: { u: 0.36, x: 24, y: -26 },
  },
  {
    phase: "ROUTES",
    chapter: "02  Metabolic Reprogramming",
    speaker: "Mara · pathway engineer",
    speakerTone: "#f7a52d",
    text: "Our transcription-factor design is the regulatory input. It explores redirecting carotenoid flux toward β-carotene, then opening four downstream product routes.",
    visual: "products",
    shot: { u: 0.62, x: -18, y: -28 },
  },
  {
    phase: "PROCESS",
    chapter: "03  Follow the route",
    speaker: "Field guide",
    speakerTone: "#cdf558",
    text: "Follow the boardwalk and press E when you reach a station. Want to wander? Step off the path and say hello to the field guides.",
    visual: "journey",
    shot: { u: 0.04, x: 0, y: -18 },
  },
];

export type StoryState = { phase: StoryPhase; beat: number };
export type StoryEvent = "NEXT" | "SKIP" | "ARRIVED" | "REPLAY";

export function initialStory(seen: boolean): StoryState {
  return { phase: seen ? "WORLD" : "OPENING", beat: -1 };
}

export function storyReducer(state: StoryState, event: StoryEvent): StoryState {
  if (event === "REPLAY" && state.phase === "WORLD") return initialStory(false);
  if (event === "ARRIVED") return state.phase === "TRANSITION" ? { ...state, phase: "WORLD" } : state;
  if (state.phase === "WORLD" || state.phase === "TRANSITION") return state;
  if (event === "SKIP") return { ...state, phase: "WORLD" };
  if (event !== "NEXT") return state;
  const beat = state.beat + 1;
  return beat >= STORY_BEATS.length ? { ...state, phase: "WORLD" } : { beat, phase: STORY_BEATS[beat].phase };
}
