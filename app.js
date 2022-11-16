const Koa = require('koa')
const app = new Koa()
const router = require('koa-router')();
const bodyparser = require('koa-bodyparser')
const util = require('co-util');
const lib = require('./lib');
const config = require('./config');

const com = require('./common');
require('co-log')(config.log);
// middlewares
app.use(bodyparser({
    enableTypes: ['json', 'form', 'text']
}))

// app.use(lib.static());
// app.use(lib.views());
app.use(lib.error());
app.use(lib.context());
//app.use(lib.session());
app.use(lib.router());
app.use(router.allowedMethods());
app.on('error', (err, ctx) => {
    console.log(err);
    ctx.end({end: true})
});

// lib.level.captcha.set('aaaa', {a: 2,c:"22"})
// lib.level.captcha.get('aaaa').then(res=>console.log(res))

module.exports = app;
