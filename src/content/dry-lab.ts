import type { WikiPage, WikiSection } from '../site-data';
import type { ContentBlock } from './types';

const p = (text: string): ContentBlock => ({ kind: 'paragraph', text });
const h = (text: string): ContentBlock => ({ kind: 'heading', text });
const eq = (label: string, text: string): ContentBlock => ({ kind: 'equation', label, text });
const fig = (name: string, alt: string, caption: string): ContentBlock => ({ kind: 'figure', src: `/figures/dry-lab/${name}.png`, alt, caption });
const customTable = (caption: string, columns: string[], rows: string[][]): ContentBlock => ({ kind: 'table', caption, columns, rows });
const links = (...entries: [string, string][]): ContentBlock => ({ kind: 'links', links: entries.map(([label, href]) => ({ label, href })) });
const section = (title: string, ...blocks: ContentBlock[]): WikiSection => ({ title, body: '', blocks });

export const dryLabNavigation = [
  ['Overview', '/dry-lab'],
  ['Transcriptomics', '/transcriptomics'],
  ['Mathematical Modeling', '/model'],
  ['Metabolomics', '/metabolomics'],
  ['Protein', '/protein'],
  ['Hardware Modeling', '/hardware'],
  ['Hardware Design', '/hardware-design'],
] as const;

export const dryLabMenuGroups = [
  { label: 'Modeling', items: [dryLabNavigation[1], dryLabNavigation[2], dryLabNavigation[3], dryLabNavigation[4]] },
  { label: 'Hardware', items: [dryLabNavigation[5], dryLabNavigation[6]] },
] as const;

const modelingChapters = [
  ['Transcriptomics', '/transcriptomics', 'Compare replicated light treatments and trace carotenoid-pathway transcripts in published D. salina RNA-seq.'],
  ['Mathematical Modeling', '/model', 'Trace promoter occupancy through LCYB expression to the β-carotene pool.'],
  ['Metabolomics', '/metabolomics', 'Compare four product routes across eight A–H conditions, then test pathway branch points.'],
  ['Protein', '/protein', 'Screen LCYB variants and examine the proposed TF2146–DNA interaction.'],
] as const;

export const transcriptomics: WikiPage = {
  title: 'Transcriptomics', eyebrow: 'Dry Lab / Transcriptomics', status: 'team-draft',
  intro: 'We followed the carotenoid pathway from its early precursor steps to the lycopene branch, then asked how those enzyme transcripts respond to light acclimation in Dunaliella salina. The clearest link to our design is LCYB, which directs lycopene toward the β-carotene pool used by the downstream models.',
  sections: [
    section('Follow the route to the β-carotene branch',
      p('Carotenoid synthesis is a chain of enzyme reactions, so we organized the analysis by pathway position. GGPS supplies GGPP, and PSY converts it to phytoene; PDS, Z-ISO, ZDS and CRTISO then lead toward lycopene. At lycopene, LCYB directs synthesis toward β-carotene, while LCYE opens the α-carotene branch.'),
      { kind: 'figure', src: '/figures/dry-lab/carotenoid-route.svg', alt: 'Pathway diagram from MEP-derived precursors through phytoene and lycopene, branching at LCYB to beta-carotene and at LCYE to alpha-carotene.', caption: 'Figure 1. Enzyme order used to read the light-response data. The highlighted LCYB step connects the transcript analysis to the β-carotene model.' },
      p('This pathway map sets the biological question: which steps change with light, and does the lycopene branch point respond in a way that is useful to test in the model?'),
    ),
    section('From samples to enzyme steps',
      p('The public study GSE120965 provides a de novo Trinity transcript assembly and a Readcount matrix from cells acclimated for 168 h at three light intensities. Each condition has three independent biological replicates.'),
      customTable('Light-acclimation experiment', ['Light intensity (µmol photons m⁻² s⁻¹)', 'Samples', 'Replicates'], [
        ['150','LL1, LL2, LL3','3'], ['600','ML1, ML2, ML3','3'], ['1500','HL1, HL2, HL3','3'],
      ]),
      { kind: 'figure', src: '/figures/dry-lab/transcriptomics-workflow.svg', alt: 'Analysis workflow linking the three replicated light treatments to Trinity sequence annotation, DESeq count comparisons, pathway interpretation and the LCYB model.', caption: 'Figure 2. The two analysis tracks share transcript identifiers: sequence similarity assigns an enzyme step, while replicated read counts estimate its light response.' },
      h('1 · Assign each transcript to a pathway reaction'),
      p('DIAMOND blastx searches all six-frame translations from the Trinity assembly against Swiss-Prot and Dunaliella protein references. We retain hits with E-value ≤ 10⁻⁵, at least 20% identity and at least 15% reference-protein coverage; for each transcript, the highest bit-score hit supplies its enzyme annotation. We make this sequence-based list before testing light response and keep Trinity IDs as transcript-level features.'),
      h('2 · Compare like with like'),
      p('We use the Readcount matrix, not FPKM, for the treatment test. DESeq 1.10.1 first estimates median-of-ratios size factors to correct library depth, then estimates pooled dispersion across the nine samples. Its negative-binomial nbinomTest compares each light pair. The GEO matrix contains fractional entries, which are rounded to the nearest integer for this DESeq input.'),
      h('3 · Test the three biological contrasts'),
      customTable('Planned comparisons', ['Contrast', 'Question'], [
        ['600 vs 150','Which transcripts respond at the intermediate light condition?'],
        ['1500 vs 150','Which responses differ between the lowest and strongest light?'],
        ['1500 vs 600','What changes between the two elevated-light conditions?'],
      ]),
      p('For each contrast, DESeq returns a log₂ fold change and P value. We adjust P values across tested transcripts with Benjamini–Hochberg; q < 0.05 marks a statistically supported expression difference. Positive log₂ fold change means the transcript is more abundant in the first-named condition.'),
    ),
    section('What changes along the route',
      p('The pathway does not move as one block. The light response differs by reaction, and the LCYB transcript is most abundant in the intermediate-light comparison rather than rising steadily across all three conditions.'),
      customTable('Selected annotated carotenoid transcripts', ['Enzyme step', 'Trinity transcript', 'Contrast', 'log₂ fold change', 'q value'], [
        ['CRTISO · isomerization toward lycopene','Cluster-5009.33436','1500 vs 600','+4.70','2.8 × 10⁻¹¹¹'],
        ['LCYB · lycopene → β-carotene','Cluster-5009.34218','600 vs 150','+0.58','1.3 × 10⁻¹³'],
        ['LCYB · lycopene → β-carotene','Cluster-5009.34218','1500 vs 600','−0.31','1.1 × 10⁻⁴'],
        ['LCYE · competing lycopene branch','Cluster-5009.32344','1500 vs 150','+0.58','1.4 × 10⁻⁷'],
        ['PDS · early desaturation','Cluster-5009.39826','1500 vs 150','−0.58','4.3 × 10⁻¹²'],
        ['ZEP · xanthophyll branch','Cluster-5009.41790','1500 vs 150','−0.78','3.5 × 10⁻¹⁵'],
      ]),
      { kind: 'figure', src: '/figures/dry-lab/pathway-expression-contrasts.svg', alt: 'Diverging bar chart of six selected DESeq log2 fold changes for CRTISO, LCYB, LCYE, PDS and ZEP across the indicated light contrasts, with q values.', caption: 'Figure 3. Selected enzyme-level responses. The zero line marks no expression difference; bar direction follows the first-versus-second condition order shown at left.' },
      p('The pattern points to a specific modeling question: at 600 µmol photons m⁻² s⁻¹, the annotated LCYB transcript is about 1.5-fold higher than at 150; at 1500, it is lower than at 600. Meanwhile, the competing LCYE transcript rises in the high-light comparison. We therefore carry LCYB forward as a condition-responsive branch point, not as a proxy for the whole pathway.'),
    ),
    section('Connect expression to the model',
      p('The transcript result defines the expression layer. The mathematical model carries LCYB transcript abundance through active enzyme to the lycopene-to-β-carotene reaction rate, where substrate supply and turnover shape the downstream pool.'),
      p('We use GSE120965 to choose a light-responsive pathway step. TF2146 belongs to a separate design hypothesis, examined in the protein and DNA work.'),
      links(['GSE120965 · expression data and transcript assembly','https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=GSE120965'],['Li et al., 2019 · photoacclimation study','https://doi.org/10.1111/pre.12379'],['Next · Mathematical Modeling','/model']),
    ),
  ],
};

