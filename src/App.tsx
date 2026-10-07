import { lazy, Suspense, useEffect, useRef, type CSSProperties } from "react";
import { Link, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { archiveNavigation, navigation, pageOrder, pages } from "./site-data";
import { ArticleBlocks } from './ArticleBlocks';

const PixelWorld = lazy(() => import("./PixelWorld").then((module) => ({ default: module.PixelWorld })));
const MODELING_PATHS = ['/dry-lab', '/transcriptomics', '/metabolomics', '/protein', '/model'];

function normalizePath(pathname: string) {
  const normalized = pathname.replace(/\/+$/, "");
  return normalized || "/";
}

/**
 * Resolve both local public assets and the absolute/data URLs used by the
 * published Wiki and the single-file review build. The preview inliner may
 * leave a leading slash in front of a data URI ("/data:image/…"), so strip
 * root slashes before handling data/blob URLs.
 */
function resolveFigureSrc(src: string) {
  const raw = src.trim();
  if (/^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(raw)) return raw;
  const relative = raw.replace(/^\/+/, "");
  if (/^(?:data|blob):/i.test(relative)) return relative;
  const base = import.meta.env.BASE_URL || "/";
  return `${base.endsWith("/") ? base : `${base}/`}${relative}`;
}

function BrandMark() {
  return <span className="brand-mark" aria-hidden="true">
    <svg viewBox="0 0 48 48" role="img">
      <path className="brand-mark__flagella" d="M17 13C11 9 11 5 14 2M30 13c6-4 7-8 4-11" />
      <path className="brand-mark__cell" d="m12 15 5-5h15l6 6v15l-6 7H17l-6-6V20z" />
      <path className="brand-mark__chloroplast" d="M16 20c3-5 11-6 16-2l2 8c-2 6-10 8-16 4l-3-5z" />
      <circle className="brand-mark__eyespot" cx="30" cy="17" r="2.2" />
      <circle className="brand-mark__hub" cx="24" cy="28" r="3.8" />
      <path className="brand-mark__route" d="M13 22h3m16 8h3" />
    </svg>
  </span>;
}

function Header({ light = false }: { light?: boolean }) {
  const header = useRef<HTMLElement>(null);
  const { pathname } = useLocation();
  const currentPath = normalizePath(pathname);
  useEffect(() => {
    const node = header.current;
    if (!node) return;
    const close = () => node.querySelectorAll("details[open]").forEach((item) => item.removeAttribute("open"));
    const outside = (event: PointerEvent) => { if (!node.contains(event.target as Node)) close(); };
    const escape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      const active = document.activeElement?.closest("details[open]");
      close();
      active?.querySelector("summary")?.focus();
    };
    close();
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", escape);
    };
  }, [pathname]);
  return <header ref={header} className={`site-header${light ? " site-header--light" : ""}`}>
    <Link className="brand" to="/" aria-label="DunaTerp home"><BrandMark /><span>DunaTerp<small>SCU–CHINA · 2026</small></span></Link>
    <nav className="desktop-nav" aria-label="Primary navigation">
      {navigation.map((group) => <details key={group.label} name="desktop-navigation">
        <summary className={group.items.some(([, href]) => href === currentPath) || (group.label === 'Dry Lab' && MODELING_PATHS.includes(currentPath)) ? "is-current" : undefined}>{group.label}<span aria-hidden="true">⌄</span></summary>
        <div className="nav-popover"><p>{group.label}</p>{group.items.map(([label, href]) => <Link key={href} to={href} aria-current={currentPath === href ? "page" : undefined}>{label}<span aria-hidden="true">↗</span></Link>)}</div>
      </details>)}
      <Link className="nav-index" to="/wiki-map" aria-current={currentPath === "/wiki-map" ? "page" : undefined}>Explore Wiki <span aria-hidden="true">↗</span></Link>
    </nav>
    <details className="mobile-menu"><summary>Menu <span aria-hidden="true">☰</span></summary><nav aria-label="Mobile navigation">
      {navigation.map((group) => <div className="mobile-nav-group" key={group.label}><p>{group.label}</p>{group.items.map(([label, href]) => <Link key={href} to={href} aria-current={currentPath === href ? "page" : undefined}>{label}</Link>)}</div>)}
      <Link className="mobile-map-link" to="/wiki-map">Explore all pages ↗</Link>
    </nav></details>
  </header>;
}

