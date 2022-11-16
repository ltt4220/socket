const path = require('path');
const util = require('co-util');
const router = require('koa-router')();
const config = require('../config');

class Entity {
    constructor(opts) {
        this.opts = opts;
    }

    routes() {
        // if (this.opts.hasOwnProperty('page')) {
        //     this.init();
        //     this.setPage();
        // }
        if (this.opts.hasOwnProperty('api')) {
            this.setApi();
        }
        router.get('/*', async (ctx, next) => {
            // let url=ctx.url.substr(config.system.shopPath.length+1);
            // ctx.response.redirect(url)
            ctx.body=`
            
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no, user-scalable=no, maximum-scale=1.0, minimum-scale=1.0">
    <title>系统维护</title>
    <link rel="stylesheet" href="https://culturestore.oss-cn-shanghai.aliyuncs.com/normalize/normalize.css">

    <script type="text/javascript">
        (function () {
            var phoneWidth = parseInt(window.screen.width);
            var phoneScale = phoneWidth / 750;
            var ua = navigator.userAgent; //浏览器类型
            if (/Android (\\d+\\.\\d+)/.test(ua)) { //判断是否是安卓系统
                var version = parseFloat(RegExp.$1); //安卓系统的版本号
                if (version > 2.3) {
                    document.write('<meta name="viewport" content="width=750, minimum-scale = ' + phoneScale +
                        ', maximum-scale = ' + phoneScale + ', target-densitydpi=device-dpi">');
                } else {
                    document.write('<meta name="viewport" content="width=750, target-densitydpi=device-dpi">');
                }
            } else {
                document.write(
                    '<meta name="viewport" content="width=750, user-scalable=no, target-densitydpi=device-dpi">'
                );
            }

        }());
    </script>
    <style>
        div {
            text-align: center;
            position: absolute;
            left: 50%;
            top: 50%;
            transform: translate(-50%, -50%);
            font-size: 30px;
        }
    </style>
</head>
<body>

<div >
    非常抱歉，今晚21：00-23：00系统维护升级，暂时不能订票，升级之后可继续订票，不影响之前订单。
</div>
</body>
</html>

            `
        });
        return router.routes();
    }

    init() {
        router.get('/' + config.system.shopPath + '/*', async (ctx, next) => {
            let url=ctx.url.substr(config.system.shopPath.length+1);
            ctx.response.redirect(url)
            return;
        });
    }

    async setPage() {
        let folder = path.join(__dirname, '../' + this.opts.page);
        let files = await util.fs.ll(folder);
        this.setPageFolder(files);
    }

    setPageFolder(files) {
        if (!files || files.length == 0) return;
        for (let file of files) {
            if (file.isDir) {
                this.setPageFolder(file.childs);
                continue;
            }
            if(file.path.endsWith('/index.ejs')){
                router.get(file.path.replace(/index\.ejs$/, '/'), async (ctx, next) => {
                    await ctx.render(file.path.replace(/^\//, ''));
                });
            }
            router.get(file.path.replace(/\.ejs$/, '.html'), async (ctx, next) => {
                await ctx.render(file.path.replace(/^\//, ''));
            });
        }
    }

    async setApi() {
        let folder = path.join(__dirname, '../' + this.opts.api);
        let files = await util.fs.ll(folder);
        this.setApiFolder(files);
    }

    setApiFolder(files) {
        if (!files || files.length == 0) return;
        let index = util.findIndex(files, {filename: '_.js'});
        if (index != -1) {
            let all = files[index];
            let url_all = '/' + this.opts.api + all.path;
            url_all = url_all.replace(/_\.js$/, '*');
            let m_all = require(all.fullname);
            if (m_all.init) {
                router.post(url_all, m_all.init);
            }
            files.splice(index, 1);
        }
        for (let file of files) {
            if (file.isDir) {
                this.setApiFolder(file.childs);
                continue;
            }
            let url = '/' + this.opts.api + file.path;
            if (!url.endsWith('.js')) continue;
            let m = require(file.fullname);
            url = url.replace(/\.js$/, '/');
            let props = Object.getOwnPropertyNames(Object.getPrototypeOf(m));
            for (let pn of props) {
                if (pn === 'constructor') continue;
                if (pn.startsWith('_')) continue;
                if (pn === 'init') {
                    router.post(url + '*', m[pn]);
                    continue;
                }
                router.post(url + pn, m[pn]);
            }
        }
    }
}

module.exports = Entity;



