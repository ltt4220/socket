'use strict'
const config = require('../config');
const util = require('co-util');


function Http() {
    return function (_util) {
        _util.http.why = function (url, data) {
            if (!url.startsWith('/')) url = '/' + url;
            if (!/^http[s]*:\/\/(.*?)/i.test(url)) {
                url = config.system.why + url;
            }
            //const sp = {shopProvince: config.system.shopProvince, shopPath: config.system.shopPath}
            const sp = {shopPath: config.system.shopPath}
            data = util.merge(sp, data);

            let h = {
                'Content-Type': 'application/x-www-form-urlencoded',
                'languageType':config.system.language,
                'sysPlatform': 'wap'
            }
            // util.extend(h, sp)
            let start = new Date();
            return util.http.post(url, data, h).then((res) => {
                const ms = new Date() - start;
                console.log('why', url, JSON.stringify(data), ms + 'ms')
                return res;
            }).catch(err=>{
                const ms = new Date() - start;
                console.error('why', url, JSON.stringify(data), ms + 'ms')
                return err;
            });
        }
        _util.http.new = function (url, data) {
            if (!url.startsWith('/')) url = '/' + url;
            if (!/^http[s]*:\/\/(.*?)/i.test(url)) {
                url = config.system.new + url;
            }
            //const sp = {shopProvince: config.system.shopProvince, shopPath: config.system.shopPath}
            const sp = {shopPath: config.system.shopPath}
            data = util.merge(sp, data);

            let h = {
                'Content-Type': 'application/x-www-form-urlencoded',
                'languageType':config.system.language,
                'sysPlatform': 'wap'
            }
            // util.extend(h, sp)
            let start = new Date();
            return util.http.post(url, data, h).then((res) => {
                const ms = new Date() - start;
                console.log('new', url, JSON.stringify(data), ms + 'ms')
                return res;
            }).catch(err=>{
                const ms = new Date() - start;
                console.error('new', url, JSON.stringify(data), ms + 'ms')
                return err;
            });
        }
        _util.http.gateway = function (url, data) {
            if (!url.startsWith('/')) url = '/' + url;
            if (!/^http[s]*:\/\/(.*?)/i.test(url)) {
                url = config.system.gateway + url;
            }
            const sp = {shopProvince: config.system.shopProvince, shopPath: config.system.shopPath}
            data = util.merge(sp, data);

            let h = {
                'Content-Type': 'application/json',
                'languageType':config.system.language,
                'sysPlatform': 'wap'
            }
            util.extend(h, sp)
            let start = new Date();
            return util.http.post(url, data, h).then((res) => {
                const ms = new Date() - start;
                console.log('gateway', url, JSON.stringify(data), ms + 'ms')
                return res;
            }).catch(err=>{
                const ms = new Date() - start;
                console.error('why', url, JSON.stringify(data), ms + 'ms')
                return err;
            });
        }
        _util.http.china = function (url, data) {
            if (!url.startsWith('/')) url = '/' + url;
            if (!/^http[s]*:\/\/(.*?)/i.test(url)) {
                url = config.system.china + url;
            }
            const sp = {}
            data = util.merge(sp, data);

            let h = {
                'Content-Type': 'application/json',
                //'languageType':config.system.language,
                'sysPlatform': 'wap'
            }
            util.extend(h, sp)
            let start = new Date();
            return util.http.post(url, data, h).then((res) => {
                const ms = new Date() - start;
                console.log('china', url, JSON.stringify(data), ms + 'ms')
                return res;
            }).catch(err=>{
                const ms = new Date() - start;
                console.error('china', url, JSON.stringify(data), ms + 'ms')
                return err;
            });
        }
    }
}

module.exports = Http;
