// push.js - 增强日志版

// 获取原始的响应体和响应头
let body = $response.body;
let headers = $response.headers;
const url = $request.url;

// 检查 URL 是否匹配 pushplus.plus 的 shortMessage 链接
if (!url.includes("https://www.pushplus.plus/shortMessage/")) {
  $done({});
}

try {
    // 【✅ 关键日志 1: 确认脚本已运行】
    console.log("PushPlus Script: 脚本已开始运行，URL: " + url);
    
    // 1. 修改或确保 Content-Type
    headers['Content-Type'] = 'text/html;charset=UTF-8';
    headers['content-type'] = 'text/html;charset=UTF-8';

    // 2. 删除广告块
    const adRegex = /<div class="container pb-3 text-center">[\s\S]*?image\.pushplus\.plus\/ad\/diancai\.jpg[\s\S]*?<\/div>/s;

    if (body.match(adRegex)) {
        // 【✅ 关键日志 2: 确认匹配成功】
        console.log("PushPlus Script: 成功匹配到广告块，准备移除。");
        body = body.replace(adRegex, "");
    } else {
        // 【⚠️ 关键日志 3: 确认匹配失败及原因】
        console.log("PushPlus Script: 未匹配到广告块。");
        // 如果匹配失败，可能是 HTML 结构再次变化。我们打印部分响应体来查看。
        // console.log("--- Body Snippet (Failure) ---");
        // console.log(body.substring(body.length - 1000)); // 打印底部 1000 字符
        // console.log("--- End Snippet ---");
    }
    
    $done({body, headers});

} catch (e) {
    // 捕获可能出现的错误并输出日志
    console.log("PushPlus Script Error: " + e.message);
    $done({});
}
