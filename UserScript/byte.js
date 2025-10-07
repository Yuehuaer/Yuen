// ==UserScript==
// @name         Auto Confirm + 隐藏已完成/订阅中 + 丑拒功能(带管理面板)
// @namespace    http://tampermonkey.net/
// @version      7.21
// @description  自动点确认 + 隐藏已完成/订阅中(带开关) + 丑拒按钮(本地记忆3个月, 可管理) + 无图片自动隐藏 (最终稳定版：完全回退至V7.14核心功能，不处理“回到顶部”按钮)
// @author       You
// @match        *://192.168.21.242:2233/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function () {
  'use strict';
  const DEBUG = true;
  const POLL_INTERVAL = 800;
  const UGLY_ID_KEY = "uglyRejectList";
  const UGLY_ACTRESS_KEY = "uglyActressList";
  const EXPIRE_DAYS = 90;
  const AUTO_CLOSE_DELAY = 20000; // 20 秒自动关闭

  const log = (...args) => { if (DEBUG) console.log('[AutoScript]', ...args); };
  const safeText = n => (n && n.textContent || '').trim();
  const formatDate = ts => new Date(ts).toLocaleDateString();

  /* ========== 工具函数 & 存储操作 (保持不变) ========== */
  function nowTs() { return Date.now(); }
  function daysToMs(days) { return days * 24 * 60 * 60 * 1000; }

  function loadList(key) {
    try {
      const data = JSON.parse(localStorage.getItem(key) || "{}");
      const cleaned = {};
      const now = nowTs();
      for (const id in data) {
        if (now - data[id] < daysToMs(EXPIRE_DAYS)) {
          cleaned[id] = data[id];
        }
      }
      localStorage.setItem(key, JSON.stringify(cleaned));
      return cleaned;
    } catch (e) {
      return {};
    }
  }

  function saveItem(key, id) {
    const list = loadList(key);
    list[id] = nowTs();
    localStorage.setItem(key, JSON.stringify(list));
  }

  function removeItem(key, id) {
    const list = loadList(key);
    delete list[id];
    localStorage.setItem(key, JSON.stringify(list));
  }

  let rejectIdList = loadList(UGLY_ID_KEY);
  let rejectActressList = loadList(UGLY_ACTRESS_KEY);

  /* ========== CSS 注入功能 (保持不变) ========== */
  function injectCustomCSS() {
    if (document.getElementById('custom-style-injected')) return;

    const style = document.createElement('style');
    style.id = 'custom-style-injected';

    style.textContent = `
      /* 保持女优屏蔽按钮的原有小间距 */
      .btn-actress-reject {
        margin-left: 0.25rem !important;
      }
      /* 确保管理面板的 z-index 足够高 */
      #ugly-manage-panel {
        z-index: 99999 !important;
      }
    `;

    document.head.appendChild(style);
    log('已注入自定义CSS。');
  }

  /* ========== 文本替换功能 (保持不变) ========== */
  function applyTextReplacements() {
    const REPLACEMENTS = {
      "厂牌発売日": "片商发售日",
      "S1": "S1 风格",
      "IdeaPocket": "IP社",
      "Moodyz": "M社",
      "Premium": "P社",
      "DAS": "达人社",
      "Madonna": "人妻系列",
      "Honnaka": "本中社",
      "Attackers": "剧情系列",
      "Wanz": "WANZ社"
    };

    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      null,
      false
    );

    let node;
    while (node = walker.nextNode()) {
      let text = node.nodeValue;
      let originalText = text;

      for (const [key, value] of Object.entries(REPLACEMENTS)) {
        if (text.includes(value)) {
          continue;
        }

        if (text.includes(key)) {
          text = text.replace(new RegExp(key, 'g'), value);
        }
      }

      if (originalText !== text) {
        node.nodeValue = text;
      }
    }
  }

  /* ========== 自动点击确认 (保持不变) ========== */
  function simulateClick(el) {
    if (!el) return false;
    try { el.focus({preventScroll:true}); } catch(e){}
    try { el.click(); return true; } catch (e) {}
    try {
      const opts = { bubbles: true, cancelable: true, composed: true, view: window, button: 0 };
      ['pointerdown','mousedown','pointerup','mouseup','click'].forEach(type=>{
        el.dispatchEvent(new MouseEvent(type, opts));
      });
      return true;
    } catch (err) { return false; }
  }

  function findDialogs(rootEl) {
    return Array.from(rootEl.querySelectorAll?.('[role="dialog"]') || []);
  }

  function isTargetDialog(dialog) {
    const text = safeText(dialog);
    return (/取消订阅/.test(text) || /订阅/.test(text));
  }

  function findConfirmButton(dialog) {
    const candidates = Array.from(dialog.querySelectorAll('button, [role="button"], a, input[type="button"], input[type="submit"]'));
    return candidates.find(b=>{
      const t = (b.textContent || b.getAttribute('aria-label') || '').trim();
      const cls = (b.className||'').toLowerCase();
      return (/确认/.test(t) || /confirm/i.test(t) || cls.includes('destructive'));
    }) || null;
  }

  function searchAndClickInDoc(docRoot) {
    const dialogs = findDialogs(docRoot);
    for (const d of dialogs) {
      if (!isTargetDialog(d)) continue;
      if (d.dataset.autoClicked === "true") continue;
      const btn = findConfirmButton(d);
      if (btn && !btn.disabled) {
        log('发现订阅/取消订阅弹窗 → 点击确认');
        simulateClick(btn);
        d.dataset.autoClicked = "true";
        return true;
      }
    }
    return false;
  }

  /* ========== 女优丑拒/屏蔽按钮 (保持不变) ========== */
  function injectActressRejectButtons(card) {
    const actressDivs = card.querySelectorAll('.flex.flex-wrap.gap-1');

    actressDivs.forEach(div => {
      const actressButton = div.querySelector('button');
      if (!actressButton) return;
      if (div.querySelector('.btn-actress-reject')) return;

      const actressName = safeText(actressButton);
      if (!actressName) return;

      const rejectBtn = document.createElement('button');
      rejectBtn.textContent = '屏蔽';
      rejectBtn.className = 'btn-actress-reject inline-flex items-center rounded-md bg-red-50 px-2 py-1 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/20 hover:bg-red-100 dark:bg-red-950 dark:text-red-300 dark:ring-red-800 dark:hover:bg-red-900 ml-1';

      rejectBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        saveItem(UGLY_ACTRESS_KEY, actressName);
        rejectActressList[actressName] = nowTs();
        processCards();
        updateManagePanel();
      });

      div.appendChild(rejectBtn);
    });
  }

  /* ========== 隐藏逻辑 (保持不变) ========== */
  let hideSubscribed = true;

  function processCards() {
    const cards = document.querySelectorAll('.rounded-xl.border.bg-card');
    rejectIdList = loadList(UGLY_ID_KEY);
    rejectActressList = loadList(UGLY_ACTRESS_KEY);

    const isExcludedFromAllAutoHiding = location.pathname.includes('/dashboard') || location.pathname.includes('/release-today');
    const isInSubscribeTab = location.pathname.includes('/subscribe');


    cards.forEach(card => {
      const text = card.innerText;
      const numberEl = card.querySelector('a.text-lg');

      if (!numberEl) {
        card.style.display = '';
        return;
      }

      const actressDivs = card.querySelectorAll('.flex.flex-wrap.gap-1 button');
      let isActressRejected = false;
      for (const actress of actressDivs) {
        const actressName = safeText(actress);
        if (rejectActressList[actressName]) {
          isActressRejected = true;
          break;
        }
      }
      if (isActressRejected) {
        card.style.display = 'none';
        return;
      }

      const number = safeText(numberEl);
      if (rejectIdList[number]) {
        card.style.display = 'none';
        return;
      }

      if (isExcludedFromAllAutoHiding) {
        card.style.display = '';
        injectUglyButton(card);
        injectActressRejectButtons(card);
        return;
      }

      if (/已完成/.test(text)) {
        if (!isInSubscribeTab) {
          card.style.display = 'none';
          return;
        }
      }

      const img = card.querySelector('img');
      if (!img || !img.src) {
        card.style.display = 'none';
        return;
      }

      if (/订阅中/.test(text)) {
        if (!isInSubscribeTab) {
          card.style.display = hideSubscribed ? 'none' : '';
          return;
        }
      }

      card.style.display = '';
      injectUglyButton(card);
      injectActressRejectButtons(card);
    });
  }

  /* ========== 丑拒按钮（番号）(保持不变) ========== */
  function injectUglyButton(card) {
    // 找到包含 [剧照][预告][订阅] 的按钮组内层容器
    const btnGroup = card.querySelector('.flex.justify-end .flex.gap-2');
    if (!btnGroup) return;

    // 使用类名标记，防止重复注入
    if (btnGroup.classList.contains('ugly-modified-v714')) return;

    // 1. 创建丑拒按钮
    const uglyBtn = document.createElement('button');
    uglyBtn.textContent = '丑拒';
    uglyBtn.className = 'btn-ugly-reject inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border bg-background shadow-sm h-8 rounded-md px-3 text-xs border-destructive/30 hover:border-destructive/50 text-destructive hover:text-destructive hover:bg-destructive/10';

    // 2. 创建弹性分隔元素 (Spacer)
    const spacer = document.createElement('div');
    spacer.className = 'flex-grow';

    // 3. 修改内层容器：使其占据全部宽度
    btnGroup.classList.add('w-full', 'ugly-modified-v714');

    // 4. 注入元素: [丑拒] [flex-grow spacer] [剧照] [预告] [订阅]
    btnGroup.prepend(spacer);
    btnGroup.prepend(uglyBtn);

    // 5. 添加点击事件
    uglyBtn.addEventListener('click', () => {
      const numberEl = card.querySelector('a.text-lg');
      const number = numberEl ? safeText(numberEl) : null;
      if (number) {
        saveItem(UGLY_ID_KEY, number);
        rejectIdList[number] = nowTs();
      }
      card.style.display = 'none';
      log('已丑拒:', number);
      updateManagePanel();
    });
  }

  /* ========== 自动关闭管理面板 (保持不变) ========== */
  let autoCloseTimerId = null;

  function closeManagePanel() {
    const panel = document.querySelector('#ugly-manage-panel');
    if (panel && panel.style.display === 'block') {
      panel.style.display = 'none';
      log('管理面板：20秒无操作，已自动关闭。');
    }
    if (autoCloseTimerId) {
      clearTimeout(autoCloseTimerId);
      autoCloseTimerId = null;
    }
  }

  function startAutoCloseTimer() {
    if (autoCloseTimerId) {
      clearTimeout(autoCloseTimerId);
    }
    autoCloseTimerId = setTimeout(closeManagePanel, AUTO_CLOSE_DELAY);
  }

  function handlePanelActivity() {
    const panel = document.querySelector('#ugly-manage-panel');
    if (panel && panel.style.display === 'block') {
      startAutoCloseTimer();
    }
  }

  function createManagePanel() {
    if (document.querySelector('#ugly-manage-panel')) return;

    const panel = document.createElement('div');
    panel.id = 'ugly-manage-panel';
    panel.style.cssText = 'position:fixed; top:80px; right:20px; width:300px; max-height:400px; overflow-y:auto; background:#fff; border:1px solid #ccc; border-radius:8px; box-shadow:0 4px 12px rgba(0,0,0,0.2); z-index:99999; padding:10px; color: #333; font-family: sans-serif; display:none;';

    // 注册事件监听器，用于重置自动关闭计时器
    panel.addEventListener('mousemove', handlePanelActivity);
    panel.addEventListener('click', handlePanelActivity);
    panel.addEventListener('scroll', handlePanelActivity);

    const title = document.createElement('div');
    title.textContent = '丑拒/屏蔽列表';
    title.style.cssText = 'font-weight:bold; margin-bottom:8px; border-bottom: 1px solid #eee; padding-bottom: 5px;';

    const closeBtn = document.createElement('button');
    closeBtn.textContent = '关闭';
    closeBtn.style.cssText = 'float:right; font-size:12px; background: none; border: none; cursor: pointer; color: #666;';
    closeBtn.addEventListener('click', () => { closeManagePanel(); });

    panel.appendChild(closeBtn);
    panel.appendChild(title);

    const listEl = document.createElement('div');
    listEl.id = 'ugly-list';
    panel.appendChild(listEl);

    document.body.appendChild(panel);
  }

  function renderListSection(listEl, listData, titleText, key) {
    const entries = Object.entries(listData).sort(([, tsA], [, tsB]) => tsB - tsA);

    const title = document.createElement('div');
    title.textContent = titleText;
    title.style.cssText = 'font-weight: bold; margin: 10px 0 5px 0; font-size: 14px;';
    listEl.appendChild(title);

    if (entries.length === 0) {
      const empty = document.createElement('div');
      empty.textContent = '暂无记录';
      empty.style.cssText = 'font-size: 12px; color: #999; margin-bottom: 10px;';
      listEl.appendChild(empty);
      return;
    }

    entries.forEach(([id, ts]) => {
      const row = document.createElement('div');
      row.style.cssText = 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; font-size: 12px; border-bottom: 1px dotted #eee; padding-bottom: 3px;';

      const label = document.createElement('span');
      label.textContent = `${id} (${formatDate(ts)})`;

      const restoreBtn = document.createElement('button');
      restoreBtn.textContent = '恢复';
      restoreBtn.className = 'inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-colors border bg-background shadow-sm h-6 rounded-md px-2 text-xs hover:bg-accent hover:text-accent-foreground';
      restoreBtn.addEventListener('click', () => {
        removeItem(key, id);
        if(key === UGLY_ID_KEY) rejectIdList = loadList(UGLY_ID_KEY);
        if(key === UGLY_ACTRESS_KEY) rejectActressList = loadList(UGLY_ACTRESS_KEY);
        processCards();
        updateManagePanel();
        handlePanelActivity(); // 重置计时器
      });

      row.appendChild(label);
      row.appendChild(restoreBtn);
      listEl.appendChild(row);
    });
  }

  function updateManagePanel() {
    const listEl = document.querySelector('#ugly-list');
    if (!listEl) return;
    listEl.innerHTML = '';

    rejectIdList = loadList(UGLY_ID_KEY);
    rejectActressList = loadList(UGLY_ACTRESS_KEY);

    renderListSection(listEl, rejectIdList, '按番号丑拒列表:', UGLY_ID_KEY);
    renderListSection(listEl, rejectActressList, '按女优屏蔽列表:', UGLY_ACTRESS_KEY);
  }

  function toggleManagePanel() {
    const panel = document.querySelector('#ugly-manage-panel');
    if (!panel) return;

    if (panel.style.display === 'none') {
      // 打开面板
      updateManagePanel();
      panel.style.display = 'block';
      startAutoCloseTimer(); // 开始自动关闭计时
    } else {
      // 关闭面板 (手动)
      closeManagePanel();
    }
  }

  /* ========== 左上角按钮组 (保持不变) ========== */
  function createControlButtons() {
    const sidebarBtn = document.querySelector('button[data-sidebar="trigger"]');
    if (!sidebarBtn) return;

    if (!document.querySelector('.btn-toggle-subscribed')) {
      const toggleBtn = document.createElement('button');
      toggleBtn.textContent = '隐藏订阅中: 开';
      toggleBtn.className = sidebarBtn.className + ' btn-toggle-subscribed h-7 px-2 text-xs';
      toggleBtn.style.width = 'auto';
      toggleBtn.addEventListener('click', () => {
        hideSubscribed = !hideSubscribed;
        toggleBtn.textContent = '隐藏订阅中: ' + (hideSubscribed ? '开' : '关');
        processCards();
      });
      sidebarBtn.insertAdjacentElement('afterend', toggleBtn);
    }

    if (!document.querySelector('.btn-manage-ugly')) {
      const manageBtn = document.createElement('button');
      manageBtn.textContent = '管理丑拒';
      manageBtn.className = sidebarBtn.className + ' btn-manage-ugly h-7 px-2 text-xs';
      manageBtn.style.width = 'auto';
      manageBtn.addEventListener('click', () => { toggleManagePanel(); });
      sidebarBtn.insertAdjacentElement('afterend', manageBtn);
    }
  }

  /* ========== 主循环 (不包含任何移除/移动逻辑) ========== */
  function mainLoop() {
    searchAndClickInDoc(document);
    processCards();
    createControlButtons();
    createManagePanel();
    applyTextReplacements();
    injectCustomCSS();
    // 不再调用 removeScrollToTopButton()
  }

  mainLoop();
  // 监听DOM变化和设置定时器，确保在动态加载时也能生效
  const observer = new MutationObserver(() => { mainLoop(); });
  observer.observe(document.documentElement || document.body, { childList: true, subtree: true });
  setInterval(() => { mainLoop(); }, POLL_INTERVAL);

  log('脚本已启动：V7.21 (回退至 V7.14 核心功能)');
})();
