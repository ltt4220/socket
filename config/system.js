const util = require('co-util');
const configP = {
    version: '1.0.1',
    port: 8250,
    shopProvince: 'sh',
    shopPath: 'shqyg',
    language:'cn',
    why: 'https://www.wenhuayun.cn',
    new: 'http://shqygst.wenhuayun.cn',
    china: 'https://china.wenhuayun.cn',
    gateway: 'https://gateway.wenhuayun.cn',
    pdf: 'http://pdf.ctwenhuayun.cn',
    pay: 'https://whym.wenhuayun.cn',
    key: 'd7f6822a8a52a4c4'
}

const configD = {
    version: '1.0.1',
    port: 8250,
    shopProvince: 'sh',
    shopPath: 'shqyg',
    language:'cn',
    why: 'https://eme.wenhuayun.cn',
    new: 'http://emeshqygst.wenhuayun.cn',
    china: 'https://emechina.wenhuayun.cn',
    gateway: 'https://emegateway.wenhuayun.cn',
    pdf: 'http://pdf.ctwenhuayun.cn',
    pay: 'http://meme.wenhuayun.cn',
    key: 'd7f6822a8a52a4c4'
}

let env = 'dev';
if (process.env.NODE_ENV) {
    env = process.env.NODE_ENV.toLowerCase();
    env = util.trim(env);
}
console.log('当前是环境:', env)
module.exports = (env == 'prod' ? configP : configD);


