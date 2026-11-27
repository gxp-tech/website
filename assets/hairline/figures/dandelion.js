(window.__HL_FIGURES__ = window.__HL_FIGURES__ || {})["dandelion"] = () => {

const{Cam:Cam,circ:circ,disposer:disposer,facing:facing,fit:fit,hull:hull,mk:mk,open:open,poly:poly,pointer:pointer,proj:proj,register:register,seg:seg,spring:spring,stepS:stepS}=HL;
function mount({stage:stage,svg:svg,read:read},value){
const bag=disposer();let force=value,chosen=-1,drag=null;
const C=Cam(-35,.62,2.72),KS=[.25,.95];
/* ?az=&k= rest-pose override (debug): lets a headless screenshot land on
   any camera without simulating a drag - drag still works and starts
   from wherever the URL put us */
{const u=new URLSearchParams(location.search),a=parseFloat(u.get("az")),t=parseFloat(u.get("k"));
 if(!Number.isNaN(a))C.az=a*Math.PI/180;   /* URL is in degrees, Cam.az is radians */
 if(!Number.isNaN(t))C.k=Math.max(KS[0],Math.min(KS[1],t))}
/* Rick 2026-10-20 11:11 "以底部为中心点，整体位置偏方形框的右了，调到
   左右居中位置": fit() centres the projected bounding box on (cx,cy) - the
   old 228 sat 28 units right of the 400-wide stage centre (the plant's base
   was never the anchor, the bbox centre was). 200 = true horizontal centre;
   cy stays 144 so the rosette keeps its seat and the two heads keep their
   headroom */
fit(C,[[-25,-25,0],[25,25,0],[-25,0,58],[25,0,58],[0,0,58],[0,0,0],[25,-25,0]],200,144);
const PIV=[0,0,24],AT=proj(C)(...PIV);let P,front;
const look=()=>{const q=(C.ox=C.oy=0,proj(C)(...PIV));C.ox=AT[0]-q[0];C.oy=AT[1]-q[1];P=proj(C);front=facing(C)};look();
const rootG=mk("g",{},svg);
/* petal ink ladder (Rick 2026-10-19 "花瓣最上层的花瓣颜色最深，越往下层，颜色
   越浅"; 2026-10-20 00:42 "最底层花瓣描边最浅色，最高层花瓣描边最深色，以此
   类推每层花瓣描边颜色"): the stroke is no longer ONE head-wide radial
   gradient (that made every whorl carry the same ink at the same radius and
   graded spatially instead of by layer). Each whorl now owns a SINGLE flat
   ink step: palest at the rim, one step deeper per whorl, full --ink at the
   crown. The steps ride the palette tokens, so the dark-theme flip is free.
   Colours go through element.style - the kernel's
   :where(path,...){stroke:var(--hl-mid);stroke-width:...} rule beats any
   presentation attribute (setAttribute). */
const SVGNS="http://www.w3.org/2000/svg";
const defs=document.createElementNS(SVGNS,"defs");svg.appendChild(defs);
/* ---- vector helpers ---- */
const add=(a,b)=>[a[0]+b[0],a[1]+b[1],a[2]+b[2]];
const sub=(a,b)=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]];
const scl=(a,k)=>[a[0]*k,a[1]*k,a[2]*k];
const dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const len=a=>Math.hypot(a[0],a[1],a[2]);
const norm=a=>{const L=len(a)||1;return[a[0]/L,a[1]/L,a[2]/L]};
const depthOf=(x,y,z)=>{const sa=Math.sin(C.az),ca=Math.cos(C.az),zf=Math.sqrt(1-C.k*C.k);return(x*sa+y*ca)*zf+z*C.k};
/* ---- self-occlusion (Rick 2026-10-22 "大叶单个叶子弯曲弧度，导致自身
   看起来透明"): a strongly curled blade paints ALL of its line work - so
   the far margin of the curl shows through the near face and the blade
   reads as transparent. Fix: rasterise the blade's own surface samples
   into a coarse screen-cell -> max-depth grid, and keep a line sample
   only where its own depth IS the local maximum (within GEPS). The FILL
   stays the whole projection: near and folded-back far read as one
   plate-coloured sheet, which is exactly what a matte blade looks like.
   GC is in viewBox units (leaf ~30 units long); GEPS is world depth and
   sets how close to the fold the far line is allowed to linger. ---- */
const GC=2.0,GEPS=2.2;
/* majority vote along a polyline: a single sample flickering around the
   depth threshold must not chop the line into dashes */
const visSmooth=(f,w,circ)=>{const n=f.length,o=new Array(n);
  for(let i=0;i<n;i++){let c=0;
    for(let t=-w;t<=w;t++){let j=i+t;
      if(circ)j=(j+n)%n;else if(j<0||j>=n)continue;
      if(f[j])c++}
    o[i]=c>=w+1}
  return o};
/* Surface samples land in screen cells, while the contour has many more
   points. Bridge only a short false island bounded by visible contour on
   both sides: this removes raster-cell pinholes without bringing back a
   genuinely hidden far rim. */
const bridgeGaps=(f,reach,circ)=>f.map((on,i)=>{
  if(on)return true;
  let before=false,after=false;
  for(let n=1;n<=reach;n++){
    let a=i-n,b=i+n;
    if(circ){a=(a+f.length)%f.length;b%=f.length}
    if(a>=0&&f[a])before=true;
    if(b<f.length&&f[b])after=true;
  }
  return before&&after});
const visOf=(g,x,y,d)=>{const m=g.get(Math.floor(x/GC)+","+Math.floor(y/GC));
  return m===undefined||d>=m-GEPS};
const visOpen=(g,q2,q3)=>{const f=[];
  for(let i=0;i<q2.length;i++)
    f.push(visOf(g,q2[i][0],q2[i][1],depthOf(q3[i][0],q3[i][1],q3[i][2])));
  const fs=visSmooth(f,2,false);
  let d="",run=false;
  for(let i=0;i<q2.length;i++){
    if(fs[i]){
      d+=(run?"L":"M")+q2[i][0].toFixed(2)+" "+q2[i][1].toFixed(2);run=true}
    else run=false}
  return d};
/* deterministic prng so the plant is stable across loads */
let rs=987654321;const rnd=()=>{rs=(rs*1103515245+12345)&0x7fffffff;return rs/0x7fffffff};
const projPts=pts=>pts.map(p=>P(p[0],p[1],p[2]));
/* ---- blade fill: a FAN between the spine and the margin ----
   The margin is one closed loop. When a blade curls, that loop crosses
   itself in projection and a self-crossing loop under the nonzero rule
   leaves winding-zero HOLES inside the blade - a stem behind the hole shows
   through and the leaf reads as transparent (Rick 2026-10-20 "叶面还是透明的
   漏出了花茎"). Filling the loop as one path cannot fix that, and a surface
   grid cannot either: at a fold the margin chain doubles back past the
   point where the grid stops following it, so the fold's own area stays
   uncovered (measured: 0 of 7 hole cells covered).
   Triangles from the MIDRIB work: each margin edge is anchored to the
   midrib point at its own s, every triangle is wound the same way, and the
   midrib is inside the blade at every station - so the union has no
   interior hole even where the margin folds over itself. */
const leafFill=(po,sp)=>{let d="";
  for(let i=0;i<po.length;i++){
    const a=sp[i],b=po[i],c=po[(i+1)%po.length];
    const cr=(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);
    const t=cr<0?[a,c,b]:[a,b,c];
    d+="M"+t[0][0].toFixed(1)+" "+t[0][1].toFixed(1)
      +"L"+t[1][0].toFixed(1)+" "+t[1][1].toFixed(1)
      +"L"+t[2][0].toFixed(1)+" "+t[2][1].toFixed(1)+"Z"}
  return d};
const closedCurve=pts=>{if(pts.length<3)return poly(pts);const f=n=>Number(n.toFixed(2));let d=`M${f(pts[0][0])} ${f(pts[0][1])}`;for(let i=0;i<pts.length;i++){const p0=pts[(i+pts.length-1)%pts.length],p1=pts[i],p2=pts[(i+1)%pts.length],p3=pts[(i+2)%pts.length],c1=[p1[0]+(p2[0]-p0[0])/6,p1[1]+(p2[1]-p0[1])/6],c2=[p2[0]-(p3[0]-p1[0])/6,p2[1]-(p3[1]-p1[1])/6];d+=`C${f(c1[0])} ${f(c1[1])} ${f(c2[0])} ${f(c2[1])} ${f(p2[0])} ${f(p2[1])}`}return d+"Z"};
/* resample a closed 2D polyline to n points, evenly by arc length */
const resamp=(pts,n)=>{const d=[0];let tot=0;
  for(let i=0;i<pts.length;i++){const a=pts[i],b=pts[(i+1)%pts.length];
    tot+=Math.hypot(b[0]-a[0],b[1]-a[1]);d.push(tot)}
  const out=[];let i=0;
  for(let k=0;k<n;k++){const t=k/n*tot;
    while(i<pts.length-1&&d[i+1]<t)i++;
    const f=(t-d[i])/((d[i+1]-d[i])||1),a=pts[i],b=pts[(i+1)%pts.length];
    out.push([a[0]+(b[0]-a[0])*f,a[1]+(b[1]-a[1])*f])}
  return out};
/* ---- layers ---- */
const gCrown=mk("g",{},rootG);
/* ---- LEAF: one runcinate blade. The margin is built in (s, eo) blade
   coordinates as a chain of deep sinuses and triangular lobes whose tips
   lean back toward the leaf base; the terminal (apex) lobe at the top of
   the leaf is the largest of all. Every lobe edge carries small sharp
   teeth and every point is jittered, so no two lobes match. The outline
   is stroked as short runs of varying width and darkness (a random walk
   along the margin) laid over a faint continuous core — the hand-drawn
   line. Venation is a regular brochidodromous framework the way a
   skeletonised leaf reads: secondaries leave the midrib at even stations
   and bow out to just short of the margin, where a submarginal vein
   gathers their ends; between every pair, perpendicular tertiary rungs
   and near-parallel intermediate veinlets weave a warped quadrilateral
   grid whose cells shrink toward base and apex. The blade lies in a
   horizontal plane, arches up mid-length, droops at the tip and is
   V-folded across the midrib. ---- */
