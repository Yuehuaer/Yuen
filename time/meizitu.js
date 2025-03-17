//!name=meizitu
//!desc=每日妹子图推送

const NAME = 'meizitu'
const $ = new Env(NAME)

/**************** 参数配置 ​****************/
// 默认参数（模式：随机）
const DEFAULT_CONFIG = { MODE: '0' }

/**************** 主程序 ​****************/
!(async () => {
  try {
    // 参数解析（Loon专用）
    const arg = JSON.parse(typeof $loon !== 'undefined' ? $loon : '{}')
    const config = { ...DEFAULT_CONFIG, ...$.getjson(NAME, {}), ...arg }
    
    // 运行模式处理
    const mode = parseMode(config.MODE)
    $.log(`当前模式：${mode.text}`)

    // 获取图片数据
    const imageUrl = await fetchImage(mode.code)
    
    // 发送通知
    sendNotification(imageUrl, mode.text)

  } catch (e) {
    handleError(e)
  }
})()

/**************** 工具函数 ​****************/
function parseMode(input) {
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
  
  const validModes = String(input).split(/,|，/)
    .map(m => m.trim())
    .filter(m => m in MODES)
    .map(m => MODES[m])
  
  return validModes.length > 0 ? validModes[0] : MODES[0]
}

async function fetchImage(modeCode) {
  const response = await $.http.get({
    url: 'https://3650000.xyz/api',
    headers: {
      'User-Agent': `Loon/${__VERSION__}`,
      'X-Requested-With': 'XMLHttpRequest'
    },
    params: {
      type: 'json',
      mode: modeCode || undefined
    }
  })
  
  const data = JSON.parse(response.body)
  if (!data?.url) throw new Error('未获取到有效图片地址')
  return data.url
}

function sendNotification(url, modeText) {
  $.msg('妹子图推送', `模式：${modeText}`, {
    openUrl: url,
    mediaUrl: url,
    'loon-sound': 'minimal',
    'icon': 'photo.fill'
  })
}

function handleError(error) {
  const errorMessage = `错误类型：${error.name}\n错误信息：${error.message}`
  $.msg('❌ 运行失败', errorMessage, { 'open-url': 'loon://logs' })
  $.log(`[ERROR] ${error.stack}`)
}

/**************** 环境适配 ​****************/
function Env(t) {
  return {
    isLoon: typeof $loon !== 'undefined',
    getjson: (e, s) => {
      try { return JSON.parse($persistentStore.read(e)) || s }
      catch { return s }
    },
    msg: (title, subtitle, opts) => {
      $notification.post(title, subtitle, '', opts)
    },
    http: {
      get: opts => new Promise((resolve, reject) => {
        $httpClient.get(opts, (err, res) => err ? reject(err) : resolve(res))
      })
    },
    log: console.log
  }
}
