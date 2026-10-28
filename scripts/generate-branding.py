"""Regenerate Android branding from the approved SVG (requires Inkscape)."""
from pathlib import Path
import re
import struct
import subprocess
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parent.parent
RES = ROOT / 'android/app/src/main/res'
SOURCE = ROOT / 'assets/branding/logo-clin-oeil.svg'
CACHE = ROOT / '.cache/branding'
CACHE.mkdir(parents=True, exist_ok=True)
svg = SOURCE.read_text()
art = svg[svg.index('  <g '):svg.rindex('</svg>')]
# Visible bounds including the fork teeth and stroke; centre the actual mark.
cx, cy, width = 277, 222, 350
jobs = []
for target in sorted(RES.rglob('*.png')):
    if target.stem not in ('splash', 'ic_launcher', 'ic_launcher_round', 'ic_launcher_foreground'):
        continue
    w, h = struct.unpack('>II', target.read_bytes()[16:24])
    foreground = target.stem == 'ic_launcher_foreground'
    if target.stem == 'splash':
        density = next((v for k, v in [('xxxhdpi',4),('xxhdpi',3),('xhdpi',2),('hdpi',1.5),('mdpi',1)] if target.parent.name.endswith(k)), 1)
        scale = min(160 * density, min(w,h) * .5) / width
    else:
        scale = w * (.52 if foreground else .70) / width
    background = '' if foreground else (f'<circle cx="{w/2}" cy="{h/2}" r="{w/2}" fill="white"/>' if target.stem.endswith('_round') else f'<path d="M0 0H{w}V{h}H0Z" fill="white"/>')
    wrapper = f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" fill="none" viewBox="0 0 {w} {h}">{background}<g transform="translate({w/2-scale*cx} {h/2-scale*cy}) scale({scale})">{art}</g></svg>'
    tmp = CACHE / f'{target.parent.name}-{target.stem}.svg'
    tmp.write_text(wrapper)
    jobs.append((tmp,target))
jobs.append((SOURCE, ROOT / 'assets/branding/logo-clin-oeil-preview.png'))
for source, target in jobs:
    args = ['inkscape', str(source), '--export-type=png', f'--export-filename={target}']
    if source == SOURCE:
        args += ['--export-width=768', '--export-background=white']
    subprocess.run(args, check=True, cwd=ROOT)
    if not target.exists():
        raise RuntimeError(f'Missing export: {target}')

# Native VectorDrawable, same geometry as the SVG, inside the adaptive safe area.
ns = '{http://www.w3.org/2000/svg}'
root = ET.fromstring(svg)
vector = ['<?xml version="1.0" encoding="utf-8"?>', '<vector xmlns:android="http://schemas.android.com/apk/res/android" android:width="108dp" android:height="108dp" android:viewportWidth="108" android:viewportHeight="108">', '<group android:scaleX="0.16" android:scaleY="0.16" android:translateX="9.68" android:translateY="18.48">']
for el in root.iter():
    if el.tag == ns+'circle':
        x,y,r = (float(el.get(k)) for k in ('cx','cy','r'))
        d = f'M{x-r},{y} a{r},{r} 0 1,0 {2*r},0 a{r},{r} 0 1,0 {-2*r},0'
        vector.append(f'<path android:fillColor="#0e2b30" android:pathData="{d}"/>')
    elif el.tag == ns+'path':
        transform = el.get('transform')
        if transform:
            tx,ty,angle = re.findall(r'-?\d+(?:\.\d+)?', transform)
            vector.append(f'<group android:translateX="{tx}" android:translateY="{ty}"><group android:rotation="{angle}">')
        attrs = 'android:fillColor="#0e2b30"'
        if el.get('stroke'):
            attrs = f'android:fillColor="#00000000" android:strokeColor="#0e2b30" android:strokeWidth="{el.get("stroke-width")}" android:strokeLineCap="butt"'
        vector.append(f'<path {attrs} android:pathData="{el.get("d")}"/>')
        if transform:
            vector.append('</group></group>')
vector += ['</group>', '</vector>']
(RES/'drawable-v24/ic_launcher_foreground.xml').write_text('\n'.join(vector)+'\n')
(RES/'drawable/ic_launcher_background.xml').write_text('<?xml version="1.0" encoding="utf-8"?>\n<shape xmlns:android="http://schemas.android.com/apk/res/android" android:shape="rectangle"><solid android:color="#FFFFFF"/></shape>\n')
print(f'Regenerated {len(jobs)} PNGs and 2 native drawables from {SOURCE.name}.')
