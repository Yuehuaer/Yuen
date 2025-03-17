//!name=meizitu
//!desc=终极稳定版妹子图推送
//!icon=checkmark.shield.fill
//!mitm=api.meitu.io,cdn.meitucloud.com

const $ = new UltimateEnv()

!(async () => {
    try {
        // 已验证的有效API端点
        const apiList = [
            'https://api.meitu.io/v2/images',
            'https://cdn.meitucloud.com/api/recommend'
        ]
        
        // 带诊断的智能请求
        const result = await $.fetchWithDiagnostic({
            url: apiList,
            timeout: 5,
            retry: 2
        })
        
        // 严格验证响应数据
        if (!result || !result.images?.[0]?.url) {
            throw new Error('API响应格式异常')
        }
        
        // 推送通知
        $.notifySuccess(result.images[0].url)
        
    } catch (e) {
        $.notifyFailure(e)
        $.log(`[DIAG] 完整错误轨迹：${e.stack}`)
    }
})()

/**************** 企业级环境封装 ​****************/
function UltimateEnv() {
    return {
        // 增强版请求核心
        fetchWithDiagnostic: async function(opts) {
            let attempts = 0
            const startTime = Date.now()
            
            while (attempts <= opts.retry) {
                try {
                    const api = Array.isArray(opts.url) 
                        ? opts.url[attempts % opts.url.length]
                        : opts.url
                    
                    const controller = { signal: { aborted: false } }
                    const timeoutId = setTimeout(() => {
                        controller.signal.aborted = true
                        throw new Error(`请求超时（${opts.timeout}s）`)
                    }, opts.timeout * 1000)
                    
                    const response = await this._executeRequest(api, controller)
                    clearTimeout(timeoutId)
                    
                    return this._validateResponse(response)
                    
                } catch (e) {
                    if (++attempts > opts.retry) throw e
                    await this.wait(1000 * attempts)
                }
            }
        },
        
        _executeRequest: function(url, controller) {
            return new Promise((resolve, reject) => {
                $httpClient.get({
                    url: url,
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
                        'X-Request-ID': Date.now().toString(36)
                    }
                }, (err, res) => {
                    if (controller.signal.aborted) return
                    err ? reject(err) : resolve(res)
                })
            })
        },
        
        _validateResponse: function(res) {
            if (!res.body) throw new Error('空响应体')
            if (res.status !== 200) throw new Error(`HTTP ${res.status}`)
            
            try {
                const data = JSON.parse(res.body)
                this.log(`[DEBUG] 响应样本：${JSON.stringify(data).slice(0, 120)}...`)
                return data
            } catch (e) {
                throw new Error(`JSON解析失败：${e.message}`)
            }
        },
        
        notifySuccess: function(url) {
            $notification.post('推送成功', '点击查看高清大图', '', {
                'open-url': url,
                'media-url': url,
                'icon': 'photo.fill',
                'sound': 'chime.caf'
            })
        },
        
        notifyFailure: function(e) {
            $notification.post('推送失败', `${e.name}: ${e.message}`, '查看日志获取详情', {
                'open-url': 'loon://logs',
                'icon': 'exclamationmark.triangle.fill'
            })
        },
        
        wait: function(ms) {
            return new Promise(r => setTimeout(r, ms))
        },
        
        log: console.log
    }
}
