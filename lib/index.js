/**
 * Created by Administrator on 2016/11/17.
 */
const path = require('path');
const mongodb = require('mongodb');
const Level = require('lv-client');
const util = require('co-util');
const Redis = require('./redis');
const Mysql = require('./mysql');
const Err = require('./err');
const Mongo = require('./mongo');
const Http = require('./http');
const Router = require('./router');
const config = require('../config');
const send = require('koa-send');
const Static = require('koa-static');
const views = require('koa-views')

class Lib {
    use(fn) {
        if (typeof fn !== 'function') throw new TypeError('middleware must be a function!');
        fn(this);
    }

    constructor(config) {
        this._queue = [];
        // this.Router = Router;
        //this.router = new Router(config.router);
        this.load(config);
    }

    /**
     * 加载配置
     * load config file
     * {
     *      'err':{},
     *      'redis':{},
     *      'mysql':{},
     *      'mongo':{},
     * }
     */
    load(config) {
        this.debug = config.debug || true;
        let arr = [
            //{ name: 'err', fn: this.createErr },
            {name: 'level', fn: this.$level},
            {name: 'redis', fn: this.$redis},
            {name: 'mysql', fn: this.$mysql},
            {name: 'mongo', fn: this.$mongo}
        ];
        this.$err(config.err);
        this.$http(config.err);
        this.config = config;
        for (let item of arr) {
            //console.log(item)
            if (config.hasOwnProperty(item.name)) {
                item.fn.call(this, config[item.name])(this);
            }
        }
    }

    connect() {
        return Promise.all(this._queue)
    }

    $err(opts) {
        if (!opts) return;
        return Err(opts)(util);
    }

    $mysql(opts) {
        if (!opts) throw new Error('options can not be empty!');
        if (typeof opts !== 'object') throw new TypeError('options must be a object!');
        // let name = opts.name || 'mysql';
        return function (self) {
            for (let name in opts) {
                if (self.hasOwnProperty(name)) throw new Error('mysql:' + name + 'already exist in lib object!');
                self[name] = new Mysql(opts[name]);
            }
        }
    }

    $mongo(opts) {
        if (!opts) throw new Error('options can not be empty!');
        if (typeof opts !== 'object') throw new TypeError('options must be a object!');
        return function (self) {
            for (let name in opts) {
                //if (self.hasOwnProperty(name)) throw new Error('mongo:' + name + 'already exist in lib object!');
                console.log('-----', name)
                self[name] = new Mongo(opts[name]);
                self._queue.push(self[name].connect())
            }
        }
    }

    $http() {
        return Http()(util);
    }

    $redis(opts) {
        if (!opts) throw new Error('options can not be empty!');
        if (typeof opts !== 'object') throw new TypeError('options must be a object!');
        return function (self) {
            for (let name in opts) {
                if (self.hasOwnProperty(name)) throw new Error('redis:' + name + 'already exist in lib object!');
                opts[name].name = name;
                self[name] = new Redis(opts[name]);
            }
        }
    }

    $level(opts) {
        if (!opts) throw new Error('options can not be empty!');
        if (typeof opts !== 'object') throw new TypeError('options must be a object!');
        return function (self) {
            for (let name in opts) {
                if (self.hasOwnProperty(name)) throw new Error('level:' + name + 'already exist in lib object!');
                for (let server of opts[name].server) {
                    console.log(util.format('level://%s:%s/%s', server.host, server.port, name))
                }
                self[name] = new Level(opts[name]);
                self[name].on('error', err => {
                    console.log(err);
                })
                //console.log(self)

            }
        }
    }

    _setHeader(headers, ctx) {
        //console.log(headers)
        headers = headers || this.config.headers;
        if (!headers || typeof headers !== 'object') return;
        for (let key in headers) {
            ctx.res.setHeader(key, headers[key]);
        }
    }

    _setCookie(ctx) {
        let sid = ctx.cookies.get('sid');
        //console.log('sid',sid)
        if (!sid) {
            sid = util.uuid();
            ctx.cookies.set('sid', sid, {httpOnly: true});
        }
        ctx.sid = sid;
    }

    static() {
        return Static(path.join(__dirname, '../' + config.router.static))
    }