function buildLeaf(phi,L,z0,rise,drop,hwMax,fold,tilt=0,twist=0,lobes=6,amp=1,serr=1,zAmp=1,lift=0,hookA=1,back=0,tipA=0,swA=1,archA=0,zSym=0,bulge=0,soft=1,fish=0,round=0,ref=0,refSrc=0){
  const dx=Math.cos(phi*Math.PI/180),dy=Math.sin(phi*Math.PI/180);
  const rAt=s=>L*Math.pow(s,0.95),hAt=s=>z0+rise*s-drop*s*s;
  const Pt=(r,h)=>[r*dx,r*dy,h];
  const wOf=ref?(s=>{const x=Math.min(1,Math.max(0,s)),p=0.68;
    /* REF recipe (botanical dandelion plate, Rick 2026-10-19): narrow
       petiole-like base (only ~13% width at s=.15), broadest rounded
       region at ~2/3, tapering to the pointed tip */
    return hwMax*(x<p?Math.pow(Math.sin(Math.PI*0.5*x/p),1.9)
                  :Math.pow(Math.cos(Math.PI*0.5*(x-p)/(1-p)),0.9))}):(s=>{const x=Math.min(1,Math.max(0,s)),p=0.60;
    return hwMax*(x<p?Math.pow(Math.sin(Math.PI*0.5*x/p),1.25)
                  :Math.pow(Math.cos(Math.PI*0.5*(x-p)/(1-p)),0.85))});
  /* the whole blade rides ONE undulating surface: slow rim waves along s,
     signed by which side of the midrib, fading toward the midrib where
     the two sides meet. Every drawn line — edge, laterals, net — maps
     through bladePt and therefore hugs the same surface; nothing floats */
  /* side-sinus layout, shared by margin() and the lobe-lift below */
  const NS=lobes,sS0=0.13,sS1=0.665;
  const zwP1=rnd()*6.283,zwP2=rnd()*6.283;
  /* zAmp scales EVERY body ripple of the blade - edge waves, spine
     wobble AND the planar S-sway (Rick 2026-10-16: "z 轴上波幅也缩小
     些" then "基生叶在 y 轴上的波幅太大了" - with the camera at az -35
     the sway projects into screen-y almost as strongly as the z waves,
     so both come down together). Default 1 = big-leaf recipe */
  /* zSym=1 (basal trio): run the edge ripples with the SAME sign on both
     sides. The counter-phased default (mirror ripple) was the big-leaf
     recipe, but once a blade stands up the mirrored ripple reads as one
     rim riding high while the other sags - exactly the "left lower,
     right higher" Rick flagged (Rick 2026-10-16) */
  const zEdge=(s,eo)=>(zSym?1:(eo<0?-1:1))*Math.min(1,Math.abs(eo)/1.7)
    *(1.0*zAmp*Math.sin(s*24+zwP1)+0.6*zAmp*Math.sin(s*53+zwP2));
  /* ---- 3D spine sway (Rick 2026-10-16: "主脉增加些变形不要太直，
     可以在x\y\z各个方向上有个弯曲，突出360度的真实感"): the axis
     drifts sideways in plan (a gentle S, two frequencies), ripples in
     height, and both fade in from the petiole. The WHOLE blade maps
     through this spine - margin, net, laterals and midrib all follow,
     so nothing floats off the surface while the leaf turns 360 ---- */
  const swP1=rnd()*6.283,swP2=rnd()*6.283,zwP3=rnd()*6.283;
  /* swA tames ONLY the planar S-sway, independently of the z ripples
     (Rick 2026-10-16: "x 轴上波动幅度也减弱些" - after zAmp pulled the
     sway down along with the z waves, the in-plane weave still reads as
     too much on the small blades; it gets its own dial so the z ripples
     stay where they are). Default 1 = big-leaf recipe */
  const sway=s=>(0.8*Math.sin(s*9.5+swP1)+0.45*Math.sin(s*17.3+swP2))
    *Math.pow(Math.max(0,s),1.2)*zAmp*swA;
  const zWob=s=>(0.30*zAmp*Math.sin(s*13.7+zwP3)+0.16*zAmp*Math.sin(s*29+zwP1))
    *Math.pow(Math.max(0,s),1.1);
  /* TIP STAND-UP (Rick 2026-10-16: "基生叶，尖端再往上（z方向）立起来一些"):
     an extra z rise on the spine itself, fading in from the petiole (zero
     at s=0, so the rosette centre, crown disc and soil junction are
     untouched) and peaking at the leaf tip - the terminal lobe lifts
     clear of the soil without tilting the whole blade. Applied to
     axisPt, so the midrib, margin, net and laterals all ride the same
     raised spine. tipA=0 (default) leaves the big leaves untouched */
  const tipLift=s=>tipA*Math.pow(Math.max(0,s),2.4);
  /* ARCH (Rick 2026-10-16: "基生叶中间要向上拱形凸起"): a broad swell
     over the MIDDLE of the spine (peak at s=.5, zero at both ends) - the
     tip stand-up alone is a monotonic ramp that merely passes through
     mid-blade. Stacks on the arc + tip rise; verified numerically to
     keep the combined axis monotonic (arch falls back to zero by s=.7
     while the tip ramp is already steeper there). archA=0 = big-leaf
     recipe untouched. NB: Math.max(0,sin) - samplers occasionally
     evaluate s just outside [0,1] where sin goes negative and a
     negative base with a fractional exponent is NaN */
  const archLift=s=>archA*Math.pow(Math.max(0,Math.sin(Math.PI*s)),1.5);
  const axisPt=s=>add(add(add(Pt(rAt(s),hAt(s)),[-dy*sway(s),dx*sway(s),0]),[0,0,zWob(s)]),[0,0,tipLift(s)+archLift(s)]);
  /* ---- blade frame (Rick 2026-10-16: "复制一个叶子，向z轴更立一些，并z轴
     上扭曲些"): the lateral direction starts as the horizontal perpendicular
     to the axis. tilt rotates it around the LOCAL spine tangent so the blade
     stands up off the axis; twist then sweeps it around the world z axis,
     progressively from the petiole (0 at s=0), so the blade corkscrews as
     it rises. Every drawn line maps through bladePt, so margin, net,
     laterals and midrib ridge all follow this one frame ---- */
  const axisTan=s=>{const e=0.004;
    return norm(sub(axisPt(Math.min(1,s+e)),axisPt(Math.max(0,s-e))))};
  const tiltR=tilt*Math.PI/180,twR=twist*Math.PI/180;
  const latDirAt=s=>{
    const u0=[dy,-dx,0];
    if(!tiltR&&!twR)return u0;
    let u=u0;
    if(tiltR){
      const t=axisTan(s),k=cross(u0,t);   /* u0 x t points UP on a rising axis */
      const c=Math.cos(tiltR),sn=Math.sin(tiltR);
      u=[u0[0]*c+k[0]*sn,u0[1]*c+k[1]*sn,u0[2]*c+k[2]*sn]}
    if(twR){
      const a=twR*s,c=Math.cos(a),sn=Math.sin(a);
      u=[u[0]*c-u[1]*sn,u[0]*sn+u[1]*c,u[2]]}
    return norm(u)};
  /* LOBE LIFT (Rick 2026-10-16: "侧裂片...倒齿状，也要立起来一些"): every
     side lobe swells UP off the blade surface, peaking at the lobe tip
     (the hooked spine) and falling back to zero in the sinus between
     lobes, so the runcinate margin reads as raised REVERSED TEETH instead
     of a flat cut-out; the terminal lobe lifts as one broad swell. The
     lift fades in from the midrib. lift=0 (default) leaves the big
     leaves exactly as they were */
  const span=(sS1-sS0)/NS;
  const lobeLift=(s,eo)=>{
    if(!lift)return 0;
    const bump=s<sS0?0:(s<sS1?Math.sin(Math.PI*(s-sS0)/span)
                             :1.15*Math.sin(Math.PI*Math.min(1,(s-sS1)/(1-sS1))));
    return lift*bump*Math.min(1,Math.abs(eo)/(hwMax*0.72))};
  const bladePt=(s,eo)=>{
    const droop=fold*(Math.abs(eo)/hwMax)*(0.5+0.55*Math.min(1,s));
    const u=latDirAt(s);
    const p=add(add(axisPt(s),[u[0]*eo,u[1]*eo,u[2]*eo]),[0,0,-droop]);
    p[2]+=zEdge(s,eo)+lobeLift(s,eo);return p};
  const jit=v=>v*(0.9+0.2*rnd());
  /* ---- multi-pass Catmull-Rom smoothing (round = pass count). Pass 1
     keeps the sharp-corner duplication (turn past 90 deg pins the spline
     so tooth tips / sinus bottoms stay crisp); every FURTHER pass runs
     with NO duplication and coarser sampling, so corners melt a little
     more each pass. round=1 reproduces the old single-pass result ---- */
  const roundPts=(pts,passes)=>{
    for(let p=0;p<passes;p++){
      const src=pts,cr=[src[0]];
      for(let i=1;i<src.length-1;i++){
        const A=src[i-1],B=src[i],C=src[i+1];
        const ux=B[0]-A[0],uy=B[1]-A[1],vx=C[0]-B[0],vy=C[1]-B[1];
        const nu=Math.hypot(ux,uy),nv=Math.hypot(vx,vy);
        const cs=nu>1e-9&&nv>1e-9?(ux*vx+uy*vy)/(nu*nv):0;
        (p===0&&cs<=0)?cr.push(B,B):cr.push(B);
      }
      cr.push(src[src.length-1]);
      const K=p===0?6:2,sm=[cr[0]];
      for(let i=0;i<cr.length-1;i++){
        const p0=cr[Math.max(0,i-1)],p1=cr[i],p2=cr[i+1],p3=cr[Math.min(cr.length-1,i+2)];
        for(let k=1;k<=K;k++){
          const t=k/K,t2=t*t,t3=t2*t;
          sm.push([0.5*(2*p1[0]+(-p0[0]+p2[0])*t+(2*p0[0]-5*p1[0]+4*p2[0]-p3[0])*t2+(-p0[0]+3*p1[0]-3*p2[0]+p3[0])*t3),
                   0.5*(2*p1[1]+(-p0[1]+p2[1])*t+(2*p0[1]-5*p1[1]+4*p2[1]-p3[1])*t2+(-p0[1]+3*p1[1]-3*p2[1]+p3[1])*t3)]);
        }
      }
      pts.length=0;for(const q of sm)pts.push(q);
    }
    return pts};
  /* ---- runcinate margin in (s, eo), eo >= 0: narrow deep V sinuses;
     each lobe swells into a fleshy bulge, then hooks to a sharp apex
     that leans back over the sinus, then falls along a long concave
     edge (with small forward-leaning serrations) into the next sinus.
     The terminal region carries NO sinus of its own — the top lobe is
     one merged triangle sweeping from the last side sinus clear to the
     leaf tip, the largest of all ---- */
  /* Rick 2026-10-16 ("基生叶的凸起太多了"): lobes/amp/serr tame the
     runcinate margin for the SMALL basal leaves - fewer side sinuses,
     shallower cuts and bulges, fewer spines. All three default to the
     big-leaf recipe, so leaves 1-2 are untouched */
  function margin(){
    const sinS=[],sinW=[];
    for(let j=0;j<NS;j++){
      const s=sS0+(sS1-sS0)*j/(NS-1)+(rnd()-0.5)*0.035;
      sinS.push(s);sinW.push(wOf(s)*jit(0.14*amp))}
    const tips=[];
    const pts=[[0.005,0.015],[sinS[0],sinW[0]]];
    const J=(s,e)=>[Math.max(0.004,s+(rnd()-0.5)*0.006),Math.max(0.008,e+(rnd()-0.5)*0.01)];
    for(let j=0;j<NS;j++){
      const last=j===NS-1;
      const g=(last?0.97:sinS[j+1])-sinS[j];
      const eEnd=last?0.03:sinW[j+1];
      const wHi=wOf(sinS[j]+g*0.3);
      /* steep wall climbing out of the sinus - soft stretches the climb
         and lowers its head so the corner at the bulge breathes */
      const wall=Math.max(sinW[j],wHi*(0.5-(soft-1)*0.09)*amp);
      pts.push(J(sinS[j]+g*(0.10+(soft-1)*0.06),wall));
      /* the fleshy bulge of the lobe, slid forward a touch when bowed */
      const eB=(last?hwMax*1.06:wHi*jit(0.98))*amp;
      pts.push(J(sinS[j]+g*(0.22+bulge*0.04),eB));
      if(rnd()<0.7)pts.push(J(sinS[j]+g*(0.32+bulge*0.05),eB*0.93));  /* shoulder tooth */
      /* hooked apex corner leaning back over the sinus (Rick 2026-10-16
         "侧裂片要更形象些，倒齿状": hookA keeps the tip tall and proud,
         back slides it further toward the leaf base so each lobe reads
         as a REVERSED TOOTH; soft lengthens the run into the tip).
         FISH-BONE LEAN (Rick 2026-10-16: "侧裂片的走势应该像这个截图里
         的红色线标注的一样，鱼骨一样有个向前的趋势"): fish slides the
         tip FORWARD along the spine by fish*span (side lobes only - the
         terminal lobe stays put), leaning the whole lobe into a slanted
         barb: the sinus keeps hugging the spine while the tip reaches
         toward the leaf tip. fish 0.45 puts the back ridge ~48 degrees
         off the spine (the upright recipe ran ~29) and lets the tip
         overhang the next sinus, which is exactly the fish-bone
         silhouette of the red annotation. The belly then folds back
         from the overhanging tip to the next sinus (s runs backward
         there), so the barb keeps its hook */
      const sAg=0.46+back+(soft-1)*0.05+(last?0:fish);
      const sA=sinS[j]+g*jit(sAg),eA=(last?hwMax*0.95:wHi*jit(0.84))*amp*hookA;
      /* bowed tooth-back (Rick 2026-10-16: "有些向前的曲线"): with bulge>0
         an extra crown point sits FORWARD of the straight run between the
         climb and the tip, so the back of each lobe arcs toward the leaf
         tip - a curved reversed tooth, not a folded triangle. It rides the
         mid-point of the (possibly fish-leaned) back run */
      if(bulge>0)pts.push(J(sinS[j]+g*((0.10+(soft-1)*0.06)*0.55+sAg*0.45+bulge*0.05),(eB+wall)*0.5*(1+bulge*0.06)));
      pts.push(J(sA,eA));tips.push([sA,eA]);
      /* belly: folds from the tip back to the next sinus - a small hook
         step right under the tip keeps the barb pointed, and bulge bows
         the run forward too. fish shifts the whole belly toward the
         overhanging tip (zero shift at t=1, so the chain still lands
         exactly on the next sinus) */
      const nT=last?3:2+Math.floor(rnd()*2);
      for(let i=1;i<=nT;i++){
        const t=i/(nT+1);
        const sD=sinS[j]+g*(0.46+(1-0.46)*t+bulge*0.08*Math.sin(Math.PI*t)+(last?0:fish)*(sAg-0.46)*(1-t));
        const eD=eA+(eEnd-eA)*Math.pow(t,1.15)-eA*0.08*amp*Math.sin(Math.PI*t);
        pts.push(J(sD,eD));
        pts.push(J(sD+g*0.05*(0.6+rnd()*0.8),eD+(eEnd-eD)*0.3))}
    }
    pts.push([0.99,0.02],[1,0.006]);
    /* EDGE ROUNDING (Rick 2026-10-16: "两个大叶边缘线改圆润些，先不考虑
       刺了"): applied HERE, on the structural chain BEFORE the envelope
       and serrations are derived - the margin LOOK comes from the lattice
       boundary and width envelope (both cut from `flat`), so rounding the
       outline alone moved 114 px and read as no change. Catmull-Rom
       through the chain, sampled back to a polyline: every segment
       becomes a genuine curve. Sharp corners (turn past 90 deg: tooth
       tips, sinus bottoms) are DUPLICATED first, which pins the spline
       and keeps them crisp; NO monotone clamp on s - the fish-bone belly
       intentionally folds BACKWARD in s (the tip overhangs the next
       sinus), and clamping collapsed every belly onto the tip station,
       erasing the sinuses (Rick 2026-10-16 "侧裂片没了?"). The envelope
       lookups (margOf/margW) tolerate the folded chain the same way they
       did before rounding existed. round=0 (default) skips it */
    if(round>0)roundPts(pts,Math.max(1,Math.round(round)));
    /* micro serrations: tiny sharp spikes inserted between the structural
       points — fine edge detail that leaves the lobe layout untouched */
    const flat=pts.slice(),spiky=[];
    for(let i=0;i<flat.length-1;i++){
      const A=flat[i],B=flat[i+1],ds=B[0]-A[0],de=B[1]-A[1];
      spiky.push(A);
      const m=1+Math.floor(rnd()*3*serr);
      for(let k=1;k<=m;k++){
        const t=k/(m+1),sM=A[0]+ds*t,eM=A[1]+de*t;
        if(eM<0.06)continue;
        const r=rnd();
        if(r<0.30*serr&&eM>0.25&&ds>0.012){
          /* a true SPINE: the outline line itself kicks out to a sharp
             point and comes back - the spike IS the margin, not a
             separate stroke (Rick 2026-10-16: "是一条线的突出成刺，
             不是单独1个线段"). Height and root width both random; the
             hand-drawn edge runs inherit the weight wherever the
             spike lands, so thickness varies spine to spine */
          const h=(0.8+rnd()*1.4)*amp,hw=Math.max(0.008,ds*0.5+(rnd()-0.5)*ds*0.3);
          spiky.push([sM+hw*0.35,eM+h*0.7]);
          spiky.push([sM+hw*0.55,eM+h]);
          spiky.push([sM+hw*0.8,eM+h*0.5]);
          spiky.push([sM+hw,Math.max(0.01,eM)]);
        }else if(r<0.85*serr){
          spiky.push([sM+ds*0.03,eM+(0.15+rnd()*0.26)*amp]);
          spiky.push([sM+ds*0.06,Math.max(0.01,eM)])}}
    }
    spiky.push(flat[flat.length-1]);
    return{pts:spiky,flat,tips}}
  /* ---- REF MARGIN (Rick 2026-10-19: "严格按照这个参考图绘制" - the
     botanical dandelion plate): a spatulate blade carrying only SHALLOW
     irregular rounded teeth - depth 10-25% of the LOCAL width, spacing
     uneven, fading out at the petiole-like base and at the tip. No deep
     V sinuses, no hooked barbs, no belly folds: the sawtooth read came
     from those. The chain is sampled dense from a cosine-interpolated
     tooth envelope (so teeth are born ROUND) and eased by two rounding
     passes ---- */
  function marginRef(){
    const ctrl=[[0.004,1]];
    const dep=s=>Math.max(0,Math.min(1,(s-0.24)/0.10))*Math.max(0,Math.min(1,(0.965-s)/0.07));
    {let s=0.29+rnd()*0.02;
     while(s<0.955){
       const d=dep(s)*(0.10+0.15*rnd());
       ctrl.push([s-0.014-rnd()*0.012,1-d]);
       ctrl.push([s+(rnd()-0.4)*0.012,1.0+rnd()*0.04]);
       s+=0.034+rnd()*0.03}}
    ctrl.push([0.995,0.9]);
    const val=s=>{for(let i=1;i<ctrl.length;i++)
        if(ctrl[i][0]>=s){const a=ctrl[i-1],b=ctrl[i],t=(s-a[0])/Math.max(1e-6,b[0]-a[0]);
          const u=(1-Math.cos(Math.PI*Math.max(0,Math.min(1,t))))/2;
          return a[1]+(b[1]-a[1])*u}
      return 1};
    const pts=[];
    for(let i=0;i<=240;i++){const s=0.004+0.992*i/240;
      pts.push([s,Math.max(0.008,wOf(s)*val(s)*(1+(rnd()-0.5)*0.05))])}
    roundPts(pts,2);
    return{pts,flat:pts.slice(),tips:[]}}
  /* REF + refSrc: outline TRACED 1:1 from the botanical plate
     (REF_TRACE, generated by scripts/trace-ref-leaf.py). Each chain is
     [s, e] x 140 with e = halfwidth / leaf-length, so world halfwidth =
     e*L and the plate proportions carry over exactly. No jitter, no
     smoothing - the chain IS the reference contour */
  const chainM=T=>{const q=T.map(([s,e])=>[s,e*L]);return{pts:q,flat:q.slice(),tips:[]}};
  const mL=ref?(refSrc?chainM(REF_TRACE[refSrc].A):marginRef()):margin(),
        mR=ref?(refSrc?chainM(REF_TRACE[refSrc].B):marginRef()):margin();
  /* true local margin width per side (smooth structural chain) — the
     midrib pair must fit inside the pointed base wedge too, not just
     inside the smooth width envelope */
  const margOf=(m,s)=>{const F=m.flat;
    for(let i=1;i<F.length;i++)
      if(F[i][0]>=s){const a=F[i-1],b=F[i],t=(s-a[0])/Math.max(1e-6,b[0]-a[0]);
        return a[1]+(b[1]-a[1])*t}
    return F[F.length-1][1]};
  const outline=mL.pts.map(([s,e])=>bladePt(s,e))
    .concat(mR.pts.slice().reverse().map(([s,e])=>bladePt(s,-e)));
  /* the blade FILL is a fan between the spine and the margin (see leafFill):
     every outline point carries its own s, so each margin edge can be
     anchored to the midrib point that belongs to it. */
  const outS=mL.pts.map(p=>p[0]).concat(mR.pts.slice().reverse().map(p=>p[0]));
  const spine=outS.map(s0=>axisPt(s0));
  const midrib=[];const MID_END=1;      /* full length again (Rick 2026-10-16) */
  for(let i=0;i<=48;i++){const s=i/48*MID_END;midrib.push(axisPt(s))}
  /* paired midrib: two lines riding either side of the centreline,
     squeezing together to a single hair at the tip. The offset is
     clamped to the local blade width — near the petiole wedge the
     blade is narrower than the nominal offset, and an unclamped pair
     would hang off the leaf entirely. Rick 2026-10-16: full length
     again, but the pair FADES toward the tip - opacity walks down
     segment by segment so the vein dissolves instead of ending */
  const wMid=s=>Math.min(0.28*Math.pow(Math.max(0,1-s),1.1)+0.03, wOf(s)*0.55,
    Math.min(margOf(mL,s),margOf(mR,s))*0.85)*Math.min(1,(MID_END-s)/0.10+0.12);
  /* ---- midrib as a true 3D ridge (Rick 2026-10-16: "主脉改成圆柱的
     三维都有宽度，越往上越扁"): an elliptical tube swept along the
     deformed spine. Half-width a rides in the blade plane; thickness b
     is the surface-normal half-axis, and b/a FALLS toward the tip
     (1 -> .3) so the cross-section flattens into a low ridge up top.
     The silhouette is recomputed per camera in build() - the pair of
     edge lines never collapses, whatever the azimuth ---- */
  const midA=[],midB=[];
  for(let i=0;i<=48;i++){const s=i/48*MID_END,a=wMid(s)*1.15;
    midA.push(a);midB.push(a*(1-0.7*Math.pow(s,1.3)))}
  /* the ridge's in-plane width axis at each midrib station (the blade
     lateral direction there - tilted/twisted for the standing leaf) */
  const latDirs=[];for(let i=0;i<=48;i++)latDirs.push(latDirAt(i/48*MID_END));
  /* ---- venation: leaf-skeleton style (Rick's reference is a cleared
     leaf skeleton). Secondaries were REMOVED at Rick's request
     (2026-10-15: "二级脉移除") - the blade carries only the paired
     midrib plus ONE warped brick lattice over the whole blade: rails
     at constant fractions of the local margin width, crossveins at
     fixed s stations (odd strips staggered half a cell), and a
     hair-fine veinlet inside each areole. Cell size is fixed in WORLD
     units, so the mesh stays even as the blade narrows; everything is
     clipped to the true margin. A submarginal collect vein hugs the
     edge ---- */
  const fineA=[],fineB=[],lat=[];
  for(const[m,sg]of[[mL,1],[mR,-1]]){
    /* the real local margin width at any s (from the smooth structural
       chain): every vein stays INSIDE this, sinus dips included */
    const F=m.flat;
    const margW=s=>{for(let i=1;i<F.length;i++)
        if(F[i][0]>=s){const a=F[i-1],b=F[i],t=(s-a[0])/Math.max(1e-6,b[0]-a[0]);
          return a[1]+(b[1]-a[1])*t}
      return F[F.length-1][1]};
    /* CLIP a (s,e) polyline to the blade: walk forward and stop at the
       first point past the true margin, ending exactly ON it. The margin
       is deeply runcinate, so a vein aimed across a sinus notch ENDS at
       the notch - the way real laterals do - instead of being flattened
       into a kink across it. t is CLAMPED: where the margin drops
       steeply between two points the previous point can already sit
       below the new limit, and an unclamped t extrapolates backwards
       into huge negative s - rAt() then returns NaN */
    const clip=P=>{const out=[];
      for(let i=0;i<P.length;i++){
        const s=P[i][0],e=P[i][1],lim=margW(s)*0.9;
        if(e<=lim){out.push(P[i]);continue}
        if(out.length){const a=out[out.length-1];
          const t=Math.max(0,Math.min(1,(lim-a[1])/Math.max(1e-6,e-a[1])));
          out.push([a[0]+(s-a[0])*t,lim])}
        break}
      return out.length>1?out:null};
    if(ref){
      /* ---- REF VENATION (botanical plate, Rick 2026-10-19): ONLY two
         tiers - the midrib (drawn elsewhere) plus thin pinnate laterals
         that sweep toward the apex and fork 2-3 ways near their end.
         NO lattice, NO submarginal loop: the reference carries nothing
         between the laterals, and the old brick mesh was the "太碎" ---- */
      /* Rick 2026-10-19 "小叶的次脉减少些": the basal trio is ~40% the
         length of the big pair, so 13 stations per side crowd into a blade
         with a third of the area and the laterals fuse into a hatch. The
         station count now follows blade length - big pair 13, basal 8 -
         which also drops the end forks proportionally (each lateral forks
         2-3 ways). NOTE: nS changes consume fewer rnd() draws, so the
         shared deterministic stream shifts for everything built after the
         basal defs (margin run weights, mound jitter). That is inherent to
         the single-stream prng, not a bug */
      const nS=L>40?13:8;
      for(let i=0;i<nS;i++){
        if(rnd()<0.08)continue;
        const s0=0.14+0.78*i/(nS-1)+(rnd()-0.5)*0.014;
        const lean=0.045+rnd()*0.035;
        const sE=Math.min(0.97,s0+lean*1.15);
        const eE=Math.max(0.3,margW(sE)*(0.72+0.16*rnd()));
        const tf=0.62+0.18*rnd();
        const ax=[];
        for(let u=0;u<=8;u++){const t=u/8*tf;
          ax.push([s0+lean*Math.pow(t,1.5)+(rnd()-0.5)*0.004,
                   0.03+eE*t+(rnd()-0.5)*0.03])}
        const Q=clip(ax);if(Q)fineA.push(Q.map(([s2,e2])=>bladePt(s2,e2*sg)));
        const fS=s0+lean*Math.pow(tf,1.5),fE=0.03+eE*tf;
        const nb=2+(rnd()<0.3?1:0);
        for(let b=0;b<nb;b++){
          const bl=lean*(0.55+1.1*(nb>1?b/(nb-1):0.5))*(0.8+0.4*rnd());
          const eb=Math.min(margW(Math.min(0.98,fS+bl))*0.88,fE+(eE-fE)*(1.02+0.2*rnd()));
          const br=[];
          for(let u=0;u<=5;u++){const t=u/5;
            br.push([fS+bl*Math.pow(t,1.4)+(rnd()-0.5)*0.004,
                     fE+(eb-fE)*t+(rnd()-0.5)*0.03])}
          const Q2=clip(br);if(Q2)fineB.push(Q2.map(([s2,e2])=>bladePt(s2,e2*sg)));
        }
      }
    }else{
    /* ---- SWEEPING reticulum, v2 (Rick 2026-10-16: "晶格要跟叶面真实
       贴合，俯视太规整像砖墙，四边形改五边形，更自然"). Same sweep
       layout - running lines leave the midrib at stations and slant
       to the apex - but nothing is straight any more: stations carry
       placement jitter, every running line bows away from straight
       (per-line lean and curl), row depths step unevenly, and every
       cross bar / half-bar is a shallow arc. The staggered-out bays
       ALL carry a half-bar (free T-end, like the reference's
       crossveins), so cells read as pentagons with only the rare
       quad surviving ---- */
    const DSW=0.55,CH=0.5,SW2=L*0.98;   /* halved 2026-10-16 */
    const stn=[],lean=[],curl=[];
    {let s0=0.012;
     while(s0<0.93){stn.push(s0+(rnd()-0.5)*0.28*DSW/SW2);s0+=DSW/SW2}}
    stn.push(0.968);
    for(let i=0;i<stn.length;i++){
      lean.push(0.30+(rnd()-0.5)*0.12);
      curl.push((rnd()-0.5)*1.0)}
    const sAt=(i,e)=>stn[i]+lean[i]*e/SW2+curl[i]*Math.pow(e/SW2,2);
    /* NOTE (Rick 2026-10-16): only the MIDRIB fades to the tip - the
       lattice keeps a UNIFORM weight along the whole blade */
    for(let i=0;i<stn.length;i++){
      const pts=[];let e=0;
      while(true){const s=sAt(i,e);
        if(s>0.992||e>margW(s)*0.93)break;
        pts.push([s+(rnd()-0.5)*0.004,e+(rnd()-0.5)*0.05]);
        e+=0.18}
      const Q=clip(pts);if(Q)fineA.push(Q.map(([s2,e2])=>bladePt(s2,e2*sg)))}
    /* cross rows at uneven depths; pairs + arc */
    const rows=[];{let e=0.3+0.2*rnd();
      while(e<7.0){rows.push(e);e+=CH*(0.72+0.56*rnd())}}
    for(let k=0;k<rows.length;k++){
      const eK=rows[k];
      for(let i=k%2;i+1<stn.length;i+=2){
        const sa=sAt(i,eK),sb=sAt(i+1,eK);
        if(sb>0.985)break;
        if(eK>margW((sa+sb)/2)*0.93)continue;
        const bw=(rnd()<0.5?-1:1)*(0.025+0.045*rnd()),pts=[];
        for(let u=0;u<=3;u++){const tt=u/3;
          pts.push([sa+(sb-sa)*tt+(rnd()-0.5)*0.012,
                    eK+bw*Math.sin(Math.PI*tt)+(rnd()-0.5)*0.04])}
        const Q=clip(pts);if(Q)fineA.push(Q.map(([s2,e2])=>bladePt(s2,e2*sg)))}
      /* a half-bar in EVERY staggered-out bay -> pentagon dominance */
      for(let i=(k+1)%2;i+1<stn.length;i+=2){
        const sa=sAt(i,eK),sb=sAt(i+1,eK);
        if(sb>0.985)break;
        if(eK>margW((sa+sb)/2)*0.93)continue;
        if(rnd()<0.08)continue;
        const fromL=rnd()<0.5;
        const s0=fromL?sa:(sa+sb)/2,s1=fromL?(sa+sb)/2:sb;
        const bw=(rnd()<0.5?-1:1)*(0.02+0.04*rnd()),pts=[];
        for(let u=0;u<=3;u++){const tt=u/3;
          pts.push([s0+(s1-s0)*tt+(rnd()-0.5)*0.012,
                    eK+bw*Math.sin(Math.PI*tt)+(rnd()-0.5)*0.04])}
        const Q=clip(pts);if(Q)fineA.push(Q.map(([s2,e2])=>bladePt(s2,e2*sg)))}}
    /* submarginal collect vein hugging the edge (smooth chain, no teeth) */
    fineA.push(F.map(([s,e])=>bladePt(s,Math.max(0.02,e*0.9)*sg)));
    /* ---- short laterals off the midrib (Rick 2026-10-16: "沿着主脉
       新增几条副脉，短一些颜色和主脉一致"): a few per side, same
       --hl-edge ink as the midrib, reaching only ~1/3 of the way to
       the margin, slanting toward the apex, each carrying the
       midrib's LOCAL opacity so they dissolve together with it ---- */
    for(let j=0;j<4;j++){
      if(rnd()<0.15)continue;
      const s0=0.10+0.74*(j+rnd()*0.5)/4;
      const reach=Math.max(0.5,margW(s0)*(0.26+rnd()*0.12));
      /* Rick 2026-10-16: nearly TRANSVERSE off the midrib - only a
         hint of forward slant, not a narrow fork */
      const lean=0.005+rnd()*0.018,bow=(rnd()-0.5)*0.02;
      const pts=[];
      for(let u=0;u<=4;u++){const t=u/4;
        pts.push([s0+lean*Math.pow(t,1.2)+bow*Math.sin(Math.PI*t)+(rnd()-0.5)*0.004,
                  0.03+reach*t+(rnd()-0.5)*0.04])}
      const Q=clip(pts);if(Q)lat.push({pts:Q.map(([s,e])=>bladePt(s,e*sg)),
        o:MID_O[Math.min(5,Math.floor(s0*6))]})}
    }
  }
  let c=[0,0,0];for(const p of outline)c=add(c,p);c=scl(c,1/outline.length);
  /* Dense blade-surface grid (s along the spine x e across), used by the
     stem/leaf occlusion test as well as the blade's own line visibility.
     Stem cells are only a few pixels wide, so the old 25x9 sampling left
     gaps through which a near leaf could leak its background stem. */
  const surf=[],surfRows=[];
  for(let i=0;i<=64;i++){const s=0.01+0.98*i/64,eL=margOf(mL,s),eR=margOf(mR,s);
    const row=[];for(let j=0;j<=24;j++){const t=-1+2*j/24,q=bladePt(s,t*(t>=0?eL:eR));
      surf.push(q);row.push(q)}surfRows.push(row)}
  /* Each raised side lobe gets a short inset contour following the same
     blade surface. Unlike a silhouette-only fold, these traces remain
     visible on a smooth convex lobe that never turns away from the camera. */
  const ridgeTraces=[];
  if(lift)for(const[m,sg]of[[mL,1],[mR,-1]])for(let k=0;k<NS;k++){
    const centre=sS0+(k+0.5)*span,half=span*.31,trace=[];
    for(let q=0;q<=7;q++){const s=centre-half+2*half*q/7;
      trace.push(bladePt(s,sg*margOf(m,s)*0.78))}
    ridgeTraces.push(trace)}
  return{outline,spine,outS,midC:midrib,midA,midB,latDirs,fineA,fineB,lat,centroid:c,ref,surf,surfRows,ridgeTraces,length:L}}
