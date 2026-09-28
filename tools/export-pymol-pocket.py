"""Export PyMOL's solvent-excluded pocket surface, preserving source coordinates."""
import argparse,json,re
from pathlib import Path
import pymol
from pymol import cmd
parser=argparse.ArgumentParser();parser.add_argument('--input',type=Path,required=True);parser.add_argument('--output',type=Path,required=True);args=parser.parse_args()
pymol.finish_launching(['pymol','-cq'])
cmd.load(str(args.input/'wt/protein_71_555.pdb'),'receptor');cmd.load(str(args.input/'wt/lycopene_pose_h.mol2'),'ligand')
cmd.remove('hydro');cmd.create('pocket','receptor within 8 of ligand');cmd.delete('receptor');cmd.hide('everything');cmd.show('surface','pocket')
cmd.set('surface_quality',1);cmd.set('solvent_radius',1.4);cmd.set('surface_solvent',0);cmd.rebuild();cmd.zoom('pocket')
view=cmd.get_view();assert tuple(view[:9])==(1.,0.,0.,0.,1.,0.,0.,0.,1.)
_,body=cmd.get_povray()
vertices=[];normals=[];indices=[];lookup={}
for v,n in re.findall(r'vertex_vectors\s*\{\s*3,\s*(.*?)\}\s*normal_vectors\s*\{\s*3,\s*(.*?)\}',body,re.S):
 ps=re.findall(r'<([^>]+)>',v);ns=re.findall(r'<([^>]+)>',n)
 for a,b in zip(ps,ns):
  p=[round(float(t)+view[12+i]-view[9+i],4) for i,t in enumerate(a.split(','))];normal=[round(float(t),5) for t in b.split(',')];key=tuple(p+normal)
  if key not in lookup:lookup[key]=len(vertices)//3;vertices.extend(p);normals.extend(normal)
  indices.append(lookup[key])
assert len(indices)>1000
args.output.write_text(json.dumps({'positions':vertices,'normals':normals,'indices':indices,'method':'PyMOL solvent-excluded surface of pocket heavy atoms within 8 A of lycopene','probeRadius':1.4,'quality':1},separators=(',',':'))+'\n')
print('surface',len(vertices)//3,'vertices',len(indices)//3,'triangles');cmd.quit()
