import type { WikiPage } from '../site-data';
import type { ContentBlock } from './types';

const p = (text: string): ContentBlock => ({ kind: 'paragraph', text });
const eq = (label: string, text: string): ContentBlock => ({ kind: 'equation', label, text });
const table = (caption: string, columns: string[], rows: string[][], collapsed = false): ContentBlock => ({ kind: 'table', caption, columns, rows, collapsed });

export const safety: WikiPage = {
  title: 'Salt-responsive containment',
  eyebrow: 'Safety & Security',
  status: 'team-draft',
  intro: 'We explore whether a change in salinity could help limit the persistence of engineered Dunaliella salina outside cultivation. Literature guides the design; a simple model tests the conditions under which it could work.',
  sections: [
    { title: 'Why use salinity?', body: '', blocks: [
      p('DunaTerp is designed around a salt-adapted microalga. A fall in salinity offers a possible signal that cells have left their intended cultivation environment. However, Dunaliella can tolerate a broad range of salinities, so low salt cannot be treated as a reliable means of inactivation on its own. The range also varies with the organism and its acclimation history [1].'),
      p('Our containment concept uses salinity to regulate an effector response. We examine both growth inhibition and an assumed lethal effect, because stopping growth and reducing the number of viable cells lead to different outcomes.'),
      { kind: 'safety-overview' },
      p('The current work establishes a design and a computational assessment. Physical containment, waste treatment and incident procedures remain necessary parts of the project; this model does not establish that a biological safeguard can replace them.'),
    ] },
    { title: 'From salt sensing to a cellular response', body: '', blocks: [
      p('DCA1 provides a starting point for salt-responsive regulation. Li et al. observed increased DCA1 expression between 0.5 and 2 M NaCl, followed by a decrease at 3 M. This supports salt-dependent control, with a response that is more complex than a simple high-salt on/off switch [2].'),
      p('The proposed design combines salt-responsive suppression of MazF with MazE-mediated antagonism. Its intended behavior is low effective toxicity during cultivation and increased activity after a fall in salinity. Host expression, RNA-mediated suppression and the balance between MazF and MazE remain unresolved at this stage.'),
      p('MazF cleaves RNA and inhibits translation in the systems studied by Zhang et al. Their eukaryotic evidence comes from a cell-free translation system, rather than living Dunaliella cells [3]. We therefore keep growth inhibition and conditional killing as separate model cases.'),
      p('To assess the overall design without assigning unmeasured rates to every molecular step, the model uses one effective activity variable, x. It summarizes circuit behavior; it is not a measured MazF concentration.'),
    ] },
    { title: 'What the model shows', body: '', blocks: [
      p('We compare the same salinity change in two environments. In the first, cells are retained while salinity falls. In the second, incoming cell-free water changes both salinity and local cell concentration. Each environment is tested with no effective switch, growth inhibition alone and a conditional lethal response.'),
      { kind: 'safety-results' },
      p('T99 is the first time the modeled concentration falls to 1% of its initial value. It includes growth, assumed mortality and transport. The retained-cell baseline reaches T90 at 8.3 h and T99 at 13.2 h only in the conditional-killing case. These times describe the specified scenario, rather than a measured clearance time for the engineered strain.'),
    ] },
    { title: 'Which assumptions matter?', body: '', blocks: [
      p('A useful containment design must be assessed beyond its baseline. We varied response delay, effective activity, mortality and the receiving environment. The comparisons below change one input at a time in the retained-cell, conditional-killing case.'),
      table('Selected sensitivity results · T99 for a 48 h simulation', ['Change from baseline', 'Setting', 'T99'], [
        ['Baseline', 'No response delay; external salt 0.05 M', '13.2 h'],
        ['Delayed response', '6 h delay', '19.1 h'],
        ['Delayed response', '24 h delay', '37.1 h'],
        ['Lower maximum mortality', 'Half the assumed baseline rate', '22.8 h'],
        ['Higher maximum mortality', 'Twice the assumed baseline rate', '8.3 h'],
        ['Slower salt change', 'Relaxation rate 0.1 h⁻¹', '27.0 h'],
        ['More saline surroundings', 'External salt 0.50 M', '38.4 h'],
        ['More saline surroundings', 'External salt 0.70 M', 'Not reached within 48 h'],
      ]),
      p('Delay, assumed mortality and the receiving salinity substantially change the result. The 0.5× and 2× changes are mathematical stress tests, and the 6 h and 24 h delays are chosen scenarios. They are not measured ranges or confidence intervals.'),
      p('Cultivation also deserves attention. At constant 1.50 M NaCl, the baseline lethal model predicts a small residual effect and an equilibrium density of about 0.962 times the assumed carrying capacity. This calculation identifies a possible production trade-off; it does not estimate an observed biomass or product loss.'),
    ] },
    { title: 'Parameter choices and their sources', body: '', blocks: [
      p('We use literature to set the biological context and choose plausible scenarios. Where the available studies do not constrain a parameter, we state the assumption and examine its consequences.'),
      table('Evidence used to choose the model inputs', ['Input', 'Choice and rationale', 'Scope of the evidence'], [
        ['Cultivation salinity', '1.50 M NaCl. Farhat et al. found favorable growth at 1.5–3.0 M in their isolate [4].', 'Supports a cultivation scenario; not a universal optimum.'],
        ['Growth-rate amplitude', '0.28 d⁻¹ baseline; 0.14–0.83 d⁻¹ explored using the range in Gómez & González [5].', 'Cross-strain and cross-condition comparison. Reported divisions/day were converted using μ = ln(2)k.'],
        ['Salt-responsive regulation', 'DCA1 salt regulation motivates the sensing concept [2].', 'Does not establish the full low-salt response curve.'],
        ['Effector mechanism', 'MazF-mediated translation inhibition motivates the effector concept [3].', 'Does not supply a mortality rate in Dunaliella.'],
        ['Circuit kinetics and environment', 'Effective response, delay and salt relaxation are explicit design assumptions.', 'Used to explore requirements and failure cases.'],
      ]),
      table('Full baseline parameter set', ['Parameter', 'Value', 'Role / source'], [
        ['Sprod / Senv', '1.50 / 0.05 M', 'Cultivation scenario / low-salt stress scenario'],
        ['kmix', '1 h⁻¹', 'Assumed salt relaxation rate'],
        ['μmax', '0.28 d⁻¹', 'Historical scenario amplitude; not a strain-specific fit'],
        ['Sopt / σ', '1.75 / 0.75 M', 'Assumed shape of the salinity–growth curve'],
        ['KS / q / L', '0.27 M / 3 / 0', 'Assumed half-response scale, Hill slope and leak'],
        ['β / δ', '1 / 0.20 h⁻¹', 'Effective activity generation / relaxation'],
        ['dmax / m', '0.50 h⁻¹ / 2', 'Conditional mortality rate and response exponent'],
        ['Kn / n0 / x0', '1 / 0.5 / 0', 'Normalized carrying capacity, initial concentration and activity'],
        ['D', '0 or 1 h⁻¹', 'Cell retention or ideal water exchange'],
      ], true),
    ] },
    { title: 'Model formulation', body: '', blocks: [
      p('Salinity S relaxes toward the receiving-environment value. A decreasing Hill function represents the intended effective circuit response. The normalized concentration n = C/Cref changes through growth, conditional mortality and washout. The reference concentration Cref is unspecified, so n is not converted into a number of surviving cells.'),
      eq('Salinity and effective circuit activity', String.raw`S(t)=S_{\rm env}+(S_{\rm prod}-S_{\rm env})e^{-k_{\rm mix}t}\qquad A(S)=L+\frac{1-L}{1+(S/K_S)^q}`),
      eq('Activity and concentration dynamics', String.raw`\frac{dx}{dt}=\beta A(S)-\delta x\qquad\frac{dn}{dt}=\left[\mu_{\rm eff}(S,x)\left(1-\frac{n}{K_n}\right)-d_{\rm eff}(x)-D\right]n`),
      eq('Growth and conditional mortality functions', String.raw`\mu(S)=\mu_{\max}e^{-\frac{(S-S_{\rm opt})^2}{2\sigma^2}}\qquad d(x)=d_{\max}\frac{x^m}{1+x^m}`),
      table('Three alternative biological responses', ['Case', 'Effective growth', 'Extra mortality'], [
        ['No effective switch', 'μ(S)', '0'], ['Growth inhibition only', 'μ(S)/(1 + xᵐ)', '0'], ['Conditional killing', 'μ(S)', 'd(x)'],
      ]),
      p('Time is measured in hours; the daily growth-rate input is divided by 24 before integration. The notebook solves the concentration in logarithmic form. It tracks accumulated growth G, mortality H and washout W separately and checks ln(n/n0) = G − H − W. Further checks compare the salinity and pure-washout solutions with their analytic expressions and examine numerical tolerance. These checks establish computational consistency within the model.'),
    ] },
    { title: 'Implications for the project', body: '', blocks: [
      p('The model identifies three priorities for evaluation: how quickly the full circuit responds to a fall in salinity, whether the response causes recoverable growth arrest or loss of viability, and whether residual activity affects cultivation. These questions matter more to the present design than refining a single predicted clearance time.'),
      p('A practical assessment must also account for weakly responding cells, genetic failure and recovery after conditions change. The present average-cell model does not estimate those outcomes or extinction probability. Its strongest use is to identify the conditions a safeguard would have to meet and the observations that would most change our design decisions.'),
      p('This page documents the biological-containment design and modeling work. Project-specific strain and construct records, laboratory controls, waste procedures and approved safety documentation will provide the operational part of the safety assessment.'),
    ] },
    { title: 'References', body: '', blocks: [
      p('[1] Chen H & Jiang J-G. Osmotic Responses of Dunaliella to the Changes of Salinity. Journal of Cellular Physiology 219:251–258 (2009). Review context: pp. 251–252 and Fig. 1.'),
      p('[2] Li J, Lu Y, Xue L & Xie H. A structurally novel salt-regulated promoter of duplicated carbonic anhydrase gene 1 from Dunaliella salina. Molecular Biology Reports 37:1143–1154 (2010). Salt-response evidence: Figs. 3, 7 and 8.'),
      p('[3] Zhang Y et al. MazF Cleaves Cellular mRNAs Specifically at ACA to Block Protein Synthesis in Escherichia coli. Molecular Cell 12:913–923 (2003). Mechanism and cell-free translation evidence: Figs. 2–3.'),
      p('[4] Farhat N et al. Optimization of salt concentrations for a higher carotenoid production in Dunaliella salina (Chlorophyceae). Journal of Phycology 47:1072–1077 (2011). Used for qualitative salinity guidance; absolute densities were not fitted.'),
      p('[5] Gómez PI & González MA. The effect of temperature and irradiance on the growth and carotenogenic capacity of seven strains of Dunaliella salina (Chlorophyta) cultivated under laboratory conditions. Biological Research 38:151–162 (2005). Growth definition and Table II.'),
      { kind: 'links', links: [
        { label: 'Chen & Jiang · DOI', href: 'https://doi.org/10.1002/jcp.21715' },
        { label: 'Li et al. · DOI', href: 'https://doi.org/10.1007/s11033-009-9901-z' },
        { label: 'Farhat et al. · DOI', href: 'https://doi.org/10.1111/j.1529-8817.2011.01036.x' },
      ] },
    ] },
  ],
};
