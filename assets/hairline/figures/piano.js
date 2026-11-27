(window.__HL_FIGURES__ = window.__HL_FIGURES__ || {})["piano"] = () => {

// Electronic piano, two octaves, in perspective: the key under the pointer dips; a press sounds the note, pops its
// panel icon and blows bubbles of it. A hold off the keys turns the whole piano round, as in a 3D viewer.
const { circ, disposer, mk, place, pointer, poly, prism, put, register, ringAt, rings, solid, spring, stepS, tdone, tset, tval, tween } = HL;

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let reach = value, chosen = -1, req = false, held = false; // held: button or finger down

  const N = 14, PW = 8.6, KL = 40, Z0 = 3.5, ZW = 6.5, ZB = 8.5; // keys, pitch, length, heights
  const X0 = -(N * PW) / 2, X1 = -X0, E = 6, ZC = 12, ZS = 8, YB = -20, YC = 11; // end block width, case top, speaker top, back, turning centre
  // Perspective from an eye F units out, on a camera orbiting the piano: yaw about the upright through (0, YC), and elevation.
  const F = 145, C = { S: 1, ox: 0, oy: 0 }, V = { ca: 1, sa: 0, K: 0, ZF: 1, eye: [0, 0, 0] }, EL0 = 0.6, EL = [0.2, 1.05], OY = 40; // OY: frame the rig this far below the plate's centre
  const view = (yaw, el) => { Object.assign(V, { ca: Math.cos(yaw), sa: Math.sin(yaw), K: Math.sin(el), ZF: Math.cos(el) }); const d = F * V.ZF - YC; V.eye = [d * V.sa, d * V.ca + YC, F * V.K]; };
  const P = (x, y, z) => { const X = x * V.ca - (y - YC) * V.sa, Y = x * V.sa + (y - YC) * V.ca + YC, f = F / (F - Y * V.ZF - z * V.K); return [C.ox + C.S * f * X, C.oy + C.S * f * (Y * V.K - z * V.ZF)]; };
  const unproj = (sx, sy, z) => { // the point at height z under a screen point, turned back into the piano's own frame
    const u = (sx - C.ox) / C.S, v = (sy - C.oy) / C.S, Y = (v * F - v * z * V.K + F * z * V.ZF) / (F * V.K + v * V.ZF), X = (u * (F - Y * V.ZF - z * V.K)) / F;
    return [X * V.ca + (Y - YC) * V.sa, -X * V.sa + (Y - YC) * V.ca + YC];
  };
  { // Fit once over every turn and tilt the drag allows (rule 03), then drop the whole rig OY below centre so the still
    // pose sits lower in the plate. Note the nudge spends the frame's spare height: past ~0.62 tilt the base's near
    // corner reaches the bottom edge.
    const box = []; for (let a = 0; a < 6.3; a += 0.26) for (const el of EL) { view(a, el); for (const x of [X0 - E, X1 + E]) for (const y of [YB, 42]) for (const z of [0, ZC + 4]) box.push(P(x, y, z)); }
    const xs = box.map((q) => q[0]), ys = box.map((q) => q[1]);
    C.S = Math.min(380 / (Math.max(...xs) - Math.min(...xs)), 290 / (Math.max(...ys) - Math.min(...ys)));
    (C.ox = 200 - (C.S * (Math.min(...xs) + Math.max(...xs))) / 2), (C.oy = 160 + OY - (C.S * (Math.min(...ys) + Math.max(...ys))) / 2), view(0, EL0);
  }
  const front = (q) => q.nu * V.sa + q.nv * V.ca >= -1e-6; // a face is drawn when, turned, it faces the eye

  // Everything static is redrawn through `redo` when the view turns; all of it lives in `scene`, the bubbles above it.
  const scene = mk("g", {}, svg), redo = [];
  const block = (x0, y0, x1, y1, z0, z1, r) => { const s = solid(scene), u = () => put(s, prism(P, front, ...rings(x0, y0, x1, y1, r, 1), z0, z1)); u(), redo.push(u); return Object.assign(s, { cx: (x0 + x1) / 2, cy: (y0 + y1) / 2 }); };
  const dot = (parent, r, x, y, z) => { const d = mk("circle", { r, class: "dot off" }, parent), u = () => place(d, P(x, y, z)); u(), redo.push(u); };
  // Speaker grille: a grid of small dots on an end block's top.
  const grille = (parent, x0) => { for (let a = 0; a < 2; a++) for (let b = 0; b < 9; b++) dot(parent, 0.75, x0 + 1.7 + a * 2.6, 6 + b * 3.8, ZS + 0.05); };

  const base = block(X0 - E, YB, X1 + E, 42, 0, Z0, 2);
  // The panel's icon row: seven shapes, centred, one per note name (C to B, both octaves).
  const ngon = (n, a0, rr = () => 1) => Array.from({ length: n }, (_, i) => { const a = a0 + (2 * Math.PI * i) / n; return { u: rr(i) * Math.cos(a), v: rr(i) * Math.sin(a) }; });
  const SHAPES = [circ(1, 28), ngon(3, -Math.PI / 2), ngon(4, Math.PI / 4), ngon(4, 0), ngon(5, -Math.PI / 2), ngon(6, 0), ngon(10, -Math.PI / 2, (i) => (i % 2 ? 0.45 : 1))];
  const ICONS = SHAPES.map((shape, i) => ({ x: (i - 3) * PW, shape }));
  const at = (shape, x, y, r) => shape.map((q) => ({ u: x + q.u * r, v: y + q.v * r }));
  const panel = block(X0 - E, YB, X1 + E, -1.5, Z0 - 0.1, ZC, 2);
  // Side trim, mirrored either side of the icons: three vent slots and a short column of dots.
  for (const sg of [-1, 1]) {
    const vents = mk("path", { class: "nf lo" }, panel.g), u = () => vents.setAttribute("d", [-15, -11, -7].map((v) => poly([P(sg * 38, v, ZC + 0.05), P(sg * 54, v, ZC + 0.05)])).join(""));
    u(), redo.push(u);
    for (let b = 0; b < 4; b++) dot(panel.g, 0.7, sg * 59, -16.5 + b * 3.6, ZC + 0.05);
  }
  const left = block(X0 - E, -1.5, X0 - 0.4, 42, Z0 - 0.1, ZS, 1.2); grille(left.g, X0 - E);

  const NAMES = ["C", "D", "E", "F", "G", "A", "B"]; const keys = [];
  const add = (x0, x1, y1, z0, z1, name, black) => {
    const [ring, inner] = rings(x0, 0, x1, y1, black ? 0.9 : 1.1, 0.6);
    const rest = 0; // every key level at rest
    const el = Object.assign(solid(scene), { cx: (x0 + x1) / 2, cy: y1 / 2 }), k = { x0, x1, y1, z0, z1, name, black, ring, inner, rest, tw: tween(rest), drawn: NaN, el, edge: el.sil };
    // A black key is a dark body (the kernel's filled dot class) under its own outline.
    if (black) { el.sil.setAttribute("class", "dot m"); el.sil.setAttribute("style", "fill:#000"); k.edge = mk("path", { class: "sil nf" }, el.g); }
    keys.push(k);
  };
  for (let i = 0; i < N; i++) {
    const x0 = X0 + i * PW + 0.25;
    add(x0, x0 + PW - 0.5, KL, Z0, ZW, NAMES[i % 7] + (4 + Math.floor(i / 7)), false);
  }
  for (let i = 0; i < N - 1; i++) {
    if (![0, 1, 3, 4, 5].includes(i % 7)) continue; // no black key after E or B
    const cx = X0 + (i + 1) * PW;
    add(cx - 3.5, cx + 3.5, 24, ZW, ZB, NAMES[i % 7] + "#" + (4 + Math.floor(i / 7)), true);
  }
  const right = block(X1 + 0.4, -1.5, X1 + E, 42, Z0 - 0.1, ZS, 1.2); grille(right.g, X1 + 0.4);
  // Icons are solids on the panel top, drawn last so a grown column stands in front.
  ICONS.forEach((c, _, g) => { g = c.g = mk("g", {}, scene);
    Object.assign(c, { side: mk("path", { class: "sil fo" }, g), edge: mk("path", { class: "sil nf" }, g), top: mk("path", { class: "sil" }, g), ring: at(c.shape, c.x, -11, 2.2), tw: tween(0, 320), drawn: NaN });
  });

  let mark = keys[0].edge; mark.classList.add("hi");

  function draw(k, dip) { k.drawn = dip; const shape = prism(P, front, k.ring, k.inner, k.z0, k.z1 - dip); put(k.el, shape); if (k.black) k.edge.setAttribute("d", shape.sil); }
  keys.forEach((k) => draw(k, k.rest));

  // Sound columns: a press shoots its key's icon (a black key uses its left white's) up
  // into a lit column, which drops straight back once it reaches the top.
  let lit = -1; function wave(j) {
    if (lit >= 0) ICONS[lit].top.classList.remove("hi"); lit = j;
    if (j >= 0) ICONS[j].top.classList.add("hi"), (ICONS[j].peak = 3 * reach), blow(ICONS[j], 1 + Math.floor(rnd(0, 2))), trim();
    req = true, loop.wake();
  }
  // Bubbles: each press blows 1-2 random copies of the shape that swell, spin, wobble up and fade.
  const puffs = [], rnd = (a, b) => a + Math.random() * (b - a);
  const blow = (c, n, o = {}) => { for (; n > 0; n--) puffs.push({ el: mk("path", { class: o.cls || "sil nf", style: o.st || "stroke:#333" }, svg), c, t0: -1, wait: rnd(0, 380), s: rnd(0.4, 1.2) * (o.k || 1), g: o.g ?? 14, dx: rnd(-18, 18), rise: rnd(12, 34), life: rnd(1300, 2200), ph: rnd(0, 6.3), spin: rnd(-1, 1) * 4.7 }); };
  // The side trim's slots and dots, plus music notes, drift off too: random pieces per press.
  const NOTE = [circ(1, 12).map((q) => ({ u: q.u * 0.45 - 0.05, v: q.v * 0.32 + 0.6 })), [{ u: 0.3, v: 0.55 }, { u: 0.4, v: 0.55 }, { u: 0.4, v: -1 }, { u: 0.3, v: -1 }], [{ u: 0.4, v: -1 }, { u: 0.85, v: -0.55 }, { u: 0.8, v: -0.3 }, { u: 0.4, v: -0.65 }]]; // eighth note: head, stem, flag
  const TRIM = [-1, 1].flatMap((sg) => [...[42, 52].map((x) => ({ shape: NOTE, x: sg * x, y: -11, note: 1 })), ...[-15, -11, -7].map((y) => ({ shape: [{ u: -1, v: 0 }, { u: 1, v: 0 }], x: sg * 46, y, line: 1 })), ...[0, 1, 2, 3].map((b) => ({ shape: circ(1, 10), x: sg * 59, y: -16.5 + b * 3.6 }))]);
  const trim = () => { for (let n = 4 + Math.floor(rnd(0, 3)); n > 0; n--) { const t = TRIM[Math.floor(rnd(0, TRIM.length))]; blow(t, 1, t.line ? { k: 5.3, g: 0.6 } : t.note ? { k: 1.6, g: 1.2, cls: "dot m", st: "fill:#333" } : { k: 0.6, g: 2.5, cls: "dot m", st: "fill:#333" }); } };
  function stepPuffs(now) {
    for (let i = puffs.length - 1; i >= 0; i--) {
      const w = puffs[i], p = (now - (w.t0 < 0 ? (w.t0 = now + w.wait) : w.t0)) / w.life;
      if (p >= 1) { w.el.remove(), puffs.splice(i, 1); continue; } else if (p < 0) continue;
      const e = 1 - (1 - p) ** 3, x = w.c.x + w.dx * e + 2.5 * Math.sin(w.ph + p * 9);
      const a = w.spin * e, rot = (q) => ({ u: q.u * Math.cos(a) - q.v * Math.sin(a), v: q.u * Math.sin(a) + q.v * Math.cos(a) }), sz = w.s * (1.5 + w.g * e), z = ZC + 0.05 + w.rise * e, ca = Math.cos(a * 2), sa = Math.sin(a * 2); // notes stand upright and spin about the vertical
      w.el.setAttribute("d", (w.c.note ? w.c.shape.map((r) => poly(r.map((q) => P(x + q.u * sz * ca, w.c.y + q.u * sz * sa, z + (1 - q.v) * sz)))) : (Array.isArray(w.c.shape[0]) ? w.c.shape : [w.c.shape]).map((r) => poly(ringAt(P, at(r.map(rot), x, w.c.y ?? -11, sz), z)))).join(""));
      w.el.style.opacity = String((1 - p) ** 1.5);
    } return puffs.length > 0;
  }
  bag.add(() => puffs.splice(0).forEach((w) => w.el.remove()));
  // A column: lit side faces (those facing the eye) filled, their edges stroked, then the top.
  const seg = (a, b) => `M${a[0].toFixed(1)},${a[1].toFixed(1)}L${b[0].toFixed(1)},${b[1].toFixed(1)}`;
  function drawIcon(c, h) {
    const r = c.ring, n = r.length, z0 = ZC + 0.05, z1 = z0 + (c.drawn = h), vis = [];
    for (let i = 0; i < n; i++) {
      const a = r[i], b = r[(i + 1) % n], mx = (a.u + b.u) / 2 - c.x, my = (a.v + b.v) / 2 + 11;
      let nx = b.v - a.v, ny = a.u - b.u;
      if (nx * mx + ny * my < 0) (nx = -nx), (ny = -ny);
      vis.push(nx * (V.eye[0] - c.x - mx) + ny * (V.eye[1] + 11 - my) > 0);
    }
    let sd = "", ed = "";
    for (let i = 0; i < n; i++) {
      const a = r[i], b = r[(i + 1) % n], A0 = P(a.u, a.v, z0), A1 = P(a.u, a.v, z1), B0 = P(b.u, b.v, z0), B1 = P(b.u, b.v, z1);
      if (vis[i]) (sd += poly([A0, B0, B1, A1])), (ed += seg(A0, B0));
      if (h > 0.01 && (vis[i] !== vis[(i + n - 1) % n] || (n < 20 && vis[i]))) ed += seg(A0, A1);
    }
    c.side.setAttribute("d", sd), c.edge.setAttribute("d", ed), c.top.setAttribute("d", poly(ringAt(P, r, z1)));
  }
  ICONS.forEach((c) => drawIcon(c, 0));
  // Painter's order for the view (rule 06), by the planes between parts: the base; the panel first unless the eye is behind it;
  // an end block before the keys unless the eye is past its side; keys far to near, the blacks after the whites they sit on.
  const far = (a, b) => Math.hypot(b.cx - V.eye[0], b.cy - V.eye[1]) - Math.hypot(a.cx - V.eye[0], a.cy - V.eye[1]), back = () => V.eye[1] < -1.5;
  function order() {
    const lo = V.eye[0] < X0, hi = V.eye[0] > X1, kk = (b) => keys.filter((k) => k.black === b).map((k) => k.el).sort(far).map((e) => e.g);
    [base.g, ...(back() ? [] : [panel.g]), ...(lo ? [] : [left.g]), ...(hi ? [] : [right.g]), ...kk(false), ...kk(true), ...(lo ? [left.g] : []), ...(hi ? [right.g] : []), ...(back() ? [panel.g] : []), ...ICONS.map((c) => c.g)].forEach((g) => scene.appendChild(g));
  }
  const reView = () => { redo.forEach((u) => u()), keys.forEach((k) => draw(k, k.drawn)), ICONS.forEach((c) => drawIcon(c, c.drawn)), order(); };
  order();
  // Turning (rule 08): a hold off the keys drags the view, and springs carry yaw and tilt to where the pointer puts them.
  const yaw = spring(0), tilt = spring(EL0), seen = [0, EL0]; let drag = null;

  const loop = register(stage, (dt, now) => {
    if (req) { req = false;
      keys.forEach((k, j) => { k.tw.dur = held ? 90 : 700; tset(k.tw, j === chosen ? (held ? (k.black ? 1.7 : 2.6) : 0) : chosen < 0 ? k.rest : 0, now, 0); });
      ICONS.forEach((c, j) => tset(c.tw, j === lit ? c.peak : 0, now, 0));
    }
    let moving = stepS(yaw, dt) | stepS(tilt, dt);
    if (yaw.x !== seen[0] || tilt.x !== seen[1]) (seen[0] = yaw.x), (seen[1] = tilt.x), view(yaw.x, tilt.x), reView();
    for (const k of [...keys, ...ICONS]) {
      const v = tval(k.tw, now);
      if (v !== k.drawn) (k.top ? drawIcon : draw)(k, v);
      if (k.top && k === ICONS[lit] && k.tw.to > 0 && tdone(k.tw, now)) k.top.classList.remove("hi"), (lit = -1), tset(k.tw, 0, now, 0); // spring back at once
      if (!tdone(k.tw, now)) moving = true;
    }
    return stepPuffs(now) || !!moving;
  });
  bag.add(loop.unregister);

  // Keys at rest (rule 01): black tops first, at their own height, then the white plane.
  function pick(sx, sy) {
    for (let j = N; j < keys.length; j++) {
      const k = keys[j], [x, y] = unproj(sx, sy, ZB);
      if (x >= k.x0 - 0.3 && x <= k.x1 + 0.3 && y >= 0 && y <= k.y1) return j;
    }
    const [x, y] = unproj(sx, sy, ZW);
    return y < 0 || y > KL + 5 || x < X0 || x >= X1 ? -1 : Math.floor((x - X0) / PW);
  }
  function choose(j) {
    if (j === chosen) return; chosen = j;
    mark.classList.remove("hi"), (mark = keys[j < 0 ? 0 : j].edge).classList.add("hi");
    read.textContent = j < 0 ? "rest" : keys[j].name;
    if (j < 0) wave(-1);
    req = true, loop.wake();
  }

  // Audio: a decaying tone per key; the first pointerdown unlocks the browser's context.
  let ac = null; const SEMI = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  function play(name) {
    wave(Math.max(0, NAMES.indexOf(name[0])));
    const m = /^([A-G])(#?)(\d)$/.exec(name);
    if (!ac || !m) return;
    const midi = 12 * (+m[3] + 1) + SEMI[m[1]] + (m[2] ? 1 : 0);
    const t = ac.currentTime, o = ac.createOscillator(), g = ac.createGain();
    o.type = "triangle", o.frequency.value = 440 * 2 ** ((midi - 69) / 12);
    g.gain.setValueAtTime(0, t), g.gain.linearRampToValueAtTime(0.25 * Math.min(reach, 1.25), t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 1.2), o.connect(g).connect(ac.destination), o.start(t), o.stop(t + 1.25);
  }
  const unlock = () => (ac = ac || new (window.AudioContext || window.webkitAudioContext)()).resume();
  bag.add(() => ac && ac.close());

  const turn = ([x, y], e) => { if (!(e && e.buttons & 1)) return (drag = null); yaw.t = drag.yaw - (x - drag.x) * 0.012, tilt.t = Math.max(EL[0], Math.min(EL[1], drag.el + (y - drag.y) * 0.006)), loop.wake(); return 1; };
  bag.add(pointer(stage, { move: ([x, y], e) => { if (drag && turn([x, y], e)) return; const j = pick(x, y), was = chosen, h = !!(e && e.buttons & 1); if (h !== held) (held = h), (req = true), loop.wake(); choose(j); if (e && e.buttons & 1 && j >= 0 && j !== was) play(keys[j].name); }, down: ([x, y]) => { unlock(); const j = pick(x, y); if (j < 0) return (drag = { x, y, yaw: yaw.t, el: tilt.t }), choose(-1), (read.textContent = "turn"); held = true; req = true; choose(j); play(keys[j].name); }, leave: () => { held = false; drag = null; choose(-1); } }));
  bag.add(() => svg.replaceChildren());
  read.textContent = "rest";

  return { set(v) { reach = v; req = true; loop.wake(); }, destroy: bag.dispose };
}

hairline({
  name: "piano",
  means: "An electronic piano: a pressed key goes down and sounds, the read-out names its note, and a drag off the keys turns the piano round.",
  rules: [1, 3, 4, 5, 6, 7, 8, 9, 10],
  range: [0.35, 0.75, 1.25],
  tour: [[91, 187], [210, 187], [309, 187], null],
  mount,
});
};
