const CONFIG = {
  NAME: '图片通知',
  HOMEPAGE: 'https://www.meizi2.com',
  IMG_REGEX: /<img[^>]+src=["']([^"']+\.(?:jpg|jpeg|png))["'][^>]*>/gi, // 先不要 webp 避免不支持
  HEADERS: {
    'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148'
  }
}

const $ = new Env(CONFIG.NAME)

!(async () => {
  const body = await httpGet(CONFIG.HOMEPAGE)
  if (!body) throw new Error('无法获取页面内容')

  const imgUrls = [...body.matchAll(CONFIG.IMG_REGEX)].map(m => m[1])
  if (!imgUrls.length) throw new Error('未匹配到图片地址')

  const chosen = imgUrls[Math.floor(Math.random() * imgUrls.length)]
  const finalUrl = toAbsoluteUrl(CONFIG.HOMEPAGE, chosen)

  // 这里 message 留空，全部内容靠 mediaUrl 显示图片
  await notify(CONFIG.NAME, '', '', {
    mediaUrl: finalUrl,
    openUrl: finalUrl
  })
})()
.catch(e => {
  $.logErr(e)
  notify(CONFIG.NAME, '❌ 错误', e.message || e.toString())
})
.finally(() => $.done())

// 工具函数同之前
function toAbsoluteUrl(base, relative) {
  if (/^https?:\/\//.test(relative)) return relative
  const url = new URL(relative, base)
  return url.toString()
}

function httpGet(url) {
  return new Promise((resolve, reject) => {
    $.get({ url, headers: CONFIG.HEADERS }, (err, resp, data) => {
      if (err) reject(err)
      else resolve(data)
    })
  })
}

function notify(title, subtitle, message, opts) {
  $.msg(title, subtitle, message, opts)
}

function Env(name, opts) {
  const isSurge = typeof $httpClient !== 'undefined'
  const isQuanX = typeof $task !== 'undefined'
  const isLoon = typeof $loon !== 'undefined'
  const isStash = typeof $environment !== 'undefined' && $environment['stash-version']

  return new class {
    constructor(name, opts) {
      this.name = name
      Object.assign(this, opts)
      this.logs = []
      this.startTime = Date.now()
      this.log(`🔔${this.name}, 开始!`)
    }
    get(opts, cb) {
      if (isSurge || isLoon || isStash) {
        $httpClient.get(opts, cb)
      } else if (isQuanX) {
        if (typeof opts === 'string') opts = { url: opts }
        opts.method = 'GET'
        $task.fetch(opts).then(
          r => cb(null, r, r.body),
          e => cb(e.error, null, null)
        )
      }
    }
    msg(title, subt, body, opt) {
      if (isSurge || isLoon || isStash) {
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
      this.log(`❗️${this.name}, 错误!`, err.stack || err)
    }
    done() {
      const end = Date.now()
      this.log(`🔔${this.name}, 结束! 🕛 ${(end - this.startTime) / 1000}s`)
      if (isSurge || isLoon || isStash || isQuanX) $done()
    }
  }(name, opts)
}