function Footer() {
  return <footer className="site-footer"><div><p className="footer-brand">DunaTerp<span aria-hidden="true">.</span></p><p>A programmable, salt-adapted terpenoid platform in <i>Dunaliella salina</i>.</p><small>SCU–CHINA / iGEM 2026</small></div><div className="footer-links"><a href="https://gitlab.igem.org/2026/scu-china">Team GitLab ↗</a><a href="https://creativecommons.org/licenses/by/4.0/">Content: CC BY 4.0 ↗</a><Link to="/attributions">Attributions</Link><Link to="/responsible-ai">Responsible AI</Link></div></footer>;
}

const groupDescriptions = [
  "From the biological idea to experiments and evidence.",
  "Understand the system, its constraints and its possibilities.",
  "Connect project decisions with people and the environment.",
  "Meet the team and discover the work behind the project.",
];

function WikiMap() {
  return <><Header /><main id="main-content" tabIndex={-1} className="map-page">
    <header className="map-heading"><div><p className="page-eyebrow">DUNATERP / PROJECT INDEX</p><h1>Explore the<br /><em>whole spectrum.</em></h1></div><p className="map-intro">Follow the science, explore the evidence, and meet the people behind DunaTerp. Every chapter starts here.</p></header>
    <div className="map-grid">{archiveNavigation.map((group, index) => <section key={group.label} className={`map-group map-group--${index}`}><header><span className="map-number">0{index + 1}</span></header><h2>{group.label}</h2><p className="map-description">{groupDescriptions[index]}</p><div className="map-links">{group.items.map(([label, href]) => <Link key={href} to={href}><span>{label}</span><b aria-hidden="true">↗</b></Link>)}</div></section>)}</div>
    <div className="map-return"><span>Start with the story.</span><Link to="/">Return to the salt route <span aria-hidden="true">↗</span></Link></div>
    <nav className="related-wiki-pages" aria-label="Project-wide pages"><Link to="/dry-lab">Modeling overview</Link><Link to="/alternative-platform">Alternative Platform</Link></nav>
  </main><Footer /></>;
}

