import { useEffect, useId, useRef, useState, type CSSProperties } from "react";
import { NPCS, PixelPortrait } from "./ExpeditionJournal";
import type { NpcId } from "./pixel/npc-data";
import "./npc-dialogue.css";

type NpcDialogueProps = {
  npcId: NpcId;
  onClose: () => void;
};

/** A compact, game-native conversation that stays over the live world. */
export function NpcDialogue({ npcId, onClose }: NpcDialogueProps) {
  const npc = NPCS[npcId];
  const panelRef = useRef<HTMLElement>(null);
  const [page, setPage] = useState(0);
  const titleId = `${useId().replace(/:/g, "")}-npc-name`;
  const selected = page > 0 ? npc.prompts[page - 1] : null;
  const pageCount = npc.prompts.length + 1;

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      panelRef.current?.querySelector<HTMLButtonElement>(".npc-dialogue__choice")?.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(frame);
  }, [npcId]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key === "Tab") {
        const focusable = Array.from(
          panelRef.current?.querySelectorAll<HTMLButtonElement>("button:not(:disabled)") ?? [],
        );
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
        return;
      }
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        setPage((currentPage) => Math.max(0, currentPage - 1));
        return;
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        setPage((currentPage) => Math.min(pageCount - 1, currentPage + 1));
        return;
      }
      const choiceIndex = Number(event.key) - 1;
      const prompt = npc.prompts[choiceIndex];
      if (prompt && choiceIndex >= 0) {
        event.preventDefault();
        setPage(choiceIndex + 1);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [npc.prompts, onClose, pageCount]);

  return (
    <section
      ref={panelRef}
      className="npc-dialogue"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      style={{ "--npc-accent": npc.accent } as CSSProperties}
    >
      <div className="npc-dialogue__portrait">
        <PixelPortrait npc={npc} />
        <span aria-hidden="true">!</span>
      </div>

      <div className="npc-dialogue__story">
        <div className="npc-dialogue__nameplate">
          <div>
            <strong id={titleId}>{npc.name}</strong>
            <span>{npc.role}</span>
          </div>
          <button type="button" onClick={onClose} aria-label={`End conversation with ${npc.name}`}>×</button>
        </div>
        <p className="npc-dialogue__line" aria-live="polite">
          {selected?.response ?? npc.intro}
        </p>
        <p className="npc-dialogue__hint">
          {selected ? selected.label : "Meet the field guide, then turn the page."}
        </p>
        <p className="npc-dialogue__chapter-hint">{npc.chapterHint}</p>
        <div className="npc-dialogue__pager">
          <span>{String(page + 1).padStart(2, "0")} / {String(pageCount).padStart(2, "0")}</span>
          <button type="button" onClick={() => setPage((currentPage) => Math.max(0, currentPage - 1))} disabled={page === 0} aria-label="Previous dialogue page">←</button>
          <button type="button" onClick={() => setPage((currentPage) => Math.min(pageCount - 1, currentPage + 1))} disabled={page === pageCount - 1} aria-label="Next dialogue page">→</button>
        </div>
      </div>

      <div className="npc-dialogue__choices" role="group" aria-label={`Questions for ${npc.name}`}>
        {npc.prompts.map((prompt, index) => (
          <button
            key={prompt.id}
            type="button"
            className={`npc-dialogue__choice${page === index + 1 ? " is-selected" : ""}`}
            onClick={() => setPage(index + 1)}
            aria-pressed={page === index + 1}
          >
            <span>{index + 1}</span>
            {prompt.label}
          </button>
        ))}
        <button type="button" className="npc-dialogue__continue" onClick={onClose}>
          Continue exploring <span aria-hidden="true">▸</span>
        </button>
      </div>
    </section>
  );
}

export default NpcDialogue;
