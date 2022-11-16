/**
 * Created by 夜孤城 on 2016/8/5.
 */
"use strict";
var redis = require("redis"),
    //config=require("../config"),
    util = require("co-util");

class Redis {
    /**
     * 构造函数,var redis=new Redis({port:3306,host:"127.0.0.1",db:3,prefix:"sess:"});
     * @param {Object} option选项，json对象如:{port:3306,host:"127.0.0.1",db:3,prefix:"sess:",expire:30*60},db:3 等同于this.client.select(3),选择第db3库
     *                 expire:过期时间，单位秒，如果设置了过期时间，每次get/set时，将自动延长过期时间，如果需要手动设置，请自行调用。
     * @api public
     */
    constructor(opts) {
        this._opts = opts;
        this._opts.db = this._opts.db || 0;
        this._opts.prefix = this._opts.prefix || '';
        let option = {
            port: this._opts.port,
            host: this._opts.host,
            db: this._opts.db,
            prefix: this._opts.prefix
        };
        if (this._opts.password) option.password = this._opts.password;
        this.client = redis.createClient(option);
        //console.log(option)
        console.log('redis://%s:%s/%s', option.host, option.port,this._opts.name)
        this.client.on("error", (err) => {
            console.log(err)
        });
    }

    /**
     * get，根据key获取文档
     * @param {String} key
     * @return 返回一个json对象
     * @api public
     */
    get(key) {
        return new Promise((resolve, reject) => {
            this.client.get(key, (err, res) => {
                if (err) {
                    console.log("redis:get('" + key + "')\n", err);
                    reject(err);
                } else {
                    if (!res) return resolve(null);
                    //this.expire(key, this._opts.expire);
                    resolve(JSON.parse(res));
                }
            });
        });
    }

    /**
     * set，修改插入文档
     * @param {String} key
     * @param {String} value 为json对象
     * @return 返回一个boolean类型，true|false
     * @api public
     */
    set(key, value, expire) {
        return new Promise((resolve, reject) => {
            if (typeof value != "object") {
                console.log("value必须是一个object对象");
                throw new Error('value必须是一个object对象');
            }
            let args = [];
            value = JSON.stringify(value);
            args.push(key);
            args.push(value);
            expire = expire || this._opts.expire;
            if (expire) {
                args.push('EX');
                args.push(expire);
            }
            args.push((err, res) => {
                if (err) {
                    console.log(err);
                    reject(err);
                } else {
                    resolve(res == "OK");
                }
            });
            this.client.set(...args);
        })
    }

    /**
     * remove，删除文档
     * @param {String} key
     * @return {Boolean} 返回一个boolean类型，true|false
     * @api public
     */
    remove(key) {
        return new Promise((resolve, reject) => {
            this.client.del(key, (err, res) => {
                //res返回删除数
                if (err) {
                    console.log(err);
                    reject(err);
                } else {
                    resolve(res > 0);
                }
            });
        })
    }

    /**
     * randomkey，随机一个key
     * @return {String} 返回一个key
     * @api public
     */
    randomkey() {
        return new Promise((resolve, reject) => {
            this.client.randomkey((err, key) => {
                if (err) {
                    console.log("redis:randomkey()", err);
                    reject(err);
                }
                else
                    resolve(key);
            });
        })
    }

    /**
     * random，随机一个文档
     * @return {Object} 返回一个json文档
     * @api public
     */
    random() {
        return new Promise((resolve, reject) => {
            this.randomkey().then((key) => {
                if (!key) return resolve(null);
                this.get(key).then((res) => {
                    res = res || {};
                    res.key = key;
                    return res;
                })
            });
        })
    }

    /**
     * expire，设置过期时间
     * @param {String} key
     * @param {Int} seconds 几秒后过期
     * @api public
     */
    expire(key, seconds) {
        return new Promise((resolve, reject) => {
            seconds = seconds || this._opts.expire;
            console.log('seconds', seconds);
            if (!seconds) return resolve(false);
            seconds = util.toInt(seconds);
            if (seconds <= 0) resolve(false);
            this.client.expire(key, seconds, (err) => {
                if (err) {
                    console.log("redis:expire('" + key + "'," + seconds + ")", err);
                    reject(err);
                } else {
                    resolve(true);
                }
            });
        })
    }

    /**
     * count，总数
     * @return {Int} 返回总数
     * @api public
     */
    count() {
        return new Promise((resolve, reject) => {
            this.client.dbsize((err, res) => {
                if (err) {
                    console.log("redis:count()", err);
                    reject(err);
                } else {
                    resolve(res || 0);
                }
            });
        })
    }    
}

module.exports = Redis;




