/**
 * Created by zhanglei on 2016/9/30.
 * Modified by zhanglei on 2018/8/13
 *
 */
"use strict";
const path = require('path');
const util = require('co-util');
const config = require('../config');
class Entity {
    //构造函数
    constructor() {

    }

    async build() {
        let src = path.join(__dirname, '../public/js/_co.js');
        let dist = path.join(__dirname, '../public/js/co.js');
        let doc = await util.fs.readFile(src).catch(e => e);
        if (doc instanceof Error) {
            console.error('open file error:' + src);
            return;
        }
        doc = doc.toString();
        doc = doc.replace(/\{\$china\}/gi, config.system.china);
        doc = doc.replace(/\{\$shopPath\}/gi, config.system.shopPath);
        doc = doc.replace(/\{\$pay\}/gi, config.system.pay);
        doc = doc.replace(/\{\$why\}/gi, config.system.why);

        let res=await util.fs.writeFile(dist,doc).catch(e => e);
        if (doc instanceof Error) {
            console.error('write file error:' + dist);
            return;
        }
        //console.log('src', doc);
    }
}

module.exports = new Entity();
