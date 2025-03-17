//!name=meizitu
//!desc=苹果设备专用妹子图推送
//!icon=photo.on.rectangle
//!homepage=https://github.com/crossutility/Quantumult-X

const $ = new Env('meizitu')

/**************** 深度修复版核心代码 ​****************/
!(async () => {
    try {
        // 参数解析（适配iOS 17沙盒限制）
        const config = {
            mode: processMode($.getjson('meizitu', {}).MODE || '0'),
            timeout: 10,
            retries: 3
        }

        // 调试信息输出
        $.log(`📱 设备信息: ${JSON.stringify($device)}`)
        $.log(`⚙️ 配置参数: ${JSON.stringify(config)}`)

        // 网络请求（强制JSON响应）
        const response = await fetchAPI(config)
        showResult(response)

    } catch (e) {
        handleError(e)
    }
})()

/**************** 核心功能函数 ​****************/
function processMode(input) {
    const modeMap = {
        '0': { apiParam: '', desc: '随机推荐' },
        '1': { apiParam: '1', desc: '微博精选' },
        '2': { apiParam: '2', desc: 'INS风' },
        '3': { apiParam: '3', desc: 'Cosplay' },
        '7': { apiParam: '7', desc: '美腿专辑' },
        '8': { apiParam: '8', desc: 'Coser特辑' },
        '9': { apiParam: '9', desc: '兔玩映画' }
    }

    const sanitizedInput = String(input).replace(/[^\d,]/g, '')
    return modeMap[sanitizedInput.split(',')[0]] || modeMap['0']
}

async function fetchAPI(config) {
    const opts = {
        url: 'https://3650000.xyz/api',
        headers: {
            'Accept': 'application/json',
            'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148',
            'X-Requested-With': 'XMLHttpRequest'
        },
        params: {
            type: 'json',
            mode: config.mode.apiParam || undefined,
            _t: Date.now() // 防止缓存
        },
        policy: config.retries,
        timeout: config.timeout
    }

    const startTime = Date.now()
    const res = await $.http.get(opts)
    const latency = Date.now() - startTime

    $.log(`⏱ 请求耗时: ${latency}ms`)
    $.log(`🔔 响应头: ${JSON.stringify(res.headers)}`)
    $.log(`📦 响应预览: ${res.body.substring(0, 120)}...`)

    // 数据校验
    if (res.status !== 200) throw new Error(`HTTP ${res.status}`)
    if (!res.headers['Content-Type']?.includes('json')) {
        throw new Error('非JSON响应')
    }

    return parseJSON(res.body)
}

function parseJSON(data) {
    try {
        const sanitized = data
            .replace(/(['"])?([a-zA-Z0-9_]+)(['"])?:/g, '"$2":') // 修复非标JSON
            .replace(/iPhone\d+/g, '""') // 过滤设备标识符
        
        return JSON.parse(sanitized)
    } catch (e) {
        throw new Error(`JSON解析失败: ${e.message}\n原始数据: ${data.slice(0, 200)}`)
    }
}

function showResult(data) {
    if (!data?.url) throw new Error('图片地址无效')
    
    $.msg('🍑 妹子图推送', `📸 ${data.title || config.mode.desc}`, {
        'open-url': data.url,
        'media-url': data.url,
        'loon-sound': 'glass',
        'icon': 'photo.fill.viewfinder',
        'auto-dismiss': 10
    })
}

function handleError(error) {
    const errorInfo = {
        name: error.name,
        message: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString(),
        device: $device
    }

    $.msg('❌ 运行异常', `${error.name}: ${error.message}`, {
        'open-url': 'loon://logs',
        'icon': 'exclamationmark.triangle.fill'
    })
    
    $.log(`🔥 完整错误信息:\n${JSON.stringify(errorInfo, null, 2)}`)
}

/**************** Loon环境适配器 ​****************/
function Env() {
    return {
        http: {
            get: opts => new Promise((resolve, reject) => {
                $httpClient.get(opts, (err, res) => {
                    if (err) return reject(err)
                    if (res.status >= 400) reject(new Error(`HTTP ${res.status}`))
                    resolve(res)
                })
            })
        },
        msg: (title, subtitle, opts) => $notification.post(title, subtitle, '', opts),
        getjson: (key, def) => {
            try { return JSON.parse($persistentStore.read(key)) || def }
            catch { return def }
        },
        log: (...args) => console.log('[DEBUG]', ...args)
    }
}
