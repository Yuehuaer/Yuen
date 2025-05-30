// 脚本名称：Meizi2 随机图片通知
// 支持平台：Loon / Surge / Quantumult X / Stash
// 作者：ChatGPT

const NAME = 'Meizi2 图片';
const HOMEPAGE = 'https://www.meizi2.com';

const $ = new Env(NAME);

(async () => {
  const html = await http({ url: HOMEPAGE });
  if (!html) throw new Error('获取页面失败');

  // 匹配所有图片链接，支持 jpg/jpeg/png/webp
  const imgRegex = /<img[^>]+src=["']([^"'>]+\.(?:jpg|jpeg|png|webp))["']/gi;
  const matches = [...html.matchAll(imgRegex)];

  if (!matches || matches.length === 0) throw new Error('未找到任何图片');

  // 随机选择一张图片
  const imageUrl = matches[Math.floor(Math.random() * matches.length)][1];
  const fullUrl = imageUrl.startsWith('http') ? imageUrl : `${HOMEPAGE}${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;

  await notify(NAME, '点击查看大图', fullUrl, {
    'open-url': fullUrl,
    'media-url': fullUrl
  });
})()
.catch(async (e) => {
  $.logErr(e);
  await notify(NAME, '❌ 错误', e.message || e);
})
.finally(() => {
  $.done();
});

// 请求函数
async function http(opt = {}) {
  return new Promise((resolve, reject) => {
    $httpClient.get(opt, (err, resp, body) => {
      if (err) reject(err);
      else resolve(body);
    });
  });
}

// 通知函数
async function notify(title, subt, desc, opts) {
  $.msg(title, subt, desc, opts);
}

// Env 工具类
function Env(t, e) {
  class s {
    constructor(t) {
      this.env = t;
    }
    send(t, e = 'GET') {
      t = typeof t === 'string' ? { url: t } : t;
      let s = this.get;
      return 'POST' === e && (s = this.post),
        new Promise((e, a) => {
          s.call(this, t, (t, s, r) => {
            t ? a(t) : e(r);
          });
        });
    }
    get(t) {
      return this.send.call(this.env, t);
    }
    post(t) {
      return this.send.call(this.env, t, 'POST');
    }
  }

  return new (class {
    constructor(t, e) {
      this.name = t;
      this.http = new s(this);
      this.log('', `🔔${this.name}, 开始!`);
    }
    log(...t) {
      console.log(t.join(' '));
    }
    logErr(t) {
      this.log('', `❗️${this.name}, 错误!`, t);
    }
    msg(title, subt, desc, opts) {
      if ($notify) {
        $notify(title, subt, desc, opts);
      } else if ($notification) {
        $notification.post(title, subt, desc, opts);
      }
    }
    done() {
      if (typeof $done !== 'undefined') $done();
    }
  })(t, e);
}
