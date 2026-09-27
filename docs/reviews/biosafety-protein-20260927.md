# Biosafety and protein content review — 2026-09-27

## Scope

- Safety & Security: conditional salinity-response model, scenario comparison, sensitivities and literature context.
- Protein, sections 1–7: LCYB candidate rationale, protein-only screening, lycopene docking and WT/F404Y 5 ns dynamics.
- Protein, sections 8–11: TF2146 candidate DNA regions, sequence controls, separate protein-variant screen and the conclusion that current calculations do not support effective binding disruption by the proposed motif changes.

Both pages remain team-review drafts. No experimental efficacy, improved catalysis or demonstrated regulatory effect is claimed. The obsolete ligand system is not included in this contribution.

## Evidence trail

Source names below identify the team's local research archive, not files included in this repository. No full-text literature PDFs, large simulation archives or standalone preview bundles are added.

| Content | Archive source | Review and limitation |
| --- | --- | --- |
| Safety scenarios and sensitivities | `生物安全_审查落实版.ipynb` saved outputs | Checked the displayed baseline and sensitivity values against saved tables. Values are rounded to one decimal place. Parameters remain uncalibrated assumptions or literature analogies; washout is not death. |
| Safety literature | `output/biosafety_review_20260909/literature/` and accompanying review | Page citations preserve study-specific limits, including cell-free MazF evidence and cross-strain growth analogies. |
| LCYB FoldX | `番茄红素环化酶理性设计报告_稳定性筛选与实验计划.docx` | Only protein stability screening was used. Y322F numerical values are omitted because its calculation package needs verification. |
| LCYB AF3 | `vina_lycopene_af3/selected_models.tsv` | Protein model confidence only; not catalytic performance. |
| Lycopene docking | `gromacs_lycopene_corrected_20260926/selected_poses.json` | Three search seeds per system. Sample SD describes search variability, not biological uncertainty. |
| WT/F404Y dynamics | Same archive, `results_5ns/STATUS_20260927.md`, `metrics_summary.json`, `stereochemistry_audit.json`, `analysis_5ns/` | One 5 ns trajectory per system; 1–5 ns means do not establish equilibration or affinity. Ligand parameter limitations remain stated. Figures use saved scores and RMSD trajectories. |
| TF2146 candidate motifs | `Pdca1_2146motif-like.dna`, `AF3_2146_dsDNA_inputs/README.md`, `build_af3_2146_inputs.mjs` | SnapGene feature coordinates and input-control design checked. Original motif-search matrix/threshold not recovered; no enrichment or significance claim is made. |
| Eight DNA-sequence comparisons | `protein_analysis/markdown_report/TF2146_蛋白干实验详细汇报_2026-08-15.md` | Best reported protein–DNA chain-pair ipTM values and contact interpretation are report-derived. Complete raw outputs were not recovered in this review; archive these before final scientific sign-off. Different seeds confound sequence comparisons. |
| Separate protein-variant screen | `af3_selected_30_results/af3_screening_summary.tsv`, screening script/report and status | 27 completed tasks, not 30 completed tasks. Interface ipTM is a median across five models; stable residues contact DNA in at least three models. Domain-deletion signals are retained, with folding and missing-control caveats. |

## Checks

- TypeScript and production Vite build: passed.
- Updated `tools/check-dry-lab.mjs`: passed, including rendering, equation parsing, table dimensions and figure existence for the new pages. Removed stale empty-page expectations; preserved existing content checks.
- ESLint on all modified TypeScript/TSX files: passed.
- Full-source ESLint: existing `src/PBRWidget.tsx:32` purity error (`Math.random` during render), unchanged by this PR.
- Desktop previews and 390 px layout were reviewed during authoring; the Protein figures loaded and no document-level horizontal overflow was observed.
- Main branch additions through `d80fbbe` are preserved, including metabolomics and equation spacing.

## Publication status

This change prepares Wiki content for team review. In particular, the TF2146 eight-task source archive and Y322F calculation package need provenance follow-up; neither missing item is presented as newly recomputed or experimentally verified evidence.