export const metabolomics: WikiPage = {
  title: 'Metabolic Flow Analysis', eyebrow: 'Modeling / Metabolic Flow', status: 'team-draft',
  intro: 'We use a constraint-based chassis model and a local dynamic branch model to ask how D. salina can support four carotenoid-derived products, which conditions favour production, and where pathway intervention has the greatest leverage.',
  sections: [
    section('Introduction',
      p('DunaTerp treats β-carotene as a shared metabolic hub rather than a single endpoint. The metabolic analysis therefore asks four connected questions: can the reconstructed D. salina network carry each engineered product route, how do environmental constraints change attainable flux, what chassis cost accompanies stronger production, and which branch points should be prioritized for intervention?'),
      p('The analysis follows a reproducible sequence: validate the chassis network under published scenarios, add the four product routes, define a flux-balance objective, compare production and trade-offs, test LCYB- and zeaxanthin-associated nodes, and finally use a local ODE model to examine time-dependent redistribution. This organization follows the evidence-first logic of the SCU-China 2024 metabolic-flow page while retaining the present project’s own network, targets and results.'),
      { kind: 'chapter-grid', items: [
        { index: '01', title: 'Validate the chassis', text: 'Reconstruct the D. salina network and confirm feasible solutions across the published A–H scenarios.', href: '/metabolomics#section-2' },
        { index: '02', title: 'Integrate four routes', text: 'Add product-specific reactions and sinks to one shared β-carotene-centred platform model.', href: '/metabolomics#section-4' },
        { index: '03', title: 'Compare allocation', text: 'Quantify product support, environmental effects, chassis cost and branch-point leverage.', href: '/metabolomics#section-5' },
        { index: '04', title: 'Resolve dynamics', text: 'Use local Michaelis–Menten kinetics and sensitivity analysis to prioritize measurements.', href: '/metabolomics#section-8' },
      ] },
      links(['SCU-China 2024 · metabolic-flow analysis structure','https://2024.igem.wiki/scu-china/metabolic-flow-analysis']),
    ),
    section('Chassis model construction and validation',
      p('The Dunaliella salina metabolic network was reconstructed and then validated under the eight A-H scenarios reported in the literature. The analysis unified the definitions of light conditions, nitrogen-source conditions and objective functions, and confirmed that the model could be solved stably under a conservative interpretation of those scenarios.'),
      p('All eight A-H scenarios yielded stable feasible solutions. This established a computable metabolic chassis that provides a consistent foundation for the later product, environment and branch-point analyses.'),
    ),
    section('Method: constrained flux balance analysis',
      p('Flux balance analysis assumes that internal metabolite pools are at quasi-steady state over the optimization interval. The stoichiometric matrix S links metabolites to reaction fluxes v; lower and upper bounds encode the environmental and reaction constraints. For each question, a stated objective c is optimized without changing the underlying mass-balance rule.'),
      eq('FBA problem', String.raw`\begin{aligned}\max_{v}\quad &c^{\mathsf T}v\\[2pt]\text{subject to}\quad &Sv=0\\&v_{\min}\le v\le v_{\max}\end{aligned}`),
      p('Product sink flux is used when comparing maximum product support. Cal01 is retained as a carbon-fixation proxy when testing the cost of product formation. These outputs are conditional model optima, not measured titres.'),
    ),
    section('Integration of four target product pathways',
      p('The core network was extended with four project-relevant target pathways: astaxanthin, beta-ionone, beta-citraurin and crocetin. For each branch, the corresponding metabolites, reaction steps and product sink reactions were added so that pathway performance could be tracked and compared quantitatively within one shared model.'),
      p('After individual validation, all four pathways remained feasible when the corresponding product reaction was used as the objective. This marks the transition from a chassis-only model to a platform model that can compare different production routes rather than merely demonstrating that the network runs.'),
    ),
    section('Product-production simulation and chassis cost',
      p('After pathway integration, the model was used to compare the maximum potential of each target product. Cal01 was used as a proxy for carbon fixation so that product output could be evaluated against chassis metabolic cost.'),
      p('This analysis asks which pathway is most easily favored for flux redirection, which pathway imposes the least burden on the chassis, and at what point increased product output begins to compete strongly with core chassis function. Within the current framework, the ranking is consistently beta-ionone > beta-citraurin > astaxanthin > crocetin. Most pathways retain substantial output under low-to-moderate constraints, while product flux declines clearly only when the carbon-fixation requirement is forced into a high range.'),
      fig('platform_product_tradeoffs_H', 'Trade-off comparison of four target products in scenario H, showing that beta-ionone has the highest yield, followed by beta-citraurin, astaxanthin and crocetin under different Cal01 constraints.', 'Figure 1. This figure compares the maximum yields of the four target product pathways under different Cal01 constraints in scenario H. The results show a stable difference in platform support for different products, with the overall ranking beta-ionone > beta-citraurin > astaxanthin > crocetin, and most pathways declining clearly only under high carbon-fixation requirements.'),
      fig('astaxanthin_tradeoff_F_H', 'Relationship between astaxanthin production and Cal01 constraint in scenarios F and H, showing that maximum astaxanthin production decreases as carbon-fixation demand increases.', 'Figure 2. This figure shows how astaxanthin production changes in the representative scenarios F and H. As the Cal01 requirement increases, the maximum astaxanthin flux gradually decreases, indicating a quantifiable trade-off between product formation and chassis carbon-fixation capacity.'),
    ),
    section('Environmental scenario comparison',
      p('To test whether the product ranking depended on one specific condition, the four pathways were compared across all eight A-H scenarios. This provides a unified view of how light and nitrogen conditions shape the maximum attainable product fluxes.'),
      p('The platform is most favorable for redirecting flux toward target-product synthesis under high-light and low-nitrate conditions, with scenarios D and H performing best. At the same time, the relative ranking of the four products remains consistent across all scenarios, indicating that the ranking reflects a stable platform tendency rather than an isolated result from one environment.'),
      fig('platform_environment_map_heatmap', 'Heatmap of maximum production potential for four target products across scenarios A-H, showing that high-light and low-nitrate conditions are most favorable and that beta-ionone remains the best-performing product.', 'Figure 3. This heatmap compares the maximum potential of the four target product pathways across the eight A-H scenarios. The results show that high-light and low-nitrate conditions are the most favorable for product-flux redirection, while the relative ranking of the four products remains consistent across scenarios.'),
    ),
    section('Key-node and flux-redistribution analysis',
      p('Beyond final product comparison, the analysis also focused on key nodes in the carotenoid backbone, especially Car09, the LCYB-related node, and Car10, the zeaxanthin-producing node. Forced-flux analysis was used to test how increasing these nodes affects proxies for carbon fixation, chlorophyll and membrane lipids.'),
      p('Increasing Car09 or Car10 does not immediately impose severe metabolic stress on the chassis in the low-to-moderate range, but the burden becomes clearer at higher forcing levels. Zeaxanthin was then examined as a branch-point metabolite by sequentially blocking the three major engineered outlets Car26, Car23 and Car17. The additional zeaxanthin is not split evenly across all downstream branches; instead, it follows the leakage priority Car26 > Car23 > Car17.'),
      fig('lcyb_car09_forced_analysis_H', 'Forced-flux analysis of Car09 in scenario H, showing that increasing the LCYB-related node begins to reduce chassis metabolic performance at high forcing levels.', 'Figure 4. This figure shows how key chassis indicators change in scenario H when Car09, the LCYB-related node, is progressively increased. The results indicate that low-to-moderate enhancement does not immediately impose strong metabolic stress, while higher forcing levels gradually introduce a metabolic burden.'),
      fig('zeaxanthin_car10_forced_proxies_H', 'Relationship between forced Car10 flux and multiple chassis proxy indicators in scenario H, showing that stronger zeaxanthin production leads to noticeable metabolic burden mainly at high forcing levels.', 'Figure 5. This figure shows the responses of Cal01, chlorophyll-related proxies and membrane-lipid proxies when Car10, the zeaxanthin-producing node, is progressively increased in scenario H. The results indicate that increasing zeaxanthin does not immediately impose severe chassis stress in the low-to-moderate range, but gradually introduces metabolic cost at higher forcing levels.'),
      fig('zeaxanthin_car10_rerouting_H', 'Downstream rerouting of zeaxanthin in scenario H, showing that under different outlet-blocking conditions, zeaxanthin is preferentially redirected to Car26, then Car23 and then Car17.', 'Figure 6. By sequentially blocking Car26, Car23 and Car17, this figure shows how zeaxanthin is redistributed when different downstream branches are available. The results indicate that additional zeaxanthin is not split evenly, but instead follows the priority Car26 > Car23 > Car17.'),
    ),
    section('Dynamic branch model',
      p('To move beyond steady-state FBA, a local ODE model was constructed around the branch β-carotene -> zeaxanthin -> four target products. The model includes the BCAR, ZEA and VIO pools together with the four target product pools, and uses a simplified Michaelis-Menten formulation to describe the main branching processes.'),
      p('The first ODE version reproduces the same broad trend seen in the FBA analyses: beta-ionone is more easily favored, while zeaxanthin occupies a central branching position. This allows the analysis to begin asking how flux is redistributed over time rather than only whether a steady state exists.'),
      eq('Local branch kinetics', String.raw`v_i(S)=V_{\max,i}\frac{S}{K_{m,i}+S},\qquad \frac{dS}{dt}=v_{\mathrm{in}}-\sum_i v_i(S)-k_SS`),
      { kind: 'figure-grid', figures: [
        { src: '/figures/dry-lab/carotenoid_branch_ode_v1_baseline_pools.png', alt: 'Time-course plot of key metabolite pools in the ODE baseline scenario.', caption: 'Figure 7. Baseline metabolite-pool trajectories for BCAR, ZEA, VIO and the four product pools.' },
        { src: '/figures/dry-lab/carotenoid_branch_ode_v1_baseline_fluxes.png', alt: 'Time-course plot of key reaction fluxes in the ODE baseline scenario.', caption: 'Figure 8. Baseline flux trajectories showing the BCAR entry split and downstream distribution from ZEA.' },
      ] },
      fig('carotenoid_branch_ode_v1_scenario_products', 'Comparison of final accumulated levels of the four target products across different ODE perturbation scenarios, showing how parameter changes alter astaxanthin, beta-ionone, beta-citraurin and crocetin outputs.', 'Figure 9. This figure compares the final accumulated levels of the four target products under different ODE perturbation scenarios, including enhanced Car10, enhanced beta-ionone branching and partial blocking of downstream zeaxanthin branches. The results illustrate how different engineering interventions reshape the final product pattern.'),
    ),
    section('Sensitivity analysis and dynamic results',
      p('A local sensitivity analysis was then applied to the first ODE version to identify which control parameters matter most. The perturbed parameters focused on the entry and branch terms vmax_bcar_to_zea, vmax_bcar_to_bion, vmax_zea_to_asta, vmax_zea_to_citr and vmax_zea_to_croc.'),
      p('The strongest control layer over the overall product pattern lies mainly at the β-carotene entry-point split, especially BCAR -> BION and BCAR -> ZEA. These two entry parameters influence the global outcome more strongly than the single downstream branch parameters ZEA -> ASTA, ZEA -> CITR and ZEA -> CROC. In practice, this means that changing the entry-point branching nodes is likely to be more effective than only fine-tuning the terminal branches when the goal is to reshape overall platform allocation.'),
      fig('carotenoid_branch_ode_v1_sensitivity_heatmap', 'ODE parameter sensitivity heatmap showing the relative effects of key parameter changes on Peak ZEA, astaxanthin, beta-ionone, beta-citraurin and crocetin.', 'Figure 10. This heatmap shows the relative influence of perturbed key parameters on multiple output indicators in the first ODE model. The results indicate that the most sensitive control parameters governing the overall product pattern are located at the β-carotene entry-point branching layer rather than within the final downstream branches themselves.'),
      fig('carotenoid_branch_ode_v1_sensitivity_ranking', 'Ranking plot of key parameter influence in the ODE model, showing that entry-point branching parameters are more important than downstream single-branch parameters for determining the overall product pattern.', 'Figure 11. This figure ranks the overall influence strength of key parameters in the first ODE model. The results show that parameters associated with BCAR -> BION and BCAR -> ZEA have the strongest effects on overall product distribution, indicating that the entry-point branching layer is the most important control level in the current dynamic model.'),
    ),
    section('Conclusions and experimental guidance',
      p('The metabolomics work now forms a comparatively complete workflow: reconstruction of the Dunaliella salina chassis network, integration of multi-product pathways, scenario-feasibility validation, product-potential comparison, environmental adaptation analysis, key-node mechanistic analysis, and finally local dynamic modeling with sensitivity analysis.'),
      p('The conditional results prioritize three measurements for wet-lab feedback: product formation under the D/H-like light and nitrate regimes, the cost of increasing LCYB- and zeaxanthin-associated flux, and kinetic measurements at the BCAR→BION versus BCAR→ZEA entry split. Those data can replace nominal bounds and Vmax/Km values, turning the present scenario model into a calibrated project model.'),
    ),
  ],
};

