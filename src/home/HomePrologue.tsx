import { useEffect, useRef, useState } from "react";
import { OPENING_HOOK, STORY_BEATS, type StoryState } from "./story";
import { StoryDialogue } from "./StoryDialogue";
import { StoryIllustration } from "./StoryIllustration";
import "./prologue.css";
export function HomePrologue({ state, onNext, onSkip }: { state: StoryState; onNext: () => void; onSkip: () => void }) {
  const host = useRef<HTMLElement>(null);
  const audio = useRef<AudioContext | null>(null);
  const [soundOn, setSoundOn] = useState(true);
  const opening = state.phase === "OPENING";
  const transition = state.phase === "TRANSITION";
  const beat = STORY_BEATS[state.beat];
  useEffect(() => {
    if (transition) host.current?.focus({ preventScroll: true });
  }, [transition]);
  useEffect(() => () => { void audio.current?.close(); }, []);

  const advance = () => {
    if (soundOn && typeof window.AudioContext === "function") {
      const context = audio.current ?? new window.AudioContext();
      audio.current = context;
      if (context.state === "suspended") void context.resume();

      // A single bright, 10 ms key click on user-initiated chapter changes—never a loop.
      const length = Math.ceil(context.sampleRate * 0.01);
      const buffer = context.createBuffer(1, length, context.sampleRate);
      const samples = buffer.getChannelData(0);
      for (let i = 0; i < length; i += 1) {
        const envelope = 1 - i / length;
        samples[i] = (Math.random() * 2 - 1) * envelope * envelope;
      }
      const source = context.createBufferSource();
      const highPass = context.createBiquadFilter();
      const lowPass = context.createBiquadFilter();
      const volume = context.createGain();
      source.buffer = buffer;
      highPass.type = "highpass";
      highPass.frequency.value = 750;
      lowPass.type = "lowpass";
      lowPass.frequency.value = 6200;
      volume.gain.value = 0.13;
      source.connect(highPass).connect(lowPass).connect(volume).connect(context.destination);
      source.start();
    }
    onNext();
  };

  return <section ref={host} tabIndex={-1} className={`home-prologue${opening ? " is-opening" : ""}${transition ? " is-transition" : ""}`} data-story-state={state.phase} aria-label="DunaTerp story prologue"
    onKeyDown={(event) => {
      if (event.key === "Tab") {
        const buttons = [...(host.current?.querySelectorAll<HTMLButtonElement>("button:not(:disabled)") ?? [])];
        const first = buttons[0], last = buttons[buttons.length - 1];
        if (!first) { event.preventDefault(); return; }
        if (event.shiftKey && (document.activeElement === first || document.activeElement === host.current)) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
      if ((event.key === "Enter" || event.key === " ") && event.target === host.current) {
        event.preventDefault();
        if (!transition && !event.repeat) host.current?.querySelector<HTMLButtonElement>(".story-dialogue-button")?.click();
      }
    }}>
    {!transition && <>
      <button type="button" className="story-sound-toggle" onClick={() => setSoundOn((enabled) => !enabled)} aria-pressed={soundOn} aria-label={soundOn ? "Mute intro sound effects" : "Enable intro sound effects"}>{soundOn ? "SOUND ON" : "SOUND OFF"}</button>
      <button type="button" className="story-skip" onClick={onSkip}>SKIP INTRO <span aria-hidden="true">↗</span></button>
    </>}
    {transition ? null : opening ? <>
      <div className="story-title"><h1>DUNA<span>TERP</span></h1></div>
      <StoryDialogue key="opening" opening speaker="A story from the salt lake" text={OPENING_HOOK} label="PRESS ENTER TO BEGIN" delay={700} onNext={advance} />
    </> : <>
      <header className="story-chapter"><h1>{beat.chapter}</h1></header>
      <div key={`art-${state.beat}`} className="story-scene-art"><StoryIllustration beat={beat} /></div>
      <div className="story-dialogue-cluster">
        <StoryDialogue key={state.beat} speaker={beat.speaker} speakerTone={beat.speakerTone} text={beat.text} label={state.beat === STORY_BEATS.length - 1 ? "START THE SALT ROUTE" : "Continue"} onNext={advance} />
        <div className="story-progress" aria-label={`Story ${state.beat + 1} of ${STORY_BEATS.length}`}>{STORY_BEATS.map((_, i) => <i key={i} className={i <= state.beat ? "is-complete" : ""} />)}</div>
      </div>
    </>}
  </section>;
}
