// ==UserScript==
// @name         字节女神
// @namespace    http://tampermonkey.net/
// @version      7.38
// @description  【v7.38 最终完整稳定版】1. 彻底修复代码崩溃问题 (补全所有函数定义)。2. 修复管理面板定时关闭失效的问题。3. 保持所有核心功能稳定运行。
// @author       You
// @match        *://192.168.21.242:2233/*
// @icon         https://www.helloimg.com/i/2025/10/29/690216fe55540.jpg
// @grant        none
// @run-at       document-idle
// ==/UserScript==


(function () {
  'use strict';
  const DEBUG = true;
  const DEBOUNCE_DELAY = 100;
  const UGLY_ID_KEY = "uglyRejectList";
  const UGLY_ACTRESS_KEY = "uglyActressList";
  const VIEW_COUNT_KEY = "viewCountList";
  const EXPIRE_DAYS = 90;
  const AUTO_CLOSE_DELAY = 20000; // 20秒
  const PROCESSED_MARK = 'data-processed-v738'; // 版本标记更新

  // 定义需要保持原样、跳过卡片处理和文本替换的页面（非卡片列表页）
  const UNCHANGED_PATHS = ['/profile', '/config', '/logs', '/actor', '/search', '/dashboard'];

  // 自动隐藏的前缀
  const REJECT_PREFIXES = ['MDVR', 'SIVR', 'OVVR', 'VRTM', 'VRIT', 'FCVR', 'VRBD', 'VRKM', 'HODV', '3DSVR', 'KAVR', 'IPVR','SAVR'];

  const log = (...args) => { if (DEBUG) console.log('[AutoScript]', ...args); };
  const safeText = n => (n && n.textContent || '').trim();
  const formatDate = ts => new Date(ts).toLocaleDateString();

  /* ========== 存储操作 & 状态 (完整定义) ========== */
  function nowTs() { return Date.now(); }
  function daysToMs(days) { return days * 24 * 60 * 60 * 1000; }
  
  function loadList(key) {
    try {
      const data = JSON.parse(localStorage.getItem(key) || "{}");
      const cleaned = {};
      const now = nowTs();
      for (const id in data) {
        const timestamp = (typeof data[id] === 'object' && data[id].ts) ? data[id].ts : data[id];
        if (now - timestamp < daysToMs(EXPIRE_DAYS)) {
          cleaned[id] = data[id];
        }
      }
      localStorage.setItem(key, JSON.stringify(cleaned));
      return cleaned;
    } catch (e) { return {}; }
  }

  function saveItem(key, id) {
    try {
        let list = JSON.parse(localStorage.getItem(key) || "{}");
        list[id] = nowTs(); // 保存为时间戳
        localStorage.setItem(key, JSON.stringify(list));
    } catch (e) { /* silent fail */ }
  }

  function incrementViewCount(id) {
    try {
        let list = JSON.parse(localStorage.getItem(VIEW_COUNT_KEY) || "{}");
        const currentData = list[id] || { count: 0, ts: 0 };
        currentData.count += 1;
        currentData.ts = nowTs();
        list[id] = currentData;
        localStorage.setItem(VIEW_COUNT_KEY, JSON.stringify(list));
        return { count: currentData.count, ts: currentData.ts };
    } catch (e) { return null; }
  }

  function removeItem(key, id) {
    try {
        const list = JSON.parse(localStorage.getItem(key) || "{}");
        delete list[id];
        localStorage.setItem(key, JSON.stringify(list));
    } catch (e) { /* silent fail */ }
  }

  let rejectIdList = loadList(UGLY_ID_KEY);
  let rejectActressList = loadList(UGLY_ACTRESS_KEY);
  let viewCountList = loadList(VIEW_COUNT_KEY);
  let hideSubscribed = true;

  /* ========== 辅助 DOM/UI 逻辑 (完整定义) ========== */

  function injectCustomCSS() {
    if (document.getElementById('custom-style-injected-v738')) return; 
    const style = document.createElement('style');
    style.id = 'custom-style-injected-v738';
    style.textContent = `
      .btn-actress-reject { margin-left: 0.25rem !important; }
      #ugly-manage-panel { z-index: 99999 !important; }
      .view-count-tag {
        margin-left: 0.5rem;
        font-size: 0.75rem;
        font-weight: 500;
        color: #10B981;
        background-color: #ECFDF5;
        border-radius: 0.375rem;
        padding: 0.125rem 0.5rem;
        border: 1px solid #A7F3D0;
        display: inline-block;
        vertical-align: middle;
      }
    `;
    document.head.appendChild(style);
  }

  function applyTextReplacements() {
     const REPLACEMENTS = { "厂牌発売日": "片商发售日", "S1": "S1 风格", "IdeaPocket": "IP社", "Moodyz": "M社", "Premium": "P社", "DAS": "达人社", "Madonna": "人妻系列", "Honnaka": "本中社", "Attackers": "剧情系列", "Wanz": "WANZ社" };
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
    let node;
    while (node = walker.nextNode()) {
      let text = node.nodeValue;
      let originalText = text;
      for (const [key, value] of Object.entries(REPLACEMENTS)) {
        if (text.includes(value)) continue;
        if (text.includes(key)) text = text.replace(new RegExp(key, 'g'), value);
      }
      if (originalText !== text) node.nodeValue = text;
    }
  }

  function displayViewCount(card, number) {
    const numberLink = card.querySelector('a.text-lg');
    const oldTag = card.querySelector('.view-count-tag');
    if (oldTag) oldTag.remove();

    if (!numberLink) return;
    const countData = viewCountList[number];
    const count = countData ? countData.count : 0;
    if (count > 0) {
      const tag = document.createElement('span');
      tag.textContent = `👁 已看 ${count} 次`;
      tag.className = 'view-count-tag';
      numberLink.insertAdjacentElement('afterend', tag);
    }
  }

  function bindViewCounter(card, number) {
      if (!number) return; 
      const movieStillBtn = Array.from(card.querySelectorAll('button')).find(b => safeText(b).includes('剧照'));
      
      if (movieStillBtn && !movieStillBtn.dataset.countBoundV738) { 
          movieStillBtn.dataset.countBoundV738 = 'true';
          movieStillBtn.addEventListener('click', (e) => {
              const newData = incrementViewCount(number);
              if (newData) {
                 viewCountList[number] = { count: newData.count, ts: newData.ts };
                 displayViewCount(card, number);
              }
          });
      }
  }
  
  function injectActionButtons(card, number) {
      if (card.querySelector('.ugly-modified-v738')) return; 

      const btnGroup = card.querySelector('.flex.justify-end .flex.gap-2');
      if (!btnGroup) return;

      const uglyBtn = document.createElement('button');
      uglyBtn.textContent = '丑拒';
      uglyBtn.className = 'btn-ugly-reject inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border bg-background shadow-sm h-8 rounded-md px-3 text-xs border-destructive/30 hover:border-destructive/50 text-destructive hover:text-destructive hover:bg-destructive/10';
      uglyBtn.addEventListener('click', () => {
        if (number) saveItem(UGLY_ID_KEY, number);
        card.style.display = 'none';
        processCards(); 
        updateManagePanel(); 
      });

      const spacer = document.createElement('div');
      spacer.className = 'flex-grow';

      btnGroup.classList.add('w-full', 'ugly-modified-v738'); 
      btnGroup.prepend(spacer);
      btnGroup.prepend(uglyBtn);
  }

  function injectActressRejectButtons(card) {
      const actressContainers = card.querySelectorAll('.flex.flex-wrap.gap-1');
      actressContainers.forEach(container => {
        const actressButton = container.querySelector('button:not(.btn-actress-reject)');
        if (!actressButton || container.querySelector('.btn-actress-reject')) return;

        const actressName = safeText(actressButton);
        if (!actressName) return;

        const rejectBtn = document.createElement('button');
        rejectBtn.textContent = '屏蔽';
        rejectBtn.className = 'btn-actress-reject inline-flex items-center rounded-md bg-red-50 px-2 py-1 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/20 hover:bg-red-100 dark:bg-red-950 dark:text-red-300 dark:ring-red-800 dark:hover:bg-red-900 ml-1';
        rejectBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          saveItem(UGLY_ACTRESS_KEY, actressName);
          processCards(); 
          updateManagePanel();
        });
        container.appendChild(rejectBtn);
      });
  }
  
  /* ========== 核心：卡片处理与隐藏逻辑 (完整定义) ========== */
  function processCards() {
    rejectIdList = loadList(UGLY_ID_KEY);
    rejectActressList = loadList(UGLY_ACTRESS_KEY);
    viewCountList = loadList(VIEW_COUNT_KEY);

    const cards = document.querySelectorAll('.rounded-xl.border.bg-card');
    const isSubscribePage = location.pathname.includes('/subscribe');
    const isReleaseToday = location.pathname.includes('/release-today'); 
    
    const isSkipAutoHiding = isReleaseToday; 

    cards.forEach(card => {
        const numberEl = card.querySelector('a.text-lg');
        const number = numberEl ? safeText(numberEl) : null;
        let isNewCard = !card.hasAttribute(PROCESSED_MARK);
        let shouldHide = false;

        // --- 1. 注入/绑定逻辑 ---
        if (isNewCard) {
            if(number) {
                injectActionButtons(card, number);
                bindViewCounter(card, number);
            }
            injectActressRejectButtons(card);
        }
        
        // --- 2. 显示观看次数 ---
        if(number) {
            displayViewCount(card, number);
        }

        // --- 3. 隐藏逻辑 ---

        // a. 用户手动屏蔽逻辑 (所有卡片列表页都必须执行)
        if (!shouldHide && number && rejectIdList[number]) { shouldHide = true; } // 番号丑拒
        if (!shouldHide) {
            const actressButtons = card.querySelectorAll('.flex.flex-wrap.gap-1 button:not(.btn-actress-reject)');
            for (const btn of actressButtons) {
                if (rejectActressList[safeText(btn)]) { shouldHide = true; break; } // 女优屏蔽
            }
        }
        
        // b. 脚本自动隐藏逻辑 (在 /release-today 页面跳过)
        if (!shouldHide && !isSkipAutoHiding) {
            // VR 前缀自动隐藏
            if (number && REJECT_PREFIXES.some(prefix => number.toUpperCase().startsWith(prefix))) { 
                shouldHide = true; 
            }
            // 封面图错误/缺失
            if (!shouldHide) {
                const img = card.querySelector('img');
                const imgSrc = img ? (img.src || '').toLowerCase() : '';
                if (!img || !img.src || imgSrc.includes('now_printing')) {
                    shouldHide = true;
                } else {
                    if (!img.dataset.errorListenerAddedV738) { 
                        img.dataset.errorListenerAddedV738 = 'true';
                        img.onerror = () => { card.style.display = 'none'; };
                    }
                }
            }
            // 已完成/订阅中自动隐藏
            if (!shouldHide) {
                const cardText = card.innerText;
                if (cardText.includes('已完成') && !isSubscribePage) { shouldHide = true; } 
                else if (hideSubscribed && cardText.includes('订阅中') && !isSubscribePage) { shouldHide = true; }
            }
        }

        // --- 4. 应用显示状态 ---
        card.style.display = shouldHide ? 'none' : '';
        
        card.setAttribute(PROCESSED_MARK, 'true');
    });
  }

  /* ========== 自动点击确认 (完整定义) ========== */
  function simulateClick(el) { el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true })); }
  function findDialogs(rootEl) { return Array.from(rootEl.querySelectorAll?.('[role="dialog"]') || []); }
  function isTargetDialog(dialog) { return (/取消订阅/.test(safeText(dialog)) || /订阅/.test(safeText(dialog))); }
  function findConfirmButton(dialog) {
    const candidates = Array.from(dialog.querySelectorAll('button, [role="button"]'));
    return candidates.find(b => {
      const t = safeText(b);
      const cls = (b.className || '').toLowerCase();
      return (/确认/.test(t) || /confirm/i.test(t) || cls.includes('destructive'));
    }) || null;
  }
  function searchAndClickInDoc(docRoot) {
    for (const d of findDialogs(docRoot)) {
      if (!isTargetDialog(d) || d.dataset.autoClicked) continue;
      const btn = findConfirmButton(d);
      if (btn && !btn.disabled) {
        simulateClick(btn);
        d.dataset.autoClicked = "true";
        return true;
      }
    }
    return false;
  }

  /* ========== 管理面板 & 按钮 (完整定义 + 定时关闭修复) ========== */
  let autoCloseTimerId = null;

  function closeManagePanel() {
    const panel = document.querySelector('#ugly-manage-panel');
    if (panel) panel.style.display = 'none';
    if (autoCloseTimerId) {
        clearTimeout(autoCloseTimerId);
        autoCloseTimerId = null;
    }
  }
  
  function startAutoCloseTimer() {
    if (autoCloseTimerId) {
        clearTimeout(autoCloseTimerId);
    }
    autoCloseTimerId = setTimeout(() => {
        closeManagePanel();
    }, AUTO_CLOSE_DELAY);
  }

  function handlePanelActivity() { startAutoCloseTimer(); }
  
  function createManagePanel() {
    if (document.querySelector('#ugly-manage-panel')) return;
    const panel = document.createElement('div');
    panel.id = 'ugly-manage-panel';
    panel.style.cssText = 'position:fixed; top:80px; right:20px; width:320px; max-height:450px; overflow-y:auto; background:#fff; border:1px solid #ccc; border-radius:8px; box-shadow:0 4px 4px rgba(0,0,0,0.2); z-index:99999; padding:10px; color: #333; font-family: sans-serif; display:none;';
    
    ['mousemove', 'click', 'scroll'].forEach(evt => panel.addEventListener(evt, handlePanelActivity));
    
    panel.innerHTML = `
      <div style="font-weight:bold; margin-bottom:8px; border-bottom: 1px solid #eee; padding-bottom: 5px;">丑拒/屏蔽/观看记录
        <button id="close-panel-btn" style="float:right; font-size:12px; background:none; border:none; cursor:pointer; color:#666;">关闭</button>
      </div>
      <div id="ugly-list"></div>
    `;
    document.body.appendChild(panel);
    panel.querySelector('#close-panel-btn').addEventListener('click', closeManagePanel);
  }

  // 渲染列表段落 (完整定义)
  function renderListSection(listEl, listData, titleText, key) { 
     const entries = Object.entries(listData).sort(([, a], [, b]) => {
        const tsA = (typeof a === 'object') ? a.ts : a;
        const tsB = (typeof b === 'object') ? b.ts : b;
        return tsB - tsA;
    });

    const titleDiv = document.createElement('div');
    titleDiv.style.cssText = 'font-weight: bold; margin: 10px 0 5px 0; font-size: 14px;';
    titleDiv.textContent = titleText;
    listEl.appendChild(titleDiv);

    if (entries.length === 0) {
      const emptyDiv = document.createElement('div');
      emptyDiv.style.cssText = 'font-size: 12px; color: #999; margin-bottom: 10px;';
      emptyDiv.textContent = '暂无记录';
      listEl.appendChild(emptyDiv);
      return;
    }

    entries.forEach(([id, value]) => {
      const row = document.createElement('div');
      row.style.cssText = 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; font-size: 12px; border-bottom: 1px dotted #eee; padding-bottom: 3px;';

      const label = document.createElement('span');
      if (key === VIEW_COUNT_KEY) {
        label.textContent = `${id} (已看 ${value.count} 次) ${formatDate(value.ts)}`;
      } else {
        const timestamp = (typeof value === 'object') ? value.ts : value;
        label.textContent = `${id} (${formatDate(timestamp)})`;
      }

      const restoreBtn = document.createElement('button');
      restoreBtn.textContent = (key === VIEW_COUNT_KEY) ? '重置' : '恢复';
      restoreBtn.className = 'inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-colors border bg-background shadow-sm h-6 rounded-md px-2 text-xs hover:bg-accent hover:text-accent-foreground';

      restoreBtn.addEventListener('click', () => {
        removeItem(key, id);
        if (key === UGLY_ID_KEY) rejectIdList = loadList(key);
        if (key === UGLY_ACTRESS_KEY) rejectActressList = loadList(key);
        if (key === VIEW_COUNT_KEY) viewCountList = loadList(key);
        processCards();
        updateManagePanel();
        handlePanelActivity();
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
    viewCountList = loadList(VIEW_COUNT_KEY);

    renderListSection(listEl, rejectIdList, '番号丑拒列表 (90天内):', UGLY_ID_KEY);
    renderListSection(listEl, rejectActressList, '女优屏蔽列表 (90天内):', UGLY_ACTRESS_KEY);
    renderListSection(listEl, viewCountList, '番号观看记录 (90天内):', VIEW_COUNT_KEY);
  }

  function toggleManagePanel() {
    const panel = document.querySelector('#ugly-manage-panel');
    if (!panel) return;
    if (panel.style.display === 'none') {
      updateManagePanel(); 
      panel.style.display = 'block';
      startAutoCloseTimer(); // 修复：确保面板打开时，计时器启动
    } else {
      closeManagePanel();
    }
  }

  function createControlButtons() {
     const anchor = document.querySelector('button[data-sidebar="trigger"]');
    if (!anchor) return;

    let manageBtn = document.querySelector('.btn-manage-ugly');
    let toggleBtn = document.querySelector('.btn-toggle-subscribed');

    if (!manageBtn) {
        manageBtn = document.createElement('button');
        manageBtn.textContent = '管理列表';
        // 使用 ml-2 保持间距，确保与 anchor 样式一致
        manageBtn.className = anchor.className + ' btn-manage-ugly h-7 px-2 text-xs ml-2';
        manageBtn.style.width = 'auto';
        manageBtn.addEventListener('click', toggleManagePanel);
        anchor.insertAdjacentElement('afterend', manageBtn);
    }
    
    if (!toggleBtn) {
        toggleBtn = document.createElement('button');
        toggleBtn.textContent = '隐藏订阅中: ' + (hideSubscribed ? '开' : '关');
        toggleBtn.className = anchor.className + ' btn-toggle-subscribed h-7 px-2 text-xs ml-2';
        toggleBtn.style.width = 'auto';
        toggleBtn.addEventListener('click', () => {
          hideSubscribed = !hideSubscribed;
          toggleBtn.textContent = '隐藏订阅中: ' + (hideSubscribed ? '开' : '关');
          processCards();
        });
        manageBtn.insertAdjacentElement('afterend', toggleBtn); 
    }
  }
  
  /* ========== 核心调度函数 (完整定义) ========== */
  let timeoutId = null;
  
  function isSystemDialogVisible() {
    const dialogs = document。querySelectorAll('[role="dialog"]');
    for (const d of dialogs) {
        if (d。offsetParent !== null || d。style。display !== 'none' || d。classList。contains('fixed')) {
             if (d。id !== 'ugly-manage-panel') {
                return true;
             }
        }
    }
    return false;
  }

  function debounceMainLoop() {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      timeoutId = null;
      mainLoop();
    }， DEBOUNCE_DELAY);
  }

  function mainLoop() {
    try {
        if (document。readyState === 'complete' || document。readyState === 'interactive') {
            
            // 1. 始终运行 UI 组件创建和全局 CSS 注入（防止面板消失）
            createControlButtons();
            createManagePanel();
            injectCustomCSS(); 
            searchAndClickInDoc(document);
            
            const path = window.location。pathname;
            const isUnchangedPage = UNCHANGED_PATHS.some(p => path.startsWith(p));

            if (!isUnchangedPage) {
                // 2. 仅在卡片相关页面运行文本替换
                applyTextReplacements();
                
                // 3. 避免在弹窗出现时运行重量级的卡片处理 (防止卡死)
                if (!isSystemDialogVisible()) {
                    processCards(); // 执行重量级卡片处理
                } 
            }
        }
    } catch (error) {
        log('Error in main loop:'， error);
    }
  }

  // 初始化
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
      mainLoop();
  } else {
      window。addEventListener('DOMContentLoaded'， mainLoop);
  }

  // 仅使用 MutationObserver + Debounce 监听DOM变化
  const observer = new MutationObserver(debounceMainLoop);
  observer。observe(document。body， { childList: true， subtree: true });

  log('脚本已启动：V7.38 (最终完整稳定版)');
})();
