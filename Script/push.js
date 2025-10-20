// Loon 脚本: 修改 PushPlus 消息页面内容 (作业 - 保留标题)
// [response] 类型的脚本

/**
 * 目标:
 * 1. 确保 Content-Type 为 text/html。
 * 2. 保留原始网页标题 (<title>...</title>) 不变。
 * 3. 删除页面底部的广告块。
 */

// 获取原始的响应体和响应头
let body = $response.body;
let headers = $response.headers;
const url = $request.url;

// 检查 URL 是否匹配 pushplus.plus 的 shortMessage 链接
if (!url.includes("https://www.pushplus.plus/shortMessage/")) {
  $done({});
}

try {
    // 1. 修改或确保 Content-Type
    // 确保响应头中的 Content-Type 正确
    headers['Content-Type'] = 'text/html;charset=UTF-8';
    headers['content-type'] = 'text/html;charset=UTF-8';

    // 2. 原始标题保留（代码已移除）
    //  --- 这一步跳过，让 <title> 保持不变 ---
    
    // 3. 删除广告块
    // 广告块的 HTML 结构: <div class="container pb-3 text-center"> ... </div>
    // 使用非贪婪匹配（/s 标志允许 . 匹配换行符）来精确匹配并删除广告块
    const adRegex = /<div class="container pb-3 text-center">\s*<hr class="my-3 ad" \/>\s*<a href="#" target="_blank">\s*<img class="img-fluid" src="\/\/image\.pushplus\.plus\/ad\/diancai\.jpg">\s*<\/a>\s*<\/div>/s;

    if (body.match(adRegex)) {
        // 将匹配到的整个广告块替换为空字符串，即删除
        body = body.replace(adRegex, "");
    }
    
    // 返回修改后的响应体和响应头
    $done({body, headers});

} catch (e) {
    // 捕获可能出现的错误并输出日志
    console.log("PushPlus Script Error: " + e.message);
    // 出现错误时，返回原始响应
    $done({});
}
