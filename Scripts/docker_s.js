const $ = new Env('Docker作者上新'), DEFAULT_USERS = ['envyafish'];
!(async () => {
    let _0x1a980f = [];
    typeof $argument !== 'undefined' && $argument ? (_0x1a980f = $argument['split'](/[,，\s\n]+/)['filter'](_0x3296cd => _0x3296cd && _0x3296cd['trim']() !== ''), $['log']('📝\x20检测到外部参数，将监控以下\x20' + _0x1a980f['length'] + '\x20位作者:\x20' + _0x1a980f['join'](',\x20'))) : (_0x1a980f = DEFAULT_USERS, $['log']('📝\x20使用默认列表，将监控以下\x20' + _0x1a980f['length'] + '\x20位作者:\x20' + _0x1a980f['join'](',\x20')));
    if (_0x1a980f['length'] === 0x0) {
        $['log']('⚠️\x20监控名单为空，请检查配置');
        return;
    }
    for (let _0x2818fe of _0x1a980f) {
        await checkUserRepos(_0x2818fe['trim']()), await $['wait'](0x5dc);
    }
})()['finally'](() => $['done']());
async function checkUserRepos(_0x1a241b) {
    $['log']('\x0a🔍\x20正在扫描作者:\x20[' + _0x1a241b + ']\x20...');
    const _0x990c0f = 'https://hub.docker.com/v2/repositories/' + _0x1a241b + '/?page_size=20';
    try {
        const _0x4fc29b = await httpGet(_0x990c0f), _0x8b0956 = JSON['parse'](_0x4fc29b);
        if (!_0x8b0956['results']) {
            $['log']('❌\x20[' + _0x1a241b + ']\x20获取失败，请检查用户名是否正确');
            return;
        }
        const _0x5d5639 = _0x8b0956['results']['map'](_0x2383aa => _0x2383aa['name']);
        if (_0x5d5639['length'] === 0x0) {
            $['log']('⚠️\x20[' + _0x1a241b + ']\x20该作者名下没有任何公开仓库');
            return;
        }
        const _0x33f725 = 'docker_repos_' + _0x1a241b, _0x31b14c = $['getdata'](_0x33f725);
        let _0xec1ddf = [];
        if (_0x31b14c)
            try {
                _0xec1ddf = JSON['parse'](_0x31b14c);
            } catch (_0x261be3) {
                _0xec1ddf = [];
            }
        $['log']('📊\x20当前项目数:\x20' + _0x5d5639['length'] + '\x20|\x20缓存项目数:\x20' + _0xec1ddf['length']);
        const _0x33544 = _0x5d5639['filter'](_0x2c54ef => !_0xec1ddf['includes'](_0x2c54ef));
        if (_0x33544['length'] > 0x0) {
            if (_0xec1ddf['length'] === 0x0)
                $['log']('✨\x20[' + _0x1a241b + ']\x20首次运行，已收录\x20' + _0x5d5639['length'] + '\x20个项目入库。');
            else {
                $['log']('🎉\x20[' + _0x1a241b + ']\x20发现新项目:\x20' + _0x33544['join'](',\x20'));
                for (let _0x447b4e of _0x33544) {
                    const _0x2a8abd = _0x1a241b + '/' + _0x447b4e;
                    $['msg']('🚀\x20Docker大佬上新啦', '作者:\x20' + _0x1a241b, '发布了新项目:\x20' + _0x447b4e + '\x0a\x0a快去看看是什么好东西！', { 'open-url': 'https://hub.docker.com/r/' + _0x2a8abd });
                }
            }
            $['setdata'](JSON['stringify'](_0x5d5639), _0x33f725), $['log']('✅\x20本地数据库已更新');
        } else
            $['log']('😴\x20[' + _0x1a241b + ']\x20暂无新项目发布'), _0x5d5639['length'] !== _0xec1ddf['length'] && $['setdata'](JSON['stringify'](_0x5d5639), _0x33f725);
    } catch (_0x1d8049) {
        $['log']('⚠️\x20[' + _0x1a241b + ']\x20检查失败:\x20' + _0x1d8049['message']);
    }
}
function httpGet(_0x560d06) {
    return new Promise((_0x44f72a, _0x12e785) => {
        $['get']({ 'url': _0x560d06 }, (_0x197368, _0x478bb8, _0x5ee36b) => {
            if (_0x197368)
                _0x12e785(_0x197368);
            else
                _0x44f72a(_0x5ee36b);
        });
    });
}
function Env(_0x31ba7f, _0x137c75) {
    class _0x1273ab {
        constructor(_0x39a615) {
            this['env'] = _0x39a615;
        }
        ['send'](_0x518dd6, _0x2acdfb = 'GET') {
            _0x518dd6 = 'string' == typeof _0x518dd6 ? { 'url': _0x518dd6 } : _0x518dd6;
            let _0x5dafb2 = this['get'];
            return 'POST' === _0x2acdfb && (_0x5dafb2 = this['post']), new Promise((_0x394ef5, _0x58ce7f) => {
                _0x5dafb2['call'](this, _0x518dd6, (_0x33b898, _0x6e0b10, _0x1f11f8) => {
                    _0x33b898 ? _0x58ce7f(_0x33b898) : _0x394ef5(_0x6e0b10);
                });
            });
        }
        ['get'](_0x24b55e) {
            return this['send']['call'](this['env'], _0x24b55e);
        }
        ['post'](_0x53aa10) {
            return this['send']['call'](this['env'], _0x53aa10, 'POST');
        }
    }
    return new class {
        constructor(_0x9540bc, _0x5ec612) {
            this['name'] = _0x9540bc, this['http'] = new _0x1273ab(this), this['data'] = null, this['dataFile'] = 'box.dat', this['logs'] = [], this['isMute'] = !0x1, this['isNeedRewrite'] = !0x1, this['logSeparator'] = '\x0a', this['encoding'] = 'utf-8', this['startTime'] = new Date()['getTime'](), Object['assign'](this, _0x5ec612), this['log']('', '🔔' + this['name'] + ',\x20开始!');
        }
        ['getEnv']() {
            return 'undefined' != typeof $environment && $environment['surge-version'] ? 'Surge' : 'undefined' != typeof $environment && $environment['stash-version'] ? 'Stash' : 'undefined' != typeof module && module['exports'] ? 'Node.js' : 'undefined' != typeof $task ? 'Quantumult\x20X' : 'undefined' != typeof $loon ? 'Loon' : 'undefined' != typeof $rocket ? 'Shadowrocket' : void 0x0;
        }
        ['isNode']() {
            return 'Node.js' === this['getEnv']();
        }
        ['isQuanX']() {
            return 'Quantumult\x20X' === this['getEnv']();
        }
        ['isSurge']() {
            return 'Surge' === this['getEnv']();
        }
        ['isLoon']() {
            return 'Loon' === this['getEnv']();
        }
        ['isShadowrocket']() {
            return 'Shadowrocket' === this['getEnv']();
        }
        ['isStash']() {
            return 'Stash' === this['getEnv']();
        }
        ['toObj'](_0x4dc2e1, _0x477fea = null) {
            try {
                return JSON['parse'](_0x4dc2e1);
            } catch {
                return _0x477fea;
            }
        }
        ['toStr'](_0x18cd9a, _0x20682a = null) {
            try {
                return JSON['stringify'](_0x18cd9a);
            } catch {
                return _0x20682a;
            }
        }
        ['getjson'](_0x34b5d, _0xa80118) {
            let _0x30562 = _0xa80118;
            const _0x397eb0 = this['getdata'](_0x34b5d);
            if (_0x397eb0)
                try {
                    _0x30562 = JSON['parse'](this['getdata'](_0x34b5d));
                } catch {
                }
            return _0x30562;
        }
        ['setjson'](_0x18be63, _0x11b2c0) {
            try {
                return this['setdata'](JSON['stringify'](_0x18be63), _0x11b2c0);
            } catch {
                return !0x1;
            }
        }
        ['getScript'](_0x397f74) {
            return new Promise(_0x203c89 => {
                this['get']({ 'url': _0x397f74 }, (_0x5c83aa, _0x40e1c8, _0x374725) => _0x203c89(_0x374725));
            });
        }
        ['runScript'](_0x365d05, _0x4ae36c) {
            return new Promise(_0xadef2d => {
                let _0xf094d8 = this['getdata']('@chavy_boxjs_userCfgs.httpapi');
                _0xf094d8 = _0xf094d8 ? _0xf094d8['replace'](/\n/g, '')['trim']() : _0xf094d8;
                let _0x3e5de2 = this['getdata']('@chavy_boxjs_userCfgs.httpapi_timeout');
                _0x3e5de2 = _0x3e5de2 ? 0x1 * _0x3e5de2 : 0x14, _0x3e5de2 = _0x4ae36c && _0x4ae36c['timeout'] ? _0x4ae36c['timeout'] : _0x3e5de2;
                const [_0x3899c8, _0x262cbb] = _0xf094d8['split']('@'), _0x2067c9 = {
                        'url': 'http://' + _0x262cbb + '/v1/scripting/evaluate',
                        'body': {
                            'script_text': _0x365d05,
                            'mock_type': 'cron',
                            'timeout': _0x3e5de2
                        },
                        'headers': {
                            'X-Key': _0x3899c8,
                            'Accept': '*/*'
                        },
                        'timeout': _0x3e5de2
                    };
                this['post'](_0x2067c9, (_0x50a42b, _0x506361, _0x10e8bc) => _0xadef2d(_0x10e8bc));
            })['catch'](_0x3578fe => this['logErr'](_0x3578fe));
        }
        ['loaddata']() {
            if (!this['isNode']())
                return {};
            {
                this['fs'] = this['fs'] ? this['fs'] : require('fs'), this['path'] = this['path'] ? this['path'] : require('path');
                const _0x2916d3 = this['path']['resolve'](this['dataFile']), _0x5b8b72 = this['path']['resolve'](process['cwd'](), this['dataFile']), _0x44a652 = this['fs']['existsSync'](_0x2916d3), _0x565851 = !_0x44a652 && this['fs']['existsSync'](_0x5b8b72);
                if (!_0x44a652 && !_0x565851)
                    return {};
                {
                    const _0x5bb8a4 = _0x44a652 ? _0x2916d3 : _0x5b8b72;
                    try {
                        return JSON['parse'](this['fs']['readFileSync'](_0x5bb8a4));
                    } catch (_0x249f46) {
                        return {};
                    }
                }
            }
        }
        ['writedata']() {
            if (this['isNode']()) {
                this['fs'] = this['fs'] ? this['fs'] : require('fs'), this['path'] = this['path'] ? this['path'] : require('path');
                const _0x31fad8 = this['path']['resolve'](this['dataFile']), _0x5a71f6 = this['path']['resolve'](process['cwd'](), this['dataFile']), _0x2d830d = this['fs']['existsSync'](_0x31fad8), _0x5c3fd7 = !_0x2d830d && this['fs']['existsSync'](_0x5a71f6), _0x13d9b9 = JSON['stringify'](this['data']);
                _0x2d830d ? this['fs']['writeFileSync'](_0x31fad8, _0x13d9b9) : _0x5c3fd7 ? this['fs']['writeFileSync'](_0x5a71f6, _0x13d9b9) : this['fs']['writeFileSync'](_0x31fad8, _0x13d9b9);
            }
        }
        ['lodash_get'](_0x4b57e1, _0x10ac2e, _0x597764) {
            const _0x2a5b97 = _0x10ac2e['replace'](/\[(\d+)\]/g, '.$1')['split']('.');
            let _0x7fd521 = _0x4b57e1;
            for (const _0x33244b of _0x2a5b97)
                if (_0x7fd521 = Object(_0x7fd521)[_0x33244b], void 0x0 === _0x7fd521)
                    return _0x597764;
            return _0x7fd521;
        }
        ['lodash_set'](_0xfe2e99, _0x231519, _0x1111c8) {
            return Object(_0xfe2e99) !== _0xfe2e99 ? _0xfe2e99 : (Array['isArray'](_0x231519) || (_0x231519 = _0x231519['toString']()['match'](/[^.[\]]+/g) || []), _0x231519['slice'](0x0, -0x1)['reduce']((_0x2a87b6, _0x38f283, _0x39c327) => Object(_0x2a87b6[_0x38f283]) === _0x2a87b6[_0x38f283] ? _0x2a87b6[_0x38f283] : _0x2a87b6[_0x38f283] = Math['abs'](_0x231519[_0x39c327 + 0x1]) >> 0x0 == +_0x231519[_0x39c327 + 0x1] ? [] : {}, _0xfe2e99)[_0x231519[_0x231519['length'] - 0x1]] = _0x1111c8, _0xfe2e99);
        }
        ['getdata'](_0x4c80e1) {
            let _0x33f15c = this['getval'](_0x4c80e1);
            if (/^@/['test'](_0x4c80e1)) {
                const [, _0x3f8ca7, _0x61a24b] = /^@(.*?)\.(.*?)$/['exec'](_0x4c80e1), _0x1da053 = _0x3f8ca7 ? this['getval'](_0x3f8ca7) : '';
                if (_0x1da053)
                    try {
                        const _0x533f94 = JSON['parse'](_0x1da053);
                        _0x33f15c = _0x533f94 ? this['lodash_get'](_0x533f94, _0x61a24b, '') : _0x33f15c;
                    } catch (_0x16b0a6) {
                        _0x33f15c = '';
                    }
            }
            return _0x33f15c;
        }
        ['setdata'](_0x2610ff, _0x2cc66f) {
            let _0x1e79c8 = !0x1;
            if (/^@/['test'](_0x2cc66f)) {
                const [, _0x3a762e, _0x384efd] = /^@(.*?)\.(.*?)$/['exec'](_0x2cc66f), _0x3ec867 = this['getval'](_0x3a762e), _0x42532e = _0x3a762e ? 'null' === _0x3ec867 ? null : _0x3ec867 || '{}' : '{}';
                try {
                    const _0x28bf83 = JSON['parse'](_0x42532e);
                    this['lodash_set'](_0x28bf83, _0x384efd, _0x2610ff), _0x1e79c8 = this['setval'](JSON['stringify'](_0x28bf83), _0x3a762e);
                } catch (_0x12baae) {
                    const _0x4a56ec = {};
                    this['lodash_set'](_0x4a56ec, _0x384efd, _0x2610ff), _0x1e79c8 = this['setval'](JSON['stringify'](_0x4a56ec), _0x3a762e);
                }
            } else
                _0x1e79c8 = this['setval'](_0x2610ff, _0x2cc66f);
            return _0x1e79c8;
        }
        ['getval'](_0x26b94f) {
            switch (this['getEnv']()) {
            case 'Surge':
            case 'Loon':
            case 'Stash':
            case 'Shadowrocket':
                return $persistentStore['read'](_0x26b94f);
            case 'Quantumult\x20X':
                return $prefs['valueForKey'](_0x26b94f);
            case 'Node.js':
                return this['data'] = this['loaddata'](), this['data'][_0x26b94f];
            default:
                return this['data'] && this['data'][_0x26b94f] || null;
            }
        }
        ['setval'](_0x43104a, _0x3a2a27) {
            switch (this['getEnv']()) {
            case 'Surge':
            case 'Loon':
            case 'Stash':
            case 'Shadowrocket':
                return $persistentStore['write'](_0x43104a, _0x3a2a27);
            case 'Quantumult\x20X':
                return $prefs['setValueForKey'](_0x43104a, _0x3a2a27);
            case 'Node.js':
                return this['data'] = this['loaddata'](), this['data'][_0x3a2a27] = _0x43104a, this['writedata'](), !0x0;
            default:
                return this['data'] && this['data'][_0x3a2a27] || null;
            }
        }
        ['initGotEnv'](_0x22cd65) {
            this['got'] = this['got'] ? this['got'] : require('got'), this['cktough'] = this['cktough'] ? this['cktough'] : require('tough-cookie'), this['ckjar'] = this['ckjar'] ? this['ckjar'] : new this['cktough']['CookieJar'](), _0x22cd65 && (_0x22cd65['headers'] = _0x22cd65['headers'] ? _0x22cd65['headers'] : {}, void 0x0 === _0x22cd65['headers']['Cookie'] && void 0x0 === _0x22cd65['cookieJar'] && (_0x22cd65['cookieJar'] = this['ckjar']));
        }
        ['get'](_0x234603, _0x428d66 = () => {
        }) {
            switch (_0x234603['headers'] && (delete _0x234603['headers']['Content-Type'], delete _0x234603['headers']['Content-Length'], delete _0x234603['headers']['content-type'], delete _0x234603['headers']['content-length']), _0x234603['params'] && (_0x234603['url'] += '?' + this['queryStr'](_0x234603['params'])), this['getEnv']()) {
            case 'Surge':
            case 'Loon':
            case 'Stash':
            case 'Shadowrocket':
            default:
                this['isSurge']() && this['isNeedRewrite'] && (_0x234603['headers'] = _0x234603['headers'] || {}, Object['assign'](_0x234603['headers'], { 'X-Surge-Skip-Scripting': !0x1 })), $httpClient['get'](_0x234603, (_0x11ba35, _0x4ad07a, _0x288bf1) => {
                    !_0x11ba35 && _0x4ad07a && (_0x4ad07a['body'] = _0x288bf1, _0x4ad07a['statusCode'] = _0x4ad07a['status'] ? _0x4ad07a['status'] : _0x4ad07a['statusCode'], _0x4ad07a['status'] = _0x4ad07a['statusCode']), _0x428d66(_0x11ba35, _0x4ad07a, _0x288bf1);
                });
                break;
            case 'Quantumult\x20X':
                this['isNeedRewrite'] && (_0x234603['opts'] = _0x234603['opts'] || {}, Object['assign'](_0x234603['opts'], { 'hints': !0x1 })), $task['fetch'](_0x234603)['then'](_0x2dcb56 => {
                    const {
                        statusCode: _0x5988dd,
                        statusCode: _0x13b62d,
                        headers: _0x13a877,
                        body: _0x3436fb,
                        bodyBytes: _0x284854
                    } = _0x2dcb56;
                    _0x428d66(null, {
                        'status': _0x5988dd,
                        'statusCode': _0x13b62d,
                        'headers': _0x13a877,
                        'body': _0x3436fb,
                        'bodyBytes': _0x284854
                    }, _0x3436fb, _0x284854);
                }, _0x1a1e50 => _0x428d66(_0x1a1e50 && _0x1a1e50['error'] || 'UndefinedError'));
                break;
            case 'Node.js':
                let _0x28b50c = require('iconv-lite');
                this['initGotEnv'](_0x234603), this['got'](_0x234603)['on']('redirect', (_0x7acc02, _0x4f6287) => {
                    try {
                        if (_0x7acc02['headers']['set-cookie']) {
                            const _0x3e23b8 = _0x7acc02['headers']['set-cookie']['map'](this['cktough']['Cookie']['parse'])['toString']();
                            _0x3e23b8 && this['ckjar']['setCookieSync'](_0x3e23b8, null), _0x4f6287['cookieJar'] = this['ckjar'];
                        }
                    } catch (_0x2c2720) {
                        this['logErr'](_0x2c2720);
                    }
                })['then'](_0x3b4fe9 => {
                    const {
                            statusCode: _0x335a75,
                            statusCode: _0x449382,
                            headers: _0xf13a2d,
                            rawBody: _0x2124b9
                        } = _0x3b4fe9, _0x177eca = _0x28b50c['decode'](_0x2124b9, this['encoding']);
                    _0x428d66(null, {
                        'status': _0x335a75,
                        'statusCode': _0x449382,
                        'headers': _0xf13a2d,
                        'rawBody': _0x2124b9,
                        'body': _0x177eca
                    }, _0x177eca);
                }, _0x1852bb => {
                    const {
                        message: _0x201531,
                        response: _0x206ed3
                    } = _0x1852bb;
                    _0x428d66(_0x201531, _0x206ed3, _0x206ed3 && _0x28b50c['decode'](_0x206ed3['rawBody'], this['encoding']));
                });
            }
        }
        ['post'](_0x5aca6b, _0x5b7f57 = () => {
        }) {
            const _0xed8efc = _0x5aca6b['method'] ? _0x5aca6b['method']['toLocaleLowerCase']() : 'post';
            switch (_0x5aca6b['body'] && _0x5aca6b['headers'] && !_0x5aca6b['headers']['Content-Type'] && !_0x5aca6b['headers']['content-type'] && (_0x5aca6b['headers']['content-type'] = 'application/x-www-form-urlencoded'), _0x5aca6b['headers'] && (delete _0x5aca6b['headers']['Content-Length'], delete _0x5aca6b['headers']['content-length']), this['getEnv']()) {
            case 'Surge':
            case 'Loon':
            case 'Stash':
            case 'Shadowrocket':
            default:
                this['isSurge']() && this['isNeedRewrite'] && (_0x5aca6b['headers'] = _0x5aca6b['headers'] || {}, Object['assign'](_0x5aca6b['headers'], { 'X-Surge-Skip-Scripting': !0x1 })), $httpClient[_0xed8efc](_0x5aca6b, (_0x1601ee, _0x45a0fe, _0x9478d6) => {
                    !_0x1601ee && _0x45a0fe && (_0x45a0fe['body'] = _0x9478d6, _0x45a0fe['statusCode'] = _0x45a0fe['status'] ? _0x45a0fe['status'] : _0x45a0fe['statusCode'], _0x45a0fe['status'] = _0x45a0fe['statusCode']), _0x5b7f57(_0x1601ee, _0x45a0fe, _0x9478d6);
                });
                break;
            case 'Quantumult\x20X':
                _0x5aca6b['method'] = _0xed8efc, this['isNeedRewrite'] && (_0x5aca6b['opts'] = _0x5aca6b['opts'] || {}, Object['assign'](_0x5aca6b['opts'], { 'hints': !0x1 })), $task['fetch'](_0x5aca6b)['then'](_0xfc3699 => {
                    const {
                        statusCode: _0x11b340,
                        statusCode: _0x4b80ab,
                        headers: _0x2d20a5,
                        body: _0x1609bc,
                        bodyBytes: _0x22d663
                    } = _0xfc3699;
                    _0x5b7f57(null, {
                        'status': _0x11b340,
                        'statusCode': _0x4b80ab,
                        'headers': _0x2d20a5,
                        'body': _0x1609bc,
                        'bodyBytes': _0x22d663
                    }, _0x1609bc, _0x22d663);
                }, _0x3e3ef2 => _0x5b7f57(_0x3e3ef2 && _0x3e3ef2['error'] || 'UndefinedError'));
                break;
            case 'Node.js':
                let _0x28a594 = require('iconv-lite');
                this['initGotEnv'](_0x5aca6b);
                const {
                    url: _0x5c6454,
                    ..._0x41d43b
                } = _0x5aca6b;
                this['got'][_0xed8efc](_0x5c6454, _0x41d43b)['then'](_0x67a9da => {
                    const {
                            statusCode: _0x343beb,
                            statusCode: _0x219971,
                            headers: _0x3da73e,
                            rawBody: _0x35f7ff
                        } = _0x67a9da, _0x456782 = _0x28a594['decode'](_0x35f7ff, this['encoding']);
                    _0x5b7f57(null, {
                        'status': _0x343beb,
                        'statusCode': _0x219971,
                        'headers': _0x3da73e,
                        'rawBody': _0x35f7ff,
                        'body': _0x456782
                    }, _0x456782);
                }, _0x2aca49 => {
                    const {
                        message: _0x216fd2,
                        response: _0x270fd0
                    } = _0x2aca49;
                    _0x5b7f57(_0x216fd2, _0x270fd0, _0x270fd0 && _0x28a594['decode'](_0x270fd0['rawBody'], this['encoding']));
                });
            }
        }
        ['time'](_0x66cc48, _0x1040c0 = null) {
            const _0x43e67e = _0x1040c0 ? new Date(_0x1040c0) : new Date();
            let _0x39208b = {
                'M+': _0x43e67e['getMonth']() + 0x1,
                'd+': _0x43e67e['getDate'](),
                'H+': _0x43e67e['getHours'](),
                'm+': _0x43e67e['getMinutes'](),
                's+': _0x43e67e['getSeconds'](),
                'q+': Math['floor']((_0x43e67e['getMonth']() + 0x3) / 0x3),
                'S': _0x43e67e['getMilliseconds']()
            };
            /(y+)/['test'](_0x66cc48) && (_0x66cc48 = _0x66cc48['replace'](RegExp['$1'], (_0x43e67e['getFullYear']() + '')['substr'](0x4 - RegExp['$1']['length'])));
            for (let _0x50f195 in _0x39208b)
                new RegExp('(' + _0x50f195 + ')')['test'](_0x66cc48) && (_0x66cc48 = _0x66cc48['replace'](RegExp['$1'], 0x1 == RegExp['$1']['length'] ? _0x39208b[_0x50f195] : ('00' + _0x39208b[_0x50f195])['substr'](('' + _0x39208b[_0x50f195])['length'])));
            return _0x66cc48;
        }
        ['queryStr'](_0x574e80) {
            let _0x27c423 = '';
            for (const _0x45501d in _0x574e80) {
                let _0x3a74bc = _0x574e80[_0x45501d];
                null != _0x3a74bc && '' !== _0x3a74bc && ('object' == typeof _0x3a74bc && (_0x3a74bc = JSON['stringify'](_0x3a74bc)), _0x27c423 += _0x45501d + '=' + _0x3a74bc + '&');
            }
            return _0x27c423 = _0x27c423['substring'](0x0, _0x27c423['length'] - 0x1), _0x27c423;
        }
        ['msg'](_0x1c5436 = _0x31ba7f, _0x3d51fc = '', _0xa58a5d = '', _0x59c866) {
            const _0x26e7d5 = _0x416fd2 => {
                switch (typeof _0x416fd2) {
                case void 0x0:
                    return _0x416fd2;
                case 'string':
                    switch (this['getEnv']()) {
                    case 'Surge':
                    case 'Stash':
                    default:
                        return { 'url': _0x416fd2 };
                    case 'Loon':
                    case 'Shadowrocket':
                        return _0x416fd2;
                    case 'Quantumult\x20X':
                        return { 'open-url': _0x416fd2 };
                    case 'Node.js':
                        return;
                    }
                case 'object':
                    switch (this['getEnv']()) {
                    case 'Surge':
                    case 'Stash':
                    case 'Shadowrocket':
                    default: {
                            let _0x4af43a = _0x416fd2['url'] || _0x416fd2['openUrl'] || _0x416fd2['open-url'];
                            return { 'url': _0x4af43a };
                        }
                    case 'Loon': {
                            let _0x1a90e4 = _0x416fd2['openUrl'] || _0x416fd2['url'] || _0x416fd2['open-url'], _0x520b9d = _0x416fd2['mediaUrl'] || _0x416fd2['media-url'];
                            return {
                                'openUrl': _0x1a90e4,
                                'mediaUrl': _0x520b9d
                            };
                        }
                    case 'Quantumult\x20X': {
                            let _0x9545a2 = _0x416fd2['open-url'] || _0x416fd2['url'] || _0x416fd2['openUrl'], _0x46c41b = _0x416fd2['media-url'] || _0x416fd2['mediaUrl'], _0xaa3ddb = _0x416fd2['update-pasteboard'] || _0x416fd2['updatePasteboard'];
                            return {
                                'open-url': _0x9545a2,
                                'media-url': _0x46c41b,
                                'update-pasteboard': _0xaa3ddb
                            };
                        }
                    case 'Node.js':
                        return;
                    }
                default:
                    return;
                }
            };
            if (!this['isMute'])
                switch (this['getEnv']()) {
                case 'Surge':
                case 'Loon':
                case 'Stash':
                case 'Shadowrocket':
                default:
                    $notification['post'](_0x1c5436, _0x3d51fc, _0xa58a5d, _0x26e7d5(_0x59c866));
                    break;
                case 'Quantumult\x20X':
                    $notify(_0x1c5436, _0x3d51fc, _0xa58a5d, _0x26e7d5(_0x59c866));
                    break;
                case 'Node.js':
                }
            if (!this['isMuteLog']) {
                let _0x9652a8 = [
                    '',
                    '==============📣系统通知📣=============='
                ];
                _0x9652a8['push'](_0x1c5436), _0x3d51fc && _0x9652a8['push'](_0x3d51fc), _0xa58a5d && _0x9652a8['push'](_0xa58a5d), console['log'](_0x9652a8['join']('\x0a')), this['logs'] = this['logs']['concat'](_0x9652a8);
            }
        }
        ['log'](..._0x368a1f) {
            _0x368a1f['length'] > 0x0 && (this['logs'] = [
                ...this['logs'],
                ..._0x368a1f
            ]), console['log'](_0x368a1f['join'](this['logSeparator']));
        }
        ['logErr'](_0x1eb227, _0x4ddc20) {
            switch (this['getEnv']()) {
            case 'Surge':
            case 'Loon':
            case 'Stash':
            case 'Shadowrocket':
            case 'Quantumult\x20X':
            default:
                this['log']('', '❗️' + this['name'] + ',\x20错误!', _0x1eb227);
                break;
            case 'Node.js':
                this['log']('', '❗️' + this['name'] + ',\x20错误!', _0x1eb227['stack']);
            }
        }
        ['wait'](_0x2f8556) {
            return new Promise(_0x160fd8 => setTimeout(_0x160fd8, _0x2f8556));
        }
        ['done'](_0x24c7e3 = {}) {
            const _0x573f82 = new Date()['getTime'](), _0x5f33d5 = (_0x573f82 - this['startTime']) / 0x3e8;
            switch (this['log']('', '🔔' + this['name'] + ',\x20结束!\x20🕛\x20' + _0x5f33d5 + '\x20秒'), this['log'](), this['getEnv']()) {
            case 'Surge':
            case 'Loon':
            case 'Stash':
            case 'Shadowrocket':
            case 'Quantumult\x20X':
            default:
                $done(_0x24c7e3);
                break;
            case 'Node.js':
                process['exit'](0x1);
            }
        }
    }(_0x31ba7f, _0x137c75);
}