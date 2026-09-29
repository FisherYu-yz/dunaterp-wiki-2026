"""Real-coordinate LCYB scene. Blender background script; units are angstroms."""
import bpy, math
from mathutils import Vector
from pathlib import Path

import argparse, sys, hashlib, json
parser=argparse.ArgumentParser()
parser.add_argument('--input', type=Path, required=True)
parser.add_argument('--output', type=Path, required=True)
args=parser.parse_args(sys.argv[sys.argv.index('--')+1:])
ROOT=args.input
OUT=args.output
OUT.mkdir(parents=True, exist_ok=True)
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)

def material(name, color, metal=0.0, rough=.35):
    m=bpy.data.materials.new(name); m.diffuse_color=(*color,1);m.use_nodes=True
    bs=m.node_tree.nodes.get('Principled BSDF')
    bs.inputs['Base Color'].default_value=(*color,1)
    bs.inputs['Metallic'].default_value=metal;bs.inputs['Roughness'].default_value=rough
    return m
teal=material('Protein | teal backbone',(.065,.43,.37),.15)
gold=material('Lycopene | amber',(.95,.32,.035),.2,.24)
purple=material('PHE404 | violet',(.6,.13,.72),.12)
white=material('Scale | white',(.7,.8,.85))
floor=material('Stage | graphite',(.018,.028,.04),.1,.55)

rows=(ROOT/'wt/protein_71_555.pdb').read_text().splitlines()
atoms=[dict(name=l[12:16].strip(),res=int(l[22:26]),p=Vector((float(l[30:38]),float(l[38:46]),float(l[46:54])))) for l in rows if l.startswith('ATOM')]
ca=[a for a in atoms if a['name']=='CA']
origin=sum((a['p'] for a in ca),Vector())/len(ca)
for a in atoms:a['p']-=origin
def tube(name,points,radius,mat,parent=None,smooth=False):
    data=bpy.data.curves.new(name,'CURVE');data.dimensions='3D';data.resolution_u=6;data.bevel_depth=radius;data.bevel_resolution=3
    spline=data.splines.new('BEZIER' if smooth else 'POLY')
    if smooth:
        spline.bezier_points.add(len(points)-1)
        for p,v in zip(spline.bezier_points,points):p.co=v;p.handle_left_type='AUTO';p.handle_right_type='AUTO'
    else:
        spline.points.add(len(points)-1)
        for p,v in zip(spline.points,points):p.co=(*v,1)
    ob=bpy.data.objects.new(name,data);bpy.context.collection.objects.link(ob);ob.data.materials.append(mat);ob.parent=parent
    return ob
def sphere(name,p,r,mat,parent=None):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=16,ring_count=8,radius=r,location=p)
    ob=bpy.context.object;ob.name=name;ob.data.materials.append(mat);ob.parent=parent
    for f in ob.data.polygons:f.use_smooth=True
    return ob
tube('LCYB 71-555 | C-alpha backbone trace',[a['p'] for a in ca],.38,teal,smooth=True)
mol=(ROOT/'wt/lycopene_pose_h.mol2').read_text()
lig={}
for row in mol.split('@<TRIPOS>ATOM')[1].split('@<TRIPOS>')[0].strip().splitlines():
    v=row.split()
    if v[5].split('.')[0]=='C': lig[int(v[0])]=Vector(tuple(map(float,v[2:5])))-origin
bonds=[line.split() for line in mol.split('@<TRIPOS>BOND')[1].split('@<TRIPOS>')[0].strip().splitlines()]
bonds=[s for s in bonds if int(s[1]) in lig and int(s[2]) in lig]
assert len(lig)==40 and len(bonds)==39
parent=bpy.data.objects.new('Lycopene | selected WT docking pose',None);bpy.context.collection.objects.link(parent)
for i,p in lig.items():sphere(f'Carbon {i}',p,.48,gold,parent)
for s in bonds:
    a,b=lig[int(s[1])],lig[int(s[2])]
    if s[3]=='2':
        normal=(b-a).cross(Vector((0,0,1))).normalized()*.13
        for sign in [-1,1]:tube(f'Double bond {s[0]} {sign}',[a+normal*sign,b+normal*sign],.10,gold,parent)
    else:tube(f'Bond {s[0]}',[a,b],.15,gold,parent)
site=[a for a in atoms if a['res']==404]
for a in site:sphere('PHE404 '+a['name'],a['p'],.31,purple)
for i,a in enumerate(site):
    for b in site[:i]:
        if (a['p']-b['p']).length<1.9:tube('PHE404 bond',[a['p'],b['p']],.14,purple)
center=sum(lig.values(),Vector())/len(lig)
scene=bpy.context.scene
bottom=min(a['p'].z for a in atoms)-5
bpy.ops.mesh.primitive_plane_add(size=300,location=(0,0,bottom));bpy.context.object.name='Studio floor';bpy.context.object.data.materials.append(floor)
def aim(obj,target):obj.rotation_euler=(Vector(target)-obj.location).to_track_quat('-Z','Y').to_euler()
bpy.ops.object.camera_add(location=(80,-115,90));camera=bpy.context.object;camera.name='Overview camera';aim(camera,(0,0,0));camera.data.type='ORTHO';camera.data.ortho_scale=105;scene.camera=camera
def light(name,p,energy,size):
    data=bpy.data.lights.new(name,'AREA');data.energy=energy;data.shape='DISK';data.size=size
    ob=bpy.data.objects.new(name,data);bpy.context.collection.objects.link(ob);ob.location=p;aim(ob,(0,0,0))
light('Key softbox',(20,-50,90),110000,65)
light('Fill',(-70,-15,35),65000,55)
light('Rim',(30,55,65),140000,50)
scene.world.color=(.16,.16,.16)
scene.render.engine='CYCLES';scene.cycles.samples=24
scene.cycles.use_denoising=True
scene.render.resolution_x=1200;scene.render.resolution_y=1000;scene.render.resolution_percentage=100
scene.render.image_settings.file_format='PNG';scene.view_settings.view_transform='AgX'
scene['coordinate_units']='1 Blender unit = 1 angstrom; all molecular components share the same scale.'
scene['protein_representation']='Smoothed actual C-alpha trace, not secondary-structure ribbon or molecular surface.'
scene['ligand_identity']='Lycopene, CID 446925; 40 carbons, 39 heavy-atom bonds, no rings; hydrogen atoms omitted in rendering.'
scene['source']='Corrected WT protein_71_555.pdb and lycopene_pose_h.mol2; original residue numbering preserved.'
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'lcyb-lycopene.blend'))
scene.render.filepath=str(OUT/'lcyb-lycopene.png');bpy.ops.render.render(write_still=True)
camera.location=center+Vector((35,-48,36));aim(camera,center);camera.data.ortho_scale=44
scene.render.filepath=str(OUT/'lcyb-lycopene_detail.png');bpy.ops.render.render(write_still=True)

camera.location=center+Vector((-42,-28,26));aim(camera,center);camera.data.ortho_scale=44
scene.render.filepath=str(OUT/'lcyb-lycopene-detail-alt.png');bpy.ops.render.render(write_still=True)
manifest={"identity":json.loads((ROOT/'inputs/identity.json').read_text()),"view":"WT selected docking pose, not an MD frame or measured structure", "sources":{str(p.relative_to(ROOT)):hashlib.sha256(p.read_bytes()).hexdigest() for p in [ROOT/'wt/protein_71_555.pdb',ROOT/'wt/lycopene_pose_h.mol2']}}
(OUT/'render-provenance.json').write_text(json.dumps(manifest,indent=2))
