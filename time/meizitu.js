//!name=meizitu
//!desc=妹子图推送(修复JSON解析问题)

const NAME = 'meizitu'
const $ = new Env(NAME)

/**************** 增强版请求处理 ​****************/
!(async () => {
  try {
    // 参数处理（兼容Loon/Node）
    const arg = typeof $loon !== 'undefined' 
      ? JSON.parse($loon) 
      : $.getjson(NAME, {})
    const mode = processMode(arg.MODE || '0')

    // 发起请求（添加详细日志）
    $.log(`ℹ️ 请求参数：mode=${mode.code}`)
    const res = await fetchAPI(mode.code)
    
    // 发送通知
    $.msg('妹子图', mode.text, {
      openUrl: res.url,
      mediaUrl: res.url,
      'loon-sound': 'minimal'
    })

  } catch (e) {
    $.msg('❌ 运行失败', `${e.name}: ${e.message}`, { 'open-url': 'loon://logs' })
    $.log(`[ERROR] ${e.stack}`)
  }
})()

/**************** 工具函数 ​****************/
function processMode(input) {
  const MODES = {
    0: { code: '', text: '随机' },
    1: { code: '1', text: '微博' },
    2: { code: '2', text: 'Instagram' },
    3: { code: '3', text: 'Cosplay' },
    5: { code: '5', text: 'MTCos' },
    7: { code: '7', text: '美腿' },
    8: { code: '8', text: 'Coser' },
    9: { code: '9', text: '兔玩映画' }
  }
  
  const validCodes = String(input).split(/,|，/).map(v => v.trim())
  const validMode = validCodes.find(c => c in MODES) || '0'
  return MODES[validMode]
}

async function fetchAPI(modeCode) {
  // 请求配置
  const opts = {
    url: 'https://3650000.xyz/api',
    headers: {
      'Accept': 'application/json',
      'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1'
    },
    params: { 
      type: 'json',
      mode: modeCode || undefined 
    }
  }

  // 发起请求
  const res = await $.http.get(opts)
  
  // 调试日志
  $.log(`✅ 响应状态码：${res.status}`)
  $.log(`📦 原始响应头：${JSON.stringify(res.headers)}`)
  $.log(`📝 响应体预览：${res.body.substring(0, 80)}...`)

  // 安全解析JSON
  try {
    return JSON.parse(res.body)
  } catch (e) {
    throw new Error(`JSON解析失败：${e.message}\n响应内容：${res.body.slice(0, 200)}...`)
  }
}

/**************** 环境适配器 ​****************/
function Env() {
  return {
    http: {
      get: opts => new Promise((resolve, reject) => {
        $httpClient.get(opts, (err, res) => {
          if (err) return reject(err)
          // 处理可能的HTML响应
          if (!res.headers['Content-Type']?.includes('json')) {
            reject(new Error(`非JSON响应，类型：${res.headers['Content-Type']}`))
          }
          resolve(res)
        })
      })
    },
    msg: (title, subtitle, opts) => $notification.post(title, subtitle, '', opts),
    getjson: (key, def) => JSON.parse($persistentStore.read(key)) || def,
    log: console.log
  }
}
