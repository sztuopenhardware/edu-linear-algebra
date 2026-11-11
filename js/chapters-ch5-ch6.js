/**
 * 第五章：特征值、相似矩阵与二次型 (6个实验案例)
 * 第六章：机器人工程综合仿真专题 (4个实验案例，适配2025级机器人工程专业 OBE 目标)
 */
(function (global) {
  'use strict';

  const M = global.LAMath;
  const UI = global.LAUI;

  const CHAPTER_5 = {
    id: 'ch5',
    code: '第五章',
    title: '第五章：特征值与特征向量、相似矩阵与二次型',
    weeks: '第 14–17 周 · 10 学时',
    summary: '系统掌握向量内积与施密特正交化、正交矩阵、特征值与特征向量、相似对角化、实对称矩阵正交对角化、二次型标准形与正定性判定。',
    cases: [
      // ==================== 5.1 ====================
      {
        id: 'ch5-inner-gs',
        code: '5.1',
        title: '向量内积、长度、夹角与施密特（Gram-Schmidt）正交化',
        week: '第 16 周（大纲第五章第1节）',
        obeLevel: '掌握（核心算法）',
        syllabusPoint: '向量内积 (x, y)、模长 ||x||、夹角余弦 cosθ，正交向量组性质，施密特正交化与单位化步骤。',
        roboticsContext: '力在运动方向的功投影计算；传感器斜交轴系正交标定（Gram-Schmidt 建系）。',
        mount(ctx) {
          const { scene, controlsEl, mathEl } = ctx;
          scene.customTickCallback = null;

          let mode = 'gs'; // 'inner' | 'gs'
          let u = [2.2, 0.6, 0.8];
          let v = [0.6, 2.0, 1.2];
          let gsStage = 4; // 0: raw alpha, 1: beta1, 2: beta2, 3: beta3, 4: orthonormal e1,e2,e3
          let gsMat = [
            [2.0, 1.2, 0.8],
            [0.2, 1.8, 1.0],
            [0.2, 0.3, 1.8]
          ];

          function rebuild() {
            scene.clear();
            if (mode === 'inner') {
              const uvDot = M.dot(u, v);
              const nu = M.norm(u), nv = M.norm(v);
              const ang = M.angleDeg(u, v);
              const projScale = nv > 1e-6 ? uvDot / (nv * nv) : 0;
              const projUonV = M.vecScale(v, projScale);

              scene.addArrow([0, 0, 0], u, '#f87171', { label: `x (||x||=${M.fmt(nu)})` });
              scene.addArrow([0, 0, 0], v, '#34d399', { label: `y (||y||=${M.fmt(nv)})` });
              scene.addArrow([0, 0, 0], projUonV, '#fbbf24', { label: 'proj_y(x) 正交投影', shaftRadius: 0.05 });
              scene.addDashedLine(u, projUonV, '#fbbf24', 2.0);
              scene.addAngleArc(u, v, { color: '#38bdf8', label: `θ = ${M.fmt(ang, 1)}°` });

              mathEl.innerHTML = `
                ${UI.kpiGridHtml([
                  { label: '向量内积 (x, y) = xᵀy', value: M.fmt(uvDot, 3), color: Math.abs(uvDot) < 1e-5 ? '#34d399' : '#38bdf8', sub: Math.abs(uvDot) < 1e-5 ? '(x, y) = 0 严格正交！' : (uvDot > 0 ? '锐角 (>0)' : '钝角 (<0)') },
                  { label: '空间夹角 θ', value: `${M.fmt(ang, 2)}°`, color: '#fbbf24', sub: `cosθ = ${nu * nv > 1e-6 ? M.fmt(uvDot / (nu * nv), 3) : '—'}` }
                ])}
                <div class="math-flex-row">
                  <div>${UI.vecHtml(u, 'x', '#f87171')}</div>
                  <div>${UI.vecHtml(v, 'y', '#34d399')}</div>
                  <div>${UI.vecHtml(projUonV, '投影向量', '#fbbf24')}</div>
                </div>
                ${UI.formulaBoxHtml('内积、长度、夹角与柯西-施瓦茨不等式 |(x,y)| ≤ ||x||·||y||', `
                  <div class="math-line">(x, y) = x₁y₁ + x₂y₂ + x₃y₃ = <b>${M.fmt(uvDot, 3)}</b>；|(x,y)| = ${M.fmt(Math.abs(uvDot), 2)} ≤ ||x||·||y|| = ${M.fmt(nu * nv, 2)}。</div>
                `, 'accent')}
              `;
              return;
            }

            // Gram-Schmidt 3D Step-by-Step Visualizer
            const alphas = M.transpose(gsMat);
            const gs = M.gramSchmidt(alphas);

            // Always show faint original skewed vectors
            alphas.forEach((a, i) => {
              scene.addArrow([0, 0, 0], a, gsStage === 0 ? ['#f87171', '#34d399', '#60a5fa'][i] : 'rgba(148,163,184,0.38)', {
                dashed: gsStage > 0,
                label: `α${i + 1}`
              });
            });

            if (gsStage >= 1 && gsStage <= 3 && gs.ortho[0]) {
              scene.addArrow([0, 0, 0], gs.ortho[0], '#f87171', { label: 'β₁ = α₁' });
            }
            if (gsStage >= 2 && gsStage <= 3 && gs.ortho[1]) {
              const proj1 = gs.steps[1].terms[0] ? gs.steps[1].terms[0].projVec : [0, 0, 0];
              if (gsStage === 2) {
                scene.addArrow([0, 0, 0], proj1, '#fbbf24', { label: '剔除投影分量' });
                scene.addDashedLine(proj1, alphas[1], '#34d399', 2.0);
              }
              scene.addArrow([0, 0, 0], gs.ortho[1], '#34d399', { label: 'β₂ ⊥ β₁' });
              scene.addAngleArc(gs.ortho[0], gs.ortho[1], { color: '#fbbf24', label: '90°' });
            }
            if (gsStage === 3 && gs.ortho[2]) {
              scene.addArrow([0, 0, 0], gs.ortho[2], '#60a5fa', { label: 'β₃ ⊥ Span(β₁,β₂)' });
              scene.addAngleArc(gs.ortho[0], gs.ortho[2], { color: '#fbbf24' });
              scene.addAngleArc(gs.ortho[1], gs.ortho[2], { color: '#fbbf24' });
            }
            if (gsStage === 4 && gs.unit.length === 3) {
              // Unit sphere wireframe + crisp orthonormal basis e1, e2, e3
              scene.addSphere([0, 0, 0], 1.0, '#38bdf8', { opacity: 0.12, wireframe: true });
              scene.addArrow([0, 0, 0], gs.unit[0], '#f87171', { label: 'e₁ (单位正交基)', shaftRadius: 0.05 });
              scene.addArrow([0, 0, 0], gs.unit[1], '#34d399', { label: 'e₂ (单位正交基)', shaftRadius: 0.05 });
              scene.addArrow([0, 0, 0], gs.unit[2], '#60a5fa', { label: 'e₃ (单位正交基)', shaftRadius: 0.05 });
              scene.addAngleArc(gs.unit[0], gs.unit[1], { color: '#fbbf24' });
              scene.addAngleArc(gs.unit[1], gs.unit[2], { color: '#fbbf24' });
            }

            const stageNames = [
              '第 0 步：初始斜交线性无关向量组 {α₁, α₂, α₃}',
              '第 1 步：取第一个正交基准 β₁ = α₁',
              '第 2 步：减去 α₂ 在 β₁ 上的投影 → β₂ = α₂ − [(α₂,β₁)/(β₁,β₁)]β₁',
              '第 3 步：减去 α₃ 在 β₁, β₂ 上的两个投影 → β₃ 垂直于底面！',
              '第 4 步：全部单位化 eᵢ = βᵢ / ||βᵢ|| → 标准正交基（落在单位球面上）！'
            ];

            mathEl.innerHTML = `
              ${UI.kpiGridHtml([
                { label: '当前正交化阶段', value: `Step ${gsStage} / 4`, color: '#38bdf8', sub: stageNames[gsStage] },
                { label: '两两正交检验', value: '(eᵢ, eⱼ) = δᵢⱼ', color: '#34d399', sub: '内积为 0 且模长为 1' }
              ])}
              <div class="math-flex-row">
                <div>${UI.matHtml(M.transpose(gs.ortho), { label: '[β₁, β₂, β₃]', frac: false })}</div>
                <div>${UI.matHtml(M.transpose(gs.unit), { label: '正交阵 Q=[e₁,e₂,e₃]', frac: false })}</div>
              </div>
              ${UI.formulaBoxHtml('施密特（Gram-Schmidt）正交化递推公式', `
                <div class="math-line">• <b>β₁ = α₁</b></div>
                <div class="math-line">• <b>β₂ = α₂ − [(α₂, β₁)/(β₁, β₁)] β₁</b></div>
                <div class="math-line">• <b>β₃ = α₃ − [(α₃, β₁)/(β₁, β₁)] β₁ − [(α₃, β₂)/(β₂, β₂)] β₂</b>，最后 <b>eᵢ = βᵢ / ||βᵢ||</b>。</div>
              `, 'accent')}
            `;
          }

          function buildControls() {
            controlsEl.innerHTML = '';
            UI.mountToggleGroup(controlsEl, '选择第五章第1节实验模块', [
              { label: '施密特正交化 3D 分步动画', value: 'gs' },
              { label: '向量内积、模长与夹角', value: 'inner' }
            ], mode, val => { mode = val; buildControls(); rebuild(); });

            if (mode === 'gs') {
              UI.mountToggleGroup(controlsEl, '点击切换施密特正交化步骤', [
                { label: '0: 原始斜基', value: 0 },
                { label: '1: 定 β₁', value: 1 },
                { label: '2: 正交化 β₂', value: 2 },
                { label: '3: 正交化 β₃', value: 3 },
                { label: '4: 单位化 eᵢ', value: 4 }
              ], gsStage, val => { gsStage = val; rebuild(); });

              UI.mountMatrixEditor(controlsEl, gsMat, () => rebuild(), {
                title: '编辑初始向量组 [α₁, α₂, α₃]',
                colLabels: ['α₁', 'α₂', 'α₃'],
                step: 0.2
              });
            } else {
              const mat2 = [[u[0], v[0]], [u[1], v[1]], [u[2], v[2]]];
              UI.mountMatrixEditor(controlsEl, mat2, m => {
                u = [m[0][0], m[1][0], m[2][0]];
                v = [m[0][1], m[1][1], m[2][1]];
                rebuild();
              }, { title: '编辑向量 [x, y]', colLabels: ['x', 'y'], step: 0.2 });
            }
          }

          buildControls();
          rebuild();
        }
      },

      // ==================== 5.2 ====================
      {
        id: 'ch5-ortho-mat',
        code: '5.2',
        title: '正交矩阵定义、判定与空间刚体正交变换 (QᵀQ = I)',
        week: '第 16 周（大纲第五章第2节）',
        obeLevel: '掌握',
        syllabusPoint: '正交矩阵定义 QᵀQ = I（Q⁻¹ = Qᵀ），行列式 |Q| = ±1，保内积、保长度、保夹角刚体变换性质。',
        roboticsContext: '三维旋转矩阵群 SO(3) 姿态解算（|Q|=+1 纯旋转 vs |Q|=−1 镜像反射）。',
        mount(ctx) {
          const { scene, controlsEl, mathEl } = ctx;
          scene.customTickCallback = null;

          let kind = 'rot'; // 'rot' | 'refl'
          let zDeg = 50, yDeg = 30, xDeg = 20;

          function rebuild() {
            scene.clear();
            let Q = M.matMul(M.rotZ((zDeg * Math.PI) / 180), M.matMul(M.rotY((yDeg * Math.PI) / 180), M.rotX((xDeg * Math.PI) / 180)));
            if (kind === 'refl') {
              // Multiply by mirror reflection across XY plane diag(1, 1, -1) -> det(Q) = -1!
              Q = M.matMul([[1, 0, 0], [0, 1, 0], [0, 0, -1]], Q);
            }

            const check = M.isOrthogonal(Q);
            const pA = [1.8, 0.4, 0.8];
            const pB = [0.4, 1.6, 1.0];
            const qA = M.matVec(Q, pA);
            const qB = M.matVec(Q, pB);

            // Faint original pair + bold transformed pair
            scene.addArrow([0, 0, 0], pA, 'rgba(248,113,113,0.35)', { dashed: true, label: 'x' });
            scene.addArrow([0, 0, 0], pB, 'rgba(52,211,153,0.35)', { dashed: true, label: 'y' });
            scene.addAngleArc(pA, pB, { color: 'rgba(148,163,184,0.5)', radius: 0.55 });

            scene.addArrow([0, 0, 0], qA, '#f87171', { label: 'Qx' });
            scene.addArrow([0, 0, 0], qB, '#34d399', { label: 'Qy' });
            scene.addAngleArc(qA, qB, { color: '#fbbf24', radius: 0.65, label: `夹角不变 ${M.fmt(M.angleDeg(qA, qB), 1)}°` });

            const colsQ = M.transpose(Q);
            scene.addParallelepiped(colsQ[0], colsQ[1], colsQ[2], kind === 'rot' ? '#38bdf8' : '#f43f5e', { opacity: 0.22 });

            mathEl.innerHTML = `
              ${UI.kpiGridHtml([
                { label: '正交性检验 QᵀQ = I', value: check.ok ? '严格正交阵 ✓' : '非正交', color: '#34d399', sub: `|Q| = ${M.fmt(check.det, 2)} (${kind === 'rot' ? '右手纯旋转 SO(3)' : '含镜像反射 O(3)'})` },
                { label: '保长保角验证', value: `||Qx|| = ${M.fmt(M.norm(qA), 3)}`, color: '#fbbf24', sub: `原长 ||x|| = ${M.fmt(M.norm(pA), 3)} · 夹角恒为 ${M.fmt(M.angleDeg(pA, pB), 1)}°` }
              ])}
              <div class="math-flex-row">
                <div>${UI.matHtml(Q, { label: '正交阵 Q', frac: false })}</div>
                <div>${UI.matHtml(M.transpose(Q), { label: 'Q⁻¹ = Qᵀ', frac: false })}</div>
              </div>
              ${UI.formulaBoxHtml('正交矩阵四大充要/核心性质', `
                <div class="math-line">1. <b>QᵀQ = QQᵀ = I ⟺ Q⁻¹ = Qᵀ</b>（求逆只需转置，机器人实时姿态运算零开销！）；</div>
                <div class="math-line">2. Q 的列（行）向量组必为 ℝ³ 的<strong>标准正交基</strong>；3. <b>|Q| = +1</b>（刚体旋转）或 <b>−1</b>（旋转+反射）；4. <b>(Qx, Qy) = xᵀQᵀQy = (x, y)</b>（保内积、保模长、保夹角）。</div>
              `, 'accent')}
            `;
          }

          function buildControls() {
            controlsEl.innerHTML = '';
            UI.mountToggleGroup(controlsEl, '正交变换类型（对比 |Q|=+1 与 |Q|=−1）', [
              { label: '|Q| = +1 刚体旋转 SO(3)', value: 'rot' },
              { label: '|Q| = −1 旋转+镜像反射', value: 'refl' }
            ], kind, v => { kind = v; rebuild(); });

            UI.mountSlider(controlsEl, { label: '偏航角 α (绕Z)', min: -180, max: 180, step: 5, value: zDeg, unit: '°', digits: 0, color: '#60a5fa', onChange: v => { zDeg = v; rebuild(); } });
            UI.mountSlider(controlsEl, { label: '俯仰角 β (绕Y)', min: -90, max: 90, step: 5, value: yDeg, unit: '°', digits: 0, color: '#34d399', onChange: v => { yDeg = v; rebuild(); } });
            UI.mountSlider(controlsEl, { label: '横滚角 γ (绕X)', min: -180, max: 180, step: 5, value: xDeg, unit: '°', digits: 0, color: '#f87171', onChange: v => { xDeg = v; rebuild(); } });
          }

          buildControls();
          rebuild();
        }
      },

      // ==================== 5.3 ====================
      {
        id: 'ch5-eigen',
        code: '5.3',
        title: '方阵特征值与特征向量的几何本质及求解 (Aξ = λξ)',
        week: '第 14 周',
        obeLevel: '掌握（核心重点）',
        syllabusPoint: '特征方程 |λI − A| = 0，特征值与特征向量求法，性质 Σλᵢ = tr(A) 与 Πλᵢ = |A|。',
        roboticsContext: '在矩阵线性变换下方向保持共线不变的“空间不变主轴”与系统模态频率。',
        mount(ctx) {
          const { scene, controlsEl, mathEl } = ctx;
          scene.customTickCallback = null;

          let A = [
            [2.0, 0.5, 0.0],
            [0.5, 1.5, 0.0],
            [0.0, 0.0, 0.8]
          ];
          let morphT = 1.0;

          const presets = [
            { name: '三实特征值拉伸椭球', mat: [[2.0, 0.5, 0.0], [0.5, 1.5, 0.0], [0.0, 0.0, 0.8]] },
            { name: '含负特征值反向翻转 (λ<0)', mat: [[1.8, 0.4, 0], [0.4, 1.2, 0], [0, 0, -1.2]] },
            { name: '含零特征值降秩压扁 (λ=0)', mat: [[1.6, 0.6, 0], [0.6, 1.4, 0], [0, 0, 0]] },
            { name: '含共轭复特征值（旋转不变平面）', mat: [[0.8, -1.1, 0], [1.1, 0.8, 0], [0, 0, 1.5]] }
          ];

          function rebuild() {
            scene.clear();
            const I = M.identity(3);
            const At = M.matAdd(M.matScale(I, 1 - morphT), M.matScale(A, morphT));
            const eig = M.eigen3x3(A);

            // Unit sphere ghost + Morphed Ellipsoid At(S^2)
            scene.addSphere([0, 0, 0], 1.0, '#94a3b8', { opacity: 0.09, wireframe: true });
            scene.addSphere([0, 0, 0], 1.0, '#38bdf8', { opacity: 0.22, wireframe: true, matrix3x3: At });

            // Sample ordinary vector knocked off its span line!
            const vSample = M.normalize([1, 1, 0.9]);
            const AvSample = M.matVec(At, vSample);
            scene.addDashedLine([0, 0, 0], M.vecScale(vSample, 2.5), 'rgba(148,163,184,0.45)', 1.4);
            scene.addArrow([0, 0, 0], AvSample, '#94a3b8', { label: '普通向量 Ax (偏离原直线)' });

            // Highlight real eigenvectors and their invariant span lines!
            const eigColors = ['#fbbf24', '#34d399', '#f472b6'];
            eig.eigenvectors.forEach((xiRaw, idx) => {
              const xi = M.normalize(xiRaw);
              const Axi = M.matVec(At, xi);
              const seg = global.LAScene3D.clipLineToBox([0, 0, 0], xi, 3.4);
              if (seg) scene.addDashedLine(seg[0], seg[1], eigColors[idx % 3], 2.0);
              scene.addArrow([0, 0, 0], Axi, eigColors[idx % 3], {
                shaftRadius: 0.055,
                label: `Aξ${idx + 1} = λξ${idx + 1}`
              });
            });

            if (eig.hasComplex && eig.complexPlaneBasis) {
              const [u1, u2] = eig.complexPlaneBasis;
              scene.addPlane(M.cross(u1, u2), 0, '#a78bfa', { opacity: 0.20, label: '复特征值旋转不变平面' });
            }

            const trA = M.trace(A);
            const detA = M.det(A);
            const eigStr = eig.eigenvalues.map((ev, i) =>
              Math.abs(ev.im) < 1e-6
                ? `λ<sub>${i + 1}</sub> = <b>${M.fmt(ev.re, 2)}</b>`
                : `λ<sub>${i + 1}</sub> = <b>${M.fmt(ev.re, 2)} ${ev.im >= 0 ? '+' : '−'} ${M.fmt(Math.abs(ev.im), 2)}i</b>`
            ).join(' ， ');

            const cp = eig.charPoly;
            mathEl.innerHTML = `
              ${UI.kpiGridHtml([
                { label: '迹性质 Σλᵢ = tr(A)', value: `${M.fmt(trA, 2)}`, color: '#34d399', sub: '特征值之和等于主对角元之和' },
                { label: '行列式性质 Πλᵢ = |A|', value: `${M.fmt(detA, 2)}`, color: '#fbbf24', sub: '特征值之积等于方阵行列式' }
              ])}
              <div class="math-block-center">${UI.matHtml(A, { label: 'A', frac: false })}</div>
              ${UI.formulaBoxHtml('特征多项式与特征值/特征向量求解结果', `
                <div class="math-line">特征方程 |λI − A| = λ³ ${cp[1] >= 0 ? '+' : '−'} ${M.fmt(Math.abs(cp[1]))}λ² ${cp[2] >= 0 ? '+' : '−'} ${M.fmt(Math.abs(cp[2]))}λ ${cp[3] >= 0 ? '+' : '−'} ${M.fmt(Math.abs(cp[3]))} = 0</div>
                <div class="math-line">特征值：${eigStr}</div>
                <div class="math-line">几何本质：拖动插值滑块 t 观察单位球变形——普通灰色向量偏离原方向，唯独<strong>彩色特征向量始终锁定在各自的不变虚线轴上做纯伸缩（Aξ = λξ）</strong>！</div>
              `, 'accent')}
            `;
          }

          function buildControls() {
            controlsEl.innerHTML = '';
            UI.mountPresets(controlsEl, presets, p => {
              A = M.cloneMat(p.mat);
              morphT = 1.0;
              buildControls();
              rebuild();
            }, 0);

            UI.mountSlider(controlsEl, {
              label: '变换演化进度 t：I ⟶ A（观察特征方向不变性）',
              min: 0, max: 1, step: 0.02, value: morphT, color: '#fbbf24',
              onChange: v => { morphT = v; rebuild(); }
            });

            UI.mountMatrixEditor(controlsEl, A, () => rebuild(), { title: '编辑三阶方阵 A', step: 0.2 });
          }

          buildControls();
          rebuild();
        }
      },

      // ==================== 5.4 ====================
      {
        id: 'ch5-sim-diag',
        code: '5.4',
        title: '相似矩阵、可对角化条件与实对称阵正交对角化 (P⁻¹AP = Λ)',
        week: '第 15–16 周',
        obeLevel: '掌握（核心定理）',
        syllabusPoint: '相似矩阵性质，方阵可相似对角化的充要条件（n 个线性无关特征向量），实对称矩阵正交相似对角化 QᵀAQ = Λ。',
        roboticsContext: '耦合多变量状态方程 x(k+1)=Ax(k) 相似变换解耦为独立标量通道！',
        mount(ctx) {
          const { scene, controlsEl, mathEl } = ctx;
          scene.customTickCallback = null;

          const presets = [
            { name: '实对称矩阵（必可正交对角化 QᵀAQ=Λ）', mat: [[2.0, 0.6, 0.2], [0.6, 1.4, 0.4], [0.2, 0.4, 1.0]] },
            { name: '一般可对角化非对称阵 (P⁻¹AP=Λ)', mat: [[2.0, 1.0, 0.0], [0.0, 1.2, 0.5], [0.0, 0.0, 0.8]] },
            { name: '不可相似对角化！（二重根仅1个特征向量）', mat: [[1.5, 1.2, 0.0], [0.0, 1.5, 0.0], [0.0, 0.0, 1.0]] }
          ];
          let A = M.cloneMat(presets[0].mat);
          let stage = 3; // 0: x, 1: P^-1 x, 2: Lambda P^-1 x, 3: P Lambda P^-1 x = Ax

          function rebuild() {
            scene.clear();
            const eig = M.eigen3x3(A);
            const x = [1.2, 0.9, 0.8];

            if (!eig.diagonalizable) {
              // Show defective matrix shear geometry!
              scene.addSphere([0, 0, 0], 1.0, '#f43f5e', { opacity: 0.22, wireframe: true, matrix3x3: A });
              eig.eigenvectors.forEach((v, i) => {
                scene.addArrow([0, 0, 0], M.vecScale(M.normalize(v), 2.0), '#fbbf24', { label: `仅存特征向量 ξ${i + 1}` });
              });
              mathEl.innerHTML = `
                ${UI.kpiGridHtml([
                  { label: '可对角化判定', value: '不可相似对角化 ✗', color: '#f43f5e', sub: `线性无关特征向量仅 ${eig.eigenvectors.length} 个 < 3` },
                  { label: '重根亏损原因', value: '几何重数 < 代数重数', color: '#fbbf24', sub: '存在不可消除的剪切项（Jordan块）' }
                ])}
                <div class="math-block-center">${UI.matHtml(A, { label: '亏损矩阵 A', frac: false })}</div>
                ${UI.formulaBoxHtml('可相似对角化充要条件反例警示', `
                  <div class="math-line">虽然特征值全为实数，但重特征值 λ = 1.5 对应的齐次方程 (1.5I − A)x = 0 秩为 2，基础解系只有 1 个向量，凑不够 3 个线性无关特征向量构成可逆矩阵 P！</div>
                `, 'warn')}
              `;
              return;
            }

            const P = eig.P;
            const PInv = eig.PInv;
            const Lam = [
              [eig.realValues[0], 0, 0],
              [0, eig.realValues[1], 0],
              [0, 0, eig.realValues[2]]
            ];

            const s0 = x;
            const s1 = M.matVec(PInv, s0);
            const s2 = M.matVec(Lam, s1);
            const s3 = M.matVec(P, s2); // == Ax!

            // Draw eigenbasis vectors
            const colsP = M.transpose(P);
            scene.addArrow([0, 0, 0], colsP[0], '#f87171', { label: 'p₁', opacity: 0.7 });
            scene.addArrow([0, 0, 0], colsP[1], '#34d399', { label: 'p₂', opacity: 0.7 });
            scene.addArrow([0, 0, 0], colsP[2], '#60a5fa', { label: 'p₃', opacity: 0.7 });

            const pts = [s0, s1, s2, s3];
            const labels = ['① 初始向量 x', '② 变基坐标 y = P⁻¹x', '③ 轴向纯伸缩 Λy', '④ 还原 Py = PΛP⁻¹x = Ax'];
            scene.addArrow([0, 0, 0], pts[stage], '#fbbf24', {
              label: labels[stage],
              shaftRadius: 0.055,
              showProjections: true
            });
            for (let k = 0; k < stage; k++) {
              scene.addDashedLine(pts[k], pts[k + 1], '#38bdf8', 2.0);
              scene.addSphere(pts[k], 0.08, '#94a3b8');
            }

            mathEl.innerHTML = `
              ${UI.kpiGridHtml([
                { label: '对角化类型', value: eig.isSymmetric ? '正交相似对角化 QᵀAQ=Λ' : '一般相似对角化 P⁻¹AP=Λ', color: '#34d399', sub: eig.isSymmetric ? '实对称阵不同特征值之特征向量必正交！' : '含 3 个线性无关特征向量' },
                { label: '当前分解步骤', value: `阶段 ${stage + 1} / 4`, color: '#fbbf24', sub: labels[stage] }
              ])}
              <div class="math-flex-row">
                <div>${UI.matHtml(P, { label: eig.isSymmetric ? '正交阵 Q' : '可逆阵 P', frac: false })}</div>
                <div>${UI.matHtml(Lam, { label: '对角阵 Λ', frac: false })}</div>
              </div>
              ${UI.formulaBoxHtml('相似对角化三步分解图景：A = P Λ P⁻¹  ⟹  Aᵏ = P Λᵏ P⁻¹', `
                <div class="math-line">复杂的耦合空间变换 <b>Ax</b> 等价于：① 用 <b>P⁻¹</b> 读出特征基坐标 ⟶ ② 用对角阵 <b>Λ</b> 沿坐标轴独立乘 λᵢ ⟶ ③ 用 <b>P</b> 转换回原空间！</div>
              `, 'accent')}
            `;
          }

          function buildControls() {
            controlsEl.innerHTML = '';
            UI.mountPresets(controlsEl, presets, p => {
              A = M.cloneMat(p.mat);
              stage = 3;
              buildControls();
              rebuild();
            }, 0);

            UI.mountToggleGroup(controlsEl, '分步观察 Ax = P · Λ · P⁻¹ x 分解流水线', [
              { label: '① 初始 x', value: 0 },
              { label: '② P⁻¹x 变基', value: 1 },
              { label: '③ Λ(P⁻¹x) 伸缩', value: 2 },
              { label: '④ PΛP⁻¹x 终态', value: 3 }
            ], stage, v => { stage = v; rebuild(); });

            UI.mountMatrixEditor(controlsEl, A, () => rebuild(), { title: '编辑三阶方阵 A', step: 0.2 });
          }

          buildControls();
          rebuild();
        }
      },

      // ==================== 5.5 ====================
      {
        id: 'ch5-quad-std',
        code: '5.5',
        title: '二次型矩阵表示与正交变换化标准形、规范形 (x = Qy)',
        week: '第 16–17 周',
        obeLevel: '掌握（必考大题）',
        syllabusPoint: '二次型 f(x) = xᵀAx 对称矩阵表示，正交变换法与拉格朗日配方法化二次型为标准形，惯性定理与规范形。',
        roboticsContext: '三维转动惯量张量主轴对齐（消除惯性积交叉项 xy, xz, yz）！',
        mount(ctx) {
          const { scene, controlsEl, mathEl } = ctx;
          scene.customTickCallback = null;

          let A = [
            [2.0, 0.8, 0.4],
            [0.8, 1.6, 0.4],
            [0.4, 0.4, 1.2]
          ];
          let alignT = 0.0; // 0: tilted in x-space, 1: aligned standard form in y-space!

          const presets = [
            { name: '含交叉项椭球面 (p=3, q=0)', mat: [[2.0, 0.8, 0.4], [0.8, 1.6, 0.4], [0.4, 0.4, 1.2]] },
            { name: '经典教材对称阵 f=2x₁²+2x₂²+2x₃²+2x₁x₂', mat: [[2, 1, 0], [1, 2, 0], [0, 0, 1]] },
            { name: '不定双曲面二次型 (p=2, q=1)', mat: [[1.5, 0.8, 0], [0.8, 1.5, 0], [0, 0, -1.0]] }
          ];

          function rebuild() {
            scene.clear();
            const qf = M.analyzeQuadraticForm(A);
            const lams = qf.eigenvalues;
            const Q = qf.Q;

            // Interpolate rotation from Q (tilted) to I (aligned principal axes!)
            // Semi-axes lengths for x^T A x = 1 when lam > 0: r_i = 1 / sqrt(|lam_i|)
            const semi = lams.map(l => (Math.abs(l) > 0.12 ? Math.min(2.8, 1 / Math.sqrt(Math.abs(l))) : 2.6));
            const diagSemi = [
              [semi[0], 0, 0],
              [0, semi[1], 0],
              [0, 0, semi[2]]
            ];
            const rotInterp = M.matAdd(M.matScale(Q, 1 - alignT), M.matScale(M.identity(3), alignT));
            // Orthonormalize interpolated frame via Gram-Schmidt for pure rigid rotation!
            const gsRot = M.gramSchmidt(M.transpose(rotInterp));
            const Rcur = M.transpose(gsRot.unit);

            if (qf.defCode === 'pos_def') {
              const shapeMat = M.matMul(Rcur, diagSemi);
              scene.addSphere([0, 0, 0], 1.0, '#38bdf8', { opacity: 0.30, wireframe: true, matrix3x3: shapeMat });
            } else {
              // Plot z = f(x1, x2, 0) rotated by Rcur in XY!
              scene.addSurfaceZ((x, y) => {
                // Current symmetric matrix in interpolated frame
                const LamMat = [[lams[0], 0, 0], [0, lams[1], 0], [0, 0, lams[2]]];
                const Mcur = M.matMul(Rcur, M.matMul(LamMat, M.transpose(Rcur)));
                return 0.45 * (Mcur[0][0] * x * x + 2 * Mcur[0][1] * x * y + Mcur[1][1] * y * y);
              }, { range: 2.0, segments: 26, opacity: 0.72 });
            }

            // Draw the 3 orthonormal principal axes!
            const axesCols = M.transpose(Rcur);
            const pColors = ['#f87171', '#34d399', '#fbbf24'];
            axesCols.forEach((ax, i) => {
              scene.addArrow([0, 0, 0], M.vecScale(ax, semi[i] + 0.35), pColors[i], {
                label: `主轴 q${i + 1} (λ${i + 1}=${M.fmt(lams[i], 2)})`,
                shaftRadius: 0.048
              });
            });

            const stdTerms = lams.map((l, i) => `(${M.fmt(l, 2)})y<sub>${i + 1}</sub>²`).join(' + ');
            const canTerms = lams.map((l, i) => {
              if (Math.abs(l) < 1e-6) return null;
              return `${l > 0 ? '+' : '−'} z<sub>${i + 1}</sub>²`;
            }).filter(Boolean).join(' ');

            mathEl.innerHTML = `
              ${UI.kpiGridHtml([
                { label: '正交变换标准形 f(y)', value: `λ₁y₁² + λ₂y₂² + λ₃y₃²`, color: '#38bdf8', sub: `特征值 (${M.fmt(lams[0])}, ${M.fmt(lams[1])}, ${M.fmt(lams[2])})` },
                { label: '惯性指数 (p, q) 与秩', value: `p=${qf.posIndex}, q=${qf.negIndex}, r=${qf.rank}`, color: '#fbbf24', sub: `规范形：${canTerms || '0'}` }
              ])}
              <div class="math-flex-row">
                <div>${UI.matHtml(qf.A, { label: '二次型矩阵 A', frac: false })}</div>
                <div>${UI.matHtml(Q, { label: '正交变换阵 Q', frac: false })}</div>
              </div>
              ${UI.formulaBoxHtml('主轴定理几何精髓：正交变换 x = Qy 不改变曲面形状，只旋转坐标轴对准主轴！', `
                <div class="math-line">原二次型含交叉项 2a₁₂x₁x₂ = ${M.fmt(2 * qf.A[0][1])}x₁x₂ 等导致椭球/曲面斜置；</div>
                <div class="math-line">令 <b>x = Qy</b> 后交叉项彻底归零，化为纯平方和标准形：<strong>f = ${stdTerms}</strong>！</div>
              `, 'accent')}
            `;
          }

          function buildControls() {
            controlsEl.innerHTML = '';
            UI.mountPresets(controlsEl, presets, p => {
              A = M.cloneMat(p.mat);
              alignT = 0;
              buildControls();
              rebuild();
            }, 0);

            UI.mountSlider(controlsEl, {
              label: '正交旋转摆正主轴动画 (0 = 原斜置坐标系 x ⟶ 1 = 标准形主轴系 y)',
              min: 0, max: 1, step: 0.02, value: alignT, color: '#34d399',
              onChange: v => { alignT = v; rebuild(); }
            });

            UI.mountMatrixEditor(controlsEl, A, () => rebuild(), {
              title: '编辑实对称二次型矩阵 A（自动保持 a_ij = a_ji）',
              symmetric: true,
              step: 0.2
            });
          }

          buildControls();
          rebuild();
        }
      },

      // ==================== 5.6 ====================
      {
        id: 'ch5-pos-def',
        code: '5.6',
        title: '正定二次型与对称矩阵有定性判定（顺序主子式 & 特征值法）',
        week: '第 17 周',
        obeLevel: '掌握（核心判定）',
        syllabusPoint: '正定二次型定义 f(x) > 0 (x ≠ 0)，赫尔维茨/西尔维斯特顺序主子式判据 Δ_k > 0 与特征值全正判据。',
        roboticsContext: '机器人动能矩阵 1/2 q̇ᵀM(q)q̇ 恒正定性，以及控制李雅普诺夫能量碗全局渐近稳定判定！',
        mount(ctx) {
          const { scene, controlsEl, mathEl } = ctx;
          scene.customTickCallback = null;

          const presets = [
            { name: '正定：凸碗面（全局极小稳定点）', mat: [[2.0, 0.5, 0], [0.5, 1.5, 0], [0, 0, 1.2]] },
            { name: '不定：双曲马鞍面（鞍点不稳定）', mat: [[1.6, 0.3, 0], [0.3, -1.4, 0], [0, 0, 1.0]] },
            { name: '半正定：抛物柱面山谷 (Δ₂=0)', mat: [[1.2, 1.2, 0], [1.2, 1.2, 0], [0, 0, 1.0]] },
            { name: '负定：倒扣抛物穹顶（全局极大）', mat: [[-1.8, -0.4, 0], [-0.4, -1.4, 0], [0, 0, -1.0]] }
          ];
          let A = M.cloneMat(presets[0].mat);

          function rebuild() {
            scene.clear();
            const qf = M.analyzeQuadraticForm(A);
            const [d1, d2, d3] = qf.leadingMinors;

            // Render 3D energy surface z = 0.35 * (a11 x^2 + 2 a12 x y + a22 y^2)
            scene.addSurfaceZ((x, y) => {
              return 0.38 * (qf.A[0][0] * x * x + 2 * qf.A[0][1] * x * y + qf.A[1][1] * y * y);
            }, { range: 2.1, segments: 30, opacity: 0.78 });

            // Origin equilibrium ball
            scene.addSphere([0, 0, 0], 0.14, '#fbbf24', { label: '原点 x=0 (f=0)' });

            const defColor = qf.defCode === 'pos_def' ? '#34d399' : (qf.defCode === 'indefinite' ? '#f43f5e' : '#fbbf24');
            const sylvOk = d1 > 1e-7 && d2 > 1e-7 && d3 > 1e-7;

            mathEl.innerHTML = `
              ${UI.kpiGridHtml([
                { label: '二次型有定性结论', value: qf.definiteness, color: defColor, sub: qf.defCode === 'pos_def' ? '∀x≠0, f(x) > 0 严格成立！' : '观察三维能量曲面凹凸形态' },
                { label: '顺序主子式 (Δ₁, Δ₂, Δ₃)', value: `(${M.fmt(d1)}, ${M.fmt(d2)}, ${M.fmt(d3)})`, color: sylvOk ? '#34d399' : '#fbbf24', sub: sylvOk ? 'Δ₁>0, Δ₂>0, Δ₃>0 ⟺ 正定！' : '不全大于 0，非正定' }
              ])}
              <div class="math-block-center">${UI.matHtml(qf.A, { label: '实对称阵 A', frac: false })}</div>
              ${UI.formulaBoxHtml('正定二次型双保险充要判据对比', `
                <div class="math-line">1. <strong>顺序主子式判据（Sylvester 定理）</strong>：Δ₁ = a₁₁ = <b>${M.fmt(d1)}</b>，Δ₂ = |A₂| = <b>${M.fmt(d2)}</b>，Δ₃ = |A| = <b>${M.fmt(d3)}</b>（全大于 0 则正定；负正负交替 Δ₁&lt;0, Δ₂&gt;0, Δ₃&lt;0 则负定）。</div>
                <div class="math-line">2. <strong>特征值判据</strong>：λ₁ = <b>${M.fmt(qf.eigenvalues[0])}</b>, λ₂ = <b>${M.fmt(qf.eigenvalues[1])}</b>, λ₃ = <b>${M.fmt(qf.eigenvalues[2])}</b>（全部 &gt; 0 ⟺ 正定）。</div>
              `, qf.defCode === 'pos_def' ? 'accent' : 'info')}
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
              title: '编辑实对称矩阵 A（实时重绘三维能量面 z = xᵀAx）',
              symmetric: true,
              step: 0.2
            });
          }

          buildControls();
          rebuild();
        }
      }
    ]
  };

  // ==================== CHAPTER 6: ROBOTICS CAPSTONE ====================
  const CHAPTER_6 = {
    id: 'ch6',
    code: '第六章（专业综合）',
    title: '第六章：机器人工程综合应用专题 (Robotics Capstone)',
    weeks: '贯穿第 4–18 周 · 支撑课程目标 3 & 4',
    summary: '紧扣深圳技术大学中德智能制造学院 2025 级机器人工程专业培养目标，将矩阵分块变换、行列式与秩、线性方程组、特征值与正定二次型融汇于真实机器人核心场景。',
    cases: [
      // ==================== 6.1 ====================
      {
        id: 'ch6-fk-arm',
        code: '6.1',
        title: '空间三自由度机械臂正运动学与齐次坐标变换链',
        week: '对应第 4、6、7 周工程融合',
        obeLevel: '综合应用（课程目标 3）',
        syllabusPoint: '综合运用旋转正交矩阵 SO(3)、4×4 分块齐次矩阵乘法链 T₀₃ = T₀₁T₁₂T₂₃ 解算机械臂末端空间位姿。',
        roboticsContext: '工业机械臂正运动学（Forward Kinematics）实时三维数字孪生解算器！',
        mount(ctx) {
          const { scene, controlsEl, mathEl } = ctx;
          scene.customTickCallback = null;

          let th1 = 35, th2 = 40, th3 = -55;
          const trail = [];

          function rebuild() {
            scene.clear();
            const kin = M.robot3DOFKinematics(th1, th2, th3);
            trail.push(kin.p3.slice());
            if (trail.length > 60) trail.shift();

            for (let i = 1; i < trail.length; i++) {
              scene.addLine(trail[i - 1], trail[i], 'rgba(52, 211, 153, 0.55)', 2.0);
            }
            scene.addRobotArm(kin);

            mathEl.innerHTML = `
              ${UI.kpiGridHtml([
                { label: '末端笛卡尔位置 p₀₃', value: `(${M.fmt(kin.p3[0], 2)}, ${M.fmt(kin.p3[1], 2)}, ${M.fmt(kin.p3[2], 2)}) m`, color: '#34d399', sub: 'T₀₃ 右上 3×1 平移分块' },
                { label: '姿态块正交验证 |R₀₃|', value: M.fmt(M.det(kin.R03), 4), color: '#38bdf8', sub: 'R₀₃ᵀR₀₃ = I₃, |R₀₃| ≡ +1' }
              ])}
              <div class="math-block-center">${UI.matHtml(kin.T03, { rowSplit: 3, colSplit: 3, label: '总位姿 T₀₃ = T₀₁T₁₂T₂₃', frac: false })}</div>
              ${UI.formulaBoxHtml('线性代数赋能国产工业机器人运动学建模', `
                <div class="math-line">每个关节旋转与连杆长度封装为一个 4×4 分块齐次矩阵 <b>Tᵢ₋₁,ᵢ</b>；无论机械臂有多少个自由度，末端总位姿只需依次进行<strong>矩阵连乘 T₀ₙ = T₀₁T₁₂…Tₙ₋₁,ₙ</strong>！</div>
              `, 'accent')}
            `;
          }

          function buildControls() {
            controlsEl.innerHTML = '';
            UI.mountSlider(controlsEl, { label: '关节 1 腰部回转 θ₁ (绕 Z₀)', min: -180, max: 180, step: 2, value: th1, unit: '°', digits: 0, color: '#60a5fa', onChange: v => { th1 = v; rebuild(); } });
            UI.mountSlider(controlsEl, { label: '关节 2 大臂俯仰 θ₂', min: -30, max: 120, step: 2, value: th2, unit: '°', digits: 0, color: '#38bdf8', onChange: v => { th2 = v; rebuild(); } });
            UI.mountSlider(controlsEl, { label: '关节 3 小臂屈伸 θ₃', min: -140, max: 140, step: 2, value: th3, unit: '°', digits: 0, color: '#818cf8', onChange: v => { th3 = v; rebuild(); } });

            const clearBtn = document.createElement('button');
            clearBtn.type = 'button';
            clearBtn.className = 'preset-btn';
            clearBtn.textContent = '清空末端运动轨迹线';
            clearBtn.addEventListener('click', () => { trail.length = 0; rebuild(); });
            controlsEl.appendChild(clearBtn);
          }

          buildControls();
          rebuild();
        }
      },

      // ==================== 6.2 ====================
      {
        id: 'ch6-jacobian',
        code: '6.2',
        title: '机械臂雅可比矩阵 v = J(θ)θ̇、可操作度椭球与奇异位形',
        week: '贯通第 1–5 章核心概念',
        obeLevel: '综合拔高（课程目标 1, 2, 3）',
        syllabusPoint: '融汇行列式 |J|=0 奇异判据、矩阵的秩亏损 r(J)<3、线性方程组速度逆解与实对称阵 JJᵀ 特征椭球！',
        roboticsContext: '当小臂完全伸直（θ₃ = 0°）时，|J| → 0，三维速度可操作度椭球压扁成二维薄饼（奇异死点）！',
        mount(ctx) {
          const { scene, controlsEl, mathEl } = ctx;
          scene.customTickCallback = null;

          let th1 = 25, th2 = 30, th3 = -50;

          const presets = [
            { name: '良态灵活位姿 (θ₃ = −55°, |J|≠0)', angles: [25, 35, -55] },
            { name: '肘部完全伸直奇异位形! (θ₃ = 0°, |J|=0)', angles: [25, 25, 0] },
            { name: '肩部过顶奇异位形! (r = 0, |J|=0)', angles: [25, 90, 0] }
          ];

          function rebuild() {
            scene.clear();
            const kin = M.robot3DOFKinematics(th1, th2, th3);
            scene.addRobotArm(kin);

            // Render Manipulability Velocity Ellipsoid centered at gripper p3!
            // Semi-axes = sqrt(eigenvalues of J*J^T) * visual scale 0.35
            const eig = kin.manipEig;
            const semi = eig.values.map(v => 0.38 * Math.sqrt(Math.max(0, v)));
            const ellipMat = M.matMul(eig.Q, [
              [semi[0], 0, 0],
              [0, semi[1], 0],
              [0, 0, semi[2]]
            ]);
            const singular = Math.abs(kin.detJ) < 0.03;
            scene.addSphere(kin.p3, 1.0, singular ? '#f43f5e' : '#34d399', {
              opacity: 0.30,
              wireframe: true,
              matrix3x3: ellipMat
            });

            // Principal velocity axes at gripper
            eig.vectors.forEach((vec, idx) => {
              if (semi[idx] > 0.03) {
                scene.addArrow(kin.p3, M.vecAdd(kin.p3, M.vecScale(vec, semi[idx] + 0.15)), '#fbbf24', {
                  shaftRadius: 0.022,
                  headRadius: 0.055,
                  headLen: 0.12
                });
              }
            });

            const wManip = Math.sqrt(Math.max(0, M.det(kin.JJT))); // Yoshikawa manipulability = |det(J)|
            mathEl.innerHTML = `
              ${UI.kpiGridHtml([
                { label: '雅可比行列式 |J(θ)|', value: M.fmt(kin.detJ, 3), color: singular ? '#f43f5e' : '#34d399', sub: singular ? '⚠️ 奇异位形！秩降至 r=' + kin.rankJ : '满秩 r(J) = 3，各方向运动自如' },
                { label: '可操作度指标 w = √|JJᵀ|', value: M.fmt(wManip, 3), color: '#fbbf24', sub: '可操作度椭球体积正比于 |det(J)|' }
              ])}
              <div class="math-flex-row">
                <div>${UI.matHtml(kin.J, { label: '速度雅可比 J(θ)', frac: false })}</div>
                <div>${UI.matHtml(kin.JJT, { label: '对称阵 JJᵀ', frac: false })}</div>
              </div>
              ${UI.formulaBoxHtml('四大章节知识在机械臂奇异分析中的大一统！', `
                <div class="math-line">末端线速度满足线性方程组 <b>v = J(θ)θ̇</b>：</div>
                <div class="math-line">• <b>第一章/第二章</b>：当 θ₃ = 0°（手臂伸直），<b>|J| = 0</b>，J 不可逆，秩 <b>r(J) 从 3 跌落至 2</b>；</div>
                <div class="math-line">• <b>第四章/第五章</b>：实对称半正定矩阵 <b>JJᵀ</b> 有一个特征值变为 0，末端绿色<strong>可操作度椭球坍缩为红色二维薄片</strong>，沿径向彻底丧失运动能力！</div>
              `, singular ? 'warn' : 'accent')}
            `;
          }

          function buildControls() {
            controlsEl.innerHTML = '';
            UI.mountPresets(controlsEl, presets, p => {
              [th1, th2, th3] = p.angles;
              buildControls();
              rebuild();
            }, 0);
            UI.mountSlider(controlsEl, { label: '腰部角 θ₁', min: -180, max: 180, step: 2, value: th1, unit: '°', digits: 0, color: '#60a5fa', onChange: v => { th1 = v; rebuild(); } });
            UI.mountSlider(controlsEl, { label: '大臂角 θ₂', min: -20, max: 110, step: 2, value: th2, unit: '°', digits: 0, color: '#38bdf8', onChange: v => { th2 = v; rebuild(); } });
            UI.mountSlider(controlsEl, { label: '小臂角 θ₃（调至 0° 观察奇异坍缩！）', min: -130, max: 130, step: 1, value: th3, unit: '°', digits: 0, color: '#f43f5e', onChange: v => { th3 = v; rebuild(); } });
          }

          buildControls();
          rebuild();
        }
      },

      // ==================== 6.3 ====================
      {
        id: 'ch6-pca-cloud',
        code: '6.3',
        title: '机器人视觉点云 PCA 主成分分析与抓取姿态估计',
        week: '对应第 16 周感知定位融合',
        obeLevel: '综合应用（课程目标 2, 3）',
        syllabusPoint: '利用 3×3 样本协方差实对称矩阵 C = (1/N)XᵀX 的正交相似对角化提取三维物体主方向与法向量。',
        roboticsContext: '3D 深度相机点云工件位姿估计与机械爪最优抓取轴解算。',
        mount(ctx) {
          const { scene, controlsEl, mathEl } = ctx;
          scene.customTickCallback = null;

          let yawDeg = 38, tiltDeg = 26, noise = 0.12;

          // Deterministic pseudo-random point cloud generator so sliders feel smooth
          function genCloud() {
            const ptsLocal = [];
            for (let i = 0; i < 95; i++) {
              const s1 = Math.sin(i * 12.9898) * 43758.5453;
              const s2 = Math.sin(i * 78.233 + 1.2) * 24634.6345;
              const s3 = Math.sin(i * 39.425 + 2.7) * 19543.1234;
              const u1 = (s1 - Math.floor(s1)) * 2 - 1;
              const u2 = (s2 - Math.floor(s2)) * 2 - 1;
              const u3 = (s3 - Math.floor(s3)) * 2 - 1;
              // Elongated rectangular workpiece: L = 2.1, W = 0.95, H = 0.25 + noise
              ptsLocal.push([u1 * 2.1, u2 * 0.95, u3 * (0.22 + noise * 1.5)]);
            }
            const R = M.matMul(M.rotZ((yawDeg * Math.PI) / 180), M.rotX((tiltDeg * Math.PI) / 180));
            const center = [0.4, 0.3, 0.6];
            return ptsLocal.map(p => M.vecAdd(M.matVec(R, p), center));
          }

          function rebuild() {
            scene.clear();
            const pts = genCloud();
            const N = pts.length;
            const mean = [0, 0, 0];
            pts.forEach(p => { mean[0] += p[0]; mean[1] += p[1]; mean[2] += p[2]; });
            mean[0] /= N; mean[1] /= N; mean[2] /= N;

            // Covariance matrix C (3x3 symmetric positive semi-definite!)
            const C = M.zeros(3, 3);
            pts.forEach(p => {
              const d = M.vecSub(p, mean);
              for (let r = 0; r < 3; r++) {
                for (let c = 0; c < 3; c++) C[r][c] += (d[r] * d[c]) / N;
              }
            });

            const eig = M.jacobiSymmetricEigen(C);
            scene.addPointCloud(pts, '#38bdf8', 3.8);
            scene.addSphere(mean, 0.11, '#fbbf24', { label: '质心 μ' });

            const axisColors = ['#f87171', '#34d399', '#fbbf24'];
            const axisNames = ['第一主轴 q₁ (长轴)', '第二主轴 q₂ (抓取宽轴)', '第三主轴 q₃ (表面法向)'];
            eig.vectors.forEach((q, idx) => {
              const len = Math.max(0.7, 1.9 * Math.sqrt(Math.max(0, eig.values[idx])));
              scene.addArrow(mean, M.vecAdd(mean, M.vecScale(q, len)), axisColors[idx], {
                label: axisNames[idx],
                shaftRadius: 0.048
              });
            });

            // Draw oriented bounding box from PCA eigenvectors!
            const extents = eig.values.map(v => Math.max(0.18, 1.73 * Math.sqrt(Math.max(0, v))));
            const v1 = M.vecScale(eig.vectors[0], extents[0] * 2);
            const v2 = M.vecScale(eig.vectors[1], extents[1] * 2);
            const v3 = M.vecScale(eig.vectors[2], extents[2] * 2);
            const corner = M.vecSub(mean, M.vecScale(M.vecAdd(M.vecAdd(v1, v2), v3), 0.5));
            scene.addParallelepiped(v1, v2, v3, '#34d399', { origin: corner, opacity: 0.12 });

            const totalVar = eig.values.reduce((s, v) => s + v, 0) || 1;
            mathEl.innerHTML = `
              ${UI.kpiGridHtml([
                { label: '协方差特征值 (λ₁, λ₂, λ₃)', value: `(${M.fmt(eig.values[0], 2)}, ${M.fmt(eig.values[1], 2)}, ${M.fmt(eig.values[2], 2)})`, color: '#38bdf8', sub: `长轴方差占比 ${M.fmt((eig.values[0] / totalVar) * 100, 1)}%` },
                { label: '估计姿态正交阵 Q', value: 'QᵀCQ = Λ', color: '#34d399', sub: '最小特征值对应工件表面法向量 q₃' }
              ])}
              <div class="math-flex-row">
                <div>${UI.matHtml(C, { label: '协方差阵 C', frac: false })}</div>
                <div>${UI.matHtml(eig.Q, { label: '姿态主轴 Q=[q₁,q₂,q₃]', frac: false })}</div>
              </div>
              ${UI.formulaBoxHtml('第五章实对称矩阵正交对角化在机器视觉中的直接落地', `
                <div class="math-line">三维点云去中心化后构造协方差矩阵 <b>C = (1/N)Σ(pᵢ−μ)(pᵢ−μ)ᵀ</b>（必为实对称半正定矩阵！）。</div>
                <div class="math-line">对其做正交对角化 <b>QᵀCQ = diag(λ₁, λ₂, λ₃)</b>：最大特征向量 <b>q₁</b> 给出工件主延伸方向，最小特征向量 <b>q₃</b> 直接给出吸盘/夹爪垂直接近法向量！</div>
              `, 'accent')}
            `;
          }

          function buildControls() {
            controlsEl.innerHTML = '';
            UI.mountSlider(controlsEl, { label: '待测工件偏航角 Yaw', min: -180, max: 180, step: 3, value: yawDeg, unit: '°', digits: 0, color: '#38bdf8', onChange: v => { yawDeg = v; rebuild(); } });
            UI.mountSlider(controlsEl, { label: '待测工件倾角 Tilt', min: -75, max: 75, step: 3, value: tiltDeg, unit: '°', digits: 0, color: '#34d399', onChange: v => { tiltDeg = v; rebuild(); } });
            UI.mountSlider(controlsEl, { label: '传感器点云噪声强度 σ', min: 0.0, max: 0.45, step: 0.02, value: noise, color: '#fbbf24', onChange: v => { noise = v; rebuild(); } });
          }

          buildControls();
          rebuild();
        }
      },

      // ==================== 6.4 ====================
      {
        id: 'ch6-modal-lqr',
        code: '6.4',
        title: '机器人多自由度振动模态分析与正定二次型能量收敛',
        week: '对应第 14、17 周振动模态与控制优化',
        obeLevel: '综合应用（课程目标 2, 3, 4）',
        syllabusPoint: '利用刚度矩阵特征值与特征向量解耦三自由度结构固有振型，结合正定李雅普诺夫二次型验证状态收敛。',
        roboticsContext: '柔性关节机械臂共振模态抑制与 LQR 最优状态反馈控制。',
        mount(ctx) {
          const { scene, controlsEl, mathEl } = ctx;
          let modeIdx = 0; // 0: Mode 1, 1: Mode 2, 2: Mode 3
          let damping = 0.12;
          let playing = true;
          let simTime = 0;

          // Classic 3-DOF spring-mass chain stiffness matrix K (m = 1):
          const K = [
            [2, -1, 0],
            [-1, 2, -1],
            [0, -1, 2]
          ];
          const eig = M.jacobiSymmetricEigen(K);
          // Sort ascending by natural frequency omega = sqrt(lambda)!
          const modes = [2, 1, 0].map(idx => ({
            lam: eig.values[idx],
            omega: Math.sqrt(Math.max(0, eig.values[idx])),
            shape: eig.vectors[idx]
          }));

          function renderFrame() {
            scene.clear();
            const cur = modes[modeIdx];
            const env = Math.exp(-damping * simTime);
            const phase = Math.cos(cur.omega * simTime * 2.4);
            const disp = cur.shape.map(v => v * 1.45 * env * phase);

            // Draw 3 masses along Z-axis (z = -1.6, 0, +1.6) vibrating laterally along X!
            const zLevels = [-1.6, 0.0, 1.6];
            const anchorBot = [0, 0, -2.8];
            const anchorTop = [0, 0, 2.8];
            scene.addCylinder([-0.5, 0, -2.8], [0.5, 0, -2.8], 0.06, '#64748b', 10);
            scene.addCylinder([-0.5, 0, 2.8], [0.5, 0, 2.8], 0.06, '#64748b', 10);
            scene.addDashedLine(anchorBot, anchorTop, 'rgba(148,163,184,0.35)', 1.4);

            const massPts = zLevels.map((z, i) => [disp[i], 0, z]);
            scene.addCylinder(anchorBot, massPts[0], 0.035, '#38bdf8', 10);
            scene.addCylinder(massPts[0], massPts[1], 0.035, '#38bdf8', 10);
            scene.addCylinder(massPts[1], massPts[2], 0.035, '#38bdf8', 10);
            scene.addCylinder(massPts[2], anchorTop, 0.035, '#38bdf8', 10);

            const mCols = ['#f87171', '#34d399', '#fbbf24'];
            massPts.forEach((pt, i) => {
              scene.addSphere(pt, 0.24, mCols[i]);
              scene.addArrow([0, 0, zLevels[i]], pt, mCols[i], {
                label: `关节质量 m${i + 1}: x=${M.fmt(disp[i], 2)}`
              });
            });

            // Also plot subtle quadratic potential energy bowl V(q1, q2) = 1/2 q^T K q on offset floor
            const potentialE = 0.5 * M.dot(disp, M.matVec(K, disp));
            scene.addLabel([0, 0, 3.25], `第 ${modeIdx + 1} 阶固有模态 ω = ${M.fmt(cur.omega, 2)} rad/s · 势能 V = ${M.fmt(potentialE, 2)}`, {
              color: '#38bdf8',
              fontSize: 13
            });
          }

          function updateMath() {
            const cur = modes[modeIdx];
            const modeDesc = [
              '一阶基频同相模态：三个关节质量同向摆动（最低固有频率，幅值最大，工程中最需主动抑振！）',
              '二阶反对称模态：中间质量静止为节点（x₂=0），上下两质量反向摆动',
              '三阶高频反相模态：相邻质量交替反向高频振动（能量耗散最快）'
            ][modeIdx];

            mathEl.innerHTML = `
              ${UI.kpiGridHtml([
                { label: `第 ${modeIdx + 1} 阶特征值 λ = ω²`, value: `λ = ${M.fmt(cur.lam, 3)}`, color: '#38bdf8', sub: `固有角频率 ω = √λ = ${M.fmt(cur.omega, 3)} rad/s` },
                { label: '刚度二次型势能 V = ½xᵀKx', value: '严格正定 (Δ₁,Δ₂,Δ₃ > 0)', color: '#34d399', sub: '|K₁|=2, |K₂|=3, |K₃|=4 > 0' }
              ])}
              <div class="math-flex-row">
                <div>${UI.matHtml(K, { label: '刚度矩阵 K' })}</div>
                <div>${UI.vecHtml(cur.shape, `振型特征向量 φ_${modeIdx + 1}`, '#fbbf24')}</div>
              </div>
              ${UI.formulaBoxHtml('动力学方程 Mẍ + Kx = 0 模态解耦原理', `
                <div class="math-line">${modeDesc}</div>
                <div class="math-line">由于刚度矩阵 <b>K</b> 实对称正定，3 个模态特征向量 <b>φ₁, φ₂, φ₃</b> 彼此正交，将耦合微分方程组彻底解耦为 3 个独立谐振子！</div>
              `, 'accent')}
            `;
          }

          scene.customTickCallback = dt => {
            if (playing) {
              simTime += dt;
              renderFrame();
            }
          };

          function buildControls() {
            controlsEl.innerHTML = '';
            UI.mountToggleGroup(controlsEl, '切换三自由度固有振动模态（特征向量 φᵢ）', [
              { label: '一阶同相振型 φ₁', value: 0 },
              { label: '二阶节点振型 φ₂', value: 1 },
              { label: '三阶反相振型 φ₃', value: 2 }
            ], modeIdx, v => { modeIdx = v; simTime = 0; updateMath(); renderFrame(); });

            UI.mountSlider(controlsEl, {
              label: '控制阻尼比 ζ（耗散二次型能量）', min: 0, max: 0.6, step: 0.02, value: damping, color: '#34d399',
              onChange: v => { damping = v; simTime = 0; }
            });

            const btnBar = document.createElement('div');
            btnBar.className = 'preset-bar';
            const playBtn = document.createElement('button');
            playBtn.type = 'button';
            playBtn.className = 'preset-btn active';
            playBtn.textContent = '⏸ 暂停 / ▶ 继续振动';
            playBtn.addEventListener('click', () => { playing = !playing; });

            const trigBtn = document.createElement('button');
            trigBtn.type = 'button';
            trigBtn.className = 'preset-btn';
            trigBtn.textContent = '⚡ 重新激励初始脉冲';
            trigBtn.addEventListener('click', () => { simTime = 0; playing = true; renderFrame(); });

            btnBar.appendChild(playBtn);
            btnBar.appendChild(trigBtn);
            controlsEl.appendChild(btnBar);
          }

          buildControls();
          updateMath();
          renderFrame();
        }
      }
    ]
  };

  global.LAChapters = global.LAChapters || [];
  global.LAChapters.push(CHAPTER_5, CHAPTER_6);
})(window);
