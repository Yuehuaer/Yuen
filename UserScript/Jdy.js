// ==UserScript==
// @name          精斗云
// @namespace     http://scriptcat.org/
// @version       0.7.1
// @description   增强精斗云多账套页面：高亮过期账套、添加优先级标签、排序和屏蔽公司
// @author        Yuehua
// @icon          https://vip1-hz.jdy.com/favicon.ico
// @match         https://*.jdy.com/mulAcct/*
// @match         https://vip*.jdy.com/*
// @grant         none
// ==/UserScript==

(function() {
    'use strict';

    // 测试日志
    console.log('Script running at:', window.location.href);
    setTimeout(() => {
        console.log('Checking DOM:', document.body.innerHTML.length);
        processAccounts();
    }, 1000); // 1秒延时，确保 DOM 加载

    // 样式
    const style = document.createElement('style');
    style.textContent = `
        .customerbox_li.expired .innerWrap { box-shadow:0 0 8px rgba(0,0,0,.2)!important;border-radius:4px; }
        .customerbox_li.expired .innerWrap .df { color:#000!important;font-weight:bold; }
        .customerbox_li .company-name { color:#db2d55!important;font-weight:normal!important; }
        .priority-tag { margin-left:6px;padding:1px 4px;border-radius:4px;font-size:12px;font-weight:bold;color:#fff; }
        .priority-high { background:#e74c3c; }
        .priority-mid { background:#f39c12; }
        .priority-low { background:#7f8c8d; }
        /* 隐藏无用按钮 */
        .glyphicon.glyphicon-pencil.edit,
        .glyphicon.glyphicon-paperclip,
        .customerbox_li.row.add { display:none !important; }
        /* 屏蔽指定公司 */
        .customerbox_li.blocked { display:none !important; }
    `;
    document.head.appendChild(style);

    // 当前年月
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    // 颜色计算
    function getDynamicColor(year, month) {
        const currentDate = currentYear * 12 + currentMonth; // 2025-09 = 24309
        const accountDate = year * 12 + month;
        const monthDiff = accountDate - currentDate; // 账套日期 - 当前日期
        console.log(`Calculating color for ${year}-${month}, monthDiff: ${monthDiff}`);
        if (monthDiff > 0) {
            console.log('Future month detected, returning #ffffff');
            return '#ffffff'; // 未来月份：白色
        }
        if (monthDiff === 0) {
            console.log('Current month detected, returning #ffffff');
            return '#ffffff'; // 当前月份：白色
        }
        if (year === currentYear && month === currentMonth - 1) {
            console.log('Last month detected, returning rgba(255,100,100,0.1)');
            return 'rgba(255,100,100,0.1)'; // 上个月：红色渐变最浅
        }
        if (year !== currentYear) {
            const opacity = Math.min(0.1 + Math.abs(monthDiff) * 0.05, 0.8); // 跨年：蓝色渐变
            console.log(`Cross-year, opacity: ${opacity}, color: rgba(100,100,255,${opacity})`);
            return `rgba(100,100,255,${opacity})`;
        } else {
            const opacity = Math.min(0.1 + Math.abs(monthDiff) * 0.1, 0.8); // 同年越旧：红色渐变
            console.log(`Same-year, opacity: ${opacity}, color: rgba(255,100,100,${opacity})`);
            return `rgba(255,100,100,${opacity})`;
        }
    }

    // 公司优先级表
    const priorityMap = {
        "高": ["深圳老友福合康管理有限公司", "深圳市麻雀云食餐饮科技有限公司", "深圳市一手餐饮管理有限公司"],
        "中": ["深圳市福田区园岭街道老有福居家养老服务站", "广东好尔美康颐智能科技有限公司", "深圳市美伦堡实业发展有限公司", "深圳市星河优拓科技有限公司"],
        "低": ["深圳市艾理森投资有限公司", "深圳市崇升投资有限公司", "深圳市福凯成供应链有限公司", "深圳宏福堂中医综合诊所", "深圳市嘉盛投资有限公司", "深圳市福田区麻小雀社区盒饭餐饮店（个体工商户）", "深圳市天天过年智慧新零售有限公司", "深圳行多多旅游有限公司", "深圳联合航空有限公司", "深圳老友福适老家居有限公司", "深圳市利兹堡健康管理有限公司", "深圳星耀传媒文化有限公司", "深圳市元智源味餐饮管理有限公司"]
    };

    // 屏蔽公司列表
    const blockedCompanies = [
        "深圳市天天过年智慧新零售有限公司",
        "深圳市艾理森投资有限公司",
        "深圳市美伦堡实业发展有限公司",
        "深圳星耀传媒文化有限公司"
    ];

    function getPriority(name) {
        if (priorityMap["高"].includes(name)) return 1;
        if (priorityMap["中"].includes(name)) return 2;
        if (priorityMap["低"].includes(name)) return 3;
        return 4;
    }

    function createPriorityTag(priorityLevel) {
        const span = document.createElement("span");
        span.classList.add("priority-tag");
        if (priorityLevel === 1) { span.textContent = "[高]"; span.classList.add("priority-high"); }
        else if (priorityLevel === 2) { span.textContent = "[中]"; span.classList.add("priority-mid"); }
        else if (priorityLevel === 3) { span.textContent = "[低]"; span.classList.add("priority-low"); }
        else return null;
        return span;
    }

    // 解析账套会计期间
    function parsePeriod(account) {
        const periodElement = account.querySelector('.df');
        if (!periodElement) {
            console.log('Period element not found in account');
            return 999999;
        }
        const match = periodElement.textContent.trim().match(/会计期间：(\d{4})-(\d{1,2})/);
        if (!match) {
            console.log('No match for period in:', periodElement.textContent);
            return 999999;
        }
        const year = parseInt(match[1], 10);
        const month = parseInt(match[2], 10);
        return year * 12 + month;
    }

    // 高亮、打标签及屏蔽公司
    function highlightExpiredAccounts() {
        console.log('Starting highlight process');
        const accounts = document.querySelectorAll('.customerbox_li:not(.add)');
        console.log('Accounts found:', accounts.length);
        accounts.forEach(account => {
            const companyNameElement = account.querySelector('.companyName');
            if (!companyNameElement) {
                console.log('Company name element not found in account');
                return;
            }
            const companyName = companyNameElement.textContent.trim();
            if (blockedCompanies.includes(companyName)) {
                account.classList.add('blocked');
                return;
            }
            companyNameElement.classList.add('company-name');
            if (!companyNameElement.nextElementSibling || !companyNameElement.nextElementSibling.classList.contains("priority-tag")) {
                const priorityLevel = getPriority(companyName);
                const tag = createPriorityTag(priorityLevel);
                if (tag) companyNameElement.after(tag);
            }
            const periodElement = account.querySelector('.df');
            if (!periodElement) {
                console.log('Period element missing for account');
                return;
            }
            const match = periodElement.textContent.trim().match(/会计期间：(\d{4})-(\d{1,2})/);
            if (!match) {
                console.log('Period format mismatch:', periodElement.textContent);
                return;
            }
            const year = parseInt(match[1], 10);
            const month = parseInt(match[2], 10);
            const color = getDynamicColor(year, month);
            console.log(`Account ${year}-${month} assigned color: ${color}`);
            if (color) {
                account.classList.add('expired');
                const innerWrap = account.querySelector('.innerWrap');
                if (innerWrap) innerWrap.style.backgroundColor = color;
                else console.log('innerWrap not found for account');
            }
        });
    }

    // 排序：先优先级，再会计期间
    function sortAccountsByPriorityAndPeriod() {
        console.log('Starting sort process'); // <-- 已修复
        const container = document.querySelector('.customerbox');
        if (!container) {
            console.log('Container .customerbox not found'); // <-- 已修复
            return;
        }
        const accounts = Array.from(container.querySelectorAll('.customerbox_li:not(.add):not(.blocked)'));
        console.log('Accounts to sort:', accounts.length);
        accounts.sort((a, b) => {
            const nameA = a.querySelector('.companyName')?.textContent.trim() || "";
            const nameB = b.querySelector('.companyName')?.textContent.trim() || "";
            const priA = getPriority(nameA);
            const priB = getPriority(nameB);
            if (priA !== priB) return priA - priB;
            return parsePeriod(a) - parsePeriod(b);
        });
        accounts。forEach(acc => container.appendChild(acc));
    }

    // === 主函数 ===
    const observer = new MutationObserver(() => {
        console。log('DOM mutation detected, reprocessing');
        processAccounts();
    });

    function processAccounts() {
        console。log('Processing accounts at:'， new Date()。toLocaleTimeString());
        observer。disconnect();
        highlightExpiredAccounts();
        sortAccountsByPriorityAndPeriod();
        observer。observe(document。body， { childList: true， subtree: true });
    }

    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        processAccounts();
    } else {
        document。addEventListener('DOMContentLoaded'， processAccounts);
    }

    observer.observe(document.body， { childList: true, subtree: true });
})();
