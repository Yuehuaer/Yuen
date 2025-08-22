// Loon 脚本：屏蔽 pushplus 的广告图片
if ($request.url.indexOf("/ad/") != -1) {
  $done({ response: { status: 200, headers: { "Content-Type": "image/png" }, body: "" } });
} else {
  $done({});
}
