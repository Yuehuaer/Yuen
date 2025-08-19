// ==UserScript==
// @name         精斗云日期高亮+优先级+月份排序(隐藏无用按钮)
// @namespace    http://tampermonkey.net/
// @version      2.0
// @description  高亮过期账套，优先级排序+会计期间排序，显示优先级标签，并隐藏修改账套/新建账套/附件按钮（完整合并版）
// @author       Yuehua
// @match        *://vip1-hz.jdy.com/mulAcct/dist/*
// @grant        none
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';

    // 样式
    const style = document.createElement('style');
    style.textContent = `
        .customerbox_li.expired .innerWrap { box-shadow:0 0 8px rgba(0,0,0,.2)!important;border-radius:4px; }
        .customerbox_li.expired .innerWrap .df { color:#000!important;font-weight:bold; }
        .customerbox_li .company-name { color:#db2d55!important;font-weight:normal!important; }
        .priority-tag { margin-left:6px;padding:1px 4px;border-radius:4px;font-size:12px;font-weight:bold;color:#fff; }
        .priority-high { background:#e74c3c; }
        .priority-mid  { background:#f39c12; }
        .priority-low  { background:#7f8c8d; }
        /* 隐藏无用按钮 */
        .glyphicon.glyphicon-pencil.edit,
        .glyphicon.glyphicon-paperclip,
        .customerbox_li.row.add { display:none !important; }
    `;
    document.head.appendChild(style);

    // 当前年月
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    // 颜色计算
    function getDynamicColor(year, month) {
        const currentDate = currentYear * 12 + currentMonth;
        const accountDate = year * 12 + month;
        const monthDiff = currentDate - accountDate;
        if (monthDiff < 0) return null;
        if (year !== currentYear) {
            const opacity = Math.min(0.1 + monthDiff * 0.05, 0.8);
            return `rgba(100,100,255,${opacity})`;
        } else {
            const opacity = Math.min(0.1 + monthDiff * 0.1, 0.8);
            return `rgba(255,100,100,${opacity})`;
        }
    }

    // 公司优先级表
    const priorityMap = {
        "高": ["深圳老友福合康管理有限公司","深圳市麻雀云食餐饮科技有限公司","深圳市一手餐饮管理有限公司"],
        "中": ["深圳市福田区园岭街道老有福居家养老服务站","广东好尔美康颐智能科技有限公司","深圳市美伦堡实业发展有限公司","深圳市星河优拓科技有限公司"],
        "低": ["深圳市艾理森投资有限公司","深圳市崇升投资有限公司","深圳市福凯成供应链有限公司","深圳宏福堂中医综合诊所","深圳市嘉盛投资有限公司","深圳市福田区麻小雀社区盒饭餐饮店（个体工商户）","深圳市天天过年智慧新零售有限公司","深圳行多多旅游有限公司","深圳联合航空有限公司","深圳老友福适老家居有限公司","深圳市利兹堡健康管理有限公司","深圳星耀传媒文化有限公司","深圳市元智源味餐饮管理有限公司"]
    };

    function getPriority(name) {
        if (priorityMap["高"].includes(name)) return 1;
        if (priorityMap["中"].includes(name)) return 2;
        if (priorityMap["低"].includes(name)) return 3;
        return 4;
    }

    function createPriorityTag(priorityLevel) {
        const span = document.createElement("span");
        span.classList.add("priority-tag");
        if (priorityLevel === 1) { span.textContent="[高]"; span.classList.add("priority-high"); }
        else if (priorityLevel === 2) { span.textContent="[中]"; span.classList.add("priority-mid"); }
        else if (priorityLevel === 3) { span.textContent="[低]"; span.classList.add("priority-low"); }
        else return null;
        return span;
    }

    // 解析账套会计期间
    function parsePeriod(account) {
        const periodElement = account.querySelector('.df');
        if (!periodElement) return 999999; // 没找到 → 放最后
        const match = periodElement.textContent.trim().match(/会计期间：(\d{4})-(\d{1,2})/);
        if (!match) return 999999;
        const year = parseInt(match[1], 10);
        const month = parseInt(match[2], 10);
        return year * 12 + month;
    }

    // 高亮 & 打标签
    function highlightExpiredAccounts() {
        const accounts = document.querySelectorAll('.customerbox_li:not(.add)');
        accounts.forEach(account => {
            const companyNameElement = account.querySelector('.companyName');
            if (companyNameElement) {
                companyNameElement.classList.add('company-name');
                if (!companyNameElement.nextElementSibling || !companyNameElement.nextElementSibling.classList.contains("priority-tag")) {
                    const priorityLevel = getPriority(companyNameElement.textContent.trim());
                    const tag = createPriorityTag(priorityLevel);
                    if (tag) companyNameElement.after(tag);
                }
            }

            const periodElement = account.querySelector('.df');
            if (!periodElement) return;
            const match = periodElement.textContent.trim().match(/会计期间：(\d{4})-(\d{1,2})/);
            if (!match) return;
            const year = parseInt(match[1], 10);
            const month = parseInt(match[2], 10);
            const color = getDynamicColor(year, month);
            if (color) {
                account.classList.add('expired');
                const innerWrap = account.querySelector('.innerWrap');
                if (innerWrap) innerWrap.style.backgroundColor = color;
            }
        });
    }

    // 排序：先优先级，再会计期间
    function sortAccountsByPriorityAndPeriod() {
        const container = document.querySelector('.customerbox');
        if (!container) return;
        const accounts = Array.from(container.querySelectorAll('.customerbox_li:not(.add)'));

        accounts.sort((a, b) => {
            const nameA = a.querySelector('.companyName')?.textContent.trim() || "";
            const nameB = b.querySelector('.companyName')?.textContent.trim() || "";
            const priA = getPriority(nameA);
            const priB = getPriority(nameB);
            if (priA !== priB) return priA - priB;  // 先比优先级
            return parsePeriod(a) - parsePeriod(b); // 同优先级按会计期间升序
        });

        accounts.forEach(acc => container.appendChild(acc));
    }

    // === 主函数 ===
    const observer = new MutationObserver(() => processAccounts());

    function processAccounts() {
        observer.disconnect(); // 避免死循环
        highlightExpiredAccounts();
        sortAccountsByPriorityAndPeriod();
        observer.observe(document.body, { childList: true, subtree: true });
    }

    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        processAccounts();
    } else {
        document.addEventListener('DOMContentLoaded', processAccounts);
    }

    observer.observe(document.body, { childList: true, subtree: true });

})();
