#!/usr/bin/env python3
"""Build transcriptomics figures from the checked-in analysis outputs.

Run from the wiki repository with:
  python3 tools/build-transcriptomics-figures.py

The analysis workspace is expected beside this repository. Override it with
--analysis-root when it lives elsewhere. The plots preserve transcript IDs and
the biological pathway order; no unsupervised clustering is used.
"""

from __future__ import annotations

import argparse
from pathlib import Path

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from matplotlib.colors import TwoSlopeNorm
from matplotlib.lines import Line2D


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_ANALYSIS = ROOT.parent / "analysis" / "transcriptomics" / "光强轴"
SAMPLES = ["LL1", "LL2", "LL3", "ML1", "ML2", "ML3", "HL1", "HL2", "HL3"]
CONDITIONS = [("150", SAMPLES[:3]), ("600", SAMPLES[3:6]), ("1500", SAMPLES[6:])]
CONTRASTS = [
    ("600 vs 150", "medium_vs_low"),
    ("1500 vs 150", "high_vs_low"),
    ("1500 vs 600", "high_vs_medium"),
]
FAMILY_ORDER = ["DXS", "PSY", "PDS", "ZDS", "CRTISO", "LCYB", "LCYE", "ZEP", "BCH"]
FEATURES = [
    ("CRTISO", "Cluster-5009.33436"),
    ("LCYB", "Cluster-5009.34218"),
    ("LCYB", "Cluster-5009.36796"),
    ("LCYE", "Cluster-5009.32344"),
    ("PDS", "Cluster-5009.39420"),
    ("ZEP", "Cluster-5009.41790"),
]
COLOURS = {"150": "#4B8D9A", "600": "#7A9F3E", "1500": "#E08B42"}
INK = "#123B32"
MUTED = "#60756C"
GRID = "#DCE3D9"
PAPER = "#FFFCF3"


def locate_inputs(analysis_root: Path) -> tuple[Path, Path, Path]:
    tables = analysis_root / "results" / "tables"
    counts = analysis_root / "datasets" / "GSE120965" / "processed" / "GSE120965_read_count_uploaded.csv"
    factors = tables / "pathway_tf_size_factors.csv"
    if not counts.exists() or not factors.exists():
        raise FileNotFoundError(f"Expected GSE120965 inputs under {analysis_root}")
    return counts, factors, tables


def configure_style() -> None:
    matplotlib.rcParams.update(
        {
            "font.family": "DejaVu Sans",
            "font.size": 9,
            "axes.labelcolor": INK,
            "axes.edgecolor": GRID,
            "axes.titlecolor": INK,
            "text.color": INK,
            "xtick.color": MUTED,
            "ytick.color": MUTED,
            "svg.fonttype": "none",
            "savefig.facecolor": PAPER,
        }
    )


def finish(fig: plt.Figure, output: Path, name: str) -> None:
    output.mkdir(parents=True, exist_ok=True)
    target = output / name
    fig.savefig(target, format="svg", bbox_inches="tight", facecolor=PAPER,
                metadata={"Date": None})
    # Matplotlib leaves insignificant trailing spaces in SVG path data; strip
    # them so generated assets pass git diff --check cleanly.
    target.write_text("\n".join(line.rstrip() for line in target.read_text().splitlines()) + "\n")
    plt.close(fig)


