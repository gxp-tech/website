(window.__HL_FIGURES__ = window.__HL_FIGURES__ || {})["drums"] = () => {

// Drum kit, seen from the audience: kick drum facing out, two rack toms on it, snare, floor tom, hi-hat, crash and ride.
// Hover names a piece; a press (or a held slide) strikes it and it sounds. A hold off the kit turns it round, as in a 3D viewer.
const { Cam, circ, disposer, facing, fit, hull, mk, open, place, poly, pointer, prism, proj, put, register, ringAt, run, seg, solid, spring, stepS, unproj } = HL;

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let force = value, chosen = -1, held = false, drag = null;

  // (s, t) is the kit's own frame: s runs to the viewer's right, t toward the viewer.
  const R2 = Math.SQRT1_2, W = (s, t) => [(s + t) * R2, (t - s) * R2];
  const C = Cam(45, 0.72, 3.3), KS = [0.4, 0.85]; // an orbiting camera: az turns the kit, k tilts it from side-on toward top-down
  fit(C, [[...W(-35, 0), 0], [...W(30, 0), 0], [...W(-17, -12), 47], [...W(0, 9), 0], [...W(25, -5), 40], [...W(11, -15), 53], [...W(-40, 2), 0]], 200, 166);
  const PIV = [...W(-3, -2.5), 30], AT = proj(C)(...PIV); // the orbit's centre, held at one spot on screen
  let P, front; const look = () => { const q = ((C.ox = C.oy = 0), proj(C)(...PIV)); (C.ox = AT[0] - q[0]), (C.oy = AT[1] - q[1]), (P = proj(C)), (front = facing(C)); }, eyeA = () => Math.atan2(Math.cos(C.az), Math.sin(C.az)); // eyeA: ground angle toward the viewer
  look();
  const at = (ring, s, t) => { const [x, y] = W(s, t); return ring.map((q) => ({ ...q, u: q.u + x, v: q.v + y })); };

  // kind: drum (stands upright), kick (lies on its side, head to the viewer), cym (a tilted disc).
  const PARTS = [
    { name: "crash", kind: "cym", s: -17, t: -12, r: 9, z: 40, tilt: 2.4 }, { name: "ride", kind: "cym", s: 25, t: -5, r: 10, z: 33, tilt: 1.6 },
    { name: "snare", kind: "drum", s: -16, t: -4, r: 6.5, z0: 18, z1: 23 }, { name: "kick", kind: "kick", s: 0, t: -3, r: 11, z: 11, t0: -8, t1: 8 },
    { name: "tom 1", kind: "drum", s: -6, t: -2, r: 5, z0: 25, z1: 30.5 }, { name: "tom 2", kind: "drum", s: 6, t: -2, r: 5, z0: 25, z1: 30.5 },
    { name: "hi-hat", kind: "cym", s: -32, t: 2, r: 7, z: 29, tilt: 1.5, hat: true }, { name: "floor tom", kind: "drum", s: 18, t: 3, r: 8, z0: 6, z1: 19, legs: true },
    { name: "crash 2", kind: "cym", s: 11, t: -15, r: 8.5, z: 45, tilt: 2.2 },
  ]; // painter's order: back to front, the toms after the kick they sit on

  // The stands and their clamps: painted first. The pieces go in `kit`, re-ordered as the view turns.
  const stands = mk("path", { class: "dot m", style: "fill:#000" }, svg), glint = mk("path", { class: "nf", style: "stroke:#fff" }, svg), joints = mk("g", {}, svg), kit = mk("g", {}, svg);
  for (const p of PARTS) {
    (p.sp = spring(0, p.kind === "cym" ? { k: 160, c: 7, eps: 0.002 } : { k: 260, c: 14 })), (p.drawn = NaN), (p.el = solid(kit)), (p.jo = spring(0, { k: 140, c: 6 })), (p.jd = [0, 0]); // a struck cymbal rings; a head snaps back
    p.el.cr.setAttribute("class", p.kind === "cym" ? "nf lo" : "dot m");
    if (p.hat) p.top = p.el.g.insertBefore(mk("path", { class: "sil" }, p.el.g), p.el.cr); // the hi-hat's top plate: filled, so it hides the bottom plate's far edge
    if (p.kind !== "cym") p.el.cr.setAttribute("style", "fill:#000;fill-rule:evenodd"), (p.hoop = mk("path", { class: "nf" }, p.el.g)); // dark heads (the kick's port stays open), each with its hoop
    if (p.kind === "drum") (p.ring = at(circ(p.r, 28), p.s, p.t)), (p.inner = at(circ(p.r - 0.35, 28), p.s, p.t)), (p.foot = mk("path", { class: "nf lo" }, p.el.g));
    p.lg = mk("g", {}, p.el.g); // lugs
    p.pb = p.el.g.insertBefore(mk("g", {}, p.el.g), p.el.g.firstChild), (p.pbB = mk("path", { class: "dot m", style: "fill:#000" }, p.pb)), (p.pbG = mk("path", { class: "nf", style: "stroke:#fff" }, p.pb)), (p.pj = mk("g", {}, p.pb)); // its stand, under the piece and painted with it, so a stand in front of a drum is not hidden behind it
    if (p.legs || p.kind === "kick") p.fl = [mk("path", { class: "dot m", style: "fill:#000" }, p.el.g), mk("path", { class: "nf", style: "stroke:#fff" }, p.el.g)]; // its legs on the side toward the eye, drawn over the shell they bolt to
    if (p.kind === "cym") p.nut = ["nf", "dot m", "sil nf", "nf"].map((c, i) => mk("path", i === 1 ? { class: c, style: "fill:#000" } : i === 3 ? { class: c, style: "stroke:#fff" } : { class: c }, p.el.g)); // rod, felt and wing nut: drawn darker than the cymbal's face
  }
  const strainer = mk("path", { class: "nf" }, PARTS[2].el.g), kt = (p, e = 0) => (Math.sin(C.az) + Math.cos(C.az) >= 0 ? p.t1 + e : p.t0 - e), leg = (x, y, a, f, z) => P(x + 6 * f * Math.cos(a), y + 6 * f * Math.sin(a), z), tip = (x, y, a) => bar(leg(x, y, a, 0.95, 0.3), leg(x, y, a, 1.25, 0), 2.2), tripod = (x, y) => [0.5, 2.6, 4.7].map((a) => bar(P(x, y, 6), leg(x, y, a, 1, 0), 1.5) + bar(P(x, y, 1.5), leg(x, y, a, 0.55, 2.7), 1) + tip(x, y, a)).join(""), tube = (x, y, z0, z1) => bar(P(x, y, z0), P(x, y, z1), 2), knob = (x, y, z) => bar(P(x, y, z), P(x + 1.4, y - 1.4, z), 0.9) + bar(P(x + 1.4, y - 1.4, z - 0.7), P(x + 1.4, y - 1.4, z + 0.7), 1.1); // the kick head facing the viewer; a leg's point at fraction f and its rubber tip; legs off a collar, each braced from lower on the column; a clamp's T-screw
  let GLINT = ""; const bar = (a, b, w) => { const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1, nx = (-dy / L) * w / 2, ny = (dx / L) * w / 2, o = (p, k) => [p[0] + nx * k, p[1] + ny * k]; GLINT += seg(o(a, -0.35), o(b, -0.35)); return poly([o(a, 1), o(b, 1), o(b, -1), o(a, -1)]); }; // a tube on screen, w wide: black body, a white glint down its lit side
  // Everything that stands still is laid out again whenever the view turns.
  function build() {
    let JG = joints, SL = "", SG = ""; // SL, SG: legs on a drum's far side, under the whole kit (they may sit behind a neighbour, as the floor tom's do behind the kick)
    const joint = (x, y, z) => place(mk("circle", { r: 1, class: "dot off" }, JG), P(x, y, z)); // a stand's clamp, in its piece's stand layer
    const lug = (p, x, y, z) => place(p.dots[p.dots.push(mk("circle", { r: 1.1, class: "dot m" }, p.lg)) - 1], P(x, y, z));
    let legs = ""; GLINT = ""; joints.replaceChildren();
    const legsOf = (p, dirs, one, lim = -0.15) => { let fb = "", fh = ""; dirs.forEach((d, i) => { const near = d[0] * Math.cos(eyeA()) + d[1] * Math.sin(eyeA()) > lim, g = GLINT; GLINT = ""; const b = one(d, i); if (near) (fb += b), (fh += GLINT), (GLINT = g); else (SL += b), (SG += GLINT), (GLINT = g); }); p.fl[0].setAttribute("d", fb), p.fl[1].setAttribute("d", fh); };
    for (const p of PARTS) { const [x, y] = W(p.s, p.t); p.lg.replaceChildren(), (p.dots = []), (legs = ""), (GLINT = ""), (JG = p.pj), p.pj.replaceChildren();
      if (p.kind === "drum") {
        if (p.legs) legsOf(p, [0.6, 2.4, 4.3].map((a) => [Math.cos(a), Math.sin(a)]), ([c, sn]) => { const Q = (r, z) => P(x + r * c, y + r * sn, z); joint(x + (p.r + 3.2) * c, y + (p.r + 3.2) * sn, 0); return bar(Q(p.r + 0.3, p.z0 + 2.6), Q(p.r + 0.3, p.z0 + 5.4), 2.8) + bar(Q(p.r + 0.7, p.z0 + 4), Q(p.r + 3, 0.3), 2.2) + bar(Q(p.r + 2.95, 0.6), Q(p.r + 3.2, 0), 3); }, 0.45); // only a leg well toward the eye goes over the shell (one off to the side may be behind the kick); a bracket on the shell, the leg out of it, a rubber foot
        else if (p.name === "snare") (legs += tube(x, y, 6, p.z0) + tripod(x, y) + knob(x, y, 11) + knob(x, y, 6)), joint(x, y, 11), joint(x, y, 6);
        for (let a = 0; a < 6.28; a += 6.28 / (p.r > 6 ? 10 : 8)) lug(p, x + (p.r - 0.6) * Math.cos(a), y + (p.r - 0.6) * Math.sin(a), p.z1); // lugs round the head's rim
        p.hoop.setAttribute("d", poly(ringAt(P, p.ring, p.z1))), p.foot.setAttribute("d", open(ringAt(P, run(p.ring, front), p.z0 + 0.4))); // hoop on top, bottom hoop round the front
      } else if (p.kind === "cym") (legs += tube(x, y, 6, p.z - 2.5) + tripod(x, y) + knob(x, y, p.z * 0.55) + knob(x, y, 6) + knob(x, y, p.z - 2.5)), joint(x, y, p.z * 0.55), joint(x, y, 6), joint(x, y, p.z - 2.5); // tube, clamps with T-screws, and the tilter under the cymbal
      else {
        legsOf(p, [-1, 1].map((sg) => W(sg, 0.8)), (d, i) => { const sg = i ? 1 : -1, Q = (sd, t, z) => P(...W(sg * sd, t), z); return bar(Q(9.6, 3.6, 6), Q(9.6, 6.6, 6), 2.8) + bar(Q(9.9, 5.2, 5.8), Q(p.r + 4, 9, 0.3), 2.2) + bar(Q(p.r + 3.9, 8.9, 0.6), Q(p.r + 4.1, 9.1, 0), 3); }); // spurs, clamped to the shell's sides near the front head: over the shell only when that side and the front both face the eye
        for (let a = 0; a < 6.28; a += 0.628) lug(p, ...W(p.s + (p.r - 0.6) * Math.cos(a), kt(p, 0.1)), p.z + (p.r - 0.6) * Math.sin(a));
        p.hoop.setAttribute("d", poly(head(p, kt(p, 0.05), p.r - 0.2)));
      }
      p.pbB.setAttribute("d", legs), p.pbG.setAttribute("d", GLINT);
    }
    glint.setAttribute("d", SG), stands.setAttribute("d", SL);
    const sn = PARTS[2], [x, y] = W(sn.s, sn.t), e = sn.r + 0.5, sp = (a, z) => P(x + e * Math.cos(a), y + e * Math.sin(a), z); // the snare's strainer, while it faces the viewer
    strainer.setAttribute("d", Math.cos(0.62 - eyeA()) > 0.2 ? poly([sp(0.45, sn.z0 + 1), sp(0.8, sn.z0 + 1), sp(0.8, sn.z1 - 1.2), sp(0.45, sn.z1 - 1.2)]) : "");
    for (const p of PARTS) if (p.be) p.be.setAttribute("d", p.edges());
  }

  const nut = (x, y, z) => { const e = eyeA() + Math.PI / 2, Q = (u, h) => P(x + u * Math.cos(e), y + u * Math.sin(e), z + h); const out = seg(Q(0, -0.2), Q(0, 0.6)) + seg(Q(0, 1.3), Q(0, 1.9)) + poly(circ(1.5, 14).map((q) => P(x + q.u, y + q.v, z + 0.35))); const hex = (h) => circ(1.1, 6).map((q) => P(x + q.u, y + q.v, z + h)); return [out, poly(hull(hex(0.6).concat(hex(1.3)))), poly(hex(1.3))]; }; // a cymbal's rod, felt washer, and a hex nut
  // A cymbal: a thin disc tipped toward the viewer by its tilt, plus its bell (the hi-hat is two, a gap between them).
  const disc = (p, tilt, dz) => {
    const [x, y] = W(p.s, p.t), ring = circ(p.r, 32);
    const pt = (q, z) => P(x + q.u, y + q.v, z + dz + tilt * ((q.u + q.v) * R2) / p.r);
    return ring.map((q) => pt(q, p.z)).concat(ring.map((q) => pt(q, p.z + 0.5)));
  };
  // The kick: a cylinder whose axis runs toward the viewer; its front head is a circle in (s, z).
  const head = (p, t, r) => circ(r, 32).map((q) => P(...W(p.s + q.u, t), p.z + q.v));

  function draw(p, v) {
    // On a hit the dots (lugs, wing nuts) jump, swell and go dark, then pale back as the piece settles.
    p.drawn = v; const a = Math.min(1, Math.abs(v) / 3), c = Math.round(40 + 190 * (1 - a)); if (p.dots) for (const d of p.dots) d.setAttribute("r", (1.1 * (1 + a * 1.4)).toFixed(2)), d.setAttribute("transform", `translate(0 ${(-a * 5).toFixed(2)})`), (d.style.fill = a > 0.03 ? `rgb(${c},${c},${c})` : ""); if (p.bp) lift(p, a);
    if (p.kind === "drum") {
      const dip = Math.min(0.5, Math.max(0, -v) * 0.25);
      put(p.el, { sil: prism(P, front, p.ring, p.inner, p.z0, p.z1).sil, crease: poly(ringAt(P, p.inner, p.z1 - 0.15 - dip)) });
    } else if (p.kind === "kick") {
      const pulse = Math.min(2, Math.max(0, -v));
      put(p.el, { sil: poly(hull(head(p, p.t1, p.r).concat(head(p, p.t0, p.r)))), crease: poly(head(p, kt(p), p.r - 1.4 - pulse * 0.7)) + poly(circ(1.8, 16).map((q) => P(...W(p.s + 4.5 + q.u, kt(p)), p.z - 4 + q.v))) });
    } else {
      const tilt = p.tilt + Math.max(-4, Math.min(4, v));
      const [x, y] = W(p.s, p.t), bell = circ(p.r * 0.22, 16).map((q) => P(x + q.u, y + q.v, p.z + (p.hat ? 1.8 : 0) + 0.9 + tilt * ((q.u + q.v) * R2) / p.r));
      const rr = (f) => poly(circ(p.r * f, 32).map((q) => P(x + q.u, y + q.v, p.z + (p.hat ? 1.8 : 0) + 0.5 + tilt * ((q.u + q.v) * R2) / p.r))); // a ring on the top face, tipped with the disc
      if (p.top) p.top.setAttribute("d", poly(hull(disc(p, tilt, 1.8))));
      put(p.el, { sil: poly(hull(disc(p, tilt, 0))), crease: poly(bell) + rr(0.62) }), ((n) => [n[0], n[1], n[1], n[2]].forEach((d, i) => p.nut[i].setAttribute("d", d)))(nut(x, y, p.z + (p.hat ? 1.8 : 0) + 1)); // rod and felt; the nut's black body, its outline, its top face in white like a black key
    }
  }
  PARTS.forEach((p) => draw(p, 0));
  const BS = [[20, 0.45, 0], [3, 0.6, 1.571], [4, 0.5, 0.785], [4, 0.6, 0], [5, 0.55, 1.571], [6, 0.55, 0], [10, 0.65, 1.571, 0.45]], br = ([n, r, a0, f = 1], j) => [0.7 * r * (j % 2 ? f : 1), a0 + (6.283 * j) / n], band = (p, wp, B, N, h, full) => { (p.bw = wp), (p.bp = []), (p.vis = full ? (b) => Math.cos(b / p.r - full()) > 0.15 : null); [...Array(N)].forEach((_, i) => p.bp.push({ b: full ? (2 * B * i) / N : -B + h * 0.6 + ((2 * B - 1.2 * h) * i) / (N - 1), k: i % 7, h, el: mk("path", { class: "nf" }, p.el.g), top: mk("path", { class: "nf hi" }, p.el.g) })); p.be = mk("path", { class: "nf" }, p.el.g); p.edges = () => [-h, h].map((a) => open([...Array(33)].map((_, i) => P(...wp(a, full ? p.r * (full() - 1.571 + (3.1416 * i) / 32) : -B + (2 * B * i) / 32))))).join(""); lift(p, 0); }; // decorated bands (a full ring round an upright drum, its far half hidden): two edge lines and a row of the piano's circle, triangle, rectangle, diamond, pentagon, hexagon, star (sides, size of band height, turn, star's inner ratio); wp(a, b) maps across/round the shell
  // A hit pushes a random few band shapes out of the shell (along its normal) into little columns: the base stays grey, struts rise from its corners to a dark top, like the piano's icons, and it drops back as the drum settles.
  const lift = (p, a) => p.bp.forEach((d) => { if (p.vis && !p.vis(d.b)) return d.el.setAttribute("d", ""), d.top.setAttribute("d", ""); const n = BS[d.k][0], L = a * d.h * 1.3 * (d.on || 0), ring = (l) => [...Array(n)].map((_, j) => { const [r, t] = br(BS[d.k], j); return P(...p.bw(r * d.h * Math.sin(t), d.b + r * d.h * Math.cos(t), l)); }); const lo = ring(0), hi = ring(L), up = L > 0.05; d.el.setAttribute("d", poly(lo) + (up ? lo.map((q, j) => (n < 7 || j % (n === 10 ? 2 : 5) === 0 ? seg(q, hi[j]) : "")).join("") : "")); d.top.setAttribute("d", up ? poly(hi) : ""); }); // struts at every corner (the star's points, four round a circle)
  { const k = PARTS[3]; /* round the kick's shell, the half facing the eye */ band(k, (a, b, e = 0) => { const th = b / k.r; return [...W(k.s + (k.r + e) * Math.cos(th), (k.t0 + k.t1) / 2 + a), k.z + (k.r + e) * Math.sin(th)]; }, Math.PI * k.r, 22, 3.2, () => Math.atan2(C.k, R2 * (Math.sin(C.az) - Math.cos(C.az)) * Math.sqrt(1 - C.k * C.k))); } for (const p of PARTS.filter((q) => q.kind === "drum")) { const [x, y] = W(p.s, p.t), h = p.legs ? 1.8 : Math.min(1.1, (p.z1 - p.z0) * 0.16), zc = p.z0 + (p.z1 - p.z0) * 0.5; band(p, (a, b, e = 0) => [x + (p.r + e) * Math.cos(b / p.r), y + (p.r + e) * Math.sin(b / p.r), zc + a], Math.PI * p.r, Math.round(p.r * 2.6), h, eyeA); }
  // Painter's order for the view (rule 06): pieces far to near along the line of sight, the toms always after the kick they sit on.
  const order = () => { const [ex, ey] = [Math.sin(C.az), Math.cos(C.az)], dk = (p) => { const [x, y] = W(p.s, p.kind === "kick" ? 0 : p.t); return x * ex + y * ey; }, d0 = dk(PARTS[3]) + 0.01; PARTS.map((p) => [p.name.startsWith("tom") ? Math.max(dk(p), d0) : dk(p), p.el.g]).sort((a, b) => a[0] - b[0]).forEach((m) => kit.appendChild(m[1])); };
  build(), order();
  // Turning (rule 08): a hold off the kit drags the view; springs carry the turn and tilt to where the pointer puts them.
  const yaw = spring(C.az), tilt = spring(C.k);
  let spin = 0; // the turn's last speed: a change in it rocks the cymbals on their stands, the farther from the axis the more
  let mark = [PARTS[2].el.sil]; // at rest the snare's edge is the one bright mark (a hi-hat lights both plates)
  mark[0].classList.add("hi");
  // Ripples: a strike sends a ring out from the head's centre, in its plane, fading over 600ms.
  const rips = [], shakes = [];
  // Floaters: a struck drum lifts copies of its band shapes off the shell, standing and spinning; a cymbal throws flat circles. They drift, swell and fade.
  const SHAPES = [circ(1, 24)], floats = [], rnd = (a, b) => a + Math.random() * (b - a);
  const NOTE = [circ(1, 12).map((q) => ({ u: q.u * 0.45 - 0.05, v: q.v * 0.32 + 0.6 })), [{ u: 0.3, v: 0.55 }, { u: 0.4, v: 0.55 }, { u: 0.4, v: -1 }, { u: 0.3, v: -1 }], [{ u: 0.4, v: -1 }, { u: 0.85, v: -0.55 }, { u: 0.8, v: -0.3 }, { u: 0.4, v: -0.65 }]]; // an eighth note: head, stem, flag
  const toss = (p) => { for (let n = 2 + Math.floor(rnd(0, 3)); n > 0; n--) { const cym = p.kind === "cym", up = cym ? [] : p.bp.filter((q) => q.on), d = cym ? null : up[Math.floor(rnd(0, up.length))], [x, y, z] = cym ? [...W(p.s + rnd(-2, 2), p.t + rnd(-2, 2)), p.z + 1] : p.bw(0, d.b);
    floats.push({ up: !cym, shape: [cym ? SHAPES[0] : [...Array(BS[d.k][0])].map((_, j) => { const [r, t] = br(BS[d.k], j); return { u: r * Math.cos(t), v: -r * Math.sin(t) }; })], x, y, z: cym ? z : z - d.h, t0: -1, wait: rnd(0, 260), life: rnd(1100, 1900), dx: rnd(-14, 14), dy: rnd(-5, 5), rise: rnd(14, 30), s: cym ? rnd(1.3, 2.6) : d.h * rnd(1, 1.4), spin: rnd(-5, 5), el: mk("path", { class: "sil nf", style: "stroke:#333" }, svg) }); }
    if (p.kind !== "cym") for (let n = 1 + Math.floor(rnd(0, 2)); n > 0; n--) floats.push({ up: true, shape: NOTE, x: W(p.s, p.kind === "kick" ? kt(p) : p.t)[0], y: W(p.s, p.kind === "kick" ? kt(p) : p.t)[1], z: p.kind === "kick" ? p.z : p.z1, t0: -1, wait: rnd(0, 200), life: rnd(1200, 2000), dx: rnd(-10, 10), dy: rnd(-4, 4), rise: rnd(18, 32), s: rnd(0.9, 1.3), spin: rnd(-3, 3), el: mk("path", { class: "dot m", style: "fill:#333" }, svg) }); }; // and the head sends up a note or two
  bag.add(() => floats.splice(0).forEach((f) => f.el.remove()));
  const loop = register(stage, (dt, now) => {
    for (let i = shakes.length - 1; i >= 0; i--) if (now >= shakes[i].at) (shakes[i].q.sp.v += shakes[i].v), (shakes[i].q.jo.v += shakes[i].j), shakes.splice(i, 1);
    let moving = (stepS(yaw, dt) | stepS(tilt, dt)) > 0 || rips.length > 0 || shakes.length > 0 || floats.length > 0;
    if (yaw.x !== C.az || tilt.x !== C.k) (C.az = yaw.x), (C.k = tilt.x), look(), build(), PARTS.forEach((p) => draw(p, p.sp.x)), order();
    for (let i = floats.length - 1; i >= 0; i--) {
      const f = floats[i], q = (now - (f.t0 < 0 ? (f.t0 = now + f.wait) : f.t0)) / f.life, e = 1 - (1 - Math.max(0, q)) ** 3, a = f.spin * e, c = Math.cos(a), sn = Math.sin(a), sz = f.s * (1 + 1.6 * e);
      if (q >= 1) { f.el.remove(), floats.splice(i, 1); continue; } else if (q < 0) continue;
      const X = f.x + f.dx * e + 1.5 * Math.sin(q * 9), Y = f.y + f.dy * e, Z = f.z + f.rise * e;
      f.el.setAttribute("d", f.shape.map((r) => poly(r.map((o) => (f.up ? P(X + o.u * sz * c, Y + o.u * sz * sn, Z + (1 - o.v) * sz) : P(X + (o.u * c - o.v * sn) * sz, Y + (o.u * sn + o.v * c) * sz, Z))))).join("")), (f.el.style.opacity = String((1 - q) * (1 - 0.6 * e))) /* fades harder as it swells */;
    }
    const dw = yaw.v - spin; spin = yaw.v;
    if (dw) for (const p of PARTS) if (p.kind === "cym") p.sp.v -= dw * (p.s < 0 ? -1 : 1) * (0.25 * Math.abs(p.s) + 3);
    for (const p of PARTS) if (stepS(p.sp, dt) | (p.sp.x !== p.drawn && (draw(p, p.sp.x), 0))) moving = true;
    // Each body trembles with its own hit, and is thrown off by a blast from another: pushed away from it, tipped, and sprung back.
    for (const p of PARTS) { if (stepS(p.jo, dt)) moving = true; const a = Math.min(1, Math.abs(p.sp.x) / 3), j = p.jo.x, t = now / 16, c = P(...W(p.s, p.t), p.z ?? p.z1), tf = Math.abs(j) + a > 0.01 ? `translate(${(p.jd[0] * j * 7 + a * 1.6 * Math.sin(t)).toFixed(2)} ${(p.jd[1] * j * 7 + a * 0.9 * Math.cos(t * 1.3)).toFixed(2)}) rotate(${(j * 5 * (p.jd[0] < 0 ? -1 : 1)).toFixed(2)} ${c[0].toFixed(1)} ${c[1].toFixed(1)})` : ""; if (tf !== p.tf) { p.tf = tf; for (const n of p.el.g.children) if (n !== p.pb && !(p.fl || []).includes(n)) n.setAttribute("transform", tf); } } // the piece shakes; its stand and legs stay put
    for (let i = rips.length - 1; i >= 0; i--) {
      const w = rips[i], p = w.p, q = (now - (w.t0 < 0 ? (w.t0 = now + w.d) : w.t0)) / 600, R = 0.3 + p.r * (w.big ? (p.kind === "cym" ? 2.8 : 2) : 0.9) * (1 - (1 - Math.min(Math.max(q, 0), 1)) ** 3);
      if (q >= 1) { w.el.remove(), rips.splice(i, 1); continue; }
      const [x, y] = W(p.s, p.t), tl = p.kind === "cym" ? p.tilt + Math.max(-4, Math.min(4, p.sp.x)) : 0, zc = p.kind === "drum" ? p.z1 - 0.15 - Math.min(0.5, Math.max(0, -p.sp.x) * 0.25) : p.z + (p.hat ? 1.8 : 0) + 0.5; // in the head's own plane, from its centre
      w.el.setAttribute("d", p.kind === "kick" ? poly(head(p, kt(p, 0.1), R)) : poly(circ(R, 32).map((c) => P(x + c.u, y + c.v, zc + tl * ((c.u + c.v) * R2) / p.r))));
      w.el.style.opacity = String(q < 0 ? 0 : 1 - q);
    }
    return moving;
  });
  bag.add(() => rips.splice(0).forEach((w) => w.el.remove()));
  bag.add(loop.unregister);

  // Hit test on the rest pose (rule 01): each piece's own resting top, nearest to its middle wins.
  function pick(sx, sy) { let best = -1, score = 1.05;
    PARTS.forEach((p, i) => {
      const c = P(...W(p.s, kt(p)), p.z), [x, y] = unproj(C, sx, sy, p.kind === "drum" ? p.z1 : p.z), [cx, cy] = W(p.s, p.t);
      const d = p.kind === "kick" ? Math.hypot(sx - c[0], sy - c[1]) / (p.r * C.S) : Math.hypot(x - cx, y - cy) / (p.r + 1);
      if (d <= score) (score = d), (best = i);
    }); return best;
  }
  function choose(i) { if (i === chosen) return;
    chosen = i, mark.forEach((m) => m.classList.remove("hi")), (mark = [PARTS[i < 0 ? 2 : i].el.sil, PARTS[i < 0 ? 2 : i].top].filter(Boolean)).forEach((m) => m.classList.add("hi")), (read.textContent = i < 0 ? "rest" : PARTS[i].name);
  }

  // Sound: each piece is synthesised; the first press unlocks the browser's audio.
  let ac = null, noise = null, bus = null;
  const unlock = () => (ac = ac || new (window.AudioContext || window.webkitAudioContext)()).resume();
  function voice(p) {
    if (!ac) return; if (!bus) (bus = ac.createDynamicsCompressor()).connect(ac.destination); // one glue compressor keeps hits loud, not clipped
    const t = ac.currentTime + 0.005, out = ac.createGain(), g = Math.min(force, 1.6) * 0.9;
    out.connect(bus), out.gain.setValueAtTime(g, t);
    const tone = (f0, f1, len) => { const o = ac.createOscillator(), e = ac.createGain(); o.frequency.setValueAtTime(f0, t), o.frequency.exponentialRampToValueAtTime(f1, t + len * 0.6), e.gain.setValueAtTime(1, t), e.gain.exponentialRampToValueAtTime(0.001, t + len), o.connect(e).connect(out), o.start(t), o.stop(t + len); };
    const hiss = (type, f, len, lvl = 0.8) => {
      if (!noise) { noise = ac.createBuffer(1, ac.sampleRate, ac.sampleRate); const d = noise.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
      const s = ac.createBufferSource(), fl = ac.createBiquadFilter(), e = ac.createGain();
      s.buffer = noise, fl.type = type, fl.frequency.value = f, e.gain.setValueAtTime(lvl, t), e.gain.exponentialRampToValueAtTime(0.001, t + len), s.connect(fl).connect(e).connect(out), s.start(t), s.stop(t + len);
    };
    // Metal: six square waves at inharmonic ratios (the classic drum-machine cymbal), high-passed.
    const metal = (len, lvl, f = 7000) => {
      const hp = ac.createBiquadFilter(), e = ac.createGain();
      hp.type = "highpass", hp.frequency.value = f, e.gain.setValueAtTime(lvl, t), e.gain.exponentialRampToValueAtTime(0.001, t + len), hp.connect(e).connect(out);
      for (const r of [2, 3, 4.16, 5.43, 6.79, 8.21]) { const o = ac.createOscillator(); o.type = "square", o.frequency.value = 40 * r * 2.2; o.connect(hp), o.start(t), o.stop(t + len); }
    };
    ({
      kick: () => (tone(160, 45, 0.5), hiss("lowpass", 3000, 0.02, 0.6)), snare: () => (tone(220, 170, 0.14), hiss("highpass", 1500, 0.25, 1)),
      "tom 1": () => (tone(260, 180, 0.4), hiss("lowpass", 2500, 0.04, 0.3)), "tom 2": () => (tone(200, 140, 0.45), hiss("lowpass", 2200, 0.04, 0.3)),
      "floor tom": () => (tone(130, 85, 0.6), hiss("lowpass", 1800, 0.05, 0.3)), "hi-hat": () => (metal(0.08, 0.5), hiss("highpass", 8000, 0.06, 0.4)),
      crash: () => (metal(1.8, 0.35, 5000), hiss("highpass", 4500, 1.8, 0.7)), "crash 2": () => (metal(1.6, 0.35, 5600), hiss("highpass", 5200, 1.5, 0.7)), ride: () => (metal(1.2, 0.4, 6000), tone(560, 540, 0.9)),
    })[p.name]();
  }
  bag.add(() => ac && ac.close());

  function strike(i) {
    if (i < 0) return; const p = PARTS[i];
    p.sp.v += (p.kind === "cym" ? 46 : -70) * Math.min(force, 1.6); // a head is pushed in; a cymbal is knocked over
    // Sympathy: every other piece shivers a little, later and weaker the farther it stands (rule 02).
    for (const q of PARTS) if (q !== p) { const d = Math.hypot(q.s - p.s, q.t - p.t), A = P(...W(p.s, p.t), p.z ?? p.z1), B = P(...W(q.s, q.t), q.z ?? q.z1), m = Math.hypot(B[0] - A[0], B[1] - A[1]) || 1, f = Math.min(force, 1.6) * Math.max(0.25, 1 - d / 50); q.jd = [(B[0] - A[0]) / m, (B[1] - A[1]) / m]; shakes.push({ q, at: performance.now() + d * 9, v: (q.kind === "cym" ? 46 : -70) * f * 0.3, j: 30 * f }); } // the blast: away from the struck piece
    voice(p); for (const d of [0, 120, 240, -1]) rips.push({ p, d: Math.max(d, 0), big: d < 0, t0: -1, el: mk("path", p.kind === "cym" || d < 0 ? { class: "nf sil" } : { class: "nf sil", style: "stroke:#fff" }, svg) }); // drops ring out on the head (white on a dark drum head, dark on a cymbal); every piece also sends one wide dark ring past its edge
    if (p.bp) { const vs = p.bp.filter((d) => !p.vis || p.vis(d.b)); p.bp.forEach((d) => (d.on = vs.includes(d) && Math.random() < 0.35 ? rnd(0.6, 1) : 0)); vs[Math.floor(rnd(0, vs.length))].on ||= 1; } toss(p), loop.wake();
  }

  const turn = ([x, y], e) => { if (!(e && e.buttons & 1)) return (drag = null); (yaw.t = drag.az - (x - drag.x) * 0.012), (tilt.t = Math.max(KS[0], Math.min(KS[1], drag.k + (y - drag.y) * 0.004))), loop.wake(); return 1; };
  bag.add(pointer(stage, { move: ([x, y], e) => { if (drag && turn([x, y], e)) return; const i = pick(x, y), was = chosen; held = !!(e && e.buttons & 1); choose(i); if (held && i !== was) strike(i); },
    down: ([x, y]) => { unlock(); const i = pick(x, y); if (i < 0) return (drag = { x, y, az: yaw.t, k: tilt.t }), choose(-1), (read.textContent = "turn"); held = true; choose(i); strike(i); }, leave: () => { held = false; drag = null; choose(-1); } }));
  bag.add(() => svg.replaceChildren());
  read.textContent = "rest";

  return { set(v) { force = v; }, destroy: bag.dispose };
}

hairline({
  name: "drums",
  means: "A drum kit: the piece under the pointer is named, a press strikes it so a head gives or a cymbal rings, and a drag off it turns the kit.",
  rules: [1, 4, 5, 6, 8, 9, 10],
  range: [0.6, 1, 1.6],
  tour: [[155, 161], [268, 187], [152, 103], null],
  mount,
});
};