const RN=320,RPB=7,RUNS=Math.floor(RN/RPB);
const MID_O=[.55,.44,.33,.22,.12,.03]; /* midrib: DARK GRAY ink (--hl-hi)
   at low opacity - reads as gray, dissolves to nothing at the tip;
   shared with the laterals so they match the ridge */
/* leaf 1: the original arching blade. leaf 2 (Rick 2026-10-16): an exact
   COPY of leaf 1 - same size, same arch, FLAT (no tilt, no twist), just
   pointed the opposite way (phi 205) so the two form a symmetric pair
   from one rosette centre. The earlier standing/twisted copies were
   rejected and removed ("删了复制的这个叶子，重新复制" then "复制和第一篇
   叶子一样的叶子，不要立和扭曲") */
/* PLANT LIFT (Rick 2026-10-16: "除土堆外的其他元素都向上移动些距离"):
   the whole plant - big pair, basal trio, scapes, rosette disc - is
   raised while the soil mound stays on the ground. Rick then levelled
   everything at one height ("花茎和叶子的起点调到2.8，封顶也要在2.8"):
   PLANT_BASE 2.8 is simultaneously the leaf bases, the scape bases AND
   the mound peak (MH), so the plant grows out of the crest surface
   itself; LIFT is the extra rise carried by the inflorescence tops so
   the flowers keep the lift from the previous pass. The crown disc
   stays half-buried in the crest (MH-0.1) and the scape bases keep
   their clearance above it, so the stems still read as growing out of
   the rosette */
const LIFT=1.5,PLANT_BASE=2.8;
/* Rick 2026-10-16: "2个大叶子，侧裂片要像倒齿一样，有些向前的曲线，线条
   要平缓些" - hookA 1.25/back 0.08 push each lobe into a proper reversed
   tooth (tip tall, leaning back toward the leaf base), bulge 0.9 bows the
   tooth back FORWARD (toward the tip) so the lobes curve instead of
   folding, soft 1.35 stretches the climb and eases every corner.
   Follow-up "侧裂片的走势应该像这个截图里的红色线标注的一样，鱼骨一样
   有个向前的趋势。突出的小刺太多了少一点": fish 0.45 leans each SIDE
   lobe into a slanted fish-bone barb (back ridge ~48 degrees off the
   spine, tip overhanging the next sinus; the terminal lobe stays put),
   and serr drops 1 -> 0.45 to thin out the micro-spines */
/* Rick 2026-10-16: "两个大叶边缘线改圆润些，先不考虑刺了" - serr drops
   to 0 FOR NOW (the micro-spines leave the picture so the rounded margin
   can be judged clean; restore by raising serr again), round=1 runs two
   Chaikin passes so the outline reads as curves instead of rulers.
   fish 0.62 / bulge 0.9 / soft 1.35 keep the fish-bone lean and the
   bowed tooth backs from the previous rounds */
/* 参考图（植物志蒲公英版）实测外轮廓，scripts/trace-ref-leaf.py 生成
   每叶两条链 A/B：[s,e]×140，s∈[0,1]（0=叶柄基端），e=半宽/叶长 */
/* 参考图（植物志蒲公英版）实测外轮廓，scripts/trace-ref-leaf.py 生成
   每叶两条链 A/B：[s,e]×140，s∈[0,1]（0=叶柄基端），e=半宽/叶长 */
const REF_TRACE=[null,{"A":[[0.001,0.0022],[0.0082,0.0022],[0.0154,0.0022],[0.0225,0.0022],[0.0297,0.0022],[0.0369,0.0022],[0.0441,0.0023],[0.0513,0.0024],[0.0584,0.0025],[0.0656,0.0039],[0.0728,0.0054],[0.08,0.0057],[0.0872,0.006],[0.0943,0.0077],[0.1015,0.0081],[0.1087,0.0085],[0.1159,0.011],[0.1231,0.0135],[0.1302,0.0136],[0.1374,0.0136],[0.1446,0.0142],[0.1518,0.0141],[0.159,0.0139],[0.1661,0.0147],[0.1733,0.0151],[0.1805,0.0153],[0.1877,0.0153],[0.1949,0.0166],[0.202,0.0214],[0.2092,0.0283],[0.2164,0.033],[0.2236,0.0318],[0.2308,0.0263],[0.2379,0.0262],[0.2451,0.0259],[0.2523,0.0273],[0.2595,0.0274],[0.2667,0.0276],[0.2738,0.0278],[0.281,0.0279],[0.2882,0.0293],[0.2954,0.0338],[0.3026,0.0375],[0.3097,0.0426],[0.3169,0.0481],[0.3241,0.0516],[0.3313,0.0517],[0.3385,0.0505],[0.3456,0.0508],[0.3528,0.0509],[0.36,0.0484],[0.3672,0.0467],[0.3744,0.0453],[0.3815,0.0419],[0.3887,0.0417],[0.3959,0.0414],[0.4031,0.0412],[0.4103,0.0413],[0.4174,0.0426],[0.4246,0.0419],[0.4318,0.0411],[0.439,0.0473],[0.4462,0.0496],[0.4533,0.0519],[0.4605,0.0607],[0.4677,0.0678],[0.4749,0.0674],[0.4821,0.0669],[0.4892,0.0687],[0.4964,0.0723],[0.5036,0.0825],[0.5108,0.0794],[0.5179,0.0792],[0.5251,0.0789],[0.5323,0.079],[0.5395,0.082],[0.5467,0.081],[0.5538,0.0758],[0.561,0.0739],[0.5682,0.0709],[0.5754,0.0705],[0.5826,0.0663],[0.5897,0.0658],[0.5969,0.0663],[0.6041,0.0667],[0.6113,0.068],[0.6185,0.0786],[0.6256,0.0962],[0.6328,0.1016],[0.64,0.1107],[0.6472,0.1102],[0.6544,0.1102],[0.6615,0.1102],[0.6687,0.1097],[0.6759,0.1092],[0.6831,0.1087],[0.6903,0.1082],[0.6974,0.1077],[0.7046,0.1077],[0.7118,0.1123],[0.719,0.111],[0.7262,0.1102],[0.7333,0.1088],[0.7405,0.1085],[0.7477,0.1083],[0.7549,0.1074],[0.7621,0.1055],[0.7692,0.1052],[0.7764,0.1049],[0.7836,0.1046],[0.7908,0.1043],[0.798,0.1029],[0.8051,0.1007],[0.8123,0.0994],[0.8195,0.0975],[0.8267,0.0958],[0.8339,0.0948],[0.841,0.0932],[0.8482,0.0918],[0.8554,0.0903],[0.8626,0.0894],[0.8698,0.0872],[0.8769,0.0842],[0.8841,0.0823],[0.8913,0.0797],[0.8985,0.0765],[0.9057,0.0716],[0.9128,0.0694],[0.92,0.0642],[0.9272,0.0617],[0.9344,0.0573],[0.9416,0.055],[0.9487,0.0468],[0.9559,0.0418],[0.9631,0.0363],[0.9703,0.0315],[0.9775,0.0229],[0.9846,0.0123],[0.9918,0.0064],[0.999,0.0048]],"B":[[0.001,0.0105],[0.0082,0.0124],[0.0154,0.0094],[0.0225,0.0096],[0.0297,0.0098],[0.0369,0.0101],[0.0441,0.0109],[0.0513,0.0117],[0.0584,0.0126],[0.0656,0.0134],[0.0728,0.0154],[0.08,0.0232],[0.0872,0.0276],[0.0943,0.0318],[0.1015,0.035],[0.1087,0.0354],[0.1159,0.0348],[0.1231,0.0347],[0.1302,0.0331],[0.1374,0.0331],[0.1446,0.0334],[0.1518,0.0337],[0.159,0.0348],[0.1661,0.037],[0.1733,0.0368],[0.1805,0.0363],[0.1877,0.0352],[0.1949,0.0347],[0.202,0.0342],[0.2092,0.0322],[0.2164,0.0325],[0.2236,0.0309],[0.2308,0.0307],[0.2379,0.0307],[0.2451,0.0303],[0.2523,0.0316],[0.2595,0.0322],[0.2667,0.033],[0.2738,0.034],[0.281,0.0353],[0.2882,0.0391],[0.2954,0.0402],[0.3026,0.0474],[0.3097,0.0526],[0.3169,0.054],[0.3241,0.0481],[0.3313,0.0477],[0.3385,0.048],[0.3456,0.0484],[0.3528,0.0466],[0.36,0.0427],[0.3672,0.0383],[0.3744,0.0306],[0.3815,0.0303],[0.3887,0.03],[0.3959,0.0297],[0.4031,0.0294],[0.4103,0.0277],[0.4174,0.027],[0.4246,0.0271],[0.4318,0.0288],[0.439,0.0312],[0.4462,0.0352],[0.4533,0.0438],[0.4605,0.0557],[0.4677,0.0689],[0.4749,0.0698],[0.4821,0.0704],[0.4892,0.0699],[0.4964,0.0693],[0.5036,0.0656],[0.5108,0.0648],[0.5179,0.0631],[0.5251,0.0593],[0.5323,0.057],[0.5395,0.0506],[0.5467,0.0458],[0.5538,0.0427],[0.561,0.041],[0.5682,0.0412],[0.5754,0.0427],[0.5826,0.0433],[0.5897,0.0472],[0.5969,0.0512],[0.6041,0.0638],[0.6113,0.0688],[0.6185,0.0875],[0.6256,0.108],[0.6328,0.1104],[0.64,0.1098],[0.6472,0.1089],[0.6544,0.1071],[0.6615,0.1068],[0.6687,0.1076],[0.6759,0.108],[0.6831,0.1083],[0.6903,0.1087],[0.6974,0.1092],[0.7046,0.1118],[0.7118,0.1118],[0.719,0.1117],[0.7262,0.112],[0.7333,0.1128],[0.7405,0.1127],[0.7477,0.1135],[0.7549,0.1144],[0.7621,0.1152],[0.7692,0.1162],[0.7764,0.1166],[0.7836,0.1169],[0.7908,0.1172],[0.798,0.1172],[0.8051,0.1173],[0.8123,0.1173],[0.8195,0.1173],[0.8267,0.1159],[0.8339,0.1156],[0.841,0.1153],[0.8482,0.1132],[0.8554,0.1126],[0.8626,0.1104],[0.8698,0.1081],[0.8769,0.1061],[0.8841,0.1041],[0.8913,0.1022],[0.8985,0.0988],[0.9057,0.0971],[0.9128,0.0931],[0.92,0.0901],[0.9272,0.0853],[0.9344,0.0824],[0.9416,0.0761],[0.9487,0.0673],[0.9559,0.0619],[0.9631,0.0598],[0.9703,0.0578],[0.9775,0.0557],[0.9846,0.0537],[0.9918,0.0269],[0.999,0.016]]},{"A":[[0.001,0.0073],[0.0082,0.0073],[0.0154,0.0073],[0.0225,0.0073],[0.0297,0.0073],[0.0369,0.0073],[0.0441,0.0073],[0.0513,0.0073],[0.0584,0.0073],[0.0656,0.008],[0.0728,0.0095],[0.08,0.0126],[0.0872,0.0138],[0.0943,0.015],[0.1015,0.0159],[0.1087,0.0165],[0.1159,0.0176],[0.1231,0.0185],[0.1302,0.0217],[0.1374,0.022],[0.1446,0.0224],[0.1518,0.0227],[0.159,0.023],[0.1661,0.0234],[0.1733,0.0237],[0.1805,0.024],[0.1877,0.0243],[0.1949,0.0247],[0.202,0.0256],[0.2092,0.0275],[0.2164,0.0289],[0.2236,0.0281],[0.2308,0.0251],[0.2379,0.0246],[0.2451,0.0254],[0.2523,0.0261],[0.2595,0.0269],[0.2667,0.0281],[0.2738,0.0299],[0.281,0.0305],[0.2882,0.0311],[0.2954,0.0316],[0.3026,0.0322],[0.3097,0.0328],[0.3169,0.0393],[0.3241,0.0424],[0.3313,0.0506],[0.3385,0.0554],[0.3456,0.0563],[0.3528,0.0554],[0.36,0.0546],[0.3672,0.054],[0.3744,0.0563],[0.3815,0.0585],[0.3887,0.0605],[0.3959,0.0629],[0.4031,0.0654],[0.4103,0.0658],[0.4174,0.0653],[0.4246,0.0647],[0.4318,0.0646],[0.439,0.0647],[0.4462,0.064],[0.4533,0.0672],[0.4605,0.0719],[0.4677,0.0764],[0.4749,0.079],[0.4821,0.0816],[0.4892,0.0936],[0.4964,0.1031],[0.5036,0.1099],[0.5108,0.11],[0.5179,0.108],[0.5251,0.1118],[0.5323,0.1122],[0.5395,0.1182],[0.5467,0.1233],[0.5538,0.1214],[0.561,0.1215],[0.5682,0.1219],[0.5754,0.1241],[0.5826,0.1288],[0.5897,0.1293],[0.5969,0.1298],[0.6041,0.1303],[0.6113,0.1459],[0.6185,0.1473],[0.6256,0.1487],[0.6328,0.1501],[0.64,0.1514],[0.6472,0.1525],[0.6544,0.1534],[0.6615,0.1544],[0.6687,0.1553],[0.6759,0.1562],[0.6831,0.1557],[0.6903,0.16],[0.6974,0.1587],[0.7046,0.1537],[0.7118,0.145],[0.719,0.1416],[0.7262,0.1385],[0.7333,0.1399],[0.7405,0.1412],[0.7477,0.1415],[0.7549,0.1421],[0.7621,0.1426],[0.7692,0.142],[0.7764,0.1409],[0.7836,0.1368],[0.7908,0.1373],[0.798,0.1391],[0.8051,0.1399],[0.8123,0.1387],[0.8195,0.136],[0.8267,0.1299],[0.8339,0.1267],[0.841,0.1234],[0.8482,0.12],[0.8554,0.1124],[0.8626,0.1075],[0.8698,0.1069],[0.8769,0.1062],[0.8841,0.1056],[0.8913,0.1004],[0.8985,0.0984],[0.9057,0.0929],[0.9128,0.0874],[0.92,0.0858],[0.9272,0.0846],[0.9344,0.0834],[0.9416,0.0701],[0.9487,0.0656],[0.9559,0.062],[0.9631,0.0564],[0.9703,0.0495],[0.9775,0.0451],[0.9846,0.034],[0.9918,0.0211],[0.999,0.0095]],"B":[[0.001,0.0192],[0.0082,0.0224],[0.0154,0.023],[0.0225,0.0232],[0.0297,0.0235],[0.0369,0.0238],[0.0441,0.0241],[0.0513,0.0244],[0.0584,0.0247],[0.0656,0.025],[0.0728,0.0252],[0.08,0.0255],[0.0872,0.0258],[0.0943,0.0261],[0.1015,0.0264],[0.1087,0.0303],[0.1159,0.0352],[0.1231,0.0391],[0.1302,0.0397],[0.1374,0.0393],[0.1446,0.0387],[0.1518,0.0372],[0.159,0.0373],[0.1661,0.0374],[0.1733,0.0375],[0.1805,0.0376],[0.1877,0.0376],[0.1949,0.0377],[0.202,0.0409],[0.2092,0.0413],[0.2164,0.0417],[0.2236,0.0421],[0.2308,0.0425],[0.2379,0.0434],[0.2451,0.0431],[0.2523,0.0382],[0.2595,0.0367],[0.2667,0.0375],[0.2738,0.0401],[0.281,0.0411],[0.2882,0.0449],[0.2954,0.0459],[0.3026,0.0468],[0.3097,0.0476],[0.3169,0.0478],[0.3241,0.0492],[0.3313,0.0499],[0.3385,0.0504],[0.3456,0.0553],[0.3528,0.0564],[0.36,0.0536],[0.3672,0.0523],[0.3744,0.0521],[0.3815,0.0517],[0.3887,0.0552],[0.3959,0.0587],[0.4031,0.0616],[0.4103,0.0672],[0.4174,0.0681],[0.4246,0.0691],[0.4318,0.07],[0.439,0.0709],[0.4462,0.0719],[0.4533,0.0753],[0.4605,0.0763],[0.4677,0.0764],[0.4749,0.0765],[0.4821,0.0782],[0.4892,0.0808],[0.4964,0.0903],[0.5036,0.1008],[0.5108,0.1167],[0.5179,0.1176],[0.5251,0.1185],[0.5323,0.1195],[0.5395,0.1212],[0.5467,0.1233],[0.5538,0.1263],[0.561,0.1313],[0.5682,0.13],[0.5754,0.1314],[0.5826,0.1327],[0.5897,0.134],[0.5969,0.1351],[0.6041,0.1363],[0.6113,0.1513],[0.6185,0.1509],[0.6256,0.1497],[0.6328,0.1476],[0.64,0.1429],[0.6472,0.1421],[0.6544,0.1413],[0.6615,0.1395],[0.6687,0.1387],[0.6759,0.1382],[0.6831,0.1394],[0.6903,0.1408],[0.6974,0.1421],[0.7046,0.1438],[0.7118,0.1458],[0.719,0.1491],[0.7262,0.1499],[0.7333,0.1515],[0.7405,0.1529],[0.7477,0.1528],[0.7549,0.1527],[0.7621,0.1517],[0.7692,0.1515],[0.7764,0.146],[0.7836,0.143],[0.7908,0.1414],[0.798,0.1401],[0.8051,0.1391],[0.8123,0.1382],[0.8195,0.1333],[0.8267,0.1326],[0.8339,0.1323],[0.841,0.1312],[0.8482,0.1322],[0.8554,0.128],[0.8626,0.1248],[0.8698,0.1218],[0.8769,0.1193],[0.8841,0.1167],[0.8913,0.1123],[0.8985,0.1081],[0.9057,0.1044],[0.9128,0.1013],[0.92,0.0965],[0.9272,0.0957],[0.9344,0.088],[0.9416,0.0772],[0.9487,0.0726],[0.9559,0.0604],[0.9631,0.0563],[0.9703,0.0469],[0.9775,0.0386],[0.9846,0.0261],[0.9918,0.0208],[0.999,0.0101]]},{"A":[[0.001,0.003],[0.0082,0.003],[0.0154,0.003],[0.0225,0.003],[0.0297,0.003],[0.0369,0.003],[0.0441,0.003],[0.0513,0.0031],[0.0584,0.0033],[0.0656,0.0046],[0.0728,0.0073],[0.08,0.0081],[0.0872,0.0099],[0.0943,0.0107],[0.1015,0.0114],[0.1087,0.0139],[0.1159,0.0142],[0.1231,0.0145],[0.1302,0.0147],[0.1374,0.015],[0.1446,0.0199],[0.1518,0.0205],[0.159,0.022],[0.1661,0.0223],[0.1733,0.0226],[0.1805,0.0234],[0.1877,0.0237],[0.1949,0.024],[0.202,0.0261],[0.2092,0.0296],[0.2164,0.0321],[0.2236,0.0351],[0.2308,0.0359],[0.2379,0.0378],[0.2451,0.0381],[0.2523,0.0383],[0.2595,0.0386],[0.2667,0.0389],[0.2738,0.042],[0.281,0.0428],[0.2882,0.0426],[0.2954,0.0425],[0.3026,0.0421],[0.3097,0.0424],[0.3169,0.0459],[0.3241,0.047],[0.3313,0.0484],[0.3385,0.0568],[0.3456,0.0605],[0.3528,0.0624],[0.36,0.0635],[0.3672,0.0645],[0.3744,0.0656],[0.3815,0.0667],[0.3887,0.0703],[0.3959,0.072],[0.4031,0.0717],[0.4103,0.0699],[0.4174,0.067],[0.4246,0.0632],[0.4318,0.0629],[0.439,0.0627],[0.4462,0.0625],[0.4533,0.0624],[0.4605,0.069],[0.4677,0.071],[0.4749,0.073],[0.4821,0.104],[0.4892,0.1045],[0.4964,0.1028],[0.5036,0.1046],[0.5108,0.1077],[0.5179,0.1072],[0.5251,0.1079],[0.5323,0.1091],[0.5395,0.1095],[0.5467,0.1098],[0.5538,0.1148],[0.561,0.1167],[0.5682,0.118],[0.5754,0.1194],[0.5826,0.1208],[0.5897,0.1204],[0.5969,0.121],[0.6041,0.1228],[0.6113,0.1272],[0.6185,0.1402],[0.6256,0.1424],[0.6328,0.1502],[0.64,0.1606],[0.6472,0.1614],[0.6544,0.1514],[0.6615,0.148],[0.6687,0.1474],[0.6759,0.1468],[0.6831,0.1472],[0.6903,0.1472],[0.6974,0.145],[0.7046,0.1429],[0.7118,0.1418],[0.719,0.1435],[0.7262,0.1444],[0.7333,0.1519],[0.7405,0.153],[0.7477,0.1512],[0.7549,0.1501],[0.7621,0.1504],[0.7692,0.1503],[0.7764,0.1501],[0.7836,0.1499],[0.7908,0.1503],[0.798,0.1493],[0.8051,0.1479],[0.8123,0.1459],[0.8195,0.1429],[0.8267,0.1339],[0.8339,0.1267],[0.841,0.1255],[0.8482,0.1247],[0.8554,0.1238],[0.8626,0.123],[0.8698,0.1221],[0.8769,0.1213],[0.8841,0.1121],[0.8913,0.1093],[0.8985,0.1062],[0.9057,0.1001],[0.9128,0.0972],[0.92,0.0948],[0.9272,0.0924],[0.9344,0.09],[0.9416,0.0819],[0.9487,0.0761],[0.9559,0.07],[0.9631,0.0622],[0.9703,0.0575],[0.9775,0.0522],[0.9846,0.045],[0.9918,0.0357],[0.999,0.0198]],"B":[[0.001,0.0081],[0.0082,0.0092],[0.0154,0.0094],[0.0225,0.0096],[0.0297,0.0098],[0.0369,0.01],[0.0441,0.0101],[0.0513,0.0113],[0.0584,0.0129],[0.0656,0.0223],[0.0728,0.0245],[0.08,0.0261],[0.0872,0.0275],[0.0943,0.0279],[0.1015,0.0283],[0.1087,0.0302],[0.1159,0.0304],[0.1231,0.0306],[0.1302,0.0308],[0.1374,0.031],[0.1446,0.0312],[0.1518,0.0314],[0.159,0.0316],[0.1661,0.0318],[0.1733,0.032],[0.1805,0.032],[0.1877,0.0314],[0.1949,0.0306],[0.202,0.0292],[0.2092,0.0293],[0.2164,0.0294],[0.2236,0.0329],[0.2308,0.0331],[0.2379,0.0333],[0.2451,0.0335],[0.2523,0.0361],[0.2595,0.0405],[0.2667,0.0406],[0.2738,0.0406],[0.281,0.0391],[0.2882,0.0376],[0.2954,0.0381],[0.3026,0.0381],[0.3097,0.0389],[0.3169,0.0374],[0.3241,0.0369],[0.3313,0.0387],[0.3385,0.0407],[0.3456,0.0422],[0.3528,0.0437],[0.36,0.0452],[0.3672,0.0467],[0.3744,0.05],[0.3815,0.0536],[0.3887,0.0641],[0.3959,0.0692],[0.4031,0.0648],[0.4103,0.0643],[0.4174,0.0622],[0.4246,0.0618],[0.4318,0.0647],[0.439,0.0635],[0.4462,0.0617],[0.4533,0.057],[0.4605,0.0515],[0.4677,0.0504],[0.4749,0.0491],[0.4821,0.0455],[0.4892,0.0469],[0.4964,0.0519],[0.5036,0.0532],[0.5108,0.054],[0.5179,0.083],[0.5251,0.0878],[0.5323,0.0929],[0.5395,0.0975],[0.5467,0.1017],[0.5538,0.0976],[0.561,0.0956],[0.5682,0.095],[0.5754,0.1008],[0.5826,0.1038],[0.5897,0.1043],[0.5969,0.0968],[0.6041,0.0935],[0.6113,0.0916],[0.6185,0.0908],[0.6256,0.089],[0.6328,0.0935],[0.64,0.098],[0.6472,0.121],[0.6544,0.1194],[0.6615,0.1284],[0.6687,0.1274],[0.6759,0.1255],[0.6831,0.1215],[0.6903,0.1205],[0.6974,0.1202],[0.7046,0.1203],[0.7118,0.119],[0.719,0.1145],[0.7262,0.1081],[0.7333,0.1038],[0.7405,0.1015],[0.7477,0.0991],[0.7549,0.0992],[0.7621,0.1025],[0.7692,0.1104],[0.7764,0.1065],[0.7836,0.0983],[0.7908,0.0952],[0.798,0.0861],[0.8051,0.0817],[0.8123,0.0822],[0.8195,0.0832],[0.8267,0.0842],[0.8339,0.0855],[0.841,0.087],[0.8482,0.0885],[0.8554,0.0901],[0.8626,0.0986],[0.8698,0.0985],[0.8769,0.0953],[0.8841,0.0919],[0.8913,0.09],[0.8985,0.0854],[0.9057,0.0829],[0.9128,0.0812],[0.92,0.0807],[0.9272,0.0802],[0.9344,0.0637],[0.9416,0.0516],[0.9487,0.045],[0.9559,0.0411],[0.9631,0.0327],[0.9703,0.0295],[0.9775,0.0274],[0.9846,0.0135],[0.9918,0.0126],[0.999,0.0126]]}];

