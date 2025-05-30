// @grant nodejs
// @grant script

// 通用网页首页图片获取脚本，兼容 Loon
// 使用方法：部署为 Loon 的脚本任务，定时触发或通过面板查看图片
// 功能：获取首页图片（含缩略图和大图），并随机展示一张

const url = $request?.url || 'https://www.meizi2.com';

(async () => {
  try {
    const response = await $httpClient.get({
      url,
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8'
      }
    });

    if (response.status !== 200) throw new Error('网页请求失败');

    const html = response.body;
    const imgRegex = /<img\s+[^>]*?src=["']([^"'>]+\.(?:jpg|jpeg|png|webp|gif))["'][^>]*?>/gi;
    const images = [];

    let match;
    while ((match = imgRegex.exec(html)) !== null) {
      let src = match[1];
      if (!src.startsWith('http')) {
        // 处理相对路径
        const base = new URL(url);
        src = new URL(src, base).href;
      }
      images.push({ src });
    }

    if (images.length === 0) throw new Error('未找到图片');

    // 随机选一张
    const randomImage = images[Math.floor(Math.random() * images.length)];

    const htmlView = `
<html>
  <head><meta name="viewport" content="width=device-width, initial-scale=1"><title>图片展示</title></head>
  <body style="text-align:center;font-family:sans-serif">
    <h2>共找到 ${images.length} 张图片，随机展示一张：</h2>
    <img src="${randomImage.src}" style="max-width:95%;margin:20px auto;display:block" />
    <hr />
    <h3>所有图片预览：</h3>
    ${images.map(img => `<img src="${img.src}" style="max-width:48%;margin:5px" />`).join('')}
  </body>
</html>`;

    $done({ response: { status: 200, headers: { 'Content-Type': 'text/html' }, body: htmlView } });
  } catch (err) {
    $done({ response: { status: 500, body: '图片解析失败: ' + err.message } });
  }
})();
