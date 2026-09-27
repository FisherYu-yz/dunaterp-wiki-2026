import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { createServer } from 'vite';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';

const server = await createServer({ server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom' });
try {
  const { pages, navigation, pageOrder } = await server.ssrLoadModule('/src/site-data.ts');
  const { ArticleBlocks } = await server.ssrLoadModule('/src/ArticleBlocks.tsx');
  const items = navigation.find(g => g.label === 'Dry Lab').items;
  assert.deepEqual(items.map(([label]) => label), ['Transcriptomics','Metabolomics','Protein','Mathematical Modeling','Hardware']);
  assert.equal(new Set(pageOrder).size, pageOrder.length);
  for (const [, href] of items) assert(pages[href.slice(1)], `Missing route ${href}`);
  for (const slug of ['metabolomics','hardware']) {
    assert.equal(pages[slug].sections.length, 0);
    assert.equal(pages[slug].intro, '');
  }
  assert.equal(pages.protein.sections.length, 9);
  assert.match(pages.protein.intro, /LCYB.*DsTF2146/);
  assert.deepEqual(pages.protein.sections.map(section => section.title), [
    'Workflow at a glance', 'Track I — LCYB structure and design objective',
    'Pocket discovery, docking and candidate selection', 'F404Y emerged as the first LCYB validation candidate',
    'WT and F404Y: completed 5 ns pilot MD', 'Track II — DsTF2146 sequence and domain architecture',
    'Truncation and mutation design for DsTF2146', 'DNA substrate selection and docking quality control',
    'Engineering conclusions and next cycle',
  ]);
  assert.match(JSON.stringify(pages.protein), /CB-Dock2/);
  assert.match(JSON.stringify(pages.protein), /FoldX/);
  assert.match(JSON.stringify(pages.protein), /Gln362/);
  let figures = 0;
  let tables = 0;
  for (const slug of ['dry-lab','transcriptomics','model','protein']) {
    const page = pages[slug];
    assert(!/[\u3400-\u9fff]/u.test(JSON.stringify(page)), `Non-English content: ${slug}`);
    for (const section of page.sections) {
      for (const block of section.blocks ?? []) {
        if (block.kind === 'figure') {
          figures++;
          assert(fs.existsSync(path.join('public', block.src)), `Missing ${block.src}`);
          assert(block.alt && block.caption);
        }
        if (block.kind === 'table') {
          tables++;
          assert(block.rows.every(row => row.length === block.columns.length), block.caption);
        }
        if (block.kind === 'links') for (const link of block.links) {
          if (link.href.startsWith('/')) assert(pages[link.href.slice(1)], link.href);
          else assert.equal(new URL(link.href).protocol, 'https:');
        }
      }
      const html = renderToStaticMarkup(React.createElement(MemoryRouter, null,
        React.createElement(ArticleBlocks, { blocks: section.blocks ?? [] })));
      assert(!html.includes('undefined'), section.title);
      assert(!html.includes('src="/figures/'), 'Figure omitted deployment base');
      assert(!html.includes('research-equation-error'), `Equation failed to render: ${section.title}`);
    }
  }
  const data = JSON.parse(fs.readFileSync('src/content/dry-lab-tables.json','utf8'));
  assert.equal(data.TF_RANKING.rows.length,333);
  data.TF_RANKING.rows.forEach((row,i)=>assert.equal(Number(row[0]), i+1));
  assert.equal(data.RECOVERY.rows.length,16);
  for (const obsolete of ['PARAMETERS','FIT','ENDPOINTS','ELASTICITY','ROBUSTNESS','BOUNDS']) {
    assert(!data[obsolete], `Obsolete model table remains: ${obsolete}`);
  }
  const ode = pages.model.sections.flatMap(s=>s.blocks ?? []).find(b=>b.kind==='equation' && b.label==='Regulatory LCYB model');
  assert.equal((ode.text.match(/\\frac\{d/g) ?? []).length,5);
  assert.deepEqual(pages.model.sections.map(section => section.title), [
    'Modeling question','Promoter occupancy and transcription','Five differential equations',
    'Evidence and parameter status','What the model establishes','Interface with metabolomics',
  ]);
  assert(!/day-7|2\.0988|10\.9518|Car09|nine-state|FBA/i.test(JSON.stringify(pages.model)), 'Obsolete quantitative claim remains');
  for (const slug of ['transcriptomics','model']) {
    const captions = pages[slug].sections.flatMap(s => s.blocks ?? []).filter(b => b.kind === 'figure').map(b => b.caption);
    captions.forEach((caption, i) => assert(caption.startsWith('Figure ' + (i + 1) + '.'), 'Figure numbering in ' + slug + ': ' + caption));
  }
  assert(!pages.model.sections.some(section => /CPP/i.test(JSON.stringify(section))), 'Unverified CPP regulator remains in modeling');
  assert(!pages.transcriptomics.sections.some(section => section.title.startsWith('CPP')), 'CPP-only chapter remains');
  for (const oldFigure of ['branch-allocation.png','light-intensity-pca.png','dry-lab/02_tf_candidates.png']) {
    assert(!fs.existsSync(path.join('public/figures', oldFigure)), 'Obsolete figure remains: ' + oldFigure);
  }
  const provenance = JSON.parse(fs.readFileSync('src/content/dry-lab-provenance.json','utf8'));
  for (const [file, hash] of Object.entries(provenance.figure_sha256)) {
    assert.equal(createHash('sha256').update(fs.readFileSync(`public/figures/dry-lab/${file}`)).digest('hex'), hash);
  }
  assert.equal(figures,12);
  assert(pages.protein.sections[2].blocks.some(block => block.kind === 'table' && block.caption === 'CB-Dock2 cavity screen'));
  assert(pages.protein.sections[2].blocks.some(block => block.kind === 'table' && block.caption === 'LCYB FoldX structural-tolerance screen'));
  for (const [sectionIndex, figure] of [
    [1, 'lycopene-cyclase-structure-1'], [1, 'lycopene-cyclase-structure-2'], [1, 'lycopene-cyclase-structure-3'],
    [5, 'cxc-domain-structure-4'],
    [7, 'dna-logo'], [7, 'protein-dna-docking'],
  ]) {
    assert(pages.protein.sections[sectionIndex].blocks.some(block => block.kind === 'figure' && block.src === `/figures/dry-lab/${figure}.png`), `Protein figure not placed: ${figure}`);
  }
  assert(!/CB-Dock2 method|AutoDock Vina 1\.2 method|FoldX energy-function paper|GROMACS project/.test(JSON.stringify(pages.protein)), 'Protein page contains unnecessary software or method links');
  const workflow = fs.readFileSync('.github/workflows/pages.yml','utf8');
  for(const slug of ['dry-lab','transcriptomics','metabolomics','protein','model','hardware']) assert(workflow.includes(`            ${slug} \\`));
  console.log(`Dry Lab checks passed: 5 ordered chapters, 2 empty pages, ${figures} figures, ${tables} tables, 333 ranked transcripts, 5 core ODEs and 9 Protein sections.`);
} finally {
  await server.close();
}
