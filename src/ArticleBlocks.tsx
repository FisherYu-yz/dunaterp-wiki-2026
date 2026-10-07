import { lazy, Suspense } from 'react';
import { Link } from 'react-router-dom';
import katex from 'katex';
import type { ContentBlock } from './content/types';
import { PBRWidget } from './PBRWidget';
import { SafetyOverview, SafetyResults } from './SafetyEvidence';
import 'katex/dist/katex.min.css';
import './article-blocks.css';

const DockingViewer = lazy(() => import('./DockingViewer').then(module => ({ default: module.DockingViewer })));

function resolveAsset(src: string) {
  if (/^(?:https?:|data:|blob:|\/\/)/i.test(src)) return src;
  return `${import.meta.env.BASE_URL}${src.replace(/^\/+/, '')}`;
}

function DataTable({ block }: { block: Extract<ContentBlock, { kind: 'table' }> }) {
  const content = <div className="research-table-scroll" role="region" aria-label={block.caption} tabIndex={0}>
    <table><caption>{block.caption}</caption><thead><tr>{block.columns.map((name) => <th key={name} scope="col">{name}</th>)}</tr></thead>
      <tbody>{block.rows.map((row, i) => <tr key={i}>{row.map((cell, j) => {
        const value = /^https?:\/\//.test(cell) ? <a href={cell}>Reference ↗</a> : cell;
        return j === 0 ? <th scope="row" key={j}>{value}</th> : <td key={j}>{value}</td>;
      })}</tr>)}</tbody>
    </table>
  </div>;
  return block.collapsed ? <details className="research-table-details"><summary>{block.caption} <span>({block.rows.length} rows)</span></summary>{content}</details> : content;
}

function renderEquation(text: string): string | null {
  try {
    return katex.renderToString(text, { displayMode: true, throwOnError: true, trust: false });
  } catch {
    return null;
  }
}

function Equation({ block }: { block: Extract<ContentBlock, { kind: 'equation' }> }) {
  const html = renderEquation(block.text);
  if (html === null) return <div className="research-equation research-equation-error" role="region" aria-label={block.label} tabIndex={0}><pre>{block.text}</pre></div>;
  return <div className="research-equation" role="region" aria-label={block.label} tabIndex={0} dangerouslySetInnerHTML={{ __html: html }} />;
}

function ResearchFigure({ figure, compact = false }: { figure: { src: string; alt: string; caption: string }; compact?: boolean }) {
  return <figure className={`feature-figure research-figure${compact ? ' research-figure--compact' : ''}`}>
    <a href={resolveAsset(figure.src)} aria-label={`Open full-size figure: ${figure.alt}`}><img src={resolveAsset(figure.src)} alt={figure.alt} loading="lazy" decoding="async" /></a>
    <figcaption>{figure.caption}<span className="figure-credit">Team analysis figure · CC BY 4.0</span></figcaption>
  </figure>;
}

export function ArticleBlocks({ blocks }: { blocks: ContentBlock[] }) {
  return <div className="research-blocks">{blocks.map((block, i) => {
    switch (block.kind) {
      case 'paragraph': return <p key={i}>{block.text}</p>;
      case 'heading': return <h3 key={i}>{block.text}</h3>;
      case 'equation': return <Equation key={i} block={block} />;
      case 'code': return <div className="research-code" key={i}><p>{block.label}</p><pre tabIndex={0}><code>{block.text}</code></pre></div>;
      case 'figure': return <ResearchFigure key={i} figure={block} />;
      case 'figure-grid': return <div className="research-figure-grid" key={i}>{block.figures.map((figure) => <ResearchFigure key={figure.src} figure={figure} compact />)}</div>;
      case 'chapter-grid': return <div className="research-chapter-grid" key={i}>{block.items.map((item) => <Link className="research-chapter-card" to={item.href} key={item.href}><span>{item.index}</span><div><h3>{item.title}</h3><p>{item.text}</p></div><b aria-hidden="true">↗</b></Link>)}</div>;
      case 'table': return <DataTable key={i} block={block} />;
      case 'links': return <ul className="research-links" key={i}>{block.links.map(({label,href}) => <li key={href}>{href.startsWith('/') ? <Link to={href}>{label} ↗</Link> : <a href={href}>{label} ↗</a>}</li>)}</ul>;
      case 'docking-viewer': return <Suspense key={i} fallback={<p>Loading 3D docking view…</p>}><DockingViewer /></Suspense>;
      case 'pbr-widget': return <PBRWidget key={i} />;
      case 'safety-overview': return <SafetyOverview key={i} />;
      case 'safety-results': return <SafetyResults key={i} />;
    }
  })}</div>;
}
