from pathlib import Path
import numpy as np,json
from scipy.spatial import cKDTree
import argparse
parser=argparse.ArgumentParser();parser.add_argument('--input',type=Path,required=True);args=parser.parse_args()
r=Path(__file__).resolve().parents[1];d=json.loads((r/'src/content/structures/lycopene-wt.json').read_text())
p=args.input/'wt/protein_71_555.pdb'
a=[]
for l in p.read_text().splitlines():
 if l.startswith('ATOM') and not (l[76:78].strip()=='H' or l[12:16].strip().startswith('H')):a.append([float(l[30:38]),float(l[38:46]),float(l[46:54])])
a=np.array(a);tree=cKDTree(a);lig=np.array(d['ligand']);threshold=3.0
axis=np.linalg.svd(lig-lig.mean(0))[2][0]
best=None
for n in [axis,-axis,np.array(d['camera']['direction'])]+[np.array([np.cos(t)*np.sqrt(1-z*z),np.sin(t)*np.sqrt(1-z*z),z]) for z in np.linspace(-.95,.95,12) for t in np.linspace(0,2*np.pi,40,endpoint=False)]:
 t=np.linspace(60,0,241);poses=lig[None,:,:]+t[:,None,None]*n
 distances=tree.query(poses.reshape(-1,3))[0].reshape(-1,40).min(1)
 bad=np.where(distances<threshold)[0];stop=int(bad[0]-1) if len(bad) else 240
 if stop<0:continue
 remaining=t[stop]
 if best is None or remaining<best[0]:best=(remaining,n,stop,distances[:stop+1].min())
print('final clearance',tree.query(lig)[0].min(),'best',best)
d['approach']={'direction':best[1].tolist(),'start':60,'stop':float(best[0]),'minimumHeavyAtomDistance':float(best[3]),'threshold':threshold,'samplingStep':.25,'continuousToDock':bool(best[0]==0)}
(r/'src/content/structures/lycopene-wt.json').write_text(json.dumps(d,separators=(',',':'))+'\n')
