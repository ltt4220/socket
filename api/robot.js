const util = require('co-util');
const config = require('../config');
const com = require('../common');
const socket = require('../common/socket');

function sendMessage(item) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            socket.sendForRobot(item)
            return resolve(true)
        }, 500)
    })
}

class Entity {
    async send(ctx, next) {
        let query = ctx.request.body || {};
        //messages:[{rid:'room1',username:'名称',msg:'内容'}]
        if (!query.messages || query.messages.length == 0) return ctx.err(44);
        for (let item of query.messages) {
            if (!item.rid) return ctx.err(45);
            if (!item.username) return ctx.err(46);
            if (!item.msg) return ctx.err(47);
            await sendMessage({rid: item.rid, username: item.username, msg: item.username});
        }

        return ctx.end({})
    }

}

module.exports = new Entity();
