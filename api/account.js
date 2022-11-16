const util = require('co-util');
const config = require('../config');
const com = require('../common');


class Entity {

    async sess(ctx, next) {
        let sess = ctx.sess || {};
        return ctx.end(sess.user || {})
    }

    //获取手机验证码
    async getRegSmsCode(ctx, next) {
        //先验证图片验证码
        let data = ctx.request.body || {};
        if (!data.id) return ctx.err(21);
        if (!data.captcha) return ctx.err(21);
        let match = await com.captcha.reg.match(data.id, data.captcha);
        if (!match) return ctx.err(21);
        let url = '/apiTerminalUser/sendSmsCode.do';
        console.log(url)
        let query = {
            userMobileNo: data.userMobileNo,
            userName: data.userName,
            userPwd: data.userPwd,
            userSex: data.userSex,
            callback: data.callback
        }
        console.log('query', query);
        let doc = await util.http.why(url, query).catch(e => e);
        console.log(doc)
        if (doc instanceof Error) {
            return ctx.err(25);
        }
        if (doc.status == 200) return ctx.end(doc.data);
        if (doc.data == 'repeat') return ctx.err(103);
        if (doc.data == 'third') return ctx.err(104);
        return ctx.err(25);
    }

    //注册提交
    async insert(ctx, next) {
        let data = ctx.request.body || {};
        if (util.isNullObj(data)) return ctx.err(105);
        let url = '/apiTerminalUser/saveUser.do';
        let query = {
            userMobileNo: data.userMobileNo,
            userName: data.userName,
            userPwd: data.userPwd,
            code: data.code,
            userSex: data.userSex,
            userId: data.userId,
        }

        let doc = await util.http.why(url, query).catch(e => e);

        if (doc instanceof Error) {
            return ctx.err(6);
        }
        if (doc.status != 200) {
            return ctx.err(105);
        }

        ctx.sess.user = {
            userId: doc.data.userId,
            userName: doc.data.userName,
            userMobileNo: doc.data.userMobileNo,
        }
        ctx.end(true);
    }

    //登入
    async login(ctx, next) {
        let data = ctx.request.body || {};
        if (util.isNullObj(data)) return ctx.err(23);
        let url = '/apiTerminalUser/login.do';
        let query = {
            userName: data.userName,
            userPwd: data.userPwd,
            callback: data.callback,
        }

        console.log('query', query);
        let result = await util.http.why(url, query).catch(e => e);
        console.log('login--->', result)
        if (result instanceof Error) {
            return ctx.err(6);
        }
        if (result.status != 200) return ctx.err(6);

        console.log('用户登入', result.data)

        ctx.sess.user = {
            userId: result.data.userId,
            userName: result.data.userName,
            userNickName: result.data.userNickName,
            userMobileNo: result.data.userMobileNo,
            userType: result.data.userType,
            userHeadImgUrl: result.data.userHeadImgUrl,
            userCardNo: result.data.userCardNo
        }
        ctx.end(ctx.sess.user);
    }

    //获取忘记密码手机验证码
    async getForgetCode(ctx, next) {
        let data = ctx.request.body || {};
        let url = '/apiTerminalUser/sendForgetCode.do';
        let query = {
            userMobileNo: data.userMobileNo,
        }
        console.log(url);
        console.log('query', query);
        let doc = await util.http.why(url, query).catch(e => e);
        console.log(doc)
        if (doc instanceof Error) {
            return ctx.err(6);
        }
        if (doc.status != 200) return ctx.err(6);
        ctx.end(true);
    }

    //提交忘记密码手机验证码
    async matchForgetCode(ctx, next) {
        let data = ctx.request.body || {};
        let url = '/apiTerminalUser/valForgetCode.do';
        let query = {
            userMobileNo: data.userMobileNo,
            code: data.code,
        }
        console.log('匹配', url, query);
        let doc = await util.http.why(url, query).catch(e => e);
        console.log(doc)
        if (doc instanceof Error) return ctx.err(6);
        if (doc.status != 200) return ctx.err(6);
        //假定通过验证
        ctx.sess.userIdForResetPwd = doc.data;
        // return res.body = true;
        // if (result instanceof Error) {
        //     return ctx.err(6);
        // }
        // //if (result.result !== 'success') return ctx.err(6);
        ctx.end(true);
    }

    //忘记密码重置密码
    async resetPwd(ctx, next) {
        if (!ctx.sess.userIdForResetPwd) return ctx.err(101);
        let data = ctx.request.body || {};
        let url = '/apiTerminalUser/userModifyPwd.do';
        let query = {
            userId: ctx.sess.userIdForResetPwd,
            userPwd: data.userPwd,
        }
        //console.log('query', query);
        let doc = await util.http.why(url, query).catch(e => e);
        //console.log(doc)
        if (doc instanceof Error) return ctx.err(6);
        if (doc.status != 200) return ctx.err(6);
        ctx.end(true);
    }

    //修改用户信息
    async updateUserInfo(ctx, next) {
        if (!ctx.sess.user || !ctx.sess.user.userId) return ctx.err(101);
        let data = ctx.request.body || {};
        if (util.isNullObj(data)) return ctx.err(23);
        let url = 'apiTerminalUser/editTerminalUser.do';
        let query = {
            userId: ctx.sess.user.userId,
            userSex: data.userSex,
            userName: data.userName,
            userHeadImgUrl: data.userHeadImgUrl,
        }
        console.log('query', query);
        let result = await util.http.why(url, query).catch(e => e);
        //console.log('login--->',result)
        if (result instanceof Error) {
            return ctx.err(6);
        }
        if (result.status != 200) return ctx.err(6);

        ctx.sess.user.userName = data.userName;
        ctx.sess.user.userHeadImgUrl = data.userHeadImgUrl;
        console.log(ctx.sess.user, data.userHeadImgUrl)
        ctx.end(true);
    }

    //修改旧密码
    async changePwd(ctx, next) {
        if (!ctx.sess.user || !ctx.sess.user.userId) return ctx.err(101);
        let data = ctx.request.body || {};
        if (util.isNullObj(data)) return ctx.err(23);
        let url = '/apiTerminalUser/login.do';
        let query = {
            userName: ctx.sess.user.userMobileNo,
            userPwd: data.oldPwd,
        }
        //console.log('query', query);
        let result = await util.http.why(url, query).catch(e => e);
        //console.log(result)
        if (result instanceof Error) {
            return ctx.err(101);
        }
        if (result.status != 200) return ctx.err(101);

        url = '/apiTerminalUser/userModifyPwd.do';
        query = {
            userId: ctx.sess.user.userId,
            userPwd: data.newPwd,
        }

        let doc = await util.http.why(url, query).catch(e => e);
        //console.log(doc)
        if (doc instanceof Error) {
            return ctx.err(101);
        }
        if (doc.status != 200) return ctx.err(101);

        ctx.end(ctx.sess.user);
    }

    //logout
    async logout(ctx, next) {
        if (ctx.sess && ctx.sess.user) ctx.sess.user = null;
        ctx.end(true);
    }
}

module.exports = new Entity();
