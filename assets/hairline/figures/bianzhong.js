(window.__HL_FIGURES__ = window.__HL_FIGURES__ || {})["bianzhong"] = () => {

// Bianzhong: two tiers of bronze chime bells hung from a wooden rack, graded large to small, each
// studded with bosses. Hover names a bell's note; a press (or a held slide) strikes it: it swings and rings.
// A hold off the bells turns the whole rack round, as in a 3D viewer.
const { Cam, circ, disposer, facing, fit, hull, mk, open, place, poly, pointer, prism, proj, put, register, rings, rrect, run, seg, solid, spring, stepS } = HL;

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let force = value, chosen = -1, held = false, drag = null;

  // (s, t) is the rack's own frame: s runs along it, to the viewer's right; t toward the viewer.
  const R2 = Math.SQRT1_2, W = (s, t) => [(s + t) * R2, (t - s) * R2];
  const C = Cam(45, 0.6, 2.2), KS = [0.25, 0.65]; // an orbiting camera: az turns the rack, k tilts it
  fit(C, [[...W(-66, -8), 0], [...W(66, 8), 0], [...W(-66, -8), 70], [...W(66, 8), 70]], 200, 166);
  const PIV = [0, 0, 35], AT = proj(C)(...PIV); // the orbit's centre, held at one spot on screen
  let P, front; const look = () => { const q = ((C.ox = C.oy = 0), proj(C)(...PIV)); (C.ox = AT[0] - q[0]), (C.oy = AT[1] - q[1]), (P = proj(C)), (front = facing(C)); };
  look();
  const fs = () => (Math.sin(C.az) + Math.cos(C.az) >= 0 ? 1 : -1); // which side of the rack faces the viewer: +t or -t
  // A ring drawn in (s, t) round (s0, t0), carried into world space, normals included.
  const toW = (ring, s0, t0) => ring.map((q) => { const [x, y] = W(s0 + q.u, t0 + q.v); return { ...q, u: x, v: y, nu: (q.nu + q.nv) * R2, nv: (q.nv - q.nu) * R2 }; });
  const redo = [], box = (s0, t0, s1, t1, z0, z1, r, b = 0.8) => {
    const el = solid(svg), [ring, inner] = rings(s0, t0, s1, t1, r, b).map((g) => toW(g, 0, 0)), u = () => put(el, prism(P, front, ring, inner, z0, z1));
    u(), redo.push(u), (el.s = (s0 + s1) / 2); // redrawn when the view turns
    el.sil.setAttribute("style", "fill:#000"), el.cr.setAttribute("style", "stroke:#fff"); // the rack is black, its crease white
    return el;
  };

  // The rack: feet, two posts, and two beams with upturned ends; painted back to front.
  const BEAM = [{ z: 62, h: 3.4 }, { z: 33, h: 3.8 }];
  const FEET = [-1, 1].map((sg) => box(sg * 62 - 5, -8, sg * 62 + 5, 8, 0, 3, 2));
  const POSTS = [-1, 1].map((sg) => box(sg * 62 - 2, -2, sg * 62 + 2, 2, 3, BEAM[0].z + BEAM[0].h, 1));
  const BEAMS = [BEAM[1], BEAM[0]].map((b) => box(-66, -2.2, 66, 2.2, b.z, b.z + b.h, 1.6, 0.9));

  // Bells: lower tier large, upper small; pitches climb left to right in each, low to high.
  const NOTES = [["C4", "D4", "E4", "G4", "A4", "C5", "D5"], ["E5", "G5", "A5", "C6", "D6", "E6", "G6"]];
  const MIDI = { C: 0, D: 2, E: 4, G: 7, A: 9 };
  const bells = [];
  [1, 0].forEach((tier) => NOTES[tier].forEach((name, i) => {
    const w = tier ? 9.4 - i * 0.45 : 14.5 - i * 0.75, h = w * 1.45, sp = tier ? 15 : 16;
    const zh = BEAM[tier ? 0 : 1].z, z1 = zh - 4.5, z0 = z1 - h, s0 = (i - 3) * sp;
    const local = rrect(-w / 2, -w * 0.33, w / 2, w * 0.33, w * 0.3, 6), inner = rrect(-w * 0.36, -w * 0.2, w * 0.36, w * 0.2, w * 0.18, 6);
    const b = { name, tier, s0, w, h, zh, z0, z1, local, inner, sp: spring(0, { k: 30, c: 2.6, eps: 0.0005 }) /* fine: a turn's small nudges add up, not snap to rest */, drawn: NaN };
    b.f = 440 * 2 ** ((12 * (+name[1] + 1) + MIDI[name[0]] - 69) / 12);
    b.el = solid(svg);
    b.shank = mk("path", { class: "nf" }, b.el.g);
    b.face = mk("path", { class: "nf lo" }, b.el.g);
    // Bosses (mei): three rows of two on each side of the front face, the bell's own studs.
    b.dots = [];
    for (const side of [-1, 1]) for (const c of [0.22, 0.36]) for (const r of [0.5, 0.68, 0.86]) b.dots.push({ u: side * c * w, r, el: mk("circle", { r: tier ? 0.75 : 0.95, class: "dot m" }, b.el.g) });
    bells.push(b);
  }));

  // One bell, swung by `a` (radians) about its hanging point: the body tilts toward the viewer.
  const at = (b, a, u, v, z) => { const dz = z - b.zh, c = Math.cos(a), s = Math.sin(a); return P(...W(b.s0 + u, v * c - dz * s), b.zh + v * s + dz * c); };
  function draw(b, a) {
    b.drawn = a;
    const F = fs(), foot = b.local.map((q) => at(b, a, q.u, q.v, b.z0)), top = b.local.map((q) => at(b, a, q.u * 0.74, q.v * 0.74, b.z1));
    put(b.el, { sil: poly(hull(foot.concat(top))), crease: open(run(b.inner, (q) => front(toW([q], 0, 0)[0])).map((q) => at(b, a, q.u, q.v + F * b.w * 0.02, b.z1 - 0.3))) });
    b.shank.setAttribute("d", seg(at(b, a, 0, 0, b.zh), at(b, a, 0, 0, b.z1)) + poly(circ(0.9, 10).map((q) => at(b, a, q.u, 0, b.z1 + 1 + q.v))));
    // Mouth (yu): the rim arches up between its two points; a pair of lines frames the central panel (zheng).
    const arch = [...Array(13)].map((_, k) => { const u = (k / 12 - 0.5) * b.w; return at(b, a, u, F * b.w * 0.33 * Math.sqrt(Math.max(0, 1 - (2 * u / b.w) ** 2)) * 0.98, b.z0 + b.h * 0.12 * (1 - (2 * u / b.w) ** 2)); });
    b.face.setAttribute("d", open(arch) + [-1, 1].map((sg) => seg(at(b, a, sg * 0.1 * b.w, F * b.w * 0.33 * 0.9, b.z0 + b.h * 0.22), at(b, a, sg * 0.08 * b.w, F * b.w * 0.33 * 0.76, b.z1 - 0.6))).join(""));
    for (const d of b.dots) {
      const z = b.z0 + d.r * b.h, k = 1 - 0.26 * d.r; // the face narrows toward the top
      place(d.el, at(b, a, d.u * k, F * (b.w * 0.33 * k + 0.1), z));
    }
  }
  bells.forEach((b) => draw(b, 0));
  // Painter's order for the view (rule 06): feet, then the beams the bells hang under, then bells and posts far to near.
  const dep = (s) => { const [x, y] = W(s, 0); return x * Math.sin(C.az) + y * Math.cos(C.az); };
  const order = () => [...FEET, ...BEAMS].map((e) => e.g).concat([...bells.map((b) => [dep(b.s0) + b.tier * 1e-3, b.el.g]), ...POSTS.map((e) => [dep(e.s), e.g])].sort((p, q) => p[0] - q[0]).map((m) => m[1])).forEach((g) => svg.appendChild(g));
  order();
  // Turning (rule 08): a hold off the bells drags the view; springs carry the turn and tilt to where the pointer puts them.
  const yaw = spring(C.az), tilt = spring(C.k);
  let spin = 0; // the turn's last speed: a change in it swings the hanging bells, the farther from the axis the more

  let mark = bells[10].el.sil; // at rest: the lower tier's middle bell
  mark.classList.add("hi");

  let REST = [];
  const rest = () => (REST = bells.map((b) => { const q = b.local.map((p) => at(b, 0, p.u, p.v, b.z0)).concat(b.local.map((p) => at(b, 0, p.u * 0.74, p.v * 0.74, b.z1 + 1))), xs = q.map((p) => p[0]), ys = q.map((p) => p[1]); return { x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys) }; }));
  rest();
  const loop = register(stage, (dt) => {
    let moving = (stepS(yaw, dt) | stepS(tilt, dt)) > 0;
    if (yaw.x !== C.az || tilt.x !== C.k) (C.az = yaw.x), (C.k = tilt.x), look(), redo.forEach((u) => u()), bells.forEach((b) => draw(b, b.drawn)), order(), rest();
    const dw = yaw.v - spin; spin = yaw.v;
    if (dw) for (const b of bells) b.sp.v -= dw * (b.s0 < 0 ? -1 : 1) * (0.008 * Math.abs(b.s0) + 0.15); // each side swings its own way; even the middle bell takes some
    for (const b of bells) {
      if (stepS(b.sp, dt)) moving = true;
      const a = Math.max(-0.4, Math.min(0.4, b.sp.x));
      if (a !== b.drawn) draw(b, a);
    }
    return moving;
  });
  bag.add(loop.unregister);

  // Hit test on the rest pose (rule 01): each bell's resting outline on screen in the current view, nearest centre wins.
  // While held (a slide), each box widens to meet its neighbours', so a glissando has no silent gaps.
  function pick(sx, sy, loose = held) {
    let best = -1, d0 = Infinity;
    const px = loose ? 8 : 0.8, py = loose ? 8 : 3;
    REST.forEach((r, i) => {
      if (sx < r.x0 - px || sx > r.x1 + px || sy < r.y0 - py || sy > r.y1 + py) return;
      const d = Math.hypot(sx - (r.x0 + r.x1) / 2, sy - (r.y0 + r.y1) / 2);
      if (d < d0) (d0 = d), (best = i);
    });
    return best;
  }
  function choose(i) {
    if (i === chosen) return;
    chosen = i;
    mark.classList.remove("hi");
    (mark = bells[i < 0 ? 10 : i].el.sil).classList.add("hi");
    read.textContent = i < 0 ? "rest" : bells[i].name;
  }

  // Sound: a struck bell is a few inharmonic partials, each fading at its own rate; the big ones ring longest.
  let ac = null, bus = null;
  const unlock = () => (ac = ac || new (window.AudioContext || window.webkitAudioContext)()).resume();
  function ring(b) {
    if (!ac) return;
    if (!bus) (bus = ac.createDynamicsCompressor()).connect(ac.destination);
    const t = ac.currentTime + 0.005, len = b.tier ? 2.2 : 3.4, g = Math.min(force, 1.6) * 0.5;
    for (const [m, lvl, d] of [[1, 1, 1], [2.76, 0.5, 0.55], [5.4, 0.28, 0.3], [8.93, 0.14, 0.18], [0.5, 0.25, 0.9]]) {
      const o = ac.createOscillator(), e = ac.createGain();
      o.frequency.value = b.f * m;
      e.gain.setValueAtTime(0, t), e.gain.linearRampToValueAtTime(g * lvl, t + 0.004);
      e.gain.exponentialRampToValueAtTime(0.0001, t + len * d);
      o.connect(e).connect(bus), o.start(t), o.stop(t + len * d + 0.05);
    }
  }
  bag.add(() => ac && ac.close());

  function strike(i) {
    if (i < 0) return;
    const b = bells[i];
    b.sp.v += (b.tier ? 2.2 : 1.5) * Math.min(force, 1.6); // struck on the face, a bell swings back and settles
    ring(b);
    loop.wake();
  }

  const turn = ([x, y], e) => { if (!(e && e.buttons & 1)) return (drag = null); (yaw.t = drag.az - (x - drag.x) * 0.012), (tilt.t = Math.max(KS[0], Math.min(KS[1], drag.k + (y - drag.y) * 0.004))), loop.wake(); return 1; };
  bag.add(pointer(stage, {
    move: ([x, y], e) => { if (drag && turn([x, y], e)) return; held = !!(e && e.buttons & 1); const i = pick(x, y), was = chosen; choose(i); if (held && i !== was) strike(i); },
    down: ([x, y]) => { unlock(); const i = pick(x, y); if (i < 0) return (drag = { x, y, az: yaw.t, k: tilt.t }), choose(-1), (read.textContent = "turn"); held = true; choose(i); strike(i); },
    leave: () => { held = false; drag = null; choose(-1); },
  }));
  bag.add(() => svg.replaceChildren());
  read.textContent = "rest";

  return { set(v) { force = v; }, destroy: bag.dispose };
}

hairline({
  name: "bianzhong",
  means: "Bianzhong chime bells on a two-tier rack: a pointed bell is named, a press strikes it so it swings and rings, a drag turns the rack.",
  rules: [1, 4, 5, 6, 9, 10],
  range: [0.6, 1, 1.6],
  tour: [[94, 196], [200, 193], [266, 136], null],
  mount,
});
};
