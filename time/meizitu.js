//!name=meizitu
//!desc=极速版妹子图推送
//!icon=bolt
//!homepage=https://github.com/crossutility/Quantumult-X

const $ = new UltraEnv('meizitu')

/**************** 性能优化版核心代码 ​****************/
!(async () => {
    const startTime = Date.now()
    try {
        // 极速参数配置（超时3秒，重试2次）
        const config = {
            mode: processMode($.getcfg('MODE', '0')),
            timeout: 3,
            retries: 2
        }

        // 异步并发处理
        const [response] = await Promise.race([
            Promise.all([fetchAPI(config)]),
            timeoutGuard(config.timeout)
        ])

        showResult(response, config, startTime)

    } catch (e) {
        handleError(e, startTime)
    }
})()

/**************** 高性能函数 ​****************/
function processMode(input) {
    const MODE_MAP = new Map([
        ['0', {code: '', desc: '随机'}],
        ['1', {code: '1', desc: '微博'}],
        ['7', {code: '7', desc: '美腿'}],
        ['8', {code: '8', desc: 'Coser'}]
    ])
    
    const modeKey = String(input).split(/,|，/)[0] || '0'
    return MODE_MAP.get(modeKey) || MODE_MAP.get('0')
}

async function fetchAPI(config) {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), config.timeout * 1000)
    
    try {
        const res = await $.fetch({
            url: 'https://3650000.xyz/api',
            params: {
                type: 'json',
                mode: config.mode.code,
                _: Date.now().toString(36) // 缓存爆破
            },
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
            },
            retry: config.retries,
            signal: controller.signal
        })
        
        clearTimeout(timeoutId)
        return parseJSON(res.body)
        
    } catch (e) {
        clearTimeout(timeoutId)
        throw e
    }
}

function parseJSON(data) {
    try {
        return JSON.parse(
            data.replace(/(['"])(\w+)\1:/g, '"$2":') // 快速修复非法JSON
        )
    } catch (e) {
        throw new Error(`JSON解析失败: ${e.message.slice(0, 50)}`)
    }
}

function timeoutGuard(seconds) {
    return new Promise((_, reject) => 
        setTimeout(() => 
            reject(new Error(`超时保护（${seconds}s）`)), 
            seconds * 1000
        )
    )
}

function showResult(data, config, startTime) {
    if (!data?.url) throw new Error('无效响应格式')
    
    $.notify({
        title: `🚀 妹子图推送（${config.mode.desc}）`,
        message: `⏱ 耗时：${Date.now() - startTime}ms`,
        openUrl: data.url,
        mediaUrl: data.url,
        sound: 'clockfill',
        icon: 'photo.stack'
    })
}

function handleError(e, startTime) {
    $.notify({
        title: `❌ 运行失败（${Date.now() - startTime}ms）`,
        message: `${e.name}: ${e.message}`,
        icon: 'exclamationmark.triangle',
        sound: 'alarm'
    })
    
    $.log(`[PERF] 总耗时: ${Date.now() - startTime}ms`)
    $.log(`[ERROR] ${e.stack}`)
}

/**************** 极速环境适配器 ​****************/
function UltraEnv() {
    return {
        fetch: opts => new Promise((resolve, reject) => {
            $httpClient.get(opts, (err, res) => {
                err ? reject(err) : resolve({
                    body: res.body,
                    status: res.status
                })
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
                'icon': opts.icon
            }
        ),
        getcfg: (key, def) => {
            const val = $persistentStore.read(key)
            return val !== undefined ? val : def
        },
        log: (...args) => console.log('[LOG]', ...args)
    }
}
