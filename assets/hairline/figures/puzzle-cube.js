(window.__HL_FIGURES__ = window.__HL_FIGURES__ || {})["puzzle-cube"] = () => {

/**
 * Puzzle cube: 3 × 3 × 3 crisp cubies, faces told apart by shapes. Drags turn
 * the layer or slice under the pointer, a quarter at a time, so it always lands square.
 */
const { Cam, clamp, disposer, fit, hull, mk, pointer, poly, proj, open, rad, register, tdone, tset, tval, tween, unproj } = HL;

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let reach = value;

  const Q = 17, h = 8.1, r = 0.6, L = Q * 1.5; // pitch, half width, bevel, half cube
  const C = Cam(45, 0.5, 2.6);
  const MAX = rad(45); // a quarter turn is widest halfway
  // Turn point p about world axis (0 x, 1 y, 2 z) through the cube's centre.
  const rot = (p, axis, a) => {
    const c = Math.cos(a), s = Math.sin(a), [x, y, z] = p;
    if (axis === 2) return [x * c - y * s, x * s + y * c, z];
    if (axis === 1) return [x * c + z * s, y, -x * s + z * c];
    return [x, y * c - z * s, y * s + z * c];
  };
  const SG = [-1, 1], corners = SG.flatMap((x) => SG.flatMap((y) => SG.map((z) => [x, y, z])));
  // Fit to the cube with any slice-sized turn of 45°, the widest pose.
  fit(C, [0, 1, 2].flatMap((ax) => [-MAX, MAX].flatMap((a) =>
    corners.map((q) => { const [x, y, z] = rot(q.map((v) => v * L), ax, a); return [x, y, z + L]; }))), 200, 166);
  const P = proj(C);
  const zf = Math.sqrt(1 - C.k * C.k), c45 = Math.cos(C.az), s45 = Math.sin(C.az);
  const view = [s45 * zf, c45 * zf, C.k]; // toward the camera
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  // Each slice the pointer reaches turns a quarter (a tween: a discrete event).
  let spin = tween(0), spinA = 0, spinReq = 0, turning = false, inside = false;
  const eye = view, W = (p) => P(p[0], p[1], p[2] + L);

  // Bevelled corners: three points per corner, r in from the sharp one.
  const shell = corners.flatMap(([x, y, z]) => [0, 1, 2].map((a) => [x, y, z].map((v, b) => v * (a === b ? h - r : h))));
  // One shape per face, as [closed, points] strokes in the face's own u, v, drawn at SHAPE scale.
  const SHAPE = 0.7;
  const ring = (n, R, a0) => [...Array(n)].map((_, i) => [R * Math.cos(a0 + (i * 2 * Math.PI) / n), R * Math.sin(a0 + (i * 2 * Math.PI) / n)]);
  const MARKS = {
    "2,1": [[1, ring(20, 3.6, 0)]], // top: circle
    "0,1": [[1, ring(4, 4.4, Math.PI / 4)]], // +x: square
    "1,1": [[1, ring(3, 4.2, -Math.PI / 2)]], // +y: triangle
    "1,-1": [[2, ring(4, 4.2, 0)]], // -y: diamond, outline only (2: closed, not filled)
    "0,-1": [[0, [[-4, 0], [4, 0]]], [0, [[0, -4], [0, 4]]]], // -x: plus
    "2,-1": [-1.6, 1.6].flatMap((o) => [[0, [[-4, o], [4, o]]], [0, [[o, -4], [o, 4]]]]), // base: grid
  };
  const round = (v) => v.map(Math.round);

  const g = mk("g", {}, svg);
  const cubies = [];
  for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) for (let k = -1; k <= 1; k++) {
    const el = mk("g", {}, g), ix = [i, j, k], marks = [];
    const c = { ix, el, sil: mk("path", { class: "sil" }, el), marks, m: [[1, 0, 0], [0, 1, 0], [0, 0, 1]], d: 0 };
    for (const [key, strokes] of Object.entries(MARKS)) {
      const [fa, sg] = key.split(",").map(Number);
      if (ix[fa] !== sg) continue;
      const [u, v] = [0, 1, 2].filter((x) => x !== fa), nrm = [0, 0, 0];
      nrm[fa] = sg;
      const lift = ([pu, pv]) => { const p = [0, 0, 0]; p[fa] = sg * h; p[u] = pu * SHAPE; p[v] = pv * SHAPE; return p; };
      marks.push({ nrm, strokes: strokes.map(([cl, pts]) => [cl, pts.map(lift)]), el: mk("path", { class: strokes[0][0] === 1 ? "dot off" : "nf lo" }, el) }); // 1: solid, dim
    }
    cubies.push(c);
  }
  // Local to world: the cubie's own turn (m, its axes' images), then its place.
  const local = (c, p) => [0, 1, 2].map((a) => p[0] * c.m[0][a] + p[1] * c.m[1][a] + p[2] * c.m[2][a]);
  const cubie = (i, j, k) => cubies.find((c) => c.ix[0] === i && c.ix[1] === j && c.ix[2] === k);

  let cur = { axis: 2, idx: 1 }, want = { ...cur, dir: 1 };
  let drawn = NaN;

  function draw(all) {
    const a = spinA;
    if (!all && a === drawn) return;
    drawn = a;
    for (const c of cubies) {
      const inSlice = c.ix[cur.axis] === cur.idx;
      if (!all && !inSlice) continue;
      const turn = (q) => (inSlice ? rot(q, cur.axis, a) : q);
      const t = (p) => { const q = local(c, p); return turn([c.ix[0] * Q + q[0], c.ix[1] * Q + q[1], c.ix[2] * Q + q[2]]); };
      c.sil.setAttribute("d", poly(hull(shell.map((p) => W(t(p))))));
      // A face's shape is drawn only while the face looks toward the camera.
      for (const f of c.marks) {
        const on = dot(turn(local(c, f.nrm)), eye) > 0.05;
        f.el.setAttribute("d", on ? f.strokes.map(([cl, pts]) => (cl ? poly : open)(pts.map((p) => W(t(p))))).join("") : "");
      }
      c.d = dot(t([0, 0, 0]), eye);
    }
    // Slabs along the turning axis are split by planes, so their order is exact:
    // the far slab first. Within a rigid slab, centre depth orders the cubies.
    const far = eye[cur.axis] > 0 ? 1 : -1;
    [...cubies].sort((p, q) => (p.ix[cur.axis] - q.ix[cur.axis]) * far || p.d - q.d)
      .forEach((c) => g.appendChild(c.el));
  }
  draw(true);

  // One slice at a time: a new slice waits until the turning one has landed.
  function settle() {
    if (want.axis === cur.axis && want.idx === cur.idx) return false;
    if (turning) return true;
    cur = { axis: want.axis, idx: want.idx };
    draw(true);
    spinReq = inside ? want.dir : 0;
    return true;
  }

  const loop = register(stage, (dt, now) => {
    if (spinReq) { tset(spin, spin.to + (spinReq * Math.PI) / 2, now, 0); spinReq = 0; }
    turning = !tdone(spin, now);
    // A landed quarter is kept: the slice's cubies take their new places and turns.
    if (!turning && spin.to) {
      for (const c of cubies) if (c.ix[cur.axis] === cur.idx) {
        c.ix = round(rot(c.ix, cur.axis, spin.to));
        c.m = c.m.map((v) => round(rot(v, cur.axis, spin.to)));
      }
      spin = tween(0);
      draw(true);
    }
    const pending = settle();
    spinA = tval(spin, now);
    draw(false);
    return pending || turning;
  });
  bag.add(loop.unregister);

  // The cubie face under the pointer on the cube at rest (rule 01).
  function pick(sx, sy) {
    const cell = (v) => clamp(Math.floor((v + L) / Q), 0, 2) - 1;
    const [tx, ty] = unproj(C, sx, sy, 2 * L);
    if (Math.abs(tx) <= L && Math.abs(ty) <= L) return { face: 2, i: cell(tx), j: cell(ty), k: 1 };
    const a0 = unproj(C, sx, sy, 0), a1 = unproj(C, sx, sy, 2 * L);
    for (const axis of [0, 1]) {
      const t = (L - a0[axis]) / (a1[axis] - a0[axis]);
      if (!(t >= 0 && t <= 1)) continue;
      const o = a0[1 - axis] + (a1[1 - axis] - a0[1 - axis]) * t;
      if (Math.abs(o) > L) continue;
      const k = clamp(Math.floor(t * 3), 0, 2) - 1;
      return axis === 0 ? { face: 0, i: 1, j: cell(o), k } : { face: 1, i: cell(o), j: 1, k };
    }
    return null;
  }

  let last = null, ax = 0, ay = 0, mode = "h", markEl = cubie(1, 1, 1).sil;
  markEl.classList.add("hi");
  function mark(el) {
    if (el !== markEl) { markEl.classList.remove("hi"); (markEl = el).classList.add("hi"); }
  }
  function move([x, y]) {
    const hit = pick(x, y);
    if (!hit) return leave();
    if (last) {
      ax = ax * 0.8 + Math.abs(x - last[0]);
      ay = ay * 0.8 + Math.abs(y - last[1]);
      if (ax > ay * 1.4 && ax > 2 / reach) mode = "h"; // intensity: how soon a drag counts
      else if (ay > ax * 1.4 && ay > 2 / reach) mode = "v";
    }
    last = [x, y];
    let axis, idx, u, name;
    if (mode === "h") [axis, idx, u, name] = [2, hit.k, (x - 200) / 90, ["base", "mid", "top"][hit.k + 1]];
    else if (hit.face === 0) [axis, idx, u, name] = [1, hit.j, (y - 166) / 90, `col ${hit.j + 2}`];
    else [axis, idx, u, name] = [0, hit.i, (166 - y) / 90, `row ${hit.i + 2}`];
    want = { axis, idx, dir: u < 0 ? -1 : 1 }; // the pointer's side picks the way
    // Arriving on the rest layer spins it here; other slices spin in settle().
    if (!inside && (inside = true) && axis === cur.axis && idx === cur.idx) spinReq = want.dir;
    // The bright edge goes to the slice's nearest cubie.
    const near = cubies.filter((c) => c.ix[axis] === idx).reduce((b, c) =>
      c.ix[0] + c.ix[1] + c.ix[2] > b.ix[0] + b.ix[1] + b.ix[2] ? c : b);
    mark(near.sil);
    read.textContent = name;
    loop.wake();
  }
  function leave() {
    inside = false; last = null; ax = ay = 0; mode = "h";
    mark(cubie(1, 1, 1).sil);
    read.textContent = "rest";
    loop.wake();
  }

  bag.add(pointer(stage, { move, leave }));
  bag.add(() => svg.replaceChildren());
  read.textContent = "rest";

  return {
    set(v) { reach = v; },
    destroy: bag.dispose,
  };
}

hairline({
  name: "puzzle-cube",
  means: "A 3 × 3 × 3 puzzle cube with a shape on each face: a hovered row or column turns a quarter, and drags turn layers or slices.",
  rules: [1, 3, 4, 5, 6, 7, 8, 9, 10],
  range: [0.35, 0.75, 1.25],
  tour: [[150, 110], [250, 190], [250, 240], null],
  mount,
});
};
