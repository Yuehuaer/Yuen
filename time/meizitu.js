// 名称：妹子图
// 作者：https://t.me/ios151
// 描述：每日美女图片推送
// 修改日期：2024-06-20

const NAME = 'meizitu';
const $ = new Env(NAME);
const BASE_API = 'https://api.qqsuu.cn/api/dm/meinv';

/******************** 配置部分 ********************/
const DEFAULT_CONFIG = {
  MODE: '0',     // 默认模式：0=随机
  TIMEOUT: 10,   // 请求超时(秒)
  RETRIES: 2     // 失败重试次数
};

/******************** 参数处理 ********************/
let arg = typeof $argument !== 'undefined' 
  ? Object.fromEntries($argument.split('&').map(item => item.split('='))) 
  : {};

// 合并持久化配置
try {
  const savedConfig = $.getjson(NAME, {});
  arg = Object.assign({}, DEFAULT_CONFIG, savedConfig, arg);
} catch (e) {
  $.logErr('配置加载失败:', e);
}

/******************** 模式定义 ********************/
const MODES = {
  '0': '🌸 随机',
  '1': '🍃 清纯',
  '2': '🔥 性感',
  '3': '🎎 古风',
  '4': '📷 Cosplay'
};

/******************** 主程序 ********************/
!(async () => {
  let result = {};
  try {
    // 参数验证
    const modeKeys = ($.lodash_get(arg, 'MODE') || DEFAULT_CONFIG.MODE)
      .toString()
      .split(/,|，/g)
      .map(k => k.trim())
      .filter(k => MODES.hasOwnProperty(k));
    
    if (modeKeys.length === 0) {
      throw new Error('⚠️ 无效模式参数，使用默认随机模式');
    }

    // 构建请求参数
    const params = {
      type: 'json',
      classify: modeKeys.join(',')
    };

    // 发送请求
    const res = await http({
      url: BASE_API,
      params,
      timeout: parseFloat(arg.TIMEOUT) || 10,
      retries: parseFloat(arg.RETRIES) || 2
    });

    // 处理响应
    const data = JSON.parse(res.body || res.rawBody);
    const imageUrl = data?.data?.url;
    
    if (!imageUrl) {
      throw new Error('❌ 图片地址获取失败');
    }

    // 发送通知
    await sendNotification(
      '📸 妹子图推送',
      `📌 模式: ${modeKeys.map(m => MODES[m]).join(' + ')}`,
      imageUrl
    );

    // 保存结果
    result = { 
      status: 'success',
      imageUrl,
      mode: modeKeys
    };

  } catch (e) {
    await sendNotification('❌ 妹子图错误', '', e.message);
    $.logErr(e);
    result = { 
      status: 'failed',
      error: e.message 
    };
  } finally {
    $.done(result);
  }
})();

/******************** HTTP 模块 ********************/
async function http(opt) {
  const config = {
    timeout: (opt.timeout || 10) * 1000,
    retries: opt.retries || 2,
    retryDelay: 1.5
  };

  let attempt = 0;
  const makeRequest = async () => {
    attempt++;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), config.timeout);
      
      const response = await $.http.get({
        url: `${opt.url}?${new URLSearchParams(opt.params)}`,
        headers: {
          'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1',
          'Referer': 'https://qqsuu.cn/'
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (response.status !== 200) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      return response;
      
    } catch (error) {
      if (attempt <= config.retries) {
        await $.wait(config.retryDelay * 1000);
        return makeRequest();
      }
      throw error;
    }
  };

  return makeRequest();
}

/******************** 通知模块 ********************/
async function sendNotification(title, subtitle, content) {
  try {
    const platform = $.isLoon() ? 'Loon' : $.isSurge() ? 'Surge' : 'QX';
    
    const payload = {
      title: title.slice(0, 50),
      subtitle: subtitle.slice(0, 100),
      body: String(content).slice(0, 500),
      'media-url': content
    };

    if ($.isLoon()) {
      // Loon专属参数
      payload['icon'] = 'https://static.qqsuu.cn/2023/05/1684470341-6432a22584d9b.png';
      payload['sound'] = 'minuet.caf';
    }

    $notification.post(payload);
    
  } catch (e) {
    $.logErr('通知发送失败:', e);
  }
}

