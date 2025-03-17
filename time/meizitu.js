//!name=meizitu
//!desc=终极稳定推送方案
//!mitm=api.mztu-proxy.com, *.mztu-proxy.com

const $ = {
    API: 'https://api.mztu-proxy.com/v3/live',
    
    start: async () => {
        try {
            // 双重网络检测
            if(!await this.checkNetwork()) throw new Error('网络不可达')
            
            // 带诊断的请求模块
            const { status, body } = await this.safeFetch({
                url: this.API,
                timeout: 8,
                retry: 3
            })
            
            // 严格响应验证
            if(status !== 200) throw new Error(`HTTP ${status}`)
            const data = JSON.parse(body)
            if(!data?.url) throw new Error('无效响应结构')
            
            $notification.post('推送成功', data.url)
            
        } catch(e) {
            $notification.post('推送失败', e.message)
            console.log(`[DIAG] 完整错误堆栈：${e.stack}`)
        }
    },
    
    safeFetch: function(opts) {
        return new Promise((resolve, reject) => {
            let retryCount = 0
            const attempt = () => {
                $httpClient.get({
                    url: opts.url + `?_=${Date.now()}`,
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148',
                        'X-Debug-Mode': '1'
                    }
                }, (err, res) => {
                    if(err) {
                        if(retryCount++ < opts.retry) {
                            console.log(`[RETRY] 第${retryCount}次重试`)
                            return setTimeout(attempt, 1000 * retryCount)
                        }
                        return reject(new Error(`网络错误: ${err.code}`))
                    }
                    resolve({
                        status: res.status || 0,
                        body: res.body || ''
                    })
                })
            }
            setTimeout(() => reject(new Error('总超时')), opts.timeout * 1000)
            attempt()
        })
    },
    
    checkNetwork: async () => {
        return new Promise(r => {
            $httpClient.get('https://connectivitycheck.gstatic.com/generate_204', 
                () => r(true), 
                () => r(false)
            )
        })
    }
}

$.start()
