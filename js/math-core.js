/**
 * 《线性代数》交互式 3D 教学仿真实验平台 - 核心数学计算引擎
 * 适配深圳技术大学 SG01047《线性代数》（机器人工程专业）课程大纲
 */
(function (global) {
  'use strict';

  const EPS = 1e-9;

  function cleanZero(v, tol = 1e-10) {
    return Math.abs(v) < tol ? 0 : v;
  }

  function fmt(v, digits = 2) {
    if (v === null || v === undefined || Number.isNaN(v)) return '—';
    const c = cleanZero(v, 1e-9);
    if (Math.abs(c - Math.round(c)) < 1e-7) return String(Math.round(c));
    return Number(c.toFixed(digits)).toString();
  }

  // Approximate small-denominator fraction for clean algebraic display (e.g. 1/3, -3/2)
  function fmtFrac(v, maxDen = 12) {
    if (v === null || v === undefined || Number.isNaN(v)) return '—';
    const c = cleanZero(v, 1e-8);
    if (Math.abs(c - Math.round(c)) < 1e-6) return String(Math.round(c));
    const sign = c < 0 ? '-' : '';
    const abs = Math.abs(c);
    let bestNum = 1, bestDen = 1, bestErr = Infinity;
    for (let d = 1; d <= maxDen; d++) {
      const n = Math.round(abs * d);
      const err = Math.abs(abs - n / d);
      if (err < bestErr) {
        bestErr = err;
        bestNum = n;
        bestDen = d;
      }
      if (err < 1e-6) break;
    }
    if (bestErr < 1e-5 && bestDen > 1) {
      return `${sign}${bestNum}/${bestDen}`;
    }
    return fmt(c, 2);
  }

  function cloneMat(M) {
    return M.map(row => row.slice());
  }

  function zeros(r, c) {
    return Array.from({ length: r }, () => new Array(c).fill(0));
  }

  function identity(n) {
    const I = zeros(n, n);
    for (let i = 0; i < n; i++) I[i][i] = 1;
    return I;
  }

  // ================= Vector Operations =================
  function vecAdd(a, b) {
    return a.map((v, i) => v + (b[i] || 0));
  }

  function vecSub(a, b) {
    return a.map((v, i) => v - (b[i] || 0));
  }

  function vecScale(a, k) {
    return a.map(v => v * k);
  }

  function dot(a, b) {
    let s = 0;
    for (let i = 0; i < a.length; i++) s += a[i] * b[i];
    return cleanZero(s);
  }

  function cross(a, b) {
    return [
      cleanZero(a[1] * b[2] - a[2] * b[1]),
      cleanZero(a[2] * b[0] - a[0] * b[2]),
      cleanZero(a[0] * b[1] - a[1] * b[0])
    ];
  }

  function norm(a) {
    return Math.sqrt(a.reduce((s, v) => s + v * v, 0));
  }

  function normalize(a) {
    const n = norm(a);
    return n < EPS ? a.map(() => 0) : a.map(v => v / n);
  }

  function angleDeg(a, b) {
    const na = norm(a), nb = norm(b);
    if (na < EPS || nb < EPS) return 0;
    const cos = Math.max(-1, Math.min(1, dot(a, b) / (na * nb)));
    return (Math.acos(cos) * 180) / Math.PI;
  }

  // ================= Matrix Operations =================
  function transpose(A) {
    const r = A.length, c = A[0].length;
    const T = zeros(c, r);
    for (let i = 0; i < r; i++) {
      for (let j = 0; j < c; j++) T[j][i] = A[i][j];
    }
    return T;
  }

  function matAdd(A, B, scaleB = 1) {
    return A.map((row, i) => row.map((v, j) => cleanZero(v + scaleB * B[i][j])));
  }

  function matScale(A, k) {
    return A.map(row => row.map(v => cleanZero(v * k)));
  }

  function matMul(A, B) {
    const r = A.length, m = A[0].length, c = B[0].length;
    const C = zeros(r, c);
    for (let i = 0; i < r; i++) {
      for (let j = 0; j < c; j++) {
        let s = 0;
        for (let k = 0; k < m; k++) s += A[i][k] * B[k][j];
        C[i][j] = cleanZero(s);
      }
    }
    return C;
  }

  function matVec(A, v) {
    return A.map(row => cleanZero(row.reduce((s, val, j) => s + val * (v[j] || 0), 0)));
  }

  function matPow(A, k) {
    const n = A.length;
    let R = identity(n);
    let base = cloneMat(A);
    let exp = Math.max(0, Math.floor(k));
    while (exp > 0) {
      if (exp & 1) R = matMul(R, base);
      base = matMul(base, base);
      exp >>= 1;
    }
    return R;
  }

  function trace(A) {
    let s = 0;
    for (let i = 0; i < Math.min(A.length, A[0].length); i++) s += A[i][i];
    return cleanZero(s);
  }

  // ================= Permutations & Determinants =================
  function inversionCount(perm) {
    let count = 0;
    const pairs = [];
    for (let i = 0; i < perm.length; i++) {
      for (let j = i + 1; j < perm.length; j++) {
        if (perm[i] > perm[j]) {
          count++;
          pairs.push([perm[i], perm[j], i, j]);
        }
      }
    }
    return { count, isEven: count % 2 === 0, sign: count % 2 === 0 ? 1 : -1, pairs };
  }

  function allPermutations(n) {
    const res = [];
    const arr = Array.from({ length: n }, (_, i) => i + 1);
    function backtrack(idx) {
      if (idx === n) {
        res.push(arr.slice());
        return;
      }
      for (let i = idx; i < n; i++) {
        [arr[idx], arr[i]] = [arr[i], arr[idx]];
        backtrack(idx + 1);
        [arr[idx], arr[i]] = [arr[i], arr[idx]];
      }
    }
    backtrack(0);
    return res;
  }

  function subMatrix(A, skipRow, skipCol) {
    const res = [];
    for (let i = 0; i < A.length; i++) {
      if (i === skipRow) continue;
      const row = [];
      for (let j = 0; j < A[0].length; j++) {
        if (j === skipCol) continue;
        row.push(A[i][j]);
      }
      res.push(row);
    }
    return res;
  }

  function det(A) {
    const n = A.length;
    if (n === 1) return cleanZero(A[0][0]);
    if (n === 2) return cleanZero(A[0][0] * A[1][1] - A[0][1] * A[1][0]);
    if (n === 3) {
      return cleanZero(
        A[0][0] * (A[1][1] * A[2][2] - A[1][2] * A[2][1]) -
        A[0][1] * (A[1][0] * A[2][2] - A[1][2] * A[2][0]) +
        A[0][2] * (A[1][0] * A[2][1] - A[1][1] * A[2][0])
      );
    }
    let d = 0;
    for (let j = 0; j < n; j++) {
      if (Math.abs(A[0][j]) < EPS) continue;
      d += (j % 2 === 0 ? 1 : -1) * A[0][j] * det(subMatrix(A, 0, j));
    }
    return cleanZero(d);
  }

  function minor(A, i, j) {
    return det(subMatrix(A, i, j));
  }

  function cofactor(A, i, j) {
    return cleanZero(((i + j) % 2 === 0 ? 1 : -1) * minor(A, i, j));
  }

  function adjugate(A) {
    const n = A.length;
    const adj = zeros(n, n);
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        // Note: A*[j][i] = A_{ij}
        adj[j][i] = cofactor(A, i, j);
      }
    }
    return adj;
  }

  function inverse(A) {
    const d = det(A);
    if (Math.abs(d) < 1e-8) return null;
    const adj = adjugate(A);
    return matScale(adj, 1 / d);
  }

  // ================= Gauss / Gauss-Jordan with Step Recording =================
  function gaussJordanSteps(inputMat, pivotColsLimit = null) {
    const M = cloneMat(inputMat);
    const rows = M.length;
    const cols = M[0].length;
    const maxPivotCol = pivotColsLimit !== null ? pivotColsLimit : cols;
    const steps = [{
      title: '初始矩阵',
      desc: '原始输入矩阵',
      opType: 'init',
      matrix: cloneMat(M),
      detFactor: 1,
      pivots: []
    }];

    let r = 0;
    const pivots = [];
    let cumDetFactor = 1; // M_current = cumDetFactor * det(M_init) relationship: det(init) = det(curr) / cumDetFactor

    // Forward phase -> Row Echelon Form (REF)
    for (let c = 0; c < maxPivotCol && r < rows; c++) {
      let bestRow = r;
      let maxVal = Math.abs(M[r][c]);
      for (let i = r + 1; i < rows; i++) {
        if (Math.abs(M[i][c]) > maxVal + 1e-11) {
          maxVal = Math.abs(M[i][c]);
          bestRow = i;
        }
      }
      if (maxVal < 1e-8) continue;

      if (bestRow !== r) {
        [M[r], M[bestRow]] = [M[bestRow], M[r]];
        cumDetFactor *= -1;
        steps.push({
          title: `交换行 r${r + 1} ↔ r${bestRow + 1}`,
          desc: `选主元：两行互换，行列式变号`,
          opType: 'swap',
          r1: r,
          r2: bestRow,
          matrix: cloneMat(M),
          detFactor: cumDetFactor,
          pivots: pivots.slice()
        });
      }

      pivots.push([r, c]);

      // Eliminate below pivot
      for (let i = r + 1; i < rows; i++) {
        if (Math.abs(M[i][c]) > 1e-8) {
          const factor = M[i][c] / M[r][c];
          for (let j = c; j < cols; j++) {
            M[i][j] = cleanZero(M[i][j] - factor * M[r][j], 1e-9);
          }
          M[i][c] = 0;
          steps.push({
            title: `消元 r${i + 1} ${factor >= 0 ? '-' : '+'} ${fmtFrac(Math.abs(factor))} r${r + 1}`,
            desc: `消去第 ${c + 1} 列主元下方元素，行列式值不变`,
            opType: 'add',
            targetRow: i,
            srcRow: r,
            factor: -factor,
            matrix: cloneMat(M),
            detFactor: cumDetFactor,
            pivots: pivots.slice()
          });
        }
      }
      r++;
    }

    const refMatrix = cloneMat(M);
    const refStepIndex = steps.length - 1;

    // Backward phase -> Reduced Row Echelon Form (RREF)
    for (let pIdx = pivots.length - 1; pIdx >= 0; pIdx--) {
      const [pr, pc] = pivots[pIdx];
      const pVal = M[pr][pc];
      if (Math.abs(pVal - 1) > 1e-8) {
        for (let j = pc; j < cols; j++) {
          M[pr][j] = cleanZero(M[pr][j] / pVal, 1e-9);
        }
        M[pr][pc] = 1;
        cumDetFactor /= pVal;
        steps.push({
          title: `主元归一 r${pr + 1} × (${fmtFrac(1 / pVal)})`,
          desc: `将第 ${pr + 1} 行主元化为 1`,
          opType: 'scale',
          targetRow: pr,
          scale: 1 / pVal,
          matrix: cloneMat(M),
          detFactor: cumDetFactor,
          pivots: pivots.slice()
        });
      }
      for (let i = 0; i < pr; i++) {
        if (Math.abs(M[i][pc]) > 1e-8) {
          const factor = M[i][pc];
          for (let j = pc; j < cols; j++) {
            M[i][j] = cleanZero(M[i][j] - factor * M[pr][j], 1e-9);
          }
          M[i][pc] = 0;
          steps.push({
            title: `回代消元 r${i + 1} ${factor >= 0 ? '-' : '+'} ${fmtFrac(Math.abs(factor))} r${pr + 1}`,
            desc: `消去主元上方非零元，化向行最简形`,
            opType: 'add',
            targetRow: i,
            srcRow: pr,
            factor: -factor,
            matrix: cloneMat(M),
            detFactor: cumDetFactor,
            pivots: pivots.slice()
          });
        }
      }
    }

    return {
      steps,
      refMatrix,
      refStepIndex,
      rrefMatrix: cloneMat(M),
      rank: pivots.length,
      pivots,
      pivotCols: pivots.map(p => p[1])
    };
  }

  function rank(A) {
    return gaussJordanSteps(A).rank;
  }

  // ================= Linear System Solver Ax = b =================
  // Returns full structural info: rankA, rankAug, status ('none' | 'unique' | 'infinite'),
  // particular solution eta, fundamental solution basis [xi_1, xi_2, ...], RREF steps
  function solveLinearSystem(A, b) {
    const m = A.length;
    const n = A[0].length;
    const aug = A.map((row, i) => [...row, b ? b[i] : 0]);
    const gjAug = gaussJordanSteps(aug, n);
    const gjFull = gaussJordanSteps(aug, n + 1);
    const rankA = gjAug.rank;
    const rankAug = gjFull.rank;
    const R = gjAug.rrefMatrix;
    const pivotCols = gjAug.pivotCols;
    const pivotSet = new Set(pivotCols);
    const freeCols = [];
    for (let j = 0; j < n; j++) {
      if (!pivotSet.has(j)) freeCols.push(j);
    }

    // Check inconsistency: any row with 0 == non-zero in R
    let inconsistent = rankAug > rankA;
    for (let i = rankA; i < m; i++) {
      if (Math.abs(R[i][n]) > 1e-7) inconsistent = true;
    }

    if (inconsistent) {
      return {
        status: 'none',
        rankA,
        rankAug: rankA + 1,
        n,
        particular: null,
        basis: [],
        freeCols,
        pivotCols,
        gj: gjFull
      };
    }

    // Particular solution (set all free variables = 0)
    const particular = new Array(n).fill(0);
    for (let idx = 0; idx < gjAug.pivots.length; idx++) {
      const [pr, pc] = gjAug.pivots[idx];
      particular[pc] = cleanZero(R[pr][n]);
    }

    // Fundamental solution system (null space basis of A)
    const basis = freeCols.map(fc => {
      const xi = new Array(n).fill(0);
      xi[fc] = 1;
      for (let idx = 0; idx < gjAug.pivots.length; idx++) {
        const [pr, pc] = gjAug.pivots[idx];
        xi[pc] = cleanZero(-R[pr][fc]);
      }
      return xi;
    });

    return {
      status: freeCols.length === 0 ? 'unique' : 'infinite',
      rankA,
      rankAug,
      n,
      particular,
      basis,
      freeCols,
      pivotCols,
      gj: gjAug
    };
  }

  function nullSpaceBasis(A) {
    const m = A.length;
    return solveLinearSystem(A, new Array(m).fill(0)).basis;
  }

  // ================= Gram-Schmidt Orthogonalization =================
  function gramSchmidt(vectors) {
    const ortho = [];
    const unit = [];
    const projections = []; // detailed projection steps

    for (let i = 0; i < vectors.length; i++) {
      const alpha = vectors[i].slice();
      let beta = alpha.slice();
      const stepTerms = [];
      for (let j = 0; j < ortho.length; j++) {
        const denom = dot(ortho[j], ortho[j]);
        if (denom > 1e-10) {
          const coeff = dot(alpha, ortho[j]) / denom;
          const projVec = vecScale(ortho[j], coeff);
          beta = vecSub(beta, projVec);
          stepTerms.push({ j, coeff: cleanZero(coeff), projVec });
        }
      }
      beta = beta.map(v => cleanZero(v, 1e-9));
      const len = norm(beta);
      const e = len > 1e-8 ? vecScale(beta, 1 / len) : beta.map(() => 0);
      if (len > 1e-8) {
        ortho.push(beta);
        unit.push(e);
      }
      projections.push({
        index: i,
        alpha,
        beta,
        normBeta: cleanZero(len),
        e,
        independent: len > 1e-8,
        terms: stepTerms
      });
    }
    return { ortho, unit, steps: projections };
  }

  // ================= Symmetric 3x3 / nxn Jacobi Eigen-Solver =================
  // Guarantees real eigenvalues and strictly orthonormal Q (Q^T A Q = diag(lambda), det(Q) = +1)
  function jacobiSymmetricEigen(A_in) {
    const n = A_in.length;
    // Symmetrize just in case
    const A = zeros(n, n);
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) A[i][j] = 0.5 * (A_in[i][j] + A_in[j][i]);
    }
    const V = identity(n);

    for (let sweep = 0; sweep < 60; sweep++) {
      let maxOff = 0, p = 0, q = 1;
      for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
          if (Math.abs(A[i][j]) > maxOff) {
            maxOff = Math.abs(A[i][j]);
            p = i;
            q = j;
          }
        }
      }
      if (maxOff < 1e-12) break;

      const app = A[p][p], aqq = A[q][q], apq = A[p][q];
      const tau = (aqq - app) / (2 * apq);
      const t = tau >= 0 ? 1 / (tau + Math.sqrt(1 + tau * tau)) : -1 / (-tau + Math.sqrt(1 + tau * tau));
      const c = 1 / Math.sqrt(1 + t * t);
      const s = t * c;

      A[p][p] = app - t * apq;
      A[q][q] = aqq + t * apq;
      A[p][q] = A[q][p] = 0;

      for (let k = 0; k < n; k++) {
        if (k !== p && k !== q) {
          const akp = A[k][p], akq = A[k][q];
          A[k][p] = A[p][k] = c * akp - s * akq;
          A[k][q] = A[q][k] = s * akp + c * akq;
        }
        const vkp = V[k][p], vkq = V[k][q];
        V[k][p] = c * vkp - s * vkq;
        V[k][q] = s * vkp + c * vkq;
      }
    }

    // Sort eigenvalues descending
    const order = Array.from({ length: n }, (_, i) => i).sort((a, b) => A[b][b] - A[a][a]);
    const values = order.map(i => cleanZero(A[i][i], 1e-9));
    const Q = zeros(n, n);
    for (let col = 0; col < n; col++) {
      const src = order[col];
      for (let r = 0; r < n; r++) Q[r][col] = cleanZero(V[r][src], 1e-10);
    }
    // Ensure right-handedness det(Q) = +1
    if (n === 3 && det(Q) < 0) {
      for (let r = 0; r < 3; r++) Q[r][2] = -Q[r][2];
    }
    const vectors = order.map((_, col) => Q.map(row => row[col]));
    return { values, vectors, Q };
  }

  function isSymmetric(A, tol = 1e-7) {
    if (A.length !== A[0].length) return false;
    for (let i = 0; i < A.length; i++) {
      for (let j = i + 1; j < A.length; j++) {
        if (Math.abs(A[i][j] - A[j][i]) > tol) return false;
      }
    }
    return true;
  }

  function isOrthogonal(Q, tol = 1e-5) {
    const n = Q.length;
    const QTQ = matMul(transpose(Q), Q);
    const I = identity(n);
    let maxErr = 0;
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        maxErr = Math.max(maxErr, Math.abs(QTQ[i][j] - I[i][j]));
      }
    }
    return { ok: maxErr < tol, maxErr: cleanZero(maxErr), QTQ, det: det(Q) };
  }

  // ================= General 3x3 Eigen-Solver (Real & Complex) =================
  function eigen3x3(A) {
    if (isSymmetric(A)) {
      const sym = jacobiSymmetricEigen(A);
      const tr = trace(A);
      const c1 = minor(A, 0, 0) + minor(A, 1, 1) + minor(A, 2, 2);
      const d = det(A);
      return {
        isSymmetric: true,
        hasComplex: false,
        charPoly: [1, cleanZero(-tr), cleanZero(c1), cleanZero(-d)], // lambda^3 + p2*lambda^2 + p1*lambda + p0 = 0
        eigenvalues: sym.values.map(v => ({ re: v, im: 0 })),
        realValues: sym.values,
        eigenvectors: sym.vectors,
        P: sym.Q,
        PInv: transpose(sym.Q),
        diagonalizable: true,
        orthogonalDiag: true
      };
    }

    const tr = trace(A);
    const m2 = minor(A, 0, 0) + minor(A, 1, 1) + minor(A, 2, 2);
    const d = det(A);
    // lambda^3 - tr*lambda^2 + m2*lambda - d = 0
    // Depressed cubic: lambda = y + tr/3 => y^3 + p*y + q = 0
    const a2 = -tr, a1 = m2, a0 = -d;
    const p = a1 - (a2 * a2) / 3;
    const q = (2 * a2 * a2 * a2) / 27 - (a2 * a1) / 3 + a0;
    const disc = (q * q) / 4 + (p * p * p) / 27;
    const shift = -a2 / 3;

    if (disc > 1e-8) {
      // One real root + complex conjugate pair
      const sqrtD = Math.sqrt(disc);
      const u = Math.cbrt(-q / 2 + sqrtD);
      const v = Math.cbrt(-q / 2 - sqrtD);
      const r1 = cleanZero(u + v + shift, 1e-8);
      const re = cleanZero(-(u + v) / 2 + shift, 1e-8);
      const im = cleanZero((Math.sqrt(3) / 2) * Math.abs(u - v), 1e-8);

      // Find real eigenvector for r1
      const M1 = matAdd(A, identity(3), -r1);
      let ns = nullSpaceBasis(M1);
      if (ns.length === 0) {
        // Fallback numerical smallest singular vector via (M1^T M1) Jacobi
        const symM = jacobiSymmetricEigen(matMul(transpose(M1), M1));
        ns = [symM.vectors[2]];
      }
      const vReal = normalize(ns[0]);

      // Invariant plane for complex pair: solve (A - re*I)^2 + im^2 I nullspace
      const Are = matAdd(A, identity(3), -re);
      const quadM = matAdd(matMul(Are, Are), identity(3), im * im);
      const symQ = jacobiSymmetricEigen(matMul(transpose(quadM), quadM));
      const u1 = normalize(symQ.vectors[2]);
      const u2 = normalize(matVec(Are, u1));

      return {
        isSymmetric: false,
        hasComplex: true,
        charPoly: [1, cleanZero(a2), cleanZero(a1), cleanZero(a0)],
        eigenvalues: [
          { re: r1, im: 0 },
          { re, im },
          { re, im: -im }
        ],
        realValues: [r1],
        eigenvectors: [vReal],
        complexPlaneBasis: [u1, u2],
        diagonalizable: false, // Not real-diagonalizable over R
        diagonalizableComplex: true,
        orthogonalDiag: false
      };
    }

    // Three real roots
    let roots = [];
    if (Math.abs(p) < 1e-10 && Math.abs(q) < 1e-10) {
      roots = [shift, shift, shift];
    } else {
      const r = Math.sqrt(Math.max(0, -(p * p * p) / 27));
      const phi = r < 1e-12 ? 0 : Math.acos(Math.max(-1, Math.min(1, -q / (2 * r))));
      const mag = 2 * Math.cbrt(r);
      roots = [
        mag * Math.cos(phi / 3) + shift,
        mag * Math.cos((phi + 2 * Math.PI) / 3) + shift,
        mag * Math.cos((phi + 4 * Math.PI) / 3) + shift
      ];
    }
    // Snap near-integers and sort descending
    roots = roots.map(v => {
      const rnd = Math.round(v);
      return Math.abs(v - rnd) < 1e-5 ? rnd : cleanZero(v, 1e-8);
    }).sort((a, b) => b - a);

    // Group distinct eigenvalues
    const groups = [];
    for (const val of roots) {
      const existing = groups.find(g => Math.abs(g.val - val) < 1e-4);
      if (existing) existing.algMult++;
      else groups.push({ val, algMult: 1 });
    }

    const allVecs = [];
    const expandedVals = [];
    for (const g of groups) {
      const M = matAdd(A, identity(3), -g.val);
      let basis = nullSpaceBasis(M);
      if (basis.length === 0) {
        const symM = jacobiSymmetricEigen(matMul(transpose(M), M));
        basis = [symM.vectors[2]];
      }
      g.geoMult = basis.length;
      g.basis = basis;
      for (const bVec of basis) {
        allVecs.push(bVec);
        expandedVals.push(g.val);
      }
    }

    const diagonalizable = allVecs.length === 3;
    let P = null, PInv = null;
    if (diagonalizable) {
      P = transpose(allVecs); // columns are eigenvectors
      PInv = inverse(P);
    }

    return {
      isSymmetric: false,
      hasComplex: false,
      charPoly: [1, cleanZero(a2), cleanZero(a1), cleanZero(a0)],
      eigenvalues: roots.map(v => ({ re: v, im: 0 })),
      realValues: roots,
      groups,
      eigenvectors: allVecs,
      P,
      PInv,
      diagonalizable,
      orthogonalDiag: false
    };
  }

  // ================= Quadratic Form Analysis =================
  function analyzeQuadraticForm(A_in) {
    // Symmetrize
    const n = A_in.length;
    const A = zeros(n, n);
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) A[i][j] = 0.5 * (A_in[i][j] + A_in[j][i]);
    }
    const eig = jacobiSymmetricEigen(A);
    // Leading principal minors (Sylvester)
    const minors = [];
    for (let k = 1; k <= n; k++) {
      const sub = A.slice(0, k).map(r => r.slice(0, k));
      minors.push(det(sub));
    }

    let pos = 0, neg = 0, zero = 0;
    for (const lam of eig.values) {
      if (lam > 1e-7) pos++;
      else if (lam < -1e-7) neg++;
      else zero++;
    }

    let definiteness = '不定 (Indefinite)';
    let defCode = 'indefinite';
    if (pos === n) {
      definiteness = '正定 (Positive Definite)';
      defCode = 'pos_def';
    } else if (neg === n) {
      definiteness = '负定 (Negative Definite)';
      defCode = 'neg_def';
    } else if (pos > 0 && neg === 0 && zero > 0) {
      definiteness = '半正定 (Positive Semi-Definite)';
      defCode = 'pos_semi';
    } else if (neg > 0 && pos === 0 && zero > 0) {
      definiteness = '半负定 (Negative Semi-Definite)';
      defCode = 'neg_semi';
    } else if (pos === 0 && neg === 0) {
      definiteness = '零二次型 (Zero Form)';
      defCode = 'zero';
    }

    return {
      A,
      eigenvalues: eig.values,
      Q: eig.Q,
      principalAxes: eig.vectors,
      leadingMinors: minors,
      posIndex: pos,
      negIndex: neg,
      zeroCount: zero,
      rank: pos + neg,
      definiteness,
      defCode
    };
  }

  // ================= Robotics SE(3) & Forward Kinematics Helpers =================
  function rotX(rad) {
    const c = Math.cos(rad), s = Math.sin(rad);
    return [
      [1, 0, 0],
      [0, c, -s],
      [0, s, c]
    ];
  }

  function rotY(rad) {
    const c = Math.cos(rad), s = Math.sin(rad);
    return [
      [c, 0, s],
      [0, 1, 0],
      [-s, 0, c]
    ];
  }

  function rotZ(rad) {
    const c = Math.cos(rad), s = Math.sin(rad);
    return [
      [c, -s, 0],
      [s, c, 0],
      [0, 0, 1]
    ];
  }

  function makeSE3(R, p) {
    return [
      [R[0][0], R[0][1], R[0][2], p[0]],
      [R[1][0], R[1][1], R[1][2], p[1]],
      [R[2][0], R[2][1], R[2][2], p[2]],
      [0, 0, 0, 1]
    ];
  }

  // 3-DOF Spatial Articulated Robot Arm (Waist theta1 around Z, Shoulder theta2, Elbow theta3)
  function robot3DOFKinematics(theta1Deg, theta2Deg, theta3Deg, L1 = 1.0, L2 = 1.5, L3 = 1.2) {
    const t1 = (theta1Deg * Math.PI) / 180;
    const t2 = (theta2Deg * Math.PI) / 180;
    const t3 = (theta3Deg * Math.PI) / 180;

    // Frame 0: Base at (0,0,0)
    // Frame 1: Waist rotated by t1 around Z, elevated by L1 along Z
    const R01 = rotZ(t1);
    const T01 = makeSE3(R01, [0, 0, L1]);

    // Frame 2: Shoulder pitch t2 around local Y, link length L2 along local X
    const R_sh = rotY(-t2); // positive t2 lifts arm upward in +Z
    const T01_sh = matMul(T01, makeSE3(R_sh, [0, 0, 0]));
    const T12 = makeSE3(identity(3), [L2, 0, 0]);
    const T02 = matMul(T01_sh, T12);

    // Frame 3: Elbow pitch t3 around local Y, link length L3 along local X
    const T02_el = matMul(T02, makeSE3(rotY(-t3), [0, 0, 0]));
    const T23 = makeSE3(identity(3), [L3, 0, 0]);
    const T03 = matMul(T02_el, T23);

    const extractPos = T => [T[0][3], T[1][3], T[2][3]];
    const extractRot = T => [
      [T[0][0], T[0][1], T[0][2]],
      [T[1][0], T[1][1], T[1][2]],
      [T[2][0], T[2][1], T[2][2]]
    ];

    const p0 = [0, 0, 0];
    const p1 = extractPos(T01);
    const p2 = extractPos(T02);
    const p3 = extractPos(T03);

    // Analytical Linear Velocity Jacobian J_v (3x3): dp3 / d(t1, t2, t3)
    const r = L2 * Math.cos(t2) + L3 * Math.cos(t2 + t3);
    const dr_dt2 = -L2 * Math.sin(t2) - L3 * Math.sin(t2 + t3);
    const dr_dt3 = -L3 * Math.sin(t2 + t3);
    const dz_dt2 = L2 * Math.cos(t2) + L3 * Math.cos(t2 + t3);
    const dz_dt3 = L3 * Math.cos(t2 + t3);

    const J = [
      [cleanZero(-r * Math.sin(t1)), cleanZero(dr_dt2 * Math.cos(t1)), cleanZero(dr_dt3 * Math.cos(t1))],
      [cleanZero(r * Math.cos(t1)), cleanZero(dr_dt2 * Math.sin(t1)), cleanZero(dr_dt3 * Math.sin(t1))],
      [0, cleanZero(dz_dt2), cleanZero(dz_dt3)]
    ];

    const JJT = matMul(J, transpose(J));
    const manipEig = jacobiSymmetricEigen(JJT);

    return {
      p0, p1, p2, p3,
      T01, T02: T02_el, T03,
      R01: extractRot(T01),
      R02: extractRot(T02_el),
      R03: extractRot(T03),
      J,
      detJ: det(J),
      rankJ: rank(J),
      JJT,
      manipEig
    };
  }

  global.LAMath = {
    EPS,
    cleanZero,
    fmt,
    fmtFrac,
    cloneMat,
    zeros,
    identity,
    vecAdd,
    vecSub,
    vecScale,
    dot,
    cross,
    norm,
    normalize,
    angleDeg,
    transpose,
    matAdd,
    matScale,
    matMul,
    matVec,
    matPow,
    trace,
    inversionCount,
    allPermutations,
    subMatrix,
    det,
    minor,
    cofactor,
    adjugate,
    inverse,
    gaussJordanSteps,
    rank,
    solveLinearSystem,
    nullSpaceBasis,
    gramSchmidt,
    jacobiSymmetricEigen,
    isSymmetric,
    isOrthogonal,
    eigen3x3,
    analyzeQuadraticForm,
    rotX,
    rotY,
    rotZ,
    makeSE3,
    robot3DOFKinematics
  };
})(window);