/* Rick 2026-10-19: "从顶视图看太像锯齿了且太碎了，严格按照这个参考图
   绘制" (botanical dandelion plate) - BOTH big leaves switch to the
   ref recipe: spatulate outline (narrow petiole-like base, broadest
   rounded region at ~2/3), shallow irregular rounded teeth (10-25% of
   local width, no hooked barbs, no fish-bone lean), zAmp .55 so the
   rim stops ragging in top view, and two-tier venation (midrib +
   pinnate laterals forking 2-3 ways near their ends, NO lattice).
   round=2 eases the teeth; ref=1 switches margin+venation modes */
/* Rick 2026-10-19 follow-up: "要严格按照参考图外边框绘制，还原度120%" -
   the outline is no longer generated at all: leaf 1 traces the plate's
   LEFT leaf (refSrc 1), leaf 2 traces the RIGHT leaf (refSrc 3), both
   via REF_TRACE. Only the venation is procedural (pinnate laterals +
   end forks), riding the traced margin through margW/clip */
/* Rick 2026-10-19 23:31 "除了最小叶片，其他叶片都再立起来一些": every
   blade except the two tiniest (236/348) stands taller than in the
   23:29 pass - rise/drop nudged up so the whole rosette lifts off the
   soil while the small pair stays flat as a low anchor.
     phi 30  44/26 -> 56/30 (crest 26, tip 26)
     phi 205 27/20 -> 38/24 (crest 15, tip 14 - still the low big one)
     phi 297 36/18 -> 46/20 (keeps climbing to the tip, crest 26.5) */
const leafDefs=[buildLeaf(30,54,PLANT_BASE,56,30,7.0,0.62,0,0,6,1,0,0.55,0,1,0,0,1,0,0,0,1,0,2,1,1),
                buildLeaf(205,54,PLANT_BASE,38,24,7.0,0.62,0,0,6,1,0,0.55,0,1,0,0,1,0,0,0,1,0,2,1,3)];
/* ---- BASAL LEAVES (Rick 2026-10-16: "新增...基生叶"): a true dandelion
   is a rosette - the big arching pair grow from the same centre, and a
   few SHORT blades lie almost flat on the soil between them, filling the
   gaps in the rosette (phi slots between the two big leaves at 30/205 are
   ~117 and ~302, plus one offset blade). Same builder as the big leaves,
   but with a TAMED margin (Rick 2026-10-16: "基生叶的凸起太多了" - the
   6-lobe recipe scaled down read as crowded spikes): only 3-4 side
   sinuses, cuts/bulges at ~0.6 amplitude, spines at ~1/3 density. They
   emerge from the same rosette centre (z0 .5) so the crown disc hides
   their bases like the big pair's. Appended AFTER the big pair in
   leafDefs, so the shared prng stream that shapes leaves 1-2 is untouched */
/* Rick 2026-10-16 follow-ups on the basal trio: zAmp calms ALL body
   ripples incl. the planar sway ("y 轴上的波幅太大了" - the sway is the
   biggest screen-y wobble at az -35). The STAND-UP went through four
   steps and ended as a BOW ("再立起来一些" -> "尖端再往上（z方向）立
   起来一些" -> "立起来状态还是不明显需要立起到和水平方向成15-30度
   夹角" -> "要有抛物线弧度，中间突起叶尖向下的抛物线弧度"): the tip
   ramp (tipA) was CUT to 0 - it fired the terminal lobe straight up and
   broke the arc; the shape is now a true parabola: hAt's own arc peaks
   near s=.65-.73 and falls to the tip, the mid-blade arch (archA, peak
   at s=.5) swells the middle so the composite curve rises to its high
   point around mid-blade and DROOPS to the tip (~1.6-1.7 units below
   the crest). tilt sits at 10/8/12 - a page-turn around the axis is a
   roll, not a stand, and 30 degrees split the rims by 4.2 units ("左边
   更往下右侧往上"); zSym=1 runs the edge ripples same-sign on both
   sides (the mirrored default fed the same asymmetry). The lobe lift
   stands the reversed teeth proud; swA tames the planar S-sway on its
   own dial ("x 轴上波动幅度也减弱些") */
/* Rick 2026-10-19: "用这个叶子边框替换基生叶边框" - the three basal
   blades share the RIGHT leaf's traced chain (REF_TRACE[3], the same
   outline as big leaf 2; orientation-verified after the base/tip fix).
   hwMax/amp/serr are bypassed in ref mode - the chain IS the contour.
   phi/L/rise/drop/tilt/zAmp keep the 2026-10-16 placement & stand-up */
/* the front-centre blade is the "small leaf between the two big ones"
   (Rick 2026-10-19 21:20/21:24 - "再大一些"): scaled up twice,
   now 27->31 long, width 5.7->6.6, rise/drop follow the length; pose
   (tilt/fold/arch) untouched */
/* Rick 2026-10-20 00:58 "@截图 这两个叶子位置调换下": the big wide blade
   and the short one SWAP azimuths - the wide L31 blade now sits at phi 348
   (screen upper right, beside the seed ball) and the short L22 one moves to
   phi 112 (screen lower centre). Shapes/poses are untouched, only phi */
const basalDefs=[buildLeaf(348,31,PLANT_BASE,2.4,1.7,6.6,0.55,10,0,4,0.62,0.35,0.32,1.25,1.4,0.09,0,0.5,1.6,1,0,1,0,1,1,3),
                 buildLeaf(236,19,PLANT_BASE,1.4,1.0,4.0,0.50, 8,0,3,0.58,0.30,0.30,1.15,1.45,0.10,0,0.5,1.5,1,0,1,0,1,1,3),
                 buildLeaf(112,22,PLANT_BASE,1.8,1.2,4.6,0.58,12,0,4,0.65,0.35,0.34,1.35,1.35,0.08,0,0.5,1.7,1,0,1,0,1,1,3)];
leafDefs.push(...basalDefs);
/* ---- FILL-IN LEAVES (Rick 2026-10-19 23:21 "再增加一片大叶子和两片中叶子",
   23:25 "三片中叶，分布随机点，现在紧挨着不太美观"): one more BIG leaf
   behind the scapes plus THREE medium blades scattered at IRREGULAR
   azimuths (53/149/257 - not a mirrored fan) with staggered lengths and
   poses, so no two neighbours read as a symmetric pair. Mediums use the
   basal-leaf pose recipe (gentle rise, archA bow, zSym ripples, ref
   trace). Groups are depth-sorted per frame, so the back leaves
   correctly paint behind the scapes ---- */
leafDefs.push(buildLeaf(297,48,PLANT_BASE,46,20,7.0,0.62,0,0,6,1,0,0.55,0,1,0,0,1,0,0,0,1,0,2,1,1),
              buildLeaf( 53,37,PLANT_BASE,10, 6,5.0,0.55,5,0,4,0.62,0.35,0.40,1.25,1.4,0.09,0,0.5,1.2,1,0,1,0,1,1,3),
              buildLeaf(149,30,PLANT_BASE, 6, 4,5.0,0.55,10,0,4,0.62,0.35,0.40,1.25,1.4,0.09,0,0.5,1.4,1,0,1,0,1,1,3),
              buildLeaf(257,36,PLANT_BASE, 8, 5,5.0,0.55,7,0,4,0.62,0.35,0.40,1.25,1.4,0.09,0,0.5,1.3,1,0,1,0,1,1,3));
/* petiole pass: the narrow leaf BASE must never paint over another blade -
   all bases converge at the rosette centre, and with one depth key per leaf
   the nearer-centroid leaf used to lay its base across a blade behind it,
   reading as "the leaf went transparent, its base shows through". Every base
   is drawn ONCE here, in a group that always stays behind the leaves. */
const gBase=mk("g",{},rootG);
const leaves=leafDefs.map((d,li)=>{const g=mk("g",{},rootG);
  /* sil = the blade FILL (surface cells, no stroke - a stroke on a mesh
     would draw every cell edge as a hairline grid). rim = the outline drawn
     AFTER it: it carries the light margin stroke AND its own plate fill, so
     the sliver between the cell boundary and the smooth outline is closed.
     rim's own winding holes cannot leak - the cells under them are solid.
     rim keeps its stroke colour in CSS (not inline) so .hi can light it. */
  const sil=mk("path",{class:"sil",style:"fill:var(--hl-plate);stroke:none"},g);
  /* rim is now a FILL-ONLY closed backstop (closes the sliver between fan
     cells and the smooth outline). The visible margin stroke lives in rimL:
     per frame it is rebuilt from only the self-visible outline samples, so
     a curled blade never shows its far margin through its near face. Same
     class so .hi still lights the margin on hover. */
  const rim=mk("path",{class:"sil",style:"stroke-width:.45;stroke:none"},g);
  /* The contour follows the same root-to-tip ink ramp as the hand runs.
     Its path is rebuilt to contain only the front-most projected edge. */
  const rimL=mk("path",{class:"sil",style:"fill:none;stroke:url(#hlLeafInk"+li+");stroke-width:.45"},g);
  /* When a raised lobe folds over the rest of its own blade, the hidden
     rear rim is replaced by this leaf-tip-coloured secondary outline,
     drawn directly on the visible fold crest instead of across a gap. */
  const foldL=mk("path",{class:"nf",style:"fill:none;stroke:var(--hl-mid);stroke-width:.38;opacity:.9"},g);
  /* Short inset contours make smooth raised lobes read as relief even when
     the surface does not fold far enough to yield a silhouette crest. */
  const crestL=mk("path",{class:"nf",style:"fill:none;stroke:var(--hl-mid);stroke-width:.34;opacity:.92"},g);
  /* petiole occluder (see gBase above): a mask punches the s<SB base out of
     this leaf's normal pass, and the identical base is redrawn in gBase so it
     sits BEHIND every blade instead of across one. White rect = keep, black
     base = hide; both live in user space, so they track the projection. */
  const pmask=mk("mask",{id:"dfPetiole"+li,maskUnits:"userSpaceOnUse",
    x:"-4000",y:"-4000",width:"8000",height:"8000"},defs);
  mk("rect",{x:"-4000",y:"-4000",width:"8000",height:"8000",fill:"#fff"},pmask);
  const maskB=mk("path",{fill:"#000"},pmask);
  g.setAttribute("mask","url(#dfPetiole"+li+")");
  const cap=mk("path",{class:"sil",style:"fill:var(--hl-plate);stroke-width:.45"},gBase);
  /* leaf outline ramp (Rick 2026-10-19 "叶子轮廓…从中间向叶尖渐变，越往
     叶基越深，最浅的颜色跟次脉颜色一样"): one linearGradient per leaf along
     its own axis - base half holds full --hl-hi, then eases to --hl-mid at
     the tip, i.e. exactly the secondary-vein ink, so the margin loses
     weight where the blade thins out. The reference is set ONCE here and
     the axis endpoints are refreshed per frame from the projected midrib
     ends (x1..y2), so the ramp follows the leaf as the camera turns. It
     must go into the inline style, not the stroke attribute: the kernel's
     :where(path,…) rule would otherwise paint it --hl-mid flat */
  const ink=document.createElementNS(SVGNS,"linearGradient");
  ink.setAttribute("id","hlLeafInk"+li);
  ink.setAttribute("gradientUnits","userSpaceOnUse");
  /* The contour begins at the plant centre in full ink, then lightens along
     the blade so the tip lands on the same quiet grey as a secondary vein. */
  [["0%","var(--ink)"],["42%","var(--hl-edge)"],["100%","var(--hl-mid)"]]
    .forEach(([o,c])=>{const st=document.createElementNS(SVGNS,"stop");
      st.setAttribute("offset",o);st.setAttribute("style","stop-color:"+c);
      ink.appendChild(st)});
  defs.appendChild(ink);
  /* hand-drawn outline: short overlapping runs, weight set per build().
     Rick 2026-10-19 "叶子轮廓改成深色": ink moves --hl-edge -> --hl-hi
     (the mid gray was the reason the margin read pale next to the midrib);
     the per-run opacity walk stays, that is what keeps it hand-drawn */
  const runs=[];for(let i=0;i<RUNS;i++)runs.push(mk("path",{class:"nf",style:"stroke:url(#hlLeafInk"+li+");fill:none"},g));
  /* paired midrib lines: width per segment, converging to the tip.
     Rick 2026-10-15: the midrib read as the heaviest line on the leaf -
     thinned ~20% across the board and the pair pulled closer (offset
     .35 -> .28) so the two hairlines stay coupled as one vein */
  const midSegs=[],midW=[.55,.48,.4,.33,.27,.19],midO=MID_O;
  /* NO opacity in the inline style - inline CSS would override the
     per-segment setAttribute("opacity") fade every frame (that bug
     made the midrib render at constant .95 despite midO) */
  for(let i=0;i<midW.length;i++)midSegs.push(mk("path",{class:"nf",style:"stroke:var(--hl-hi);fill:none"},g));
  /* short laterals: one path each, opacity = midrib's local value */
  const lat=d.lat.map(v=>({e:mk("path",{class:"nf",style:"stroke:var(--hl-hi);fill:none"},g),p:v.pts,o:v.o}));
  /* intercostal grid (rungs + intermediate veinlets) - with the
     secondaries gone this is the blade's only mid-level structure, so
     it carries the hierarchy on its own */
  const vfA=mk("path",{class:"nf",style:d.ref?"stroke:var(--hl-mid);stroke-width:.46;opacity:.8;fill:none":"stroke:var(--hl-mid);stroke-width:.34;opacity:.85;fill:none"},g);
  const vfB=mk("path",{class:"nf",style:"stroke:var(--hl-mid);stroke-width:.22;opacity:.75;fill:none"},g);
  /* per-run stroke weight & darkness: a random walk along the margin */
  /* Rick 2026-10-16: margin reads lighter, finer, more organic -
     lower weight band, fainter ink, livelier walk between runs */
  const runsW=[],runsO=[];let w=0.7,o=0.6;
  /* Rick 2026-10-16 "叶子边缘大的线条再柔顺点": tighter weight band
     and slower walk step, so the edge breathes instead of jumping */
  for(let i=0;i<RN;i++){w=Math.min(1.05,Math.max(.32,w+(rnd()-0.5)*.5));
    o=Math.min(0.72,Math.max(0.35,o+(rnd()-0.5)*0.22));runsW.push(w);runsO.push(o)}
  return{g,sil,rim,rimL,foldL,crestL,maskB,cap,ink,runs,midSegs,midW,midO,lat,vfA,vfB,d,runsW,runsO}});
