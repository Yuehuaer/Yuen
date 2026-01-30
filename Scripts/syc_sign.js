/*
顺易充自动签到 For Loon
作者：基于 Python 版转换
功能：自动签到、积分统计
更新时间：2026-01-30

[Script]
cron "0 8 * * *" script-path=syc_sign.js, tag=顺易充签到
http-request ^https:\/\/app\.wodeev\.com\/bil-front\/.* script-path=syc_sign.js, tag=顺易充获取Cookie

[MitM]
hostname = app.wodeev.com
*/

const $ = new Env("顺易充");

// 配置键值
const KEY_TOKEN = "syc_token";
const KEY_COOKIE = "syc_cookie";

// 基础配置
const BASE_URL = "https://app.wodeev.com";
const DEFAULT_HEADERS = {
    "Accept": "application/json, text/plain, */*",
    "Sec-Fetch-Site": "same-origin",
    "loginChannel": "15",
    "client-version": "5.5.2",
    "Accept-Language": "zh-CN,zh-Hans;q=0.9",
    "Accept-Encoding": "gzip, deflate, br", // 修改为常见的浏览器接受格式
    "Sec-Fetch-Mode": "cors",
    "Content-Type": "application/json;charset=utf-8",
    "Origin": "https://app.wodeev.com",
    "Referer": "https://app.wodeev.com/h5/pointsMall/",
    "lang": "1",
    "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_3_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148"
};

// 脚本入口
(async () => {
    if (typeof $request !== "undefined") {
        await getCookie();
    } else {
        await signIn();
    }
    $.done();
})();

// 获取Cookie
async function getCookie() {
    if ($request.headers) {
        // 兼容不同的头部大小写
        const headers = $request.headers;
        const auth = headers["Authorization"] || headers["authorization"];
        const cookie = headers["Cookie"] || headers["cookie"];

        if (auth && cookie) {
            // 写入数据
            const tokenSaved = $.setdata(auth, KEY_TOKEN);
            const cookieSaved = $.setdata(cookie, KEY_COOKIE);
            
            if (tokenSaved && cookieSaved) {
                // 为了防止频繁弹窗，只有当token变化时才通知，或者你可以选择总是通知
                $.msg($.name, "🎉 获取Cookie成功", "凭证已保存，请禁用获取Cookie脚本以避免不必要的通知。");
                console.log("Cookie 和 Authorization 获取成功");
            }
        }
    }
}

// 执行签到流程
async function signIn() {
    const token = $.getdata(KEY_TOKEN);
    const cookie = $.getdata(KEY_COOKIE);

    if (!token || !cookie) {
        $.msg($.name, "❌ 签到失败", "未找到Token或Cookie，请先开启脚本并打开APP获取。");
        return;
    }

    // 组装Headers
    const headers = {
        ...DEFAULT_HEADERS,
        "Authorization": token, // 抓取到的完整Bearer Token
        "Cookie": cookie
    };

    try {
        // 1. 获取任务状态
        const taskInfo = await getTaskStatus(headers);
        if (!taskInfo || taskInfo.ret !== 200) {
            console.log(`获取任务失败: ${JSON.stringify(taskInfo)}`);
            $.msg($.name, "❌ 获取任务失败", taskInfo ? taskInfo.msg : "网络请求错误");
            return;
        }

        // 2. 查找签到任务 (actType 1201)
        const signTask = taskInfo.taskList.find(t => t.actType === "1201");
        
        if (!signTask) {
            console.log("未找到签到任务");
            $.msg($.name, "⚠️ 异常", "未找到签到任务，活动可能已结束");
            return;
        }

        console.log(`当前任务状态: ${signTask.rewardStatus} (02代表已完成)`);

        // 3. 判断是否已签到
        if (signTask.rewardStatus === "02") {
            $.msg($.name, "⚠️ 今日已签到", `获得积分: ${signTask.rewardValue}`);
            return;
        }

        // 4. 执行签到
        const signResult = await doSignRequest(headers);
        
        if (signResult && signResult.ret === 200) {
            $.msg($.name, "✅ 签到成功", `获得积分: ${signTask.rewardValue}`);
        } else {
            $.msg($.name, "❌ 签到失败", signResult ? signResult.msg : "接口请求未知错误");
        }

    } catch (e) {
        console.log(`脚本执行异常: ${e}`);
        $.msg($.name, "❌ 运行异常", e.message);
    }
}

// API: 获取任务列表
function getTaskStatus(headers) {
    return new Promise((resolve) => {
        const url = `${BASE_URL}/bil-front/v2.0/activity/getWelfareTask?taskNo=20221231`;
        const options = {
            url: url,
            headers: headers
        };
        
        $.get(options, (err, resp, data) => {
            try {
                if (err) {
                    console.log(`API请求失败: ${err}`);
                    resolve(null);
                } else {
                    resolve(JSON.parse(data));
                }
            } catch (e) {
                console.log(`JSON解析失败: ${e}`);
                resolve(null);
            }
        });
    });
}

// API: 执行签到动作
function doSignRequest(headers) {
    return new Promise((resolve) => {
        const url = `${BASE_URL}/bil-front/v2.0/activity/getWelfare`;
        const body = JSON.stringify({
            "type": "1201",
            "taskNo": "20221231"
        });
        
        const options = {
            url: url,
            headers: headers,
            body: body
        };

        $.post(options, (err, resp, data) => {
            try {
                if (err) {
                    console.log(`签到请求失败: ${err}`);
                    resolve(null);
                } else {
                    resolve(JSON.parse(data));
                }
            } catch (e) {
                console.log(`签到结果解析失败: ${e}`);
                resolve(null);
            }
        });
    });
}

// 环境兼容工具函数 (兼容 Loon, Surge, QX, Node)
function Env(name) {
    const isLoon = typeof $loon !== "undefined";
    const isSurge = typeof $httpClient !== "undefined" && !isLoon;
    const isQX = typeof $task !== "undefined";

    const msg = (title, subtitle, body) => {
        if (isLoon) $notification.post(title, subtitle, body);
        if (isSurge) $notification.post(title, subtitle, body);
        if (isQX) $notify(title, subtitle, body);
        console.log(`${title}\n${subtitle}\n${body}`);
    };

    const getdata = (key) => {
        if (isLoon || isSurge) return $persistentStore.read(key);
        if (isQX) return $prefs.valueForKey(key);
        return null;
    };

    const setdata = (val, key) => {
        if (isLoon || isSurge) return $persistentStore.write(val, key);
        if (isQX) return $prefs.setValueForKey(val, key);
        return null;
    };

    const get = (options, callback) => {
        if (isLoon || isSurge) {
            $httpClient.get(options, callback);
        } else if (isQX) {
            options.method = "GET";
            $task.fetch(options).then(
                resp => callback(null, {}, resp.body),
                err => callback(err.error, null, null)
            );
        }
    };

    const post = (options, callback) => {
        if (isLoon || isSurge) {
            $httpClient.post(options, callback);
        } else if (isQX) {
            options.method = "POST";
            $task.fetch(options).then(
                resp => callback(null, {}, resp.body),
                err => callback(err.error, null, null)
            );
        }
    };

    const done = (value = {}) => {
        if (isLoon || isSurge) $done(value);
        if (isQX) $done(value);
    };

    return { name, msg, getdata, setdata, get, post, done };
}
