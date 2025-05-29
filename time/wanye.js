/*
脚本名称：万夜图片
脚本作者：YueJS
更新时间：2024-03-21
脚本功能：随机图片展示
环境要求：Loon iOS 17
使用说明：修改 API_INDEX 的值（1-10）即可切换不同API
*/

// 当前使用的API序号（1-10）
const API_INDEX = 1;

// API地址列表
const API_LIST = {
    1: 'http://3650000.xyz/api/360.php?cid=6',  // API_1
    2: '',  // API_2
    3: '',  // API_3
    4: '',  // API_4
    5: '',  // API_5
    6: '',  // API_6
    7: '',  // API_7
    8: '',  // API_8
    9: '',  // API_9
    10: '' // API_10
};

// 配置
const CONFIG = {
    RANDOM_MODE: false,      // 是否随机切换API，false则使用API_INDEX指定的API
    TIMEOUT: 5000,           // 超时时间（毫秒）
    RETRY_TIMES: 2,          // 重试次数
    DEBUG: false             // 调试模式
};

// 通知配置
const NOTIFY_CONFIG = {
    SUCCESS_ICON: 'photo.circle',
    ERROR_ICON: 'xmark.circle',
    SUCCESS_COLOR: '#8B81C3',
    ERROR_COLOR: '#FF0000'
};

// 获取API地址
function getAPI() {
    if (CONFIG.RANDOM_MODE) {
        // 随机模式：从所有非空API中随机选择
        const availableAPIs = Object.entries(API_LIST).filter(([_, url]) => url !== '');
        if (availableAPIs.length === 0) return API_LIST[1];
        const randomIndex = Math.floor(Math.random() * availableAPIs.length);
        return availableAPIs[randomIndex][1];
    } else {
        // 指定模式：使用API_INDEX指定的API
        return API_LIST[API_INDEX] || API_LIST[1];
    }
}

// 日志函数
function log(message) {
    if (CONFIG.DEBUG) {
        console.log(`[万夜图片] ${message}`);
    }
}

// 通知函数
function notify(title, subtitle, content, option = {}) {
    $notification.post(title, subtitle, content, option);
}

// 主函数
!(async () => {
    try {
        const url = getAPI();
        log(`正在使用API ${API_INDEX}: ${url}`);

        const response = await $httpClient.get({
            url: url,
            headers: {
                'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
            },
            timeout: CONFIG.TIMEOUT
        });

        if (response.status === 200) {
            let resp = {
                title: "万夜图片",
                subtitle: `API-${API_INDEX} 获取成功`,
                icon: NOTIFY_CONFIG.SUCCESS_ICON,
                "icon-color": NOTIFY_CONFIG.SUCCESS_COLOR,
                content: "点击查看图片",
                image: url
            };
            $done(resp);
        } else {
            throw new Error('请求失败');
        }
    } catch (error) {
        log(`错误: ${error.message}`);
        let resp = {
            title: "万夜图片",
            subtitle: `API-${API_INDEX} 获取失败`,
            icon: NOTIFY_CONFIG.ERROR_ICON,
            "icon-color": NOTIFY_CONFIG.ERROR_COLOR,
            content: `错误信息: ${error.message}`
        };
        $done(resp);
    }
})();

// 模块导出（为后续扩展预留）
module.exports = {
    CONFIG,
    API_LIST,
    getAPI
}; 