/* ---- BASE STONES (Rick 2026-10-19 23:34 "土堆的线条改成三个石头，大
   中小，围在蒲公英根部位置"; 23:41 "再向根部靠拢一些，再增加一些随机
   的小小石头，和石头的阴影、投影，阴影可以是几条渐变的平行线"):
   the topographic soil mound is GONE. The root is now ringed by three
   boulders (large / medium / small) plus a scatter of tiny pebbles, all
   sitting on the ground plane z=0 and pulled in close to the rosette.
   Each stone is a lumpy ellipsoid: radius modulated by angular harmonics
   (a rock, not a sphere), flattened at the bottom by clamping z>=0.
   Per camera: the silhouette is the hull of the projected surface
   samples, and two latitude rings are drawn as open arcs clipped to the
   half of the surface facing the camera (n·D>0).
   CAST SHADOW = a few parallel ground lines running away from the light
   (+x/+y on the ground → screen lower-right), each painted with a
   userSpaceOnUse gradient from --ink to transparent so the shadow fades
   out along its whole length. They are created FIRST inside each stone
   group, so the stone body always covers their roots. Fill =
   --hl-plate so a stone occludes the leaf lines behind it; every stone
   (and pebble) joins the per-frame depth sort ---- */
const MH=PLANT_BASE;
/* Rick 23:55 "石头的z轴高度要和蒲公英底部高度处于一个高度上": the stones
   used to sit on the z=0 plane while the rosette sits on a mound top at
   PLANT_BASE (=2.8), so they read as sunk into a pit. Every stone body -
   and its cast shadow - is now seated on the PLANT_BASE plane */
const STONE_Z=PLANT_BASE;
/* shape knobs (Rick 2026-10-20 00:02 "靠近根部的石头形状再多样些"; 00:14
   "石头形状应该更多样些，更自然些"): three fixed harmonics and one squash
   knob still produced rotated copies of the same smooth ellipsoid. Every
   stone now draws a full SHAPE PASSPORT from its own prng (kept separate
   from the placement prng, so the scatter does not move):
     rot    footprint rotation - the squash axis is no longer axis-aligned
     taper  flanks narrow toward the summit (a sitting cobble, not an egg)
     lean   the summit is sheared sideways; stones do not stand upright
     zB/zA  vertical profile: squat disc .. tall pointed cobble
     fac    one or two concave windows on the contour = chipped facets
     a1..a4 four lump octaves with per-stone phases
     sq/hp  footprint squash & height bias */
const shapeRng=(()=>{let s=90210;return()=>{s=(s*1103515245+12345)&0x7fffffff;return s/0x7fffffff}})();
function stoneShape(){
  const f=shapeRng,fac=[],nf=f()<0.55?1:2;
  for(let i=0;i<nf;i++)fac.push({t:f()*Math.PI*2,w:0.24+f()*0.46,d:0.07+f()*0.11});
  return{rot:f()*Math.PI*2,taper:0.04+f()*0.18,
    lean:[(f()-0.5)*0.34,(f()-0.5)*0.34],
    zB:0.42+f()*0.30,zA:0.56+f()*0.36,
    a1:0.08+f()*0.15,a2:0.04+f()*0.11,a3:0.01+f()*0.07,a4:0.015+f()*0.035,
    a5:0.04+f()*0.10,ph2:f()*Math.PI*2,
    ph:f()*Math.PI*2,fac,rp:[0.04+f()*0.16,0.36+f()*0.22]}
}
function stoneGeom(cx,cy,R,H,ph,v={}){
  const a1=v.a1??0.10,a2=v.a2??0.065,a3=v.a3??0.045,a4=v.a4??0.018;
  const a5=v.a5??0.06,ph2=v.ph2??0.9;
  const sq=v.sq??0.92,hp=v.hp??1,rot=v.rot??0,taper=v.taper??0.10;
  const lean=v.lean||[0,0],zB=v.zB??0.60,zA=v.zA??0.74;
  const fac=v.fac||[],rp0=v.rp||[0.10,0.46];
  const A=(t,p)=>{
    let a=1+a1*Math.sin(3*t+ph)+a2*Math.sin(5*t+ph*1.7)
         +a3*Math.cos(2*p+t+ph*0.6)+a4*Math.sin(8*t+ph*2.3)
         +a5*Math.cos(2*t-ph2);
    for(const fc of fac){const d=Math.atan2(Math.sin(t-fc.t),Math.cos(t-fc.t));
      a-=fc.d*Math.exp(-(d*d)/(2*fc.w*fc.w))}
    return a*(1-taper*Math.max(0,Math.sin(p)))};
  const ca=Math.cos(rot),sa=Math.sin(rot);
  const pt=(t,p)=>{const a=A(t,p),rr=R*a*Math.cos(p);
    const x0=Math.cos(t)*rr,y0=Math.sin(t)*rr*sq,sh=Math.sin(p)*Math.sin(p);
    return [cx+x0*ca-y0*sa+lean[0]*R*sh, cy+x0*sa+y0*ca+lean[1]*R*sh,
            STONE_Z+Math.max(0.03,H*hp*(zB+zA*Math.sin(p)))]};
  const nrm=(t,p)=>{const cp=Math.cos(p);
    return [cp*Math.cos(t),cp*Math.sin(t),Math.sin(p)]};
  const sil=[];
  for(let i=0;i<=14;i++){const p=-1.32+i/14*(Math.PI/2+1.32);
    for(let j=0;j<26;j++)sil.push(pt(j/26*2*Math.PI,p))}
  const ridges=rp0.map(p=>{const out=[];
    for(let j=0;j<=64;j++){const t=j/64*2*Math.PI;out.push({q:pt(t,p),n:nrm(t,p)})}
    return out});
  return{cx,cy,R,H,sil,ridges};
}
/* ground shadow (Rick 2026-10-20 00:14 "石头阴影的线条要连贯的深灰到浅灰的，
   类似速写那种效果"; 00:20 "投影的笔触感线条感不够明显"): one fan of hatch
   strokes per stone, drawn so they read as PENCIL, not as a printed comb:
     - every stroke starts ON the stone's base circle, so the shading stays
       continuous with the body and the stone hides the stroke roots
     - each stroke is TWO overlapping passes: a full-weight body for its first
       70%, then a thinner tail to the tip. SVG cannot taper a stroke, and
       this two-pass overlap is what gives the line the pressure change a
       hand-made hatch has
     - every stroke carries its own length jitter, weight jitter, bow and a
       small ANGLE offset, so no two are parallel twins
     - a single shared linearGradient sweeps ink -> edge -> mid across the
       whole patch, so the fan is dark against the stone and pale grey at
       the tips - one continuous tonal ramp instead of per-line fades */
const SHG=(()=>{const v=[0.48,0.88],L=Math.hypot(v[0],v[1]);return[v[0]/L,v[1]/L]})();
const SHP=[-SHG[1],SHG[0]];
/* sub-curve of the quadratic (a,m,b) between parameters u0..u1 */
function qsub(a,m,b,u0,u1){
  const q=u=>{const s=1-u;
    return [s*s*a[0]+2*u*s*m[0]+u*u*b[0],s*s*a[1]+2*u*s*m[1]+u*u*b[1],
            s*s*a[2]+2*u*s*m[2]+u*u*b[2]]};
  const p0=q(u0),p2=q(u1),pm=q((u0+u1)/2);
  return[p0,[(pm[0]-0.25*p0[0]-0.25*p2[0])/0.5,(pm[1]-0.25*p0[1]-0.25*p2[1])/0.5,
    (pm[2]-0.25*p0[2]-0.25*p2[2])/0.5],p2];
}
function stoneShadow(s,wob,bow,jit,wgt){
  const kf=s.kind==="main"?1:s.kind==="peb"?0.76:0.60;
  const K=s.kind==="main"?9:s.kind==="peb"?6:(s.R<0.30?3:4);
  const RB=s.R*1.02,len0=(s.R*1.34+0.90)*kf,out=[];
  const sw0=s.kind==="main"?0.95:s.kind==="peb"?0.72:0.52;
  for(let i=0;i<K;i++){
    const f=K===1?0:(i/(K-1)*2-1),o=f*RB*0.90;
    const ang=jit?jit[i%jit.length]:0,ca=Math.cos(ang),sa=Math.sin(ang);
    const gx=SHG[0]*ca-SHG[1]*sa,gy=SHG[0]*sa+SHG[1]*ca;   // stroke direction
    const px=-gy,py=gx;                                     // its own normal
    const back=Math.sqrt(Math.max(0.02,RB*RB-o*o))*0.55;
    const a=[s.cx+SHP[0]*o-gx*back,s.cy+SHP[1]*o-gy*back,STONE_Z+0.02];
    const L=len0*(1-0.30*Math.pow(Math.abs(f),1.4))*(wob?wob[i%wob.length]:1);
    const b=[a[0]+gx*L,a[1]+gy*L,STONE_Z+0.02];
    const bw=bow?bow[i%bow.length]:0;
    const m=[(a[0]+b[0])/2+px*bw,(a[1]+b[1])/2+py*bw,STONE_Z+0.02];
    const wf=sw0*(wgt?wgt[i%wgt.length]:1)*(1-0.20*Math.abs(f));
    const op=(1.0-0.22*Math.abs(f));
    const [q0,q1,q2]=qsub(a,m,b,0,0.72),[t0,t1,t2]=qsub(a,m,b,0.60,1.0);
    out.push({a:q0,m:q1,b:q2,o:op.toFixed(2),w:wf.toFixed(2),k:i});
    out.push({a:t0,m:t1,b:t2,o:(op*0.85).toFixed(2),w:(wf*0.55).toFixed(2),k:i});
  }
  return out;
}
/* placement (world azimuth → screen: 30=right, 112=front, 205=left,
   297=back). Rick 23:46 "根部四周再多些小石头，颜色深一些，最好能将
   根部位置遮挡住，其他石头随机散落到四周更大一点的范围" splits the
   scatter in two rings:
   - ROOT RING: ~16 small DARK stones tight around the base (r 1.7-3.3),
     nearly touching, so the bare junction where the blades meet the
     ground disappears behind them. fill --hl-edge + --hl-hi outline =
     clearly darker than the pale boulders.
   - OUTER SCATTER: the three boulders plus ten pebbles flung out to
     r 8.5-15, angles jittered by a LOCAL prng (own seed, so the layout
     is random-looking but identical on every frame and every load) */
const stoneRng=(()=>{let s=424242;return()=>{s=(s*1103515245+12345)&0x7fffffff;return s/0x7fffffff}})();
/* Rick 00:20 "分布范围小一些"；00:24 "第2大石头放到最大石头对面"；
   00:36 "最大的石头删除"; 00:47 "剩下的两个大石头避开叶子": the 4.6
   boulder is GONE. Blades stand at phi 30/53/112/149/205/236/257/297/348,
   and AZ 152 / 262 sat only 3-5 deg off phi 149 / 257 - r 13-16 is right
   inside those blades, so both boulders were hidden under leaf fill. The
   two widest gaps in the rosette are 82 (between phi 53 and 112) and
   177 (between phi 149 and 205); the boulders now sit THERE, pushed out
   to r 15/16.5 so a blade's half-width (about 5 units = 19 deg at r 15)
   plus the stone's own ~12 deg still clears both neighbours */
const STONE_TABLE=[[82,15.0,3.0,2.5,2.3],[177,16.5,2.3,1.9,4.1]];
const PEBBLE_TABLE=[],ROOT_TABLE=[];
for(let i=0;i<7;i++)PEBBLE_TABLE.push([(i/7*360+stoneRng()*40)%360,9.5+stoneRng()*9.5,0.55+stoneRng()*0.6]);
/* Rick 00:02 "靠近根部的石头形状再多样些，再减少几个，偏小的石头再小一些";
   00:03 "根部石头再少些"; 00:08 "小石头再少一些"; 00:09 "小石头改成 5 颗";
   00:20 "再少3个小石头": 30 -> 21 -> 14 -> 9 -> 5 -> 2. The chip class sits
   at R .09-.20, and every stone draws its own shape passport - lump
   octaves, footprint squash sq (.68-1.0 = round .. flattened), height
   bias hp (.75-1.7 = flat chip .. upright cobble) */
for(let i=0;i<2;i++){
  const t=stoneRng();
  const sz=t<0.38?0.09+stoneRng()*0.11
          :t<0.72?0.26+stoneRng()*0.20
                 :0.50+stoneRng()*0.38;
  ROOT_TABLE.push([(i/2*360+30+stoneRng()*40)%360,1.55+stoneRng()*1.6,sz,
                   i%2===0?0.10:0.85,
                   {sq:0.68+stoneRng()*0.32,hp:0.75+stoneRng()*0.95}])}
/* Rick 2026-10-20 "靠近底部位置增加3-4个特别小的小石头": a foreground
   scatter in the near-bottom sector (screen-bottom = th 125 at this
   camera), pushed OUT past the front blade tips (r 18.5-21.5) so the
   chips read as ground furniture below the rosette, not root ring.
   R .26-.44 = smaller than every pebble. Declared AFTER the pebble/root
   loops so the shared stoneRng/shapeRng sequences - and therefore the
   existing scatter - stay bit-identical */
const FRONT_TABLE=[[106,19.5,0.34],[119,21.5,0.42],[133,20.0,0.26],[146,18.5,0.38]];
const STONES=STONE_TABLE.map(([th,r,R,H,ph])=>({kind:"main",tone:1,...stoneGeom(
                r*Math.cos(th*Math.PI/180),r*Math.sin(th*Math.PI/180),R,H,ph,
                {...stoneShape(),sq:0.84+shapeRng()*0.18})}))
  .concat(PEBBLE_TABLE.map(([th,r,R],i)=>({kind:"peb",tone:1,...stoneGeom(
                r*Math.cos(th*Math.PI/180),r*Math.sin(th*Math.PI/180),R,R*1.15,th*0.037+i,
                {...stoneShape(),sq:0.80+shapeRng()*0.22})})))
  .concat(ROOT_TABLE.map(([th,r,R,tone,v],i)=>({kind:"root",tone,...stoneGeom(
                r*Math.cos(th*Math.PI/180),r*Math.sin(th*Math.PI/180),R,R*1.40,th*0.052+i,
                {...stoneShape(),...v})})))
  .concat(FRONT_TABLE.map(([th,r,R],i)=>({kind:"peb",tone:1,...stoneGeom(
                r*Math.cos(th*Math.PI/180),r*Math.sin(th*Math.PI/180),R,R*1.15,th*0.037+i,
                {...stoneShape(),sq:0.80+shapeRng()*0.22})})));
const stones=STONES.map((s,si)=>{
  const g=mk("g",{},rootG);
  /* Rick 00:55 "花茎和石头关系也需要处理，石头是最底层的": the per-stone
     occlusion mask is GONE. The props layer used to paint above every blade
     and cut the blades back out through a mask, which also meant a stone sat
     on top of the scapes and cut the stem where it crossed them. A stone is
     ground furniture: it now paints FIRST (deepest layer, see the sort
     below) and every plant part - blade, stem, flower head - covers it
     naturally. No mask, no per-frame per-pair depth test. The hatches keep
     their own group simply so the fan draws under the body */
  const gS=mk("g",{},g),gB=mk("g",{},g);
  /* hatch fan (9 doubled strokes on a boulder, 6 on a pebble, 3-4 on a
     root chip). Each stroke gets its own length, weight, bow and ANGLE
     offset - that scatter is the "pen" in the effect */
  const wob=Array.from({length:10},()=>0.80+shapeRng()*0.42);
  const bow=Array.from({length:10},()=>(shapeRng()-0.5)*s.R*0.9);
  const jit=Array.from({length:10},()=>(shapeRng()-0.5)*0.16);
  const wgt=Array.from({length:10},()=>0.78+shapeRng()*0.55);
  const lns=stoneShadow(s,wob,bow,jit,wgt);
  /* one gradient per stone, spanning stone centre -> farthest tip. Stops run
     INK -> EDGE -> MID: a real dark-to-light grey ramp, not a fade to
     nothing, so every stroke stays readable along its whole length */
  const grad=document.createElementNS(SVGNS,"linearGradient");
  grad.setAttribute("id","stoneSh"+si);
  grad.setAttribute("gradientUnits","userSpaceOnUse");
  [["0","var(--ink)","0.95"],["42%","var(--hl-edge)","0.80"],["100%","var(--hl-mid)","0.58"]]
    .forEach(([o,c,op])=>{
    const st=document.createElementNS(SVGNS,"stop");
    st.setAttribute("offset",o);
    st.setAttribute("style","stop-color:"+c+";stop-opacity:"+op);
    grad.appendChild(st)});
  defs.appendChild(grad);
  const sh=lns.map(l=>mk("path",{class:"nf",
    style:"stroke:url(#stoneSh"+si+");stroke-width:"+l.w+
          ";stroke-linecap:round;stroke-linejoin:round;fill:none"},gS));
  /* farthest tip drives the gradient's light end */
  const tip=lns.reduce((a,b)=>{
    const da=(a.b[0]-s.cx)**2+(a.b[1]-s.cy)**2,db=(b.b[0]-s.cx)**2+(b.b[1]-s.cy)**2;
    return db>da?b:a},lns[0]).b;
  /* fill tone (Rick 23:59 "靠近根部的小石头还是太深了，用浅灰和无色"):
     root stones are now only LIGHT GREY (--hl-lo) or COLOURLESS
     (--hl-plate) - no ink / mid-grey bodies left in the ring. Their
     outline stays --hl-edge so a colourless chip still reads as an edge
     on paper. Boulders and pebbles stay pale plate */
  const grey=s.kind==="root"&&s.tone<0.5;
  const fill=grey?"var(--hl-lo)":"var(--hl-plate)";
  const fop=grey?0.95:0.96;
  const sw=s.kind==="root"?(s.R<0.3?0.32:0.44):0.64;
  const sil=mk("path",{style:"fill:"+fill+";fill-opacity:"+fop+
    ";stroke:var(--hl-edge);stroke-width:"+sw+";stroke-linejoin:round;stroke-linecap:round"},gB);
  /* tiny chips carry one ring only - two rings on a 0.15-radius pebble
     turn into noise */
  const ridges=(s.R<0.30?s.ridges.slice(0,1):s.ridges).map(()=>mk("path",{class:"nf",
    style:"stroke:var(--hl-mid);stroke-width:.30;fill:none"},gB));
  return{g,gB,gS,sil,ridges,sh,lns,grad,tip,s}});
/* ---- SCAPES (hollow flower stalks, true cylinders: silhouette is
   recomputed per camera in build() so the width direction turns with view) ---- */
function buildScape(fAz,H,lean,topBulb){
  const dx=Math.cos(fAz*Math.PI/180),dy=Math.sin(fAz*Math.PI/180),M=60,cen=[],rads=[];
  /* calyx cup: flares only over the top 5% of the stem (Rick 2026-10-15:
     "花萼也缩短，只留上面一点点") - M is dense enough that the short
     flare still reads as a smooth bell, not a faceted corner */
  const radAt=s=>0.34+0.05*s+(s>0.95?topBulb*Math.pow((s-0.95)/0.05,2):0);
  for(let i=0;i<=M;i++){const s=i/M,r=lean*Math.sin(Math.PI*0.6*s),h=PLANT_BASE+(H+LIFT-PLANT_BASE)*s;
    cen.push([r*dx,r*dy,h]);rads.push(radAt(s))}
  const ts=cen.map((p,i)=>{const a=cen[Math.max(0,i-1)],b=cen[Math.min(M,i+1)];
    return norm([b[0]-a[0],b[1]-a[1],b[2]-a[2]])});
  let c=cen[0];for(const p of cen)c=add(c,p);c=scl(c,1/cen.length);
  return{cen,ts,rads,top:cen[M],A:ts[M],mid:c,topRad:radAt(1)}}
/* the two scapes must NOT stack their heads in projection (Rick 2026-10-20
   "两个花茎和花朵、果实，之间的空间关系处理下"): the flower head reaches
   ~7.8 world units out of its axis and the clock's pappus ~9, so the axes
   need ~10+ of projected separation or the crowns collide. Leaning the
   flower to the front-left and the clock to the back-right spreads them
   across the frame at every camera angle, and the extra clock height keeps
   the two crowns clear even when the camera is side-on */
/* One short cell per stem station: a leaf can pass in front of one section of
   a scape and behind the next, especially in the head-on arched-leaf pose. */
