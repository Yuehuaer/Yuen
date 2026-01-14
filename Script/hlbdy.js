/**
 * @name 黑料不打烊 简单获取
 */

const BASE_URL = "https://5g7hf.wzrqxio.com";
// 过滤杂质关键词
const BLACKLIST = ["找回密码", "发布页", "防走失", "联系我们", "下载APP", "邮箱", "入口"];

const isLoon = typeof $loon !== "undefined";

function notify(title, subtitle, content, options) {
    if (isLoon) {
        // Loon 的标准跳转格式是 open-url
        $notification.post(title, subtitle, content, options);
    }
}

async function request(url) {
    return new Promise((resolve) => {
        $httpClient.get({
            url: url,
            headers: {
                "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
                "Referer": BASE_URL
            },
            timeout: 10000
        }, (err, resp, body) => {
            resolve(err ? null : body);
        });
    });
}

(async () => {
    const html = await request(BASE_URL);
    if (!html) {
        $done();
        return;
    }

    // 参照原脚本使用的正则提取逻辑
    const titleRegex = /class="[^"]*title[^"]*"[^>]*>([^<]+)</g;
    let titles = [];
    let match;

    while ((match = titleRegex.exec(html)) !== null) {
        const t = match[1].trim();
        const isBlack = BLACKLIST.some(word => t.includes(word));
        if (t.length > 6 && !isBlack && !titles.includes(t)) {
            titles.push(t);
        }
        if (titles.length >= 10) break;
    }

    if (titles.length > 0) {
        const content = titles.map((t, i) => `${i + 1}。${t}`).join("\n");
        
        // 参照原脚本跳转逻辑：
        // 在 Loon 中，必须确保第四个参数对象中 open-url 的键名正确
        const opts = { "open-url": BASE_URL, "url": BASE_URL };
        
        notify("🔥 黑料不打烊更新", "", content, opts);
    }

    $done();
})();
