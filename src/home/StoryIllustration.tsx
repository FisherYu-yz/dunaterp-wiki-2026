import type { CSSProperties } from "react";
import type { StoryBeat } from "./story";
import { StoryGlyph } from "./StoryGlyph";

export function StoryIllustration({ beat }: { beat: StoryBeat }) {
  const stagger = (index: number) => ({ "--item": index } as CSSProperties);

  switch (beat.visual) {
    case "resources":
      return <div className="story-items">
        {([
          ["food", "Food · nutrition · materials"],
          ["plant", "Plant extraction"],
          ["pigment", "Chemical + microbial routes"],
        ] as const).map(([kind, label], index) => <div className="story-item" key={kind} style={stagger(index)}><StoryGlyph kind={kind} /><span>{label}</span></div>)}
      </div>;

    case "traits":
      return <div className="story-discovery">
        <div className="story-specimen"><StoryGlyph kind="alga" /><span>Dunaliella salina</span></div>
        <ul className="story-loot">{["LOW-COST, SALT-TOLERANT CULTIVATION", "COMPLETE MEP + CAROTENOID PATHWAY", "BROAD, NON-FRESHWATER POTENTIAL"].map((text, index) => <li key={text} style={stagger(index)}>+ {text}</li>)}</ul>
      </div>;

    case "products":
      return <div className="story-pathway" aria-label="Transcription factor 2146 reprograms Dunaliella metabolism toward a beta-carotene hub">
        <div className="story-specimen"><StoryGlyph kind="alga" /><span>Engineered Dunaliella</span></div>
        <span className="story-arrow" aria-hidden="true">→</span>
        <div className="story-hub">TF 2146</div>
        <span className="story-arrow" aria-hidden="true">→</span>
        <div className="story-products">{["METABOLIC REPROGRAMMING", "REDIRECTED FLUX", "β-CAROTENE HUB"].map((text, index) => <span key={text} style={stagger(index)}>{text}</span>)}</div>
      </div>;

    case "characterisation":
      return <div className="story-checkpoints" aria-label="Modeling and downstream product designs">
        {[
          ["MODEL", "Regulation · flux · competition"],
          ["HUB", "β-carotene supply"],
          ["PRODUCTS", "Astaxanthin · β-ionone · crocetin · β-citraurin"],
        ].map(([title, detail], index) => <div key={title} style={stagger(index)}><strong>{title}</strong><span>{detail}</span></div>)}
      </div>;

    case "journey":
      return <div className="story-quest">
        <StoryGlyph kind="hero" />
        <p>YOUR JOURNEY</p>
        <h2>THE SALT ROUTE</h2>
      </div>;
  }
}
