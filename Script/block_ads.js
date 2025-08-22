// Loon 脚本：屏蔽 pushplus 的广告图片
if ($request.url.indexOf("image.pushplus.plus/ad/") != -1) {
  $done({ response: { status: 200, headers: { "Content-Type": "image/png" }, body: "" } });
}

// Loon 脚本：屏蔽 file.youpiaopiaopiao.cn 的广告图片
if ($request.url.indexOf("file.youpiaopiaopiao.cn/upload/materials/") != -1) {
  $done({ response: { status: 200, headers: { "Content-Type": "image/jpeg" }, body: "" } });
}

// 默认情况，不做处理
$done({});
