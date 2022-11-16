/**
 * Created by zhanglei on 2016/9/30.
 * Modified by zhanglei on 2018/8/13
 *
 */
"use strict";
const path = require('path');
const Canvas = require('canvas');
const util = require('co-util');
const lib=require('../lib');
 const lv = lib.level;
const {createCanvas, loadImage, registerFont} = require('canvas')

//const canvas = createCanvas(200, 200)

class Captcha {
    //构造函数
    constructor(option) {
        this.option = option || {};
        this.option.expire = this.option.expire || 300; //秒
        this.option.width = this.option.width || 130;
        this.option.height = this.option.height || 50;
        this.option.fontsize = this.option.fontsize || 36;
        this.option.font = this.option.font || util.format('bold italic %spx creatoo', this.option.fontsize.toString());
        this.option.fontcolor = this.option.fontcolor || '#0000ff';
        this.option.bgcolor = this.option.bgcolor || '#F9FDEE';
        this.option.bordercolor = this.option.bordercolor || '#F0FFE5';
        this.option.length = this.option.length || 4;
    }

    async build() {
        let canvas = createCanvas(this.option.width, this.option.height)
            , ctx = canvas.getContext('2d');
        registerFont(path.join(__dirname, '../public/font/msyhbd.ttc'), {family: 'creatoo'});

        ctx.font = this.option.font
        //ctx.font = '12px "Comic Sans"';
        //背景
        ctx.fillStyle = this.option.bgcolor;
        ctx.fillRect(1, 1, this.option.width - 2, this.option.height - 2);
        //边框色
        ctx.strokeStyle = this.option.bordercolor;
        ctx.strokeRect(1, 1, this.option.width - 2, this.option.height - 2);
        let s = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let str = '';
        for (let i = 0; i < this.option.length; i++) {
            str += s.substr(parseInt(Math.random() * s.length), 1);
        }
        let start = 10;
        for (let i = 0; i < str.length; i++) {
            let _tew = ctx.measureText(str[i]).width;
            ctx.save();
            ctx.fillStyle = this.option.fontcolor;
            ctx.translate(start, this.option.height * 0.8);
            let rnd = util.random(-40, 40);
            let a = rnd / 100;
            ctx.rotate(a);
            ctx.fillText(str[i], 0, 0);
            ctx.rotate(-a);
            ctx.translate(-start, -this.option.height * 0.8);
            ctx.restore();
            start += _tew - 4;
        }

        //console.log('code',str);
        let url;
        //,val=await utility.saltEncrypt(str);
        let id = util.uuid();
        let flag = await lv.captcha.set(id, {code: str, check: 0}, this.option.expire).catch(e => e);
        if (flag instanceof Error) {
            console.log('captcha:build()', flag);
            return util.err(6);
        }
        if (!flag) return util.err(6);

        try {
            url = await canvas.toDataURL();
        } catch (err) {
            console.log('captcha:build()', err);
            return err;
        }
        return {id: id, url: url};
    }

    //提交后匹配用
    async match(id, value) {
        let val = await lv.captcha.get(id);
        lv.captcha.remove(id);
        if (!val || !val.code) return false;
        let iscap = (value.toUpperCase() == val.code.toUpperCase());
        if (!iscap) return false
        //redis.remove(id);
        return true;
    }

    //异步验证用
    async check(id, value) {
        //let id = ctx.form.id, value = ctx.form.value;
        let val = await lv.captcha.get(id);
        if (!val || !val.code) {
            //重新分配验证码
            let o = util.err(22);
            o.data = await this.build();
            return o;
        }
        val.check = val.check || 0;
        if (val.check >= 3) {
            lv.captcha.remove(id);
            //重新分配验证码
            let o = util.err(22);

            o.data = await this.build();
            return o;
        }
        val.check += 1;
        await lv.captcha.set(id, val, this.option.expire);
        let res = (value.toUpperCase() == val.code.toUpperCase());
        if (!res) {
            if (val.check >= 3) {
                lv.captcha.remove(id);
                //重新分配验证码
                let o = util.err(22);
                o.data = await this.build();
                return o;
            }
            return {data: false};
        }
        return {data: true};
    }
}

exports.admin = new Captcha();
exports.reg = new Captcha({bgcolor: "#FCFCFC", bordercolor: "#79AF3D", height: 44, width: 113});
