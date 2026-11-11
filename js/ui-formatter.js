/**
 * 《线性代数》交互式 3D 教学仿真实验平台 - 数学公式与交互式矩阵排版组件
 */
(function (global) {
  'use strict';

  const M = global.LAMath;

  // Render static display matrix or determinant with optional highlights, augmented dividers, block splits
  function matHtml(mat, opts = {}) {
    if (!mat || !mat.length) return '';
    const isDet = opts.type === 'det';
    const augCol = opts.augCol !== undefined ? opts.augCol : -1;
    const rowSplit = opts.rowSplit !== undefined ? opts.rowSplit : -1;
    const colSplit = opts.colSplit !== undefined ? opts.colSplit : -1;
    const crossedRow = opts.crossedRow !== undefined ? opts.crossedRow : -1;
    const crossedCol = opts.crossedCol !== undefined ? opts.crossedCol : -1;
    const highlightRow = opts.highlightRow !== undefined ? opts.highlightRow : -1;
    const highlightCol = opts.highlightCol !== undefined ? opts.highlightCol : -1;
    const pivotSet = new Set((opts.pivots || []).map(p => `${p[0]},${p[1]}`));
    const useFrac = opts.frac !== false;
    const digits = opts.digits !== undefined ? opts.digits : 2;

    let rowsHtml = '';
    for (let i = 0; i < mat.length; i++) {
      let cellsHtml = '';
      for (let j = 0; j < mat[i].length; j++) {
        const cls = ['la-cell'];
        if (j === augCol) cls.push('la-aug-left');
        if (j === colSplit) cls.push('la-block-left');
        if (i === rowSplit) cls.push('la-block-top');
        if (i === crossedRow || j === crossedCol) cls.push('la-crossed');
        if (i === crossedRow && j === crossedCol) cls.push('la-cofactor-focus');
        if (i === highlightRow || j === highlightCol) cls.push('la-highlight');
        if (pivotSet.has(`${i},${j}`)) cls.push('la-pivot');

        const raw = mat[i][j];
        const valStr = typeof raw === 'string'
          ? raw
          : (useFrac ? M.fmtFrac(raw) : M.fmt(raw, digits));
        cellsHtml += `<td class="${cls.join(' ')}">${valStr}</td>`;
      }
      rowsHtml += `<tr>${cellsHtml}</tr>`;
    }

    const wrapCls = isDet ? 'la-matrix la-det' : 'la-matrix la-brk';
    const caption = opts.label ? `<span class="la-mat-label">${opts.label} = </span>` : '';
    return `<span class="la-mat-expr">${caption}<span class="${wrapCls}"><table><tbody>${rowsHtml}</tbody></table></span></span>`;
  }

  function vecHtml(vec, label = '', color = '') {
    const colMat = vec.map(v => [v]);
    const dotStyle = color ? `<span class="color-dot" style="background:${color}"></span>` : '';
    const lbl = label ? `${dotStyle}${label}` : '';
    return matHtml(colMat, { label: lbl, frac: true });
  }

  function kpiGridHtml(items) {
    return `<div class="kpi-grid">${items.map(it => `
      <div class="kpi-card ${it.accent || ''}">
        <div class="kpi-label">${it.label}</div>
        <div class="kpi-value" ${it.color ? `style="color:${it.color}"` : ''}>${it.value}</div>
        ${it.sub ? `<div class="kpi-sub">${it.sub}</div>` : ''}
      </div>
    `).join('')}</div>`;
  }

  function formulaBoxHtml(title, bodyHtml, type = 'info') {
    return `
      <div class="formula-box formula-${type}">
        ${title ? `<div class="formula-title">${title}</div>` : ''}
        <div class="formula-body">${bodyHtml}</div>
      </div>
    `;
  }

  // Mount interactive numeric matrix editor into container element
  function mountMatrixEditor(container, mat, onChange, opts = {}) {
    const rows = mat.length;
    const cols = mat[0].length;
    const step = opts.step || 0.5;
    const augCol = opts.augCol !== undefined ? opts.augCol : -1;
    const colLabels = opts.colLabels || null;

    const wrap = document.createElement('div');
    wrap.className = 'matrix-editor-wrap';
    if (opts.title) {
      const ttl = document.createElement('div');
      ttl.className = 'control-group-title';
      ttl.innerHTML = opts.title;
      wrap.appendChild(ttl);
    }

    const tableWrap = document.createElement('div');
    tableWrap.className = 'la-matrix la-brk matrix-editor-brk';
    const table = document.createElement('table');

    if (colLabels) {
      const thead = document.createElement('thead');
      const tr = document.createElement('tr');
      colLabels.forEach((lbl, j) => {
        const th = document.createElement('th');
        th.className = j === augCol ? 'la-aug-left editor-col-hdr' : 'editor-col-hdr';
        th.innerHTML = lbl;
        tr.appendChild(th);
      });
      thead.appendChild(tr);
      table.appendChild(thead);
    }

    const tbody = document.createElement('tbody');
    for (let i = 0; i < rows; i++) {
      const tr = document.createElement('tr');
      for (let j = 0; j < cols; j++) {
        const td = document.createElement('td');
        if (j === augCol) td.className = 'la-aug-left';
        const inp = document.createElement('input');
        inp.type = 'number';
        inp.step = String(step);
        inp.className = 'matrix-cell-input';
        inp.value = String(M.cleanZero(mat[i][j]));
        if (opts.symmetric && i !== j) {
          inp.title = '实对称矩阵自动同步对称项 a_ij = a_ji';
        }
        inp.addEventListener('input', () => {
          const val = parseFloat(inp.value);
          if (Number.isFinite(val)) {
            mat[i][j] = val;
            if (opts.symmetric && i !== j && j < rows && i < cols) {
              mat[j][i] = val;
              const mirror = tbody.querySelector(`input[data-rc="${j},${i}"]`);
              if (mirror) mirror.value = String(val);
            }
            onChange(mat, i, j);
          }
        });
        inp.dataset.rc = `${i},${j}`;
        td.appendChild(inp);
        tr.appendChild(td);
      }
      tbody.appendChild(tr);
    }
    table.appendChild(tbody);
    tableWrap.appendChild(table);
    wrap.appendChild(tableWrap);
    container.appendChild(wrap);
    return wrap;
  }

  // Mount slider control
  function mountSlider(container, cfg) {
    const row = document.createElement('div');
    row.className = 'slider-control';
    const header = document.createElement('div');
    header.className = 'slider-header';
    const lbl = document.createElement('span');
    lbl.className = 'slider-label';
    lbl.innerHTML = cfg.label;
    const valSpan = document.createElement('span');
    valSpan.className = 'slider-val';
    const unit = cfg.unit || '';
    valSpan.textContent = `${M.fmt(cfg.value, cfg.digits !== undefined ? cfg.digits : 2)}${unit}`;
    header.appendChild(lbl);
    header.appendChild(valSpan);

    const input = document.createElement('input');
    input.type = 'range';
    input.min = String(cfg.min);
    input.max = String(cfg.max);
    input.step = String(cfg.step || 0.05);
    input.value = String(cfg.value);
    input.className = 'la-range';
    if (cfg.color) input.style.setProperty('--range-accent', cfg.color);

    input.addEventListener('input', () => {
      const v = parseFloat(input.value);
      valSpan.textContent = `${M.fmt(v, cfg.digits !== undefined ? cfg.digits : 2)}${unit}`;
      cfg.onChange(v);
    });

    row.appendChild(header);
    row.appendChild(input);
    container.appendChild(row);
    return {
      setValue(v) {
        input.value = String(v);
        valSpan.textContent = `${M.fmt(v, cfg.digits !== undefined ? cfg.digits : 2)}${unit}`;
      },
      input
    };
  }

  // Mount preset buttons bar
  function mountPresets(container, presets, onSelect, activeIndex = 0) {
    const wrap = document.createElement('div');
    wrap.className = 'preset-bar';
    const btns = [];
    presets.forEach((p, idx) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'preset-btn' + (idx === activeIndex ? ' active' : '');
      btn.textContent = p.name;
      if (p.tip) btn.title = p.tip;
      btn.addEventListener('click', () => {
        btns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        onSelect(p, idx);
      });
      btns.push(btn);
      wrap.appendChild(btn);
    });
    container.appendChild(wrap);
    return wrap;
  }

  // Mount segmented toggle buttons
  function mountToggleGroup(container, title, options, currentVal, onChange) {
    const wrap = document.createElement('div');
    wrap.className = 'toggle-group-wrap';
    if (title) {
      const lbl = document.createElement('div');
      lbl.className = 'control-group-title';
      lbl.innerHTML = title;
      wrap.appendChild(lbl);
    }
    const group = document.createElement('div');
    group.className = 'segmented-group';
    const btns = [];
    options.forEach(opt => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'seg-btn' + (opt.value === currentVal ? ' active' : '');
      btn.innerHTML = opt.label;
      btn.addEventListener('click', () => {
        btns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        onChange(opt.value);
      });
      btns.push(btn);
      group.appendChild(btn);
    });
    wrap.appendChild(group);
    container.appendChild(wrap);
    return wrap;
  }

  global.LAUI = {
    matHtml,
    vecHtml,
    kpiGridHtml,
    formulaBoxHtml,
    mountMatrixEditor,
    mountSlider,
    mountPresets,
    mountToggleGroup
  };
})(window);