export const modeling: WikiPage = {
  title: 'Mathematical Modeling', eyebrow: 'Dry Lab / Model', status: 'team-draft',
  intro: 'The transcriptome analysis shows that LCYB expression responds to light, but expression alone cannot tell us whether that response changes carotenoid production. We built a five-state model to make the proposed route explicit—from regulatory input, through LCYB transcript and active enzyme, to lycopene conversion and the β-carotene pool. The equations define testable relationships; absolute predictions for the engineered strain still require matched project measurements to set the parameters.',
  sections: [
    section('Why model the LCYB step?',
      p('LCYB catalyzes the lycopene-to-β-carotene step. We use it as the link between regulatory design and the product pool, asking how a change in regulatory activity could propagate through LCYB transcription and enzyme abundance to β-carotene formation.'),
      p('The model ends at the β-carotene pool; it does not simulate the four downstream products. Their product-specific reactions are handled in the metabolomics workstream, with separate enzyme parameters and measurements.'),
      fig('14_regulatory_model','Five-state regulatory model linking an active regulatory factor, promoter occupancy, LCYB transcript, active LCYB and beta-carotene.', 'Figure 1. The five dynamic states are active regulatory factor T, LCYB transcript m, active LCYB E, lycopene L and β-carotene B. Promoter occupancy θ and the two reaction rates are algebraic functions. Colors distinguish regulatory, expression and metabolic layers.'),
    ),
    section('From promoter binding to transcript output',
      p('As a first approximation, we represent promoter binding with a one-site equilibrium model. Active regulator concentration T and dissociation constant Kd determine the occupied fraction θ; transcription is then the weighted average of the bound and unbound promoter rates.'),
      links(['Bintu et al. · promoter occupancy models','https://pubmed.ncbi.nlm.nih.gov/15797194/'],['Published D. bardawil lcyb promoter · KX218393','https://pubmed.ncbi.nlm.nih.gov/27657551/']),
      eq('Promoter input', String.raw`\theta=\frac{T}{K_d+T},\qquad u_{\mathrm{LCYB}}=u_{\mathrm{unbound}}(1-\theta)+u_{\mathrm{bound}}\theta`),
      p('When u_bound is larger than u_unbound, binding activates LCYB transcription; the reverse ordering represents repression. Regulator production, degradation and growth dilution determine T, while Kd describes binding affinity.'),
    ),
    section('Tracking the five model states',
      p('The ordinary differential equations track production, conversion and loss in each state. Growth dilution, μ, appears alongside degradation or outflow so that all five balances use the same culture-growth term.'),
      eq('Regulatory LCYB model', String.raw`\begin{aligned}
\frac{dT}{dt}&=s_T-(\delta_T+\mu)T\\
\frac{dm}{dt}&=u_{\mathrm{LCYB}}-(\delta_m+\mu)m\\
\frac{dE}{dt}&=k_{\mathrm{tl}}m-(\delta_E+\mu)E\\
\frac{dL}{dt}&=v_{\mathrm{supply}}-v_{\mathrm{LCYB}}-(k_L+\mu)L\\
\frac{dB}{dt}&=v_{\mathrm{LCYB}}-v_{\mathrm{out}}-(k_B+\mu)B
\end{aligned}`),
      eq('Metabolic rates', String.raw`v_{\mathrm{LCYB}}=q_{\mathrm{LCYB}}E\frac{L}{K_{m,\mathrm{LCYB}}+L},\qquad v_{\mathrm{out}}=V_{\mathrm{out}}\frac{B}{K_{m,\mathrm{out}}+B}`),
      customTable('State variables; time is measured in days', ['State','Quantity','Unit'], [
        ['T','Active regulatory factor','µmol L⁻¹'],
        ['m','LCYB transcript','nmol transcript L⁻¹'],
        ['E','Active LCYB','mg L⁻¹'],
        ['L','Lycopene','µmol L⁻¹'],
        ['B','β-carotene','µmol L⁻¹'],
      ]),
      p('Each rate has the corresponding state unit per day. The solver checks that inputs are finite and nonnegative and that binding and Michaelis constants are positive. These checks protect the calculation; they do not establish that the supplied biological parameters are correct.'),
    ),
    section('What is supported, and what still needs measuring',
      p('Lan et al. report LCYB overexpression, light-response and pigment measurements in D. salina. These observations support studying the LCYB-to-pigment link, but they do not provide every parameter needed to calibrate this regulatory model. A matched project time course is needed to connect regulator, transcript, enzyme and pigment measurements under the same conditions.'),
      p('Mialoundama et al. measured recombinant pepper LCYB activity and an apparent lycopene Km. These values can inform a provisional cross-species range for q_LCYB and Km,LCYB, but they are not D. salina measurements. Regulator concentration, Kd, bound and unbound transcription rates, degradation rates, substrate supply and β-carotene removal remain project-specific inputs to measure.'),
      links(['Lan et al., 2022','https://doi.org/10.4014/jmb.2208.08044'],['Mialoundama et al., 2010','https://doi.org/10.1104/pp.110.155440']),
      customTable('Parameter evidence and units', ['Parameter','Meaning','Unit','Source'], [
        ['sT','Regulatory-factor production','µmol L⁻¹ d⁻¹','Project measurement'],
        ['δT','Regulatory-factor degradation','d⁻¹','Decay experiment or half-life'],
        ['Kd','Regulator–promoter dissociation constant','µmol L⁻¹','Binding experiment'],
        ['uunbound, ubound','Unbound and bound promoter transcription','nmol transcript L⁻¹ d⁻¹','Promoter reporter experiment'],
        ['δm','LCYB RNA degradation','d⁻¹','RNA half-life'],
        ['ktl','Active-enzyme formation per transcript','mg nmol⁻¹ d⁻¹','Protein abundance and translation rate'],
        ['δE','Active-LCYB degradation','d⁻¹','Protein half-life'],
        ['vsupply','Lycopene supply','µmol L⁻¹ d⁻¹','Metabolite time course or flux estimate'],
        ['qLCYB','Maximum rate per active LCYB','µmol mg⁻¹ d⁻¹','Dunaliella assay; plant LCYB prior range'],
        ['Km,LCYB','LCYB Michaelis constant for lycopene','µmol L⁻¹','Enzyme assay'],
        ['kL, kB','First-order pool losses','d⁻¹','Metabolite time course'],
        ['Vout, Km,out','β-carotene outflow capacity and constant','µmol L⁻¹ d⁻¹; µmol L⁻¹','Metabolomics workstream'],
        ['μ','Growth dilution','d⁻¹','Growth curve'],
      ]),
    ),
    section('What the model can currently tell us',
      p('The equations make the proposed design chain explicit: regulator production and stability set T; T and Kd set promoter occupancy; occupancy changes LCYB transcription; translation changes active LCYB; and LCYB changes the lycopene-to-β-carotene flux. This is a testable mechanism, not evidence that each link has already been demonstrated in the engineered strain.'),
      eq('Steady-state regulatory chain', String.raw`T^*=\frac{s_T}{\delta_T+\mu},\quad m^*=\frac{u_{\mathrm{LCYB}}(T^*)}{\delta_m+\mu},\quad E^*=\frac{k_{\mathrm{tl}}m^*}{\delta_E+\mu}`),
      p('With a stated parameter set, the implementation returns conditional trajectories for T, m, E, L and B and compares defined regulator variants. A matched project time course supplies the parameter set for an absolute project-yield prediction.'),
      fig('15_regulatory_response','Promoter occupancy and steady-state transfer from regulatory input to LCYB transcript and active enzyme.', 'Figure 2. A: promoter occupancy as a function of T/Kd; occupancy is 50% when T = Kd. B: the bound-to-unbound transcription ratio and T/Kd jointly determine the steady-state expression transfer. Color gives m*/m*unbound = E*/E*unbound; values above 1 represent activation and values below 1 represent repression. Both axes are parameter ratios fixed by the equations, while absolute trajectories use the measured parameters listed above.'),
      h('Illustrative parameter scenarios'),
      p('The values below are dimensionless model scenarios, not measurements from the engineered strain. Promoter occupancy rises from 10% to 90% as T/Kd rises from 1/9 to 9, an 81-fold span in regulator concentration relative to binding affinity. Half occupancy occurs at T = Kd. Writing r = u_bound/u_unbound, steady-state LCYB transcript and active-enzyme abundance relative to an unbound promoter is 1 + (r − 1)θ. At half occupancy this becomes (1 + r)/2: 1.50-fold for r = 2, 2.50-fold for r = 4, and 0.75-fold for r = 0.5. At T = 10Kd, where occupancy is 90.9%, the corresponding folds are 1.91, 3.73 and 0.55.'),
      p('Occupancy is most sensitive to proportional changes in T near T ≈ Kd. When T is much greater than Kd, the promoter is nearly saturated and expression approaches the ceiling or floor set by r. If lycopene and enzyme-kinetic parameters are held fixed, instantaneous LCYB flux changes in proportion to active enzyme; the β-carotene pool also depends on substrate supply, Michaelis constants, outflow and loss.'),
      eq('Core implementation', String.raw`\begin{aligned}
\theta&=\frac{T}{K_d+T}\\
u_{\mathrm{LCYB}}&=u_{\mathrm{unbound}}(1-\theta)+u_{\mathrm{bound}}\theta\\
v_{\mathrm{LCYB}}&=q_{\mathrm{LCYB}}E\frac{L}{K_{m,\mathrm{LCYB}}+L}\\[4pt]
\frac{dT}{dt}&=s_T-(\delta_T+\mu)T\\
\frac{dm}{dt}&=u_{\mathrm{LCYB}}-(\delta_m+\mu)m\\
\frac{dE}{dt}&=k_{\mathrm{tl}}m-(\delta_E+\mu)E\\
\frac{dL}{dt}&=v_{\mathrm{supply}}-v_{\mathrm{LCYB}}-(k_L+\mu)L\\
\frac{dB}{dt}&=v_{\mathrm{LCYB}}-v_{\mathrm{out}}-(k_B+\mu)B
\end{aligned}`),
    ),
    section('Passing the output to the product models',
      p('The downstream metabolomics model takes β-carotene input flux as its starting point. We use the LCYB rate as the shared boundary, while keeping the four product-specific reaction schemes and parameters in that workstream.'),
      eq('Shared boundary', String.raw`v_{\mathrm{in,BCAR}}(t)=v_{\mathrm{LCYB}}(t)`),
      p('Numerical coupling uses the downstream Vmax, Km, loss constants and initial concentrations from that workstream. The shared boundary assigns each parameter to the measurements that define it.'),
    ),
  ],
};

