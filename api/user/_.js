
class Entity {
    async init(ctx, next) {
        return next();
    }
}

module.exports = new Entity();
