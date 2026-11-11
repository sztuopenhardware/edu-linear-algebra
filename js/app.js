/**
 * 《线性代数》交互式 3D 教学仿真实验平台 - 主应用控制器
 * 支持章节级联下拉菜单、分组总览下拉菜单、URL Hash 路由、深色科研/亮色投影双主题
 */
(function (global) {
  'use strict';

  const chapters = global.LAChapters || [];
  let scene = null;
  let currentChapterIdx = 0;
  let currentCaseIdx = 0;

  // Flatten lookup map for URL hash routing (#ch1-sarrus etc.)
  const caseLookup = new Map();
  chapters.forEach((ch, cIdx) => {
    ch.cases.forEach((cs, sIdx) => {
      caseLookup.set(cs.id, { cIdx, sIdx, ch, cs });
    });
  });

  function init() {
    const viewportEl = document.getElementById('viewport-3d');
    scene = new global.LAScene3D.Scene3D(viewportEl);

    const chapterSelect = document.getElementById('chapter-select');
    const caseSelect = document.getElementById('case-select');
    const prevBtn = document.getElementById('btn-prev-case');
    const nextBtn = document.getElementById('btn-next-case');
    const themeBtn = document.getElementById('btn-theme-toggle');
    const syllabusBtn = document.getElementById('btn-syllabus-modal');
    const syllabusModal = document.getElementById('syllabus-modal');
    const closeModalBtn = document.getElementById('btn-close-modal');
    const dropdownTrigger = document.getElementById('btn-mega-dropdown');
    const megaPanel = document.getElementById('mega-dropdown-panel');

    // 1. Populate Chapter <select> Dropdown
    chapters.forEach((ch, idx) => {
      const opt = document.createElement('option');
      opt.value = String(idx);
      opt.textContent = `${ch.title}（${ch.cases.length}个案例）`;
      chapterSelect.appendChild(opt);
    });

    function populateCaseSelect(chIdx) {
      caseSelect.innerHTML = '';
      const ch = chapters[chIdx];
      ch.cases.forEach((cs, sIdx) => {
        const opt = document.createElement('option');
        opt.value = String(sIdx);
        opt.textContent = `${cs.code}  ${cs.title}`;
        caseSelect.appendChild(opt);
      });
    }

    // 2. Populate Chapter-Grouped Dropdown Mega-Menu & Syllabus Mapping Modal
    buildMegaDropdown(megaPanel);
    buildSyllabusModalBody(document.getElementById('syllabus-modal-body'));

    chapterSelect.addEventListener('change', () => {
      const chIdx = parseInt(chapterSelect.value, 10) || 0;
      loadCase(chIdx, 0, true);
    });

    caseSelect.addEventListener('change', () => {
      const sIdx = parseInt(caseSelect.value, 10) || 0;
      loadCase(currentChapterIdx, sIdx, true);
    });

    prevBtn.addEventListener('click', () => stepCase(-1));
    nextBtn.addEventListener('click', () => stepCase(1));

    // Camera view preset buttons
    document.querySelectorAll('[data-cam]').forEach(btn => {
      btn.addEventListener('click', () => {
        const preset = btn.getAttribute('data-cam');
        if (preset === 'autorotate') {
          scene.autoRotate = !scene.autoRotate;
          btn.classList.toggle('active', scene.autoRotate);
        } else {
          scene.autoRotate = false;
          const autoBtn = document.querySelector('[data-cam="autorotate"]');
          if (autoBtn) autoBtn.classList.remove('active');
          scene.setCameraPreset(preset);
        }
      });
    });

    // Theme toggle (Dark Lab <-> Light Classroom Projector)
    themeBtn.addEventListener('click', () => {
      const isLight = document.body.classList.toggle('theme-light');
      scene.setTheme(isLight ? 'light' : 'dark');
      themeBtn.textContent = isLight ? '🌙 深空科研模式' : '☀️ 课堂投影模式';
      // Re-mount current case so colors/grids refresh cleanly
      loadCase(currentChapterIdx, currentCaseIdx, false);
    });

    // Mega dropdown toggle
    dropdownTrigger.addEventListener('click', e => {
      e.stopPropagation();
      megaPanel.classList.toggle('open');
    });
    document.addEventListener('click', e => {
      if (!megaPanel.contains(e.target) && e.target !== dropdownTrigger) {
        megaPanel.classList.remove('open');
      }
    });

    // Syllabus modal
    syllabusBtn.addEventListener('click', () => syllabusModal.classList.add('open'));
    closeModalBtn.addEventListener('click', () => syllabusModal.classList.remove('open'));
    syllabusModal.addEventListener('click', e => {
      if (e.target === syllabusModal) syllabusModal.classList.remove('open');
    });

    // Keyboard Left/Right shortcuts when not typing in input
    window.addEventListener('keydown', e => {
      if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT')) return;
      if (e.key === 'Escape') {
        megaPanel.classList.remove('open');
        syllabusModal.classList.remove('open');
      }
    });

    // URL Hash initial load & hashchange listener
    function syncFromHash() {
      const h = (location.hash || '').replace(/^#/, '').trim();
      if (h && caseLookup.has(h)) {
        const { cIdx, sIdx } = caseLookup.get(h);
        loadCase(cIdx, sIdx, false);
        return true;
      }
      return false;
    }

    window.addEventListener('hashchange', syncFromHash);

    if (!syncFromHash()) {
      loadCase(0, 0, false);
    }

    function loadCase(cIdx, sIdx, pushHash = true) {
      currentChapterIdx = cIdx;
      currentCaseIdx = sIdx;
      const ch = chapters[cIdx];
      const cs = ch.cases[sIdx];

      chapterSelect.value = String(cIdx);
      populateCaseSelect(cIdx);
      caseSelect.value = String(sIdx);

      if (pushHash) {
        try {
          history.replaceState(null, '', '#' + cs.id);
        } catch (_) {
          location.hash = cs.id;
        }
      }

      // Update Case Metadata Header Banner
      document.getElementById('case-badge-code').textContent = `${ch.code} · 实验 ${cs.code}`;
      document.getElementById('case-badge-week').textContent = cs.week;
      document.getElementById('case-badge-obe').textContent = `OBE：${cs.obeLevel}`;
      document.getElementById('case-title').textContent = cs.title;
      document.getElementById('case-syllabus-desc').textContent = `大纲要点：${cs.syllabusPoint}`;
      document.getElementById('case-robotics-desc').textContent = `🤖 机器人工程连接：${cs.roboticsContext}`;

      // Highlight active item in mega dropdown
      document.querySelectorAll('.mega-case-btn').forEach(el => {
        el.classList.toggle('active', el.dataset.caseId === cs.id);
      });

      // Reset tick callback & mount case
      scene.customTickCallback = null;
      const controlsEl = document.getElementById('controls-container');
      const mathEl = document.getElementById('math-container');
      controlsEl.innerHTML = '';
      mathEl.innerHTML = '';
      cs.mount({ scene, controlsEl, mathEl });
    }

    function stepCase(delta) {
      let c = currentChapterIdx;
      let s = currentCaseIdx + delta;
      if (s < 0) {
        c = (c - 1 + chapters.length) % chapters.length;
        s = chapters[c].cases.length - 1;
      } else if (s >= chapters[c].cases.length) {
        c = (c + 1) % chapters.length;
        s = 0;
      }
      loadCase(c, s, true);
    }

    function buildMegaDropdown(container) {
      container.innerHTML = '';
      chapters.forEach((ch, cIdx) => {
        const details = document.createElement('details');
        details.className = 'mega-chapter-group';
        if (cIdx === 0) details.open = true;

        const summary = document.createElement('summary');
        summary.className = 'mega-chapter-summary';
        summary.innerHTML = `<span>${ch.title}</span><span class="mega-week-tag">${ch.weeks}</span>`;
        details.appendChild(summary);

        const list = document.createElement('div');
        list.className = 'mega-case-list';
        ch.cases.forEach((cs, sIdx) => {
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'mega-case-btn';
          btn.dataset.caseId = cs.id;
          btn.innerHTML = `<span class="mega-code">${cs.code}</span><span class="mega-name">${cs.title}</span><span class="mega-wk">${cs.week}</span>`;
          btn.addEventListener('click', () => {
            megaPanel.classList.remove('open');
            loadCase(cIdx, sIdx, true);
          });
          list.appendChild(btn);
        });
        details.appendChild(list);
        container.appendChild(details);
      });
    }

    function buildSyllabusModalBody(container) {
      const totalCases = chapters.reduce((acc, c) => acc + c.cases.length, 0);
      let html = `
        <div class="syllabus-intro">
          <p><strong>课程信息：</strong>深圳技术大学 · 中德智能制造学院 ·《线性代数》（课程编号 <code>SG01047</code>，2.5 学分 / 45 学时，面向 2025 级<strong>机器人工程</strong>专业）。</p>
          <p>本平台共构建 <strong>6 大章节下拉模块、${totalCases} 个交互式 WebGL 3D 仿真实验</strong>，完整覆盖教学大纲第 1–18 周全部课堂讲授知识点与机器人工程思政/应用融合案例。点击下方任意实验可直接跳转：</p>
        </div>
      `;
      chapters.forEach((ch, cIdx) => {
        html += `
          <div class="syl-ch-block">
            <div class="syl-ch-hdr">
              <h4>${ch.title}</h4>
              <span>${ch.weeks}</span>
            </div>
            <p class="syl-ch-sum">${ch.summary}</p>
            <div class="syl-grid">
              ${ch.cases.map((cs, sIdx) => `
                <button type="button" class="syl-card-btn" data-c="${cIdx}" data-s="${sIdx}">
                  <div class="syl-card-top">
                    <span class="syl-code">${cs.code}</span>
                    <span class="syl-obe">${cs.week} · ${cs.obeLevel}</span>
                  </div>
                  <div class="syl-card-title">${cs.title}</div>
                  <div class="syl-card-pt">${cs.syllabusPoint}</div>
                </button>
              `).join('')}
            </div>
          </div>
        `;
      });
      container.innerHTML = html;
      container.querySelectorAll('.syl-card-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const c = parseInt(btn.getAttribute('data-c'), 10);
          const s = parseInt(btn.getAttribute('data-s'), 10);
          document.getElementById('syllabus-modal').classList.remove('open');
          loadCase(c, s, true);
        });
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})(window);