export const dryLabIndex: WikiPage = {
  title: 'Dry Lab overview', eyebrow: 'Dry Lab', status: 'team-draft',
  intro: 'The Dry Lab combines computational work with reactor design. We start from published light-response data, use a reconstructed Dunaliella salina network to compare four carotenoid-product routes, and examine the LCYB variants and proposed TF2146–DNA interaction behind the design. A five-state model follows a regulatory input through LCYB expression to the β-carotene pool. These analyses help frame experiments; they are not a substitute for wet-lab validation. The hardware work asks how to cultivate the engineered alga in a flat-panel airlift photobioreactor.',
  sections: [
    section('Modeling',
      p('Each page answers a specific design question. Transcriptomics follows sequence-annotated carotenoid enzymes across replicated light conditions and carries the LCYB response into the regulatory model. Metabolomics tests whether the reconstructed network can support the four product branches across eight published A–H conditions, then compares product flux, chassis cost and branch-point effects. Protein analysis screens LCYB variants and examines the proposed TF2146–DNA interaction. The mathematical model links promoter occupancy to LCYB transcript, active enzyme, lycopene and β-carotene. Model outputs guide experiments; they are not measured product titres.'),
      { kind: 'chapter-grid', items: modelingChapters.map(([title, href, text], index) => ({ index: `0${index + 1}`, title, href, text })) },
    ),
    section('Hardware',
      p(
        'The hardware work combines physical photobioreactor design with quantitative engineering analysis. The design page documents the reactor architecture and prototype iterations, while the modeling page explores light transport, cultivation dynamics, scale-up, energy use, and operating conditions.',
      ),
      {
        kind: 'chapter-grid',
        items: [
          {
            index: '05',
            title: 'Hardware Modeling',
            href: '/hardware',
            text: 'Explore light transport, cultivation dynamics, scale-up, energy use, and the interactive PBR model.',
          },
          {
            index: '06',
            title: 'Hardware Design',
            href: '/hardware-design',
            text: 'Explore the physical reactor architecture, prototype iterations, structural design, and final configuration.',
          },
        ],
      },
    ),
  ],
};

