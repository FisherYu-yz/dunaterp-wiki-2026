import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import structure from './content/structures/lycopene-wt.json';
import surface from './content/structures/lycopene-pocket-surface.json';
import './docking-viewer.css';

type Mode = 'scroll' | 'manual' | 'play';
type View = 'overall' | 'site';
const fallbackImage = 'figures/protein/lcyb-lycopene.png';
const clamp = (n: number) => Math.max(0, Math.min(1, n));

export function DockingViewer() {
  const [mode, setMode] = useState<Mode>(() => typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches ? 'manual' : 'scroll');
  const [progress, setProgress] = useState(1);
  const [showProtein, setShowProtein] = useState(false);
  const [cutaway, setCutaway] = useState(true);
  const [showSite, setShowSite] = useState(false);
  const [view, setView] = useState<View>('site');
  const [error, setError] = useState(false);
  const host = useRef<HTMLDivElement>(null);
  const section = useRef<HTMLElement>(null);
  const current = useRef({ mode, progress, showProtein, showSite, cutaway, view });
  const commands = useRef<{ view: (v: View) => void; zoom: (scale: number) => void } | null>(null);
  useEffect(() => { current.current = { mode, progress, showProtein, showSite, cutaway, view }; }, [mode, progress, showProtein, showSite, cutaway, view]);
  useEffect(() => {
    const mount = host.current;
    if (!mount) return;
    let renderer: THREE.WebGLRenderer;
    try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false }); }
    catch { queueMicrotask(() => setError(true)); return; }
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.setClearColor('#edf1e9');
    renderer.localClippingEnabled = true;
    mount.appendChild(renderer.domElement);
    renderer.domElement.setAttribute('aria-label', 'Interactive WT LCYB and lycopene docking illustration');
    renderer.domElement.setAttribute('role', 'img');
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, 1, .1, 600);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true; controls.enablePan = false;
    controls.minDistance = 18; controls.maxDistance = 220;
    const origin = structure.backbone.reduce((s, p) => s.add(new THREE.Vector3(...p)), new THREE.Vector3()).divideScalar(structure.backbone.length);
    const point = (p: number[]) => new THREE.Vector3(...p).sub(origin);
    const backbone = structure.backbone.map(point);
    const ligandPoints = structure.ligand.map(point);
    const center = ligandPoints.reduce((s,p) => s.add(p), new THREE.Vector3()).divideScalar(ligandPoints.length);
    scene.add(new THREE.HemisphereLight(0xf6fff4, 0x40594b, 1.9));
    const key = new THREE.DirectionalLight(0xffffff, 2.8); key.position.set(30,-40,80); scene.add(key);
    const material = (color: string) => new THREE.MeshStandardMaterial({ color, roughness: .55 });
    const teal = material('#78968c'), amber = material('#d89b30'), purple = material('#998874');
    // Keep local backbone context in the pocket view; never join separated runs.
    const trace = (points: THREE.Vector3[]) => new THREE.Mesh(
      new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), Math.max(16, points.length * 5), .18, 8, false), teal);
    const protein = trace(backbone);
    const localBackbone = new THREE.Group();
    let run: THREE.Vector3[] = [];
    const flushRun = () => { if (run.length > 1) localBackbone.add(trace(run)); run = []; };
    backbone.forEach(p => {
      if (ligandPoints.some(q => p.distanceTo(q) <= 12)) run.push(p);
      else flushRun();
    });
    flushRun();
    scene.add(protein, localBackbone);
    const plane = new THREE.Plane();
    const pocketMaterial = new THREE.MeshStandardMaterial({color:'#9bb4a1',emissive:'#66816b',emissiveIntensity:.2,roughness:.88,clippingPlanes:[plane],side:THREE.DoubleSide});
    const geometry=new THREE.BufferGeometry();
    const positions=new Float32Array(surface.positions);
    for(let i=0;i<positions.length;i+=3){positions[i]-=origin.x;positions[i+1]-=origin.y;positions[i+2]-=origin.z;}
    geometry.setAttribute('position',new THREE.BufferAttribute(positions,3));
    geometry.setAttribute('normal',new THREE.Float32BufferAttribute(surface.normals,3));
    geometry.setIndex(surface.indices);
    const pocket=new THREE.Mesh(geometry,pocketMaterial);scene.add(pocket);
    const viewDirection=new THREE.Vector3(...structure.camera.direction);
    const viewUp=new THREE.Vector3(...structure.camera.up);
    const ligand = new THREE.Group(), site = new THREE.Group(); scene.add(ligand,site);
    const sphere = new THREE.SphereGeometry(.47, 12, 8);
    function atom(p: THREE.Vector3, parent: THREE.Group, mat: THREE.Material, scale = 1) {
      const mesh = new THREE.Mesh(sphere, mat); mesh.position.copy(p); mesh.scale.setScalar(scale); parent.add(mesh);
    }
    function bond(a: THREE.Vector3, b: THREE.Vector3, parent: THREE.Group, mat: THREE.Material, radius = .14) {
      const direction = b.clone().sub(a);
      const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius,radius,direction.length(),8),mat);
      mesh.position.copy(a).add(b).multiplyScalar(.5);
      mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),direction.normalize()); parent.add(mesh);
    }
    ligandPoints.forEach(p => atom(p,ligand,amber));
    structure.bonds.forEach(([a,b,order]) => {
      if (order === 2) {
        const delta = ligandPoints[b].clone().sub(ligandPoints[a]).cross(new THREE.Vector3(0,0,1)).normalize().multiplyScalar(.14);
        for (const sign of [-1,1]) bond(ligandPoints[a].clone().addScaledVector(delta,sign),ligandPoints[b].clone().addScaledVector(delta,sign),ligand,amber,.08);
      } else bond(ligandPoints[a],ligandPoints[b],ligand,amber);
    });
    const sitePoints=structure.site.map(point);
    sitePoints.forEach((p,i) => { atom(p,site,purple,.48); sitePoints.slice(0,i).forEach(q => { if(p.distanceTo(q)<1.9) bond(p,q,site,purple,.085); }); });
    const setView = (v: View) => {
      const target = v === 'site' ? center : new THREE.Vector3();
      controls.target.copy(target); camera.up.copy(viewUp); camera.position.copy(target).addScaledVector(viewDirection,v==='site'?55:115); controls.update();
    };
    commands.current = { view: setView, zoom: scale => { camera.position.sub(controls.target).multiplyScalar(scale).add(controls.target); controls.update(); } };
    setView('site');
    const resize = new ResizeObserver(() => { const w=mount.clientWidth,h=mount.clientHeight; if(w&&h) { camera.aspect=w/h; camera.updateProjectionMatrix(); renderer.setSize(w,h,false); } });
    resize.observe(mount);
    let visible = true;
    const observer = new IntersectionObserver(([entry]) => { visible=entry.isIntersecting; }); observer.observe(mount);
    const start = () => { current.current.mode='manual'; setMode('manual'); }; controls.addEventListener('start',start);
    const contextLost = (event: Event) => { event.preventDefault(); setError(true); };
    renderer.domElement.addEventListener('webglcontextlost',contextLost);
    let raf=0,last=performance.now(),published=0;
    const frame = (time: number) => {
      raf=requestAnimationFrame(frame);
      const dt=Math.min((time-last)/1000,.05); last=time;
      if (!visible || document.hidden) return;
      const state=current.current;
      let next=state.progress;
      if(state.mode==='scroll' && section.current) {
        const rect=section.current.getBoundingClientRect();
        next=clamp((innerHeight*.45-rect.top)/Math.max(1,rect.height-innerHeight*.7));
      } else if(state.mode==='play') next=clamp(state.progress+dt/6);
      state.progress=next;
      if(time-published>50) { setProgress(next); published=time; }
      if(state.mode==='play' && next===1) { state.mode='manual'; setMode('manual'); }
      // The collision-checked exterior approach stops before the protein interior.
      // A visible dissolve changes to the final pose; no unverified connecting path is drawn.
      const approach=structure.approach;
      const distance=next<.78 ? 40-(40-approach.stop)*next/.78 : next<.89 ? approach.stop : 0;
      ligand.position.copy(new THREE.Vector3(...approach.direction)).multiplyScalar(distance);
      amber.transparent=true;
      amber.opacity=next<.78?1:next<.89?1-(next-.78)/.11:(next-.89)/.11;
      amber.depthWrite=amber.opacity>.95;
      if(state.mode==='scroll'||state.mode==='play') {
        const target=center.clone().addScaledVector(new THREE.Vector3(...approach.direction),distance*.45);
        controls.target.copy(target);camera.position.copy(target).addScaledVector(viewDirection,55+distance*.9);
      }
      protein.visible=state.showProtein && state.view==='overall';
      localBackbone.visible=state.showProtein && state.view==='site'; site.visible=state.showSite;
      const facing=camera.position.clone().sub(center).normalize();
      plane.setFromNormalAndCoplanarPoint(facing.clone().negate(),center.clone().addScaledVector(facing,0.8));
      pocketMaterial.clippingPlanes=state.cutaway?[plane]:[];
      teal.clippingPlanes=state.cutaway?[plane]:[];
      key.position.copy(camera.position).add(new THREE.Vector3(-20,30,10));
      controls.enabled=state.mode!=='scroll'; controls.update(); renderer.render(scene,camera);
    };
    raf=requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf); resize.disconnect(); observer.disconnect(); controls.dispose(); commands.current=null;
      renderer.domElement.removeEventListener('webglcontextlost',contextLost);
      const geometries=new Set<THREE.BufferGeometry>(); const materials=new Set<THREE.Material>();
      scene.traverse(obj => { if(obj instanceof THREE.Mesh) { geometries.add(obj.geometry); (Array.isArray(obj.material)?obj.material:[obj.material]).forEach(m=>materials.add(m)); } });
      geometries.forEach(g=>g.dispose()); materials.forEach(m=>m.dispose()); renderer.dispose(); renderer.domElement.remove();
    };
  }, []);
  function seek(value: number) { current.current.progress=value; current.current.mode='manual'; setProgress(value); setMode('manual'); }
  function selectView(value: View) { current.current.view=value; current.current.mode='manual'; setMode('manual'); setView(value); commands.current?.view(value); }
  return <section ref={section} className="docking-scroll" aria-label="Interactive lycopene docking">
    <div className="docking-card">
      <div className="docking-title"><div><span>MOLECULAR VIEW</span><h3>LCYB × lycopene</h3></div><span>{mode==='scroll'?'Scroll-linked':mode==='play'?'Playing':'Manual control'}</span></div>
      <div className="docking-stage">
        <div ref={host} className="docking-canvas" style={{pointerEvents:mode==='scroll'?'none':'auto'}} />
        {error && <div className="docking-fallback"><img src={fallbackImage.startsWith('data:') ? fallbackImage : `${import.meta.env.BASE_URL}${fallbackImage}`} alt="WT LCYB and corrected lycopene docking pose"/><p>3D is unavailable. The static view shows the selected pose.</p></div>}
        <span className="docking-phase">{progress<.78?'Approach':progress<.999?'Pose transition':'Docked pose'}</span>
        <div className="docking-legend"><span>● Pocket</span><span>● Lycopene</span>{showSite && <span>● Phe404</span>}</div>
        {!error && mode==='scroll' && <button className="docking-enter" onClick={()=>setMode('manual')}>Enter 3D controls</button>}
      </div>
      <div className="docking-controls">
        <div className="docking-buttons">
          <button className="docking-primary" disabled={error} onClick={()=> { if(mode==='play') setMode('manual'); else { if(progress>=1) {current.current.progress=0;setProgress(0);} setMode('play'); } }}>{mode==='play'?'Ⅱ Pause':'▶ Play'}</button>
          <button disabled={error} onClick={()=>seek(1)}>Docked pose</button>
          <button disabled={error} onClick={()=> {selectView('overall');setMode('scroll');}}>Resume scroll</button>
          <button disabled={error} onClick={()=> {seek(1);selectView('overall');}}>Reset view</button>
        </div>
        <label className="docking-progress">Progress <input disabled={error} type="range" min="0" max="100" step="1" value={Math.round(progress*100)} onChange={e=>seek(Number(e.target.value)/100)}/><output>{Math.round(progress*100)}%</output></label>
        <div className="docking-options">
        <div className="docking-view-group" role="group" aria-label="Camera view">
          <button disabled={error} aria-pressed={view==='overall'} onClick={()=>selectView('overall')}>Overall</button>
          <button disabled={error} aria-pressed={view==='site'} onClick={()=>selectView('site')}>Pocket view</button>
          </div><div className="docking-zoom-group" role="group" aria-label="Zoom">
          <button disabled={error} aria-label="Zoom in" onClick={()=>commands.current?.zoom(.8)}>＋</button>
          <button disabled={error} aria-label="Zoom out" onClick={()=>commands.current?.zoom(1.25)}>−</button>
        </div>
        <div className="docking-layers" role="group" aria-label="Display layers">
          <button role="switch" aria-checked={showProtein} disabled={error} onClick={()=>setShowProtein(!showProtein)}><span aria-hidden="true"/>Backbone</button>
          <button role="switch" aria-checked={cutaway} disabled={error} onClick={()=>setCutaway(!cutaway)}><span aria-hidden="true"/>Cutaway</button>
          <button role="switch" aria-checked={showSite} disabled={error} onClick={()=>setShowSite(!showSite)}><span aria-hidden="true"/>Phe404</button>
        </div></div>
        <p>Drag to rotate · Scroll or pinch to zoom. PyMOL molecular surface · pocket atoms within 8 Å · probe radius 1.4 Å. Backbone: local in Pocket view, full in Overall.</p>
      </div>
      <p className="docking-note"><strong>Simulated path.</strong> Exterior approach, followed by a dissolve to the selected docking pose. WT LCYB 71–555 · all-trans lycopene, CID 446925.</p>
    </div>
  </section>;
}