def expression_plot(counts_path: Path, factors_path: Path, output: Path) -> None:
    counts = pd.read_csv(counts_path, index_col=0)
    factors = pd.read_csv(factors_path).set_index("sample")["size_factor"]
    normalised = counts.loc[:, SAMPLES].round().div(factors.loc[SAMPLES], axis="columns")
    fig, axes = plt.subplots(2, 3, figsize=(12.8, 7.1), sharex=True)
    x_positions = np.arange(3)
    jitter = np.array([-0.09, 0, 0.09])

    for ax, (enzyme, transcript) in zip(axes.flat, FEATURES):
        vals = []
        for position, (light, group_samples) in enumerate(CONDITIONS):
            group = np.log2(normalised.loc[transcript, group_samples].to_numpy() + 1)
            vals.append(float(group.mean()))
            ax.scatter(
                position + jitter,
                group,
                s=38,
                color=COLOURS[light],
                edgecolor=PAPER,
                linewidth=0.8,
                zorder=3,
            )
        ax.plot(x_positions, vals, color=INK, linewidth=1.5, alpha=0.75, zorder=2)
        ax.scatter(x_positions, vals, marker="D", s=36, color=INK, zorder=4)
        ax.set_title(f"{enzyme}  ·  {transcript.removeprefix('Cluster-')}", loc="left", fontsize=10, fontweight="bold")
        ax.set_xticks(x_positions, ["150", "600", "1500"])
        ax.grid(axis="y", color=GRID, linewidth=0.8)
        ax.spines[["top", "right"]].set_visible(False)
        ax.set_axisbelow(True)

    for ax in axes[:, 0]:
        ax.set_ylabel("log₂(normalized count + 1)")
    for ax in axes[1, :]:
        ax.set_xlabel("Light intensity · µmol photons m⁻² s⁻¹")
    legend = [
        Line2D([0], [0], marker="o", color="none", markerfacecolor=COLOURS[light],
               markeredgecolor=PAPER, markersize=7, label=f"one replicate · {light}")
        for light, _ in CONDITIONS
    ] + [Line2D([0], [0], marker="D", color=INK, markersize=5, label="condition mean")]
    fig.legend(handles=legend, loc="upper center", ncol=4, frameon=False, bbox_to_anchor=(0.5, 1.01))
    fig.suptitle("Six sequence-annotated transcripts across the nine cultures", x=0.03, y=1.08,
                 ha="left", fontsize=15, fontweight="bold", color=INK)
    fig.text(0.03, -0.025, "Each panel has its own y-scale. Points are biological replicates (n = 3); diamonds and connecting lines show group means.",
             ha="left", fontsize=8, color=MUTED)
    fig.tight_layout(rect=(0, 0.025, 1, 0.96))
    finish(fig, output, "transcriptomics-sample-expression.svg")


def volcano_plot(tables: Path, output: Path) -> None:
    fig, axes = plt.subplots(1, 3, figsize=(14.2, 4.9), sharey=True)
    for ax, (label, stem) in zip(axes, CONTRASTS):
        data = pd.read_csv(tables / f"pathway_tf_deseq_{stem}.csv")
        data = data.dropna(subset=["pval", "padj"])
        raw_x = data["log2FoldChange"].to_numpy()
        x = np.nan_to_num(raw_x, nan=0, posinf=8, neginf=-8).clip(-8, 8)
        y = np.minimum(-np.log10(np.clip(data["pval"].to_numpy(), 1e-300, None)), 60)
        q = data["padj"].to_numpy()
        significant = q < 0.05
        ax.scatter(x[~significant], y[~significant], s=4, color="#AEBDB5", alpha=0.28,
                   linewidths=0, rasterized=True)
        ax.scatter(x[significant & (x < 0)], y[significant & (x < 0)], s=5, color="#4B8D9A",
                   alpha=0.55, linewidths=0, rasterized=True)
        ax.scatter(x[significant & (x > 0)], y[significant & (x > 0)], s=5, color="#E08B42",
                   alpha=0.55, linewidths=0, rasterized=True)
        ax.axvline(0, color=INK, linewidth=0.8, alpha=0.55)
        ax.set_xlim(-8, 8)
        ax.set_ylim(0, 60)
        ax.set_title(f"{label}\n{int(significant.sum()):,} transcripts · q < 0.05", fontsize=10, fontweight="bold")
        ax.set_xlabel("log₂ fold change · second / first (clipped at ±8)")
        ax.grid(axis="y", color=GRID, linewidth=0.7)
        ax.spines[["top", "right"]].set_visible(False)
        ax.set_axisbelow(True)
    axes[0].set_ylabel("−log₁₀(raw P) · capped at 60")
    fig.suptitle("Replicate-aware differential expression across planned light contrasts", x=0.02,
                 y=1.08, ha="left", fontsize=15, fontweight="bold", color=INK)
    fig.text(0.02, -0.06, "Each point is a Trinity transcript. Colour marks Benjamini–Hochberg adjusted q < 0.05; this genome-wide view is not a pathway ranking.",
             ha="left", fontsize=8, color=MUTED)
    fig.tight_layout(rect=(0, 0.035, 1, 0.95))
    finish(fig, output, "transcriptomics-deseq-volcano.svg")