function Article({ slug }: { slug: string }) {
  const page = pages[slug];
  if (!page) return <Navigate to="/wiki-map" replace />;
  const index = pageOrder.indexOf(slug);
  const nextSlug = pageOrder[(index + 1) % pageOrder.length];
  const next = pages[nextSlug];
  const group = navigation.find((item) => item.items.some(([, href]) => href === `/${slug}`))
    ?? (MODELING_PATHS.includes(`/${slug}`) ? navigation.find((item) => item.label === 'Dry Lab') : undefined);
  const groupIndex = Math.max(0, navigation.findIndex((item) => item === group));
  const articleAccent = ["#cdf558", "#7de2ff", "#e9c43a", "#c4a8ff"][groupIndex];
  const figureSrc = page.figure ? resolveFigureSrc(page.figure.src) : "";
  const hasContent = page.sections.length > 0;
  const isModeling = MODELING_PATHS.includes(`/${slug}`);
  return <><Header /><main id="main-content" tabIndex={-1} style={{ "--article-accent": articleAccent } as CSSProperties} className={`article-page${group?.label === 'Dry Lab' || slug === 'dry-lab' ? ' article-page--dry-lab' : ''}${slug === 'protein' ? ' article-page--protein' : ''}${isModeling ? ' article-page--modeling' : ''}${slug === 'dry-lab' ? ' article-page--overview' : ''}${slug === 'hardware' ? ' article-page--hardware' : ''}${slug === 'safety-and-security' ? ' article-page--safety' : ''}`}>
    <nav className="breadcrumbs" aria-label="Breadcrumb"><Link to="/wiki-map">Wiki</Link><span aria-hidden="true">/</span>{group && <>{group.label === 'Dry Lab' ? <Link to="/dry-lab">Dry Lab</Link> : <span>{group.label}</span>}<span aria-hidden="true">/</span></>}<span aria-current="page">{group?.items.find(([, href]) => href === `/${slug}`)?.[0] || page.title}</span></nav>
    <header className="article-hero"><div><p className="page-eyebrow">{page.eyebrow}</p><h1>{page.title}</h1></div>{page.intro && <div className="article-intro"><p>{page.intro}</p></div>}</header>
    {hasContent && <>
    <div className="article-layout"><aside className="article-toc"><p>ON THIS PAGE</p><nav aria-label="On this page">{page.sections.map((section, i) => <Link key={section.title} to={{ pathname: `/${slug}`, hash: `#section-${i + 1}` }}><span>{String(i + 1).padStart(2, "0")}</span>{section.title}</Link>)}</nav><Link className="toc-map" to="/wiki-map">All chapters ↗</Link></aside>
      <div className="article-body">{page.figure && <figure className="feature-figure"><img src={figureSrc} alt={page.figure.alt} loading="lazy" decoding="async" /><figcaption>{page.figure.caption}</figcaption></figure>}
        <div className="article-sections">{page.sections.map((section, i) => <section id={`section-${i + 1}`} tabIndex={-1} key={section.title}><div className="section-number">{String(i + 1).padStart(2, "0")}</div><div>{section.eyebrow && <p className="section-eyebrow">{section.eyebrow}</p>}<h2>{section.title}</h2>{section.body && <p>{section.body}</p>}{section.blocks && <ArticleBlocks blocks={section.blocks} />}{section.items && <ul>{section.items.map((item) => <li key={item}>{item}</li>)}</ul>}{section.note && <aside>{section.note}</aside>}</div></section>)}</div>
        <Link className="next-page" to={`/${nextSlug}`}><span>CONTINUE EXPLORING</span><strong>{next.title}</strong><b aria-hidden="true">↗</b></Link>
      </div>
    </div>
    </>}
  </main><Footer /></>;
}

function ScrollAndTitle() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    const slug = normalizePath(pathname).replace(/^\//, "");
    document.title = slug && pages[slug] ? `${pages[slug].title} · DunaTerp` : slug === "wiki-map" ? "Explore the Wiki · DunaTerp" : "DunaTerp · SCU-China 2026";
    const frame = requestAnimationFrame(() => {
      if (hash) {
        let id = hash.slice(1);
        try { id = decodeURIComponent(id); } catch { /* Keep the raw id when a malformed URL hash is supplied. */ }
        const target = document.getElementById(id);
        if (target) {
          target.scrollIntoView();
          target.focus({ preventScroll: true });
        }
      } else {
        window.scrollTo(0, 0);
        document.getElementById("main-content")?.focus({ preventScroll: true });
      }
    });
    return () => cancelAnimationFrame(frame);
  }, [pathname, hash]);
  return null;
}

export default function App() {
  const { pathname, search } = useLocation();
  return <><Link className="skip-link" to={{ pathname, search, hash: "#main-content" }}>Skip to content</Link><ScrollAndTitle /><Routes>
    <Route path="/" element={<Suspense fallback={<><main id="main-content" tabIndex={-1} className="world-loading"><p className="page-eyebrow">SCU–CHINA / iGEM 2026</p><h1>DunaTerp.</h1><p role="status">Surveying the salt flats…</p><Link to="/wiki-map">Explore the Wiki ↗</Link></main></>}><PixelWorld Header={Header} /></Suspense>} />
    <Route path="/wiki-map" element={<WikiMap />} />
    {pageOrder.map((slug) => <Route key={slug} path={`/${slug}`} element={<Article slug={slug} />} />)}
    <Route path="*" element={<Navigate to="/wiki-map" replace />} />
  </Routes></>;
}