const SEG_K=60;
const scapeFlowerDef=buildScape(-115,34,4.6,1.5);
const scapeBallDef=buildScape(35,56,5.4,1.9);
const mkScape=(d,recR,flower,seed)=>{const g=mk("g",{},rootG);
  /* the head lives in its OWN root-level group, depth-sorted separately
     from the stem (Rick 2026-10-20 "俯视图上…穿模，遮挡关系有问题"): a
     scape is a long object, and sorting the whole group by the stem
     midpoint is only correct for side views. From above the OTHER scape's
     stem crosses this head's projected area well below it, and the
     group-level sort let that far stem paint over the near head. Splitting
     stem/head gives each its own true depth; the head is always the nearer
     of the pair (higher z, camera elevation k>=0.25), so it still covers
     its own stem exactly as before */
  const hg=mk("g",{},rootG);
  /* THE STEM IS A LONG OBJECT AND ONE SORT KEY CANNOT BE RIGHT FOR IT.
     A leaning stem is in front of one blade and behind another at the same
     time (Rick 2026-10-20: "这个叶子盖住花茎了" next to "叶面还是透明的
     漏出了花茎"), so the tube is cut into SEG_K short cells, each carrying
     its own depth. The global painter's order then resolves stem vs blade
     exactly where they cross, instead of forcing one verdict on the whole
     stem. Cells own their two edge chains: the fill alone would leave the
     cut ends as a ladder of hairlines across the tube. */
  const inkId="hlScapeInk"+(flower?"F":"B");
  const ink=document.createElementNS(SVGNS,"linearGradient");
  ink.setAttribute("id",inkId);
  ink.setAttribute("gradientUnits","userSpaceOnUse");
  [["0%","var(--ink)"],["45%","var(--hl-edge)"],["100%","var(--hl-mid)"]]
    .forEach(([o,c])=>{const st=document.createElementNS(SVGNS,"stop");
      st.setAttribute("offset",o);st.setAttribute("style","stop-color:"+c);
      ink.appendChild(st)});
  defs.appendChild(ink);
  const cells=[];
  for(let k=0;k<SEG_K;k++){
    const cg=mk("g",{},rootG);
    const cf=mk("path",{class:"sil",style:"fill:var(--hl-plate);stroke:none"},cg);
    const ce=mk("path",{class:"nf",style:"stroke:url(#"+inkId+");stroke-width:1.05;fill:none"},cg);
    const cm=mk("path",{class:"nf",style:"stroke:url(#"+inkId+");stroke-width:.4;opacity:.7;fill:none"},cg);
    cells.push({g:cg,fill:cf,edge:ce,line:cm,depth:0})}
  const mouth=mk("path",{class:"nf",style:"stroke:var(--hl-edge);stroke-width:.45;opacity:.85;fill:none"},g);
  /* ligulate head (Rick 2026-10-19 "在较低的花茎上增加舌状花朵，花托";
     later "舌状花瓣用黑色描边不然看不出来，从上面看时不要透出花托，
     不是透明的"): one path PER petal, filled with the plate colour and
     stroked in heavy ink, re-appended in camera-depth order every build
     so near petals really occlude the far ones and the receptacle. The
     midline strip is a single separate path drawn last */
  const ligG=mk("g",{},hg);
  const ligMid=mk("path",{class:"nf",style:"stroke:var(--hl-mid);stroke-width:.18;opacity:.45;fill:none"},hg);
  /* centre stigma tuft (Rick 2026-10-19: "最中间的最细，有点像花蕊"):
     created lazily, always re-appended last inside ligG so it sits on top
     of every petal whorl */
  const ligCore=mk("path",{class:"nf",style:"stroke:var(--hl-hi);stroke-width:.2;stroke-linecap:round;fill:none"},ligG);
  /* receptacle (花序托, Rick 2026-10-16: "新增花序托"): a shallow dish
     seating the inflorescence on the stem tip. The stem's top bulb is the
     dish's underside; four lines per scape - top face ellipse, an inner
     ellipse where the dish floor dips, the flared rim (drawn per camera
     in build()) and the seat circle where it meets the bulb */
  const recFace=mk("path",{class:"nf",style:"stroke:var(--hl-mid);stroke-width:.4;opacity:.85;fill:none"},hg);
  const recInner=mk("path",{class:"nf",style:"stroke:var(--hl-mid);stroke-width:.3;opacity:.6;fill:none"},hg);
  const recRim=mk("path",{class:"nf",style:"stroke:var(--hl-mid);stroke-width:.36;opacity:.8;fill:none"},hg);
  const recSeat=mk("path",{class:"nf",style:"stroke:var(--hl-mid);stroke-width:.3;opacity:.55;fill:none"},hg);
  /* seed head (Rick 2026-10-19 "把蒲公英的果实也画上"): the clock. One group
     between the receptacle and the head layers; every achene is its own
     path so the batch can be re-appended in camera-depth order and the far
     side of the ball really fades behind the near side */
  const seedG=mk("g",{},hg);
  /* ripe head (Rick 2026-10-19, reference photo): a PALE flattened dome -
     the receptacle - with a honeycomb pit grid on top; the achenes radiate
     from under its rim and the reflexed phyllaries hang as a skirt around
     the stem. Dome fill + pits live inside seedG so the depth batch can
     slot them between the far and near seeds every frame */
  const domeFill=mk("path",{style:"fill:var(--hl-plate);stroke:var(--hl-mid);stroke-width:.45;stroke-linejoin:round"},hg);
  const domePits=mk("path",{class:"nf",style:"stroke:var(--hl-mid);stroke-width:.32;opacity:.8;fill:none"},hg);
  return{g,hg,cells,ink,mouth,d,recR,recFace,recInner,recRim,recSeat,ligG,ligMid,ligCore,flower,
    seed,seedG,domeFill,domePits,seedEls:null,bractEls:null,ligElsF:null,ligElsL:null}};
const scapeFlower=mkScape(scapeFlowerDef,3.8,1);
const scapeBall=mkScape(scapeBallDef,3.4,0,1);
/* ---- crown (rosette base) ---- */
/* small dark-grey disc (Rick 2026-10-20 "莲座底盘半径改为1，用深灰色填
   充" + "不要渐变了"): radius 1, ONE flat fill - the radial shade
   (crownShade) is gone. The grey is the ink token at .8 opacity: over the
   white plate that lands on #535356 (dark grey), and in dark theme it
   stays a palette token instead of a hard-coded hex */
const crown=mk("path",{style:"fill:var(--hl-hi);fill-opacity:.8;stroke:none"},gCrown);
/* ---- BUILD (camera-dependent projection) ---- */
/* BARE (Rick 2026-10-19: "蒲公英叶子仅保留边框，里面所有的结果包括主脉、
   侧脉和晶格都删了"): every interior line of the blade is dropped —
   midrib ridge pair, short laterals, intercostal lattice (vfA) and
   fine veinlets (vfB). The path ELEMENTS still exist so flipping this
   back to false restores the previous render with zero other edits */
const BARE=true;
/* A tap sends a gust from the tapped screen position. The clock keeps every
   fourth achene (one quarter) while the other three quarters drift away. */
const wind={age:-1,x:200,y:160,dir:0};
/* ---- leaf depth field (currently UNUSED - kept as a tool) -------------
   Rick 00:24 "重新计算下叶子和石头的空间关系，尤其是侧面看的角度": a leaf
   used to be ONE depth number (its centroid), which is only true when the
   camera looks down on the rosette. Side-on, a blade spans 50 world units
   of depth, so its centroid is simply the wrong question to ask.

   Depth is linear in world x/y/z, and an orthographic camera keeps it
   linear on screen - so over one blade, depth = a*sx + b*sy + c is a very
   good local model. fitDepth least-squares that plane through the blade's
   own projected outline; evaluated at a screen point it answers "how near
   is THIS leaf here". This fed the stones' per-pair occlusion mask until
   Rick 00:55 made the stones the bottom layer ("石头是最底层的"), at which
   point plants simply paint over them and no per-pair test is needed. Kept
   because it is the right tool the moment stones ever go back on top. */
function fitDepth(pts3,pts2){
  let n=0,Sx=0,Sy=0,Sd=0,Sxx=0,Syy=0,Sxy=0,Sxd=0,Syd=0;
  for(let i=0;i<pts3.length;i++){
    const x=pts2[i][0],y=pts2[i][1],d=depthOf(pts3[i][0],pts3[i][1],pts3[i][2]);
    n++;Sx+=x;Sy+=y;Sd+=d;Sxx+=x*x;Syy+=y*y;Sxy+=x*y;Sxd+=x*d;Syd+=y*d}
  const a11=Sxx,a12=Sxy,a13=Sx,a22=Syy,a23=Sy,a33=n;
  const det=a11*(a22*a33-a23*a23)-a12*(a12*a33-a23*a13)+a13*(a12*a23-a22*a13);
  if(Math.abs(det)<1e-6)return[0,0,Sd/n];
  const r1=Sxd,r2=Syd,r3=Sd;
  const d1=r1*(a22*a33-a23*a23)-a12*(r2*a33-a23*r3)+a13*(r2*a23-a22*r3);
  const d2=a11*(r2*a33-a23*r3)-r1*(a12*a33-a23*a13)+a13*(a12*r3-r2*a13);
  const d3=a11*(a22*r3-r2*a23)-a12*(a12*r3-r2*a13)+r1*(a12*a23-a22*a13);
  return[d1/det,d2/det,d3/det]}
/* point inside the projected blade outline (ray casting) */
function inPoly(x,y,p){
  let c=false;
  for(let i=0,j=p.length-1;i<p.length;j=i++){
    const xi=p[i][0],yi=p[i][1],xj=p[j][0],yj=p[j][1];
    if(((yi>y)!==(yj>y))&&(x<(xj-xi)*(y-yi)/(yj-yi)+xi))c=!c}
  return c}
