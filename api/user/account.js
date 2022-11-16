const util = require('co-util');

class Entity {
    async sess(ctx, next) {
        return ctx.end({aa:21111})
        let sess = ctx.sess || {};
        return ctx.end(sess.user||{})
    }
}

module.exports = new Entity();
