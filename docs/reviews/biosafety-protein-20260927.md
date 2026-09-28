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
| Eight DNA-sequence comparisons | `protein_analysis/markdown_report/TF2146_蛋白干实验详细汇报_2026-08-15.md` | Best reported protein–DNA chain-pair ipTM values and contact interpretation are report-derived. Different seeds confound sequence comparisons. |
| Separate protein-variant screen | `af3_selected_30_results/af3_screening_summary.tsv`, screening script/report and status | 27 completed tasks, not 30 completed tasks. Interface ipTM is a median across five models; stable residues contact DNA in at least three models. Domain-deletion signals are retained, with folding and missing-control caveats. |

## Checks

- TypeScript and production Vite build: passed.
- Updated `tools/check-dry-lab.mjs`: passed, including rendering, equation parsing, table dimensions and figure existence for the new pages. Removed stale empty-page expectations; preserved existing content checks.
- ESLint on all modified TypeScript/TSX files: passed.
- Full-source ESLint: existing `src/PBRWidget.tsx:32` purity error (`Math.random` during render), unchanged by this PR.
- Desktop previews and 390 px layout were reviewed during authoring; the Protein figures loaded and no document-level horizontal overflow was observed.
- Main branch additions through `d80fbbe` are preserved, including metabolomics and equation spacing.

## Publication status

This change prepares Wiki content for team review. Y322F numerical results remain omitted pending verification. Computational predictions are not presented as experimentally verified evidence.

## 2026-09-28：分支整合与三维预览

- 合入 FisherYu-yz 的 `feature/dry-lab-docking`（`6939bb1`），解决页面入口和检查脚本冲突。Protein 只保留一个定义。
- 保留 TSO1 motif 衍生的人工 25 bp DNA 工作，作为独立章节；与 pDCA1 三位点工作分别表述。
- CXC 完整区段统一为 32–72、117–158。旧 LCYB 对接/MD 数值、旧配体图片及错误标为 CXC 的小分子图不进入整合页面。
- 三张静态图用本地 Blender 从校正后的 WT 蛋白与番茄红素坐标重新生成。渲染脚本与输入摘要随代码保存。
- 交互窗口使用同一坐标来源。口袋表面由 PyMOL 生成，采用 1.4 Å 探针的 solvent-excluded surface；展示配体周围 8 Å 内重原子形成的局部表面，不是完整蛋白的表面。
- Phe404 默认关闭；整体/口袋视角、剖切、骨架、缩放、播放、进度和恢复滚动均可独立操作。配色、字体和开关样式与 Wiki 统一；所有界面文字为英文。
- “Simulated path”仅演示外部接近：对整个蛋白的重原子进行距离检查，采样步长 0.25 Å，候选路线筛选阈值 3.0 Å。选中路线到平移距离 17.75 Å 为止，采样最小距离约 3.15 Å；该几何检查不代表能量或动力学验证。
- 接近结束后使用明确的淡出/淡入切换到原始对接姿态，标记为“Pose transition”；没有绘制穿越蛋白内部的连接轨迹。最终姿态保持原始输入坐标。
