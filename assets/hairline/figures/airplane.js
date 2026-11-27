(window.__HL_FIGURES__ = window.__HL_FIGURES__ || {})["airplane"] = () => {

const { clamp, disposer, fillet, hull, mk, pointer, poly, reducedMotion, register, spring, stepS, tdone, tset, tval, tween } = HL;
function mount({ stage, svg, read }, value) {
  const bag = disposer(), layer = mk("g", {}, svg), parts = [], touchAction = stage.style.touchAction; stage.style.touchAction = "none"; bag.add(() => { stage.style.touchAction = touchAction; });
  const yaw = spring(-.78), pitch = spring(.72), rpm = tween(0);
  /* Turns a second at the slider's middle.  The tween carries radians a second, and at
     the rate it used to carry - one turn - the blades crawled round like a fan left on
     by mistake: an engine at cruise reads as a blur and at the stand as a brisk tick,
     never as a lazy sweep.  The wash takes the same factor: the wisps and the swirl are
     the blade's own air, and a slipstream that dawdles past a propeller turning at speed
     reads as two drawings laid over each other rather than as one machine working. */
  const PROP_REV = 2.5;
  /* How far round the hub one cuff of thrown air reaches, at the top of its puff.  It was
     three quarters of a turn, so the two cuffs met round the back of the nose and closed
     into a ring - a halo, not a wash.  Shortened to a little over a third of a turn each,
     they read as two strokes the propeller has flung off, clear of the blade disc. */
  const WASH_ARC = .85;
  let over = false, angle = 0, speed = value, last = "", airflowOn = false, windPhase = 0, drag = null;
  const ring = (x, ry, rz, z = 0) => Array.from({ length: 32 }, (_, i) => { const a = i * Math.PI / 16; return [x, Math.cos(a) * ry, z + Math.sin(a) * rz]; });
  const add = (sections, crease = [], rotor = false, hub = false) => {
    const points = sections.flat(), faces = [], n = sections[0].length;
    for (let k = 0; k < sections.length - 1; k++) for (let i = 0; i < n; i++) {
      const a = k * n + i, b = k * n + (i + 1) % n; faces.push([a, b, b + n], [a, b + n, a + n]);
    }
    for (const offset of [0, points.length - n]) for (let i = 1; i < n - 1; i++) faces.push([offset, offset + i, offset + i + 1]);
    const center = [0, 1, 2].map((axis) => points.reduce((sum, q) => sum + q[axis], 0) / points.length);
    for (const face of faces) {
      const [a, b, c] = face.map((i) => points[i]), u = b.map((v, i) => v - a[i]), v = c.map((w, i) => w - a[i]), normal = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
      if (normal.reduce((sum, w, i) => sum + w * ((a[i] + b[i] + c[i]) / 3 - center[i]), 0) < 0) [face[1], face[2]] = [face[2], face[1]];
    }
    const g = mk("g", {}, layer), ground = mk("path", { class: "fo" }, layer), sil = mk("path", { class: hub ? "sil hi nf" : "sil nf" }, g);
    const cr = mk("path", { class: "sil nf" }, g), p = { g, ground, sil, cr, points, faces, crease, rotor, hub }; parts.push(p); return p;
  };
  const stations = [[-86, 15, 16], [-72, 21, 22], [-42, 22, 23], [16, 17, 18], [68, 8, 9], [104, 3, 4]];
  const radius = (x, axis) => {
    const i = Math.min(stations.length - 2, Math.max(0, stations.findIndex((s) => s[0] >= x) - 1));
    const a = stations[i], b = stations[i + 1], h = b[0] - a[0], t = clamp((x - a[0]) / h, 0, 1);
    const slope = (j) => { const prev = stations[Math.max(0, j - 1)], next = stations[Math.min(5, j + 1)]; return j === 2 ? 0 : (next[axis] - prev[axis]) / (next[0] - prev[0]); };
    return (2 * t ** 3 - 3 * t ** 2 + 1) * a[axis] + (t ** 3 - 2 * t ** 2 + t) * h * slope(i) + (-2 * t ** 3 + 3 * t ** 2) * b[axis] + (t ** 3 - t ** 2) * h * slope(i + 1);
  };
  const body = add(stations.slice(0, -1).flatMap((s, i) => Array.from({ length: 3 }, (_, j) => {
    const x = s[0] + (stations[i + 1][0] - s[0]) * j / 3; return ring(x, radius(x, 1), radius(x, 2));
  })).concat([ring(104, 3, 4)]));
  body.seams = [-1, 1].flatMap((side) => [Array.from({ length: 33 }, (_, i) => { const x = 4 + i * 1.75; return [x, side * radius(x, 1) * Math.cos(.28), radius(x, 2) * Math.sin(.28)]; }), ...[-64, -58, -52].map((x) => Array.from({ length: 9 }, (_, i) => { const a = .05 + i * .045; return [x, side * radius(x, 1) * Math.cos(a), radius(x, 2) * Math.sin(a)]; }))]);
  const cowl = add([ring(-87, 15, 16), ring(-72, 21, 22)]);
  cowl.seams = [-87, -72].map((x, i) => { const loop = ring(x, i ? 21 : 15, i ? 22 : 16); return [...loop, loop[0]]; });
  const plate = (outline, z, crease) => {
    const rounded = fillet(outline, outline.map(() => 3), 4);
    return add([-1.3, 1.3].map((h) => rounded.map(([x, y]) => [x, y, z + h])), crease.map(([x, y]) => [x, y, z + 1.3]));
  };
  for (const side of [-1, 1]) {
    const wing = plate([[24, side * 10], [13, side * 146], [-9, side * 148], [-32, side * 16]], -5,
      [[-26, side * 22], [-7, side * 136], [-6, side * 139], [-4, side * 141], [0, side * 142], [8, side * 143]]);
    wing.join = mk("path", { class: "sil nf" }, wing.g);
    wing.roots = [-3.7, -6.3].map((z) => {
      const yAt = (x) => radius(x, 1) * Math.sqrt(1 - (z / radius(x, 2)) ** 2);
      const solve = (lo, hi, fn) => { for (let i = 0; i < 32; i++) { const mid = (lo + hi) / 2; if (fn(lo) * fn(mid) > 0) lo = mid; else hi = mid; } return (lo + hi) / 2; };
      const a = solve(-32, -24, (x) => x + 32 - 23 * (yAt(x) - 16) / 132), b = solve(16, 24, (x) => x - 24 + 11 * (yAt(x) - 10) / 136);
      return Array.from({ length: 49 }, (_, i) => { const x = a + (b - a) * i / 48; return [x, side * yAt(x), z]; });
    });
    plate([[72, side * 4], [82, side * 49], [99, side * 50], [103, side * 3]], -2,
      [[85, side * 12], [90, side * 45]]);
  }
  const fin = fillet([[65, 7], [89, 61], [105, 63], [100, 6]], [3, 3, 3, 3], 8);
  add([-1.5, 1.5].map((y) => fin.map(([x, z]) => [x, y, z])),
    [[76, 1.7, 10], [92, 1.7, 57], [101, 1.7, 59]]);
  const canopy = Array.from({ length: 13 }, (_, i) => { const a = .001 + i * (Math.PI - .002) / 12, r = Math.sin(a); return ring(-26 - 32 * Math.cos(a), 15 * r, 14 * r, 15); });
  const arch = Array.from({ length: 25 }, (_, i) => { const a = i * Math.PI / 24; return [-19, 14.64 * Math.cos(a), 15 + 13.66 * Math.sin(a)]; });
  const cabin = add(canopy, arch);
  const glass = mk("path", { style: "fill:black;stroke:none", "data-glass": "black" }, layer), shine = mk("path", { style: "fill:white;stroke:none", "data-glass": "reflection" }, layer);
  const glint = Array.from({ length: 25 }, (_, i) => { const a = i * Math.PI / 12, x = -37 + 4 * Math.cos(a), y = 4 + 2 * Math.sin(a); return [x, y, 15 + 14 * Math.sqrt(1 - ((x + 26) / 32) ** 2 - (y / 15) ** 2)]; });
  const bisect = (lo, hi, fn) => { for (let i = 0; i < 40; i++) { const mid = (lo + hi) / 2; if (fn(lo) * fn(mid) > 0) lo = mid; else hi = mid; } return (lo + hi) / 2; };
  const crown = (x) => 15 + 14 * Math.sqrt(Math.max(0, 1 - ((x + 26) / 32) ** 2)) - radius(x, 2);
  const front = bisect(-58, -26, crown), back = bisect(-26, 6, crown);
  cabin.seams = [Array.from({ length: 129 }, (_, i) => {
    const a = i * Math.PI / 64, x = (front + back) / 2 + (back - front) / 2 * Math.cos(a);
    const r = Math.sqrt(1 - ((x + 26) / 32) ** 2), ry = radius(x, 1), rz = radius(x, 2);
    const z = bisect(0, rz, (h) => ry ** 2 * (1 - (h / rz) ** 2) / (15 * r) ** 2 + ((h - 15) / (14 * r)) ** 2 - 1);
    return [x, Math.sign(Math.sin(a)) * ry * Math.sqrt(Math.max(0, 1 - (z / rz) ** 2)), z];
  })];
  for (let i = 0; i < 3; i++) {
    const a = (-132 + i * 120) * Math.PI / 180;
    const points = Array.from({ length: 48 }, (_, j) => {
      const t = j * Math.PI / 24, u = 19.5 + 16.5 * Math.cos(t), v = (4.5 + 2 * Math.cos(t)) * Math.sin(t);
      return [-90, u * Math.cos(a) - v * Math.sin(a), u * Math.sin(a) + v * Math.cos(a)];
    });
    add([points.map(([x, y, z]) => [x - .4, y, z]), points.map(([x, y, z]) => [x + .4, y, z])], [], true);
  }
  const hub = add([ring(-96, 4, 4), ring(-91, 7, 7)], [], false, true);
  const noseCover = mk("path", { style: "fill:var(--ground);stroke:none" }, layer), hubBlack = mk("path", { style: "fill:black;stroke:none", "data-hub": "black" }, layer);
  hub.sil.setAttribute("style", "stroke:white"); hub.cr.setAttribute("style", "stroke:white");
  hub.seams = [-96, -91].map((x, i) => { const loop = ring(x, i ? 7 : 4, i ? 7 : 4); return [...loop, loop[0]]; });
  const wind = mk("path", { class: "sil nf", "data-wind": "propeller-plane" }, layer), gusts = mk("path", { class: "sil nf", "data-airflow": "fuselage" }, layer);
  const transform = ([x, y, z], spin = false) => {
    if (spin) {
      const c = Math.cos(angle), s = Math.sin(angle); [y, z] = [y * c - z * s, y * s + z * c];
    }
    const c = Math.cos(yaw.x), s = Math.sin(yaw.x), u = x * c - y * s, v = x * s + y * c;
    const cp = Math.cos(pitch.x), sp = Math.sin(pitch.x);
    return [200 + u, 166 + v * sp - z * cp, v * cp + z * sp];
  };
  const cabinSpan = (a, b, seam) => {
    const facing = ([x, y, z]) => {
      const normals = [[(x + 26) / 1024, y / 225, (z - 15) / 196]];
      if (seam) {
        const ry = radius(x, 1), rz = radius(x, 2), dy = (radius(x + .001, 1) - radius(x - .001, 1)) / .002, dz = (radius(x + .001, 2) - radius(x - .001, 2)) / .002;
        normals.push([-dy * y * y / ry ** 3 - dz * z * z / rz ** 3, y / ry ** 2, z / rz ** 2]);
      }
      return normals.map(([nx, ny, nz]) => Math.cos(pitch.x) * (Math.sin(yaw.x) * nx + Math.cos(yaw.x) * ny) + Math.sin(pitch.x) * nz);
    };
    const fa = facing(a), fb = facing(b); let lo = 0, hi = 1;
    for (let i = 0; i < fa.length; i++) {
      if (fa[i] < 0 && fb[i] < 0) return [];
      if (fa[i] < 0) lo = Math.max(lo, fa[i] / (fa[i] - fb[i])); else if (fb[i] < 0) hi = Math.min(hi, fa[i] / (fa[i] - fb[i]));
    }
    return lo < hi ? [[lo, hi]] : [];
  };
  const weights = (t, p) => {
    const u = ((t.b[1] - t.c[1]) * (p[0] - t.c[0]) + (t.c[0] - t.b[0]) * (p[1] - t.c[1])) / t.det, v = ((t.c[1] - t.a[1]) * (p[0] - t.c[0]) + (t.a[0] - t.c[0]) * (p[1] - t.c[1])) / t.det;
    return [u, v, 1 - u - v, u * t.a[2] + v * t.b[2] + (1 - u - v) * t.c[2] - p[2] - .03];
  };
  const visible = (a, b, triangles, spans = [[0, 1]]) => {
    for (const t of triangles) {
      if (Math.max(a[0], b[0]) < t.minX || Math.min(a[0], b[0]) > t.maxX || Math.max(a[1], b[1]) < t.minY || Math.min(a[1], b[1]) > t.maxY) continue;
      const wa = weights(t, a), wb = weights(t, b); let lo = 0, hi = 1;
      for (let i = 0; i < 4 && lo < hi; i++) {
        if (wa[i] < 0 && wb[i] < 0) { hi = -1; break; }
        if (wa[i] < 0) lo = Math.max(lo, wa[i] / (wa[i] - wb[i]));
        else if (wb[i] < 0) hi = Math.min(hi, wa[i] / (wa[i] - wb[i]));
      }
      if (hi <= lo) continue;
      spans = spans.flatMap(([s, e]) => hi <= s || lo >= e ? [[s, e]] : [...(s < lo ? [[s, lo]] : []), ...(e > hi ? [[hi, e]] : [])]);
      if (!spans.length) break;
    }
    const at = (t) => `${a[0] + (b[0] - a[0]) * t},${a[1] + (b[1] - a[1]) * t}`;
    return spans.filter(([s, e]) => e - s > .0001).map(([s, e]) => `M${at(s)}L${at(e)}`).join("");
  };
  const paint = (face, occluders) => {
    let pieces = [face]; const minX = Math.min(...face.map((q) => q[0])), maxX = Math.max(...face.map((q) => q[0])), minY = Math.min(...face.map((q) => q[1])), maxY = Math.max(...face.map((q) => q[1])), minDepth = Math.min(...face.map((q) => q[2]));
    for (const t of occluders) {
      if (!pieces.length) break;
      if (maxX < t.minX || minX > t.maxX || maxY < t.minY || minY > t.maxY || minDepth >= t.maxDepth - .03) continue;
      const split = (polygon, axis, sign) => {
        const out = [];
        for (let i = 0; i < polygon.length; i++) {
          const a = polygon[i], b = polygon[(i + 1) % polygon.length], da = weights(t, a)[axis] * sign - (sign < 0 ? 1e-8 : 0), db = weights(t, b)[axis] * sign - (sign < 0 ? 1e-8 : 0);
          if (da >= 0) out.push(a);
          if ((da < 0) !== (db < 0)) out.push(a.map((v, j) => v + (b[j] - v) * da / (da - db)));
        }
        return Math.abs(out.reduce((sum, q, i) => sum + q[0] * out[(i + 1) % out.length][1] - q[1] * out[(i + 1) % out.length][0], 0)) > 1e-6 ? out : [];
      };
      pieces = pieces.flatMap((piece) => { const w = piece.map((q) => weights(t, q)); if ([0, 1, 2, 3].some((i) => w.every((q) => q[i] < 0))) return [piece]; if (w.every((q) => q.every((v) => v >= 0))) return []; let inside = piece; const outside = [];
        for (let i = 0; i < 4 && inside.length > 2; i++) { const part = split(inside, i, -1); if (part.length > 2) outside.push(part); inside = split(inside, i, 1); } return outside; });
    }
    return pieces.map((piece) => poly(piece)).join("");
  };
  const bounds = (points) => [Math.min(...points.map((q) => q[0])), Math.max(...points.map((q) => q[0])), Math.min(...points.map((q) => q[1])), Math.max(...points.map((q) => q[1]))], overlap = (a, b) => a[0] <= b[1] && a[1] >= b[0] && a[2] <= b[3] && a[3] >= b[2];
  const draw = () => {
    const viewKey = `${yaw.x},${pitch.x},${over}`, key = `${viewKey},${angle},${airflowOn},${windPhase}`; if (key === last) return; last = key;
    const triangles = [];
    for (const p of parts) {
      p.projected = p.points.map((q) => transform(q, p.rotor));
      for (const face of p.faces) {
        const [a, b, c] = face.map((i) => p.projected[i]);
        const det = (b[1] - c[1]) * (a[0] - c[0]) + (c[0] - b[0]) * (a[1] - c[1]);
        if (Math.abs(det) > .00001) triangles.push({ a, b, c, det, owner: p, noseCap: p === cowl && face.every((i) => p.points[i][0] === -87), maxDepth: Math.max(a[2], b[2], c[2]), minX: Math.min(a[0], b[0], c[0]), maxX: Math.max(a[0], b[0], c[0]), minY: Math.min(a[1], b[1], c[1]), maxY: Math.max(a[1], b[1], c[1]) });
      }
    }
    const rotorBounds = bounds(ring(-90, 38, 38).map((q) => transform(q)));
    for (const p of parts) {
      p.bounds = bounds(p.projected); if (p.drawView === viewKey && !p.rotor && !overlap(p.bounds, rotorBounds)) continue; p.drawView = viewKey; const outline = hull(p.projected); p.ground.setAttribute("d", poly(outline)); layer.append(p.ground);
      p.sil.setAttribute("d", outline.map((a, i) => visible(a, outline[(i + 1) % outline.length], triangles)).join(""));
      p.cr.setAttribute("d", [p.crease, ...(p.seams || [])].map((line, index) => {
        const crease = line.map((q) => transform(q));
        const occluders = p === cabin ? triangles.filter((t) => t.owner !== cabin && (index === 0 || t.owner !== body)) : triangles;
        return crease.slice(1).map((b, i) => visible(crease[i], b, occluders, p === cabin ? cabinSpan(line[i], line[i + 1], index > 0) : [[0, 1]])).join("");
      }).join(""));
      if (p.join) p.join.setAttribute("d", p.roots.map((line) => { const q = line.map((v) => transform(v)); return q.slice(1).map((b, i) => visible(q[i], b, triangles)).join(""); }).join(""));
      p.sil.setAttribute("class", over || p.hub ? "sil hi nf" : "sil nf");
    }
    const frontFaces = triangles.filter((t) => t.det > 0), occluders = new Map([cabin, cowl, hub].map((p) => [p, frontFaces.filter((t) => t.owner !== p)])); if (cabin.glassView !== viewKey || overlap(cabin.bounds, rotorBounds)) { glass.setAttribute("d", frontFaces.filter((t) => t.owner === cabin).map((t) => paint([t.a, t.b, t.c], occluders.get(cabin))).join(""));
    const reflection = glint.map((q) => transform(q));
    shine.setAttribute("d", reflection.slice(1, -1).map((q, i) => paint([reflection[0], q, reflection[i + 2]], frontFaces)).join("")); cabin.glassView = viewKey; }
    noseCover.setAttribute("d", frontFaces.filter((t) => t.noseCap).map((t) => paint([t.a, t.b, t.c], occluders.get(cowl))).join(""));
    hubBlack.setAttribute("d", frontFaces.filter((t) => t.owner === hub).map((t) => paint([t.a, t.b, t.c], occluders.get(hub))).join(""));
    layer.append(glass, shine, noseCover, hubBlack); for (const p of parts) layer.append(p.g);
    wind.setAttribute("d", airflowOn && windPhase < Math.PI * 1.6 ? [30, 42].map((r) => { const q = Array.from({ length: 33 }, (_, i) => { const a = angle + r * .1 + i * Math.PI * WASH_ARC * Math.sin(windPhase / 1.6) / 32; return transform([-90, r * Math.cos(a), r * Math.sin(a)]); }); return q.slice(1).map((b, i) => visible(q[i], b, triangles)).join(""); }).join("") : "");
    gusts.setAttribute("d", airflowOn ? [.25, 1.15, 3.25].map((a, i) => { const phase = (windPhase / (Math.PI * 2) + i / 3) % 1; if (phase > .78) return ""; const q = Array.from({ length: 13 }, (_, j) => { const x = -72 + phase * 170 + j * 3.2 * Math.sin(Math.PI * phase / .78), t = clamp(x, -86, 104); return transform([x, (radius(t, 1) + 20) * Math.cos(a), (radius(t, 2) + 20) * Math.sin(a)]); }); return q.slice(1).map((b, j) => visible(q[j], b, triangles)).join(""); }).join("") : ""); layer.append(wind, gusts);
  };
  const loop = register(stage, (dt, now) => {
    const turning = stepS(yaw, dt) | stepS(pitch, dt), velocity = tval(rpm, now); airflowOn = !reducedMotion() && velocity > .02; if (airflowOn) windPhase = (windPhase + dt * velocity * .4 * PROP_REV) % (Math.PI * 2);
    if (!reducedMotion() && velocity > 0) angle = (angle + velocity * PROP_REV * dt) % (Math.PI * 2);
    draw(); return Boolean(turning) || (!reducedMotion() && (velocity > 0 || !tdone(rpm, now)));
  });
  bag.add(loop.unregister);
  const choose = (on) => { if (on === over) return; over = on; tset(rpm, on ? Math.PI * 2 * speed : 0, performance.now(), 0); read.textContent = on ? "airplane" : "rest"; };
  const leave = () => { drag = null; choose(false); loop.wake(); };
  bag.add(pointer(stage, {
    down: ([x, y], event) => { if (event && event.button > 0) return; drag = [x, y]; choose(true); if (event) stage.setPointerCapture?.(event.pointerId); loop.wake(); },
    move: ([x, y], event) => {
      if (drag && event && ((event.buttons & 1) || event.pointerType === "touch")) { yaw.t -= (x - drag[0]) * .02; pitch.t = clamp(pitch.t + (y - drag[1]) * .012, -1.4, 1.4); drag = [x, y]; choose(true); loop.wake(); return; }
      drag = null; if (x < 35 || x > 365 || y < 50 || y > 280) return leave();
      choose(true); loop.wake();
    },
    leave,
  }));
  draw(); bag.add(() => svg.replaceChildren()); read.textContent = "rest";
  return { set(v) { speed = v; if (over) tset(rpm, Math.PI * 2 * speed, performance.now(), 0); loop.wake(); }, destroy: bag.dispose };
}
hairline({
  name: "airplane", means: "Drag to rotate the airplane in the direction of your movement; release to keep the view. Hover to spin the propeller.",
  rules: [1, 3, 4, 6, 7, 8, 9, 10], range: [0.5, 1, 1.5], tour: [[200, 166], [275, 145], [130, 195], null], mount,
});
};
