#!name=meizitu
#!desc=每日妹子图推送

const NAME = 'meizitu'
const $ = new Env(NAME)

// Loon专用参数解析（替代原$argument）
const arg = JSON.parse(typeof $loon != 'undefined' ? $loon : "{}") 

// 合并持久化存储参数
$.lodash_merge(arg, $.getjson(NAME, {}))

const MODES = {
  0: '随机',
  1: '微博',
  2: 'Instagram',
  3: 'Cosplay',
  5: 'MTCos',
  7: '美腿',
  8: 'Coser',
  9: '兔玩映画',
}

!(async () => {
  try {
    // 模式处理
    const mode = ($.lodash_get(arg, 'MODE') || '0').split(/,|，/).filter(Boolean)
    const mode_text = mode.map(i => MODES[i] || '').filter(Boolean).join(',')
    
    // API请求
    const res = await $.http.get({
      url: `https://3650000.xyz/api`,
      headers: {
        'X-Requested-With': 'XMLHttpRequest',
        'User-Agent': `Loon/${__VERSION__}`
      },
      params: {
        type: 'json',
        mode: mode.includes('0') ? undefined : mode.join(',')
      }
    })
    
    // 结果处理
    const url = $.lodash_get(JSON.parse(res.body), 'url')
    if (!url) throw new Error('API未返回有效图片地址')
    
    // Loon专用通知格式
    $.msg('妹子图', mode_text || '随机模式', {
      openUrl: url,
      mediaUrl: url,
      'loon-sound': 'alert'
    })
    
  } catch (e) {
    $.msg('❌ 运行失败', `${e.message}`, '请检查网络或配置')
    $.log(`错误详情：${e.stack}`)
  }
})()
