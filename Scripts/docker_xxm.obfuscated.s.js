const $ = new Env('Docker作者上新'), DEFAULT_USERS = ['envyafish'];
!(async () => {
    let _0x31a76b = [];
    typeof $argument !== 'undefined' && $argument ? (_0x31a76b = $argument['split'](/[,，\s\n]+/)['filter'](_0x3c7f19 => _0x3c7f19 && _0x3c7f19['trim']() !== ''), $['log']('📝\x20检测到外部参数，将监控以下\x20' + _0x31a76b['length'] + '\x20位作者:\x20' + _0x31a76b['join'](',\x20'))) : (_0x31a76b = DEFAULT_USERS, $['log']('📝\x20使用默认列表，将监控以下\x20' + _0x31a76b['length'] + '\x20位作者:\x20' + _0x31a76b['join'](',\x20')));
    if (_0x31a76b['length'] === 0x0) {
        $['log']('⚠️\x20监控名单为空，请检查配置');
        return;
    }
    for (let _0x580754 of _0x31a76b) {
        await checkUserRepos(_0x580754['trim']()), await $['wait'](0x5dc);
    }
})()['finally'](() => $['done']());
async function checkUserRepos(_0x282db1) {
    $['log']('\x0a🔍\x20正在扫描作者:\x20[' + _0x282db1 + ']\x20...');
    const _0x3f9941 = 'https://hub.docker.com/v2/repositories/' + _0x282db1 + '/?page_size=20';
    try {
        const _0x11c97e = await httpGet(_0x3f9941), _0x2bb25e = JSON['parse'](_0x11c97e);
        if (!_0x2bb25e['results']) {
            $['log']('❌\x20[' + _0x282db1 + ']\x20获取失败，请检查用户名是否正确');
            return;
        }
        const _0x45adf = _0x2bb25e['results']['map'](_0x5565b8 => _0x5565b8['name']);
        if (_0x45adf['length'] === 0x0) {
            $['log']('⚠️\x20[' + _0x282db1 + ']\x20该作者名下没有任何公开仓库');
            return;
        }
        const _0x772e9c = 'docker_repos_' + _0x282db1, _0x15ab2a = $['getdata'](_0x772e9c);
        let _0x46a805 = [];
        if (_0x15ab2a)
            try {
                _0x46a805 = JSON['parse'](_0x15ab2a);
            } catch (_0x3cfed7) {
                _0x46a805 = [];
            }
        $['log']('📊\x20当前项目数:\x20' + _0x45adf['length'] + '\x20|\x20缓存项目数:\x20' + _0x46a805['length']);
        const _0xaf726e = _0x45adf['filter'](_0x14be2b => !_0x46a805['includes'](_0x14be2b));
        if (_0xaf726e['length'] > 0x0) {
            if (_0x46a805['length'] === 0x0)
                $['log']('✨\x20[' + _0x282db1 + ']\x20首次运行，已收录\x20' + _0x45adf['length'] + '\x20个项目入库。');
            else {
                $['log']('🎉\x20[' + _0x282db1 + ']\x20发现新项目:\x20' + _0xaf726e['join'](',\x20'));
                for (let _0x2ae12a of _0xaf726e) {
                    const _0x5b9f9d = _0x282db1 + '/' + _0x2ae12a;
                    $['msg']('🚀\x20Docker大佬上新啦', '作者:\x20' + _0x282db1, '发布了新项目:\x20' + _0x2ae12a + '\x0a\x0a快去看看是什么好东西！', { 'open-url': 'https://hub.docker.com/r/' + _0x5b9f9d });
                }
            }
            $['setdata'](JSON['stringify'](_0x45adf), _0x772e9c), $['log']('✅\x20本地数据库已更新');
        } else
            $['log']('😴\x20[' + _0x282db1 + ']\x20暂无新项目发布'), _0x45adf['length'] !== _0x46a805['length'] && $['setdata'](JSON['stringify'](_0x45adf), _0x772e9c);
    } catch (_0x4db99c) {
        $['log']('⚠️\x20[' + _0x282db1 + ']\x20检查失败:\x20' + _0x4db99c['message']);
    }
}
function httpGet(_0x29c67c) {
    return new Promise((_0x19cb83, _0x365b7b) => {
        $['get']({ 'url': _0x29c67c }, (_0x421790, _0x28dcae, _0x458fef) => {
            if (_0x421790)
                _0x365b7b(_0x421790);
            else
                _0x19cb83(_0x458fef);
        });
    });
}
function Env(_0xa5c0f9, _0x133302) {
    class _0xfa2db6 {
        constructor(_0x57e29b) {
            this['env'] = _0x57e29b;
        }
        ['send'](_0x25e69a, _0x29ac2d = 'GET') {
            _0x25e69a = 'string' == typeof _0x25e69a ? { 'url': _0x25e69a } : _0x25e69a;
            let _0x32796d = this['get'];
            return 'POST' === _0x29ac2d && (_0x32796d = this['post']), new Promise((_0x5b18a8, _0x5230c7) => {
                _0x32796d['call'](this, _0x25e69a, (_0x4e2834, _0x14ac97, _0x2dfbaf) => {
                    _0x4e2834 ? _0x5230c7(_0x4e2834) : _0x5b18a8(_0x14ac97);
                });
            });
        }
        ['get'](_0x2ce41b) {
            return this['send']['call'](this['env'], _0x2ce41b);
        }
        ['post'](_0x4c00fb) {
            return this['send']['call'](this['env'], _0x4c00fb, 'POST');
        }
    }
    return new class {
        constructor(_0xb06792, _0x1dff9b) {
            this['name'] = _0xb06792, this['http'] = new _0xfa2db6(this), this['data'] = null, this['dataFile'] = 'box.dat', this['logs'] = [], this['isMute'] = !0x1, this['isNeedRewrite'] = !0x1, this['logSeparator'] = '\x0a', this['encoding'] = 'utf-8', this['startTime'] = new Date()['getTime'](), Object['assign'](this, _0x1dff9b), this['log']('', '🔔' + this['name'] + ',\x20开始!');
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
        ['toObj'](_0x47729a, _0x2d9228 = null) {
            try {
                return JSON['parse'](_0x47729a);
            } catch {
                return _0x2d9228;
            }
        }
        ['toStr'](_0x5b6c1b, _0x357aec = null) {
            try {
                return JSON['stringify'](_0x5b6c1b);
            } catch {
                return _0x357aec;
            }
        }
        ['getjson'](_0x1fc94f, _0x3029d8) {
            let _0x160157 = _0x3029d8;
            const _0x31fd31 = this['getdata'](_0x1fc94f);
            if (_0x31fd31)
                try {
                    _0x160157 = JSON['parse'](this['getdata'](_0x1fc94f));
                } catch {
                }
            return _0x160157;
        }
        ['setjson'](_0x38553a, _0x4f8873) {
            try {
                return this['setdata'](JSON['stringify'](_0x38553a), _0x4f8873);
            } catch {
                return !0x1;
            }
        }
        ['getScript'](_0x1e421a) {
            return new Promise(_0x3da161 => {
                this['get']({ 'url': _0x1e421a }, (_0x59f8b2, _0x4daea2, _0x2258ef) => _0x3da161(_0x2258ef));
            });
        }
        ['runScript'](_0x5dae3f, _0x270a2e) {
            return new Promise(_0x3c7a93 => {
                let _0x5e842c = this['getdata']('@chavy_boxjs_userCfgs.httpapi');
                _0x5e842c = _0x5e842c ? _0x5e842c['replace'](/\n/g, '')['trim']() : _0x5e842c;
                let _0x37b937 = this['getdata']('@chavy_boxjs_userCfgs.httpapi_timeout');
                _0x37b937 = _0x37b937 ? 0x1 * _0x37b937 : 0x14, _0x37b937 = _0x270a2e && _0x270a2e['timeout'] ? _0x270a2e['timeout'] : _0x37b937;
                const [_0x2133ea, _0x55975b] = _0x5e842c['split']('@'), _0x5392a3 = {
                        'url': 'http://' + _0x55975b + '/v1/scripting/evaluate',
                        'body': {
                            'script_text': _0x5dae3f,
                            'mock_type': 'cron',
                            'timeout': _0x37b937
                        },
                        'headers': {
                            'X-Key': _0x2133ea,
                            'Accept': '*/*'
                        },
                        'timeout': _0x37b937
                    };
                this['post'](_0x5392a3, (_0x530b13, _0x1b046f, _0x57fdce) => _0x3c7a93(_0x57fdce));
            })['catch'](_0x2b7cde => this['logErr'](_0x2b7cde));
        }
        ['loaddata']() {
            if (!this['isNode']())
                return {};
            {
                this['fs'] = this['fs'] ? this['fs'] : require('fs'), this['path'] = this['path'] ? this['path'] : require('path');
                const _0x2ef02e = this['path']['resolve'](this['dataFile']), _0x4119a2 = this['path']['resolve'](process['cwd'](), this['dataFile']), _0x20b946 = this['fs']['existsSync'](_0x2ef02e), _0x540f4e = !_0x20b946 && this['fs']['existsSync'](_0x4119a2);
                if (!_0x20b946 && !_0x540f4e)
                    return {};
                {
                    const _0x1bddee = _0x20b946 ? _0x2ef02e : _0x4119a2;
                    try {
                        return JSON['parse'](this['fs']['readFileSync'](_0x1bddee));
                    } catch (_0x4e9f94) {
                        return {};
                    }
                }
            }
        }
        ['writedata']() {
            if (this['isNode']()) {
                this['fs'] = this['fs'] ? this['fs'] : require('fs'), this['path'] = this['path'] ? this['path'] : require('path');
                const _0x4ca18e = this['path']['resolve'](this['dataFile']), _0x39402c = this['path']['resolve'](process['cwd'](), this['dataFile']), _0x4ff1be = this['fs']['existsSync'](_0x4ca18e), _0x40e3af = !_0x4ff1be && this['fs']['existsSync'](_0x39402c), _0x30decb = JSON['stringify'](this['data']);
                _0x4ff1be ? this['fs']['writeFileSync'](_0x4ca18e, _0x30decb) : _0x40e3af ? this['fs']['writeFileSync'](_0x39402c, _0x30decb) : this['fs']['writeFileSync'](_0x4ca18e, _0x30decb);
            }
        }
        ['lodash_get'](_0x5e8893, _0x2da309, _0x2d7637) {
            const _0x8f4282 = _0x2da309['replace'](/\[(\d+)\]/g, '.$1')['split']('.');
            let _0x175c91 = _0x5e8893;
            for (const _0x4b57c0 of _0x8f4282)
                if (_0x175c91 = Object(_0x175c91)[_0x4b57c0], void 0x0 === _0x175c91)
                    return _0x2d7637;
            return _0x175c91;
        }
        ['lodash_set'](_0x3a801a, _0x5ee55c, _0x24adf8) {
            return Object(_0x3a801a) !== _0x3a801a ? _0x3a801a : (Array['isArray'](_0x5ee55c) || (_0x5ee55c = _0x5ee55c['toString']()['match'](/[^.[\]]+/g) || []), _0x5ee55c['slice'](0x0, -0x1)['reduce']((_0xa46739, _0x4f8c0a, _0x23b443) => Object(_0xa46739[_0x4f8c0a]) === _0xa46739[_0x4f8c0a] ? _0xa46739[_0x4f8c0a] : _0xa46739[_0x4f8c0a] = Math['abs'](_0x5ee55c[_0x23b443 + 0x1]) >> 0x0 == +_0x5ee55c[_0x23b443 + 0x1] ? [] : {}, _0x3a801a)[_0x5ee55c[_0x5ee55c['length'] - 0x1]] = _0x24adf8, _0x3a801a);
        }
        ['getdata'](_0x584611) {
            let _0x43eacb = this['getval'](_0x584611);
            if (/^@/['test'](_0x584611)) {
                const [, _0x1e686d, _0x48f0ef] = /^@(.*?)\.(.*?)$/['exec'](_0x584611), _0x5833b2 = _0x1e686d ? this['getval'](_0x1e686d) : '';
                if (_0x5833b2)
                    try {
                        const _0x26e233 = JSON['parse'](_0x5833b2);
                        _0x43eacb = _0x26e233 ? this['lodash_get'](_0x26e233, _0x48f0ef, '') : _0x43eacb;
                    } catch (_0x9b2e91) {
                        _0x43eacb = '';
                    }
            }
            return _0x43eacb;
        }
        ['setdata'](_0xcdf250, _0x2e2565) {
            let _0x472593 = !0x1;
            if (/^@/['test'](_0x2e2565)) {
                const [, _0x489eb6, _0x2d2099] = /^@(.*?)\.(.*?)$/['exec'](_0x2e2565), _0x44a42b = this['getval'](_0x489eb6), _0x181886 = _0x489eb6 ? 'null' === _0x44a42b ? null : _0x44a42b || '{}' : '{}';
                try {
                    const _0x562905 = JSON['parse'](_0x181886);
                    this['lodash_set'](_0x562905, _0x2d2099, _0xcdf250), _0x472593 = this['setval'](JSON['stringify'](_0x562905), _0x489eb6);
                } catch (_0x35376c) {
                    const _0x453b1f = {};
                    this['lodash_set'](_0x453b1f, _0x2d2099, _0xcdf250), _0x472593 = this['setval'](JSON['stringify'](_0x453b1f), _0x489eb6);
                }
            } else
                _0x472593 = this['setval'](_0xcdf250, _0x2e2565);
            return _0x472593;
        }
        ['getval'](_0x14bf1) {
            switch (this['getEnv']()) {
            case 'Surge':
            case 'Loon':
            case 'Stash':
            case 'Shadowrocket':
                return $persistentStore['read'](_0x14bf1);
            case 'Quantumult\x20X':
                return $prefs['valueForKey'](_0x14bf1);
            case 'Node.js':
                return this['data'] = this['loaddata'](), this['data'][_0x14bf1];
            default:
                return this['data'] && this['data'][_0x14bf1] || null;
            }
        }
        ['setval'](_0x40ee6f, _0x38608a) {
            switch (this['getEnv']()) {
            case 'Surge':
            case 'Loon':
            case 'Stash':
            case 'Shadowrocket':
                return $persistentStore['write'](_0x40ee6f, _0x38608a);
            case 'Quantumult\x20X':
                return $prefs['setValueForKey'](_0x40ee6f, _0x38608a);
            case 'Node.js':
                return this['data'] = this['loaddata'](), this['data'][_0x38608a] = _0x40ee6f, this['writedata'](), !0x0;
            default:
                return this['data'] && this['data'][_0x38608a] || null;
            }
        }
        ['initGotEnv'](_0x55743e) {
            this['got'] = this['got'] ? this['got'] : require('got'), this['cktough'] = this['cktough'] ? this['cktough'] : require('tough-cookie'), this['ckjar'] = this['ckjar'] ? this['ckjar'] : new this['cktough']['CookieJar'](), _0x55743e && (_0x55743e['headers'] = _0x55743e['headers'] ? _0x55743e['headers'] : {}, void 0x0 === _0x55743e['headers']['Cookie'] && void 0x0 === _0x55743e['cookieJar'] && (_0x55743e['cookieJar'] = this['ckjar']));
        }
        ['get'](_0x4cb56e, _0x51c529 = () => {
        }) {
            switch (_0x4cb56e['headers'] && (delete _0x4cb56e['headers']['Content-Type'], delete _0x4cb56e['headers']['Content-Length'], delete _0x4cb56e['headers']['content-type'], delete _0x4cb56e['headers']['content-length']), _0x4cb56e['params'] && (_0x4cb56e['url'] += '?' + this['queryStr'](_0x4cb56e['params'])), this['getEnv']()) {
            case 'Surge':
            case 'Loon':
            case 'Stash':
            case 'Shadowrocket':
            default:
                this['isSurge']() && this['isNeedRewrite'] && (_0x4cb56e['headers'] = _0x4cb56e['headers'] || {}, Object['assign'](_0x4cb56e['headers'], { 'X-Surge-Skip-Scripting': !0x1 })), $httpClient['get'](_0x4cb56e, (_0x504dee, _0x328212, _0x1a9634) => {
                    !_0x504dee && _0x328212 && (_0x328212['body'] = _0x1a9634, _0x328212['statusCode'] = _0x328212['status'] ? _0x328212['status'] : _0x328212['statusCode'], _0x328212['status'] = _0x328212['statusCode']), _0x51c529(_0x504dee, _0x328212, _0x1a9634);
                });
                break;
            case 'Quantumult\x20X':
                this['isNeedRewrite'] && (_0x4cb56e['opts'] = _0x4cb56e['opts'] || {}, Object['assign'](_0x4cb56e['opts'], { 'hints': !0x1 })), $task['fetch'](_0x4cb56e)['then'](_0x55fe7d => {
                    const {
                        statusCode: _0x1c9110,
                        statusCode: _0x18e2cd,
                        headers: _0x20617e,
                        body: _0x35e677,
                        bodyBytes: _0x48d22d
                    } = _0x55fe7d;
                    _0x51c529(null, {
                        'status': _0x1c9110,
                        'statusCode': _0x18e2cd,
                        'headers': _0x20617e,
                        'body': _0x35e677,
                        'bodyBytes': _0x48d22d
                    }, _0x35e677, _0x48d22d);
                }, _0x2bded1 => _0x51c529(_0x2bded1 && _0x2bded1['error'] || 'UndefinedError'));
                break;
            case 'Node.js':
                let _0x366100 = require('iconv-lite');
                this['initGotEnv'](_0x4cb56e), this['got'](_0x4cb56e)['on']('redirect', (_0x1d8d9d, _0x23a7d3) => {
                    try {
                        if (_0x1d8d9d['headers']['set-cookie']) {
                            const _0x1f5fdd = _0x1d8d9d['headers']['set-cookie']['map'](this['cktough']['Cookie']['parse'])['toString']();
                            _0x1f5fdd && this['ckjar']['setCookieSync'](_0x1f5fdd, null), _0x23a7d3['cookieJar'] = this['ckjar'];
                        }
                    } catch (_0x51fd27) {
                        this['logErr'](_0x51fd27);
                    }
                })['then'](_0x374493 => {
                    const {
                            statusCode: _0x1f027b,
                            statusCode: _0x4fff0e,
                            headers: _0x493d55,
                            rawBody: _0x26fcc7
                        } = _0x374493, _0x6774e9 = _0x366100['decode'](_0x26fcc7, this['encoding']);
                    _0x51c529(null, {
                        'status': _0x1f027b,
                        'statusCode': _0x4fff0e,
                        'headers': _0x493d55,
                        'rawBody': _0x26fcc7,
                        'body': _0x6774e9
                    }, _0x6774e9);
                }, _0x13ee0f => {
                    const {
                        message: _0x5e175a,
                        response: _0x4b333d
                    } = _0x13ee0f;
                    _0x51c529(_0x5e175a, _0x4b333d, _0x4b333d && _0x366100['decode'](_0x4b333d['rawBody'], this['encoding']));
                });
            }
        }
        ['post'](_0x3ca574, _0x4e308b = () => {
        }) {
            const _0x821796 = _0x3ca574['method'] ? _0x3ca574['method']['toLocaleLowerCase']() : 'post';
            switch (_0x3ca574['body'] && _0x3ca574['headers'] && !_0x3ca574['headers']['Content-Type'] && !_0x3ca574['headers']['content-type'] && (_0x3ca574['headers']['content-type'] = 'application/x-www-form-urlencoded'), _0x3ca574['headers'] && (delete _0x3ca574['headers']['Content-Length'], delete _0x3ca574['headers']['content-length']), this['getEnv']()) {
            case 'Surge':
            case 'Loon':
            case 'Stash':
            case 'Shadowrocket':
            default:
                this['isSurge']() && this['isNeedRewrite'] && (_0x3ca574['headers'] = _0x3ca574['headers'] || {}, Object['assign'](_0x3ca574['headers'], { 'X-Surge-Skip-Scripting': !0x1 })), $httpClient[_0x821796](_0x3ca574, (_0x47911b, _0x5efaa1, _0x302cd1) => {
                    !_0x47911b && _0x5efaa1 && (_0x5efaa1['body'] = _0x302cd1, _0x5efaa1['statusCode'] = _0x5efaa1['status'] ? _0x5efaa1['status'] : _0x5efaa1['statusCode'], _0x5efaa1['status'] = _0x5efaa1['statusCode']), _0x4e308b(_0x47911b, _0x5efaa1, _0x302cd1);
                });
                break;
            case 'Quantumult\x20X':
                _0x3ca574['method'] = _0x821796, this['isNeedRewrite'] && (_0x3ca574['opts'] = _0x3ca574['opts'] || {}, Object['assign'](_0x3ca574['opts'], { 'hints': !0x1 })), $task['fetch'](_0x3ca574)['then'](_0x40c9a4 => {
                    const {
                        statusCode: _0x117f4b,
                        statusCode: _0x162706,
                        headers: _0x88f323,
                        body: _0x3f259d,
                        bodyBytes: _0x4505cc
                    } = _0x40c9a4;
                    _0x4e308b(null, {
                        'status': _0x117f4b,
                        'statusCode': _0x162706,
                        'headers': _0x88f323,
                        'body': _0x3f259d,
                        'bodyBytes': _0x4505cc
                    }, _0x3f259d, _0x4505cc);
                }, _0x1060fa => _0x4e308b(_0x1060fa && _0x1060fa['error'] || 'UndefinedError'));
                break;
            case 'Node.js':
                let _0x3fda4c = require('iconv-lite');
                this['initGotEnv'](_0x3ca574);
                const {
                    url: _0x4bdaf0,
                    ..._0x27f6b8
                } = _0x3ca574;
                this['got'][_0x821796](_0x4bdaf0, _0x27f6b8)['then'](_0x16b66e => {
                    const {
                            statusCode: _0xceaecf,
                            statusCode: _0x21ccd1,
                            headers: _0x49abbd,
                            rawBody: _0x14ff66
                        } = _0x16b66e, _0x2e6add = _0x3fda4c['decode'](_0x14ff66, this['encoding']);
                    _0x4e308b(null, {
                        'status': _0xceaecf,
                        'statusCode': _0x21ccd1,
                        'headers': _0x49abbd,
                        'rawBody': _0x14ff66,
                        'body': _0x2e6add
                    }, _0x2e6add);
                }, _0x5207c0 => {
                    const {
                        message: _0x44a7fd,
                        response: _0x309dba
                    } = _0x5207c0;
                    _0x4e308b(_0x44a7fd, _0x309dba, _0x309dba && _0x3fda4c['decode'](_0x309dba['rawBody'], this['encoding']));
                });
            }
        }
        ['time'](_0x28c62a, _0x41510a = null) {
            const _0xbbb7ad = _0x41510a ? new Date(_0x41510a) : new Date();
            let _0x4485ed = {
                'M+': _0xbbb7ad['getMonth']() + 0x1,
                'd+': _0xbbb7ad['getDate'](),
                'H+': _0xbbb7ad['getHours'](),
                'm+': _0xbbb7ad['getMinutes'](),
                's+': _0xbbb7ad['getSeconds'](),
                'q+': Math['floor']((_0xbbb7ad['getMonth']() + 0x3) / 0x3),
                'S': _0xbbb7ad['getMilliseconds']()
            };
            /(y+)/['test'](_0x28c62a) && (_0x28c62a = _0x28c62a['replace'](RegExp['$1'], (_0xbbb7ad['getFullYear']() + '')['substr'](0x4 - RegExp['$1']['length'])));
            for (let _0x10703c in _0x4485ed)
                new RegExp('(' + _0x10703c + ')')['test'](_0x28c62a) && (_0x28c62a = _0x28c62a['replace'](RegExp['$1'], 0x1 == RegExp['$1']['length'] ? _0x4485ed[_0x10703c] : ('00' + _0x4485ed[_0x10703c])['substr'](('' + _0x4485ed[_0x10703c])['length'])));
            return _0x28c62a;
        }
        ['queryStr'](_0x46bfad) {
            let _0x5e329a = '';
            for (const _0x4527bb in _0x46bfad) {
                let _0x17b525 = _0x46bfad[_0x4527bb];
                null != _0x17b525 && '' !== _0x17b525 && ('object' == typeof _0x17b525 && (_0x17b525 = JSON['stringify'](_0x17b525)), _0x5e329a += _0x4527bb + '=' + _0x17b525 + '&');
            }
            return _0x5e329a = _0x5e329a['substring'](0x0, _0x5e329a['length'] - 0x1), _0x5e329a;
        }
        ['msg'](_0x6f46d5 = _0xa5c0f9, _0x442135 = '', _0x269e1c = '', _0xa87b5) {
            const _0x54107e = _0x16cc24 => {
                switch (typeof _0x16cc24) {
                case void 0x0:
                    return _0x16cc24;
                case 'string':
                    switch (this['getEnv']()) {
                    case 'Surge':
                    case 'Stash':
                    default:
                        return { 'url': _0x16cc24 };
                    case 'Loon':
                    case 'Shadowrocket':
                        return _0x16cc24;
                    case 'Quantumult\x20X':
                        return { 'open-url': _0x16cc24 };
                    case 'Node.js':
                        return;
                    }
                case 'object':
                    switch (this['getEnv']()) {
                    case 'Surge':
                    case 'Stash':
                    case 'Shadowrocket':
                    default: {
                            let _0x73be78 = _0x16cc24['url'] || _0x16cc24['openUrl'] || _0x16cc24['open-url'];
                            return { 'url': _0x73be78 };
                        }
                    case 'Loon': {
                            let _0xf6bf1f = _0x16cc24['openUrl'] || _0x16cc24['url'] || _0x16cc24['open-url'], _0x3a9eec = _0x16cc24['mediaUrl'] || _0x16cc24['media-url'];
                            return {
                                'openUrl': _0xf6bf1f,
                                'mediaUrl': _0x3a9eec
                            };
                        }
                    case 'Quantumult\x20X': {
                            let _0x40764d = _0x16cc24['open-url'] || _0x16cc24['url'] || _0x16cc24['openUrl'], _0x319c14 = _0x16cc24['media-url'] || _0x16cc24['mediaUrl'], _0x380e7d = _0x16cc24['update-pasteboard'] || _0x16cc24['updatePasteboard'];
                            return {
                                'open-url': _0x40764d,
                                'media-url': _0x319c14,
                                'update-pasteboard': _0x380e7d
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
                    $notification['post'](_0x6f46d5, _0x442135, _0x269e1c, _0x54107e(_0xa87b5));
                    break;
                case 'Quantumult\x20X':
                    $notify(_0x6f46d5, _0x442135, _0x269e1c, _0x54107e(_0xa87b5));
                    break;
                case 'Node.js':
                }
            if (!this['isMuteLog']) {
                let _0x59713b = [
                    '',
                    '==============📣系统通知📣=============='
                ];
                _0x59713b['push'](_0x6f46d5), _0x442135 && _0x59713b['push'](_0x442135), _0x269e1c && _0x59713b['push'](_0x269e1c), console['log'](_0x59713b['join']('\x0a')), this['logs'] = this['logs']['concat'](_0x59713b);
            }
        }
        ['log'](..._0x441aa9) {
            _0x441aa9['length'] > 0x0 && (this['logs'] = [
                ...this['logs'],
                ..._0x441aa9
            ]), console['log'](_0x441aa9['join'](this['logSeparator']));
        }
        ['logErr'](_0x4c8f28, _0x6be622) {
            switch (this['getEnv']()) {
            case 'Surge':
            case 'Loon':
            case 'Stash':
            case 'Shadowrocket':
            case 'Quantumult\x20X':
            default:
                this['log']('', '❗️' + this['name'] + ',\x20错误!', _0x4c8f28);
                break;
            case 'Node.js':
                this['log']('', '❗️' + this['name'] + ',\x20错误!', _0x4c8f28['stack']);
            }
        }
        ['wait'](_0x2ca089) {
            return new Promise(_0x5ce2db => setTimeout(_0x5ce2db, _0x2ca089));
        }
        ['done'](_0x1b68d9 = {}) {
            const _0x4d552f = new Date()['getTime'](), _0x549334 = (_0x4d552f - this['startTime']) / 0x3e8;
            switch (this['log']('', '🔔' + this['name'] + ',\x20结束!\x20🕛\x20' + _0x549334 + '\x20秒'), this['log'](), this['getEnv']()) {
            case 'Surge':
            case 'Loon':
            case 'Stash':
            case 'Shadowrocket':
            case 'Quantumult\x20X':
            default:
                $done(_0x1b68d9);
                break;
            case 'Node.js':
                process['exit'](0x1);
            }
        }
    }(_0xa5c0f9, _0x133302);
}