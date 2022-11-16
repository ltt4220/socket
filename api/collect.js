const util = require('co-util');
const lib = require('../lib');
const lv = lib.level;
const com = require('../common');

function getFindUrl(type) {
    switch (type) {
        case 'activity':
            //收藏活动
            return '/apiUser/webUserCollectActivity.do';
        case 'train':
            // 收藏的培训
            return '/apiTrain/collectTrain.do';
        default :
            //收藏场馆
            return '/apiUser/webUserCollectVenue.do';
    }
}

class Entity {
    async init(ctx, next) {
        if (!ctx.sess.user || !ctx.sess.user.userId) return ctx.err(101);
        return next();
    }
    async find(ctx,next) {
        let data = ctx.request.body || {};
        let query = {
            userId: ctx.sess.user.userId,
            page: data.page.current,
            pageNum: data.page.size
        }
        let url;
        if (data.type == 'activity') {
            url = '/apiUser/webUserCollectActivity.do';
        } else if (data.type == 'train') {
            url = '/apiTrain/collectTrain.do';
        } else {
            url = '/apiUser/webUserCollectVenue.do';
        }
        let doc = await util.http.why(url, query).catch(e => e);

        if (doc instanceof Error) {
            return ctx.err(6);
        }
        let rows = [];
        doc.data.forEach((d) => {
            if (data.type == "activity") {
                rows.push({
                    id: d.activityId,
                    name: d.activityName,
                    time: d.activityStartTime,
                    img: d.activityIconUrl
                })
            } else if (data.type == "train") {
                rows.push({
                    id: d.id,
                    name: d.trainTitle,
                    registrationStartTime: d.registrationStartTime,
                    registrationEndTime: d.registrationEndTime,
                    trainStartTime: d.trainStartTime,
                    trainEndTime: d.trainEndTime,
                    img: d.trainImgUrl
                })
            } else {
                rows.push({
                    id: d.venueId,
                    name: d.venueName,
                    time: d.venueAddress,
                    img: d.venueIconUrl
                })
            }
        })
        let obj = {
            rows: rows,
            total: typeof doc.page == 'undefined' ? doc.pageTotal : doc.page.total
        }
       ctx.end(obj);
    }

    async cancel(ctx,next) {
        let data = ctx.request.body || {};
        let query, url;
        if (data.type == 'activity') {
            query = {
                //userId: 'fa8de05c1837456db53ef31d7e243998',
                userId: ctx.sess.user.userId,
                activityId: data.id
            }
            url = '/apiCollect/delCollectActivity.do';

        } else if (data.type == 'train') {
            query = {
                userId: ctx.sess.user.userId,
                relateId: data.id,
                type: 10
            }
            url = '/apiCollect/userDeleteCollect.do';
        } else {
            query = {
                //userId: 'fa8de05c1837456db53ef31d7e243998',
                userId: ctx.sess.user.userId,
                venueId: data.id
            }
            url = '/apiCollect/wcDelCollectVenue.do';
        }


        //console.log(url)
        let doc = await util.http.why(url, query).catch(e => e);
        if (doc instanceof Error) {
            return ctx.err(6);
        }
        if (!doc || doc.status != 200) return ctx.err(106);
        ctx.end(true);
    }
}

module.exports = new Entity();





