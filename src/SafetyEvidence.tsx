import { useState } from 'react';
import './safety.css';

export function SafetyOverview() {
  return <div className="safety-overview" aria-label="Proposed salt-responsive containment concept">
    <p className="safety-kicker">DESIGN CONCEPT</p>
    <div className="safety-flow">
      <div><span>01 / ENVIRONMENT</span><h3>A fall in salinity</h3><p>Salinity is the environmental input. Salt adaptation alone does not guarantee containment.</p></div>
      <div><span>02 / RESPONSE</span><h3>Release suppression</h3><p>The proposed circuit translates lower salinity into greater effective activity of the effector.</p></div>
      <div><span>03 / OUTCOME</span><h3>Limit persistence</h3><p>We compare growth arrest and conditional killing to see which outcomes the design would require.</p></div>
    </div>
    <p className="safety-footnote">The model represents the circuit as an effective response. Its molecular components have not been individually fitted in engineered Dunaliella.</p>
  </div>;
}

const cases = [
  { label: 'No effective switch', retained: null, exchange: 4.6, color: 'neutral' },
  { label: 'Growth inhibition only', retained: null, exchange: 4.6, color: 'light' },
  { label: 'Conditional killing', retained: 13.2, exchange: 4.1, color: 'dark' },
] as const;

export function SafetyResults() {
  const [environment, setEnvironment] = useState<'retained' | 'exchange'>('retained');
  return <div className="safety-results">
    <div className="safety-results-header"><div><p className="safety-kicker">BASELINE SCENARIOS</p><h3>What lowers cell concentration?</h3></div><span className="safety-tag">Model output</span></div>
    <div className="safety-switch" role="group" aria-label="Environmental scenario">
      <button aria-pressed={environment === 'retained'} onClick={() => setEnvironment('retained')}>Cells retained <span>D = 0</span></button>
      <button aria-pressed={environment === 'exchange'} onClick={() => setEnvironment('exchange')}>Water exchange <span>D = 1 h⁻¹</span></button>
    </div>
    <p className="safety-scenario-description">{environment === 'retained' ? 'Salinity falls while cells remain in the system. This isolates the modeled biological response.' : 'A fixed-volume, well-mixed system receives cell-free water. Cells are carried out as water is exchanged.'}</p>
    <p className="safety-axis-label">Time to a 99% decrease in local cell concentration · hours</p>
    <div className="safety-bars" aria-live="polite">{cases.map(row => {
      const value = row[environment];
      return <div className="safety-bar-row" key={row.label}><span>{row.label}</span><div className="safety-bar-track">{value === null ? <div className="safety-unreached">Not reached within 48 h</div> : <><div className={`safety-bar ${row.color}`} style={{ width: `${value / 48 * 100}%` }} /><strong style={{ left: `${value / 48 * 100}%` }}>{value.toFixed(1)} h</strong></>}</div></div>;
    })}<div className="safety-ticks"><span>0</span><span>12</span><span>24</span><span>36</span><span>48 h</span></div></div>
    <div className="safety-interpretation"><strong>{environment === 'retained' ? 'Growth arrest alone does not clear the retained population.' : 'Washout can dominate the concentration result.'}</strong><p>{environment === 'retained' ? 'Only the assumed lethal response reaches T99 in this baseline. The 13.2 h result depends on the chosen response and mortality parameters.' : 'Even without an effective switch, T99 is 4.6 h. A falling local concentration therefore cannot, by itself, demonstrate cell death or successful biological containment.'}</p></div>
    <p className="safety-footnote">Both scenarios: 1.50 → 0.05 M NaCl; salinity relaxation 1 h⁻¹; zero initial effective activity.</p>
  </div>;
}
