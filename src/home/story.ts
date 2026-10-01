/** Five beats tell the project story before the visitor enters the world. */
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

export const OPENING_HOOK = "A programmable, salt-adapted platform for rewiring carotenoid metabolism.";

export const STORY_BEATS: readonly StoryBeat[] = [
  {
    phase: "BACKGROUND",
    chapter: "01 · BACKGROUND & CHALLENGE",
    speaker: "Field guide",
    speakerTone: "#cdf558",
    text: "Terpenoids colour foods, support nutrition and supply high-value ingredients. Plant extraction can be slow and variable, chemical synthesis can carry a heavy environmental cost, and conventional microbial production often depends on sterile freshwater processes.",
    visual: "resources",
    shot: { u: 0.12, x: -52, y: -26 },
  },
  {
    phase: "DESIGN",
    chapter: "02 · BIOLOGICAL DESIGN",
    speaker: "Dr. Lin · algal biologist",
    speakerTone: "#cdf558",
    text: "Dunaliella salina grows in seawater and hypersaline media, tolerates conditions that suppress many contaminants, fixes carbon with light, and already carries a complete MEP-to-carotenoid route. That makes it a practical chassis rather than only another product source.",
    visual: "traits",
    shot: { u: 0.36, x: 24, y: -26 },
  },
  {
    phase: "ROUTES",
    chapter: "03 · METABOLIC REPROGRAMMING",
    speaker: "Mara · pathway engineer",
    speakerTone: "#f7a52d",
    text: "Our core design introduces the project-selected transcription factor 2146 to reprogramme pathway regulation and redirect metabolic flux toward competitive β-carotene synthesis. The β-carotene pool becomes a controllable hub for the platform.",
    visual: "products",
    shot: { u: 0.62, x: -18, y: -28 },
  },
  {
    phase: "PROCESS",
    chapter: "04 · PLATFORM DESIGN & VALIDATION",
    speaker: "Ari · community researcher",
    speakerTone: "#c4a8ff",
    text: "Modeling links transcriptional control to pathway flux. Four downstream designs—astaxanthin, β-ionone, crocetin and β-citraurin—then test how the same reprogrammable chassis can support distinct high-value products.",
    visual: "characterisation",
    shot: { u: 0.84, x: 28, y: -26 },
  },
  {
    phase: "JOURNEY",
    chapter: "05 · YOUR JOURNEY",
    speaker: "Field guide",
    speakerTone: "#cdf558",
    text: "Step onto the Salt Route to revisit the project as a place, or leave the boardwalk to meet three optional field guides. The complete Wet Lab, Dry Lab, Human Practices and People chapters remain in the navigation above.",
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
