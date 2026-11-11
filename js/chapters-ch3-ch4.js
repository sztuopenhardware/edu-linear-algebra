/**
 * 第三章：向量 (5个实验案例) & 第四章：线性方程组 (5个实验案例)
 * 严格对应深圳技术大学 SG01047《线性代数》教学大纲第 8–13 周全部知识点
 */
(function (global) {
  'use strict';

  const M = global.LAMath;
  const UI = global.LAUI;

  const CHAPTER_3 = {
    id: 'ch3',
    code: '第三章',
    title: '第三章：向量 (Vectors)',
    weeks: '第 8–9 周 · 5 学时',
    summary: '掌握 n 维向量线性运算、线性组合与向量组等价、线性相关性判定、极大线性无关组与秩、向量空间的基与坐标变换。',
    cases: [
      // ==================== 3.1 ====================
      {
        id: 'ch3-linear-ops',
        code: '3.1',
        title: 'n 维向量概念与空间线性运算（平行四边形与首尾相接法则）',
        week: '第 8 周',
        obeLevel: '掌握',
        syllabusPoint: 'n 维向量的定义，向量的加法与数乘线性运算规则及三维几何合成。',
        roboticsContext: '移动机器人多段空间位移合成与力向量叠加。',
        mount(ctx) {
          const { scene, controlsEl, mathEl } = ctx;
          scene.customTickCallback = null;

          let u = [2.0, 0.5, 1.0];
          let v = [0.4, 2.0, 1.2];
          let k1 = 1.0, k2 = 1.0;
          let ruleMode = 'para'; // 'para' | 'tri'

          function rebuild() {
            scene.clear();
            const ku = M.vecScale(u, k1);
            const kv = M.vecScale(v, k2);
            const sum = M.vecAdd(ku, kv);
            const diff = M.vecSub(ku, kv);

            scene.addArrow([0, 0, 0], u, 'rgba(248,113,113,0.35)', { dashed: true });
            scene.addArrow([0, 0, 0], v, 'rgba(52,211,153,0.35)', { dashed: true });

            scene.addArrow([0, 0, 0], ku, '#f87171', { label: `k₁α = (${M.fmt(ku[0])},${M.fmt(ku[1])},${M.fmt(ku[2])})` });
            if (ruleMode === 'para') {
              scene.addArrow([0, 0, 0], kv, '#34d399', { label: `k₂β = (${M.fmt(kv[0])},${M.fmt(kv[1])},${M.fmt(kv[2])})` });
              scene.addQuad([0, 0, 0], ku, sum, kv, '#38bdf8', { opacity: 0.22 });
              scene.addDashedLine(ku, sum, '#34d399', 1.8);
              scene.addDashedLine(kv, sum, '#f87171', 1.8);
              // Also show difference diagonal optionally
              scene.addDashedLine(kv, ku, '#a78bfa', 1.5);
            } else {
              // Triangle tip-to-tail law: start kv from tip of ku!
              scene.addArrow(ku, sum, '#34d399', { label: '+ k₂β (首尾相接)' });
            }
            scene.addArrow([0, 0, 0], sum, '#fbbf24', {
              label: `w = k₁α + k₂β (${M.fmt(sum[0])},${M.fmt(sum[1])},${M.fmt(sum[2])})`,
              showProjections: true
            });

            mathEl.innerHTML = `
              ${UI.kpiGridHtml([
                { label: '线性运算结果 w', value: `(${M.fmt(sum[0])}, ${M.fmt(sum[1])}, ${M.fmt(sum[2])})ᵀ`, color: '#fbbf24', sub: `模长 ||w|| = ${M.fmt(M.norm(sum), 3)}` },
                { label: '差向量 k₁α − k₂β', value: `(${M.fmt(diff[0])}, ${M.fmt(diff[1])}, ${M.fmt(diff[2])})ᵀ`, color: '#a78bfa', sub: '平行四边形另一对角线' }
              ])}
              <div class="math-flex-row">
                <div>${UI.vecHtml(u, 'α', '#f87171')}</div>
                <div>${UI.vecHtml(v, 'β', '#34d399')}</div>
                <div>${UI.vecHtml(sum, 'k₁α+k₂β', '#fbbf24')}</div>
              </div>
              ${UI.formulaBoxHtml('向量线性运算分量法则（八条运算律满足线性空间公理）', `
                <div class="math-line">k₁α + k₂β = (${M.fmt(k1)})α + (${M.fmt(k2)})β = <b>[${M.fmt(ku[0])} + (${M.fmt(kv[0])}), ${M.fmt(ku[1])} + (${M.fmt(kv[1])}), ${M.fmt(ku[2])} + (${M.fmt(kv[2])})]ᵀ</b></div>
              `, 'accent')}
            `;
          }

          function buildControls() {
            controlsEl.innerHTML = '';
            UI.mountToggleGroup(controlsEl, '几何合成法则切换', [
              { label: '平行四边形法则', value: 'para' },
              { label: '三角形首尾相接法则', value: 'tri' }
            ], ruleMode, val => { ruleMode = val; rebuild(); });

            UI.mountSlider(controlsEl, { label: '数乘系数 k₁ (作用于 α)', min: -2.0, max: 2.0, step: 0.1, value: k1, color: '#f87171', onChange: val => { k1 = val; rebuild(); } });
            UI.mountSlider(controlsEl, { label: '数乘系数 k₂ (作用于 β)', min: -2.0, max: 2.0, step: 0.1, value: k2, color: '#34d399', onChange: val => { k2 = val; rebuild(); } });

            const matUV = [
              [u[0], v[0]],
              [u[1], v[1]],
              [u[2], v[2]]
            ];
            UI.mountMatrixEditor(controlsEl, matUV, m => {
              u = [m[0][0], m[1][0], m[2][0]];
              v = [m[0][1], m[1][1], m[2][1]];
              rebuild();
            }, { title: '编辑列向量 [α, β]', colLabels: ['α', 'β'], step: 0.5 });
          }

          buildControls();
          rebuild();
        }
      },

      // ==================== 3.2 ====================
      {
        id: 'ch3-comb-equiv',
        code: '3.2',
        title: '线性组合、线性表示与向量组的等价',
        week: '第 8 周',
        obeLevel: '掌握 & 理解',
        syllabusPoint: '向量 β 可由 α₁…α_m 线性表示 ⟺ r(A) = r(A, β)；两向量组等价 ⟺ r(A) = r(B) = r(A, B)（张成同一子空间）。',
        roboticsContext: '冗余执行器推力分配（判断目标力矩是否落在推进器张成子空间内）。',
        mount(ctx) {
          const { scene, controlsEl, mathEl } = ctx;
          scene.customTickCallback = null;

          let mode = 'span'; // 'span' | 'equiv'
          // Columns: alpha1, alpha2, alpha3, beta
          let M4 = [
            [2, 0, 1, 3],
            [0, 2, 1, 2],
            [1, 1, 1, 2]
          ];

          const presets = [
            { name: '唯一线性表示 (r(A)=r(A,β)=3)', mat: [[2, 0, 1, 3], [0, 2, 1, 2], [1, 1, 1, 2]] },
            { name: '无穷多表示法 (r(A)=r(A,β)=2)', mat: [[2, 0, 2, 3], [0, 2, 2, 1], [1, 1, 2, 2]] },
            { name: '不可线性表示! (r(A)=2 < r(A,β)=3)', mat: [[2, 0, 2, 1], [0, 2, 2, 1], [0, 0, 0, 2.5]] }
          ];

          function rebuild() {
            scene.clear();
            if (mode === 'equiv') {
              // Show two different vector groups A = {a1, a2} and B = {b1, b2} spanning the EXACT same tilted plane z = 0.5x + 0.5y!
              const a1 = [2, 0, 1], a2 = [0, 2, 1];
              const b1 = [1.5, 1.5, 1.5], b2 = [1.5, -1.5, 0];
              const normal = M.cross(a1, a2); // [-2, -2, 4] -> x + y - 2z = 0
              scene.addPlane(normal, 0, '#38bdf8', { opacity: 0.22, label: '公共张成空间 Span(A) = Span(B)' });
              scene.addArrow([0, 0, 0], a1, '#f87171', { label: '组A: α₁' });
              scene.addArrow([0, 0, 0], a2, '#fb7185', { label: '组A: α₂' });
              scene.addArrow([0, 0, 0], b1, '#34d399', { label: '组B: β₁' });
              scene.addArrow([0, 0, 0], b2, '#10b981', { label: '组B: β₂' });

              const matAB = [
                [a1[0], a2[0], b1[0], b2[0]],
                [a1[1], a2[1], b1[1], b2[1]],
                [a1[2], a2[2], b1[2], b2[2]]
              ];
              mathEl.innerHTML = `
                ${UI.kpiGridHtml([
                  { label: '秩等式判定', value: 'r(A)=r(B)=r(A,B)=2', color: '#34d399', sub: '向量组 A 与 B 等价！' },
                  { label: '几何本质', value: '同一张二维子平面', color: '#38bdf8', sub: '两组基可相互线性表示' }
                ])}
                <div class="math-block-center">${UI.matHtml(matAB, { augCol: 2, label: '[A | B]' })}</div>
                ${UI.formulaBoxHtml('向量组等价核心定理', `
                  <div class="math-line">向量组 A: {α₁, α₂}（红色）与向量组 B: {β₁, β₂}（绿色）虽然方向不同，但均落在平面 x + y − 2z = 0 内，彼此可相互线性表示，满足 <strong>r(A) = r(B) = r(A, B) = 2</strong>！</div>
                `, 'accent')}
              `;
              return;
            }

            const A = M4.map(r => r.slice(0, 3));
            const beta = M4.map(r => r[3]);
            const cols = M.transpose(A);
            const sol = M.solveLinearSystem(A, beta);

            // If rank(A) == 2, draw the span plane of A!
            if (sol.rankA === 2) {
              let nVec = M.cross(cols[0], cols[1]);
              if (M.norm(nVec) < 1e-5) nVec = M.cross(cols[0], cols[2]);
              scene.addPlane(nVec, 0, '#38bdf8', { opacity: 0.20, label: 'Span{α₁,α₂,α₃}' });
            }

            scene.addArrow([0, 0, 0], cols[0], '#f87171', { label: 'α₁' });
            scene.addArrow([0, 0, 0], cols[1], '#34d399', { label: 'α₂' });
            scene.addArrow([0, 0, 0], cols[2], '#a78bfa', { label: 'α₃' });
            scene.addArrow([0, 0, 0], beta, '#fbbf24', { label: '目标 β', showProjections: true });

            if (sol.status !== 'none') {
              const x = sol.particular;
              const p1 = M.vecScale(cols[0], x[0]);
              const p2 = M.vecAdd(p1, M.vecScale(cols[1], x[1]));
              const p3 = M.vecAdd(p2, M.vecScale(cols[2], x[2]));
              scene.addDashedLine([0, 0, 0], p1, '#f87171', 2.2);
              scene.addDashedLine(p1, p2, '#34d399', 2.2);
              scene.addDashedLine(p2, p3, '#a78bfa', 2.2);
              scene.addSphere(p3, 0.12, '#fbbf24');
            }

            const statusMap = {
              unique: { txt: '可唯一线性表示', col: '#34d399' },
              infinite: { txt: '可线性表示（表示法不唯一）', col: '#38bdf8' },
              none: { txt: '不可线性表示（β 逃出张成子空间！）', col: '#f43f5e' }
            }[sol.status];

            mathEl.innerHTML = `
              ${UI.kpiGridHtml([
                { label: '秩对比 r(A) vs r(A, β)', value: `${sol.rankA} vs ${sol.rankAug}`, color: statusMap.col, sub: statusMap.txt },
                { label: '表示系数 (x₁, x₂, x₃)', value: sol.particular ? `(${M.fmtFrac(sol.particular[0])}, ${M.fmtFrac(sol.particular[1])}, ${M.fmtFrac(sol.particular[2])})` : '无解', color: '#fbbf24', sub: sol.status === 'infinite' ? '含自由参数通解' : 'β = x₁α₁ + x₂α₂ + x₃α₃' }
              ])}
              <div class="math-flex-row">
                <div>${UI.matHtml(M4, { augCol: 3, label: '[A | β]' })}</div>
                <div>${UI.matHtml(sol.gj.rrefMatrix, { augCol: 3, pivots: sol.gj.pivots, label: '行最简形' })}</div>
              </div>
              ${UI.formulaBoxHtml('线性表示判定充要条件', sol.status !== 'none'
                ? `<div class="math-line">因 <b>r(A) = r(A, β) = ${sol.rankA}</b>，目标向量 β 落在 {α₁, α₂, α₃} 张成空间内：β = (${M.fmtFrac(sol.particular[0])})α₁ + (${M.fmtFrac(sol.particular[1])})α₂ + (${M.fmtFrac(sol.particular[2])})α₃。</div>`
                : `<div class="math-line">因 <b>r(A) = ${sol.rankA} &lt; r(A, β) = ${sol.rankAug}</b>，向量组 α₁, α₂, α₃ 被困在蓝色二维平面内，无法合成离开该平面的黄色向量 β！</div>`,
              sol.status !== 'none' ? 'accent' : 'warn')}
            `;
          }

          function buildControls() {
            controlsEl.innerHTML = '';
            UI.mountToggleGroup(controlsEl, '选择知识点实验', [
              { label: '向量线性表示 β = Σxᵢαᵢ', value: 'span' },
              { label: '向量组等价 Span(A)=Span(B)', value: 'equiv' }
            ], mode, v => { mode = v; buildControls(); rebuild(); });

            if (mode === 'span') {
              UI.mountPresets(controlsEl, presets, p => {
                M4 = M.cloneMat(p.mat);
                buildControls();
                rebuild();
              }, -1);

              UI.mountMatrixEditor(controlsEl, M4, () => rebuild(), {
                title: '编辑 [α₁, α₂, α₃ | β]',
                augCol: 3,
                colLabels: ['α₁', 'α₂', 'α₃', 'β'],
                step: 0.5
              });
            }
          }

          buildControls();
          rebuild();
        }
      },

      // ==================== 3.3 ====================
      {
        id: 'ch3-dep-indep',
        code: '3.3',
        title: '向量组线性相关与线性无关判定及零和回路',
        week: '第 8–9 周',
        obeLevel: '掌握（核心概念）',
        syllabusPoint: '线性相关与线性无关定义、本质区别，利用矩阵的秩 r(A) < m 或齐次方程组非零解判定线性相关性。',
        roboticsContext: '并联机构支链运动学独立性与冗余约束检测。',
        mount(ctx) {
          const { scene, controlsEl, mathEl } = ctx;
          scene.customTickCallback = null;

          // 3 vectors as columns of 3x3 matrix A
          let A = [
            [2, 0.5, 2.5],
            [0.5, 2, 2.5],
            [0.5, 1, 1.5]
          ];

          const presets = [
            { name: '线性相关：三向量共面 (r=2<3)', mat: [[2, 0.5, 2.5], [0.5, 2, 2.5], [0.5, 1, 1.5]] },
            { name: '线性无关：三维不共面 (r=3)', mat: [[2, 0, 0.4], [0, 2, 0.4], [0.2, 0.2, 2]] },
            { name: '线性相关：含共线成比例 (r=2)', mat: [[1.5, 3.0, 0.5], [1.0, 2.0, 1.5], [0.5, 1.0, 2.0]] }
          ];

          function rebuild() {
            scene.clear();
            const cols = M.transpose(A);
            const hom = M.solveLinearSystem(A, [0, 0, 0]);
            const indep = hom.rankA === 3;

            scene.addArrow([0, 0, 0], cols[0], '#f87171', { label: 'α₁' });
            scene.addArrow([0, 0, 0], cols[1], '#34d399', { label: 'α₂' });
            scene.addArrow([0, 0, 0], cols[2], '#60a5fa', { label: 'α₃' });

            if (indep) {
              scene.addParallelepiped(cols[0], cols[1], cols[2], '#34d399', { opacity: 0.24 });
            } else {
              // Coplanar or collinear! Draw plane if rank == 2
              let nVec = M.cross(cols[0], cols[1]);
              if (M.norm(nVec) < 1e-5) nVec = M.cross(cols[0], cols[2]);
              if (M.norm(nVec) > 1e-5) {
                scene.addPlane(nVec, 0, '#f43f5e', { opacity: 0.20, label: '共面退化平面 (det=0)' });
              }
              // Draw non-zero closed polygon loop k1*a1 + k2*a2 + k3*a3 = 0!
              if (hom.basis.length > 0) {
                const k = hom.basis[0];
                const p1 = M.vecScale(cols[0], k[0]);
                const p2 = M.vecAdd(p1, M.vecScale(cols[1], k[1]));
                scene.addDashedLine([0, 0, 0], p1, '#fbbf24', 2.4);
                scene.addDashedLine(p1, p2, '#fbbf24', 2.4);
                scene.addDashedLine(p2, [0, 0, 0], '#fbbf24', 2.4);
                scene.addLabel(p1, `非零组合闭合回原点!`, { color: '#fbbf24' });
              }
            }

            const kVec = hom.basis[0] || [0, 0, 0];
            mathEl.innerHTML = `
              ${UI.kpiGridHtml([
                { label: '相关性判定结果', value: indep ? '线性无关' : '线性相关', color: indep ? '#34d399' : '#f43f5e', sub: `向量个数 m = 3，秩 r(A) = ${hom.rankA}` },
                { label: '行列式 |A| 判据', value: M.fmt(M.det(A), 3), sub: indep ? '|A| ≠ 0 ⟺ 线性无关' : '|A| = 0 ⟺ 线性相关' }
              ])}
              <div class="math-flex-row">
                <div>${UI.matHtml(A, { label: 'A=[α₁,α₂,α₃]' })}</div>
                <div>${UI.matHtml(hom.gj.rrefMatrix, { pivots: hom.gj.pivots, label: 'RREF' })}</div>
              </div>
              ${indep ? UI.formulaBoxHtml('线性无关本质：k₁α₁ + k₂α₂ + k₃α₃ = 0 仅有零解 k₁=k₂=k₃=0', `
                <div class="math-line">三个向量张成非退化三维平行六面体（体积 ${M.fmt(Math.abs(M.det(A)), 2)} &gt; 0），没有任何一个向量可由其余向量线性表示。</div>
              `, 'accent') : UI.formulaBoxHtml('线性相关本质：存在不全为零的系数使线性组合回到原点 0！', `
                <div class="math-line">求得齐次方程 Ax = 0 的非零解：<b>k = (${M.fmtFrac(kVec[0])}, ${M.fmtFrac(kVec[1])}, ${M.fmtFrac(kVec[2])})ᵀ ≠ 0</b></div>
                <div class="math-line">即 <strong>(${M.fmtFrac(kVec[0])})α₁ + (${M.fmtFrac(kVec[1])})α₂ + (${M.fmtFrac(kVec[2])})α₃ = 0</strong>（图中金色虚线构成闭合回路，体积坍缩为 0）！</div>
              `, 'warn')}
            `;
          }

          function buildControls() {
            controlsEl.innerHTML = '';
            UI.mountPresets(controlsEl, presets, p => {
              A = M.cloneMat(p.mat);
              buildControls();
              rebuild();
            }, 0);
            UI.mountMatrixEditor(controlsEl, A, () => rebuild(), {
              title: '编辑向量组矩阵 [α₁, α₂, α₃]',
              colLabels: ['α₁', 'α₂', 'α₃'],
              step: 0.5
            });
          }

          buildControls();
          rebuild();
        }
      },

      // ==================== 3.4 ====================
      {
        id: 'ch3-max-indep',
        code: '3.4',
        title: '极大线性无关组与向量组的秩（主元列筛选法）',
        week: '第 9 周',
        obeLevel: '掌握（必考算法）',
        syllabusPoint: '极大线性无关组定义，利用初等行变换将矩阵化为行最简形提取极大无关组，并将其余向量由极大无关组线性表示。',
        roboticsContext: '多传感器冗余特征降维与核心独立观测向量甄别。',
        mount(ctx) {
          const { scene, controlsEl, mathEl } = ctx;
          scene.customTickCallback = null;

          // 3 x 4 matrix: 4 vectors in R^3
          let A = [
            [1, 2, 0, 2],
            [0, 0, 1, 2],
            [1, 2, 1, 4]
          ];

          const presets = [
            { name: '4 向量秩 r=2（含2个冗余向量）', mat: [[1, 2, 0, 2], [0, 0, 1, 2], [1, 2, 1, 4]] },
            { name: '4 向量满秩 r=3（3个构成基）', mat: [[2, 0, 1, 3], [0, 2, 1, 2], [0, 0, 2, 2]] },
            { name: '全共线秩 r=1（极大组仅1个）', mat: [[1, 2, -1, 1.5], [1, 2, -1, 1.5], [0.5, 1, -0.5, 0.75]] }
          ];

          function rebuild() {
            scene.clear();
            const gj = M.gaussJordanSteps(A);
            const R = gj.rrefMatrix;
            const pivotSet = new Set(gj.pivotCols);
            const cols = M.transpose(A);

            // If rank == 2, draw the 2D subspace spanned by the 2 pivot vectors
            if (gj.rank === 2) {
              const p0 = cols[gj.pivotCols[0]], p1 = cols[gj.pivotCols[1]];
              scene.addPlane(M.cross(p0, p1), 0, '#38bdf8', { opacity: 0.18, label: '极大无关组张成平面' });
            }

            const palette = ['#f87171', '#34d399', '#60a5fa', '#fbbf24'];
            cols.forEach((v, j) => {
              const isPivot = pivotSet.has(j);
              if (isPivot) {
                scene.addArrow([0, 0, 0], v, palette[j], {
                  label: `★ α${j + 1} (极大组基)`,
                  shaftRadius: 0.052
                });
              } else {
                scene.addArrow([0, 0, 0], v, palette[j], {
                  dashed: true,
                  label: `α${j + 1} (冗余可表出)`
                });
              }
            });

            // Build linear expression of non-pivot columns from RREF directly! (Key textbook theorem: column relations are invariant under row ops!)
            const exprLines = [];
            for (let j = 0; j < cols.length; j++) {
              if (pivotSet.has(j)) continue;
              const terms = [];
              gj.pivots.forEach(([pr, pc]) => {
                const coeff = R[pr][j];
                if (Math.abs(coeff) > 1e-7) {
                  terms.push(`(${M.fmtFrac(coeff)})α<sub>${pc + 1}</sub>`);
                }
              });
              exprLines.push(`α<sub>${j + 1}</sub> = ${terms.length ? terms.join(' + ') : '0'}`);
            }

            const maxGroupStr = gj.pivotCols.map(c => `α<sub>${c + 1}</sub>`).join(', ');
            mathEl.innerHTML = `
              ${UI.kpiGridHtml([
                { label: '向量组的秩 r', value: `r = ${gj.rank}`, color: '#38bdf8', sub: `主元列标：${gj.pivotCols.map(c => c + 1).join(', ')}` },
                { label: '选定极大线性无关组', value: `{ ${gj.pivotCols.map(c => 'α' + (c + 1)).join(', ')} }`, color: '#34d399', sub: '实线高亮箭头（剔除虚线冗余向量）' }
              ])}
              <div class="math-flex-row">
                <div>${UI.matHtml(A, { label: 'A' })}</div>
                <div>${UI.matHtml(R, { pivots: gj.pivots, label: '行最简形 RREF' })}</div>
              </div>
              ${UI.formulaBoxHtml('核心黄金定理：初等行变换不改变列向量间的线性依赖关系！', `
                <div class="math-line">1. 化 A 为行最简形 RREF，主元所在列对应原向量 <strong>{ ${maxGroupStr} }</strong> 即为一个极大线性无关组；</div>
                <div class="math-line">2. 直接从 RREF 非主元列读出其余向量的表示系数：<br>${exprLines.map(l => `<b>${l}</b>`).join(' ； ')}</div>
              `, 'accent')}
            `;
          }

          function buildControls() {
            controlsEl.innerHTML = '';
            UI.mountPresets(controlsEl, presets, p => {
              A = M.cloneMat(p.mat);
              buildControls();
              rebuild();
            }, 0);
            UI.mountMatrixEditor(controlsEl, A, () => rebuild(), {
              title: '编辑 4 向量矩阵 [α₁, α₂, α₃, α₄]',
              colLabels: ['α₁', 'α₂', 'α₃', 'α₄'],
              step: 0.5
            });
          }

          buildControls();
          rebuild();
        }
      },

      // ==================== 3.5 ====================
      {
        id: 'ch3-space-coord',
        code: '3.5',
        title: '向量空间、基、维数与自定义基下的坐标变换',
        week: '第 9 周',
        obeLevel: '掌握',
        syllabusPoint: '向量空间与子空间定义，基与维数概念，求向量在给定基下的坐标 [v]_B = P⁻¹v 及基变换公式。',
        roboticsContext: '世界坐标系 {W} 与机器人本体/相机斜交或旋转坐标系 {B} 间的坐标转换。',
        mount(ctx) {
          const { scene, controlsEl, mathEl } = ctx;
          scene.customTickCallback = null;

          // Transition matrix P = [b1, b2, b3]
          let P = [
            [1.5, 0.5, 0],
            [0.3, 1.4, 0.3],
            [0, 0.3, 1.3]
          ];
          let vWorld = [2.0, 2.0, 1.6];

          function rebuild() {
            scene.clear();
            const colsB = M.transpose(P);
            const PInv = M.inverse(P);
            const isBasis = PInv !== null;

            // Custom basis grid in amber/cyan
            scene.addTransformedGrid(P, { range: 2, color: 'rgba(251, 191, 36, 0.28)' });
            scene.addArrow([0, 0, 0], colsB[0], '#fbbf24', { label: '新基 b₁' });
            scene.addArrow([0, 0, 0], colsB[1], '#f59e0b', { label: '新基 b₂' });
            scene.addArrow([0, 0, 0], colsB[2], '#d97706', { label: '新基 b₃' });

            // Fixed geometric vector v
            scene.addArrow([0, 0, 0], vWorld, '#38bdf8', {
              label: `空间向量 v`,
              shaftRadius: 0.052,
              showProjections: true
            });

            let coordB = null;
            if (isBasis) {
              coordB = M.matVec(PInv, vWorld);
              const p1 = M.vecScale(colsB[0], coordB[0]);
              const p2 = M.vecAdd(p1, M.vecScale(colsB[1], coordB[1]));
              const p3 = M.vecAdd(p2, M.vecScale(colsB[2], coordB[2]));
              scene.addDashedLine([0, 0, 0], p1, '#fbbf24', 2.2);
              scene.addDashedLine(p1, p2, '#fbbf24', 2.2);
              scene.addDashedLine(p2, p3, '#fbbf24', 2.2);
            }

            mathEl.innerHTML = `
              ${UI.kpiGridHtml([
                { label: '自然基坐标 [v]_E', value: `(${M.fmt(vWorld[0])}, ${M.fmt(vWorld[1])}, ${M.fmt(vWorld[2])})ᵀ`, color: '#38bdf8', sub: 'v = x₁e₁ + x₂e₂ + x₃e₃' },
                { label: '新基 B 下坐标 [v]_B', value: isBasis ? `(${M.fmt(coordB[0], 2)}, ${M.fmt(coordB[1], 2)}, ${M.fmt(coordB[2], 2)})ᵀ` : 'b₁,b₂,b₃ 退化非基！', color: isBasis ? '#fbbf24' : '#f43f5e', sub: isBasis ? '[v]_B = P⁻¹ [v]_E' : 'det(P)=0 不构成三维基' }
              ])}
              <div class="math-flex-row">
                <div>${UI.matHtml(P, { label: '过渡矩阵 P=[b₁,b₂,b₃]', frac: false })}</div>
                ${isBasis ? `<div>${UI.matHtml(PInv, { label: 'P⁻¹', frac: false })}</div>` : ''}
              </div>
              ${isBasis ? UI.formulaBoxHtml('不变量哲学：向量 v 本身在三维空间静止不动，改变基只改变它的坐标读数！', `
                <div class="math-line">验证分解：<b>(${M.fmt(coordB[0])})b₁ + (${M.fmt(coordB[1])})b₂ + (${M.fmt(coordB[2])})b₃ = (${M.fmt(vWorld[0])}, ${M.fmt(vWorld[1])}, ${M.fmt(vWorld[2])})ᵀ = v</b>（金色虚线折线精确抵达蓝色向量尖端！）</div>
              `, 'accent') : UI.formulaBoxHtml('基的条件警示', '三维空间 ℝ³ 的基必须由 3 个线性无关向量组成（|P| ≠ 0）。', 'warn')}
            `;
          }

          function buildControls() {
            controlsEl.innerHTML = '';
            UI.mountSlider(controlsEl, { label: '空间向量 v_x', min: -3, max: 3, step: 0.2, value: vWorld[0], color: '#38bdf8', onChange: v => { vWorld[0] = v; rebuild(); } });
            UI.mountSlider(controlsEl, { label: '空间向量 v_y', min: -3, max: 3, step: 0.2, value: vWorld[1], color: '#38bdf8', onChange: v => { vWorld[1] = v; rebuild(); } });
            UI.mountSlider(controlsEl, { label: '空间向量 v_z', min: -3, max: 3, step: 0.2, value: vWorld[2], color: '#38bdf8', onChange: v => { vWorld[2] = v; rebuild(); } });

            UI.mountMatrixEditor(controlsEl, P, () => rebuild(), {
              title: '编辑新基矩阵 P = [b₁, b₂, b₃]',
              colLabels: ['b₁', 'b₂', 'b₃'],
              step: 0.2
            });
          }

          buildControls();
          rebuild();
        }
      }
    ]
  };

  const CHAPTER_4 = {
    id: 'ch4',
    code: '第四章',
    title: '第四章：线性方程组 (Systems of Linear Equations)',
    weeks: '第 11–13 周 · 7.5 学时',
    summary: '深入掌握高斯消元法、秩对线性方程组解的判定、齐次方程组基础解系与零空间、非齐次通解仿射结构及两方程组公共解。',
    cases: [
      // ==================== 4.1 ====================
      {
        id: 'ch4-gauss-elim',
        code: '4.1',
        title: '线性方程组矩阵表示与高斯消元三维平面动态解耦',
        week: '第 11 周',
        obeLevel: '掌握（核心方法）',
        syllabusPoint: '系数矩阵 A 与增广矩阵 [A | b]，高斯消元法化行阶梯形（REF）与行最简形（RREF）求解全过程。',
        roboticsContext: '观察初等行变换如何在保持公共交点不变的前提下，将斜交平面旋转解耦为坐标轴正交平面！',
        mount(ctx) {
          const { scene, controlsEl, mathEl } = ctx;
          scene.customTickCallback = null;

          let aug = [
            [1, 1, 1, 3],
            [2, 1, -1, 1],
            [1, -1, 2, 2]
          ];
          let stepIdx = 0;

          function rebuild() {
            scene.clear();
            const gj = M.gaussJordanSteps(aug, 3);
            stepIdx = Math.max(0, Math.min(stepIdx, gj.steps.length - 1));
            const cur = gj.steps[stepIdx];
            const curM = cur.matrix;
            const sol = M.solveLinearSystem(aug.map(r => r.slice(0, 3)), aug.map(r => r[3]));

            const pCols = ['#38bdf8', '#34d399', '#f472b6'];
            for (let i = 0; i < 3; i++) {
              scene.addPlane(curM[i].slice(0, 3), curM[i][3], pCols[i], {
                opacity: 0.25,
                label: `方程 ${i + 1}`
              });
            }
            scene.addPlaneIntersection(curM[0].slice(0, 3), curM[0][3], curM[1].slice(0, 3), curM[1][3], '#94a3b8', { radius: 0.025 });
            scene.addPlaneIntersection(curM[1].slice(0, 3), curM[1][3], curM[2].slice(0, 3), curM[2][3], '#94a3b8', { radius: 0.025 });

            if (sol.status === 'unique') {
              scene.addSphere(sol.particular, 0.16, '#fbbf24', {
                label: `不动交点 (${M.fmt(sol.particular[0])}, ${M.fmt(sol.particular[1])}, ${M.fmt(sol.particular[2])})`
              });
            }

            const eqHtml = curM.map((r, idx) =>
              `<div class="eq-row" style="border-left:3px solid ${pCols[idx]};padding-left:8px;">(${M.fmtFrac(r[0])})x₁ + (${M.fmtFrac(r[1])})x₂ + (${M.fmtFrac(r[2])})x₃ = <b>${M.fmtFrac(r[3])}</b></div>`
            ).join('');

            mathEl.innerHTML = `
              ${UI.kpiGridHtml([
                { label: `消元步骤 (${stepIdx} / ${gj.steps.length - 1})`, value: cur.title, color: '#38bdf8', sub: cur.desc },
                { label: '方程组解', value: sol.status === 'unique' ? `(${M.fmtFrac(sol.particular[0])}, ${M.fmtFrac(sol.particular[1])}, ${M.fmtFrac(sol.particular[2])})` : sol.status, color: '#fbbf24', sub: '同解变形：交点位置恒定不变！' }
              ])}
              <div class="math-flex-row">
                <div>${UI.matHtml(curM, { augCol: 3, pivots: cur.pivots, label: '[A | b]' })}</div>
                <div class="eq-system-box">${eqHtml}</div>
              </div>
              ${UI.formulaBoxHtml('高斯-约旦消元的几何奇迹', `
                <div class="math-line">点击左侧“下一步 ▶”：每做一次倍加消元，对应平面就<strong>绕着公共交线旋转</strong>，直到末步 RREF 变成三张平行于坐标面的正交平面 <b>x₁=${sol.particular ? M.fmtFrac(sol.particular[0]) : '?'}, x₂=${sol.particular ? M.fmtFrac(sol.particular[1]) : '?'}, x₃=${sol.particular ? M.fmtFrac(sol.particular[2]) : '?'}</b>，直接读出交点坐标！</div>
              `, 'accent')}
            `;
          }

          function buildControls() {
            controlsEl.innerHTML = '';
            const gj = M.gaussJordanSteps(aug, 3);
            const barWrap = document.createElement('div');
            barWrap.innerHTML = `<div class="control-group-title">高斯消元分步播放器（共 ${gj.steps.length - 1} 步）</div>`;
            const bar = document.createElement('div');
            bar.className = 'preset-bar';
            [
              ['⏮ 初始方程组', () => { stepIdx = 0; rebuild(); }],
              ['◀ 上一步', () => { stepIdx = Math.max(0, stepIdx - 1); rebuild(); }],
              ['下一步 ▶', () => { stepIdx = Math.min(M.gaussJordanSteps(aug, 3).steps.length - 1, stepIdx + 1); rebuild(); }],
              ['化行阶梯形 REF', () => { stepIdx = M.gaussJordanSteps(aug, 3).refStepIndex; rebuild(); }],
              ['⏭ 行最简形 RREF', () => { stepIdx = M.gaussJordanSteps(aug, 3).steps.length - 1; rebuild(); }]
            ].forEach(([lbl, fn]) => {
              const b = document.createElement('button');
              b.type = 'button';
              b.className = 'preset-btn';
              b.textContent = lbl;
              b.addEventListener('click', fn);
              bar.appendChild(b);
            });
            barWrap.appendChild(bar);
            controlsEl.appendChild(barWrap);

            UI.mountMatrixEditor(controlsEl, aug, () => {
              stepIdx = 0;
              buildControls();
              rebuild();
            }, {
              title: '编辑增广矩阵 [A | b]',
              augCol: 3,
              colLabels: ['x₁', 'x₂', 'x₃', 'b'],
              step: 1
            });
          }

          buildControls();
          rebuild();
        }
      },

      // ==================== 4.2 ====================
      {
        id: 'ch4-rank-judge',
        code: '4.2',
        title: '线性方程组解的判定定理（三维三平面全 6 种构型图谱）',
        week: '第 11–12 周',
        obeLevel: '掌握（核心定理）',
        syllabusPoint: '利用系数矩阵秩 r(A) 与增广矩阵秩 r(A, b) 判定无解、唯一解、无穷多解的充要条件。',
        roboticsContext: '逆运动学约束相容性诊断（无解=目标不可达；无穷多解=冗余自由度自运动流形）。',
        mount(ctx) {
          const { scene, controlsEl, mathEl } = ctx;
          scene.customTickCallback = null;

          const configs = [
            {
              name: '① 唯一解 r(A)=r(Ā)=3',
              desc: '三张平面两两不平行，交于空间唯一一点 P*。',
              mat: [[1, 1, 1, 2], [1, -1, 1, 1], [2, 1, -1, 1]]
            },
            {
              name: '② 无穷多解（共线束）r(A)=r(Ā)=2',
              desc: '三张平面像书页一样交于同一条公共直线（n − r = 1 个自由变量）。',
              mat: [[1, 1, 0, 1], [0, 1, 1, 1], [1, 2, 1, 2]]
            },
            {
              name: '③ 无穷多解（三面重合）r(A)=r(Ā)=1',
              desc: '三个方程成比例，三平面完全重合为一张平面（n − r = 2 个自由变量）。',
              mat: [[1, 1, 1, 1.5], [2, 2, 2, 3.0], [-1, -1, -1, -1.5]]
            },
            {
              name: '④ 无解（三棱柱状）r(A)=2 < r(Ā)=3',
              desc: '两两相交于三条互相平行的直线，围成无限长三棱柱，无三面公共点！',
              mat: [[1, 1, 0, 1.2], [0, 1, 1, 1.2], [1, 2, 1, -1.0]]
            },
            {
              name: '⑤ 无解（两平行一斜截）r(A)=2 < r(Ā)=3',
              desc: '平面 1 与平面 2 平行不重合，第三平面同时斜截它们。',
              mat: [[1, 1, 1, 1.8], [1, 1, 1, -1.5], [1, -1, 0, 0]]
            },
            {
              name: '⑥ 无解（三平行平面）r(A)=1 < r(Ā)=2',
              desc: '三张法向量共线但截距互异的平行平面，永不相交。',
              mat: [[1, 1, 1, 2.0], [1, 1, 1, 0.0], [1, 1, 1, -2.0]]
            }
          ];

          let activeIdx = 0;
          let aug = M.cloneMat(configs[0].mat);

          function rebuild() {
            scene.clear();
            const A = aug.map(r => r.slice(0, 3));
            const b = aug.map(r => r[3]);
            const sol = M.solveLinearSystem(A, b);

            const cols = ['#38bdf8', '#34d399', '#f472b6'];
            for (let i = 0; i < 3; i++) {
              // Slight visual offset only when identical planes overlap so student sees multi-plane
              scene.addPlane(A[i], b[i], cols[i], { opacity: 0.25, label: `π${i + 1}` });
            }

            // Draw pairwise intersections
            scene.addPlaneIntersection(A[0], b[0], A[1], b[1], '#fbbf24', { radius: 0.038 });
            scene.addPlaneIntersection(A[1], b[1], A[2], b[2], '#fbbf24', { radius: 0.038 });
            scene.addPlaneIntersection(A[0], b[0], A[2], b[2], '#fbbf24', { radius: 0.038 });

            if (sol.status === 'unique') {
              scene.addSphere(sol.particular, 0.17, '#fbbf24', {
                label: `唯一交点 (${M.fmt(sol.particular[0])},${M.fmt(sol.particular[1])},${M.fmt(sol.particular[2])})`
              });
            } else if (sol.status === 'infinite' && sol.basis.length === 1) {
              const seg = global.LAScene3D.clipLineToBox(sol.particular, sol.basis[0], 3.6);
              if (seg) {
                scene.addCylinder(seg[0], seg[1], 0.065, '#fbbf24', 14);
                scene.addLabel(sol.particular, '无穷多解直线 η* + kξ₁', { color: '#fbbf24' });
              }
            }

            const badge = {
              unique: { txt: '有唯一解', col: '#34d399', rule: `r(A) = r(Ā) = n = 3` },
              infinite: { txt: `有无穷多解 (${3 - sol.rankA} 维流形)`, col: '#38bdf8', rule: `r(A) = r(Ā) = ${sol.rankA} < n = 3` },
              none: { txt: '矛盾方程组（无解）', col: '#f43f5e', rule: `r(A) = ${sol.rankA} ≠ r(Ā) = ${sol.rankAug}` }
            }[sol.status];

            mathEl.innerHTML = `
              ${UI.kpiGridHtml([
                { label: '解的判定结论', value: badge.txt, color: badge.col, sub: badge.rule },
                { label: '自由未知量个数 n − r(A)', value: sol.status === 'none' ? '— (矛盾行 0=d≠0)' : `${3 - sol.rankA} 个`, sub: `r(A)=${sol.rankA}, r(Ā)=${sol.rankAug}` }
              ])}
              <div class="math-flex-row">
                <div>${UI.matHtml(aug, { augCol: 3, label: 'Ā=[A|b]' })}</div>
                <div>${UI.matHtml(sol.gj.rrefMatrix, { augCol: 3, pivots: sol.gj.pivots, label: '行最简形' })}</div>
              </div>
              ${UI.formulaBoxHtml('克罗内克-卡佩利（Kronecker-Capelli）解判定定理', `
                <div class="math-line">${configs[activeIdx] ? configs[activeIdx].desc : '自定义空间三平面构型。'}</div>
                <div class="math-line">• <b>r(A) &lt; r(A, b)</b> ⟺ 出现矛盾方程 0 = 1，<strong>无解</strong>；<br>• <b>r(A) = r(A, b) = n</b> ⟺ <strong>唯一解</strong>；<br>• <b>r(A) = r(A, b) &lt; n</b> ⟺ <strong>无穷多解</strong>（含 n − r 个自由参数）。</div>
              `, sol.status === 'none' ? 'warn' : 'accent')}
            `;
          }

          function buildControls() {
            controlsEl.innerHTML = '';
            UI.mountPresets(controlsEl, configs, (cfg, idx) => {
              activeIdx = idx;
              aug = M.cloneMat(cfg.mat);
              buildControls();
              rebuild();
            }, activeIdx);

            UI.mountMatrixEditor(controlsEl, aug, () => {
              activeIdx = -1;
              rebuild();
            }, { title: '编辑三平面方程 [A | b]', augCol: 3, colLabels: ['x₁', 'x₂', 'x₃', 'b'], step: 0.5 });
          }

          buildControls();
          rebuild();
        }
      },

      // ==================== 4.3 ====================
      {
        id: 'ch4-hom-null',
        code: '4.3',
        title: '齐次线性方程组 Ax = 0 基础解系与零空间 N(A)',
        week: '第 12 周',
        obeLevel: '掌握（必考重点）',
        syllabusPoint: '齐次方程组有非零解充要条件 r(A) < n，基础解系概念与求法，维数公式 dim N(A) = n − r(A)。',
        roboticsContext: '冗余机械臂零空间自运动（末端位姿保持不动 Ax=0，内部关节灵活避障！）。',
        mount(ctx) {
          const { scene, controlsEl, mathEl } = ctx;
          scene.customTickCallback = null;

          let A = [
            [1, 1, -1],
            [2, -1, 1],
            [3, 0, 0]
          ];
          // Wait: let's make default preset cleanly rank 2 so 1D nullspace line, and preset 2 rank 1 so 2D nullspace plane!
          A = [
            [1, -1, -1],
            [2, -2, -2],
            [0, 0, 0]
          ];
          // Even better: rank 2 preset 1, rank 1 preset 2, rank 3 preset 3!
          const presets = [
            { name: '秩 r=2 → 1维零空间直线 (s=1)', mat: [[1, 1, -1], [0, 1, -1], [1, 2, -2]] },
            { name: '秩 r=1 → 2维零空间平面 (s=2)', mat: [[1, 1, 1], [2, 2, 2], [-1, -1, -1]] },
            { name: '满秩 r=3 → 仅有零解原点 (s=0)', mat: [[2, 0, 0], [0, 2, 0], [0, 0, 2]] }
          ];
          A = M.cloneMat(presets[0].mat);
          let k1 = 1.2, k2 = 0.8;

          function rebuild() {
            scene.clear();
            const sol = M.solveLinearSystem(A, [0, 0, 0]);
            const sDim = sol.basis.length;

            // Draw non-zero row vectors (normals!) — notice EVERY x in Null(A) is orthogonal to EVERY row vector of A!!
            A.forEach((row, i) => {
              if (M.norm(row) > 1e-5) {
                scene.addArrow([0, 0, 0], row, '#f43f5e', {
                  label: `行法向 r${i + 1}`,
                  shaftRadius: 0.032,
                  opacity: 0.75
                });
              }
            });

            let curX = [0, 0, 0];
            if (sDim === 0) {
              scene.addSphere([0, 0, 0], 0.16, '#fbbf24', { label: '唯一零解 x = 0' });
            } else if (sDim === 1) {
              const xi1 = sol.basis[0];
              const seg = global.LAScene3D.clipLineToBox([0, 0, 0], xi1, 3.6);
              if (seg) scene.addCylinder(seg[0], seg[1], 0.04, '#38bdf8', 12);
              scene.addArrow([0, 0, 0], xi1, '#34d399', { label: '基础解系 ξ₁' });
              curX = M.vecScale(xi1, k1);
              scene.addSphere(curX, 0.14, '#fbbf24', { label: `通解 x = ${M.fmt(k1)}ξ₁` });
              if (M.norm(A[0]) > 1e-5 && M.norm(xi1) > 1e-5) {
                scene.addAngleArc(A[0], xi1, { color: '#fbbf24', label: '90°正交' });
              }
            } else if (sDim === 2) {
              const xi1 = sol.basis[0], xi2 = sol.basis[1];
              const nPlane = M.cross(xi1, xi2);
              scene.addPlane(nPlane, 0, '#38bdf8', { opacity: 0.24, label: '二维零空间 N(A)' });
              scene.addArrow([0, 0, 0], xi1, '#34d399', { label: '基础解系 ξ₁' });
              scene.addArrow([0, 0, 0], xi2, '#a78bfa', { label: '基础解系 ξ₂' });
              curX = M.vecAdd(M.vecScale(xi1, k1), M.vecScale(xi2, k2));
              scene.addArrow([0, 0, 0], curX, '#fbbf24', { label: `通解 x = k₁ξ₁+k₂ξ₂` });
            }

            const AxCheck = M.matVec(A, curX);
            const basisHtml = sol.basis.length
              ? sol.basis.map((xi, idx) => UI.vecHtml(xi, `ξ<sub>${idx + 1}</sub>`, idx === 0 ? '#34d399' : '#a78bfa')).join(' ')
              : '<span class="badge-chip">无非零基础解系（仅零解 x = 0）</span>';

            mathEl.innerHTML = `
              ${UI.kpiGridHtml([
                { label: '基础解系向量个数 s = n − r(A)', value: `${3} − ${sol.rankA} = ${sDim}`, color: '#38bdf8', sub: sDim > 0 ? 'r(A) < n，存在非零解！' : 'r(A) = n，仅有零解' },
                { label: '实时检验 Ax = 0', value: `(${M.fmt(AxCheck[0])}, ${M.fmt(AxCheck[1])}, ${M.fmt(AxCheck[2])})ᵀ`, color: '#34d399', sub: '解空间 ⊥ 行空间！' }
              ])}
              <div class="math-flex-row">
                <div>${UI.matHtml(sol.gj.rrefMatrix, { pivots: sol.gj.pivots, label: 'RREF(A)' })}</div>
                <div class="math-flex-row">${basisHtml}</div>
              </div>
              ${UI.formulaBoxHtml('行空间与零空间正交几何图景', `
                <div class="math-line">Ax = 0 意味着 x 与 A 的<strong>每一个行向量 rᵢ 的内积均为 0</strong>（红色行法向量 ⊥ 蓝色零空间 N(A)）！</div>
                ${sDim > 0 ? `<div class="math-line">齐次通解公式：<b>x = ${sol.basis.map((_, i) => `k<sub>${i + 1}</sub>ξ<sub>${i + 1}</sub>`).join(' + ')}</b>（kᵢ ∈ ℝ 任意常数）。</div>` : ''}
              `, 'accent')}
            `;
          }

          function buildControls() {
            controlsEl.innerHTML = '';
            UI.mountPresets(controlsEl, presets, p => {
              A = M.cloneMat(p.mat);
              buildControls();
              rebuild();
            }, -1);

            UI.mountSlider(controlsEl, { label: '自由常数 k₁', min: -2.0, max: 2.0, step: 0.1, value: k1, color: '#fbbf24', onChange: v => { k1 = v; rebuild(); } });
            UI.mountSlider(controlsEl, { label: '自由常数 k₂（当 s=2 时生效）', min: -2.0, max: 2.0, step: 0.1, value: k2, color: '#a78bfa', onChange: v => { k2 = v; rebuild(); } });

            UI.mountMatrixEditor(controlsEl, A, () => rebuild(), { title: '编辑齐次方程组系数矩阵 A', step: 0.5 });
          }

          buildControls();
          rebuild();
        }
      },

      // ==================== 4.4 ====================
      {
        id: 'ch4-nonhom-struct',
        code: '4.4',
        title: '非齐次线性方程组通解结构 x = η* + k₁ξ₁ + k₂ξ₂（仿射平移）',
        week: '第 12 周',
        obeLevel: '掌握 & 理解（核心几何图景）',
        syllabusPoint: '非齐次方程组解的性质与通解结构：非齐次通解 = 一个特解 η* + 导出组 Ax=0 的通解。',
        roboticsContext: '满足末端任务约束的特解 η* 叠加零空间冗余调姿通解 Σkᵢξᵢ。',
        mount(ctx) {
          const { scene, controlsEl, mathEl } = ctx;
          scene.customTickCallback = null;

          const presets = [
            { name: '一维直线仿射平移 (r=2, s=1)', mat: [[1, 1, -1, 1.5], [0, 1, -1, 0.5], [1, 2, -2, 2.0]] },
            { name: '二维平面仿射平移 (r=1, s=2)', mat: [[1, 1, 1, 2.1], [2, 2, 2, 4.2], [-1, -1, -1, -2.1]] }
          ];
          let aug = M.cloneMat(presets[0].mat);
          let k1 = 1.0, k2 = 0.6;

          function rebuild() {
            scene.clear();
            const A = aug.map(r => r.slice(0, 3));
            const b = aug.map(r => r[3]);
            const sol = M.solveLinearSystem(A, b);

            if (sol.status === 'none') {
              mathEl.innerHTML = UI.formulaBoxHtml('当前增广矩阵无解', '请调整常数项使 r(A) = r(A, b) 以观察通解结构！', 'warn');
              return;
            }

            const eta = sol.particular;
            const sDim = sol.basis.length;

            // 1. Draw Homogeneous Null Space Ax = 0 through ORIGIN in cyan
            if (sDim === 1) {
              const xi1 = sol.basis[0];
              const seg0 = global.LAScene3D.clipLineToBox([0, 0, 0], xi1, 3.6);
              const segB = global.LAScene3D.clipLineToBox(eta, xi1, 3.6);
              if (seg0) scene.addCylinder(seg0[0], seg0[1], 0.036, '#38bdf8', 12);
              if (segB) scene.addCylinder(segB[0], segB[1], 0.05, '#34d399', 14);
              scene.addLabel([0, 0, -0.35], '导出组解空间 Ax=0 (过原点)', { color: '#38bdf8' });
              scene.addArrow([0, 0, 0], xi1, '#38bdf8', { label: 'ξ₁' });

              // Particular solution eta* + k1*xi1
              const homPart = M.vecScale(xi1, k1);
              const totalX = M.vecAdd(eta, homPart);
              scene.addArrow([0, 0, 0], eta, '#fbbf24', { label: '特解 η*' });
              scene.addArrow(eta, totalX, '#38bdf8', { label: `+ k₁ξ₁ (${M.fmt(k1)}ξ₁)` });
              scene.addArrow([0, 0, 0], totalX, '#34d399', { label: '通解 x = η* + k₁ξ₁', showProjections: true });
            } else if (sDim === 2) {
              const xi1 = sol.basis[0], xi2 = sol.basis[1];
              const nVec = M.cross(xi1, xi2);
              scene.addPlane(nVec, 0, '#38bdf8', { opacity: 0.18, label: '导出组平面 Ax=0 (过原点)' });
              scene.addPlane(nVec, M.dot(nVec, eta), '#34d399', { opacity: 0.26, label: '非齐次解平面 Ax=b (平移后)' });

              const homPart = M.vecAdd(M.vecScale(xi1, k1), M.vecScale(xi2, k2));
              const totalX = M.vecAdd(eta, homPart);
              scene.addArrow([0, 0, 0], eta, '#fbbf24', { label: '特解 η*' });
              scene.addArrow(eta, totalX, '#38bdf8', { label: 'k₁ξ₁+k₂ξ₂' });
              scene.addArrow([0, 0, 0], totalX, '#34d399', { label: '通解 x', showProjections: true });
            } else {
              scene.addArrow([0, 0, 0], eta, '#fbbf24', { label: '唯一解 η* (s=0)', showProjections: true });
            }

            mathEl.innerHTML = `
              ${UI.kpiGridHtml([
                { label: '特解 η* (自由变量取0)', value: `(${M.fmtFrac(eta[0])}, ${M.fmtFrac(eta[1])}, ${M.fmtFrac(eta[2])})ᵀ`, color: '#fbbf24', sub: '连接原点到解流形的桥梁' },
                { label: '几何关系', value: '平行仿射流形', color: '#34d399', sub: 'Ax=b 解集 = Ax=0 解空间整体平移 η*' }
              ])}
              <div class="math-flex-row">
                <div>${UI.vecHtml(eta, 'η*', '#fbbf24')}</div>
                ${sol.basis.map((xi, i) => `<div>${UI.vecHtml(xi, `ξ<sub>${i + 1}</sub>`, '#38bdf8')}</div>`).join('')}
              </div>
              ${UI.formulaBoxHtml('非齐次通解结构原理一眼看懂', `
                <div class="math-line">1. <span style="color:#38bdf8">蓝色直线/平面</span>：对应齐次方程组 <b>Ax = 0</b> 的解空间（必过原点 0，是线性子空间）；</div>
                <div class="math-line">2. <span style="color:#34d399">绿色直线/平面</span>：非齐次方程组 <b>Ax = b</b> 的解集（不过原点，由蓝色子空间沿金色特解向量 <b>η*</b> 平行平移得到）：<br><strong>x = η* + ${sol.basis.length ? sol.basis.map((_, i) => `k<sub>${i + 1}</sub>ξ<sub>${i + 1}</sub>`).join(' + ') : '0'}</strong></div>
              `, 'accent')}
            `;
          }

          function buildControls() {
            controlsEl.innerHTML = '';
            UI.mountPresets(controlsEl, presets, p => {
              aug = M.cloneMat(p.mat);
              buildControls();
              rebuild();
            }, 0);
            UI.mountSlider(controlsEl, { label: '自由参数 k₁（沿解流形滑动）', min: -2.0, max: 2.0, step: 0.1, value: k1, color: '#38bdf8', onChange: v => { k1 = v; rebuild(); } });
            UI.mountSlider(controlsEl, { label: '自由参数 k₂（二维解平面时生效）', min: -2.0, max: 2.0, step: 0.1, value: k2, color: '#34d399', onChange: v => { k2 = v; rebuild(); } });
            UI.mountMatrixEditor(controlsEl, aug, () => rebuild(), { title: '编辑增广矩阵 [A | b]', augCol: 3, step: 0.5 });
          }

          buildControls();
          rebuild();
        }
      },

      // ==================== 4.5 ====================
      {
        id: 'ch4-common-sol',
        code: '4.5',
        title: '两个线性方程组的公共解（联立流形交集）',
        week: '第 13 周',
        obeLevel: '掌握（综合提高）',
        syllabusPoint: '两个线性方程组公共解的代数联立求法与三维几何交集解释。',
        roboticsContext: '多任务约束交集求解（同时满足末端平面轨迹约束 S₁ 与避障平面约束 S₂）。',
        mount(ctx) {
          const { scene, controlsEl, mathEl } = ctx;
          scene.customTickCallback = null;

          // System I: row 0 (and optional row 1), System II: row 1..
          let sys1 = [[1, 1, 0, 1.5]];
          let sys2 = [[0, 1, 1, 1.5], [1, -1, 1, 0.5]];

          const presets = [
            {
              name: '两解平面相交 → 一维公共解直线',
              s1: [[1, 1, 0, 1.5]],
              s2: [[0, 1, 1, 1.5]]
            },
            {
              name: '解平面 ∩ 解直线 → 唯一公共解点',
              s1: [[1, 1, 0, 1.5]],
              s2: [[0, 1, 1, 1.5], [1, -1, 1, 0.5]]
            },
            {
              name: '两齐次子空间求非零公共解',
              s1: [[1, -1, 0, 0]],
              s2: [[0, 1, -1, 0]]
            }
          ];

          function rebuild() {
            scene.clear();
            // Draw System I planes in Cyan
            sys1.forEach((r, idx) => {
              scene.addPlane(r.slice(0, 3), r[3], '#38bdf8', { opacity: 0.24, label: `方程组(I)-${idx + 1}` });
            });
            // Draw System II planes in Violet/Emerald
            sys2.forEach((r, idx) => {
              scene.addPlane(r.slice(0, 3), r[3], '#a78bfa', { opacity: 0.24, label: `方程组(II)-${idx + 1}` });
            });
            if (sys2.length === 2) {
              scene.addPlaneIntersection(sys2[0].slice(0, 3), sys2[0][3], sys2[1].slice(0, 3), sys2[1][3], '#a78bfa', {
                radius: 0.04,
                label: '方程组(II)解直线'
              });
            }

            // Combined system [sys1; sys2]
            const combined = [...sys1, ...sys2];
            const A = combined.map(r => r.slice(0, 3));
            const b = combined.map(r => r[3]);
            const sol = M.solveLinearSystem(A, b);

            if (sol.status === 'unique') {
              scene.addSphere(sol.particular, 0.17, '#fbbf24', {
                label: `唯一公共解 (${M.fmt(sol.particular[0])},${M.fmt(sol.particular[1])},${M.fmt(sol.particular[2])})`
              });
            } else if (sol.status === 'infinite' && sol.basis.length === 1) {
              const seg = global.LAScene3D.clipLineToBox(sol.particular, sol.basis[0], 3.6);
              if (seg) {
                scene.addCylinder(seg[0], seg[1], 0.068, '#fbbf24', 14);
                scene.addLabel(sol.particular, '公共解集 S₁ ∩ S₂', { color: '#fbbf24' });
              }
            }

            mathEl.innerHTML = `
              ${UI.kpiGridHtml([
                { label: '联立矩阵秩 r([A₁; A₂])', value: `${sol.rankA} (增广秩 ${sol.rankAug})`, color: sol.status === 'none' ? '#f43f5e' : '#34d399', sub: sol.status === 'none' ? 'S₁ ∩ S₂ = ∅ 无公共解' : `公共解流形维数 = ${3 - sol.rankA}` },
                { label: '公共解表达', value: sol.status === 'none' ? '无公共解' : (sol.status === 'unique' ? `(${M.fmtFrac(sol.particular[0])}, ${M.fmtFrac(sol.particular[1])}, ${M.fmtFrac(sol.particular[2])})ᵀ` : 'η* + kξ₁'), color: '#fbbf24', sub: '同时满足方程组 (I) 与 (II)' }
              ])}
              <div class="math-flex-row">
                <div>${UI.matHtml(combined, { augCol: 3, rowSplit: sys1.length, label: '联立增广阵' })}</div>
                <div>${UI.matHtml(sol.gj.rrefMatrix, { augCol: 3, pivots: sol.gj.pivots, label: '联立 RREF' })}</div>
              </div>
              ${UI.formulaBoxHtml('公共解求解原理：代数联立 ⟺ 几何流形求交 S₁ ∩ S₂', `
                <div class="math-line">求方程组 (I) A₁x = b₁ 与方程组 (II) A₂x = b₂ 的公共解，即将两系数增广矩阵上下分块拼接为 <b>[A₁ | b₁ ; A₂ | b₂]</b> 做高斯-约旦消元！</div>
                ${sol.status === 'infinite' ? `<div class="math-line">公共解通解：<b>x = (${sol.particular.map(v => M.fmtFrac(v)).join(', ')})ᵀ + k·(${sol.basis[0].map(v => M.fmtFrac(v)).join(', ')})ᵀ</b>（图中金色高亮交线）。</div>` : ''}
              `, 'accent')}
            `;
          }

          function buildControls() {
            controlsEl.innerHTML = '';
            UI.mountPresets(controlsEl, presets, p => {
              sys1 = M.cloneMat(p.s1);
              sys2 = M.cloneMat(p.s2);
              buildControls();
              rebuild();
            }, 0);

            UI.mountMatrixEditor(controlsEl, sys1, () => rebuild(), {
              title: '编辑方程组 (I) [A₁ | b₁]',
              augCol: 3,
              step: 0.5
            });
            UI.mountMatrixEditor(controlsEl, sys2, () => rebuild(), {
              title: '编辑方程组 (II) [A₂ | b₂]',
              augCol: 3,
              step: 0.5
            });
          }

          buildControls();
          rebuild();
        }
      }
    ]
  };

  global.LAChapters = global.LAChapters || [];
  global.LAChapters.push(CHAPTER_3, CHAPTER_4);
})(window);
