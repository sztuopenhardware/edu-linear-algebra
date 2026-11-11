/**
 * 第一章：行列式 (5个实验案例) & 第二章：矩阵 (6个实验案例)
 * 严格对应深圳技术大学 SG01047《线性代数》教学大纲第 1–7 周全部知识点
 */
(function (global) {
  'use strict';

  const M = global.LAMath;
  const UI = global.LAUI;

  const CHAPTER_1 = {
    id: 'ch1',
    code: '第一章',
    title: '第一章：行列式 (Determinants)',
    weeks: '第 1–3 周 · 7.5 学时',
    summary: '从二阶、三阶行列式有向体积引入，剖析排列逆序数与 n 阶行列式本质，掌握行列式性质、按行（列）展开法则与克莱姆法则。',
    cases: [
      // ==================== 1.1 ====================
      {
        id: 'ch1-sarrus',
        code: '1.1',
        title: '二阶/三阶行列式定义与对角线法则（有向体积）',
        week: '第 1 周',
        obeLevel: '理解 & 掌握',
        syllabusPoint: '二阶、三阶行列式的定义及对角线法则（Sarrus法则），行列式的几何意义（有向面积/有向体积）。',
        roboticsContext: '机器人三维工作空间体积度量与右手坐标系手性（Orientation）判定。',
        mount(ctx) {
          const { scene, controlsEl, mathEl } = ctx;
          scene.customTickCallback = null;

          let A = [
            [2, 0.5, 0],
            [0.5, 2, 0.5],
            [0, 0.5, 1.8]
          ];
          let diagMode = 'all'; // 'all' | 'pos' | 'neg' | '2d'

          const presets = [
            { name: '右手系正体积 (det>0)', mat: [[2, 0.5, 0], [0.5, 2, 0.5], [0, 0.5, 1.8]] },
            { name: '左手系负体积 (det<0)', mat: [[0.5, 2, 0], [2, 0.5, 0.5], [0, 0.5, 1.8]] },
            { name: '三向量共面奇异 (det=0)', mat: [[2, 1, 0.5], [0.5, 2, 1], [2.5, 3, 1.5]] },
            { name: '标准单位立方体 (I₃)', mat: [[1, 0, 0], [0, 1, 0], [0, 0, 1]] }
          ];

          function rebuild() {
            scene.clear();
            if (diagMode === '2d') {
              // 2nd order determinant on XY plane (z = 0)
              const v1 = [A[0][0], A[1][0], 0];
              const v2 = [A[0][1], A[1][1], 0];
              const d2 = M.cleanZero(A[0][0] * A[1][1] - A[0][1] * A[1][0]);
              const col = d2 > 1e-6 ? '#38bdf8' : (d2 < -1e-6 ? '#f43f5e' : '#fbbf24');
              const p00 = [0, 0, 0], p10 = v1, p01 = v2, p11 = M.vecAdd(v1, v2);
              scene.addQuad(p00, p10, p11, p01, col, { opacity: 0.35 });
              scene.addLine(p10, p11, col, 2);
              scene.addLine(p01, p11, col, 2);
              scene.addArrow([0, 0, 0], v1, '#f87171', { label: `α₁(${M.fmt(v1[0])}, ${M.fmt(v1[1])})` });
              scene.addArrow([0, 0, 0], v2, '#34d399', { label: `α₂(${M.fmt(v2[0])}, ${M.fmt(v2[1])})` });
              scene.addLabel(M.vecScale(p11, 0.5), `有向面积 D₂ = ${M.fmt(d2)}`, { color: col, fontSize: 13.5 });

              const sub2 = [[A[0][0], A[0][1]], [A[1][0], A[1][1]]];
              mathEl.innerHTML = `
                ${UI.kpiGridHtml([
                  { label: '二阶行列式 D₂', value: M.fmt(d2, 3), color: col, sub: d2 > 0 ? '逆时针（右手正向）' : (d2 < 0 ? '顺时针（负向）' : '共线退化（面积为0）') },
                  { label: '平行四边形面积 |D₂|', value: M.fmt(Math.abs(d2), 3), sub: 'XY 平面投影面积' }
                ])}
                ${UI.formulaBoxHtml('二阶对角线法则（主对角线减副对角线）', `
                  <div class="math-line">${UI.matHtml(sub2, { type: 'det', label: 'D₂' })}</div>
                  <div class="math-line">= <span class="pos-term">(${M.fmt(sub2[0][0])})×(${M.fmt(sub2[1][1])})</span> − <span class="neg-term">(${M.fmt(sub2[0][1])})×(${M.fmt(sub2[1][0])})</span> = <strong>${M.fmt(d2, 3)}</strong></div>
                `, 'accent')}
              `;
              return;
            }

            // Column vectors of A
            const c1 = [A[0][0], A[1][0], A[2][0]];
            const c2 = [A[0][1], A[1][1], A[2][1]];
            const c3 = [A[0][2], A[1][2], A[2][2]];
            const d3 = M.det(A);
            const volColor = d3 > 1e-6 ? '#38bdf8' : (d3 < -1e-6 ? '#f43f5e' : '#fbbf24');

            scene.addParallelepiped(c1, c2, c3, volColor, { opacity: 0.25 });
            scene.addArrow([0, 0, 0], c1, '#f87171', { label: `α₁(${M.fmt(c1[0])},${M.fmt(c1[1])},${M.fmt(c1[2])})`, showProjections: true });
            scene.addArrow([0, 0, 0], c2, '#34d399', { label: `α₂(${M.fmt(c2[0])},${M.fmt(c2[1])},${M.fmt(c2[2])})` });
            scene.addArrow([0, 0, 0], c3, '#a78bfa', { label: `α₃(${M.fmt(c3[0])},${M.fmt(c3[1])},${M.fmt(c3[2])})` });

            const center = M.vecScale(M.vecAdd(M.vecAdd(c1, c2), c3), 0.5);
            scene.addLabel(center, `det(A) = ${M.fmt(d3, 2)}`, { color: volColor, fontSize: 14 });

            // Sarrus 6 terms
            const p1 = M.cleanZero(A[0][0] * A[1][1] * A[2][2]);
            const p2 = M.cleanZero(A[0][1] * A[1][2] * A[2][0]);
            const p3 = M.cleanZero(A[0][2] * A[1][0] * A[2][1]);
            const n1 = M.cleanZero(A[0][2] * A[1][1] * A[2][0]);
            const n2 = M.cleanZero(A[0][0] * A[1][2] * A[2][1]);
            const n3 = M.cleanZero(A[0][1] * A[1][0] * A[2][2]);

            const handText = d3 > 1e-6 ? '右手系 (正定向)' : (d3 < -1e-6 ? '左手系 (负定向翻转)' : '三向量共面 (奇异退化)');

            mathEl.innerHTML = `
              ${UI.kpiGridHtml([
                { label: '三阶行列式 det(A)', value: M.fmt(d3, 3), color: volColor, sub: handText },
                { label: '平行六面体体积 |det(A)|', value: M.fmt(Math.abs(d3), 3), sub: '|α₁ · (α₂ × α₃)|' }
              ])}
              <div class="math-block-center">${UI.matHtml(A, { type: 'det', label: '|A|', frac: false })}</div>
              ${UI.formulaBoxHtml('三阶行列式对角线法则（Sarrus 法则）实时拆解', `
                ${(diagMode === 'all' || diagMode === 'pos') ? `
                <div class="sarrus-group pos-box">
                  <div class="sarrus-hdr">+ 主对角线方向三项之和：<strong>${M.fmt(p1 + p2 + p3, 3)}</strong></div>
                  <div>+ a₁₁a₂₂a₃₃ = (${M.fmt(A[0][0])})(${M.fmt(A[1][1])})(${M.fmt(A[2][2])}) = <b>${M.fmt(p1)}</b></div>
                  <div>+ a₁₂a₂₃a₃₁ = (${M.fmt(A[0][1])})(${M.fmt(A[1][2])})(${M.fmt(A[2][0])}) = <b>${M.fmt(p2)}</b></div>
                  <div>+ a₁₃a₂₁a₃₂ = (${M.fmt(A[0][2])})(${M.fmt(A[1][0])})(${M.fmt(A[2][1])}) = <b>${M.fmt(p3)}</b></div>
                </div>` : ''}
                ${(diagMode === 'all' || diagMode === 'neg') ? `
                <div class="sarrus-group neg-box">
                  <div class="sarrus-hdr">− 副对角线方向三项之和：<strong>−(${M.fmt(n1 + n2 + n3, 3)})</strong></div>
                  <div>− a₁₃a₂₂a₃₁ = −(${M.fmt(A[0][2])})(${M.fmt(A[1][1])})(${M.fmt(A[2][0])}) = <b>${M.fmt(-n1)}</b></div>
                  <div>− a₁₁a₂₃a₃₂ = −(${M.fmt(A[0][0])})(${M.fmt(A[1][2])})(${M.fmt(A[2][1])}) = <b>${M.fmt(-n2)}</b></div>
                  <div>− a₁₂a₂₁a₃₃ = −(${M.fmt(A[0][1])})(${M.fmt(A[1][0])})(${M.fmt(A[2][2])}) = <b>${M.fmt(-n3)}</b></div>
                </div>` : ''}
                <div class="math-note">注意：对角线法则仅适用于二阶与三阶行列式；4 阶及以上行列式须用逆序数定义或按行（列）展开！</div>
              `)}
            `;
          }

          function buildControls() {
            controlsEl.innerHTML = '';
            UI.mountPresets(controlsEl, presets, p => {
              A = M.cloneMat(p.mat);
              buildControls();
              rebuild();
            }, -1);

            UI.mountToggleGroup(controlsEl, '维度与对角线观察模式', [
              { label: '三阶全貌', value: 'all' },
              { label: '+主对角项', value: 'pos' },
              { label: '−副对角项', value: 'neg' },
              { label: '二阶面积', value: '2d' }
            ], diagMode, v => { diagMode = v; rebuild(); });

            UI.mountMatrixEditor(controlsEl, A, () => rebuild(), {
              title: '编辑矩阵列向量 A = [α₁, α₂, α₃]',
              colLabels: ['α₁', 'α₂', 'α₃'],
              step: 0.5
            });
          }

          buildControls();
          rebuild();
        }
      },

      // ==================== 1.2 ====================
      {
        id: 'ch1-perm',
        code: '1.2',
        title: '排列、逆序数与 n 阶行列式展开本质',
        week: '第 1–2 周',
        obeLevel: '理解',
        syllabusPoint: '全排列与逆序数 τ(p₁p₂…pₙ)，奇排列与偶排列，对换改变排列奇偶性，n 阶行列式的完全展开定义。',
        roboticsContext: '多轴状态组合排列、符号张量 ε_ijk（叉乘算子底层数学定义）。',
        mount(ctx) {
          const { scene, controlsEl, mathEl } = ctx;
          scene.customTickCallback = null;

          let n = 4;
          let perm = [2, 4, 1, 3];
          let A4 = [
            [2, 1, 0, 1],
            [1, 3, 1, 0],
            [0, 2, 2, 1],
            [1, 0, 1, 2]
          ];

          function rebuild() {
            scene.clear();
            const inv = M.inversionCount(perm);
            const signColor = inv.isEven ? '#34d399' : '#f43f5e';

            // Visualize 3D Permutation Rook Matrix + Inversion Crossing Arch Graph in 3D!
            // Top layer z = 1.6: indices 1..n; Bottom layer z = -0.8: perm[0..n-1]
            const span = 2.4;
            const posForIdx = idx => -span + (2 * span * idx) / (n - 1);

            // Draw n x n Rook board on XY plane (z = -1.2)
            for (let r = 0; r < n; r++) {
              for (let c = 0; c < n; c++) {
                const bx = -1.8 + c * (3.6 / n) + (1.8 / n);
                const by = 1.8 - r * (3.6 / n) - (1.8 / n);
                const selected = perm[r] === c + 1;
                const cellVal = A4[r][c];
                if (selected) {
                  const h = Math.max(0.25, Math.abs(cellVal) * 0.55);
                  scene.addCylinder([bx, by, -1.2], [bx, by, -1.2 + h], 0.22, signColor, 16);
                  scene.addLabel([bx, by, -1.2 + h + 0.22], `a${r + 1}${c + 1}=${cellVal}`, { color: signColor, fontSize: 11.5 });
                } else {
                  scene.addSphere([bx, by, -1.2], 0.06, '#64748b');
                }
              }
            }

            // 3D Bipartite Crossing Lines in XZ plane (y = 0, z from 2.2 down to 0.3) so crossings = inversions!
            for (let i = 0; i < n; i++) {
              const xTop = posForIdx(i); // natural value i+1
              const posInPerm = perm.indexOf(i + 1);
              const xBot = posForIdx(posInPerm);
              const pTop = [xTop, 0, 2.3];
              const pBot = [xBot, 0, 0.4];
              scene.addSphere(pTop, 0.11, '#38bdf8');
              scene.addSphere(pBot, 0.11, signColor);
              scene.addCylinder(pTop, pBot, 0.032, '#60a5fa', 10);
              scene.addLabel([xTop, 0, 2.65], `自然序 ${i + 1}`, { color: '#38bdf8', fontSize: 11 });
              scene.addLabel([xBot, 0, 0.08], `p${posInPerm + 1}=${perm[posInPerm]}`, { color: signColor, fontSize: 12 });
            }

            // Highlight crossing points = exact inversion count!
            inv.pairs.forEach(([valA, valB, idxA, idxB]) => {
              const xTopA = posForIdx(valA - 1), xBotA = posForIdx(idxA);
              const xTopB = posForIdx(valB - 1), xBotB = posForIdx(idxB);
              // Solve intersection parameter s in [0,1]
              const denom = (xBotA - xTopA) - (xBotB - xTopB);
              if (Math.abs(denom) > 1e-6) {
                const s = (xTopB - xTopA) / denom;
                const ix = xTopA + s * (xBotA - xTopA);
                const iz = 2.3 + s * (0.4 - 2.3);
                scene.addSphere([ix, 0, iz], 0.13, '#fbbf24');
                scene.addLabel([ix, 0, iz + 0.22], `(${valA}>${valB})`, { color: '#fbbf24', fontSize: 10.5 });
              }
            });

            // Compute current term value and full determinant
            const subA = A4.slice(0, n).map(r => r.slice(0, n));
            let prod = 1;
            const factors = [];
            for (let i = 0; i < n; i++) {
              const v = subA[i][perm[i] - 1];
              prod *= v;
              factors.push(`a<sub>${i + 1}${perm[i]}</sub>(${v})`);
            }
            const signedTerm = inv.sign * prod;
            const totalDet = M.det(subA);

            const allP = M.allPermutations(n);
            const sampleRows = allP.slice(0, 12).map(p => {
              const iv = M.inversionCount(p);
              let pr = 1;
              for (let i = 0; i < n; i++) pr *= subA[i][p[i] - 1];
              const isCur = p.join(',') === perm.join(',');
              return `<tr class="${isCur ? 'active-perm-row' : ''}">
                <td>(${p.join(', ')})</td>
                <td>${iv.count} (${iv.isEven ? '偶' : '奇'})</td>
                <td class="${iv.isEven ? 'pos-term' : 'neg-term'}">${iv.isEven ? '+1' : '−1'}</td>
                <td>${M.fmt(iv.sign * pr)}</td>
              </tr>`;
            }).join('');

            mathEl.innerHTML = `
              ${UI.kpiGridHtml([
                { label: `当前排列 (${perm.join('')})`, value: `τ = ${inv.count}`, color: signColor, sub: inv.isEven ? '偶排列 · 符号 (+1)' : '奇排列 · 符号 (−1)' },
                { label: `展开项贡献`, value: M.fmt(signedTerm), color: signColor, sub: `总 ${allP.length} 项和 |A| = ${M.fmt(totalDet)}` }
              ])}
              ${UI.formulaBoxHtml('逆序对明细（上方黄色交点个数 = 逆序数 τ）', `
                <div class="math-line">逆序对集合：${inv.pairs.length ? inv.pairs.map(p => `<span class="badge-chip">(${p[0]}, ${p[1]})</span>`).join(' ') : '无逆序对（标准自然序 τ = 0）'}</div>
                <div class="math-line">当前项：(-1)<sup>${inv.count}</sup> · ${factors.join(' · ')} = <strong>${M.fmt(signedTerm)}</strong></div>
                <div class="math-note">定理验证：点击左侧任意“对换 pᵢ ↔ pⱼ”按钮，可见排列奇偶性必翻转一次（奇 ⇄ 偶）！</div>
              `, 'accent')}
              <div class="perm-table-wrap">
                <div class="formula-title">${n} 阶行列式完全展开项表（共 ${n}! = ${allP.length} 项，求和得 |A| = ${M.fmt(totalDet)}）</div>
                <table class="mini-table">
                  <thead><tr><th>列标排列</th><th>逆序数 τ</th><th>(-1)^τ</th><th>项值</th></tr></thead>
                  <tbody>${sampleRows}</tbody>
                </table>
                ${allP.length > 12 ? `<div class="math-note">（已展示前 12 / ${allP.length} 项，完整求和 det(A) = ${M.fmt(totalDet)}）</div>` : ''}
              </div>
            `;
          }

          function buildControls() {
            controlsEl.innerHTML = '';
            UI.mountToggleGroup(controlsEl, '选择行列式阶数 n', [
              { label: '3 阶 (3! = 6 项)', value: 3 },
              { label: '4 阶 (4! = 24 项)', value: 4 }
            ], n, val => {
              n = val;
              perm = n === 3 ? [3, 1, 2] : [2, 4, 1, 3];
              buildControls();
              rebuild();
            });

            const swapWrap = document.createElement('div');
            swapWrap.innerHTML = `<div class="control-group-title">点击执行相邻/任意对换（观察奇偶翻转）</div>`;
            const bar = document.createElement('div');
            bar.className = 'preset-bar';
            for (let i = 0; i < n; i++) {
              for (let j = i + 1; j < n; j++) {
                const b = document.createElement('button');
                b.type = 'button';
                b.className = 'preset-btn';
                b.textContent = `对换位置 ${i + 1}↔${j + 1}`;
                b.addEventListener('click', () => {
                  [perm[i], perm[j]] = [perm[j], perm[i]];
                  rebuild();
                });
                bar.appendChild(b);
              }
            }
            const resetBtn = document.createElement('button');
            resetBtn.type = 'button';
            resetBtn.className = 'preset-btn';
            resetBtn.textContent = '重置自然序 12…n';
            resetBtn.addEventListener('click', () => {
              perm = Array.from({ length: n }, (_, idx) => idx + 1);
              rebuild();
            });
            bar.appendChild(resetBtn);
            swapWrap.appendChild(bar);
            controlsEl.appendChild(swapWrap);
          }

          buildControls();
          rebuild();
        }
      },

      // ==================== 1.3 ====================
      {
        id: 'ch1-props',
        code: '1.3',
        title: '行列式的五大性质与化三角计算几何演化',
        week: '第 2–3 周',
        obeLevel: '掌握（核心重点）',
        syllabusPoint: '转置不变、两行互换变号、数乘某行提取公因子、倍加某行值不变（剪切体积不变性）、化上三角行列式计算。',
        roboticsContext: '大型刚度/雅可比行列式高效数值约化（O(n³) 替代 O(n!)）。',
        mount(ctx) {
          const { scene, controlsEl, mathEl } = ctx;
          scene.customTickCallback = null;

          let initA = [
            [2, 1, 1],
            [1, 3, 1],
            [1, 1, 2]
          ];
          let curA = M.cloneMat(initA);
          let shearK = 0;
          let lastAction = '初始状态：观察行向量张成的平行六面体有向体积';

          function rebuild() {
            scene.clear();
            // Represent rows of curA as 3D vectors (with optional live shear preview r2 + shearK * r1)
            const r1 = curA[0].slice();
            const r2 = M.vecAdd(curA[1], M.vecScale(r1, shearK));
            const r3 = curA[2].slice();
            const previewMat = [r1, r2, r3];

            const dInit = M.det(initA);
            const dCur = M.det(previewMat);
            const col = dCur >= 0 ? '#38bdf8' : '#f43f5e';

            // Ghost of original curA[1] if shearing
            if (Math.abs(shearK) > 0.01) {
              scene.addParallelepiped(curA[0], curA[1], curA[2], '#94a3b8', { opacity: 0.10 });
              scene.addDashedLine(curA[1], r2, '#fbbf24', 2.2);
              scene.addLabel(r2, `r₂ + (${M.fmt(shearK)})r₁ (等高剪切!)`, { color: '#fbbf24' });
            }

            scene.addParallelepiped(r1, r2, r3, col, { opacity: 0.28 });
            scene.addArrow([0, 0, 0], r1, '#f87171', { label: 'r₁' });
            scene.addArrow([0, 0, 0], r2, '#34d399', { label: 'r₂' });
            scene.addArrow([0, 0, 0], r3, '#a78bfa', { label: 'r₃' });

            const gj = M.gaussJordanSteps(curA);
            const upperMat = gj.refMatrix;
            const diagProd = M.cleanZero(upperMat[0][0] * upperMat[1][1] * upperMat[2][2]);

            mathEl.innerHTML = `
              ${UI.kpiGridHtml([
                { label: '初始行列式 |A₀|', value: M.fmt(dInit, 3), sub: '基准体积参考' },
                { label: '当前行列式 |A|', value: M.fmt(dCur, 3), color: col, sub: `体积 |det| = ${M.fmt(Math.abs(dCur), 3)}` }
              ])}
              ${UI.formulaBoxHtml('当前操作几何解释', `<div class="math-line">${lastAction}</div>`, 'accent')}
              <div class="math-flex-row">
                <div>${UI.matHtml(previewMat, { type: 'det', label: '当前 |A|' })}</div>
                <div>${UI.matHtml(upperMat, { type: 'det', label: '化上三角 |U|' })}</div>
              </div>
              ${UI.formulaBoxHtml('化上三角计算公式', `
                <div class="math-line">经行消元化为上三角阵 U，主对角线乘积 u₁₁·u₂₂·u₃₃ = (${M.fmt(upperMat[0][0])})×(${M.fmt(upperMat[1][1])})×(${M.fmt(upperMat[2][2])}) = <b>${M.fmt(diagProd, 3)}</b></div>
                <div class="math-line">计入行交换符号因子后：<strong>|A| = ${M.fmt(dCur, 3)}</strong></div>
              `)}
            `;
          }

          function buildControls() {
            controlsEl.innerHTML = '';
            UI.mountSlider(controlsEl, {
              label: '连续几何剪切演示：r₂ ← r₂ + k·r₁（卡瓦列里等体积原理）',
              min: -2.0,
              max: 2.0,
              step: 0.05,
              value: shearK,
              color: '#fbbf24',
              onChange: v => {
                shearK = v;
                lastAction = `性质5（倍加不变）：r₂ + (${M.fmt(v)})r₁ 沿 r₁ 方向平移顶面，底面积与高均不变，故行列式值恒等于 ${M.fmt(M.det(curA))}！`;
                rebuild();
              }
            });

            const opsWrap = document.createElement('div');
            opsWrap.innerHTML = `<div class="control-group-title">点击验证行列式五大性质</div>`;
            const bar = document.createElement('div');
            bar.className = 'preset-bar';
            const actions = [
              {
                name: '性质1: 转置 Aᵀ',
                fn: () => {
                  shearK = 0;
                  curA = M.transpose(curA);
                  lastAction = '性质1：行列互换（转置），|Aᵀ| = |A|，行列式的值严格不变！';
                }
              },
              {
                name: '性质2: 互换 r₁ ↔ r₂',
                fn: () => {
                  shearK = 0;
                  [curA[0], curA[1]] = [curA[1], curA[0]];
                  lastAction = '性质2：两行互换，空间基手性翻转（右手⇄左手），行列式变号 |B| = −|A|！';
                }
              },
              {
                name: '性质3: 数乘 1.5 × r₁',
                fn: () => {
                  shearK = 0;
                  curA[0] = M.vecScale(curA[0], 1.5);
                  lastAction = '性质3：某一行乘以 k = 1.5，单条棱拉长 1.5 倍，行列式值变为 1.5|A|！';
                }
              },
              {
                name: '性质5: 一键化上三角 U',
                fn: () => {
                  shearK = 0;
                  const gj = M.gaussJordanSteps(curA);
                  curA = M.cloneMat(gj.refMatrix);
                  lastAction = '高斯行消元化为上三角矩阵 U：行列式直接等于主对角线元素乘积！';
                }
              },
              {
                name: '重置初始矩阵',
                fn: () => {
                  shearK = 0;
                  curA = M.cloneMat(initA);
                  lastAction = '已重置为初始三阶行列式。';
                }
              }
            ];
            actions.forEach(act => {
              const btn = document.createElement('button');
              btn.type = 'button';
              btn.className = 'preset-btn';
              btn.textContent = act.name;
              btn.addEventListener('click', () => { act.fn(); buildControls(); rebuild(); });
              bar.appendChild(btn);
            });
            opsWrap.appendChild(bar);
            controlsEl.appendChild(opsWrap);

            UI.mountMatrixEditor(controlsEl, curA, () => {
              shearK = 0;
              rebuild();
            }, { title: '自定义三阶行列式元素', step: 0.5 });
          }

          buildControls();
          rebuild();
        }
      },

      // ==================== 1.4 ====================
      {
        id: 'ch1-cofactor',
        code: '1.4',
        title: '按行（列）展开定理、代数余子式与拉普拉斯定理',
        week: '第 2 周',
        obeLevel: '掌握 & 了解',
        syllabusPoint: '余子式 M_ij 与代数余子式 A_ij = (-1)^(i+j) M_ij，按行（列）展开降阶计算，拉普拉斯分块展开定理。',
        roboticsContext: '三维叉乘向量 α₂ × α₃ = (A₁₁, A₁₂, A₁₃)ᵀ 与力矩 τ = r × F 形式行列式计算。',
        mount(ctx) {
          const { scene, controlsEl, mathEl } = ctx;
          scene.customTickCallback = null;

          let A = [
            [2, -1, 1],
            [1, 2, 0.5],
            [0.5, 1, 2]
          ];
          let selRow = 0;
          let selCol = 0;
          let showLaplace4 = false;

          function rebuild() {
            scene.clear();
            // Geometric meaning of Row 1 expansion: det([r1; r2; r3]) = r1 · (r2 x r3)
            // Notice (r2 x r3) = [A_{11}, A_{12}, A_{13}] when expanding along row selRow!
            const otherRows = [0, 1, 2].filter(idx => idx !== selRow);
            const rTarget = A[selRow];
            const u = A[otherRows[0]];
            const v = A[otherRows[1]];
            const cofactorVec = [
              M.cofactor(A, selRow, 0),
              M.cofactor(A, selRow, 1),
              M.cofactor(A, selRow, 2)
            ];

            // Base parallelogram spanned by the other two rows
            const p00 = [0, 0, 0], p10 = u, p01 = v, p11 = M.vecAdd(u, v);
            scene.addQuad(p00, p10, p11, p01, '#34d399', { opacity: 0.30 });
            scene.addParallelepiped(A[0], A[1], A[2], '#38bdf8', { opacity: 0.14 });

            scene.addArrow([0, 0, 0], u, '#34d399', { label: `r${otherRows[0] + 1}` });
            scene.addArrow([0, 0, 0], v, '#34d399', { label: `r${otherRows[1] + 1}` });
            scene.addArrow([0, 0, 0], rTarget, '#f87171', { label: `展开行 r${selRow + 1}` });
            scene.addArrow([0, 0, 0], cofactorVec, '#fbbf24', {
              label: `代数余子式向量 (A_${selRow + 1}1, A_${selRow + 1}2, A_${selRow + 1}3)`,
              showProjections: true
            });
            scene.addAngleArc(rTarget, cofactorVec, { color: '#fbbf24', label: '内积=det' });

            const mij = M.minor(A, selRow, selCol);
            const aij = M.cofactor(A, selRow, selCol);
            const signStr = (selRow + selCol) % 2 === 0 ? '+1' : '−1';
            const subM = M.subMatrix(A, selRow, selCol);
            const totalDet = M.det(A);

            // Alien cofactor verification (row otherRows[0] dotted with row selRow's cofactors = 0!)
            const alienDot = M.dot(u, cofactorVec);

            const laplaceHtml = showLaplace4 ? UI.formulaBoxHtml('【了解】拉普拉斯定理（分块高阶行列式降阶实例）', `
              <div class="math-line">对于分块上三角四阶行列式 ${UI.matHtml([['B₂', 'C₂'], ['O', 'D₂']], { type: 'det', rowSplit: 1, colSplit: 1 })}，按前 2 行取二阶子式做拉普拉斯展开：</div>
              <div class="math-line"><strong>|M₄| = |B₂| · |D₂|</strong>（其余含零块二阶子式全为 0，直接将 4! = 24 项降阶为两个二阶行列式乘积！）</div>
            `, 'info') : '';

            mathEl.innerHTML = `
              ${UI.kpiGridHtml([
                { label: `余子式 M_${selRow + 1}${selCol + 1}`, value: M.fmt(mij, 3), sub: `划去第 ${selRow + 1} 行第 ${selCol + 1} 列` },
                { label: `代数余子式 A_${selRow + 1}${selCol + 1}`, value: M.fmt(aij, 3), color: '#fbbf24', sub: `(-1)^(${selRow + 1}+${selCol + 1}) M = (${signStr})×${M.fmt(mij)}` }
              ])}
              <div class="math-flex-row">
                <div>${UI.matHtml(A, { type: 'det', label: '|A|', crossedRow: selRow, crossedCol: selCol })}</div>
                <div>${UI.matHtml(subM, { type: 'det', label: `M_${selRow + 1}${selCol + 1}` })}</div>
              </div>
              ${UI.formulaBoxHtml(`按第 ${selRow + 1} 行展开定理 & 几何内积解释`, `
                <div class="math-line">|A| = a<sub>${selRow + 1}1</sub>A<sub>${selRow + 1}1</sub> + a<sub>${selRow + 1}2</sub>A<sub>${selRow + 1}2</sub> + a<sub>${selRow + 1}3</sub>A<sub>${selRow + 1}3</sub></div>
                <div class="math-line">= (${M.fmt(rTarget[0])})(${M.fmt(cofactorVec[0])}) + (${M.fmt(rTarget[1])})(${M.fmt(cofactorVec[1])}) + (${M.fmt(rTarget[2])})(${M.fmt(cofactorVec[2])}) = <strong>${M.fmt(totalDet, 3)}</strong></div>
                <div class="math-note">推论（异行乘积为零）：黄色代数余子式向量正交于其余两行张成的绿色底面，故 r<sub>${otherRows[0] + 1}</sub> · A<sub>${selRow + 1}*</sub> = <b>${M.fmt(alienDot, 4)}</b> ≡ 0！</div>
              `, 'accent')}
              ${laplaceHtml}
            `;
          }

          function buildControls() {
            controlsEl.innerHTML = '';
            UI.mountToggleGroup(controlsEl, '选择展开行 i', [
              { label: '第 1 行 (i=1)', value: 0 },
              { label: '第 2 行 (i=2)', value: 1 },
              { label: '第 3 行 (i=3)', value: 2 }
            ], selRow, v => { selRow = v; rebuild(); });

            UI.mountToggleGroup(controlsEl, '选择焦点列 j（查看余子式 M_ij）', [
              { label: '第 1 列 (j=1)', value: 0 },
              { label: '第 2 列 (j=2)', value: 1 },
              { label: '第 3 列 (j=3)', value: 2 }
            ], selCol, v => { selCol = v; rebuild(); });

            UI.mountToggleGroup(controlsEl, '拓展定理面板', [
              { label: '隐藏拉普拉斯说明', value: false },
              { label: '显示拉普拉斯定理', value: true }
            ], showLaplace4, v => { showLaplace4 = v; rebuild(); });

            UI.mountMatrixEditor(controlsEl, A, () => rebuild(), { title: '编辑三阶矩阵 A', step: 0.5 });
          }

          buildControls();
          rebuild();
        }
      },

      // ==================== 1.5 ====================
      {
        id: 'ch1-cramer',
        code: '1.5',
        title: '克莱姆法则 (Cramer\'s Rule) 求解线性方程组',
        week: '第 3 周',
        obeLevel: '掌握',
        syllabusPoint: '克莱姆法则适用条件（方程个数=未知数个数且系数行列式 D ≠ 0），唯一解公式 x_j = D_j / D。',
        roboticsContext: '三力平衡静力学解算与三平面激光定位交点闭式求解。',
        mount(ctx) {
          const { scene, controlsEl, mathEl } = ctx;
          scene.customTickCallback = null;

          let aug = [
            [2, 1, 0, 3],
            [1, 2, 1, 4],
            [0, 1, 2, 3]
          ];
          let viewMode = 'planes'; // 'planes' | 'vol1' | 'vol2' | 'vol3'

          const presets = [
            { name: '标准唯一解 (D ≠ 0)', mat: [[2, 1, 0, 3], [1, 2, 1, 4], [0, 1, 2, 3]] },
            { name: '正交坐标平面交点', mat: [[1, 0, 0, 1.5], [0, 1, 0, 2], [0, 0, 1, 1.2]] },
            { name: '系数奇异失效 (D = 0)', mat: [[1, 1, 1, 2], [2, 2, 2, 5], [1, -1, 1, 1]] }
          ];

          function rebuild() {
            scene.clear();
            const A = aug.map(r => r.slice(0, 3));
            const b = aug.map(r => r[3]);
            const D = M.det(A);

            const makeDj = colIdx => A.map((row, rIdx) => row.map((v, cIdx) => (cIdx === colIdx ? b[rIdx] : v)));
            const A1 = makeDj(0), A2 = makeDj(1), A3 = makeDj(2);
            const D1 = M.det(A1), D2 = M.det(A2), D3 = M.det(A3);
            const valid = Math.abs(D) > 1e-7;
            const sol = valid ? [D1 / D, D2 / D, D3 / D] : null;

            if (viewMode === 'planes') {
              const pCols = ['#38bdf8', '#34d399', '#f472b6'];
              for (let i = 0; i < 3; i++) {
                scene.addPlane(A[i], b[i], pCols[i], { opacity: 0.24, label: `π${i + 1}` });
              }
              scene.addPlaneIntersection(A[0], b[0], A[1], b[1], '#94a3b8', { radius: 0.025 });
              scene.addPlaneIntersection(A[1], b[1], A[2], b[2], '#94a3b8', { radius: 0.025 });
              scene.addPlaneIntersection(A[0], b[0], A[2], b[2], '#94a3b8', { radius: 0.025 });
              if (sol) {
                scene.addSphere(sol, 0.16, '#fbbf24');
                scene.addArrow([0, 0, 0], sol, '#fbbf24', {
                  label: `唯一解 x*(${M.fmt(sol[0])}, ${M.fmt(sol[1])}, ${M.fmt(sol[2])})`,
                  showProjections: true
                });
              }
            } else {
              const idx = viewMode === 'vol1' ? 0 : (viewMode === 'vol2' ? 1 : 2);
              const colsA = M.transpose(A);
              const colsDj = M.transpose([A1, A2, A3][idx]);
              scene.addParallelepiped(colsA[0], colsA[1], colsA[2], '#38bdf8', { opacity: 0.16 });
              scene.addParallelepiped(colsDj[0], colsDj[1], colsDj[2], '#fbbf24', { opacity: 0.28 });
              scene.addArrow([0, 0, 0], colsA[0], '#60a5fa', { label: 'a₁' });
              scene.addArrow([0, 0, 0], colsA[1], '#34d399', { label: 'a₂' });
              scene.addArrow([0, 0, 0], colsA[2], '#a78bfa', { label: 'a₃' });
              scene.addArrow([0, 0, 0], b, '#fbbf24', { label: '常数列 b（替换第' + (idx + 1) + '列）' });
            }

            mathEl.innerHTML = `
              ${UI.kpiGridHtml([
                { label: '系数行列式 D = |A|', value: M.fmt(D, 3), color: valid ? '#34d399' : '#f43f5e', sub: valid ? 'D ≠ 0，克莱姆法则适用！' : 'D = 0，克莱姆法则不适用！' },
                { label: '唯一解 (x₁, x₂, x₃)', value: valid ? `(${M.fmtFrac(sol[0])}, ${M.fmtFrac(sol[1])}, ${M.fmtFrac(sol[2])})` : '无唯一解', color: '#fbbf24', sub: valid ? 'x_j = D_j / D' : '需改用高斯消元法判定' }
              ])}
              <div class="math-flex-row">
                <div>${UI.matHtml(A, { type: 'det', label: `D=${M.fmt(D)}` })}</div>
                <div>${UI.matHtml(A1, { type: 'det', label: `D₁=${M.fmt(D1)}`, highlightCol: 0 })}</div>
              </div>
              <div class="math-flex-row">
                <div>${UI.matHtml(A2, { type: 'det', label: `D₂=${M.fmt(D2)}`, highlightCol: 1 })}</div>
                <div>${UI.matHtml(A3, { type: 'det', label: `D₃=${M.fmt(D3)}`, highlightCol: 2 })}</div>
              </div>
              ${valid ? UI.formulaBoxHtml('克莱姆闭式解公式', `
                <div class="math-line">x₁ = D₁/D = ${M.fmt(D1)}/${M.fmt(D)} = <b>${M.fmtFrac(sol[0])}</b>，x₂ = D₂/D = ${M.fmt(D2)}/${M.fmt(D)} = <b>${M.fmtFrac(sol[1])}</b>，x₃ = D₃/D = ${M.fmt(D3)}/${M.fmt(D)} = <b>${M.fmtFrac(sol[2])}</b></div>
              `, 'accent') : UI.formulaBoxHtml('克莱姆法则边界条件警示', `
                <div class="math-line">当前系数行列式 <strong>D = 0</strong>，方程组无解或有无穷多解，无法使用 D_j / D（详见第四章秩判定法）。</div>
              `, 'warn')}
            `;
          }

          function buildControls() {
            controlsEl.innerHTML = '';
            UI.mountPresets(controlsEl, presets, p => {
              aug = M.cloneMat(p.mat);
              buildControls();
              rebuild();
            }, -1);

            UI.mountToggleGroup(controlsEl, '三维几何解释视角切换', [
              { label: '三平面交点', value: 'planes' },
              { label: '体积比 D₁/D', value: 'vol1' },
              { label: '体积比 D₂/D', value: 'vol2' },
              { label: '体积比 D₃/D', value: 'vol3' }
            ], viewMode, v => { viewMode = v; rebuild(); });

            UI.mountMatrixEditor(controlsEl, aug, () => rebuild(), {
              title: '编辑线性方程组增广矩阵 [A | b]',
              augCol: 3,
              colLabels: ['x₁', 'x₂', 'x₃', 'b'],
              step: 0.5
            });
          }

          buildControls();
          rebuild();
        }
      }
    ]
  };

  const CHAPTER_2 = {
    id: 'ch2',
    code: '第二章',
    title: '第二章：矩阵 (Matrices)',
    weeks: '第 4–7 周 · 10 学时',
    summary: '建立矩阵作为三维线性变换算子的几何直觉，掌握矩阵运算、非交换律、转置、伴随求逆、初等变换求逆、分块矩阵及矩阵的秩。',
    cases: [
      // ==================== 2.1 ====================
      {
        id: 'ch2-special',
        code: '2.1',
        title: '矩阵概念与常见特殊矩阵的空间几何变换',
        week: '第 4 周',
        obeLevel: '理解 & 掌握',
        syllabusPoint: '矩阵行/列向量表示，零矩阵、单位矩阵、对角矩阵、对称矩阵、反对称矩阵、上三角矩阵的结构与作用。',
        roboticsContext: '各向异性缩放标定矩阵、三维角速度反对称叉乘矩阵 [ω]×。',
        mount(ctx) {
          const { scene, controlsEl, mathEl } = ctx;
          scene.customTickCallback = null;

          let A = [
            [1.8, 0, 0],
            [0, 0.8, 0],
            [0, 0, 1.4]
          ];
          let morphT = 1.0;
          let typeDesc = '对角矩阵 diag(d₁, d₂, d₃)：仅沿 X、Y、Z 坐标轴独立伸缩，不产生旋转与剪切。';

          const presets = [
            { name: '对角矩阵 Λ', mat: [[1.8, 0, 0], [0, 0.8, 0], [0, 0, 1.4]], desc: '对角矩阵：非对角元全为 0，仅沿三坐标轴独立缩放。' },
            { name: '单位矩阵 I₃', mat: [[1, 0, 0], [0, 1, 0], [0, 0, 1]], desc: '单位矩阵 I：恒等变换 Ix = x，空间保持原状。' },
            { name: '上三角剪切阵', mat: [[1, 1.1, 0.6], [0, 1, 0.8], [0, 0, 1]], desc: '上三角单位阵：产生三维空间错切（Shear），体积 det = 1 不变。' },
            { name: '实对称矩阵 Aᵀ=A', mat: [[1.6, 0.6, 0.2], [0.6, 1.2, 0.3], [0.2, 0.3, 1.0]], desc: '实对称矩阵：a_ij = a_ji，沿某组互相垂直的主轴做纯拉伸！' },
            { name: '反对称阵 [ω]×', mat: [[0, -1, 0.5], [1, 0, -0.5], [-0.5, 0.5, 0]], desc: '反对称矩阵 Aᵀ = −A：主对角元必为 0，机器人学中 [ω]×p = ω × p 表示瞬时线速度！' },
            { name: 'XY 正交投影阵', mat: [[1, 0, 0], [0, 1, 0], [0, 0, 0]], desc: '奇异投影矩阵（A²=A）：将整个三维空间压扁到 Z=0 平面！' }
          ];

          function rebuild() {
            scene.clear();
            const I = M.identity(3);
            const At = M.matAdd(M.matScale(I, 1 - morphT), M.matScale(A, morphT));
            const cols = M.transpose(At);

            // Original unit cube wireframe ghost
            scene.addParallelepiped([1, 0, 0], [0, 1, 0], [0, 0, 1], '#94a3b8', { opacity: 0.06, edgeColor: 'rgba(148,163,184,0.35)' });
            // Transformed cube + planar grid
            scene.addTransformedGrid(At, { range: 2, color: 'rgba(56, 189, 248, 0.28)' });
            scene.addParallelepiped(cols[0], cols[1], cols[2], '#38bdf8', { opacity: 0.26 });

            scene.addArrow([0, 0, 0], cols[0], '#f87171', { label: 'Ae₁ (第1列)' });
            scene.addArrow([0, 0, 0], cols[1], '#34d399', { label: 'Ae₂ (第2列)' });
            scene.addArrow([0, 0, 0], cols[2], '#60a5fa', { label: 'Ae₃ (第3列)' });

            const pTest = [1, 1, 1];
            const pOut = M.matVec(At, pTest);
            scene.addDashedLine(pTest, pOut, '#fbbf24', 2.0);
            scene.addSphere(pOut, 0.11, '#fbbf24', { label: `A(1,1,1)ᵀ` });

            const sym = M.isSymmetric(A);
            const skew = M.isSymmetric(M.matAdd(A, M.transpose(A))) && Math.abs(M.trace(A)) < 1e-6 &&
              M.norm([A[0][1] + A[1][0], A[0][2] + A[2][0], A[1][2] + A[2][1]]) < 1e-6;

            mathEl.innerHTML = `
              ${UI.kpiGridHtml([
                { label: '矩阵结构特征', value: sym ? '对称矩阵' : (skew ? '反对称阵' : '一般/三角方阵'), color: '#38bdf8', sub: `迹 tr(A) = ${M.fmt(M.trace(A))} · |A| = ${M.fmt(M.det(A))}` },
                { label: '插值进度 t', value: `${Math.round(morphT * 100)}%`, color: '#fbbf24', sub: 'M(t) = (1−t)I + tA' }
              ])}
              <div class="math-block-center">${UI.matHtml(A, { label: 'A' })}</div>
              ${UI.formulaBoxHtml('列向量几何视角：矩阵的第 j 列 = 基向量 e_j 变换后的落点', `
                <div class="math-line">${typeDesc}</div>
                <div class="math-line">测试向量 x = (1, 1, 1)ᵀ 变换为 Ax = <b>(${M.fmt(M.matVec(A, pTest)[0])}, ${M.fmt(M.matVec(A, pTest)[1])}, ${M.fmt(M.matVec(A, pTest)[2])})ᵀ</b></div>
              `, 'accent')}
            `;
          }

          function buildControls() {
            controlsEl.innerHTML = '';
            UI.mountPresets(controlsEl, presets, p => {
              A = M.cloneMat(p.mat);
              typeDesc = p.desc;
              morphT = 1.0;
              buildControls();
              rebuild();
            }, -1);

            UI.mountSlider(controlsEl, {
              label: '线性变换过渡动画进度 t (0 = 单位阵 I ⟶ 1 = 目标矩阵 A)',
              min: 0,
              max: 1,
              step: 0.02,
              value: morphT,
              color: '#38bdf8',
              onChange: v => { morphT = v; rebuild(); }
            });

            UI.mountMatrixEditor(controlsEl, A, () => {
              typeDesc = '自定义 3×3 变换矩阵：观察三列向量如何重塑三维网格！';
              rebuild();
            }, { title: '编辑变换矩阵 A', colLabels: ['Ae₁', 'Ae₂', 'Ae₃'], step: 0.2 });
          }

          buildControls();
          rebuild();
        }
      },

      // ==================== 2.2 ====================
      {
        id: 'ch2-mul-pow',
        code: '2.2',
        title: '矩阵运算、乘法非交换律 (AB ≠ BA) 与方阵的幂 (Aᵏ)',
        week: '第 4 周',
        obeLevel: '掌握 & 理解',
        syllabusPoint: '矩阵加、数乘、乘法规则，矩阵乘法不满足交换律的原因，方阵的幂 Aᵏ 递推轨迹。',
        roboticsContext: '机器人三维姿态欧拉角旋转顺序不可交换性（先绕X再绕Z ≠ 先绕Z再绕X）！',
        mount(ctx) {
          const { scene, controlsEl, mathEl } = ctx;
          scene.customTickCallback = null;

          let subMode = 'noncomm'; // 'noncomm' | 'power'
          let angX = 90, angZ = 90;
          let powerK = 8;
          let shrink = 0.92;
          let rotStepDeg = 32;

          function rebuild() {
            scene.clear();
            if (subMode === 'noncomm') {
              const A = M.rotZ((angZ * Math.PI) / 180);
              const B = M.rotX((angX * Math.PI) / 180);
              const AB = M.matMul(A, B); // First B (rotX), then A (rotZ)
              const BA = M.matMul(B, A); // First A (rotZ), then B (rotX)

              const v0 = [1.8, 0.8, 0.4]; // Asymmetric robot tool vector
              const vAB = M.matVec(AB, v0);
              const vBA = M.matVec(BA, v0);
              const diffNorm = M.norm(M.vecSub(vAB, vBA));

              // Draw initial vector and two distinct transformed frames/vectors!
              scene.addArrow([0, 0, 0], v0, '#94a3b8', { dashed: true, label: '初始向量 p₀' });
              scene.addArrow([0, 0, 0], vAB, '#38bdf8', { label: 'AB·p₀ (先B后A)', showProjections: true });
              scene.addArrow([0, 0, 0], vBA, '#f43f5e', { label: 'BA·p₀ (先A后B)', showProjections: true });
              if (diffNorm > 1e-3) {
                scene.addDashedLine(vAB, vBA, '#fbbf24', 2.2);
                scene.addLabel(M.vecScale(M.vecAdd(vAB, vBA), 0.5), `偏差 ||ABp−BAp|| = ${M.fmt(diffNorm)}`, { color: '#fbbf24' });
              }
              scene.addTriad([-2.2, 1.8, 0], AB, 0.7, 'AB:');
              scene.addTriad([2.2, -1.8, 0], BA, 0.7, 'BA:');

              mathEl.innerHTML = `
                ${UI.kpiGridHtml([
                  { label: '交换子范数 ||AB − BA||', value: diffNorm < 1e-5 ? '0 (可交换特例)' : M.fmt(diffNorm, 3), color: diffNorm < 1e-5 ? '#34d399' : '#f43f5e', sub: diffNorm < 1e-5 ? '同轴或零旋转时可交换' : 'AB ≠ BA 严格成立！' },
                  { label: '机器人姿态启示', value: '顺序敏感', color: '#fbbf24', sub: '三维有限旋转不可交换' }
                ])}
                <div class="math-flex-row">
                  <div>${UI.matHtml(AB, { label: 'AB (先绕X再绕Z)', frac: false })}</div>
                  <div>${UI.matHtml(BA, { label: 'BA (先绕Z再绕X)', frac: false })}</div>
                </div>
                ${UI.formulaBoxHtml('为什么矩阵乘法不满足交换律？', `
                  <div class="math-line">矩阵乘法对应<strong>空间线性变换的复合</strong>：<b>ABp₀ = A(Bp₀)</b> 表示先实施变换 B，再实施变换 A。</div>
                  <div class="math-line">三维空间绕不同轴旋转顺序颠倒后，刚体终态姿态截然不同，代数上直接体现为 <strong>AB ≠ BA</strong>！</div>
                `, 'accent')}
              `;
            } else {
              // Matrix Power A^k discrete dynamical trajectory
              const rad = (rotStepDeg * Math.PI) / 180;
              const A = [
                [shrink * Math.cos(rad), -shrink * Math.sin(rad), 0],
                [shrink * Math.sin(rad),  shrink * Math.cos(rad), 0],
                [0, 0, Math.pow(shrink, 0.85)]
              ];
              const x0 = [2.8, 0, 2.5];
              let prev = x0;
              scene.addSphere(x0, 0.11, '#fbbf24', { label: 'x₀' });
              for (let k = 1; k <= powerK; k++) {
                const xk = M.matVec(M.matPow(A, k), x0);
                scene.addCylinder(prev, xk, 0.025, '#38bdf8', 10);
                scene.addSphere(xk, 0.085, k === powerK ? '#34d399' : '#60a5fa');
                if (k === powerK) {
                  scene.addArrow([0, 0, 0], xk, '#34d399', { label: `A^${k} x₀` });
                }
                prev = xk;
              }
              const Ak = M.matPow(A, powerK);
              mathEl.innerHTML = `
                ${UI.kpiGridHtml([
                  { label: '当前幂次 k', value: `A^${powerK}`, color: '#38bdf8', sub: `det(A^k) = (det A)^k = ${M.fmt(M.det(Ak), 3)}` },
                  { label: '系统收敛性', value: shrink < 1 ? '渐近收敛 → 0' : (shrink > 1 ? '发散膨胀' : '等幅旋转'), color: shrink <= 1 ? '#34d399' : '#f43f5e', sub: `缩放率 ρ = ${M.fmt(shrink)}` }
                ])}
                <div class="math-flex-row">
                  <div>${UI.matHtml(A, { label: '单步矩阵 A', frac: false })}</div>
                  <div>${UI.matHtml(Ak, { label: `k次幂 A^${powerK}`, frac: false })}</div>
                </div>
                ${UI.formulaBoxHtml('方阵的幂与离散控制系统 x_k = Aᵏ x₀', `
                  <div class="math-line">每乘一次矩阵 A 对应一次状态演化：x₁ = Ax₀, x₂ = A²x₀, …, x_k = Aᵏx₀，在三维空间绘出螺旋状态轨迹。</div>
                `, 'accent')}
              `;
            }
          }

          function buildControls() {
            controlsEl.innerHTML = '';
            UI.mountToggleGroup(controlsEl, '实验子模块选择', [
              { label: '乘法非交换律 AB ≠ BA', value: 'noncomm' },
              { label: '方阵的幂 Aᵏ 螺旋演化', value: 'power' }
            ], subMode, v => { subMode = v; buildControls(); rebuild(); });

            if (subMode === 'noncomm') {
              UI.mountSlider(controlsEl, {
                label: '变换 B：绕 X 轴旋转角 θ_x', min: -180, max: 180, step: 5, value: angX, unit: '°', digits: 0, color: '#f87171',
                onChange: v => { angX = v; rebuild(); }
              });
              UI.mountSlider(controlsEl, {
                label: '变换 A：绕 Z 轴旋转角 θ_z', min: -180, max: 180, step: 5, value: angZ, unit: '°', digits: 0, color: '#38bdf8',
                onChange: v => { angZ = v; rebuild(); }
              });
            } else {
              UI.mountSlider(controlsEl, {
                label: '幂次指数 k (观察 Aᵏx₀)', min: 1, max: 18, step: 1, value: powerK, digits: 0, color: '#38bdf8',
                onChange: v => { powerK = v; rebuild(); }
              });
              UI.mountSlider(controlsEl, {
                label: '单步模长缩放因子 ρ', min: 0.75, max: 1.08, step: 0.01, value: shrink, color: '#34d399',
                onChange: v => { shrink = v; rebuild(); }
              });
              UI.mountSlider(controlsEl, {
                label: '单步旋转角 Δθ', min: 10, max: 75, step: 1, value: rotStepDeg, unit: '°', digits: 0, color: '#fbbf24',
                onChange: v => { rotStepDeg = v; rebuild(); }
              });
            }
          }

          buildControls();
          rebuild();
        }
      },

      // ==================== 2.3 ====================
      {
        id: 'ch2-trans-det',
        code: '2.3',
        title: '矩阵转置性质与方阵行列式定理 (|kA| = kⁿ|A|, |AB| = |A||B|)',
        week: '第 4–5 周',
        obeLevel: '掌握 & 理解',
        syllabusPoint: '转置运算性质 (AB)ᵀ = BᵀAᵀ，方阵行列式与矩阵运算的内在联系 |kA| = k³|A|、|AB| = |A||B|。',
        roboticsContext: '三维体素均匀放缩体积立方律与多级传动增益累积。',
        mount(ctx) {
          const { scene, controlsEl, mathEl } = ctx;
          scene.customTickCallback = null;

          let kScale = 1.6;
          let A = [
            [1.2, 0.4, 0],
            [0, 1.1, 0.3],
            [0, 0, 1.0]
          ];
          let B = [
            [1.0, 0, 0.3],
            [0.3, 1.2, 0],
            [0, 0, 1.1]
          ];
          let mode = 'scale'; // 'scale' | 'prod'

          function rebuild() {
            scene.clear();
            if (mode === 'scale') {
              const kA = M.matScale(A, kScale);
              const cA = M.transpose(A);
              const ckA = M.transpose(kA);
              scene.addParallelepiped(cA[0], cA[1], cA[2], '#94a3b8', { opacity: 0.18 });
              scene.addParallelepiped(ckA[0], ckA[1], ckA[2], '#38bdf8', { opacity: 0.28 });
              scene.addArrow([0, 0, 0], ckA[0], '#f87171', { label: `k·a₁` });
              scene.addArrow([0, 0, 0], ckA[1], '#34d399', { label: `k·a₂` });
              scene.addArrow([0, 0, 0], ckA[2], '#a78bfa', { label: `k·a₃` });

              const detA = M.det(A);
              const detkA = M.det(kA);
              mathEl.innerHTML = `
                ${UI.kpiGridHtml([
                  { label: '原方阵行列式 |A|', value: M.fmt(detA, 3), sub: 'n = 3 阶方阵' },
                  { label: '数乘后 |kA| = k³|A|', value: M.fmt(detkA, 3), color: '#38bdf8', sub: `k³ = (${M.fmt(kScale)})³ = ${M.fmt(Math.pow(kScale, 3), 3)} 倍！` }
                ])}
                <div class="math-flex-row">
                  <div>${UI.matHtml(A, { label: 'A', frac: false })}</div>
                  <div>${UI.matHtml(kA, { label: `${M.fmt(kScale)}A`, frac: false })}</div>
                </div>
                ${UI.formulaBoxHtml('易错点三维直观证明：为什么 |kA| = kⁿ|A| 而不是 k|A|？', `
                  <div class="math-line">矩阵数乘 <b>kA</b> 将所有 <b>n = 3</b> 个列向量同时伸长 k 倍（长×k、宽×k、高×k）！</div>
                  <div class="math-line">因此三维有向体积放大 <strong>k³ = ${M.fmt(Math.pow(kScale, 3), 3)}</strong> 倍：|kA| = ${M.fmt(Math.pow(kScale, 3), 3)} × ${M.fmt(detA, 3)} = <b>${M.fmt(detkA, 3)}</b>。</div>
                `, 'accent')}
              `;
            } else {
              const AB = M.matMul(A, B);
              const ABT = M.transpose(AB);
              const BTAT = M.matMul(M.transpose(B), M.transpose(A));
              const cB = M.transpose(B);
              const cAB = M.transpose(AB);

              scene.addParallelepiped([1, 0, 0], [0, 1, 0], [0, 0, 1], '#94a3b8', { opacity: 0.08 });
              scene.addParallelepiped(cB[0], cB[1], cB[2], '#34d399', { opacity: 0.18 });
              scene.addParallelepiped(cAB[0], cAB[1], cAB[2], '#fbbf24', { opacity: 0.28 });
              scene.addArrow([0, 0, 0], cAB[0], '#f87171', { label: 'ABe₁' });
              scene.addArrow([0, 0, 0], cAB[1], '#34d399', { label: 'ABe₂' });
              scene.addArrow([0, 0, 0], cAB[2], '#60a5fa', { label: 'ABe₃' });

              const dA = M.det(A), dB = M.det(B), dAB = M.det(AB);
              mathEl.innerHTML = `
                ${UI.kpiGridHtml([
                  { label: '乘积行列式 |AB|', value: M.fmt(dAB, 3), color: '#fbbf24', sub: `|A|·|B| = ${M.fmt(dA)} × ${M.fmt(dB)} = ${M.fmt(dA * dB, 3)}` },
                  { label: '穿脱原则 (AB)ᵀ = BᵀAᵀ', value: '恒成立', color: '#34d399', sub: `|Aᵀ| = |A| = ${M.fmt(dA)}` }
                ])}
                <div class="math-flex-row">
                  <div>${UI.matHtml(ABT, { label: '(AB)ᵀ', frac: false })}</div>
                  <div>${UI.matHtml(BTAT, { label: 'BᵀAᵀ', frac: false })}</div>
                </div>
                ${UI.formulaBoxHtml('两级体积放大率相乘定理 |AB| = |A|·|B|', `
                  <div class="math-line">单位立方体（体积 1）先经 B 放大 |B|=${M.fmt(dB)} 倍（绿色体），再经 A 放大 |A|=${M.fmt(dA)} 倍（金色体），总体积倍率必为 <b>|A||B| = ${M.fmt(dAB, 3)}</b>！</div>
                `, 'accent')}
              `;
            }
          }

          function buildControls() {
            controlsEl.innerHTML = '';
            UI.mountToggleGroup(controlsEl, '选择核心性质演示', [
              { label: '|kA| = k³|A| 体积定律', value: 'scale' },
              { label: '|AB|=|A||B| 与 (AB)ᵀ=BᵀAᵀ', value: 'prod' }
            ], mode, v => { mode = v; buildControls(); rebuild(); });

            if (mode === 'scale') {
              UI.mountSlider(controlsEl, {
                label: '数乘倍数 k', min: -1.8, max: 2.0, step: 0.1, value: kScale, color: '#38bdf8',
                onChange: v => { kScale = v; rebuild(); }
              });
            }
            UI.mountMatrixEditor(controlsEl, A, () => rebuild(), { title: '编辑矩阵 A', step: 0.2 });
          }

          buildControls();
          rebuild();
        }
      },

      // ==================== 2.4 ====================
      {
        id: 'ch2-inv-adj',
        code: '2.4',
        title: '逆矩阵可逆条件与伴随矩阵求逆法 (A⁻¹ = A* / |A|)',
        week: '第 5–6 周',
        obeLevel: '掌握',
        syllabusPoint: '逆矩阵定义 AA⁻¹ = I，可逆充要条件 |A| ≠ 0（非奇异），伴随矩阵 A* 构造及求逆步骤。',
        roboticsContext: '传感器标定逆变换与坐标刚性还原；奇异矩阵对应信息不可逆丢失。',
        mount(ctx) {
          const { scene, controlsEl, mathEl } = ctx;
          scene.customTickCallback = null;

          let A = [
            [2, 1, 0],
            [0, 1.5, 0.5],
            [0.5, 0, 1.5]
          ];
          let stage = 'both'; // 'forward' | 'inverse' | 'both'

          const presets = [
            { name: '非奇异可逆阵 (|A|≠0)', mat: [[2, 1, 0], [0, 1.5, 0.5], [0.5, 0, 1.5]] },
            { name: '整数逆矩阵良态例题', mat: [[1, 2, -1], [0, 1, 1], [0, 0, 1]] },
            { name: '奇异不可逆坍缩 (|A|=0)', mat: [[1, 2, 3], [2, 4, 6], [0, 1, 1]] }
          ];

          function rebuild() {
            scene.clear();
            const d = M.det(A);
            const adj = M.adjugate(A);
            const inv = M.inverse(A);
            const x = [1.2, 1.0, 0.8];
            const y = M.matVec(A, x);

            const colsA = M.transpose(A);
            scene.addParallelepiped(colsA[0], colsA[1], colsA[2], inv ? '#38bdf8' : '#f43f5e', { opacity: 0.22 });

            scene.addArrow([0, 0, 0], x, '#34d399', { label: '原向量 x' });
            if (stage === 'forward' || stage === 'both') {
              scene.addArrow([0, 0, 0], y, '#38bdf8', { label: 'y = Ax (正向变换)' });
              scene.addDashedLine(x, y, '#38bdf8', 1.8);
            }
            if (inv && (stage === 'inverse' || stage === 'both')) {
              const colsInv = M.transpose(inv);
              scene.addParallelepiped(colsInv[0], colsInv[1], colsInv[2], '#fbbf24', { opacity: 0.16 });
              const xBack = M.matVec(inv, y);
              scene.addDashedLine(y, xBack, '#fbbf24', 2.0);
              scene.addSphere(xBack, 0.11, '#fbbf24', { label: 'A⁻¹y = x (精确复原)' });
            }

            mathEl.innerHTML = `
              ${UI.kpiGridHtml([
                { label: '行列式 |A|', value: M.fmt(d, 3), color: inv ? '#34d399' : '#f43f5e', sub: inv ? '非奇异矩阵（满秩可逆）' : '奇异矩阵（空间压扁不可逆！）' },
                { label: '重要公式 |A*|', value: M.fmt(M.det(adj), 3), sub: `|A*| = |A|^(n-1) = ${M.fmt(d * d, 3)}` }
              ])}
              <div class="math-flex-row">
                <div>${UI.matHtml(A, { label: 'A' })}</div>
                <div>${UI.matHtml(adj, { label: '伴随阵 A*' })}</div>
              </div>
              ${inv ? `
                <div class="math-block-center">${UI.matHtml(inv, { label: 'A⁻¹ = (1/|A|)A*' })}</div>
                ${UI.formulaBoxHtml('伴随矩阵核心恒等式 AA* = A*A = |A|I', `
                  <div class="math-line">注意伴随矩阵 <b>A* 的第 j 列第 i 行元素是代数余子式 A<sub>ij</sub>（别漏转置！）</b>。</div>
                `, 'accent')}
              ` : UI.formulaBoxHtml('不可逆几何原因：维度坍缩', `
                <div class="math-line">当 <strong>|A| = 0</strong> 时，三维空间被压缩至低维平面/直线，无穷多个原向量 x 映射到同一个 y，故不存在逆映射 A⁻¹！</div>
              `, 'warn')}
            `;
          }

          function buildControls() {
            controlsEl.innerHTML = '';
            UI.mountPresets(controlsEl, presets, p => {
              A = M.cloneMat(p.mat);
              buildControls();
              rebuild();
            }, -1);

            UI.mountToggleGroup(controlsEl, '正逆变换显示模式', [
              { label: '正向 + 逆向闭环', value: 'both' },
              { label: '仅看正向 Ax', value: 'forward' },
              { label: '仅看逆向 A⁻¹', value: 'inverse' }
            ], stage, v => { stage = v; rebuild(); });

            UI.mountMatrixEditor(controlsEl, A, () => rebuild(), { title: '编辑方阵 A', step: 0.5 });
          }

          buildControls();
          rebuild();
        }
      },

      // ==================== 2.5 ====================
      {
        id: 'ch2-elem-inv',
        code: '2.5',
        title: '初等变换、初等矩阵与高斯-约旦求逆 [A | I] → [I | A⁻¹]',
        week: '第 6 周',
        obeLevel: '掌握（核心算法）',
        syllabusPoint: '三种初等变换与初等矩阵（左行右列定理），矩阵等价，初等行变换法求逆矩阵全流程。',
        roboticsContext: '在线状态估计器与多自由度控制增益矩阵实时数值求逆。',
        mount(ctx) {
          const { scene, controlsEl, mathEl } = ctx;
          scene.customTickCallback = null;

          let A = [
            [1, 1, 0],
            [1, 2, 1],
            [0, 1, 2]
          ];
          let stepIdx = 0;

          function getAugSteps() {
            const I = M.identity(3);
            const aug = A.map((r, i) => [...r, ...I[i]]);
            return M.gaussJordanSteps(aug, 3);
          }

          function rebuild() {
            scene.clear();
            const gj = getAugSteps();
            stepIdx = Math.max(0, Math.min(stepIdx, gj.steps.length - 1));
            const curStep = gj.steps[stepIdx];
            const M6 = curStep.matrix;
            const leftMat = M6.map(r => r.slice(0, 3));
            const rightMat = M6.map(r => r.slice(3, 6));

            // Left matrix columns morph from A -> I; Right matrix columns morph from I -> A^-1!
            const cL = M.transpose(leftMat);
            const cR = M.transpose(rightMat);

            scene.addParallelepiped(cL[0], cL[1], cL[2], '#38bdf8', { opacity: 0.24 });
            scene.addArrow([0, 0, 0], cL[0], '#38bdf8', { label: '左块列1 (A→I)' });
            scene.addArrow([0, 0, 0], cL[1], '#38bdf8', { label: '左块列2' });
            scene.addArrow([0, 0, 0], cL[2], '#38bdf8', { label: '左块列3' });

            scene.addParallelepiped(cR[0], cR[1], cR[2], '#fbbf24', { opacity: 0.18 });
            scene.addArrow([0, 0, 0], cR[0], '#fbbf24', { label: '右块列1 (I→A⁻¹)' });
            scene.addArrow([0, 0, 0], cR[1], '#fbbf24', { label: '右块列2' });
            scene.addArrow([0, 0, 0], cR[2], '#fbbf24', { label: '右块列3' });

            const invertible = gj.rank === 3;

            mathEl.innerHTML = `
              ${UI.kpiGridHtml([
                { label: `消元进度 (${stepIdx} / ${gj.steps.length - 1})`, value: curStep.title, color: '#38bdf8', sub: curStep.desc },
                { label: '等价标准形秩 r(A)', value: `r = ${gj.rank}`, color: invertible ? '#34d399' : '#f43f5e', sub: invertible ? 'A ≅ I₃（满秩可逆）' : 'r < 3，不可逆！' }
              ])}
              <div class="math-block-center">${UI.matHtml(M6, { augCol: 3, pivots: curStep.pivots, label: '[左块 | 右块]' })}</div>
              ${UI.formulaBoxHtml('初等行变换求逆原理：E_s … E₂ E₁ [A | I] = [I | A⁻¹]', `
                <div class="math-line">每次对左块施加初等行变换（相当于左乘初等矩阵 E_k），同时对右块施加完全相同的行变换。</div>
                <div class="math-line">三维视图中：<span style="color:#38bdf8">蓝色平行六面体从 A 逐步解耦回标准正方体 I</span>，而<span style="color:#fbbf24">金色平行六面体同步从 I 演化为逆矩阵 A⁻¹</span>！</div>
              `, 'accent')}
            `;
          }

          function buildControls() {
            controlsEl.innerHTML = '';
            const gj = getAugSteps();

            const stepWrap = document.createElement('div');
            stepWrap.innerHTML = `<div class="control-group-title">分步初等行变换控制器（共 ${gj.steps.length - 1} 步）</div>`;
            const bar = document.createElement('div');
            bar.className = 'preset-bar';
            const mkBtn = (txt, fn) => {
              const b = document.createElement('button');
              b.type = 'button';
              b.className = 'preset-btn';
              b.textContent = txt;
              b.addEventListener('click', fn);
              bar.appendChild(b);
            };
            mkBtn('⏮ 初始 [A|I]', () => { stepIdx = 0; rebuild(); });
            mkBtn('◀ 上一步', () => { stepIdx = Math.max(0, stepIdx - 1); rebuild(); });
            mkBtn('下一步 ▶', () => { stepIdx = Math.min(getAugSteps().steps.length - 1, stepIdx + 1); rebuild(); });
            mkBtn('⏭ 终态 [I|A⁻¹]', () => { stepIdx = getAugSteps().steps.length - 1; rebuild(); });
            stepWrap.appendChild(bar);
            controlsEl.appendChild(stepWrap);

            UI.mountMatrixEditor(controlsEl, A, () => {
              stepIdx = getAugSteps().steps.length - 1;
              buildControls();
              rebuild();
            }, { title: '编辑待求逆矩阵 A', step: 1 });
          }

          stepIdx = getAugSteps().steps.length - 1;
          buildControls();
          rebuild();
        }
      },

      // ==================== 2.6 ====================
      {
        id: 'ch2-block-rank',
        code: '2.6',
        title: '分块矩阵（机器人齐次变换 SE(3)）与矩阵的秩 r(A)',
        week: '第 7 周',
        obeLevel: '掌握',
        syllabusPoint: '分块矩阵运算规则与分块求逆优势，矩阵的秩 r(A) 定义及其像空间维度几何意义。',
        roboticsContext: '机器人学最核心的 4×4 齐次变换分块矩阵 T = [R, p; 0ᵀ, 1] 刚体位姿合成与逆变换！',
        mount(ctx) {
          const { scene, controlsEl, mathEl } = ctx;
          scene.customTickCallback = null;

          let tab = 'se3'; // 'se3' | 'rank'
          let yaw = 45, pitch = 25, px = 1.6, py = 1.2, pz = 1.0;
          let rankPresetIdx = 0;

          const rankPresets = [
            { name: '满秩 r(A) = 3（三维体）', mat: [[1.4, 0.3, 0], [0.2, 1.3, 0.2], [0, 0.3, 1.2]] },
            { name: '降秩 r(A) = 2（二维平面像）', mat: [[1.4, 0.4, 1.8], [0.2, 1.2, 1.4], [0.4, 0.8, 1.2]] },
            { name: '秩 r(A) = 1（一维直线像）', mat: [[1, 2, -1], [0.8, 1.6, -0.8], [0.6, 1.2, -0.6]] },
            { name: '零矩阵 r(A) = 0（坍缩至原点）', mat: [[0, 0, 0], [0, 0, 0], [0, 0, 0]] }
          ];

          function rebuild() {
            scene.clear();
            if (tab === 'se3') {
              const R = M.matMul(M.rotZ((yaw * Math.PI) / 180), M.rotY((pitch * Math.PI) / 180));
              const p = [px, py, pz];
              const T = M.makeSE3(R, p);
              const RT = M.transpose(R);
              const negRTp = M.vecScale(M.matVec(RT, p), -1);
              const TInv = M.makeSE3(RT, negRTp);

              // Base frame {0} and Target frame {B}
              scene.addTriad([0, 0, 0], M.identity(3), 0.9, 'W');
              scene.addArrow([0, 0, 0], p, '#fbbf24', { label: `平移块 p(${M.fmt(px)},${M.fmt(py)},${M.fmt(pz)})`, showProjections: true });
              scene.addTriad(p, R, 0.95, 'B');

              // Rigid cube attached to Frame {B}
              const b1 = [R[0][0] * 0.6, R[1][0] * 0.6, R[2][0] * 0.6];
              const b2 = [R[0][1] * 0.6, R[1][1] * 0.6, R[2][1] * 0.6];
              const b3 = [R[0][2] * 0.6, R[1][2] * 0.6, R[2][2] * 0.6];
              scene.addParallelepiped(b1, b2, b3, '#38bdf8', { origin: p, opacity: 0.28 });

              mathEl.innerHTML = `
                ${UI.kpiGridHtml([
                  { label: '4×4 分块结构', value: 'T = [R  p; 0ᵀ 1]', color: '#38bdf8', sub: '左上 3×3 姿态旋转 R，右上 3×1 位置平移 p' },
                  { label: '分块快速求逆', value: '无需高斯消元', color: '#34d399', sub: 'T⁻¹ = [Rᵀ, −Rᵀp; 0ᵀ, 1]' }
                ])}
                <div class="math-flex-row">
                  <div>${UI.matHtml(T, { rowSplit: 3, colSplit: 3, label: 'T', frac: false })}</div>
                  <div>${UI.matHtml(TInv, { rowSplit: 3, colSplit: 3, label: 'T⁻¹', frac: false })}</div>
                </div>
                ${UI.formulaBoxHtml('机器人工程中的分块矩阵乘法威力', `
                  <div class="math-line">三维平移不是线性变换，但升维构造 <b>4×4 分块齐次矩阵 T</b> 后，连续刚体运动合成直接化为分块乘法：</div>
                  <div class="math-line"><b>T₁T₂ = [R₁R₂, R₁p₂ + p₁; 0ᵀ, 1]</b>，利用正交块 R⁻¹ = Rᵀ 可瞬间写出分块逆矩阵 T⁻¹！</div>
                `, 'accent')}
              `;
            } else {
              const A = rankPresets[rankPresetIdx].mat;
              const rA = M.rank(A);
              const cols = M.transpose(A);
              // Sample points of [-1.5, 1.5]^3 mapped by A
              const mappedPts = [];
              for (let x = -1.2; x <= 1.21; x += 0.6) {
                for (let y = -1.2; y <= 1.21; y += 0.6) {
                  for (let z = -1.2; z <= 1.21; z += 0.6) {
                    mappedPts.push(M.matVec(A, [x, y, z]));
                  }
                }
              }
              scene.addPointCloud(mappedPts, '#38bdf8', 3.8);
              scene.addParallelepiped(cols[0], cols[1], cols[2], '#fbbf24', { opacity: 0.22 });
              scene.addArrow([0, 0, 0], cols[0], '#f87171', { label: 'a₁' });
              scene.addArrow([0, 0, 0], cols[1], '#34d399', { label: 'a₂' });
              scene.addArrow([0, 0, 0], cols[2], '#a78bfa', { label: 'a₃' });

              const dimNames = ['0 维（原点）', '1 维（过原点直线）', '2 维（过原点平面）', '3 维（整个三维空间）'];
              mathEl.innerHTML = `
                ${UI.kpiGridHtml([
                  { label: '矩阵的秩 r(A)', value: String(rA), color: '#fbbf24', sub: `列空间维数 = ${dimNames[rA]}` },
                  { label: '行列式 |A|', value: M.fmt(M.det(A), 3), sub: rA === 3 ? '满秩 |A| ≠ 0' : '降秩奇异 |A| = 0' }
                ])}
                <div class="math-flex-row">
                  <div>${UI.matHtml(A, { label: 'A', frac: false })}</div>
                  <div>${UI.matHtml(M.gaussJordanSteps(A).refMatrix, { label: '行阶梯形', frac: false })}</div>
                </div>
                ${UI.formulaBoxHtml('矩阵的秩几何本质：变换后像空间的真实维数', `
                  <div class="math-line">观察三维空间采样点云（蓝色点）在 A 作用下的去向：<b>r(A) = ${rA}</b> 时，三维体被映射为 <strong>${dimNames[rA]}</strong>！</div>
                `, 'accent')}
              `;
            }
          }

          function buildControls() {
            controlsEl.innerHTML = '';
            UI.mountToggleGroup(controlsEl, '选择教学知识点', [
              { label: '分块矩阵：机器人齐次变换 SE(3)', value: 'se3' },
              { label: '矩阵的秩 r(A) 维度坍缩', value: 'rank' }
            ], tab, v => { tab = v; buildControls(); rebuild(); });

            if (tab === 'se3') {
              UI.mountSlider(controlsEl, { label: '姿态偏航角 Yaw (绕Z)', min: -180, max: 180, step: 5, value: yaw, unit: '°', digits: 0, color: '#38bdf8', onChange: v => { yaw = v; rebuild(); } });
              UI.mountSlider(controlsEl, { label: '姿态俯仰角 Pitch (绕Y)', min: -90, max: 90, step: 5, value: pitch, unit: '°', digits: 0, color: '#34d399', onChange: v => { pitch = v; rebuild(); } });
              UI.mountSlider(controlsEl, { label: '平移 p_x', min: -2.5, max: 2.5, step: 0.1, value: px, color: '#fbbf24', onChange: v => { px = v; rebuild(); } });
              UI.mountSlider(controlsEl, { label: '平移 p_y', min: -2.5, max: 2.5, step: 0.1, value: py, color: '#fbbf24', onChange: v => { py = v; rebuild(); } });
              UI.mountSlider(controlsEl, { label: '平移 p_z', min: -1.5, max: 2.5, step: 0.1, value: pz, color: '#fbbf24', onChange: v => { pz = v; rebuild(); } });
            } else {
              UI.mountPresets(controlsEl, rankPresets, (_, idx) => {
                rankPresetIdx = idx;
                rebuild();
              }, rankPresetIdx);
            }
          }

          buildControls();
          rebuild();
        }
      }
    ]
  };

  global.LAChapters = global.LAChapters || [];
  global.LAChapters.push(CHAPTER_1, CHAPTER_2);
})(window);