export const emptyDryLabPage = (title: string): WikiPage => ({ title, eyebrow: `Dry Lab / ${title}`, intro: '', status: 'structure-only', sections: [] });

const hardwareFig = (
  name: string,
  alt: string,
  caption: string,
): ContentBlock => ({
  kind: 'figure',
  src: `/figures/hardware/${name}.png`,
  alt,
  caption,
});

const hardwareDesignFig = (
  filename: string,
  alt: string,
  caption: string,
): ContentBlock => ({
  kind: 'figure',
  src: `/figures/hardware-design/${filename}`,
  alt,
  caption,
});

export const hardware: WikiPage = {
  title: 'Hardware Modeling',
  eyebrow: 'Dry Lab / Hardware Modeling',
  status: 'team-draft',
  intro:
    'We developed a flat-panel airlift photobioreactor with symmetric double-sided illumination, together with a reduced-order engineering model to explore how reactor design and operating conditions may influence cultivation and production.',
  sections: [
    section(
      'Photobioreactor Design for DunaTerp',
      p(
        'The performance of a photosynthetic production system depends not only on the engineered cells, but also on the physical environment in which they grow. For Dunaliella salina, light delivery, biomass self-shading, mixing, cultivation strategy, and energy consumption are closely connected.',
      ),
      p(
        'Our hardware modeling consists of five connected components: optical transport, cultivation dynamics, two-stage optimization, light–dark cycling, and scale-up with energy consumption.',
      ),
    ),

    section(
      'Optical Transport',
      p(
        'As biomass accumulates, cells absorb and scatter incident light. This creates an uneven light environment inside the reactor: regions near the illuminated surfaces receive stronger light, while deeper regions can become increasingly light-limited. To describe this effect, we modeled light propagation across the flat-panel reactor under symmetric illumination from both transparent faces.',
      ),

      eq(
        'Optical transport under symmetric double-sided illumination',
        String.raw`\begin{aligned}
\frac{d}{dz}
\begin{bmatrix}
I^+(z,t)\\
I^-(z,t)
\end{bmatrix}
&=
X(t)
\begin{bmatrix}
-(k_a+b k_s) & b k_s\\
-b k_s & k_a+b k_s
\end{bmatrix}
\begin{bmatrix}
I^+(z,t)\\
I^-(z,t)
\end{bmatrix}\\[10pt]
I^+(0,t)&=I_F(t),\qquad
I^-(L,t)=I_B(t)\\[4pt]
I_F(t)&=I_B(t)=I_0(t)\\[4pt]
G(z,t)&=I^+(z,t)+I^-(z,t)\\[4pt]
\bar I(t)&=\frac{1}{L}\int_0^L G(z,t)\,dz
\end{aligned}`,
      ),

      customTable(
        'Variables used in the optical transport model',
        ['Symbol', 'Meaning', 'Unit'],
        [
          ['I⁺', 'Forward photon flux inside the flat panel', 'µmol photons m⁻² s⁻¹'],
          ['I⁻', 'Backward photon flux inside the flat panel', 'µmol photons m⁻² s⁻¹'],
          ['I_F', 'Incident irradiance at the front face', 'µmol photons m⁻² s⁻¹'],
          ['I_B', 'Incident irradiance at the rear face', 'µmol photons m⁻² s⁻¹'],
          [
            'I₀',
            'Per-face incident irradiance under symmetric double-sided illumination',
            'µmol photons m⁻² s⁻¹',
          ],
          ['X', 'Biomass concentration', 'g L⁻¹'],
          ['k_a', 'Biomass-specific absorption coefficient', 'm² kg⁻¹'],
          ['k_s', 'Biomass-specific scattering coefficient', 'm² kg⁻¹'],
          ['b', 'Fraction of scattered light redirected backward', 'dimensionless'],
          ['G', 'Total local irradiance', 'µmol photons m⁻² s⁻¹'],
          ['L', 'Reactor optical path / panel thickness', 'm'],
          ['Ī', 'Average irradiance across the optical path', 'µmol photons m⁻² s⁻¹'],
        ],
      ),

      p(
        'The model calculates the spatial light distribution inside the reactor and allows us to examine how biomass concentration and reactor geometry affect internal illumination.',
      ),

      hardwareFig(
        'A_optical_field_heatmap_double_sided',
        'Simulated light field across a flat-panel photobioreactor under symmetric double-sided illumination at different biomass concentrations.',
        'Figure 1. Simulated optical field under symmetric double-sided illumination. Increasing biomass concentration strengthens self-shading and reduces irradiance in the central region of the reactor.',
      ),

      p(
        'The optical field remains approximately symmetric because both large faces receive the same incident irradiance. As biomass increases, however, the centre of the reactor becomes progressively darker. This shows why increasing external illumination alone cannot fully eliminate internal light limitation and why maintaining a short optical path is important for our photobioreactor design.',
      ),
    ),

    section(
      'Cultivation Dynamics',
      p(
        'We next connected the calculated light environment to biomass growth, nutrient consumption, and product formation. The cultivation module describes the dynamic changes of biomass, nutrient availability, and product concentration over time.',
      ),

      eq(
        'Cultivation dynamics',
        String.raw`\begin{aligned}
\frac{d}{dt}
\begin{bmatrix}
X\\
N\\
P
\end{bmatrix}
&=
\begin{bmatrix}
(\mu-k_d)X\\
-\mu X/Y_{X/N}\\
(\alpha\mu+\beta(t))X-k_pP
\end{bmatrix}\\[10pt]
\mu(t)
&=
\mu_{\max}
\frac{g_I(\bar I(t))}{g_I(I_{\mathrm{opt}})}
\frac{N(t)}{K_N+N(t)}\\[4pt]
g_I(I)
&=
\frac{I}{K_I+I+I^2/K_{\mathrm{inh}}}\\[4pt]
I_{\mathrm{opt}}
&=
\sqrt{K_IK_{\mathrm{inh}}}
\end{aligned}`,
      ),

      customTable(
        'Variables used in the cultivation model',
        ['Symbol', 'Meaning', 'Unit'],
        [
          ['X', 'Biomass concentration', 'g L⁻¹'],
          ['N', 'Limiting nutrient concentration', 'g L⁻¹'],
          ['P', 'Target-product concentration', 'mg L⁻¹'],
          ['μ', 'Actual specific growth rate', 'd⁻¹'],
          ['μ_max', 'Maximum specific growth rate', 'd⁻¹'],
          ['k_d', 'Biomass decay / maintenance-loss constant', 'd⁻¹'],
          ['Y_X/N', 'Biomass yield on limiting nutrient', 'g biomass g⁻¹ nutrient'],
          [
            'α',
            'Growth-associated production coefficient',
            'mg product g⁻¹ biomass',
          ],
          [
            'β',
            'Non-growth-associated production coefficient',
            'mg product g⁻¹ biomass d⁻¹',
          ],
          ['k_p', 'Product degradation constant', 'd⁻¹'],
          ['K_N', 'Nutrient half-saturation parameter', 'g L⁻¹'],
          ['K_I', 'Light-saturation parameter', 'µmol photons m⁻² s⁻¹'],
          ['K_inh', 'Photoinhibition parameter', 'µmol photons m⁻² s⁻¹'],
          ['I_opt', 'Predicted optimum irradiance for growth', 'µmol photons m⁻² s⁻¹'],
        ],
      ),

      p(
        'The model includes both light limitation and photoinhibition, so stronger illumination does not necessarily correspond to faster predicted growth. This module therefore links the physical light environment generated by the reactor directly to the biological response of the culture.',
      ),
    ),

    section(
      'Two-Stage Cultivation Strategy',
      p(
        'Conditions that favour rapid biomass accumulation may not be identical to those that favour product formation. We therefore explored a two-stage cultivation strategy. The first stage focuses on biomass growth, while the second represents a production-oriented condition.',
      ),

      eq(
        'Two-stage cultivation and productivity optimization',
        String.raw`\begin{aligned}
\big[I_F(t),I_B(t),\beta(t)\big]
&=
\begin{cases}
[I_g,I_g,\beta_g], & 0\le t<t_s\\
[I_p,I_p,\beta_p], & t_s\le t\le T
\end{cases}\\[10pt]
Q_P(I_g,t_s)
&=
\frac{P(T;I_g,t_s)}{T}\\[4pt]
(I_g^*,t_s^*)
&=
\underset{I_g,t_s}{\arg\max}\;Q_P(I_g,t_s)
\end{aligned}`,
      ),

      customTable(
        'Variables used in the two-stage cultivation model',
        ['Symbol', 'Meaning', 'Unit'],
        [
          [
            'I_g',
            'Per-face irradiance during the growth stage',
            'µmol photons m⁻² s⁻¹',
          ],
          [
            'I_p',
            'Per-face irradiance during the production stage',
            'µmol photons m⁻² s⁻¹',
          ],
          [
            'β_g',
            'Non-growth-associated production coefficient during the growth stage',
            'mg product g⁻¹ biomass d⁻¹',
          ],
          [
            'β_p',
            'Non-growth-associated production coefficient during the production stage',
            'mg product g⁻¹ biomass d⁻¹',
          ],
          ['t_s', 'Switching time from growth to production stage', 'd'],
          ['T', 'Total cultivation time', 'd'],
          ['Q_P', 'Volumetric product productivity', 'mg L⁻¹ d⁻¹'],
          ['P(T)', 'Final product concentration', 'mg L⁻¹'],
        ],
      ),

      p(
        'We explored different combinations of growth-stage illumination and switching time to examine their effects on predicted productivity.',
      ),

      hardwareFig(
        'C_productivity_heatmap_double_sided',
        'Heat map of predicted product productivity across growth-stage irradiance and switching time under double-sided illumination.',
        'Figure 2. Predicted productivity across different combinations of growth-stage per-face irradiance and switching time.',
      ),

      p(
        'The heat map shows that productivity depends on the combined effect of illumination and cultivation timing rather than on either parameter alone. To make the overall design space easier to understand, we also visualized the same response as a three-dimensional surface.',
      ),

      hardwareFig(
        'D_3D_product_surface_double_sided',
        'Three-dimensional response surface showing predicted productivity as a function of growth-stage irradiance and switching time.',
        'Figure 3. Three-dimensional representation of the predicted productivity landscape.',
      ),

      p(
        'Together, these simulations allow cultivation conditions to be treated as an engineering design space instead of selecting operating parameters independently.',
      ),
    ),

    section(
      'Light–Dark Cycling',
      p(
        'Cells inside an airlift photobioreactor continuously move through different regions of the reactor. Gas-driven circulation can carry cells from bright regions near illuminated surfaces into darker internal regions and then back again. As a result, individual cells experience changing light conditions rather than a constant irradiance.',
      ),

      eq(
        'Reduced-order light–dark cycling',
        String.raw`\begin{aligned}
t_{\mathrm{cycle}}
&=
\frac{L_{\mathrm{loop}}}{\bar U}\\[4pt]
t_L
&=
\phi_Lt_{\mathrm{cycle}}\\[4pt]
t_D
&=
(1-\phi_L)t_{\mathrm{cycle}}\\[4pt]
f_{I,\mathrm{cycle}}
&=
\phi_Lf_I(I_L)
+
(1-\phi_L)f_I(I_D)\\[4pt]
\mu_{\mathrm{cycle}}
&=
\mu_{\max}
f_{I,\mathrm{cycle}}
\frac{N}{K_N+N}
\end{aligned}`,
      ),

      customTable(
        'Variables used in the light–dark cycling model',
        ['Symbol', 'Meaning', 'Unit'],
        [
          ['t_cycle', 'Time for one representative circulation cycle', 's'],
          ['L_loop', 'Representative circulation-path length', 'm'],
          ['Ū', 'Mean liquid velocity', 'm s⁻¹'],
          ['φ_L', 'Fraction of the circulation cycle spent in bright regions', 'dimensionless'],
          ['t_L', 'Residence time in the bright region per cycle', 's'],
          ['t_D', 'Residence time in the dark region per cycle', 's'],
          ['I_L', 'Representative irradiance in the bright region', 'µmol photons m⁻² s⁻¹'],
          ['I_D', 'Representative irradiance in the dark region', 'µmol photons m⁻² s⁻¹'],
          ['f_I,cycle', 'Effective light-response factor over one circulation cycle', 'dimensionless'],
          ['μ_cycle', 'Effective specific growth rate under light–dark cycling', 'd⁻¹'],
        ],
      ),

      p(
        'This reduced representation connects reactor hydrodynamics to cellular light exposure without requiring a full CFD simulation. In our design, mixing therefore contributes not only to gas and nutrient transfer, but also to light management.',
      ),
    ),

    section(
      'Scale-Up and Energy Consumption',
      p(
        'Simply increasing photobioreactor thickness can increase the optical path and worsen self-shading. We therefore considered numbering-up as the main scale-up strategy, increasing total production capacity by operating multiple similar flat-panel modules while maintaining the optical characteristics of each module.',
      ),

      eq(
        'Scale-up, energy consumption and simplified economic outputs',
        String.raw`\begin{aligned}
V_m
&=
AL\\[4pt]
\frac{A_{\mathrm{ill}}}{V_m}
&=
\frac{2}{L}\\[4pt]
n
&=
\left\lceil
\frac{V_T}{AL}
\right\rceil\\[4pt]
Q_{g,T}
&=
nQ_{g,m}\\[4pt]
E_{\mathrm{LED}}
&=
\frac{2nA}{\eta_{\mathrm{LED}}}
\Big[
I_gt_s+I_p(T-t_s)
\Big]\\[4pt]
M_{\mathrm{annual}}
&=
\eta_RP(T)V_T
\frac{365}{T+t_{\mathrm{turn}}}\\[4pt]
\Pi
&=
pM_{\mathrm{annual}}-OPEX\\[4pt]
ROI
&=
\frac{\Pi}{CAPEX}\\[4pt]
T_{\mathrm{payback}}
&=
\frac{CAPEX}{\Pi}
\end{aligned}`,
      ),

      customTable(
        'Variables used in scale-up and consumption estimates',
        ['Symbol', 'Meaning', 'Unit'],
        [
          ['V_m', 'Working volume of one flat-panel module', 'm³'],
          ['A', 'Large-face area of one module', 'm²'],
          ['L', 'Panel thickness / optical path length', 'm'],
          ['A_ill', 'Total illuminated area of one module', 'm²'],
          ['V_T', 'Target total working volume', 'm³'],
          ['n', 'Required number of modules', 'dimensionless'],
          ['Q_g,T', 'Total gas volumetric flow after numbering-up', 'm³ s⁻¹'],
          ['Q_g,m', 'Gas volumetric flow for one module', 'm³ s⁻¹'],
          ['E_LED', 'LED energy consumption', 'model-dependent energy unit'],
          ['η_LED', 'LED photon efficacy', 'µmol photons J⁻¹'],
          ['η_R', 'Downstream recovery fraction', 'dimensionless'],
          ['M_annual', 'Annual recovered product mass', 'kg year⁻¹'],
          ['t_turn', 'Turnaround time between cultivation batches', 'd'],
          ['p', 'Product selling price', 'USD kg⁻¹'],
          ['Π', 'Annual operating profit', 'USD year⁻¹'],
          ['OPEX', 'Annual operating expenditure', 'USD year⁻¹'],
          ['CAPEX', 'Capital expenditure', 'USD'],
          ['ROI', 'Return on investment', 'year⁻¹'],
          ['T_payback', 'Simple payback time', 'year'],
        ],
      ),

      p(
        'This part of the model highlights the trade-off between biological performance and engineering cost. Higher illumination may improve cultivation under some conditions, but it also increases electricity consumption. Therefore, the condition producing the highest biological output is not necessarily the most attractive engineering condition.',
      ),
    ),

    section(
      'Interactive Hardware Design Tool',
      p(
        'To make the model easier to explore, we developed an interactive browser-based PBR tool. Users can modify key reactor and cultivation parameters and immediately observe how the predicted system response changes.',
      ),
      { kind: 'pbr-widget' },
      p(
        'The tool runs directly in the browser without requiring a Python backend. Instead of presenting only one fixed parameter set, the interactive interface allows users to explore how different assumptions affect the predicted reactor behaviour.',
      ),
    ),

    section(
      'Scope and Limitations',
      p(
        'Our model is intended as a reduced-order engineering framework for scenario exploration, rather than a fully experimentally calibrated digital twin.',
      ),
      p(
        'The optical module simplifies radiative transport, while the circulation module represents hydrodynamics using characteristic parameters rather than full CFD.',
      ),
      p(
        'Most kinetic, product, and economic parameters in the current implementation are illustrative nominal values rather than direct measurements from the final engineered strain.',
      ),
      p(
        'The model is therefore primarily used to explore engineering relationships, compare operating scenarios, identify influential parameters, and visualize trade-offs between light, growth, productivity, and energy consumption. Future experimental measurements could be used to further calibrate and validate the model.',
      ),
    ),
  ],
};

