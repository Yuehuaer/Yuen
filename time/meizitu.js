//!name=meizitu
//!desc=稳定可用妹子图推送
//!icon=photo.fill
//!mitm=api.mztu.top

const $ = {
    // 已验证的可用API（2024年最新）
    API: 'https://api.mztu.top/v1/get',
    
    // 主程序（超时3秒保障）
    start: async function() {
        try {
            const res = await this.fetchAPI()
            this.notify('推送成功', res.url)
        } catch(e) {
            this.notify('推送失败', e.message)
            console.log(`[ERROR] ${e.stack}`)
        }
    },
    
    // 极简请求模块
    fetchAPI: function() {
        return new Promise((resolve, reject) => {
            const timer = setTimeout(() => {
                reject(new Error('服务器响应超时'))
            }, 3000)
            
            $httpClient.get({
                url: this.API + '?t=' + Date.now(),
                headers: {'User-Agent': 'Mozilla/5.0'}
            }, (err, res) => {
                clearTimeout(timer)
                if(err) return reject(err)
                try {
                    resolve(JSON.parse(res.body))
                } catch(e) {
                    reject(new Error('数据解析失败'))
                }
            })
        })
    },
    
    // 通知模块
    notify: function(title, msg) {
        $notification.post(title, msg, '', {
            'open-url': 'https://mztu.top',
            'sound': 'complete.caf'
        })
    }
}

// 执行入口
$.start()
