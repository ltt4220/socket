module.exports = {
    level: {
        server: [{
            host: '106.54.17.9',//正式
            // host: '139.224.12.64',//测试
            port: 7773
        } ],
        min: 2,
        max: 5,
        password: '53467c76cf4dc30b',
        collections: [ {
            prefix: 'sess:',
            name: 'sess',
            ttl: 30 * 60
        }, {
            prefix: 'captcha:',
            name: 'captcha',
            ttl: 300
        }, {
            prefix: 'down:',
            name: 'down',
            ttl: 30 * 60
        } ]
    }
}