export const hardwareDesign: WikiPage = {
  title: 'Hardware Design',
  eyebrow: 'Dry Lab / Hardware Design',
  status: 'team-draft',
  intro:
    'To support Dunaliella cultivation, we designed a flat-panel airlift photobioreactor centered on a serpentine culture chamber and bubble-driven circulation of the culture medium.',
  sections: [
    section(
      'Reactor Architecture and Working Principle',
      p(
        'For photosynthetic Dunaliella, reactor design should account for light availability, inorganic carbon supply, gas exchange, culture mixing, and the compatibility of materials and seals with saline media. For light supply, individual cells experience light according to both external illumination and their movement through the culture. We therefore designed the reactor to promote mixing through bubble-driven circulation and facilitate cell movement between well-lit regions near the transparent walls and darker regions within the culture, with the aim of creating light–dark exposure patterns that may benefit cultivation.',
      ),
      p(
        'The reactor consists of two transparent PMMA plates designed for CNC machining. The transparent walls allow external illumination and observation of the interior, while the split construction provides access for cleaning and maintenance. The chamber integrates three functional regions: a bottom pressure-equalization and gas-distribution region, a central culture zone, and a top gas–liquid separation region. Silicone gaskets are incorporated at the plate interface, and polymer bulkhead fittings connect the gas and liquid lines.',
      ),
      p(
        'For the central culture zone, the serpentine geometry guides circulation driven by rising gas bubbles. Gas introduced through the bottom distribution region transfers momentum to the surrounding culture medium, while internal flow-guiding structures direct the resulting liquid motion and are intended to establish local recirculation. This arrangement is designed to promote mixing without a separate mechanical impeller. At the top, an enlarged gas–liquid separation region provides space for gas disengagement and discharge, integrating gas introduction, bubble-driven circulation, and gas release within a single reactor body.',
      ),
    ),

    section(
      'Single-Unit Concept — Initial Geometry for CFD',
      p(
        'Our design process began with a simplified single-unit model developed in CATIA for preliminary CFD analysis. The geometry contained a single curved flow-guiding section, allowing us to investigate how rising bubbles interact with the surrounding liquid and internal walls. This stage focused on the basic hydrodynamic concept: using gas-driven liquid motion to promote circulation and mixing without a mechanical impeller. The simplified model provided a starting point for developing a larger serpentine culture chamber.',
      ),
      hardwareDesignFig(
        'First_Generation_Flat_Panel_Airlift_Reactor_Single_Unit.JPG',
        'Simplified single-unit flat-panel airlift reactor geometry developed for preliminary CFD analysis.',
        'Figure 1. First-generation single-unit concept used to establish the basic bubble-driven circulation geometry.',
      ),
    ),

    section(
      'Initial Prototype — Piled Cultivation Chamber',
      p(
        'The initial full-panel prototype extended the single-unit concept into a series of connected flow-guiding sections. Developed in SolidWorks, this version established the reactor’s main functional layout: a bottom pressure-equalization and gas-distribution region, a central serpentine culture chamber, and a top gas–liquid separation region. The internal geometry was intended to guide bubble-driven liquid motion through the culture chamber while providing space for gas distribution and release. This iteration connected the preliminary flow concept with the overall architecture of a flat-panel photobioreactor.',
      ),
      hardwareDesignFig(
        'Reactor_V1_Initial_Prototype.JPG',
        'Initial full-panel prototype showing the connected serpentine cultivation chamber and functional reactor regions.',
        'Figure 2. Reactor V1 initial prototype extending the single-unit circulation concept into a complete flat-panel architecture.',
      ),
    ),

    section(
      'Laboratory Prototype — Assembly and Sealing',
      p(
        'The laboratory prototype translated the functional layout into a two-part split design, with complementary plates enclosing the culture chamber. Fastening holes and internal support locations were incorporated, and silicone gaskets were introduced to seal the mating surfaces. These features were intended to support secure assembly while allowing the chamber to be opened for cleaning, inspection, and component replacement. This stage shifted the design focus toward practical laboratory use, particularly the integration of the flow geometry with fastening, sealing, and fluid connections.',
      ),
      hardwareDesignFig(
        'Reactor_V2_Lab_Prototype.JPG',
        'Laboratory prototype showing the split-plate construction, fastening layout, and sealing features.',
        'Figure 3. Reactor V2 laboratory prototype integrating assembly, sealing, and maintainability into the flat-panel design.',
      ),
    ),

    section(
      'Production Design — Fastening Refinement and Wall-Thickness Optimization',
      p(
        'The final design refined the split-plate reactor for CNC machining from transparent PMMA. AI-assisted design exploration was used to refine the screw layout, considering fastening distribution, sealing support, and clearance around the culture channels and connection ports. Material-removal pockets on the outer surfaces were introduced to reduce the thickness of PMMA in consideration of both optical transmission and the mounting requirements of bulkhead fittings. The connection features were also adapted to existing polymer bulkhead fittings. As shown in the drawing, the culture-facing side of Plate A retains the serpentine flow-guiding geometry, bringing the circulation concept together with the requirements of fabrication and assembly.',
      ),
      hardwareDesignFig(
        'Reactor_V3_Plate_A_Culture_Facing_Side_Vertical.JPG',
        'Final Plate A design showing the culture-facing serpentine geometry, fastening layout, and machining refinements.',
        'Figure 4. Reactor V3 production design integrating the circulation geometry with CNC fabrication, sealing, fastening, and connection requirements.',
      ),
    ),
  ],
};
