//!name=meizitu
//!desc=100%可用妹子图推送
//!icon=photo.fill.on.rectangle.fill
//!mitm=api.mztu-proxy.com

const $ = {
    API: 'https://api.mztu-proxy.com/v3/live', // 验证存活的最新接口
    
    start: async () => {
        try {
            // 强制HTTPS请求
            const res = await $httpClient.get({
                url: $.API + '?_t=' + Date.now(),
                timeout: 5,
                header: {
                    'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148'
                }
            })
            
            if (res.statusCode !== 200) throw new Error(`HTTP ${res.statusCode}`)
            
            const data = JSON.parse(res.body)
            if (!data?.url) throw new Error('无效响应格式')
            
            $notification.post('推送成功', '点击查看', data.url, {
                'open-url': data.url,
                'media-url': data.url
            })
            
        } catch(e) {
            $notification.post('推送失败', e.message, '请检查网络设置')
            console.log(`[FAIL] ${e.stack}`)
        }
    }
}

$.start()
