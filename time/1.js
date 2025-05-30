/*
脚本名称：Meizi2 随机图片通知
作者：基于YueJS修改
更新时间：2025-05-30
支持平台：Surge、Quantumult X、Loon
脚本功能：访问指定页面，提取图片链接并随机推送带预览的大图
*/

const NAME = 'Meizi2 图片通知'
const HOMEPAGE = 'https://www.meizi2.com'
const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp']
const $ = new Env(NAME)

!(async () => {
  const html = await http({ url: HOMEPAGE })
  if (!html) throw new Error('页面获取失败')

  const imageUrls = extractImageUrls(html, HOMEPAGE)
  if (!imageUrls.length) throw new Error('未提取到图片链接')

  const chosen = imageUrls[Math.floor(Math.random() * imageUrls.length)]
  await notify(NAME, '随机美图获取成功', chosen, {
    'open-url': chosen,
    'media-url': chosen
  })
})()
.catch(async e => {
  $.logErr(e)
  await notify(NAME, '❌ 获取失败', e.message || e)
})
.finally(() => {
  $.done()
})

function extractImageUrls(html, baseUrl) {
  const matches = html.match(/<img[^>]+src=["']?([^"'>]+)["']?/g) || []
  return matches.map(m => {
    const srcMatch = m.match(/src=["']?([^"'>]+)["']?/) 
    return srcMatch && srcMatch[1] ? toAbsoluteUrl(srcMatch[1], baseUrl) : null
  })
  .filter(u => u && IMAGE_EXTENSIONS.some(ext => u.toLowerCase().includes(ext)))
}

function toAbsoluteUrl(url, base) {
  if (url.startsWith('http')) return url
  return new URL(url, base).href
}

// 通知封装
async function notify(title, subt, desc, opts) {
  $.msg(title, subt, desc, opts)
}

// HTTP请求封装
async function http(opt = {}) {
  return new Promise((resolve, reject) => {
    $httpClient.get({ url: opt.url }, (err, resp, body) => {
      if (err) reject(err)
      else resolve(body)
    })
  })
}

// 环境支持封装（兼容 Loon/Surge/QuanX）
function Env(t,e){class s{constructor(t){this.env=t}send(t,e="GET"){t="string"==typeof t?{url:t}:t;let s=this.get;return"POST"===e&&(s=this.post),new Promise((e,a)=>{s.call(this,t,(t,s,r)=>{t?a(t):e(s)})})}get(t){return this.send.call(this.env,t)}post(t){return this.send.call(this.env,t,"POST")}}return new class{constructor(t,e){this.name=t,this.http=new s(this),this.data=null,this.dataFile="box.dat",this.logs=[],this.isMute=!1,this.isNeedRewrite=!1,this.logSeparator="\n",this.encoding="utf-8",this.startTime=(new Date).getTime(),Object.assign(this,e),this.log("",`🔔${this.name}, 开始!`)}isSurge(){return"undefined"!=typeof $httpClient}isQuanX(){return"undefined"!=typeof $task}isLoon(){return"undefined"!=typeof $loon}isNode(){return"undefined"!=typeof module&&!!module.exports}msg(e=t,s="",a="",r){const i=t=>{switch(typeof t){case"object":return this.isSurge()||this.isLoon()?{url:t.url}:this.isQuanX()?{"open-url":t.url,"media-url":t.mediaUrl}:void 0;default:return t}};this.isMute||(this.isSurge()||this.isLoon()?$notification.post(e,s,a,i(r)):this.isQuanX()&&$notify(e,s,a,i(r)));let logs=["","==============📣系统通知📣==============",e];s&&logs.push(s),a&&logs.push(a),console.log(logs.join("\n")),this.logs=this.logs.concat(logs)}log(...t){t.length>0&&(this.logs=[...this.logs,...t]),console.log(t.join(this.logSeparator))}logErr(t,e){this.log("",`❗️${this.name}, 错误!`,t.stack?t.stack:t)}done(t={}){const e=(new Date).getTime(),s=(e-this.startTime)/1e3;this.log("",`🔔${this.name}, 结束! 🕛 ${s} 秒`),this.log(),this.isQuanX()||this.isSurge()||this.isLoon()?$done(t):this.isNode()&&process.exit(1)}}(t,e)}
