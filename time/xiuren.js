/**
 * @name 全站随机美图
 * @version 21.0
 * @desc 1.日志格式完全定制 2.多页随机+内页跳转 3.通知文案极简 4.点击跳转原网
 */

const $ = new Env("随机美图");

// --- 1. 配置区 ---
const TIMEOUT = 15000;
const HOST = "http://a1.876512.xyz";
const BASE_URL = "http://a1.876512.xyz/Xiuren"; 

// --- 2. 主入口 ---
!(async () => {
    await main();
})().catch((e) => {
    $.logErr(e);
}).finally(() => {
    $.done();
});

// --- 3. 核心抓取逻辑 ---
async function main() {
    $.log("🚀 V21 开始...");
    
    // Step A: 随机列表页
    // 50% 几率看最新(第1页)，50% 几率看回顾(2-5页)
    let listPage = Math.random() < 0.3 ? 1 : Math.floor(Math.random() * 24) + 2;
    let listUrl = listPage === 1 ? `${BASE_URL}/` : `${BASE_URL}/page_${listPage}.html`;
    
    // 📌 日志：随机抓取网页
    $.log(`🎲 随机抓取网页: 第 ${listPage} 页`);

    try {
        // Step B: 获取图集列表
        let listBody = await httpGet(listUrl).catch(() => httpGet(`${BASE_URL}/`));

        // Step C: 提取图集链接
        const allLinksRegex = /href=["'](.*?)["']/gi;
        let match;
        let foundLinks = [];
        while ((match = allLinksRegex.exec(listBody)) !== null) foundLinks.push(match[1]);

        let validLinks = foundLinks.filter(link => 
            link.includes(".html") && !link.includes("index") && !link.includes("page") && /\d/.test(link)
        );

        if (validLinks.length === 0) throw "未找到图集链接";
        
        let albumLink = validLinks[Math.floor(Math.random() * validLinks.length)];
        // 补全链接
        if (!albumLink.startsWith("http")) {
            albumLink = albumLink.startsWith("/") ? `${HOST}${albumLink}` : `${HOST}/Xiuren/${albumLink}`;
        }
        
        // 获取基础名称
        let baseNameMatch = albumLink.match(/\/([a-zA-Z0-9]+)\.html/);
        let baseName = baseNameMatch ? baseNameMatch[1] : "未知ID";

        // 📌 日志：选中图集 ID
        $.log(`🔗 选中图集: ${baseName}`);
        // 📌 日志：当前图集完整链接
        $.log(`🔗 当前图集链接: ${albumLink}`);

        // Step D: 进入图集首页 (提取标题)
        const albumIndexBody = await httpGet(albumLink);

        // 清洗标题
        let rawTitle = "美图欣赏";
        let titleMatch = albumIndexBody.match(/<title>(.*?)<\/title>/i);
        
        if (titleMatch && titleMatch[1]) {
            rawTitle = titleMatch[1];
            if (rawTitle.includes(" - ")) rawTitle = rawTitle.split(" - ")[0];
            rawTitle = rawTitle.replace(/^\[.*?\]/, "") 
                               .replace(/No\.\d+/, "")
                               .replace(/_/g, " ")
                               .replace(/^\s*模特/, "")
                               .replace(/写真\d+P.*$/, "")
                               .trim();
        }
        // 📌 日志：图集名称
        $.log(`📖 图集名称: ${rawTitle}`);

        // Step E: 内页随机跳跃
        let targetPageUrl = albumLink; 
        let subPage = 0; // 0代表第1页

        if (baseName) {
            const pageRegex = new RegExp(baseName + "_(\\d+)\\.html", "g");
            let pMatch;
            let maxPage = 0;
            while ((pMatch = pageRegex.exec(albumIndexBody)) !== null) {
                let num = parseInt(pMatch[1]);
                if (num > maxPage) maxPage = num;
            }

            if (maxPage > 0) {
                let randomIdx = Math.floor(Math.random() * (maxPage + 1));
                if (randomIdx > 0) {
                    targetPageUrl = albumLink.replace(".html", `_${randomIdx}.html`);
                    subPage = randomIdx;
                }
            }
        }
        
        // 📌 日志：跳跃位置
        $.log(`🔀 跳跃图集内至: 第 ${subPage + 1} 页`);

        // Step F: 获取最终页面图片
        let finalBody = (subPage === 0) ? albumIndexBody : await httpGet(targetPageUrl);
        
        // 提取页面中所有正文图片
        let allImgs = [];
        let imgRegex = /src=["']([^"']+\/uploadfile\/[^"']+\.jpg)["']/gi;
        let imgM;
        while ((imgM = imgRegex.exec(finalBody)) !== null) {
            allImgs.push(imgM[1]);
        }
        
        // 如果没找到 uploadfile 的大图，找任意 jpg
        if (allImgs.length === 0) {
             let backupRegex = /src=["']([^"']+\.(?:jpg|png))["']/gi;
             while ((imgM = backupRegex.exec(finalBody)) !== null) allImgs.push(imgM[1]);
        }

        if (allImgs.length === 0) throw "未找到图片";

        // 既然页面可能有多个图，我们取第一个(通常就是大图)
        let imgLink = allImgs[0];
        if (!imgLink.startsWith("http")) {
            imgLink = imgLink.startsWith("/") ? `${HOST}${imgLink}` : `${HOST}${imgLink}`;
        }

        // 📌 日志：展示图片序号 (通常内页只有一张大图，所以是第1个)
        $.log(`🖼️ 展示图片: 第 1 张`);
        // 📌 日志：图片链接
        $.log(`🔗 展示图片链接: ${imgLink}`);

        // Step G: 发送通知 (极简)
        // 标题: 轻松一夏
        // 内容: 清洗后的标题
        // 动作: 跳转到 targetPageUrl (原网页)
        $.msg("轻松一夏", rawTitle, "", {
            "open-url": targetPageUrl,
            "media-url": imgLink 
        });

    } catch (e) {
        $.log(`❌ 错误: ${e}`);
        $.msg("轻松一夏", "获取失败", "");
    }
}

function httpGet(url) {
    return new Promise((resolve, reject) => {
        $.get({
            url: url,
            timeout: TIMEOUT,
            headers: { "Referer": HOST, "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)" }
        }, (error, response, body) => {
            if (error) reject(error);
            else resolve(body);
        });
    });
}

// ============================================
// 👇 Env.js 通用库 👇
// ============================================
function Env(t,e){class s{constructor(t){this.env=t}send(t,e="GET"){t="string"==typeof t?{url:t}:t;let s=this.get;return"POST"===e&&(s=this.post),new Promise((e,a)=>{s.call(this,t,(t,s,r)=>{t?a(t):e(s)})})}get(t){return this.send.call(this.env,t)}post(t){return this.send.call(this.env,t,"POST")}}return new class{constructor(t,e){this.name=t,this.http=new s(this),this.data=null,this.dataFile="box.dat",this.logs=[],this.isMute=!1,this.isNeedRewrite=!1,this.logSeparator="\n",this.encoding="utf-8",this.startTime=(new Date).getTime(),Object.assign(this,e),this.log("",`🔔${this.name}, 开始!`)}getEnv(){return"undefined"!=typeof $environment&&$environment["surge-version"]?"Surge":"undefined"!=typeof $environment&&$environment["stash-version"]?"Stash":"undefined"!=typeof module&&module.exports?"Node.js":"undefined"!=typeof $task?"Quantumult X":"undefined"!=typeof $loon?"Loon":"undefined"!=typeof $rocket?"Shadowrocket":void 0}isNode(){return"Node.js"===this.getEnv()}isQuanX(){return"Quantumult X"===this.getEnv()}isSurge(){return"Surge"===this.getEnv()}isLoon(){return"Loon"===this.getEnv()}isShadowrocket(){return"Shadowrocket"===this.getEnv()}isStash(){return"Stash"===this.getEnv()}toObj(t,e=null){try{return JSON.parse(t)}catch{return e}}toStr(t,e=null){try{return JSON.stringify(t)}catch{return e}}getjson(t,e){let s=e;const a=this.getdata(t);if(a)try{s=JSON.parse(this.getdata(t))}catch{}return s}setjson(t,e){try{return this.setdata(JSON.stringify(t),e)}catch{return!1}}getScript(t){return new Promise(e=>{this.get({url:t},(t,s,a)=>e(a))})}runScript(t,e){return new Promise(s=>{let a=this.getdata("@chavy_boxjs_userCfgs.httpapi");a=a?a.replace(/\n/g,"").trim():a;let r=this.getdata("@chavy_boxjs_userCfgs.httpapi_timeout");r=r?1*r:20,r=e&&e.timeout?e.timeout:r;const[i,o]=a.split("@"),n={url:`http://${o}/v1/scripting/evaluate`,body:{script_text:t,mock_type:"cron",timeout:r},headers:{"X-Key":i,Accept:"*/*"},timeout:r};this.post(n,(t,e,a)=>s(a))}).catch(t=>this.logErr(t))}loaddata(){if(!this.isNode())return{};{this.fs=this.fs?this.fs:require("fs"),this.path=this.path?this.path:require("path");const t=this.path.resolve(this.dataFile),e=this.path.resolve(process.cwd(),this.dataFile),s=this.fs.existsSync(t),a=!s&&this.fs.existsSync(e);if(!s&&!a)return{};{const a=s?t:e;try{return JSON.parse(this.fs.readFileSync(a))}catch(t){return{}}}}}writedata(){if(this.isNode()){this.fs=this.fs?this.fs:require("fs"),this.path=this.path?this.path:require("path");const t=this.path.resolve(this.dataFile),e=this.path.resolve(process.cwd(),this.dataFile),s=this.fs.existsSync(t),a=!s&&this.fs.existsSync(e),r=JSON.stringify(this.data);s?this.fs.writeFileSync(t,r):a?this.fs.writeFileSync(e,r):this.fs.writeFileSync(t,r)}}lodash_get(t,e,s){const a=e.replace(/\[(\d+)\]/g,".$1").split(".");let r=t;for(const t of a)if(r=Object(r)[t],void 0===r)return s;return r}lodash_set(t,e,s){return Object(t)!==t?t:(Array.isArray(e)||(e=e.toString().match(/[^.[\]]+/g)||[]),e.slice(0,-1).reduce((t,s,a)=>Object(t[s])===t[s]?t[s]:t[s]=Math.abs(e[a+1])>>0==+e[a+1]?[]:{},t)[e[e.length-1]]=s,t)}getdata(t){let e=this.getval(t);if(/^@/.test(t)){const[,s,a]=/^@(.*?)\.(.*?)$/.exec(t),r=s?this.getval(s):"";if(r)try{const t=JSON.parse(r);e=t?this.lodash_get(t,a,""):e}catch(t){e=""}}return e}setdata(t,e){let s=!1;if(/^@/.test(e)){const[,a,r]=/^@(.*?)\.(.*?)$/.exec(e),i=this.getval(a),o=a?"null"===i?null:i||"{}":"{}";try{const e=JSON.parse(o);this.lodash_set(e,r,t),s=this.setval(JSON.stringify(e),a)}catch(e){const i={};this.lodash_set(i,r,t),s=this.setval(JSON.stringify(i),a)}}else s=this.setval(t,e);return s}getval(t){switch(this.getEnv()){case"Surge":case"Loon":case"Stash":case"Shadowrocket":return $persistentStore.read(t);case"Quantumult X":return $prefs.valueForKey(t);case"Node.js":return this.data=this.loaddata(),this.data[t];default:return this.data&&this.data[t]||null}}setval(t,e){switch(this.getEnv()){case"Surge":case"Loon":case"Stash":case"Shadowrocket":return $persistentStore.write(t,e);case"Quantumult X":return $prefs.setValueForKey(t,e);case"Node.js":return this.data=this.loaddata(),this.data[e]=t,this.writedata(),!0;default:return this.data&&this.data[e]||null}}initGotEnv(t){this.got=this.got?this.got:require("got"),this.cktough=this.cktough?this.cktough:require("tough-cookie"),this.ckjar=this.ckjar?this.ckjar:new this.cktough.CookieJar,t&&(t.headers=t.headers?t.headers:{},void 0===t.headers.Cookie&&void 0===t.cookieJar&&(t.cookieJar=this.ckjar))}get(t,e=(()=>{})){switch(t.headers&&(delete t.headers["Content-Type"],delete t.headers["Content-Length"],delete t.headers["content-type"],delete t.headers["content-length"]),t.params&&(t.url+="?"+this.queryStr(t.params)),this.getEnv()){case"Surge":case"Loon":case"Stash":case"Shadowrocket":default:this.isSurge()&&this.isNeedRewrite&&(t.headers=t.headers||{},Object.assign(t.headers,{"X-Surge-Skip-Scripting":!1})),$httpClient.get(t,(t,s,a)=>{!t&&s&&(s.body=a,s.statusCode=s.status?s.status:s.statusCode,s.status=s.statusCode),e(t,s,a)});break;case"Quantumult X":this.isNeedRewrite&&(t.opts=t.opts||{},Object.assign(t.opts,{hints:!1})),$task.fetch(t).then(t=>{const{statusCode:s,statusCode:a,headers:r,body:i,bodyBytes:o}=t;e(null,{status:s,statusCode:a,headers:r,body:i,bodyBytes:o},i,o)},t=>e(t&&t.error||"UndefinedError"));break;case"Node.js":let s=require("iconv-lite");this.initGotEnv(t),this.got(t).on("redirect",(t,e)=>{try{if(t.headers["set-cookie"]){const s=t.headers["set-cookie"].map(this.cktough.Cookie.parse).toString();s&&this.ckjar.setCookieSync(s,null),e.cookieJar=this.ckjar}}catch(t){this.logErr(t)}}).then(t=>{const{statusCode:a,statusCode:r,headers:i,rawBody:o}=t,n=s.decode(o,this.encoding);e(null,{status:a,statusCode:r,headers:i,rawBody:o,body:n},n)},t=>{const{message:a,response:r}=t;e(a,r,r&&s.decode(r.rawBody,this.encoding))})}}post(t,e=(()=>{})){const s=t.method?t.method.toLocaleLowerCase():"post";switch(t.body&&t.headers&&!t.headers["Content-Type"]&&!t.headers["content-type"]&&(t.headers["content-type"]="application/x-www-form-urlencoded"),t.headers&&(delete t.headers["Content-Length"],delete t.headers["content-length"]),this.getEnv()){case"Surge":case"Loon":case"Stash":case"Shadowrocket":default:this.isSurge()&&this.isNeedRewrite&&(t.headers=t.headers||{},Object.assign(t.headers,{"X-Surge-Skip-Scripting":!1})),$httpClient[s](t,(t,s,a)=>{!t&&s&&(s.body=a,s.statusCode=s.status?s.status:s.statusCode,s.status=s.statusCode),e(t,s,a)});break;case"Quantumult X":t.method=s,this.isNeedRewrite&&(t.opts=t.opts||{},Object.assign(t.opts,{hints:!1})),$task.fetch(t).then(t=>{const{statusCode:s,statusCode:a,headers:r,body:i,bodyBytes:o}=t;e(null,{status:s,statusCode:a,headers:r,body:i,bodyBytes:o},i,o)},t=>e(t&&t.error||"UndefinedError"));break;case"Node.js":let a=require("iconv-lite");this.initGotEnv(t);const{url:r,...i}=t;this.got[s](r,i).then(t=>{const{statusCode:s,statusCode:r,headers:i,rawBody:o}=t,n=a.decode(o,this.encoding);e(null,{status:s,statusCode:r,headers:i,rawBody:o,body:n},n)},t=>{const{message:s,response:r}=t;e(s,r,r&&a.decode(r.rawBody,this.encoding))})}}time(t,e=null){const s=e?new Date(e):new Date;let a={"M+":s.getMonth()+1,"d+":s.getDate(),"H+":s.getHours(),"m+":s.getMinutes(),"s+":s.getSeconds(),"q+":Math.floor((s.getMonth()+3)/3),S:s.getMilliseconds()};/(y+)/.test(t)&&(t=t.replace(RegExp.$1,(s.getFullYear()+"").substr(4-RegExp.$1.length)));for(let e in a)new RegExp("("+e+")").test(t)&&(t=t.replace(RegExp.$1,1==RegExp.$1.length?a[e]:("00"+a[e]).substr((""+a[e]).length)));return t}queryStr(t){let e="";for(const s in t){let a=t[s];null!=a&&""!==a&&("object"==typeof a&&(a=JSON.stringify(a)),e+=`${s}=${a}&`)}return e=e.substring(0,e.length-1),e}msg(e=t,s="",a="",r){const i=t=>{switch(typeof t){case void 0:return t;case"string":switch(this.getEnv()){case"Surge":case"Stash":default:return{url:t};case"Loon":case"Shadowrocket":return t;case"Quantumult X":return{"open-url":t};case"Node.js":return}case"object":switch(this.getEnv()){case"Surge":case"Stash":case"Shadowrocket":default:{let e=t.url||t.openUrl||t["open-url"];return{url:e}}case"Loon":{let e=t.openUrl||t.url||t["open-url"],s=t.mediaUrl||t["media-url"];return{openUrl:e,mediaUrl:s}}case"Quantumult X":{let e=t["open-url"]||t.url||t.openUrl,s=t["media-url"]||t.mediaUrl,a=t["update-pasteboard"]||t.updatePasteboard;return{"open-url":e,"media-url":s,"update-pasteboard":a}}case"Node.js":return}default:return}};if(!this.isMute)switch(this.getEnv()){case"Surge":case"Loon":case"Stash":case"Shadowrocket":default:$notification.post(e,s,a,i(r));break;case"Quantumult X":$notify(e,s,a,i(r));break;case"Node.js":}if(!this.isMuteLog){let t=["","==============📣系统通知📣=============="];t.push(e),s&&t.push(s),a&&t.push(a),console.log(t.join("\n")),this.logs=this.logs.concat(t)}}log(...t){t.length>0&&(this.logs=[...this.logs,...t]),console.log(t.join(this.logSeparator))}logErr(t,e){switch(this.getEnv()){case"Surge":case"Loon":case"Stash":case"Shadowrocket":case"Quantumult X":default:this.log("",`❗️${this.name}, 错误!`,t);break;case"Node.js":this.log("",`❗️${this.name}, 错误!`,t.stack)}}wait(t){return new Promise(e=>setTimeout(e,t))}done(t={}){const e=(new Date).getTime(),s=(e-this.startTime)/1e3;switch(this.log("",`🔔${this.name}, 结束! 🕛 ${s} 秒`),this.log(),this.getEnv()){case"Surge":case"Loon":case"Stash":case"Shadowrocket":case"Quantumult X":default:$done(t);break;case"Node.js":process.exit(1)}}}(t,e)}
