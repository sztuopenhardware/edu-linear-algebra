/**
 * 《线性代数》交互式 3D 教学仿真实验平台 - WebGL + HiDPI 2D 科学可视化 3D 引擎
 * 零外部依赖，支持硬件 Z-Buffer Phong 光照、半透明深度排序平面裁剪、清晰数学标注与双主题切换
 */
(function (global) {
  'use strict';

  const M = global.LAMath;

  function parseColor(hexOrRgba, alphaOverride = null) {
    if (Array.isArray(hexOrRgba)) {
      return [
        hexOrRgba[0],
        hexOrRgba[1],
        hexOrRgba[2],
        alphaOverride !== null ? alphaOverride : (hexOrRgba[3] !== undefined ? hexOrRgba[3] : 1)
      ];
    }
    let str = String(hexOrRgba || '#38bdf8').trim();
    if (str.startsWith('#')) {
      if (str.length === 4) {
        str = '#' + str[1] + str[1] + str[2] + str[2] + str[3] + str[3];
      }
      const r = parseInt(str.slice(1, 3), 16) / 255;
      const g = parseInt(str.slice(3, 5), 16) / 255;
      const b = parseInt(str.slice(5, 7), 16) / 255;
      const a = str.length === 9 ? parseInt(str.slice(7, 9), 16) / 255 : 1;
      return [r, g, b, alphaOverride !== null ? alphaOverride : a];
    }
    const m = str.match(/rgba?\(([^)]+)\)/);
    if (m) {
      const parts = m[1].split(',').map(s => parseFloat(s.trim()));
      return [
        (parts[0] || 0) / 255,
        (parts[1] || 0) / 255,
        (parts[2] || 0) / 255,
        alphaOverride !== null ? alphaOverride : (parts[3] !== undefined ? parts[3] : 1)
      ];
    }
    return [0.22, 0.74, 0.97, alphaOverride !== null ? alphaOverride : 1];
  }

  function rgbaCss(c, alphaMul = 1) {
    const arr = parseColor(c);
    return `rgba(${Math.round(arr[0] * 255)}, ${Math.round(arr[1] * 255)}, ${Math.round(arr[2] * 255)}, ${(arr[3] * alphaMul).toFixed(3)})`;
  }

  // Column-major 4x4 matrix utilities
  function mat4Perspective(fovRad, aspect, near, far) {
    const f = 1.0 / Math.tan(fovRad / 2);
    const nf = 1 / (near - far);
    const out = new Float32Array(16);
    out[0] = f / aspect;
    out[5] = f;
    out[10] = (far + near) * nf;
    out[11] = -1;
    out[14] = 2 * far * near * nf;
    return out;
  }

  function mat4LookAt(eye, center, up) {
    let fx = center[0] - eye[0], fy = center[1] - eye[1], fz = center[2] - eye[2];
    let flen = Math.hypot(fx, fy, fz) || 1;
    fx /= flen; fy /= flen; fz /= flen;

    let sx = fy * up[2] - fz * up[1];
    let sy = fz * up[0] - fx * up[2];
    let sz = fx * up[1] - fy * up[0];
    let slen = Math.hypot(sx, sy, sz);
    if (slen < 1e-6) {
      sx = 1; sy = 0; sz = 0; slen = 1;
    }
    sx /= slen; sy /= slen; sz /= slen;

    const ux = sy * fz - sz * fy;
    const uy = sz * fx - sx * fz;
    const uz = sx * fy - sy * fx;

    const out = new Float32Array(16);
    out[0] = sx;  out[4] = sy;  out[8] = sz;   out[12] = -(sx * eye[0] + sy * eye[1] + sz * eye[2]);
    out[1] = ux;  out[5] = uy;  out[9] = uz;   out[13] = -(ux * eye[0] + uy * eye[1] + uz * eye[2]);
    out[2] = -fx; out[6] = -fy; out[10] = -fz; out[14] = (fx * eye[0] + fy * eye[1] + fz * eye[2]);
    out[3] = 0;   out[7] = 0;   out[11] = 0;   out[15] = 1;
    return out;
  }

  function mat4Mul(a, b) {
    const out = new Float32Array(16);
    for (let col = 0; col < 4; col++) {
      for (let row = 0; row < 4; row++) {
        out[col * 4 + row] =
          a[0 * 4 + row] * b[col * 4 + 0] +
          a[1 * 4 + row] * b[col * 4 + 1] +
          a[2 * 4 + row] * b[col * 4 + 2] +
          a[3 * 4 + row] * b[col * 4 + 3];
      }
    }
    return out;
  }

  // Orthonormal tangent basis perpendicular to unit vector d
  function orthoBasisFromDir(d) {
    const ref = Math.abs(d[2]) < 0.85 ? [0, 0, 1] : [1, 0, 0];
    const u = M.normalize(M.cross(d, ref));
    const v = M.normalize(M.cross(d, u));
    return [u, v];
  }

  // Clip infinite plane a*x + b*y + c*z = dVal against cube [-L, L]^3
  function clipPlaneToBox(normal, dVal, L = 3.8) {
    const nLen = M.norm(normal);
    if (nLen < 1e-8) return [];
    const n = [normal[0] / nLen, normal[1] / nLen, normal[2] / nLen];
    const d = dVal / nLen;

    const verts = [
      [-L, -L, -L], [L, -L, -L], [L, L, -L], [-L, L, -L],
      [-L, -L, L],  [L, -L, L],  [L, L, L],  [-L, L, L]
    ];
    const edges = [
      [0, 1], [1, 2], [2, 3], [3, 0],
      [4, 5], [5, 6], [6, 7], [7, 4],
      [0, 4], [1, 5], [2, 6], [3, 7]
    ];

    const pts = [];
    for (const [i0, i1] of edges) {
      const p0 = verts[i0], p1 = verts[i1];
      const f0 = M.dot(n, p0) - d;
      const f1 = M.dot(n, p1) - d;
      if (Math.abs(f0) < 1e-7 && Math.abs(f1) < 1e-7) {
        pts.push(p0.slice(), p1.slice());
      } else if (f0 * f1 <= 1e-9) {
        const denom = f0 - f1;
        if (Math.abs(denom) > 1e-9) {
          const t = f0 / denom;
          if (t >= -1e-6 && t <= 1 + 1e-6) {
            const tc = Math.max(0, Math.min(1, t));
            pts.push([
              p0[0] + tc * (p1[0] - p0[0]),
              p0[1] + tc * (p1[1] - p0[1]),
              p0[2] + tc * (p1[2] - p0[2])
            ]);
          }
        }
      }
    }

    // Deduplicate
    const unique = [];
    for (const p of pts) {
      if (!unique.some(q => Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]) < 1e-4)) {
        unique.push(p);
      }
    }
    if (unique.length < 3) return [];

    const centroid = [0, 0, 0];
    for (const p of unique) {
      centroid[0] += p[0]; centroid[1] += p[1]; centroid[2] += p[2];
    }
    centroid[0] /= unique.length; centroid[1] /= unique.length; centroid[2] /= unique.length;

    const [u, v] = orthoBasisFromDir(n);
    unique.sort((a, b) => {
      const da = [a[0] - centroid[0], a[1] - centroid[1], a[2] - centroid[2]];
      const db = [b[0] - centroid[0], b[1] - centroid[1], b[2] - centroid[2]];
      return Math.atan2(M.dot(da, v), M.dot(da, u)) - Math.atan2(M.dot(db, v), M.dot(db, u));
    });
    return unique;
  }

  // Clip infinite line p0 + t*dir against [-L, L]^3
  function clipLineToBox(p0, dir, L = 3.8) {
    const dLen = M.norm(dir);
    if (dLen < 1e-8) return null;
    const d = [dir[0] / dLen, dir[1] / dLen, dir[2] / dLen];
    let tMin = -1e9, tMax = 1e9;
    for (let axis = 0; axis < 3; axis++) {
      if (Math.abs(d[axis]) < 1e-9) {
        if (Math.abs(p0[axis]) > L + 1e-6) return null;
      } else {
        const t1 = (-L - p0[axis]) / d[axis];
        const t2 = (L - p0[axis]) / d[axis];
        tMin = Math.max(tMin, Math.min(t1, t2));
        tMax = Math.min(tMax, Math.max(t1, t2));
      }
    }
    if (tMax < tMin) return null;
    return [
      [p0[0] + tMin * d[0], p0[1] + tMin * d[1], p0[2] + tMin * d[2]],
      [p0[0] + tMax * d[0], p0[1] + tMax * d[1], p0[2] + tMax * d[2]]
    ];
  }

  // Compute intersection segment of two planes n1.x = d1 and n2.x = d2 inside [-L, L]^3
  function intersectTwoPlanesInBox(n1, d1, n2, d2, L = 3.8) {
    const dir = M.cross(n1, n2);
    const dirNormSq = M.dot(dir, dir);
    if (dirNormSq < 1e-8) return null;
    const a11 = M.dot(n1, n1), a12 = M.dot(n1, n2), a22 = M.dot(n2, n2);
    const detG = a11 * a22 - a12 * a12;
    if (Math.abs(detG) < 1e-9) return null;
    const alpha = (d1 * a22 - d2 * a12) / detG;
    const beta = (a11 * d2 - a12 * d1) / detG;
    const p0 = M.vecAdd(M.vecScale(n1, alpha), M.vecScale(n2, beta));
    return clipLineToBox(p0, dir, L);
  }

  class Scene3D {
    constructor(containerEl) {
      this.container = containerEl;
      this.glCanvas = document.createElement('canvas');
      this.glCanvas.className = 'viewport-gl-canvas';
      this.hudCanvas = document.createElement('canvas');
      this.hudCanvas.className = 'viewport-hud-canvas';
      this.container.innerHTML = '';
      this.container.appendChild(this.glCanvas);
      this.container.appendChild(this.hudCanvas);

      this.theme = 'dark';
      this.showBaseGrid = true;
      this.showAxes = true;
      this.axisRange = 4.0;
      this.autoRotate = false;

      // Right-handed spherical camera (Z is UP)
      this.camera = {
        azimuth: 0.72,    // ~41 deg in (+X, +Y) octant
        elevation: 0.46,  // ~26 deg above XY plane
        distance: 11.2,
        target: [0, 0, 0],
        fov: (40 * Math.PI) / 180
      };
      this.camTween = null;

      // Geometry buffers per scene build
      this.opaqueTris = [];     // { p0, p1, p2, n0, n1, n2, color, unlit }
      this.transTris = [];      // { p0, p1, p2, n0, n1, n2, color, unlit }
      this.lines3D = [];        // { p0, p1, color, width, dashed }
      this.labels2D = [];       // { pos, text, color, bg, offset, fontSize, bold, align }
      this.screenArcs = [];     // { center, uVec, vVec, radius, angleRad, color, label }
      this.pointSprites = [];   // { pos, radiusPx, color }

      this.customTickCallback = null;

      this._initWebGL();
      this._bindInteractions();
      this._resize();

      this._resizeObserver = new ResizeObserver(() => this._resize());
      this._resizeObserver.observe(this.container);

      this._lastTime = performance.now();
      this._rafId = null;
      this._loop = this._loop.bind(this);
      this._rafId = requestAnimationFrame(this._loop);
    }

    _initWebGL() {
      const opts = { alpha: false, antialias: true, depth: true, premultipliedAlpha: false };
      const gl = this.glCanvas.getContext('webgl2', opts) || this.glCanvas.getContext('webgl', opts);
      this.gl = gl;
      if (!gl) {
        this.useFallback2D = true;
        return;
      }
      this.useFallback2D = false;

      const vsTri = `
        attribute vec3 aPos;
        attribute vec3 aNorm;
        attribute vec4 aCol;
        attribute float aUnlit;
        uniform mat4 uVP;
        varying vec3 vNorm;
        varying vec3 vWorldPos;
        varying vec4 vCol;
        varying float vUnlit;
        void main() {
          vNorm = aNorm;
          vWorldPos = aPos;
          vCol = aCol;
          vUnlit = aUnlit;
          gl_Position = uVP * vec4(aPos, 1.0);
        }
      `;
      const fsTri = `
        precision mediump float;
        varying vec3 vNorm;
        varying vec3 vWorldPos;
        varying vec4 vCol;
        varying float vUnlit;
        uniform vec3 uCamPos;
        void main() {
          if (vUnlit > 0.5) {
            gl_FragColor = vCol;
            return;
          }
          vec3 N = normalize(vNorm);
          vec3 V = normalize(uCamPos - vWorldPos);
          // Two-sided lighting for surfaces and planes
          if (dot(N, V) < 0.0) N = -N;
          vec3 L1 = normalize(vec3(0.55, 0.38, 0.82));
          vec3 L2 = normalize(vec3(-0.62, -0.45, 0.35));
          float diff1 = max(dot(N, L1), 0.0);
          float diff2 = max(dot(N, L2), 0.0);
          vec3 H = normalize(L1 + V);
          float spec = pow(max(dot(N, H), 0.0), 36.0) * 0.28;
          float hemi = 0.42 + 0.12 * N.z;
          vec3 rgb = vCol.rgb * (hemi + 0.50 * diff1 + 0.20 * diff2) + vec3(spec * vCol.a);
          gl_FragColor = vec4(clamp(rgb, 0.0, 1.0), vCol.a);
        }
      `;

      this.triProg = this._compileProgram(gl, vsTri, fsTri);
      this.triLoc = {
        aPos: gl.getAttribLocation(this.triProg, 'aPos'),
        aNorm: gl.getAttribLocation(this.triProg, 'aNorm'),
        aCol: gl.getAttribLocation(this.triProg, 'aCol'),
        aUnlit: gl.getAttribLocation(this.triProg, 'aUnlit'),
        uVP: gl.getUniformLocation(this.triProg, 'uVP'),
        uCamPos: gl.getUniformLocation(this.triProg, 'uCamPos')
      };
      this.opaqueBuf = gl.createBuffer();
      this.transBuf = gl.createBuffer();
      this.opaqueDirty = true;
      this.opaqueVertCount = 0;
    }

    _compileProgram(gl, vsSrc, fsSrc) {
      const compile = (type, src) => {
        const s = gl.createShader(type);
        gl.shaderSource(s, src);
        gl.compileShader(s);
        return s;
      };
      const prog = gl.createProgram();
      gl.attachShader(prog, compile(gl.VERTEX_SHADER, vsSrc));
      gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, fsSrc));
      gl.linkProgram(prog);
      return prog;
    }

    _bindInteractions() {
      let dragging = false;
      let mode = 'orbit';
      let lastX = 0, lastY = 0;
      let pinchDist = 0;

      const el = this.hudCanvas;
      el.addEventListener('contextmenu', e => e.preventDefault());

      el.addEventListener('mousedown', e => {
        dragging = true;
        this.camTween = null;
        lastX = e.clientX;
        lastY = e.clientY;
        mode = (e.button === 2 || e.button === 1 || e.shiftKey) ? 'pan' : 'orbit';
      });

      window.addEventListener('mousemove', e => {
        if (!dragging) return;
        const dx = e.clientX - lastX;
        const dy = e.clientY - lastY;
        lastX = e.clientX;
        lastY = e.clientY;

        if (mode === 'orbit') {
          this.camera.azimuth -= dx * 0.0075;
          this.camera.elevation = Math.max(-1.48, Math.min(1.48, this.camera.elevation + dy * 0.0075));
        } else {
          const panScale = this.camera.distance * 0.0016;
          const az = this.camera.azimuth;
          const right = [-Math.sin(az), Math.cos(az), 0];
          const up = [0, 0, 1];
          this.camera.target[0] -= (dx * right[0]) * panScale;
          this.camera.target[1] -= (dx * right[1]) * panScale;
          this.camera.target[2] += (dy * up[2]) * panScale;
        }
      });

      window.addEventListener('mouseup', () => { dragging = false; });

      el.addEventListener('wheel', e => {
        e.preventDefault();
        this.camTween = null;
        const factor = Math.exp(e.deltaY * 0.0011);
        this.camera.distance = Math.max(3.2, Math.min(32, this.camera.distance * factor));
      }, { passive: false });

      el.addEventListener('dblclick', () => {
        this.setCameraPreset('iso');
      });

      // Touch support for tablets & phones
      el.addEventListener('touchstart', e => {
        this.camTween = null;
        if (e.touches.length === 1) {
          dragging = true;
          mode = 'orbit';
          lastX = e.touches[0].clientX;
          lastY = e.touches[0].clientY;
        } else if (e.touches.length === 2) {
          dragging = false;
          pinchDist = Math.hypot(
            e.touches[0].clientX - e.touches[1].clientX,
            e.touches[0].clientY - e.touches[1].clientY
          );
        }
      }, { passive: true });

      el.addEventListener('touchmove', e => {
        if (e.touches.length === 1 && dragging) {
          e.preventDefault();
          const dx = e.touches[0].clientX - lastX;
          const dy = e.touches[0].clientY - lastY;
          lastX = e.touches[0].clientX;
          lastY = e.touches[0].clientY;
          this.camera.azimuth -= dx * 0.008;
          this.camera.elevation = Math.max(-1.48, Math.min(1.48, this.camera.elevation + dy * 0.008));
        } else if (e.touches.length === 2 && pinchDist > 0) {
          e.preventDefault();
          const d = Math.hypot(
            e.touches[0].clientX - e.touches[1].clientX,
            e.touches[0].clientY - e.touches[1].clientY
          );
          if (d > 5) {
            this.camera.distance = Math.max(3.2, Math.min(32, this.camera.distance * (pinchDist / d)));
            pinchDist = d;
          }
        }
      }, { passive: false });

      el.addEventListener('touchend', () => { dragging = false; pinchDist = 0; });
    }

    setTheme(theme) {
      this.theme = theme === 'light' ? 'light' : 'dark';
    }

    setCameraPreset(preset) {
      const presets = {
        iso: { azimuth: 0.72, elevation: 0.46, distance: 11.2, target: [0, 0, 0] },
        xy:  { azimuth: -Math.PI / 2, elevation: 1.54, distance: 11.5, target: [0, 0, 0] },
        xz:  { azimuth: -Math.PI / 2, elevation: 0.02, distance: 11.5, target: [0, 0, 0] },
        yz:  { azimuth: 0.0, elevation: 0.02, distance: 11.5, target: [0, 0, 0] }
      };
      const dst = presets[preset] || presets.iso;
      this.camTween = {
        from: {
          azimuth: this.camera.azimuth,
          elevation: this.camera.elevation,
          distance: this.camera.distance,
          target: this.camera.target.slice()
        },
        to: dst,
        t: 0
      };
    }

    _resize() {
      const rect = this.container.getBoundingClientRect();
      const w = Math.max(100, Math.floor(rect.width));
      const h = Math.max(100, Math.floor(rect.height));
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      this.cssWidth = w;
      this.cssHeight = h;
      this.dpr = dpr;

      this.glCanvas.width = Math.floor(w * dpr);
      this.glCanvas.height = Math.floor(h * dpr);
      this.glCanvas.style.width = w + 'px';
      this.glCanvas.style.height = h + 'px';

      this.hudCanvas.width = Math.floor(w * dpr);
      this.hudCanvas.height = Math.floor(h * dpr);
      this.hudCanvas.style.width = w + 'px';
      this.hudCanvas.style.height = h + 'px';
    }

    clear() {
      this.opaqueTris = [];
      this.transTris = [];
      this.lines3D = [];
      this.labels2D = [];
      this.screenArcs = [];
      this.pointSprites = [];
      this.opaqueDirty = true;
      if (this.showBaseGrid) this._buildBaseGrid();
      if (this.showAxes) this._buildWorldAxes();
    }

    _buildBaseGrid() {
      const R = this.axisRange;
      const isLight = this.theme === 'light';
      const gridColor = isLight ? 'rgba(100, 116, 139, 0.22)' : 'rgba(148, 163, 184, 0.14)';
      const majorColor = isLight ? 'rgba(71, 85, 105, 0.35)' : 'rgba(148, 163, 184, 0.25)';
      for (let i = -R; i <= R; i++) {
        const col = i === 0 ? majorColor : gridColor;
        this.addLine([i, -R, 0], [i, R, 0], col, i === 0 ? 1.4 : 1.0);
        this.addLine([-R, i, 0], [R, i, 0], col, i === 0 ? 1.4 : 1.0);
      }
    }

    _buildWorldAxes() {
      const R = this.axisRange + 0.45;
      const isLight = this.theme === 'light';
      const cX = isLight ? '#dc2626' : '#f87171';
      const cY = isLight ? '#059669' : '#34d399';
      const cZ = isLight ? '#2563eb' : '#60a5fa';
      const negAlpha = isLight ? 0.35 : 0.30;

      this.addLine([-this.axisRange, 0, 0], [0, 0, 0], parseColor(cX, negAlpha), 1.2, true);
      this.addLine([0, -this.axisRange, 0], [0, 0, 0], parseColor(cY, negAlpha), 1.2, true);
      this.addLine([0, 0, -this.axisRange], [0, 0, 0], parseColor(cZ, negAlpha), 1.2, true);

      this.addArrow([0, 0, 0], [R, 0, 0], cX, { shaftRadius: 0.026, headRadius: 0.075, headLen: 0.22, label: 'X' });
      this.addArrow([0, 0, 0], [0, R, 0], cY, { shaftRadius: 0.026, headRadius: 0.075, headLen: 0.22, label: 'Y' });
      this.addArrow([0, 0, 0], [0, 0, R], cZ, { shaftRadius: 0.026, headRadius: 0.075, headLen: 0.22, label: 'Z' });

      // Subtle integer tick labels on positive axes
      const tickCol = isLight ? 'rgba(71,85,105,0.75)' : 'rgba(148,163,184,0.65)';
      for (let k = 1; k <= Math.floor(this.axisRange); k++) {
        if (k % 2 === 0) {
          this.addLabel([k, 0, -0.18], String(k), { color: tickCol, fontSize: 10, bg: false });
          this.addLabel([0, k, -0.18], String(k), { color: tickCol, fontSize: 10, bg: false });
          this.addLabel([0, -0.18, k], String(k), { color: tickCol, fontSize: 10, bg: false });
        }
      }
    }

    // ================= Low-level Triangle & Line Pushers =================
    addTriangle(p0, p1, p2, color, opts = {}) {
      const col = parseColor(color, opts.opacity !== undefined ? opts.opacity : null);
      let n = opts.normal;
      if (!n) {
        n = M.normalize(M.cross(M.vecSub(p1, p0), M.vecSub(p2, p0)));
      }
      const tri = {
        p0, p1, p2,
        n0: opts.n0 || n,
        n1: opts.n1 || n,
        n2: opts.n2 || n,
        color: col,
        unlit: opts.unlit ? 1 : 0
      };
      if (col[3] < 0.995) {
        this.transTris.push(tri);
      } else {
        this.opaqueTris.push(tri);
        this.opaqueDirty = true;
      }
    }

    addQuad(p0, p1, p2, p3, color, opts = {}) {
      this.addTriangle(p0, p1, p2, color, opts);
      this.addTriangle(p0, p2, p3, color, opts);
    }

    addPolygon(verts, color, opts = {}) {
      if (!verts || verts.length < 3) return;
      for (let i = 1; i < verts.length - 1; i++) {
        this.addTriangle(verts[0], verts[i], verts[i + 1], color, opts);
      }
      if (opts.outline !== false) {
        const edgeCol = opts.outlineColor || parseColor(color, Math.min(1, (opts.opacity || 0.4) + 0.45));
        for (let i = 0; i < verts.length; i++) {
          this.addLine(verts[i], verts[(i + 1) % verts.length], edgeCol, opts.outlineWidth || 1.6);
        }
      }
    }

    addLine(p0, p1, color = '#94a3b8', width = 1.5, dashed = false) {
      this.lines3D.push({ p0, p1, color: parseColor(color), width, dashed });
    }

    addDashedLine(p0, p1, color = '#94a3b8', width = 1.4) {
      this.addLine(p0, p1, color, width, true);
    }

    addLabel(pos, text, opts = {}) {
      if (!text) return;
      this.labels2D.push({
        pos,
        text,
        color: opts.color || (this.theme === 'light' ? '#0f172a' : '#f8fafc'),
        bg: opts.bg !== undefined ? opts.bg : true,
        offset: opts.offset || [0, -10],
        fontSize: opts.fontSize || 12.5,
        bold: opts.bold !== undefined ? opts.bold : true
      });
    }

    // ================= High-level 3D Scientific Primitives =================
    addCylinder(p0, p1, radius = 0.04, color = '#38bdf8', segments = 14, opacity = 1) {
      const diff = M.vecSub(p1, p0);
      const len = M.norm(diff);
      if (len < 1e-6) return;
      const d = M.vecScale(diff, 1 / len);
      const [u, v] = orthoBasisFromDir(d);

      for (let i = 0; i < segments; i++) {
        const a0 = (i / segments) * Math.PI * 2;
        const a1 = ((i + 1) / segments) * Math.PI * 2;
        const n0 = M.vecAdd(M.vecScale(u, Math.cos(a0)), M.vecScale(v, Math.sin(a0)));
        const n1 = M.vecAdd(M.vecScale(u, Math.cos(a1)), M.vecScale(v, Math.sin(a1)));
        const b0 = M.vecAdd(p0, M.vecScale(n0, radius));
        const b1 = M.vecAdd(p0, M.vecScale(n1, radius));
        const t1 = M.vecAdd(p1, M.vecScale(n1, radius));
        const t0 = M.vecAdd(p1, M.vecScale(n0, radius));
        this.addTriangle(b0, b1, t1, color, { n0, n1, n2: n1, opacity });
        this.addTriangle(b0, t1, t0, color, { n0, n1: n1, n2: n0, opacity });
      }
    }

    addCone(baseCenter, tip, radius = 0.1, color = '#38bdf8', segments = 16, opacity = 1) {
      const diff = M.vecSub(tip, baseCenter);
      const len = M.norm(diff);
      if (len < 1e-6) return;
      const d = M.vecScale(diff, 1 / len);
      const [u, v] = orthoBasisFromDir(d);

      for (let i = 0; i < segments; i++) {
        const a0 = (i / segments) * Math.PI * 2;
        const a1 = ((i + 1) / segments) * Math.PI * 2;
        const r0 = M.vecAdd(M.vecScale(u, Math.cos(a0)), M.vecScale(v, Math.sin(a0)));
        const r1 = M.vecAdd(M.vecScale(u, Math.cos(a1)), M.vecScale(v, Math.sin(a1)));
        const b0 = M.vecAdd(baseCenter, M.vecScale(r0, radius));
        const b1 = M.vecAdd(baseCenter, M.vecScale(r1, radius));
        const sideN0 = M.normalize(M.vecAdd(r0, M.vecScale(d, radius / len)));
        const sideN1 = M.normalize(M.vecAdd(r1, M.vecScale(d, radius / len)));
        this.addTriangle(b0, b1, tip, color, { n0: sideN0, n1: sideN1, n2: d, opacity });
        // Base cap
        const negD = M.vecScale(d, -1);
        this.addTriangle(baseCenter, b1, b0, color, { normal: negD, opacity });
      }
    }

    addArrow(from, to, color = '#38bdf8', opts = {}) {
      const diff = M.vecSub(to, from);
      const len = M.norm(diff);
      if (len < 1e-4) {
        if (opts.label) this.addLabel(from, opts.label, { color });
        return;
      }
      const d = M.vecScale(diff, 1 / len);
      const shaftRadius = opts.shaftRadius || 0.042;
      const headRadius = opts.headRadius || shaftRadius * 2.5;
      const headLen = Math.min(opts.headLen || 0.28, len * 0.45);
      const opacity = opts.opacity !== undefined ? opts.opacity : 1.0;

      if (opts.dashed) {
        this.addDashedLine(from, to, color, 2.2);
      } else {
        const neck = M.vecSub(to, M.vecScale(d, headLen));
        this.addCylinder(from, neck, shaftRadius, color, 14, opacity);
        this.addCone(neck, to, headRadius, color, 16, opacity);
      }

      if (opts.showProjections) {
        const pXY = [to[0], to[1], 0];
        this.addDashedLine(to, pXY, parseColor(color, 0.45), 1.2);
        this.addDashedLine([0, 0, 0], pXY, parseColor(color, 0.32), 1.2);
        this.addDashedLine(pXY, [to[0], 0, 0], parseColor(color, 0.28), 1.0);
        this.addDashedLine(pXY, [0, to[1], 0], parseColor(color, 0.28), 1.0);
      }

      if (opts.label) {
        const labelPos = M.vecAdd(to, M.vecScale(d, 0.22));
        this.addLabel(labelPos, opts.label, {
          color: opts.labelColor || color,
          fontSize: opts.fontSize || 13
        });
      }
    }

    addSphere(center, radius = 0.12, color = '#fbbf24', opts = {}) {
      const latBands = opts.latBands || 14;
      const lonBands = opts.lonBands || 20;
      const opacity = opts.opacity !== undefined ? opts.opacity : 1.0;
      const transform = opts.matrix3x3 || null; // optional 3x3 linear map for ellipsoid!

      const evalPt = (theta, phi) => {
        const ux = Math.sin(theta) * Math.cos(phi);
        const uy = Math.sin(theta) * Math.sin(phi);
        const uz = Math.cos(theta);
        if (!transform) {
          return {
            p: [center[0] + radius * ux, center[1] + radius * uy, center[2] + radius * uz],
            n: [ux, uy, uz]
          };
        }
        const tp = M.matVec(transform, [radius * ux, radius * uy, radius * uz]);
        return {
          p: [center[0] + tp[0], center[1] + tp[1], center[2] + tp[2]],
          n: null // computed from face or approx
        };
      };

      for (let lat = 0; lat < latBands; lat++) {
        const t0 = (lat / latBands) * Math.PI;
        const t1 = ((lat + 1) / latBands) * Math.PI;
        for (let lon = 0; lon < lonBands; lon++) {
          const p0 = (lon / lonBands) * Math.PI * 2;
          const p1 = ((lon + 1) / lonBands) * Math.PI * 2;
          const v00 = evalPt(t0, p0);
          const v10 = evalPt(t1, p0);
          const v11 = evalPt(t1, p1);
          const v01 = evalPt(t0, p1);
          if (!transform) {
            this.addTriangle(v00.p, v10.p, v11.p, color, { n0: v00.n, n1: v10.n, n2: v11.n, opacity });
            this.addTriangle(v00.p, v11.p, v01.p, color, { n0: v00.n, n1: v11.n, n2: v01.n, opacity });
          } else {
            this.addTriangle(v00.p, v10.p, v11.p, color, { opacity });
            this.addTriangle(v00.p, v11.p, v01.p, color, { opacity });
          }
          if (opts.wireframe && lat % 2 === 0) {
            this.addLine(v00.p, v01.p, opts.wireColor || parseColor(color, 0.55), 1.1);
          }
          if (opts.wireframe && lon % 2 === 0) {
            this.addLine(v00.p, v10.p, opts.wireColor || parseColor(color, 0.55), 1.1);
          }
        }
      }
      if (opts.label) {
        this.addLabel([center[0], center[1], center[2] + radius + 0.22], opts.label, { color });
      }
    }

    // Parallelepiped spanned by v1, v2, v3 from origin (or custom origin)
    addParallelepiped(v1, v2, v3, color = '#38bdf8', opts = {}) {
      const o = opts.origin || [0, 0, 0];
      const opacity = opts.opacity !== undefined ? opts.opacity : 0.24;
      const p000 = o;
      const p100 = M.vecAdd(o, v1);
      const p010 = M.vecAdd(o, v2);
      const p001 = M.vecAdd(o, v3);
      const p110 = M.vecAdd(p100, v2);
      const p101 = M.vecAdd(p100, v3);
      const p011 = M.vecAdd(p010, v3);
      const p111 = M.vecAdd(p110, v3);

      const vol = M.norm(M.cross(v1, v2)) > 1e-5 ? Math.abs(M.dot(v1, M.cross(v2, v3))) : 0;
      if (vol > 1e-4) {
        this.addQuad(p000, p100, p110, p010, color, { opacity });
        this.addQuad(p001, p101, p111, p011, color, { opacity });
        this.addQuad(p000, p100, p101, p001, color, { opacity });
        this.addQuad(p010, p110, p111, p011, color, { opacity });
        this.addQuad(p000, p010, p011, p001, color, { opacity });
        this.addQuad(p100, p110, p111, p101, color, { opacity });
      } else {
        // Degenerate flat parallelogram (det = 0): draw planar quad so user sees the collapse!
        this.addQuad(p000, p100, p110, p010, color, { opacity: Math.min(0.42, opacity + 0.12) });
        this.addQuad(p000, p100, p101, p001, color, { opacity: Math.min(0.42, opacity + 0.12) });
      }

      const edgeCol = opts.edgeColor || parseColor(color, 0.78);
      const edges = [
        [p000, p100], [p000, p010], [p000, p001],
        [p100, p110], [p100, p101],
        [p010, p110], [p010, p011],
        [p001, p101], [p001, p011],
        [p110, p111], [p101, p111], [p011, p111]
      ];
      for (const [a, b] of edges) {
        this.addLine(a, b, edgeCol, opts.edgeWidth || 1.5);
      }
    }

    // Plane ax + by + cz = d clipped cleanly inside [-L, L]^3
    addPlane(normal, dVal, color = '#38bdf8', opts = {}) {
      const L = opts.bounds || 3.6;
      const poly = clipPlaneToBox(normal, dVal, L);
      if (poly.length < 3) return poly;
      const opacity = opts.opacity !== undefined ? opts.opacity : 0.28;
      this.addPolygon(poly, color, {
        opacity,
        outline: opts.outline !== false,
        outlineColor: opts.outlineColor || parseColor(color, 0.82),
        outlineWidth: opts.outlineWidth || 1.8
      });
      if (opts.label) {
        this.addLabel(poly[0], opts.label, { color, fontSize: 12 });
      }
      return poly;
    }

    addPlaneIntersection(n1, d1, n2, d2, color = '#fbbf24', opts = {}) {
      const seg = intersectTwoPlanesInBox(n1, d1, n2, d2, opts.bounds || 3.6);
      if (!seg) return null;
      this.addCylinder(seg[0], seg[1], opts.radius || 0.045, color, 12, 1.0);
      if (opts.label) {
        const mid = M.vecScale(M.vecAdd(seg[0], seg[1]), 0.5);
        this.addLabel(mid, opts.label, { color });
      }
      return seg;
    }

    // Transformed 3D Lattice / Subspace Grid under 3x3 matrix A
    addTransformedGrid(A, opts = {}) {
      const range = opts.range || 2;
      const color = opts.color || 'rgba(56, 189, 248, 0.35)';
      const width = opts.width || 1.2;
      const mode3D = opts.full3D || false;

      if (!mode3D) {
        // Transformed XY, XZ planar grid lines
        for (let i = -range; i <= range; i++) {
          this.addLine(M.matVec(A, [i, -range, 0]), M.matVec(A, [i, range, 0]), color, width);
          this.addLine(M.matVec(A, [-range, i, 0]), M.matVec(A, [range, i, 0]), color, width);
        }
      } else {
        for (let i = -range; i <= range; i++) {
          for (let j = -range; j <= range; j++) {
            this.addLine(M.matVec(A, [-range, i, j]), M.matVec(A, [range, i, j]), color, width);
            this.addLine(M.matVec(A, [i, -range, j]), M.matVec(A, [i, range, j]), color, width);
            this.addLine(M.matVec(A, [i, j, -range]), M.matVec(A, [i, j, range]), color, width);
          }
        }
      }
    }

    // Surface z = fn(x, y) with height-based scientific colormap + wireframe contours
    addSurfaceZ(fn, opts = {}) {
      const r = opts.range || 2.4;
      const segs = opts.segments || 30;
      const zClip = opts.zClip || 3.8;
      const opacity = opts.opacity !== undefined ? opts.opacity : 0.76;

      const colorForZ = z => {
        const t = Math.max(0, Math.min(1, (z + 2.5) / 5.0));
        // Viridis / Cool-Warm inspired palette: deep blue -> cyan -> emerald -> amber -> coral
        if (t < 0.25) {
          const u = t / 0.25;
          return [0.15 + 0.05 * u, 0.32 + 0.42 * u, 0.85 + 0.12 * u, opacity];
        } else if (t < 0.5) {
          const u = (t - 0.25) / 0.25;
          return [0.20 - 0.04 * u, 0.74 + 0.10 * u, 0.97 - 0.35 * u, opacity];
        } else if (t < 0.75) {
          const u = (t - 0.5) / 0.25;
          return [0.16 + 0.78 * u, 0.84 - 0.10 * u, 0.62 - 0.42 * u, opacity];
        } else {
          const u = (t - 0.75) / 0.25;
          return [0.94 + 0.04 * u, 0.74 - 0.38 * u, 0.20 + 0.12 * u, opacity];
        }
      };

      const grid = [];
      for (let i = 0; i <= segs; i++) {
        const x = -r + (2 * r * i) / segs;
        const row = [];
        for (let j = 0; j <= segs; j++) {
          const y = -r + (2 * r * j) / segs;
          const z = fn(x, y);
          row.push([x, y, z]);
        }
        grid.push(row);
      }

      const wireCol = this.theme === 'light' ? 'rgba(15,23,42,0.18)' : 'rgba(255,255,255,0.16)';
      for (let i = 0; i < segs; i++) {
        for (let j = 0; j < segs; j++) {
          const p00 = grid[i][j], p10 = grid[i + 1][j], p11 = grid[i + 1][j + 1], p01 = grid[i][j + 1];
          if (Math.abs(p00[2]) > zClip && Math.abs(p11[2]) > zClip) continue;
          const clampP = p => [p[0], p[1], Math.max(-zClip, Math.min(zClip, p[2]))];
          const q00 = clampP(p00), q10 = clampP(p10), q11 = clampP(p11), q01 = clampP(p01);
          const avgZ = 0.25 * (q00[2] + q10[2] + q11[2] + q01[2]);
          const col = colorForZ(avgZ);
          this.addQuad(q00, q10, q11, q01, col);
          if (i % 2 === 0) this.addLine(q00, q01, wireCol, 1.0);
          if (j % 2 === 0) this.addLine(q00, q10, wireCol, 1.0);
        }
      }
    }

    // Angle arc between vectors u and v around origin
    addAngleArc(u, v, opts = {}) {
      const nu = M.norm(u), nv = M.norm(v);
      if (nu < 1e-5 || nv < 1e-5) return;
      const radius = opts.radius || Math.min(0.75, 0.35 * Math.min(nu, nv));
      const color = opts.color || '#fbbf24';
      const cos = Math.max(-1, Math.min(1, M.dot(u, v) / (nu * nv)));
      const theta = Math.acos(cos);

      // Right angle square marker if ~90 deg
      if (Math.abs(theta - Math.PI / 2) < 0.035) {
        const eu = M.vecScale(u, (radius * 0.65) / nu);
        const ev = M.vecScale(v, (radius * 0.65) / nv);
        const corner = M.vecAdd(eu, ev);
        this.addLine(eu, corner, color, 2.0);
        this.addLine(ev, corner, color, 2.0);
        if (opts.label) {
          this.addLabel(M.vecScale(corner, 1.25), opts.label, { color, fontSize: 11.5 });
        }
        return;
      }

      const steps = 20;
      const uHat = M.vecScale(u, 1 / nu);
      let perp = M.vecSub(M.vecScale(v, 1 / nv), M.vecScale(uHat, cos));
      if (M.norm(perp) < 1e-6) {
        perp = orthoBasisFromDir(uHat)[0];
      } else {
        perp = M.normalize(perp);
      }

      let prev = M.vecScale(uHat, radius);
      for (let i = 1; i <= steps; i++) {
        const a = (i / steps) * theta;
        const cur = M.vecScale(M.vecAdd(M.vecScale(uHat, Math.cos(a)), M.vecScale(perp, Math.sin(a))), radius);
        this.addLine(prev, cur, color, 2.0);
        prev = cur;
      }
      if (opts.label) {
        const midA = theta * 0.5;
        const midPos = M.vecScale(M.vecAdd(M.vecScale(uHat, Math.cos(midA)), M.vecScale(perp, Math.sin(midA))), radius * 1.32);
        this.addLabel(midPos, opts.label, { color, fontSize: 11.5 });
      }
    }

    // Local 3D Coordinate Frame Triad {O; x, y, z} given origin and 3x3 rotation R
    addTriad(origin, R, scale = 0.65, labelPrefix = '') {
      const rx = [R[0][0] * scale, R[1][0] * scale, R[2][0] * scale];
      const ry = [R[0][1] * scale, R[1][1] * scale, R[2][1] * scale];
      const rz = [R[0][2] * scale, R[1][2] * scale, R[2][2] * scale];
      this.addArrow(origin, M.vecAdd(origin, rx), '#f87171', { shaftRadius: 0.025, headRadius: 0.065, headLen: 0.16, label: labelPrefix ? `${labelPrefix}x` : '' });
      this.addArrow(origin, M.vecAdd(origin, ry), '#34d399', { shaftRadius: 0.025, headRadius: 0.065, headLen: 0.16, label: labelPrefix ? `${labelPrefix}y` : '' });
      this.addArrow(origin, M.vecAdd(origin, rz), '#60a5fa', { shaftRadius: 0.025, headRadius: 0.065, headLen: 0.16, label: labelPrefix ? `${labelPrefix}z` : '' });
    }

    // 3-DOF Articulated Industrial Robot Arm Mesh
    addRobotArm(kin) {
      const { p0, p1, p2, p3, R01, R02, R03 } = kin;
      // Pedestal base
      this.addCylinder([0, 0, -0.08], [0, 0, 0.08], 0.45, '#475569', 24);
      // Link 1 (Waist column)
      this.addCylinder(p0, p1, 0.14, '#64748b', 18);
      this.addSphere(p1, 0.20, '#f59e0b');
      // Link 2 (Upper arm)
      this.addCylinder(p1, p2, 0.105, '#38bdf8', 18);
      this.addSphere(p2, 0.17, '#f59e0b');
      // Link 3 (Forearm)
      this.addCylinder(p2, p3, 0.085, '#818cf8', 18);
      this.addSphere(p3, 0.13, '#10b981');

      // End-effector parallel-jaw gripper
      const ex = [R03[0][0], R03[1][0], R03[2][0]];
      const ey = [R03[0][1], R03[1][1], R03[2][1]];
      const wristEnd = M.vecAdd(p3, M.vecScale(ex, 0.18));
      this.addCylinder(p3, wristEnd, 0.05, '#cbd5e1', 12);
      const jawL0 = M.vecAdd(wristEnd, M.vecScale(ey, 0.14));
      const jawR0 = M.vecAdd(wristEnd, M.vecScale(ey, -0.14));
      this.addCylinder(jawL0, jawR0, 0.035, '#cbd5e1', 10);
      this.addCylinder(jawL0, M.vecAdd(jawL0, M.vecScale(ex, 0.24)), 0.028, '#fbbf24', 10);
      this.addCylinder(jawR0, M.vecAdd(jawR0, M.vecScale(ex, 0.24)), 0.028, '#fbbf24', 10);

      // Coordinate frames
      this.addTriad(p0, M.identity(3), 0.55);
      this.addTriad(p1, R01, 0.5);
      this.addTriad(p2, R02, 0.5);
      this.addTriad(p3, R03, 0.65, 'E');
      this.addLabel(p1, '{1} 腰关节', { color: '#fbbf24', offset: [0, -16], fontSize: 11 });
      this.addLabel(p2, '{2} 肩/肘', { color: '#fbbf24', offset: [0, -16], fontSize: 11 });
      this.addLabel(p3, `末端 P(${M.fmt(p3[0], 2)}, ${M.fmt(p3[1], 2)}, ${M.fmt(p3[2], 2)})`, { color: '#34d399', offset: [0, -22], fontSize: 12 });
    }

    addPointCloud(points, color = '#38bdf8', radiusPx = 4.2) {
      const col = rgbaCss(color);
      for (const p of points) {
        this.pointSprites.push({ pos: p, radiusPx, color: col });
      }
    }

    // ================= Camera & Projection =================
    _computeCameraMatrices() {
      const c = this.camera;
      const cosEl = Math.cos(c.elevation);
      const eye = [
        c.target[0] + c.distance * cosEl * Math.cos(c.azimuth),
        c.target[1] + c.distance * cosEl * Math.sin(c.azimuth),
        c.target[2] + c.distance * Math.sin(c.elevation)
      ];
      const aspect = (this.cssWidth || 800) / (this.cssHeight || 600);
      const P = mat4Perspective(c.fov, aspect, 0.15, 120.0);
      const V = mat4LookAt(eye, c.target, [0, 0, 1]);
      const VP = mat4Mul(P, V);
      return { eye, V, P, VP };
    }

    projectPoint(p, VP) {
      const x = p[0], y = p[1], z = p[2];
      const cx = VP[0] * x + VP[4] * y + VP[8] * z + VP[12];
      const cy = VP[1] * x + VP[5] * y + VP[9] * z + VP[13];
      const cz = VP[2] * x + VP[6] * y + VP[10] * z + VP[14];
      const cw = VP[3] * x + VP[7] * y + VP[11] * z + VP[15];
      if (cw <= 0.08) return null;
      const ndcX = cx / cw;
      const ndcY = cy / cw;
      return {
        x: (ndcX * 0.5 + 0.5) * this.cssWidth,
        y: (0.5 - ndcY * 0.5) * this.cssHeight,
        depth: cz / cw,
        w: cw
      };
    }

    _packTriangles(tris) {
      // 11 floats per vertex * 3 vertices = 33 floats per triangle
      const arr = new Float32Array(tris.length * 33);
      let o = 0;
      for (let i = 0; i < tris.length; i++) {
        const t = tris[i];
        const vs = [t.p0, t.p1, t.p2];
        const ns = [t.n0, t.n1, t.n2];
        const c = t.color;
        for (let k = 0; k < 3; k++) {
          arr[o++] = vs[k][0]; arr[o++] = vs[k][1]; arr[o++] = vs[k][2];
          arr[o++] = ns[k][0]; arr[o++] = ns[k][1]; arr[o++] = ns[k][2];
          arr[o++] = c[0];     arr[o++] = c[1];     arr[o++] = c[2];     arr[o++] = c[3];
          arr[o++] = t.unlit;
        }
      }
      return arr;
    }

    _drawBufferTriangles(gl, buf, vertCount) {
      if (vertCount === 0) return;
      const stride = 11 * 4;
      const loc = this.triLoc;
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.enableVertexAttribArray(loc.aPos);
      gl.vertexAttribPointer(loc.aPos, 3, gl.FLOAT, false, stride, 0);
      gl.enableVertexAttribArray(loc.aNorm);
      gl.vertexAttribPointer(loc.aNorm, 3, gl.FLOAT, false, stride, 3 * 4);
      gl.enableVertexAttribArray(loc.aCol);
      gl.vertexAttribPointer(loc.aCol, 4, gl.FLOAT, false, stride, 6 * 4);
      gl.enableVertexAttribArray(loc.aUnlit);
      gl.vertexAttribPointer(loc.aUnlit, 1, gl.FLOAT, false, stride, 10 * 4);
      gl.drawArrays(gl.TRIANGLES, 0, vertCount);
    }

    _renderWebGL(eye, V, VP) {
      const gl = this.gl;
      gl.viewport(0, 0, this.glCanvas.width, this.glCanvas.height);
      if (this.theme === 'light') {
        gl.clearColor(0.955, 0.968, 0.988, 1.0);
      } else {
        gl.clearColor(0.043, 0.068, 0.128, 1.0);
      }
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

      gl.useProgram(this.triProg);
      gl.uniformMatrix4fv(this.triLoc.uVP, false, VP);
      gl.uniform3fv(this.triLoc.uCamPos, eye);

      // 1. Opaque pass with Z-write ON
      gl.enable(gl.DEPTH_TEST);
      gl.depthFunc(gl.LEQUAL);
      gl.depthMask(true);
      gl.disable(gl.BLEND);

      if (this.opaqueDirty) {
        const data = this._packTriangles(this.opaqueTris);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.opaqueBuf);
        gl.bufferData(gl.ARRAY_BUFFER, data, gl.DYNAMIC_DRAW);
        this.opaqueVertCount = this.opaqueTris.length * 3;
        this.opaqueDirty = false;
      }
      this._drawBufferTriangles(gl, this.opaqueBuf, this.opaqueVertCount);

      // 2. Depth-sorted translucent pass with Z-test ON, Z-write OFF
      if (this.transTris.length > 0) {
        // Camera-space Z = V[2]*x + V[6]*y + V[10]*z + V[14] (more negative = farther away)
        const sorted = this.transTris.map(t => {
          const cx = (t.p0[0] + t.p1[0] + t.p2[0]) / 3;
          const cy = (t.p0[1] + t.p1[1] + t.p2[1]) / 3;
          const cz = (t.p0[2] + t.p1[2] + t.p2[2]) / 3;
          const camZ = V[2] * cx + V[6] * cy + V[10] * cz + V[14];
          return { t, camZ };
        }).sort((a, b) => a.camZ - b.camZ);

        const transData = this._packTriangles(sorted.map(s => s.t));
        gl.bindBuffer(gl.ARRAY_BUFFER, this.transBuf);
        gl.bufferData(gl.ARRAY_BUFFER, transData, gl.STREAM_DRAW);

        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        gl.depthMask(false);
        this._drawBufferTriangles(gl, this.transBuf, sorted.length * 3);
        gl.depthMask(true);
        gl.disable(gl.BLEND);
      }
    }

    _renderFallback2D(ctx, V, VP) {
      ctx.fillStyle = this.theme === 'light' ? '#f4f7fc' : '#0b1120';
      ctx.fillRect(0, 0, this.cssWidth, this.cssHeight);
      const all = [...this.opaqueTris, ...this.transTris].map(t => {
        const cx = (t.p0[0] + t.p1[0] + t.p2[0]) / 3;
        const cy = (t.p0[1] + t.p1[1] + t.p2[1]) / 3;
        const cz = (t.p0[2] + t.p1[2] + t.p2[2]) / 3;
        const camZ = V[2] * cx + V[6] * cy + V[10] * cz + V[14];
        return { t, camZ };
      }).sort((a, b) => a.camZ - b.camZ);

      for (const { t } of all) {
        const s0 = this.projectPoint(t.p0, VP);
        const s1 = this.projectPoint(t.p1, VP);
        const s2 = this.projectPoint(t.p2, VP);
        if (!s0 || !s1 || !s2) continue;
        ctx.beginPath();
        ctx.moveTo(s0.x, s0.y);
        ctx.lineTo(s1.x, s1.y);
        ctx.lineTo(s2.x, s2.y);
        ctx.closePath();
        ctx.fillStyle = rgbaCss(t.color);
        ctx.fill();
      }
    }

    _renderHUD(V, VP) {
      const ctx = this.hudCanvas.getContext('2d');
      ctx.save();
      ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
      ctx.clearRect(0, 0, this.cssWidth, this.cssHeight);

      if (this.useFallback2D) {
        this._renderFallback2D(ctx, V, VP);
      }

      // Draw crisp anti-aliased 3D lines (grid, dashed guides, polygon borders)
      ctx.lineCap = 'round';
      for (const ln of this.lines3D) {
        const s0 = this.projectPoint(ln.p0, VP);
        const s1 = this.projectPoint(ln.p1, VP);
        if (!s0 || !s1) continue;
        ctx.beginPath();
        if (ln.dashed) ctx.setLineDash([5, 4]);
        else ctx.setLineDash([]);
        ctx.strokeStyle = rgbaCss(ln.color);
        ctx.lineWidth = ln.width;
        ctx.moveTo(s0.x, s0.y);
        ctx.lineTo(s1.x, s1.y);
        ctx.stroke();
      }
      ctx.setLineDash([]);

      // Draw point cloud sprites (depth sorted)
      if (this.pointSprites.length > 0) {
        const pts = this.pointSprites
          .map(p => ({ p, s: this.projectPoint(p.pos, VP) }))
          .filter(x => x.s !== null)
          .sort((a, b) => b.s.w - a.s.w);
        for (const { p, s } of pts) {
          ctx.beginPath();
          ctx.arc(s.x, s.y, p.radiusPx, 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.fill();
        }
      }

      // Draw crisp HiDPI 2D vector & math labels
      for (const lb of this.labels2D) {
        const s = this.projectPoint(lb.pos, VP);
        if (!s) continue;
        const x = s.x + lb.offset[0];
        const y = s.y + lb.offset[1];
        if (x < -40 || x > this.cssWidth + 40 || y < -30 || y > this.cssHeight + 30) continue;

        ctx.font = `${lb.bold ? '600' : '500'} ${lb.fontSize}px "Inter", "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        if (lb.bg) {
          const metrics = ctx.measureText(lb.text);
          const padX = 6, padY = 3;
          const bw = metrics.width + padX * 2;
          const bh = lb.fontSize + padY * 2;
          ctx.fillStyle = this.theme === 'light' ? 'rgba(255, 255, 255, 0.86)' : 'rgba(15, 23, 42, 0.80)';
          ctx.strokeStyle = rgbaCss(lb.color, 0.45);
          ctx.lineWidth = 1;
          ctx.beginPath();
          if (ctx.roundRect) ctx.roundRect(x - bw / 2, y - bh / 2, bw, bh, 5);
          else ctx.rect(x - bw / 2, y - bh / 2, bw, bh);
          ctx.fill();
          ctx.stroke();
        }
        ctx.fillStyle = rgbaCss(lb.color, 1);
        ctx.fillText(lb.text, x, y);
      }

      ctx.restore();
    }

    _loop(now) {
      const dt = Math.min(0.05, (now - this._lastTime) / 1000);
      this._lastTime = now;

      if (this.camTween) {
        this.camTween.t = Math.min(1, this.camTween.t + dt * 3.8);
        const u = 1 - Math.pow(1 - this.camTween.t, 3);
        const { from, to } = this.camTween;
        this.camera.azimuth = from.azimuth + (to.azimuth - from.azimuth) * u;
        this.camera.elevation = from.elevation + (to.elevation - from.elevation) * u;
        this.camera.distance = from.distance + (to.distance - from.distance) * u;
        for (let k = 0; k < 3; k++) {
          this.camera.target[k] = from.target[k] + (to.target[k] - from.target[k]) * u;
        }
        if (this.camTween.t >= 1) this.camTween = null;
      } else if (this.autoRotate) {
        this.camera.azimuth += dt * 0.35;
      }

      if (typeof this.customTickCallback === 'function') {
        this.customTickCallback(dt, now / 1000);
      }

      const { eye, V, VP } = this._computeCameraMatrices();
      if (!this.useFallback2D) {
        this._renderWebGL(eye, V, VP);
      }
      this._renderHUD(V, VP);

      this._rafId = requestAnimationFrame(this._loop);
    }
  }

  global.LAScene3D = {
    Scene3D,
    parseColor,
    rgbaCss,
    clipPlaneToBox,
    clipLineToBox,
    intersectTwoPlanesInBox
  };
})(window);