function build(){
  /* crown */
  /* crown: rosette disc seated ON the mound peak (2.2 -> 2.5 with the
     enlarged, undulating mound, Rick 2026-10-16) */
  /* crown: rosette disc seating ON the mound peak (MH-0.1, so it sits
     half-buried in the crest whatever the mound height) */
  crown.setAttribute("d",poly(hull(circ(1,16).map(q=>P(q.u,q.v,MH-0.1)))));
  /* project each blade once - the screen polygon is all the drawing pass
     needs now. The per-blade depth plane and bbox that used to feed the
     stones' occlusion mask went away with the mask (Rick 00:55
     "石头是最底层的"): stones are painted first, plants cover them */
  /* petiole split: s<SB is punched out of the normal leaf pass and redrawn in
     gBase (behind every blade). SB_CAP > SB leaves a small overlap so the cap
     tucks under the blade with no seam. */
  const SB=0.16, SB_CAP=0.20;
  const baseD=(po,ss,thr)=>{const n=po.length;
    let a=0;while(a<n&&ss[a]<=thr)a++;a=Math.max(0,a-1);
    let b=n-1;while(b>=0&&ss[b]<=thr)b--;b=Math.min(n-1,b+1);
    if(a<=0&&b>=n-1)return "";
    let d="M"+po[0][0].toFixed(1)+" "+po[0][1].toFixed(1);
    for(let i=1;i<=a;i++)d+="L"+po[i][0].toFixed(1)+" "+po[i][1].toFixed(1);
    for(let i=b;i<n;i++)d+="L"+po[i][0].toFixed(1)+" "+po[i][1].toFixed(1);
    return d+"Z"};
  for(const l of leaves){l._po=projPts(l.d.outline);l.sp=projPts(l.d.spine);
    l.maskB.setAttribute("d",baseD(l._po,l.d.outS,SB));
    l.cap.setAttribute("d",baseD(l._po,l.d.outS,SB_CAP))}
  /* leaves */
  for(const l of leaves){l.sil.setAttribute("d",leafFill(l._po,l.sp));l.rim.setAttribute("d",poly(l._po));
    /* self-occlusion grid (see GC/GEPS at the top): the blade's own surface
       samples rasterised into screen cells holding the MAX depth. Every
       stroke pass below keeps only the samples that are the local front. */
    const su2=projPts(l.d.surf),grid=new Map(),surfaceGrid=new Map();
    for(let i=0;i<su2.length;i++){
      const k=Math.floor(su2[i][0]/GC)+","+Math.floor(su2[i][1]/GC);
      const dd=depthOf(l.d.surf[i][0],l.d.surf[i][1],l.d.surf[i][2]);
      const cur=grid.get(k);
      if(cur===undefined||dd>cur){
        grid.set(k,dd);
        surfaceGrid.set(k,{depth:dd,point:l.d.surf[i]})}}
    l.depthGrid=grid;l.surfaceGrid=surfaceGrid;
    /* self-visibility of every outline sample (circular majority vote kills
       threshold flicker), shared by the smooth stroke and the hand runs */
    /* A contour sample is hidden only by a DISTINCT folded patch. A normal
       curved sheet naturally projects nearby interior samples into the same
       screen cell; treating that neighbour as an occluder was the cause of
       the long, spurious broken outlines. */
    const edgeVisible=(q,i)=>{
      const k=Math.floor(q[0]/GC)+","+Math.floor(q[1]/GC);
      const hit=surfaceGrid.get(k),edge=l.d.outline[i];
      return !hit||hit.depth<=depthOf(...edge)+GEPS||
        Math.hypot(hit.point[0]-edge[0],hit.point[1]-edge[1],hit.point[2]-edge[2])<3.5};
    const vfl=bridgeGaps(visSmooth(l._po.map(edgeVisible),3,true),12,true);
    {let dL="",run=false;
     for(let i=0;i<l._po.length;i++){
       if(vfl[i]){
         dL+=(run?"L":"M")+l._po[i][0].toFixed(2)+" "+l._po[i][1].toFixed(2);run=true}
       else run=false}
     /* A folded sheet can project one margin over its own body. The visible
        upper/near rim remains a crisp boundary, while the far rim is
        deliberately absent instead of leaking through the plate. */
     l.rimL.setAttribute("d",dL)}
    /* The outer rim alone cannot describe a lobe that turns toward and then
       away from the eye: its rear contour is hidden by the near sheet. Draw
       the intervening fold crest where the surface normal turns edge-on to
       the view. This is a real line on the leaf surface, not the concealed
       far outline projected through the fill. */
    {const mesh=l.d.surfRows,zf=Math.sqrt(1-C.k*C.k),
       view=[Math.sin(C.az)*zf,Math.cos(C.az)*zf,C.k],
       front=(i,j)=>{
         const a=mesh[Math.max(0,i-1)][j],b=mesh[Math.min(mesh.length-1,i+1)][j],
               c=mesh[i][Math.max(0,j-1)],d=mesh[i][Math.min(mesh[0].length-1,j+1)];
         return dot(cross(sub(b,a),sub(d,c)),view)},
       mix=(a,b,fa,fb)=>{const t=fa/(fa-fb);return[
         a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t]},
       topmost=(a,b)=>{
         const m=[(a[0]+b[0])/2,(a[1]+b[1])/2,(a[2]+b[2])/2],p=P(...m),
               hit=surfaceGrid.get(Math.floor(p[0]/GC)+","+Math.floor(p[1]/GC));
         return !hit||hit.depth-depthOf(...m)<.8};
      let fold="";
      for(let i=0;i<mesh.length-1;i++)for(let j=0;j<mesh[0].length-1;j++){
        const a=mesh[i][j],b=mesh[i+1][j],c=mesh[i+1][j+1],d=mesh[i][j+1],
              fa=front(i,j),fb=front(i+1,j),fc=front(i+1,j+1),fd=front(i,j+1),
              edges=[[a,b,fa,fb],[b,c,fb,fc],[c,d,fc,fd],[d,a,fd,fa]],cuts=[];
        for(const [p,q,fp,fq]of edges)if((fp<0&&fq>0)||(fp>0&&fq<0))cuts.push(mix(p,q,fp,fq));
        if(cuts.length===2){
          if(topmost(cuts[0],cuts[1]))fold+=seg(P(...cuts[0]),P(...cuts[1]))}
        else if(cuts.length===4){
          if(topmost(cuts[0],cuts[1]))fold+=seg(P(...cuts[0]),P(...cuts[1]));
          if(topmost(cuts[2],cuts[3]))fold+=seg(P(...cuts[2]),P(...cuts[3]))}}
      l.foldL.setAttribute("d",fold)}
    /* Raised lobes do not necessarily cross the viewing silhouette, so
       their inset secondary contours are emitted independently. They use
       the leaf-tip ink and the same depth test as all other leaf marks. */
    {let crest="";
      for(const trace of l.d.ridgeTraces)crest+=visOpen(grid,projPts(trace),trace);
      l.crestL.setAttribute("d",crest)}
    /* outline ramp axis = projected midrib base -> tip (the midrib chain
       runs the full blade, so its ends are the two ends of the gradient) */
    {const mc=l.d.midC,ia=P(...mc[0]),ib=P(...mc[mc.length-1]);
      l.ink.setAttribute("x1",ia[0].toFixed(1));l.ink.setAttribute("y1",ia[1].toFixed(1));
      l.ink.setAttribute("x2",ib[0].toFixed(1));l.ink.setAttribute("y2",ib[1].toFixed(1))}
    if(!BARE||l.d.ref){
    /* midrib ridge: per-frame silhouette of the elliptical tube.
       Screen-x in world space is perpendicular to the horizontal view
       direction; m is that axis projected into the tube plane, and the
       edge offset is the ellipse support in direction m - exact for
       the swept silhouette, so width reads from EVERY camera */
    const dot=(p,q)=>p[0]*q[0]+p[1]*q[1]+p[2]*q[2];
    const mp=l.d.midC;
    const sx=[Math.cos(C.az),-Math.sin(C.az),0];
    const Ls=[],Rs=[];
    for(let i=0;i<mp.length;i++){
      const q=mp[Math.min(mp.length-1,i+1)],r=mp[Math.max(0,i-1)];
      const t=norm(sub(q,r)),eA=l.d.latDirs[i],eB=norm(cross(t,eA)),st=dot(sx,t);
      const m=norm([sx[0]-t[0]*st,sx[1]-t[1]*st,sx[2]-t[2]*st]);
      const ca=dot(eA,m),cb=dot(eB,m),a=l.d.midA[i],b=l.d.midB[i];
      const h=Math.max(1e-6,Math.sqrt(a*a*ca*ca+b*b*cb*cb));
      Ls.push(add(mp[i],[(a*a*ca*eA[0]+b*b*cb*eB[0])/h,
                         (a*a*ca*eA[1]+b*b*cb*eB[1])/h,
                         (a*a*ca*eA[2]+b*b*cb*eB[2])/h]));
      Rs.push(sub(mp[i],[(a*a*ca*eA[0]+b*b*cb*eB[0])/h,
                         (a*a*ca*eA[1]+b*b*cb*eB[1])/h,
                         (a*a*ca*eA[2]+b*b*cb*eB[2])/h]))}
    const ml=projPts(Ls),mr=projPts(Rs),nm=mp.length-1;
    for(let i=0;i<l.midSegs.length;i++){
      const a=Math.round(i*nm/l.midSegs.length),b=Math.round((i+1)*nm/l.midSegs.length);
      let dL="",dR="",runL=false,runR=false;
      for(let k=a;k<=b;k++){
        if(visOf(grid,ml[k][0],ml[k][1],depthOf(mp[k][0],mp[k][1],mp[k][2]))){
          dL+=(runL?"L":"M")+ml[k][0].toFixed(2)+" "+ml[k][1].toFixed(2);runL=true}else runL=false;
        if(visOf(grid,mr[k][0],mr[k][1],depthOf(mp[k][0],mp[k][1],mp[k][2]))){
          dR+=(runR?"L":"M")+mr[k][0].toFixed(2)+" "+mr[k][1].toFixed(2);runR=true}else runR=false}
      const e=l.midSegs[i];e.setAttribute("d",dL+dR);e.setAttribute("stroke-width",String(l.midW[i]));e.setAttribute("opacity",String(l.midO[i]))}
    for(const v of l.lat){v.e.setAttribute("d",visOpen(grid,projPts(v.p),v.p));v.e.setAttribute("opacity",v.o.toFixed(2))}
    let fdA="";for(const v of l.d.fineA)fdA+=visOpen(grid,projPts(v),v);l.vfA.setAttribute("d",fdA);
    let fdB="";for(const v of l.d.fineB)fdB+=visOpen(grid,projPts(v),v);l.vfB.setAttribute("d",fdB);
    }
    /* hand-drawn margin: resample by arc length, stroke in short runs of
       varying width and darkness. Each resampled point inherits the
       self-visibility of its nearest outline sample, so a run hides itself
       where the blade folds over it. */
    const rp=resamp(l._po,RN),N2=l._po.length;
    const rv=new Array(RN);
    for(let j=0;j<RN;j++){
      let oi=Math.round(j/RN*N2)%N2,bd=1e9,bi=oi;
      for(let t=-8;t<=8;t++){const k=(oi+t+N2)%N2;
        const dd=(rp[j][0]-l._po[k][0])**2+(rp[j][1]-l._po[k][1])**2;
        if(dd<bd){bd=dd;bi=k}}
      rv[j]=vfl[bi]}
    for(let r=0;r<RUNS;r++){let d="",run=false;
      for(let k=0;k<=RPB;k++){const j=(r*RPB+k)%RN;
        if(rv[j]){const q=rp[j];d+=(run?"L":"M")+q[0].toFixed(2)+" "+q[1].toFixed(2);run=true}
        else run=false}
      const e=l.runs[r];e.setAttribute("d",d);
      let ws=0;for(let k=0;k<RPB;k++)ws+=l.runsW[r*RPB+k];
      e.setAttribute("stroke-width",(ws/RPB).toFixed(2));
      e.setAttribute("opacity",l.runsO[r*RPB+3].toFixed(2))}}
  /* A stem cell needs the leaf depth at its own screen position, not the
     depth of the leaf's centroid. The small neighbourhood closes sampling
     seams along a folded leaf's surface; the positive depth margin leaves
     a genuinely front-facing stem visible. */
  const leafCovers=(q)=>{
    const p=P(...q),gx=Math.floor(p[0]/GC),gy=Math.floor(p[1]/GC);
    const d=depthOf(...q);let top=-Infinity;
    for(const l of leaves)for(let x=-1;x<=1;x++)for(let y=-1;y<=1;y++){
      const z=l.depthGrid.get((gx+x)+","+(gy+y));
      if(z!==undefined&&z>top)top=z}
    return top>d+.45};
  /* base stones: per-camera silhouette (hull of the projected surface
     samples) + the camera-facing halves of the two latitude rings. A ring
     point is visible when its surface normal still faces the camera
     (n·D>0), so the arcs end exactly where the stone turns away */
  {const zf=Math.sqrt(1-C.k*C.k);
   const D=[Math.sin(C.az)*zf,Math.cos(C.az)*zf,C.k];
   for(const st of stones){
     const sp3=projPts(st.s.sil),shl=hull(sp3);
     st.sil.setAttribute("d",closedCurve(shl));
     /* Rick 00:55 "石头是最底层的": no mask, no blade test any more. Stones
        sort FIRST (see groups below), blades / scapes / heads paint after
        them, so every plant part covers a stone by plain painter's order -
        the stem crossing a stone is now continuous instead of being cut. */
     st.sh.forEach((el,i)=>{const l=st.lns[i],q=projPts([l.a,l.m,l.b]);
       el.setAttribute("d","M"+q[0][0].toFixed(2)+" "+q[0][1].toFixed(2)+
         "Q"+q[1][0].toFixed(2)+" "+q[1][1].toFixed(2)+" "+
         q[2][0].toFixed(2)+" "+q[2][1].toFixed(2));
       el.setAttribute("opacity",l.o);
       el.removeAttribute("display")});
     {const a=P(st.s.cx,st.s.cy,STONE_Z+0.02),b=P(...st.tip);
      st.grad.setAttribute("x1",a[0].toFixed(1));st.grad.setAttribute("y1",a[1].toFixed(1));
      st.grad.setAttribute("x2",b[0].toFixed(1));st.grad.setAttribute("y2",b[1].toFixed(1))}
     for(let k=0;k<st.ridges.length;k++){
       const rp=st.s.ridges[k];let d="",run=false;
       for(const p of rp){
         const vis=(p.n[0]*D[0]+p.n[1]*D[1]+p.n[2]*D[2])>0.10;
         const q=P(p.q[0],p.q[1],p.q[2]);
         if(vis){d+=(run?"L":"M")+q[0].toFixed(2)+" "+q[1].toFixed(2);run=true}
         else run=false;
       }
       st.ridges[k].setAttribute("d",d)}}}
  /* scapes: true cylinders — silhouette normal follows the camera azimuth */
  for(const sc of[scapeFlower,scapeBall]){const d=sc.d;
    {const ia=P(...d.cen[0]),ib=P(...d.top);
     sc.ink.setAttribute("x1",ia[0].toFixed(1));sc.ink.setAttribute("y1",ia[1].toFixed(1));
     sc.ink.setAttribute("x2",ib[0].toFixed(1));sc.ink.setAttribute("y2",ib[1].toFixed(1))}
    const nh=[Math.sin(C.az),Math.cos(C.az),0]; /* screen-horizontal in world space */
    const Ls=[],Rs=[];
    for(let i=0;i<d.cen.length;i++){const dir=norm(cross(d.ts[i],nh)),rad=d.rads[i];
      Ls.push(add(d.cen[i],scl(dir,rad)));Rs.push(sub(d.cen[i],scl(dir,rad)))}
    /* per-cell geometry: fill quad + the two edge chains + the centre line */
    const n=d.cen.length,per=(n-1)/sc.cells.length;
    for(let k=0;k<sc.cells.length;k++){const c=sc.cells[k];
      const i0=Math.round(k*per),i1=Math.round((k+1)*per);
      c.fill.setAttribute("d",poly(projPts(Ls.slice(i0,i1+1).concat(Rs.slice(i0,i1+1).reverse()))));
      const chain=a=>{let s2="";for(let i=i0;i<=i1;i++){const q=P(...a[i]);
        s2+=(i===i0?"M":"L")+q[0].toFixed(2)+" "+q[1].toFixed(2)}return s2};
      c.edge.setAttribute("d",chain(Ls)+chain(Rs));
      let cd="";for(let i=i0;i<i1;i+=2)cd+=seg(P(...d.cen[i]),P(...d.cen[Math.min(n-1,i+1)]));
      c.line.setAttribute("d",cd);
      const mid=d.cen[Math.round((i0+i1)/2)];
      c.depth=depthOf(...mid);
      /* Hide only this tiny segment when a leaf surface is locally nearer.
         With 60 cells this is a local occlusion decision, not the old
         all-or-nothing ordering of a complete stem or a complete leaf. */
      c.g.style.display=leafCovers(mid)?"none":""}
    /* top mouth: the tube's ellipse, conjugate radii track the camera */
    const dir=norm(cross(d.A,nh)),w2=norm(cross(d.A,dir));
    sc.mouth.setAttribute("d",closedCurve(projPts(circ(d.topRad,14).map(q=>add(add(d.top,scl(dir,q.u)),scl(w2,q.v))))));
    /* receptacle dish (Rick 2026-10-16 "新增花序托"): a shallow dish
       seated on the stem tip. Floor ellipses ride the same conjugate
       radii dir/w2 as the mouth (they track the camera), the rim flares
       down from the crest to the bulb flanks, and a seat circle marks
       where the dish meets the bulb. Skipped on the ripe head - its dome
       replaces the dish entirely */
    const rr=sc.recR;   /* hoisted: the petal whorls below also root at rr */
    if(!sc.seed){
    const T=add(d.top,scl(d.A,0.55));                  /* dish centre */
    const dpt=q=>add(add(T,scl(dir,q.u)),scl(w2,q.v));          /* floor point */
    const rHat=q=>add(scl(dir,q.u/rr),scl(w2,q.v/rr));          /* unit lateral */
    sc.recFace.setAttribute("d",closedCurve(projPts(circ(rr,18).map(dpt))));
    sc.recInner.setAttribute("d",closedCurve(projPts(circ(rr*0.66,18).map(dpt))));
    const seatC=sub(d.top,scl(d.A,0.05));
    sc.recSeat.setAttribute("d",closedCurve(projPts(circ(d.topRad*0.72,14).map(q=>add(add(seatC,scl(dir,q.u)),scl(w2,q.v))))));
    let rim="";
    for(let i=0;i<14;i++){const th=i/14*Math.PI*2,q={u:Math.cos(th)*rr,v:Math.sin(th)*rr},rH=rHat(q);
      const A1=dpt(q);                                        /* rim crest */
      const A2=sub(sub(A1,scl(d.A,0.42)),scl(rH,0.16));      /* flare bottom */
      const A3=add(seatC,scl(rH,d.topRad*0.72));             /* onto the bulb */
      rim+=seg(P(...A1),P(...A2))+seg(P(...A2),P(...A3))}
    sc.recRim.setAttribute("d",rim)
    }
    /* ligulate petals (Rick 2026-10-19 "在较低的花茎上增加舌状花朵，
       花托"; later "舌状花瓣用黑色描边…从上面看时不要透出花托，不是
       透明的"): outer whorl long & near-flat, inner whorl short & tilted
       up, inner roots pulled toward the disc centre so the receptacle is
       hidden from above. EVERY petal is its own path - plate-filled,
       heavy-ink stroked - and the batch is re-appended in camera-depth
       order so near petals truly occlude far ones. No longer a
       see-through line drawing */
    if(sc.flower){
      const T2=add(d.top,scl(d.A,0.55)),up=d.A;
      const items=[];
      /* one petal = one ligulate floret: a strap that widens, flattens and
         ends in shallow teeth (the real floret apex is 5-toothed). z0 lifts
         the whole strap onto the domed receptacle, lift is the extra upward
         bow along the strap - outer whorls splay almost flat, inner ones
         stand up, which is what gives the head its thickness in side view */
      const petal=(th,len,lift,wMax,r0,sw,z0,roll,mid,op,ink)=>{
        const rd=add(scl(dir,Math.cos(th)),scl(w2,Math.sin(th)));
        const s0=norm(cross(up,rd)),s1=norm(cross(rd,s0));
        const side=add(scl(s0,Math.cos(roll)),scl(s1,Math.sin(roll)));
        const ctr=t=>add(add(T2,scl(rd,r0+len*t)),scl(up,z0+lift*Math.sin(t*Math.PI*0.5)));
        const wt=t=>wMax*(t<0.12?0.35+0.65*(t/0.12):t<0.85?1:1-0.25*(t-0.85)/0.15);
        const N=8,out=[];
        for(let i=0;i<=N;i++){const t=i/N;out.push(add(ctr(t),scl(side,wt(t))))}
        /* apex: TRUNCATED. The real floret is 5-toothed, but a toothed
           zigzag is ~9 points inside 2x1.5px, and the rim stacks 4-6 tips
           into the same pixels - the comb skeleton is what inked those tip
           zones into solid blocks (Rick 2026-10-19 "顶端因为有齿状，多条
           线条，显得像填充"). A flat end with a slight mid waviness is
           what the apex resolves to at this scale, and it draws as ONE
           line instead of a comb */
        const wE=wt(1);
        out.push(add(ctr(1),scl(side,0.45*wE)));
        out.push(add(ctr(0.965),scl(side,0)));
        for(let i=N;i>=0;i--){const t=i/N;out.push(add(ctr(t),scl(side,-wt(t))))}
        /* a strap whose width faces the camera edge-on collapses to a
           sliver - stroking its full toothed outline there piles every
           segment into one ink block. So measure the projected half-width
           at mid-strap: below ~0.85px the petal is rendered as its midline
           only, no fill, no teeth */
        const c5=projPts([ctr(.5)])[0],e5=projPts([add(ctr(.5),scl(side,wt(.5)))])[0];
        const line=Math.hypot(e5[0]-c5[0],e5[1]-c5[1])<0.85;
        items.push({line,op,ink,
          d:line?open(projPts([0,.2,.4,.6,.8,1].map(t=>ctr(t)))):poly(projPts(out)),
          z:depthOf(...ctr(0.55)),sw,
          m:(line||!mid)?"":open(projPts([0,.15,.3,.5,.7,.88].map(t=>ctr(t))))})};
      /* five whorls, each shorter, narrower AND seated higher than the one
         outside it (Rick 2026-10-19 "增加到五层…最中间的最细，有点像花蕊"
         then "花瓣应该像花簇似的，中间的应该更往上一点，侧面看花朵更有
         厚度"). The z0 ladder is what builds the cushion: the rim sits at
         the receptacle, the middle climbs, so the head has real height in
         side view instead of being a flat plate. Counts went up as well -
         a dandelion head is a packed cluster of florets, not a clean star.
         Each whorl is offset by half a pitch so petals interlock. */
      /* the BOTTOM whorl is 24 straps overlapping - at full ink they pile up
         into a dark ring (Rick 2026-10-19 23:19 "花朵底层的那层花瓣还是
         需要再浅一些"), so it carries the palest step of the ladder.
         INK LADDER (Rick 2026-10-20 00:42 "最底层花瓣描边最浅色，最高层…
         最深，以此类推每层"; 00:45 "最底层花瓣描边颜色用次脉颜色以此类推"):
         the ladder now STARTS at the leaf's secondary-vein ink --hl-mid -
         the same grey the intercostal grid (vfA/vfB) uses - and steps one
         tone darker per whorl up to full --ink at the crown. --hl-mid ->
         --hl-edge -> --hl-hi x2/.60/.82 -> --ink: a solid --hl-hi on whorl 4
         would jump straight from #a4a4ac to #232327, so the two crown whorls
         ride --hl-hi at partial opacity (= mid / mid-dark grey on the plate)
         and only the innermost 12 straps take undiluted --ink */
      const LAYERS=[
        {n:24,len:5.20,lift:.47,w:.60,r0:.68,sw:.46,z0:0,    ink:"var(--hl-mid)",  op:1},
        {n:21,len:4.48,lift:1.55,w:.54,r0:.52,sw:.56,z0:.35, ink:"var(--hl-edge)", op:1,mid:1},
        {n:18,len:3.47,lift:2.32,w:.47,r0:.37,sw:.57,z0:.72, ink:"var(--hl-hi)",   op:.62},
        {n:15,len:2.30,lift:2.77,w:.39,r0:.23,sw:.52,z0:1.05,ink:"var(--hl-hi)",   op:.82},
        {n:12,len:1.15,lift:2.92,w:.32,r0:.09,sw:.48,z0:1.32,ink:"var(--ink)",     op:1}];
      /* tonal hierarchy: only the outer two whorls carry full-ink outlines
         and midlines; the inner whorls lighten (op) and drop their
         midlines, so the packed centre reads as fine texture instead of
         stacking 4 strokes into one black pixel */
      LAYERS.forEach((Ly,li)=>{const ph=0.13+li*Math.PI/Ly.n;
        /* per-floret seat jitter: a packed head never has its florets all
           level, a little height scatter is what makes it read as a clump */
        const z0=(i)=>Ly.z0+0.10*Math.sin(i*2.3+Ly.n);
        for(let i=0;i<Ly.n;i++){
          const jit=1+0.062*Math.sin(i*2.7+li*1.3);
          petal(i/Ly.n*2*Math.PI+ph+(0.03*Math.sin(i*1.7+li)),Ly.len*jit,Ly.lift,
                Ly.w*jit,Ly.r0*rr,Ly.sw,z0(i),0.13*Math.sin(i*3.1+li*2.2),Ly.mid,Ly.op,Ly.ink)}});
      /* sepals (Rick 2026-10-19 23:16: "花朵花托下的小叶子和蒲公英球下的
         小叶子一样的形态"): the SAME recipe as the ripe head's phyllaries -
         droop 35..67 deg, length 3.6..5.4, width 0.34*sin(pi*t^0.8), a
         sagging spine plus its midline stroke; only the anchor moves from
         the seed dome's edge to the flower's receptacle rim. They join the
         petal depth batch, so a near sepal still paints over a far petal */
      {const M=16,h=k=>{const s=Math.sin(k*127.1)*43758.5453;return s-Math.floor(s)};
       for(let i=0;i<M;i++){
         const th=i/M*2*Math.PI+0.30*h(i*5);
         const lat=norm(add(scl(dir,Math.cos(th)),scl(w2,Math.sin(th))));
         const el=0.62+0.55*h(i+7);        /* droop 35..67 deg below horizon */
         const bd=norm(add(scl(lat,Math.cos(el)),scl(up,-Math.sin(el))));
         const L=3.6+1.8*h(i+13);
         const side=norm(cross(up,bd));
         const p0=add(add(T2,scl(up,0.02)),scl(lat,rr*0.86));
         const spine=t=>add(add(p0,scl(bd,L*t)),scl(up,-0.55*Math.sin(Math.PI*t)));
         const wt=t=>0.34*Math.sin(Math.PI*Math.pow(t,0.8));
         const out=[];
         for(let q=0;q<=7;q++){const t=q/7;out.push(add(spine(t),scl(side,wt(t))))}
         for(let q=7;q>=0;q--){const t=q/7;out.push(add(spine(t),scl(side,-wt(t))))}
         items.push({line:false,op:1,ink:"var(--hl-hi)",
           d:poly(projPts(out))+open(projPts([0,.3,.55,.8,1].map(t=>spine(t)))),
           z:depthOf(...spine(0.5)),sw:0.30})}}
      /* centre tuft: the stigmas of the innermost florets, thin forked
         threads riding the apex of the cushion, so the middle still reads
         as 花蕊 and not just a heap of petals */
      let core="";
      for(let k=0;k<7;k++){const a=k/7*2*Math.PI+.22;
        const rd=add(scl(dir,Math.cos(a)),scl(w2,Math.sin(a)));
        const st=norm(cross(up,rd));
        const b0=add(T2,scl(up,3.55));
        const b1=add(add(T2,scl(rd,0.20)),scl(up,4.08));
        const b2=add(add(T2,scl(rd,0.38)),scl(up,4.42));
        core+=open(projPts([b0,b1]))
             +open(projPts([b1,add(b2,scl(st,0.10))]))
             +open(projPts([b1,sub(b2,scl(st,0.10))]))}
      items.sort((a,b)=>a.z-b.z);   /* far first, near painted last (on top) */
      const nf=items.reduce((s,it)=>s+(it.line?0:1),0),nl=items.length-nf;
      if(!sc.ligElsF||sc.ligElsF.length!==nf){
        for(const e of(sc.ligElsF||[]))e.remove();
        sc.ligElsF=Array.from({length:nf},()=>mk("path",{style:"fill:var(--hl-plate);stroke-linejoin:miter;stroke-miterlimit:4;stroke-linecap:round"},sc.ligG))}
      if(!sc.ligElsL||sc.ligElsL.length!==nl){
        for(const e of(sc.ligElsL||[]))e.remove();
        sc.ligElsL=Array.from({length:nl},()=>mk("path",{class:"nf",style:"stroke-linecap:round;fill:none"},sc.ligG))}
      let fi=0,li=0;
      items.forEach(it=>{const e=it.line?sc.ligElsL[li++]:sc.ligElsF[fi++];
        e.setAttribute("d",it.d);
        e.style.stroke=it.ink||"var(--hl-edge)";
        e.style.strokeWidth=it.sw.toFixed(2)+"px";
        e.style.strokeOpacity=it.op.toFixed(2);
        sc.ligG.appendChild(e)});
      sc.ligCore.setAttribute("d",core);sc.ligG.appendChild(sc.ligCore);
      sc.ligMid.setAttribute("d",items.map(it=>it.m).join(""));
    }else{
      sc.ligMid.setAttribute("d","");
      sc.ligCore.setAttribute("d","");
      if(sc.ligElsF)for(const e of sc.ligElsF)e.setAttribute("d","");
      if(sc.ligElsL)for(const e of sc.ligElsL)e.setAttribute("d","")}
    /* ripe seed head (Rick 2026-10-19, reference photo): NOT a sphere with
       a dark core. The receptacle is a PALE flattened dome carrying a
       honeycomb pit grid; under its rim a skirt of reflexed phyllaries
       (花托的小叶子) hangs around the stem, and the achenes radiate
       outward-DOWNWARD from beneath that skirt, each ending in a fluffy
       pappus - the clock is a wide umbrella, not a ball. Depth drives paint
       order and weight for both seeds and bracts, and the dome is slotted
       into the same batch at its own depth */
    if(sc.seed){
      const up=d.A;
      const sa=Math.sin(C.az),ca=Math.cos(C.az),zf=Math.sqrt(1-C.k*C.k);
      const view=[sa*zf,ca*zf,C.k];          /* unit vector toward camera */
      const h=k=>{const s=Math.sin(k*127.1)*43758.5453;return s-Math.floor(s)};
      /* ---- receptacle dome: flattened ellipsoid, pale, honeycombed.
              Rick 2026-10-19 21:05 "果实要被种子布满，不要缺一半": the dome
              is only the small seat of the achenes, NOT half the clock -
              it was 3.05 wide and ate the far half of the seed ball ---- */
      const cD=add(d.top,scl(up,0.52)),aD=2.15,bD=1.05;
      const sP=(th,ph)=>add(cD,add(add(scl(dir,aD*Math.cos(ph)*Math.cos(th)),
        scl(w2,aD*Math.cos(ph)*Math.sin(th))),scl(up,bD*Math.sin(ph))));
      {const sp=[];
        for(let a=0;a<=8;a++){const ph=-Math.PI/2+a/8*Math.PI,cp=Math.cos(ph);
          for(let b=0;b<16;b++)sp.push(sP(b/16*2*Math.PI,ph))}
        sc.domeFill.setAttribute("d",poly(hull(projPts(sp))))}
      /* pit grid: three latitude rings of little dimples, front side only -
         the camera squashes z so the pits are circles IN THE SURFACE */
      {let pd="";
        for(const [sy,cnt,rp] of [[0.28,10,0.21],[0.58,8,0.19],[0.84,5,0.17]]){
          const ph=Math.asin(sy),cp=Math.cos(ph);
          for(let k=0;k<cnt;k++){
            const c=sP(k/cnt*2*Math.PI+0.35*sy,ph),nrm=norm(sub(c,cD));
            if(dot(nrm,view)<0.10)continue;
            const t1=norm(cross(nrm,up)),t2=cross(nrm,t1),ring=[];
            for(let q=0;q<7;q++){const an=q/7*2*Math.PI;
              ring.push(add(c,add(scl(t1,rp*Math.cos(an)),scl(t2,rp*Math.sin(an)))))}
            pd+=closedCurve(projPts(ring))}}
        sc.domePits.setAttribute("d",pd)}
      /* ---- phyllaries: the reflexed bracts hanging under the rim ---- */
      const items=[];
      {const M=16;
        for(let i=0;i<M;i++){
          const th=i/M*2*Math.PI+0.30*h(i*5);
          const lat=norm(add(scl(dir,Math.cos(th)),scl(w2,Math.sin(th))));
          const el=0.62+0.55*h(i+7);        /* droop 35..67 deg below horizon */
          const bd=norm(add(scl(lat,Math.cos(el)),scl(up,-Math.sin(el))));
          const L=3.6+1.8*h(i+13);
          const side=norm(cross(up,bd));
          const p0=add(add(d.top,scl(up,0.42)),scl(lat,2.02));
          const spine=t=>add(add(p0,scl(bd,L*t)),scl(up,-0.55*Math.sin(Math.PI*t)));
          const wt=t=>0.34*Math.sin(Math.PI*Math.pow(t,0.8));
          const out=[];
          for(let q=0;q<=7;q++){const t=q/7;out.push(add(spine(t),scl(side,wt(t))))}
          for(let q=7;q>=0;q--){const t=q/7;out.push(add(spine(t),scl(side,-wt(t))))}
          items.push({br:1,
            d:poly(projPts(out))+open(projPts([0,.3,.55,.8,1].map(t=>spine(t)))),
            z:depthOf(...spine(0.5))})}}
      /* ---- achenes: a COMPLETE clock (Rick 2026-10-19 21:15 "要像一个
              完整的蒲公英球"). Every pappus tip is solved onto ONE sphere
              of radius ROUND around the receptacle, so the silhouette is a
              round ball instead of a fringe. Seeds fill latitude rings
              from below the equator to the pole; each = olive achene +
              slender beak + 3-branch fork + 12 hairs ---- */
      {const ROUND=9.6;
       /* 10 latitude rings (was 8) -> 124 achenes, ring counts track
          cos(phi) so the surface density stays even all the way over
          the crown instead of thinning out at the top */
       const RINGS=[[-1.02,8],[-0.76,12],[-0.50,15],[-0.24,18],[0.02,19],
                    [0.28,17],[0.54,14],[0.80,10],[1.06,7],[1.32,4]];
        let i=0;
        for(const [ph,cnt] of RINGS)for(let k=0;k<cnt;k++,i++){
          const th=k/cnt*2*Math.PI+0.22*ph+0.34*h(i*3+1);
          const ch=Math.cos(ph),sh=Math.sin(ph);
          const latS=add(scl(dir,Math.cos(th)),scl(w2,Math.sin(th)));
          const ax=norm(add(scl(latS,ch),scl(up,sh)));   /* radial = ball */
          const rS=1/Math.sqrt((ch/aD)*(ch/aD)+(sh/bD)*(sh/bD));
          const p0=add(add(cD,scl(ax,rS)),scl(ax,0.08));
          const e1=norm(cross(ax,up)),e2=cross(ax,e1);
          /* olive achene: spindle, widest past the middle, both ends
             pointed (0.56 wide x 1.6..1.9 long) */
          const BL=1.6+0.3*h(i+17);
          const body=[];
          for(const [t,rr] of [[0.02,0.05],[0.34,0.23],[0.68,0.28],[1.00,0.05]]){
            const c=add(p0,scl(ax,BL*t));
            for(let a=0;a<8;a++){const an=a/8*2*Math.PI;
              body.push(add(c,add(scl(e1,rr*Math.cos(an)),scl(e2,rr*Math.sin(an)))))}
          }
          const bodyD=closedCurve(projPts(hull(body)));
          /* beak: slender stalk from the achene tip out to the fork ring */
          const pB=add(p0,scl(ax,BL));
          const rB=dot(sub(pB,cD),ax);
          const rF=ROUND*(0.545+0.03*h(i+23));
          const pF=add(cD,scl(ax,rF));
          let ds=open(projPts([pB,
            add(add(cD,scl(ax,(rB+rF)*0.5)),scl(e1,0.18)),pF]));
          /* fork: 3 branches, 4 hairs each; every hair is LENGTH-SOLVED so
             its tip lands on the fluff sphere (Rt jittered a few percent) */
          for(let b=0;b<3;b++){
            const az=b/3*2*Math.PI+0.6*h(i*5+b);
            const ld=add(scl(e1,Math.cos(az)),scl(e2,Math.sin(az)));
            const br=norm(add(ax,scl(ld,0.24)));
            const pT=add(pF,scl(br,rF*0.17));
            ds+=open(projPts([pF,pT]));
            for(let k2=0;k2<4;k2++){
              const ta=az+(k2-1.5)*0.46+0.12*h(i*7+k2);
              const hd=add(scl(e1,Math.cos(ta)),scl(e2,Math.sin(ta)));
              const hv=norm(add(ax,scl(hd,0.30+0.26*h(i+11*b+k2))));
              const pr=sub(pT,cD),Rt=ROUND*(0.965+0.06*h(i*3+k2+b));
              const pd=dot(pr,hv);
              const Lh=-pd+Math.sqrt(Math.max(0,pd*pd+Rt*Rt-dot(pr,pr)));
              ds+=open(projPts([pT,add(pT,scl(hv,Lh))]))}
          }
          items.push({d:ds,body:bodyD,z:depthOf(...add(p0,scl(ax,BL*0.5))),id:i,p0s:P(...p0),pFs:P(...pF)})}}
      items.sort((a,b)=>a.z-b.z);            /* far first, near painted last */
      const nSd=items.reduce((s,it)=>s+(it.br?0:1),0),nBr=items.length-nSd;
      if(!sc.seedEls||sc.seedEls.length!==nSd){
        for(const e of(sc.seedEls||[]))e.remove();
        sc.seedEls=Array.from({length:nSd},()=>mk("path",{class:"nf",style:"stroke-linecap:round;fill:none"},sc.seedG))}
      if(!sc.seedBodyEls||sc.seedBodyEls.length!==nSd){
        for(const e of(sc.seedBodyEls||[]))e.remove();
        sc.seedBodyEls=Array.from({length:nSd},()=>mk("path",{style:"fill:var(--ink);stroke-linejoin:round;stroke-linecap:round"},sc.seedG))}
      if(!sc.bractEls||sc.bractEls.length!==nBr){
        for(const e of(sc.bractEls||[]))e.remove();
        sc.bractEls=Array.from({length:nBr},()=>mk("path",{style:"fill:var(--hl-plate);stroke-linejoin:round"},sc.seedG))}
      /* the dome takes its own place in the batch: far seeds/bracts behind
         it, the near side paints over it */
      const domeZ=depthOf(...cD);
      let si=0,bi=0,placed=false;
      for(const it of items){
        if(!placed&&it.z>domeZ){
          sc.seedG.appendChild(sc.domeFill);sc.seedG.appendChild(sc.domePits);placed=true}
        if(it.br){
          const e=sc.bractEls[bi++];
          e.setAttribute("d",it.d);
          e.style.stroke="var(--hl-hi)";e.style.strokeWidth="0.30px";e.style.strokeOpacity="1";
          sc.seedG.appendChild(e);
        }else{
          const f=nSd<2?1:(si+1)/nSd;
          const be=sc.seedBodyEls[si],e=sc.seedEls[si];si++;
          /* inline style, not attributes: the kernel's :where() rule owns
             stroke/stroke-width on every path. The achene is a solid little
             object - dark grey fill plus a crisp outline - painted before
             its own stalk so the beak grows out of it */
          be.setAttribute("d",it.body);
          be.style.fill="var(--ink)";
          be.style.fillOpacity=(0.88+0.12*f).toFixed(2);
          be.style.stroke="var(--ink)";
          be.style.strokeWidth=(0.30+0.16*f).toFixed(2)+"px";
          be.style.strokeOpacity=(0.55+0.42*f).toFixed(2);
          e.setAttribute("d",it.d);
          /* the pappus is fluff, not structure: light grey, one step
             lighter than --hl-mid, and kept low-opacity so the ball reads
             as airy haze rather than a dark scrub */
          e.style.stroke="var(--hl-lo)";
          e.style.strokeWidth=(0.22+0.14*f).toFixed(2)+"px";
          e.style.strokeOpacity=(0.42+0.40*f).toFixed(2);
          /* Realistic dandelion puff:
             1) Windward seeds feel the breath first and peel off in a wave
                toward the leeward side; 1/4 of the seeds stay on the dome
                and gently rustle in the airflow.
             2) Detached seeds right themselves like tiny parachutes (pappus
                up and leaning downwind, achene hanging below with a gentle
                pendulum sway) while drifting out along a wide, diverging
                plume with buoyant lift and turbulent eddies until every
                flying seed crosses completely off-screen (by ~7.0s).
             3) 2 seconds after dispersal completes (7.0s..9.0s), the blown
                seeds gradually bloom and fade back onto the receptacle
                (9.0s..11.6s). */
          const q=P(...cD);
          let vx=q[0]-wind.x,vy=q[1]-wind.y,vl=Math.hypot(vx,vy);
          if(vl<8){vx=-0.92;vy=-0.38;vl=1}
          const ux=vx/vl,uy=vy/vl;
          const rx=it.pFs[0]-q[0],ry=it.pFs[1]-q[1];
          const windDot=Math.max(-1,Math.min(1,(rx*ux+ry*uy)/26));
          const fi=it.id-Math.floor(it.id/4)-1;
          const uFan=(((fi*37+13)%93)+0.5)/93*2-1+(h(it.id*19+3)-0.5)*0.06;
          const uSpd=(((fi*53+29)%93)+0.5)/93;
          const delay=Math.max(0.02,(windDot+1)*0.11+0.18*h(it.id*11+5));
          const life=0.40+1.75*h(it.id*67+11);
          const fadeStart=0.36+0.32*h(it.id*73+7);
          const keep=it.id%4===0;
          if(wind.age>=0&&wind.age<2.6){
            if(keep||wind.age<=delay){
              const rustle=(ux>=0?1:-1)*Math.sin(wind.age*6.2+it.id)*Math.exp(-wind.age*0.65)*(keep?4.2:6.5);
              const tr="rotate("+rustle.toFixed(2)+" "+it.p0s[0].toFixed(2)+" "+it.p0s[1].toFixed(2)+")";
              be.setAttribute("transform",tr);e.setAttribute("transform",tr);
              be.style.opacity="";e.style.opacity="";
            }else{
              const tFly=wind.age-delay,
                uLife=Math.min(1,tFly/life),
                fadeProg=Math.max(0,(uLife-fadeStart)/(1-fadeStart)),
                op=uLife>=1?0:Math.pow(1-fadeProg,2.3),
                rA=h(it.id*19+3)-0.5,rB=h(it.id*43+2)-0.5,rC=h(it.id*79+17)-0.5,
                ph1=h(it.id*31+7)*6.283,ph2=h(it.id*53+13)*6.283,
                w1=1.6+2.8*h(it.id*23+5),w2=1.9+3.1*h(it.id*37+11),
                s=tFly*tFly/(tFly+0.42),
                v=(78+132*(0.65*h(it.id*83+1)+0.35*uSpd))*(1+0.22*Math.sin(tFly*w1+ph2)),
                dist=v*s,
                /* dispersion grows with flight time: right after takeoff the gust
                   front still dominates, so seeds stream tightly along wind.dir;
                   once that impulse passes, turbulence takes over and the plume
                   fans out with much more random heading + wider spread. */
                disp=Math.min(1,tFly/0.95),
                dFac=0.10+0.90*disp,
                sFac=0.12+0.88*disp,
                radPush=(0.15+0.45*h(it.id*71+4))*Math.min(1,tFly/0.35)*sFac,
                baseAng=wind.dir,
                stray=it.id%6===0?1.45:1.0,
                th0=(rA*0.8+rB*0.55)*stray*dFac,
                curve=(rC*1.35*Math.sin(tFly*(1.3+1.9*h(it.id*29))+ph1)+rB*0.52*tFly)*sFac,
                th=baseAng+th0+curve,
                amp=((11+20*h(it.id*47+9))*Math.min(1,tFly/0.38)+0.11*dist)*sFac,
                swirlX=Math.sin(tFly*w1+ph1)*amp+Math.cos(tFly*w2*0.7+ph2)*amp*0.45,
                swirlY=Math.cos(tFly*w2+ph2)*amp+Math.sin(tFly*w1*0.8-ph1)*amp*0.45,
                tx=rx*radPush+Math.cos(th)*dist+swirlX,
                ty=ry*radPush+Math.sin(th)*dist+swirlY,
                mx=(it.p0s[0]+it.pFs[0])*0.5,my=(it.p0s[1]+it.pFs[1])*0.5,
                ang0=Math.atan2(it.pFs[1]-it.p0s[1],it.pFs[0]-it.p0s[0])*180/Math.PI,
                angBase=th*180/Math.PI+rA*95,
                dAng=((angBase-ang0+540)%360)-180,
                spinDir=(it.id%2===0?1:-1)*(0.65+1.15*h(it.id*37+9)),
                tumble=spinDir*115*tFly+Math.sin(tFly*(3.8+2.6*h(it.id*53))+it.id*1.7)*(38+24*h(it.id*41))+Math.cos(tFly*(2.4+1.6*h(it.id*61))+it.id)*24,
                rot=dAng*(1-Math.exp(-tFly*4.2))+tumble*Math.min(1,tFly/0.22),
                tr="translate("+tx.toFixed(2)+" "+ty.toFixed(2)+") rotate("+rot.toFixed(2)+" "+mx.toFixed(2)+" "+my.toFixed(2)+")",
                opStr=op.toFixed(2);
              be.setAttribute("transform",tr);e.setAttribute("transform",tr);
              be.style.opacity=opStr;e.style.opacity=opStr;
            }
          }else if(wind.age>=2.6&&!keep){
            const t0=3.1+0.85*(((fi*41+7)%93)/93);
            const gRaw=Math.max(0,Math.min(1,(wind.age-t0)/0.85));
            const g=gRaw*gRaw*(3-2*gRaw);
            if(g<=0){
              be.removeAttribute("transform");e.removeAttribute("transform");
              be.style.opacity="0";e.style.opacity="0";
            }else if(g<1){
              const sc0=0.28+0.72*g,cx=it.p0s[0],cy=it.p0s[1],
                tr="translate("+(cx*(1-sc0)).toFixed(2)+" "+(cy*(1-sc0)).toFixed(2)+") scale("+sc0.toFixed(3)+")",
                op=g.toFixed(2);
              be.setAttribute("transform",tr);e.setAttribute("transform",tr);
              be.style.opacity=op;e.style.opacity=op;
            }else{
              be.removeAttribute("transform");e.removeAttribute("transform");
              be.style.opacity="";e.style.opacity="";
            }
          }else{
            be.removeAttribute("transform");e.removeAttribute("transform");
            be.style.opacity="";e.style.opacity="";
          }
          sc.seedG.appendChild(be);sc.seedG.appendChild(e);
        }}
      if(!placed){sc.seedG.appendChild(sc.domeFill);sc.seedG.appendChild(sc.domePits)}
    }
  }
  /* depth-sorted group order */
  const groups=[
    {node:gCrown,depth:depthOf(0,0,MH-0.2)}];
  /* The short basal and medium leaves are a low backdrop for the tall,
     long blades. Keep that botanical hierarchy independent of camera
     angle, while retaining depth order within each size tier. */
  for(const l of leaves)groups.push({node:l.g,
    depth:depthOf(...l.d.centroid)+(l.d.length<40?-1e6:0)});
  /* Rick 00:55 "花茎和石头关系也需要处理，石头是最底层的": stones get a
     large NEGATIVE bias, so they are appended before everything else and
     every plant part paints over them. The old props layer sat at +2e6
     (above the blades, cut back out with a mask) and also painted over the
     scapes - the stem was sliced wherever it crossed a stone. Now the
     scatter is the ground itself: blades, stems and heads all read on top,
     and the stones still sort against EACH OTHER by true depth */
  for(const st of stones){
    const d=depthOf(st.s.cx,st.s.cy,STONE_Z+st.s.H*0.55);
    groups.push({node:st.g,depth:-2e6+d})}
  /* STEM: every cell sorts on its OWN depth (see mkScape). No bias, no
     blanket "a blade is always in front" rule - a stem that crosses a
     blade is in front of it over one stretch and behind it over the next,
     and cell-by-cell ordering is the only thing that can express that.
     The mouth ellipse stays with the tip, the HEAD keeps its own depth. */
  for(const sc of[scapeFlower,scapeBall]){
    for(const c of sc.cells)groups.push({node:c.g,depth:c.depth});
    groups.push({node:sc.g,depth:depthOf(...sc.d.top)});
    groups.push({node:sc.hg,depth:depthOf(...add(sc.d.top,scl(sc.d.A,0.55)))})}
  groups.sort((a,b)=>a.depth-b.depth);
  for(const g of groups)rootG.appendChild(g.node);
}
build();
/* ---- interaction: 360° rotate ---- */
let sideNear=1;
const yaw=spring(C.az,{k:170,c:21}),tilt=spring(C.k,{k:150,c:20});
/* Only the two flowering stems and their heads sway. The rosette, leaves
   and ground remain planted while the stems hinge at their shared base. */
