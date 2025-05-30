/*
脚本名称：通用图片抓取通知脚本
适配平台：Surge、Quantumult X、Loon、Stash
脚本说明：从指定网址首页抓取图片，随机选择展示一张，缩略图 + 点击通知展开大图
作者：改编自 YueJS
*/

const CONFIG = {
  NAME: '图片通知',
  HOMEPAGE: 'https://www.meizi2.com',
  IMG_REGEX: /<img[^>]+src=["']([^"']+\.(?:jpg|jpeg|png|webp))["'][^>]*>/gi,
  HEADERS: {
    'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148'
  }
}

const $ = new Env(CONFIG.NAME)

!(async () => {
  const body = await httpGet(CONFIG.HOMEPAGE)
  if (!body) throw new Error('无法获取页面内容')

  const imgUrls =.map(m => m[1])
  if (!imgUrls.length) throw new Error('未匹配到图片地址')

  const chosen = imgUrls[Math.floor(Math.random() * imgUrls.length)]
  const finalUrl = toAbsoluteUrl(CONFIG.HOMEPAGE, chosen)

  // 调试信息：输出最终用于通知的图片URL
  // 你可以在Loon的日志中查看此输出，以确认图片链接是否正确。
  $.log(`尝试发送通知图片URL: ${finalUrl}`)

  // Loon平台通知图片显示说明：
  // 尽管脚本尝试通过 'media-url' 选项在通知中显示图片，
  // 但图片（缩略图和大图）的实际显示能力取决于Loon应用本身对“富通知”的支持，
  // 以及iOS系统版本的要求（例如，iOS 10+支持富通知）。
  // Surge等类似工具的文档表明，`media-url`参数用于提供通知的媒体内容，如图片 [2]。
  // 确保 `finalUrl` 是一个直接可访问的图片链接（例如，以.jpg,.png等结尾），并且是HTTPS链接。
  // 如果图片仍无法显示，请检查Loon的官方文档或社区，确认其对通知图片附件的具体支持情况和要求。
  await notify(CONFIG.NAME, '点击查看大图', finalUrl, {
    'open-url': finalUrl,
    'media-url': finalUrl
  })
})()
.catch(e => {
  $.logErr(e)
  notify(CONFIG.NAME, '❌ 错误', e.message |
| e.toString())
})
.finally(() => $.done())

// 工具函数
function toAbsoluteUrl(base, relative) {
  // 确保相对URL转换为绝对URL，并处理协议
  if (/^https?:\/\//.test(relative)) return relative
  const url = new URL(relative, base)
  return url.toString()
}

function httpGet(url) {
  return new Promise((resolve, reject) => {
    const options = { url, headers: CONFIG.HEADERS }
    $.get(options, (err, resp, data) => {
      if (err) reject(err)
      else resolve(data)
    })
  })
}

function notify(title, subtitle, message, opts) {
  $.msg(title, subtitle, message, opts)
}

// ↓↓↓ 跨平台环境封装
function Env(name, opts) {
  const isSurge = typeof $httpClient!== 'undefined'
  const isQuanX = typeof $task!== 'undefined'
  const isLoon = typeof $loon!== 'undefined'
  const isStash = typeof $environment!== 'undefined' && $environment['stash-version']

  return new class {
    constructor(name, opts) {
      this.name = name
      Object.assign(this, opts)
      this.logs =
      this.startTime = new Date().getTime()
      this.log(`🔔${this.name}, 开始!`)
    }

    get(opts, cb) {
      if (isSurge |
| isLoon |
| isStash) {
        $httpClient.get(opts, cb)
      } else if (isQuanX) {
        if (typeof opts === 'string') opts = { url: opts }
        opts.method = 'GET'
        $task.fetch(opts).then(
          resp => cb(null, resp, resp.body),
          reason => cb(reason.error, null, null)
        )
      }
    }

    msg(title, subt, body, opt) {
      if (isSurge |
| isLoon |
| isStash) {
        $notification.post(title, subt, body, opt)
      } else if (isQuanX) {
        $notify(title, subt, body, opt)
      }
      this.log(`${title} ${subt} ${body}`)
    }

    log(...args) {
      this.logs.push(...args)
      console.log(args.join('\n'))
    }

    logErr(err) {
      this.log(`❗️${this.name}, 错误!`, err.stack |
| err)
    }

    done() {
      const end = new Date().getTime()
      const elapsed = ((end - this.startTime) / 1000).toFixed(2)
      this.log(`🔔${this.name}, 结束! 🕛 ${elapsed} 秒`)
      if (isSurge |
| isLoon |
| isStash |
| isQuanX) $done()
    }
  }(name, opts)
}
