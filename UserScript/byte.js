// ==UserScript==
// @name         字节女神 订阅/取消订阅 - 每弹窗一次版
// @namespace    http://tampermonkey.net/
// @version      3.4
// @description  自动点击订阅/取消订阅弹窗的确认按钮，每个弹窗只点击一次（不会重复，但新弹窗正常继续）
// @author       You
// @match        *://192.168.21.242:2233/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function () {
  'use strict';
  const DEBUG = true;
  const POLL_INTERVAL = 300;

  const log = (...args) => { if (DEBUG) console.log('[AutoConfirm]', ...args); };
  const safeText = n => (n && n.textContent || '').trim();

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
    const results = [];
    function walk(node) {
      if (!node || node.nodeType !== 1) return;
      try {
        if (node.matches && node.matches('[role="dialog"]')) results.push(node);
        if (node.querySelectorAll) {
          node.querySelectorAll('[role="dialog"]').forEach(d=>results.push(d));
        }
        if (node.shadowRoot) {
          try { node.shadowRoot.querySelectorAll('[role="dialog"]').forEach(d=>results.push(d)); } catch(e){}
        }
        node.childNodes.forEach(walk);
      } catch(e){}
    }
    walk(rootEl);
    return Array.from(new Set(results));
  }

  function isTargetDialog(dialog) {
    const text = safeText(dialog);
    return (/取消订阅/.test(text) || /订阅/.test(text));
  }

  function findConfirmButton(dialog) {
    const candidates = Array.from(dialog.querySelectorAll('button, [role="button"], a, input[type="button"], input[type="submit"]'));
    for (const b of candidates) {
      const t = (b.textContent || b.getAttribute('aria-label') || '').trim();
      if (/^\s*确认\s*$/.test(t) || /确认/.test(t) || /confirm/i.test(t)) return b;
    }
    for (const b of candidates) {
      const cls = (b.className||'').toLowerCase();
      if (cls.includes('destructive') || cls.includes('danger') || cls.includes('red')) return b;
    }
    return null;
  }

  function searchAndClickInDoc(docRoot) {
    const root = (docRoot && docRoot.documentElement) ? docRoot.documentElement : docRoot;
    const dialogs = findDialogs(root);
    for (const d of dialogs) {
      if (!isTargetDialog(d)) continue;
      if (d.dataset.autoClicked === "true") continue; // 已点过这个弹窗，不再重复
      const btn = findConfirmButton(d);
      if (btn && !btn.disabled) {
        log('发现弹窗，点击确认（只点一次）');
        simulateClick(btn);
        d.dataset.autoClicked = "true"; // 给这个弹窗打标记
        return true;
      }
    }
    return false;
  }

  function searchAllContexts() {
    let clicked = false;
    if (searchAndClickInDoc(document)) clicked = true;
    Array.from(document.querySelectorAll('iframe')).forEach(frame=>{
      try {
        const idoc = frame.contentDocument;
        if (idoc && searchAndClickInDoc(idoc)) clicked = true;
      } catch(e){}
    });
    return clicked;
  }

  // 初次尝试
  searchAllContexts();

  // MutationObserver 持续监听
  const observer = new MutationObserver(() => { searchAllContexts(); });
  observer.observe(document.documentElement || document.body, { childList: true, subtree: true, attributes: true });

  // 兜底轮询
  setInterval(() => { searchAllContexts(); }, POLL_INTERVAL);

  window.__autoConfirmTrigger = () => searchAllContexts();

  log('AutoConfirm 每弹窗一次版已启动：每个订阅/取消订阅弹窗都会自动点一次确认');
})();
