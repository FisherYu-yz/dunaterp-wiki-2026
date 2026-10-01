import { useEffect, useRef, type CSSProperties } from "react";
import { StoryGlyph } from "./StoryGlyph";
export function StoryDialogue({ text, speaker, speakerTone = "#cdf558", label = "Continue", delay = 0, onNext, opening = false }: {
  text: string; speaker: string; speakerTone?: string; label?: string; delay?: number; onNext: () => void; opening?: boolean;
}) {
  const next = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    next.current?.focus({ preventScroll: true });
  }, [text, delay, opening]);
  const parts = text.split(/(\s+)/);
  const stableText = parts.map((part, partIndex) => {
    const start = parts.slice(0, partIndex).join("").length;
    if (/^\s+$/.test(part)) return <span key={`space-${partIndex}`}>{part}</span>;
    return <span className="story-word" key={`word-${partIndex}`}>
      {Array.from(part).map((character, characterIndex) => {
        const index = start + characterIndex;
        return <span className="story-char is-visible" key={index}>
          {character}
        </span>;
      })}
    </span>;
  });
  return <div className={`story-dialogue${opening ? " story-dialogue--opening" : ""}`} style={{ "--story-speaker": speakerTone } as CSSProperties}>
    {!opening && <div className="story-portrait"><StoryGlyph kind="person" tone={speakerTone} /><span>FIELD NOTES</span></div>}
    <button ref={next} type="button" className="story-dialogue-button" onClick={onNext}
      onKeyDown={(event) => { if ((event.key === "Enter" || event.key === " ") && event.repeat) event.preventDefault(); }}>
      <span className="story-speaker">{speaker}</span>
      <span className="story-text" aria-hidden="true"><span className="story-text-ink">{stableText}</span></span>
      <span className="story-sr">{text}</span>
      <span className="story-next">{label} <span aria-hidden="true">▸</span></span>
    </button>
  </div>;
}
