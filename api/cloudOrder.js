const util = require('co-util');
const config = require('../config');
//const com = require('../common');

const lib = require('../lib');

class Entity {
    async detail(ctx, next) {
        let data = ctx.request.body || {};
        if (util.isNullObj(data)) return ctx.err(110);
        let url = '/apiPeriodicalPc/periodicalDetail.do';
        let query = {
            id: data.id,
            userId:data.userId
        }

        console.log('query',query);
        //if (ctx.sess && ctx.sess.user) query.userId = ctx.sess.user.userId;
        let doc = await util.http.new(url, query).catch(e => e);
        console.log('order detail', doc);

        if (doc instanceof Error) {
            return ctx.err(6);
        }
        if (doc.status != 200) {
            return ctx.err(111);
        }
        doc.data.colunms=doc.data.colunms||[];
        for (let row of doc.data.colunms) {
            for (let art of row.articleList) {
                let pdf = '';
                //免费 or 已付
                //art.state = 1
                if (art.articlePrice == 0 || art.state == 1) pdf = art.articlePdf;
                if (!pdf) {
                    art.articlePdf = '';
                    continue;
                }
                let key = util.uuid();
                let obj = {
                    bid: data.bid,
                    use: 0,
                    time: new Date().getTime(),
                    url: pdf
                };
                lib.level.down.set(key, obj);
                art.articlePdf = util.format('%s/pdf/viewer.html?file=%s', config.system.pdf, key);
            }
        }
        console.log(JSON.stringify(doc))
        ctx.end(doc);
    }

}

module.exports = new Entity();
