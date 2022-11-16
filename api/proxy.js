const util = require('co-util');
const config = require('../config');

class Entity {
    async why(ctx, next) {
        let data = ctx.request.body || {};
        let url = data._url;
        delete data._url;
        let doc = await util.http.why(url, data).catch(e => e);
        //console.log(doc)
        if (doc instanceof Error) {
            return ctx.body = util.err(6)
        }

        if (doc.status != 200) {
            let obj = util.err(6);
            obj.data = doc;
            ctx.body = obj;
            return;
        }
        ctx.body = doc;
    }

    async new(ctx, next) {
        let data = ctx.request.body || {};
        let url = data._url;
        delete data._url;
        let doc = await util.http.new(url, data).catch(e => e);
        //console.log(doc)
        if (doc instanceof Error) {
            return ctx.body = util.err(6)
        }

        if (doc.status != 200) {
            let obj = util.err(6);
            obj.data = doc;
            ctx.body = obj;
            return;
        }
        ctx.body = doc;
    }

    async gateway(ctx, next) {
        let data = ctx.request.body || {};
        let url = data._url;
        delete data._url;
        let doc = await util.http.gateway(url, data).catch(e => e);
        if (doc instanceof Error) {
            return ctx.body = util.err(6)
        }
        if (doc.status != 200) {
            let obj = util.err(6);
            obj.data = doc;
            ctx.body = obj;
            return;
        }
        ctx.body = doc;
    }

    async china(ctx, next) {
        let data = ctx.request.body || {};
        let url = data._url;
        delete data._url;
        let doc = await util.http.china(url, data).catch(e => e);
        if (doc instanceof Error) {
            return ctx.body = util.err(6)
        }
        // if (doc.status != 200) {
        //     let obj = util.err(6);
        //     obj.data = doc;
        //     ctx.body = obj;
        //     return;
        // }
        ctx.body = doc;
    }
}

module.exports = new Entity();
