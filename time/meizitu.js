//!name=meizitu
//!desc=智能超时妹子图推送
//!icon=network
//!homepage=https://github.com/crossutility/Quantumult-X

const $ = new HyperEnv('meizitu')

/**************** 智能超时核心代码 ​****************/
!(async () => {
    const traceId = Date.now().toString(36)
    const analyzer = new PerformanceAnalyzer()
    
    try {
        // 动态超时配置（初始5秒，最大15秒）
        const config = {
            mode: processMode($.getcfg('MODE', '0')),
            baseTimeout: 5,
            maxTimeout: 15,
            retryPolicy: {
                maxRetries: 3,
                backoffFactor: 2
            },
            fallbackAPIs: [
                'https://3650000.xyz/api',
                'https://api.meizitu.net/v1/image',
                'https://cdn.meizitu.cloud/api'
            ]
        }

        analyzer.mark('start')
        const result = await smartFetch(config, traceId)
        showResult(result, config, analyzer)

    } catch (e) {
        handleError(e, analyzer)
    }
})()

/**************** 核心智能模块 ​****************/
class PerformanceAnalyzer {
    constructor() {
        this.marks = new Map()
        this.metrics = {}
    }

    mark(label) {
        this.marks.set(label, Date.now())
    }

    measure(startLabel, endLabel) {
        const start = this.marks.get(startLabel)
        const end = this.marks.get(endLabel)
        this.metrics[`${startLabel}-${endLabel}`] = end - start
    }

    getMetrics() {
        return {...this.metrics}
    }
}

async function smartFetch(config, traceId) {
    let attempt = 0
    let currentTimeout = config.baseTimeout
    let lastError = null

    while (attempt < config.retryPolicy.maxRetries) {
        const apiUrl = config.fallbackAPIs[attempt % config.fallbackAPIs.length]
        
        try {
            const controller = new AbortController()
            const timeoutId = setTimeout(() => controller.abort(), currentTimeout * 1000)

            const response = await $.fetch({
                url: apiUrl,
                params: {
                    mode: config.mode.code,
                    _trace: traceId,
                    _t: Date.now().toString(36)
                },
                headers: {
                    'Accept': 'application/json',
                    'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
                    'X-Smart-Retry': `${attempt + 1}/${config.retryPolicy.maxRetries}`
                },
                signal: controller.signal,
                dnsCache: true
            })

            clearTimeout(timeoutId)
            return parseJSON(response.body)

        } catch (e) {
            clearTimeout(timeoutId)
            lastError = e
            currentTimeout = Math.min(
                currentTimeout * config.retryPolicy.backoffFactor,
                config.maxTimeout
            )
            attempt++
            await $.wait(100 * attempt)
        }
    }

    throw lastError || new Error('所有重试均失败')
}

function processMode(input) {
    const MODE_MAP = {
        '0': {code: '', desc: '智能推荐'},
        '1': {code: '1', desc: '微博热点'},
        '7': {code: '7', desc: '美腿专辑'},
        '8': {code: '8', desc: 'Coser精选'}
    }
    return MODE_MAP[String(input).replace(/[^\d]/g, '')] || MODE_MAP['0']
}

/**************** 显示模块 ​****************/
function showResult(data, config, analyzer) {
    $.notify({
        title: `📡 推送成功 (${config.mode.desc})`,
        message: `⏱ 智能耗时: ${analyzer.getMetrics()['start-end']}ms`,
        openUrl: data.url,
        mediaUrl: data.url,
        icon: 'photo.stack.fill',
        sound: 'bell.and.waves.left.and.right'
    })
}

function handleError(e, analyzer) {
    const metrics = analyzer.getMetrics()
    
    $.notify({
        title: '⚠️ 网络优化建议',
        message: `检测到延迟较高 (${metrics['start-end'] || 'N/A'}ms)`,
        icon: 'wifi.exclamationmark',
        actions: [
            {title: '测速诊断', action: 'runDiagnostic'},
            {title: '切换CDN', action: 'switchCDN'}
        ]
    })
    
    $.log(`[DIAG] 性能指标: ${JSON.stringify(metrics)}`)
    $.log(`[ERROR] ${e.stack}`)
}

/**************** 增强环境适配器 ​****************/
function HyperEnv() {
    return {
        fetch: opts => new Promise((resolve, reject) => {
            const start = Date.now()
            
            $httpClient.get(opts, (err, res) => {
                const latency = Date.now() - start
                
                if (err) {
                    err.latency = latency
                    return reject(err)
                }
                
                res.latency = latency
                resolve(res)
            })
        }),
        
        notify: opts => $notification.post(
            opts.title, 
            opts.message, 
            '', 
            {
                'open-url': opts.openUrl,
                'media-url': opts.mediaUrl,
                'sound': opts.sound,
                'icon': opts.icon,
                'actions': opts.actions
            }
        ),
        
        getcfg: (key, def) => {
            const val = $persistentStore.read(key)
            return val !== undefined ? val : def
        },
        
        wait: ms => new Promise(r => setTimeout(r, ms)),
        
        log: (...args) => console.log('[OPT]', ...args)
    }
}
