const util = require('co-util');
const lib = require('../lib');
const lv = lib.level;
const com = require('../common');
class Entity {
    async get(ctx, next) {
        let doc = await com.captcha.reg.build();
         return ctx.end(doc)
    }
}

module.exports = new Entity();