/******************** Env 环境适配类 ********************/
function Env(t, e) {
  class s {
    constructor(t) {
      this.env = t
    }
    send(t, e = "GET") {
      t = "string" == typeof t ? { url: t } : t;
      let s = this.get;
      return "POST" === e && (s = this.post),
        new Promise((e, a) => {
          s.call(this, t, (t, s, r) => {
            t ? a(t) : e(s)
          })
        })
    }
    get(t) {
      return this.send.call(this.env, t)
    }
    post(t) {
      return this.send.call(this.env, t, "POST")
    }
  }
  return new class {
    constructor(t, e) {
      this.name = t,
        this.http = new s(this),
        this.data = null,
        this.dataFile = "box.dat",
        this.logs = [],
        this.isMute = !1,
        this.isNeedRewrite = !1,
        this.logSeparator = "\n",
        this.encoding = "utf-8",
        this.startTime = (new Date).getTime(),
        Object.assign(this, e),
        this.log("", `🔔 ${this.name}, 开始!`)
    }
    getEnv() {
      return "undefined" != typeof $environment && $environment["surge-version"] ? "Surge" : "undefined" != typeof $environment && $environment["stash-version"] ? "Stash" : "undefined" != typeof module && module.exports ? "Node.js" : "undefined" != typeof $task ? "Quantumult X" : "undefined" != typeof $loon ? "Loon" : "undefined" != typeof $rocket ? "Shadowrocket" : void 0
    }
    isNode() {
      return "Node.js" === this.getEnv()
    }
    isQuanX() {
      return "Quantumult X" === this.getEnv()
    }
    isSurge() {
      return "Surge" === this.getEnv()
    }
    isLoon() {
      return "Loon" === this.getEnv()
    }
    isShadowrocket() {
      return "Shadowrocket" === this.getEnv()
    }
    isStash() {
      return "Stash" === this.getEnv()
    }
    toObj(t, e = null) {
      try {
        return JSON.parse(t)
      } catch {
        return e
      }
    }
    toStr(t, e = null) {
      try {
        return JSON.stringify(t)
      } catch {
        return e
      }
    }
    getjson(t, e) {
      let s = e;
      const a = this.getdata(t);
      if (a) try {
        s = JSON.parse(this.getdata(t))
      } catch { }
      return s
    }
    setjson(t, e) {
      try {
        return this.setdata(JSON.stringify(t), e)
      } catch {
        return !1
      }
    }
    getScript(t) {
      return new Promise(e => {
        this.get({ url: t }, (t, s, a) => e(a))
      })
    }
    runScript(t, e) {
      return new Promise(s => {
        let a = this.getdata("@chavy_boxjs_userCfgs.httpapi");
        a = a ? a.replace(/\n/g, "").trim() : a;
        let r = this.getdata("@chavy_boxjs_userCfgs.httpapi_timeout");
        r = r ? 1 * r : 20,
          r = e && e.timeout ? e.timeout : r;
        const [i, o] = a.split("@"),
          n = {
            url: `http://${o}/v1/scripting/evaluate`,
            body: { script_text: t, mock_type: "cron", timeout: r },
            headers: { "X-Key": i, Accept: "*/*" },
            timeout: r
          };
        this.post(n, (t, e, a) => s(a))
      }).catch(t => this.logErr(t))
    }
    loaddata() {
      if (!this.isNode()) return {}; {
        this.fs = this.fs ? this.fs : require("fs"),
          this.path = this.path ? this.path : require("path");
        const t = this.path.resolve(this.dataFile),
          e = this.path.resolve(process.cwd(), this.dataFile),
          s = this.fs.existsSync(t),
          a = !s && this.fs.existsSync(e);
        if (!s && !a) return {}; {
          const a = s ? t : e;
          try {
            return JSON.parse(this.fs.readFileSync(a))
          } catch (t) {
            return {}
          }
        }
      }
    }
    writedata() {
      if (this.isNode()) {
        this.fs = this.fs ? this.fs : require("fs"),
          this.path = this.path ? this.path : require("path");
        const t = this.path.resolve(this.dataFile),
          e = this.path.resolve(process.cwd(), this.dataFile),
          s = this.fs.existsSync(t),
          a = !s && this.fs.existsSync(e),
          r = JSON.stringify(this.data);
        s ? this.fs.writeFileSync(t, r) : a ? this.fs.writeFileSync(e, r) : this.fs.writeFileSync(t, r)
      }
    }
    lodash_get(t, e, s) {
      const a = e.replace(/\[(\d+)\]/g, ".$1").split(".");
      let r = t;
      for (const t of a)
        if (r = Object(r)[t], void 0 === r) return s;
      return r
    }
    lodash_set(t, e, s) {
      return Object(t) !== t ? t : (Array.isArray(e) || (e = e.toString().match(/[^.[\]]+/g) || []),
        e.slice(0, -1).reduce((t, s, a) => Object(t[s]) === t[s] ? t[s] : t[s] = Math.abs(e[a + 1]) >> 0 == +e[a + 1] ? [] : {}, t)[e[e.length - 1]] = s,
        t)
    }
    getdata(t) {
      let e = this.getval(t);
      if (/^@/.test(t)) {
        const [, s, a] = /^@(.*?)\.(.*?)$/.exec(t),
          r = s ? this.getval(s) : "";
        if (r) try {
          const t = JSON.parse(r);
          e = t ? this.lodash_get(t, a, "") : e
        } catch (t) {
          e = ""
        }
      }
      return e
    }
    setdata(t, e) {
      let s = !1;
      if (/^@/.test(e)) {
        const [, a, r] = /^@(.*?)\.(.*?)$/.exec(e),
          i = this.getval(a),
          o = a ? "null" === i ? null : i || "{}" : "{}";
        try {
          const e = JSON.parse(o);
          this.lodash_set(e, r, t),
            s = this.setval(JSON.stringify(e), a)
        } catch (e) {
          const i = {};
          this.lodash_set(i, r, t),
            s = this.setval(JSON.stringify(i), a)
        }
      } else s = this.setval(t, e);
      return s
    }
    getval(t) {
      switch (this.getEnv()) {
        case "Surge":
        case "Loon":
        case "Stash":
        case "Shadowrocket":
          return $persistentStore.read(t);
        case "Quantumult X":
          return $prefs.valueForKey(t);
        case "Node.js":
          return this.data = this.loaddata(),
            this.data[t];
        default:
          return this.data && this.data[t] || null
      }
    }
    setval(t, e) {
      switch (this.getEnv()) {
        case "Surge":
        case "Loon":
        case "Stash":
        case "Shadowrocket":
          return $persistentStore.write(t, e);
        case "Quantumult X":
          return $prefs.setValueForKey(t, e);
        case "Node.js":
          return this.data = this.loaddata(),
            this.data[e] = t,
            this.writedata(),
            !0;
        default:
          return this.data && this.data[e] || null
      }
    }
    initGotEnv(t) {
      this.got = this.got ? this.got : require("got"),
        this.cktough = this.cktough ? this.cktough : require("tough-cookie"),
        this.ckjar = this.ckjar ? this.ckjar : new this.cktough.CookieJar,
        t && (t.headers = t.headers ? t.headers : {},
          void 0 === t.headers.Cookie && void 0 === t.cookieJar && (t.cookieJar = this.ckjar))
    }
    get(t, e = (() => { })) {
      switch (t.headers && (delete t.headers["Content-Type"],
        delete t.headers["Content-Length"],
        delete t.headers["content-type"],
        delete t.headers["content-length"]),
      t.params && (t.url += "?" + this.queryStr(t.params)),
      this.getEnv()) {
        case "Surge":
        case "Loon":
        case "Stash":
        case "Shadowrocket":
        default:
          this.isSurge() && this.isNeedRewrite && (t.headers = t.headers || {},
            Object.assign(t.headers, { "X-Surge-Skip-Scripting": !1 })),
            $httpClient.get(t, (t, s, a) => {
              !t && s && (s.body = a,
                s.statusCode = s.status ? s.status : s.statusCode,
                s.status = s.statusCode),
                e(t, s, a)
            });
          break;
        case "Quantumult X":
          this.isNeedRewrite && (t.opts = t.opts || {},
            Object.assign(t.opts, { hints: !1 })),
            $task.fetch(t).then(t => {
              const { statusCode: s, statusCode: a, headers: r, body: i, bodyBytes: o } = t;
              e(null, { status: s, statusCode: a, headers: r, body: i, bodyBytes: o }, i, o)
            }, t => e(t && t.error || "UndefinedError"));
          break;
        case "Node.js":
          let s = require("iconv-lite");
          this.initGotEnv(t),
            this.got(t).on("redirect", (t, e) => {
              try {
                if (t.headers["set-cookie"]) {
                  const s = t.headers["set-cookie"].map(this.cktough.Cookie.parse).toString();
                  s && this.ckjar.setCookieSync(s, null),
                    e.cookieJar = this.ckjar
                }
              } catch (t) {
                this.logErr(t)
              }
            }).then(t => {
              const { statusCode: a, statusCode: r, headers: i, rawBody: o } = t,
                n = s.decode(o, this.encoding);
              e(null, { status: a, statusCode: r, headers: i, rawBody: o, body: n }, n)
            }, t => {
              const { message: a, response: r } = t;
              e(a, r, r && s.decode(r.rawBody, this.encoding))
            })
      }
    }
    post(t, e = (() => { })) {
      const s = t.method ? t.method.toLocaleLowerCase() : "post";
      switch (t.body && t.headers && !t.headers["Content-Type"] && !t.headers["content-type"] && (t.headers["content-type"] = "application/x-www-form-urlencoded"),
      t.headers && (delete t.headers["Content-Length"],
        delete t.headers["content-length"]),
      this.getEnv()) {
        case "Surge":
        case "Loon":
        case "Stash":
        case "Shadowrocket":
        default:
          this.isSurge() && this.isNeedRewrite && (t.headers = t.headers || {},
            Object.assign(t.headers, { "X-Surge-Skip-Scripting": !1 })),
            $httpClient[s](t, (t, s, a) => {
              !t && s && (s.body = a,
                s.statusCode = s.status ? s.status : s.statusCode,
                s.status = s.statusCode),
                e(t, s, a)
            });
          break;
        case "Quantumult X":
          t.method = s,
            this.isNeedRewrite && (t.opts =
