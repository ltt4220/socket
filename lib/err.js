'use strict'
let util = require('co-util');

function Err(opts) {
    return (lib) => {
        if (lib.err) return;

        lib.err = function (code) {
            let arr = [];
            if (arguments && arguments.length > 1) {
                for (var i = 0, len = arguments.length; i < len; i++) {
                    if (i > 0) arr.push(arguments[i]);
                }
            }
            if(!util.isInt(code)) throw new Error('the code must be a number');
            //code = util.toInt(code);
            var errMsg = opts[code];
            errMsg = !errMsg ? "error code is not exist." : errMsg;
            return {
                err: code,
                msg: util.format(errMsg, ...arr)
            };
        }

    }

}

module.exports = Err;