def pathway_effect_map(tables: Path, output: Path) -> None:
    annotations = pd.read_csv(tables / "carotenoid_transcript_annotations.csv")
    values: dict[str, pd.DataFrame] = {}
    for label, stem in CONTRASTS:
        result = pd.read_csv(tables / f"pathway_tf_deseq_{stem}.csv").set_index("id")
        values[label] = result

    annotations["family_order"] = annotations["enzyme"].map({name: i for i, name in enumerate(FAMILY_ORDER)})
    annotations = annotations.sort_values(["family_order", "transcript"], kind="stable").reset_index(drop=True)
    lfc = np.column_stack([values[label].loc[annotations.transcript, "log2FoldChange"].to_numpy() for label, _ in CONTRASTS])
    padj = np.column_stack([values[label].loc[annotations.transcript, "padj"].to_numpy() for label, _ in CONTRASTS])
    finite_lfc = np.nan_to_num(lfc, nan=0.0, posinf=3.0, neginf=-3.0)
    clipped = np.clip(finite_lfc, -3, 3)

    fig, ax = plt.subplots(figsize=(11.2, 8.2))
    cmap = matplotlib.colormaps["RdYlGn"].copy()
    cmap.set_bad("#E9EDE6")
    norm = TwoSlopeNorm(vmin=-3, vcenter=0, vmax=3)
    image = ax.imshow(clipped, aspect="auto", cmap=cmap, norm=norm, interpolation="nearest")
    ax.set_xticks(np.arange(3), [label for label, _ in CONTRASTS])
    ax.xaxis.tick_top()
    ax.tick_params(axis="x", length=0, pad=10)
    labels = [f"{row.enzyme}  ·  {row.transcript.removeprefix('Cluster-')}" for row in annotations.itertuples()]
    ax.set_yticks(np.arange(len(labels)), labels, fontsize=8)
    ax.tick_params(axis="y", length=0, pad=8)
    ax.set_xticks(np.arange(-0.5, 3, 1), minor=True)
    ax.set_yticks(np.arange(-0.5, len(labels), 1), minor=True)
    ax.grid(which="minor", color=PAPER, linewidth=2)
    ax.tick_params(which="minor", bottom=False, left=False)
    for i in range(len(annotations)):
        for j in range(3):
            q = padj[i, j]
            if np.isfinite(q) and q < 0.05:
                ax.scatter(j, i, marker="o", s=13, color=INK, edgecolor=PAPER, linewidth=0.4, zorder=3)
            shown = lfc[i, j]
            if np.isfinite(shown):
                text = f"{shown:+.2f}"
            elif np.isposinf(shown):
                text = ">+3"
            elif np.isneginf(shown):
                text = "<−3"
            else:
                continue
            colour = PAPER if abs(clipped[i, j]) > 1.9 else INK
            ax.text(j, i + 0.25, text, ha="center", va="center", fontsize=7,
                    color=colour, zorder=4)
    boundaries = np.flatnonzero(annotations.enzyme.to_numpy()[1:] != annotations.enzyme.to_numpy()[:-1]) + 0.5
    for boundary in boundaries:
        ax.axhline(boundary, color=INK, linewidth=0.8, alpha=0.7)
    ax.set_title("Pathway-linked transcript responses · fixed enzyme order, no clustering", loc="left",
                 pad=44, fontsize=14, fontweight="bold", color=INK)
    ax.spines[:].set_visible(False)
    colorbar = fig.colorbar(image, ax=ax, fraction=0.035, pad=0.025)
    colorbar.set_label("log₂ fold change · second / first", rotation=90, labelpad=12)
    colorbar.set_ticks([-3, -2, -1, 0, 1, 2, 3])
    fig.text(0.12, 0.01, "Numbers are log₂ fold changes. A dark dot marks q < 0.05. Colour saturates outside ±3; rows are grouped by annotated reaction family.",
             ha="left", fontsize=8, color=MUTED)
    fig.tight_layout(rect=(0.02, 0.04, 1, 0.98))
    finish(fig, output, "transcriptomics-pathway-effects.svg")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--analysis-root", type=Path, default=DEFAULT_ANALYSIS)
    args = parser.parse_args()
    configure_style()
    counts, factors, tables = locate_inputs(args.analysis_root)
    output = ROOT / "public" / "figures" / "dry-lab"
    expression_plot(counts, factors, output)
    volcano_plot(tables, output)
    pathway_effect_map(tables, output)
    print(f"Wrote three transcriptomics SVG figures to {output}")


if __name__ == "__main__":
    main()