const scapeNodes=[scapeFlower,scapeBall].flatMap(sc=>[...sc.cells.map(c=>c.g),sc.g,sc.hg]);
const swayScapes=a=>{const q=P(0,0,PLANT_BASE),
  tr="rotate("+a.toFixed(3)+" "+q[0].toFixed(2)+" "+q[1].toFixed(2)+")";
  for(const node of scapeNodes)node.setAttribute("transform",tr)};
const loop=register(stage,dt=>{const turning=stepS(yaw,dt)|stepS(tilt,dt);
  if(yaw.x!==C.az||tilt.x!==C.k){C.az=yaw.x;C.k=tilt.x;look();build()}
  const blowing=wind.age>=0&&wind.age<4.9;
  if(blowing){
    wind.age+=dt;
    const headP=P(...scapeBall.d.top),dirS=headP[0]>=wind.x?1:-1;
    /* the gust shoves the scapes over, then they spring back and ring down:
       2.4x the old throw, with a slower decay so the ring-out stays visible */
    const a=dirS*(5.9*wind.age*Math.exp(-wind.age*0.95)+4.0*Math.sin(wind.age*3.6)*Math.exp(-wind.age*0.62));
    if(Math.abs(a)>0.005)swayScapes(a);else for(const node of scapeNodes)node.removeAttribute("transform");
    build();
  }else if(wind.age>=4.9){
    wind.age=-1;
    for(const node of scapeNodes)node.removeAttribute("transform");
    read.textContent=chosen<0?"rest":PARTS[chosen].name;
    build();
  }
  return Boolean(turning)||blowing});
bag.add(loop.unregister);
const stemEls=scapeFlower.cells.concat(scapeBall.cells).map(c=>c.edge);
const PARTS=[{name:"leaf",ats:()=>leaves.map(l=>P(...l.d.centroid)),r:30,els:leaves.map(l=>l.rimL)},
  {name:"stem",at:()=>P(...scapeFlower.d.mid),r:9,els:stemEls}];
function pick(sx,sy){let best=-1,score=1.05;PARTS.forEach((p,i)=>{
  const qs=p.ats?p.ats():[p.at()];
  for(const q of qs){const d=Math.hypot(sx-q[0],sy-q[1])/(p.r*C.S);if(d<=score)score=d,best=i}});return best}
function choose(i){if(i===chosen)return;chosen=i;PARTS.forEach((p,j)=>(p.els||[]).forEach(e=>e.classList.toggle("hi",i===j)));read.textContent=i<0?"rest":PARTS[i].name}
const gust=(x,y)=>{wind.age=0;wind.x=x;wind.y=y;
  /* master drift direction: the puff is blown AWAY from the tap, toward
     the far side of the head. Falls back to screen-right when the tap
     sits on the head centre. */
  const hp=P(...scapeBall.d.top),dx=hp[0]-x,dy=hp[1]-y,dl=Math.hypot(dx,dy);
  wind.dir=dl<8?0:Math.atan2(dy,dx);
  read.textContent="wind";loop.wake()};
bag.add(pointer(stage,{down:([x,y],e)=>{if(e&&e.button>0)return;const i=pick(x,y);drag={x:x,y:y,az:yaw.t,k:tilt.t,moved:false};loop.wake();if(i<0){choose(-1);read.textContent="turn";return}choose(i);read.textContent="turn"},
move:([x,y],e)=>{if(drag&&e&&e.buttons&1){drag.moved||=(Math.hypot(x-drag.x,y-drag.y)>4);yaw.t=drag.az-(x-drag.x)*.015;tilt.t=Math.max(KS[0],Math.min(KS[1],drag.k+(y-drag.y)*.0055));loop.wake();return}drag=null;choose(pick(x,y))},
leave:()=>{drag=null;choose(-1)}}));
const release=()=>{if(drag&&!drag.moved){gust(drag.x,drag.y);drag=null;return}drag=null;read.textContent=chosen<0?"rest":PARTS[chosen].name};
bag.on(window,"pointerup",release);bag.on(window,"pointercancel",release);bag.add(()=>svg.replaceChildren());
read.textContent="rest";return{set(v){force=v},destroy:bag.dispose}}
hairline({name:"dandelion",means:"A dandelion rosette: tap to send a gust, hover to name each part, and drag to turn it.",rules:[1,4,5,8,9,10],range:[.6,1,1.6],tour:[[180,210],[120,150],[270,150],[210,90],null],mount:mount});
};