    views() {
       return views(path.join(__dirname, '../' + config.router.page), {
            map: {html: 'ejs'},
            extension: 'ejs'
        })
    }

    router(){
        return new Router(config.router).routes();
    }

    session(opts) {
        return async (ctx, next) => {
            if (ctx.request.method == 'OPTIONS') return next();
            opts = opts || {};
            opts.name = opts.name || 'level';
            this._setCookie(ctx);
            //add sess to ctx.
            //if (!ctx.sid) return next();
            if (!this[opts.name]) throw new Error('co.sess not exist.');
            let sess = await this[opts.name].sess.get(ctx.sid);
            ctx.sess = sess || {};
            //if (!sess) return next();
            await next();
            this[opts.name].sess.set(ctx.sid, ctx.sess);
        }
    }

    context(opts) {
        return async (ctx, next) => {
            this._setHeader(opts, ctx);
            ctx.err = (code) => {
                if (ctx.body) throw new Error('The ctx.body cannot repeat set value!');
                let body = util.err(code);
                //if (this.debug) console.log(ctx.request.method, ctx.url, JSON.stringify(ctx.data), JSON.stringify(body));
                ctx.body = body;
            };
            ctx.end = (data) => {
                if (ctx.body) throw new Error('The ctx.body cannot repeat set value!')
                let body = {data: data};
                //if (this.debug) console.log(ctx.request.method, ctx.url, JSON.stringify(ctx.data), JSON.stringify(body));
                ctx.body = body;
            }
            ctx.send = async (path) => {
                await send(ctx, path);
            }
            ctx.clientIp = this.getIP(ctx);

            //add err function to ctx.

            if (ctx.request.method !== 'POST') return next();
            // if (ctx.url === '/api/sess/create') {
            //     ctx.data = ctx.request.body;
            //     return next();
            // }
            // console.log('ctx.request.body', ctx.request.body)
            ctx.data = ctx.request.body;
            return next();
        }
    }

    isWeixin(userAgent) {
        if (!userAgent) return false;
        let pat = /(?=.*Android)(?=.*MicroMessenger)/i;
        return pat.test(userAgent);
    }

    getIP(ctx) {
        let str = '';
        let wx = this.isWeixin(ctx.request.header['user-agent']);
        if (wx) {
            str = ctx.request.header['x-forwarded-for-pound'] || ctx.request.header['x-real-ip'] || ctx.request.header['x-forwarded-for'] || ctx.req.connection.remoteAddress;
        } else {
            str = ctx.request.header['x-real-ip'] || ctx.request.header['x-forwarded-for'] || ctx.req.connection.remoteAddress;
        }
        return util.formatIp(str);
    }

    error() {
        return async (ctx, next) => {

            let start = new Date();
            try {
                await next();
                if (ctx.status === 404) {
                    await send(ctx, "/public/404.html");
                    ctx.status = 404;
                }
            } catch (err) {
                console.log(err);
                const status = err.status || 500;
                ctx.status = status;
                if (ctx.request.method == 'GET') {
                    if (status === 404) {
                        await send(ctx, "/public/404.html");
                    } else if (status === 500) {
                        await send(ctx, "/public/404.html");
                    }
                    return;
                }
                if (err instanceof mongodb.MongoError) return ctx.response.body = util.err(4);
                return ctx.response.body = util.err(1);
            } finally {
                const ms = new Date() - start;
                if (ctx.request.method == 'GET') {
                    if (ctx.status == 404) {
                        console.error( '[' + ctx.clientIp + ']', ctx.request.method, ctx.href, ctx.status, ms + 'ms');
                    } else {
                        console.log( '[' + ctx.clientIp + ']', ctx.request.method, ctx.href, ctx.status, ms + 'ms');
                    }
                } else {
                    //console.log(ctx.request.method, ctx.url, ctx.request.body, ctx.status, ms + 'ms', JSON.stringify(ctx.body));
                    console.log( '[' + ctx.clientIp + ']', ctx.request.method, ctx.href, JSON.stringify(ctx.data), ctx.status, ms + 'ms');
                    // JSON.stringify(ctx.body).substr(0, 200)
                }
            }
        };
    }
}

module.exports = new Lib(config);