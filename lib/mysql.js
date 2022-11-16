/**
 * Created by Codeorg.com on 2016/9/23.
 * 有待优化
 * 1.大于小于
 * 2.or查询
 */
"use strict";
let mysql = require('mysql');
let util = require('co-util');
//let log=require('./log');

class Mysql {
    /**
     * 构造函数,var mysql=new Mysql(_opts);
     * @param {Object} option选项，json对象如:{port:3306,host:"127.0.0.1",user: 'root', password: '1',database: 'f5'}
     * @api public
     */
    constructor(option) {
        //console.log("_opts",_opts.collections)
        this.conn = option.conn;
        this.collections = option.collections;
        if (!this.conn) {
            this.pool = mysql.createPool({
                port: option.port,
                host: option.host,
                user: option.user,
                password: option.password,
                database: option.database,
                //connectionLimit: 100,
                //connectTimeout: 600000,
                //acquireTimeout: 600000
            });
            console.log('mysql://%s:%s/%s', option.host, option.port, option.database);

            this.pool.on('error', function (err) {
                console.log('-----error')
                console.log(err)
            })

        }
        let methods = {
            find: this.find,
            findOne: this.findOne,
            page: this.page,
            findPage: this.findPage,
            insert: this.insert,
            inserts: this.inserts,
            update: this.update,
            remove: this.remove,
            exist: this.exist,
            scaler: this.scaler,
            max: this.max,
            min: this.min,
            count: this.count,
            sum: this.sum
        };
        let collections = option.collections;
        var command = (function (self, collection, fn) {
            return function () {
                var args = [];
                args.push(collection);
                for (var i in arguments) {
                    args.push(arguments[i]);
                }
                return fn.apply(self, args);
            }
        });
        let cmd = (collection) => {
            var objCmd = {};
            for (var key in methods) {
                objCmd[key] = new command(this, collection, methods[key])
            }
            return objCmd;
        }
        for (var i in collections) {
            this[collections[i]] = cmd(collections[i]);
        }
    }

    escapeId(id) {
        return mysql.escapeId(id)
    }

    escape(value) {
        return mysql.escape(value)
    }
    /**
     * 执行sql语句，存储过程
     * @param {String} 1.sql字符串，2.存储过程：call fn(IN,OUT)
     * @param {Function} cb回调函数
     * @api public
     */
    exec(sql) {
        console.log(sql)
        //timeout: 40000 40秒
        return new Promise((resolve, reject) => {
                if (!this.conn) {
                    this.pool.query(sql, (err, result) => {
                        if (err) {
                            console.log(sql, err);
                            reject(err);
                        } else {
                            resolve(result)
                        }
                    });
                } else {
                    //有事务
                    this.conn.query(sql, (err, result) => {
                        if (err) {
                            console.log('sql:' + sql, err);
                            this.conn.rollback(() => {
                                this.conn.release();
                                reject(console.err(4));
                            });
                        } else {
                            resolve(result)
                        }
                    });
                }

            }
        )
    }

    /**
     * find，查询数据
     * @param {String} table表名
     * @param {Object|Array} con条件,接受json和array,当为json对象时，如：{id:1,username:'夜孤城'}等同于 id=1 and username='夜孤城'
     *                       当为array时，如：[{id:1,username:'夜孤城'},{age:20}]等同于(id=1 and username='夜孤城') or age=20
     *                       当需要用到>=|>|<=|<|!=时，只需要在值前面加入，默认为=,如：{age:'>=20'}等同于age>=20
     * @param {Object} option选项对象　{limit:'10,2',order:'id desc'} 限额，排序...
     * @return {Array} 返回为[]数组
     * @api public
     */
    find(table, con, option) {
        option = option || {};
        let sql = 'select ' + this.formatFileds(option.fileds) + ' from ' + mysql.escapeId(table) + this.getWhere(con)
        //console.log(con);
        //省略option
        if (option.order) {
            sql += ' order by ' + this.formatOrder(option.order);
        }
        if (option.limit) sql += ' limit ' + option.limit;
        return this.exec(sql);
    }
    formatFileds(fileds) {
        if (!fileds) return '*';
        let arr = fileds.split(',');
        let arrF = [];
        for (let filed of arr) {
            if (!filed) continue;
            let m = /distinct (\w+)/gi.exec(filed);
            if (!m || m.length < 2) {
                arrF.push(mysql.escapeId(filed))
            } else {
                arrF.push('distinct ' + mysql.escapeId(m[1]))
            }
        }
        return arrF.join(',');
    }
    formatOrder(order) {
        let arr = order.split(',');
        let arrOrderBy = [];
        for (let i = 0; i < arr.length; i++) {
            let pat = /^([0-9_a-z]+)([ ]+asc|[ ]+desc)*$/gi
            let m = pat.exec(arr[i]);
            if (!m || m.length < 2) {
                console.log('order by 格式不对');
                return '';
            }
            arrOrderBy.push(mysql.escapeId(m[1]) + (m[2] || ' asc'));
        }
        if (arrOrderBy.length == 0) return '';
        return arrOrderBy.join(',');
    }

    /**
     * findOne，查询一条数据
     * @param {String} table表名
     * @param {Object} con条件，json对象如:{id:1,username:'夜孤城'}
     * @param {Function} cb回调函数　fn(err,row) row为{}对象，非数组
     * @api public
     */
    findOne(table, con, option) {
        option = option || {};
        option.limit = 1;
        return this.find(table, con, option).then((rows) => {
            if (!rows || rows.length === 0) return null;
            return rows[0];
        })
    }

    /**
     * findPage，分页
     * @param {String} table表名
     * @param {Object} con条件，json对象如:{id:1,username:'夜孤城'}
     * @param {Object} option选项对象　{limit:'10,2',order:'id desc'} 限额，排序...
     * @param {Array} 返回数组
     * @api public
     */
    findPage(table, con, option) {
        option = option || {};
        option.order = option.order || "";
        option.pageNo = util.toInt(option.pageNo);
        option.pageSize = util.toInt(option.pageSize);
        option.pageNo = option.pageNo || 1;
        option.pageSize = option.pageSize || 10;
        option.limit = (option.pageNo - 1) * option.pageSize + ',' + option.pageSize;
        return this.find(table, con, option);
    }
    /**
     * page，分页，带总数
     * @param {String} table表名
     * @param {Object} con条件，json对象如:{id:1,username:'夜孤城'}
     * @param {Object} option选项对象　{limit:'10,2',order:'id desc'} 限额，排序...
     * @param {Object} 返回{count:int,rows:[]}
     * @api public
     */
    page(table, con, option) {
        //let count=await this.count(table, con);
        //let rows=await this.findPage(table, con, option);
        return Promise.all([this.count(table, con), this.findPage(table, con, option)]).then(arr => {
            return { count: arr[0], rows: arr[1] }
        })

    }


    /**
     * update，更新数据update操作
     * @param {String} table表名
     * @param {Object} con条件，json对象如:{id:1,username:'夜孤城'}
     * @param {Object} up欲修改字段对象，json对象如:{money:100000}
     *                 当需要使用字段计算[+|-|*|/]如{age:"+1"}等同于age=age+1
     * @param {Function} cb回调函数　fn(err,res),res为{status:true/false}
     * @api public
     */
    update(table, con, up) {
        let sql = 'update ' + mysql.escapeId(table) + ' set ' + this.getUp(up);
        //let params = [table];
        //sql = mysql.format(sql, params);
        sql += this.getWhere(con);
        return this.exec(sql).then(res => {
            if (!res || !res.hasOwnProperty('affectedRows') || res.affectedRows === 0) return false;
            return true;
        })

        // let res = await this.exec(sql);
        // if (!res || !res.hasOwnProperty('affectedRows') || res.affectedRows === 0) return false;
        // return true;
    }

    /**
     * insert，添加数据insert操作
     * @param {String} table表名
     * @param {Object} ins欲添加数据，json对象如:{id:1,username:'夜孤城'}
     * @param {Function} cb回调函数　fn(err,res),res为{status:true/false,id:新添加id}
     * @api public
     */
    insert(table, ins) {
        let sql = 'insert into ?? set ?';
        let params = [table, ins];
        sql = mysql.format(sql, params);
        return this.exec(sql).then(res => {
            if (!res || !res.hasOwnProperty('affectedRows') || res.affectedRows === 0) return false;
            if (res.insertId > 0) return res.insertId;
            if (res.affectedRows > 0) return true;
            return false;
        })
    }

    /**
     * insert，添加数据insert操作
     * @param {String} table表名
     * @param {Object} arrIn欲添加数据，json对象如:{id:1,username:'夜孤城'}
     * @param {Function} cb回调函数　fn(err,res),res为{status:true/false,id:新添加id}
     * @api public
     */
    inserts(table, arrIn) {
        if (!arrIn || !Array.isArray(arrIn)) throw new Error('arrIn must be a array.');
        if (arrIn.length == 0) throw new Error('arrIn can not empty array.');

        table = this.escapeId(table);
        let fileds = '(%s)', values = '';
        let keys = Object.keys(arrIn[0]);
        fileds = util.format(fileds, keys.join(','));
        let arrVal = []
        for (let In of arrIn) {
            let arrV = []
            for (let val of Object.values(In)) {
                arrV.push(this.escape(val));
            }
            arrVal.push('(' + arrV.join(',') + ')');
        }
        values = arrVal.join(',');

        let sql = 'insert into %s %s values %s';
        sql = util.format(sql, table, fileds, values);

        return this.exec(sql).then(res => {
            if (!res || !res.hasOwnProperty('affectedRows') || res.affectedRows === 0) return false;
            if (res.insertId > 0) return res.insertId;
            if (res.affectedRows > 0) return true;
            return false;
        })
    }

    /**
     * remove，删除数据delete操作
     * @param {String} table表名
     * @param {Object} con条件，json对象如:{id:1,username:'夜孤城'}
     * @param {Function} cb回调函数　fn(err,res),res为{status:true/false}
     * @api public
     */
    remove(table, con) {
        let sql = 'delete from ' + mysql.escapeId(table) + this.getWhere(con);
        return this.exec(sql).then(res => {
            if (!res || !res.hasOwnProperty('affectedRows') || res.affectedRows === 0) return false;
            return true;
        })
    }

    /**
     * exist，判断是否存在记录
     * @param {String} table表名
     * @param {Object} con条件，json对象如:{id:1,username:'夜孤城'}
     * @param {Function} cb回调函数　fn(err,res) res为{status:true/false}
     * @api public
     */
    exist(table, con) {
        let sql = 'select * from ' + mysql.escapeId(table);
        sql += this.getWhere(con);
        sql += ' limit 1';
        return this.exec(sql).then(res => {
            if (!res || res.length === 0) return false;
            return true;
        })
    }

    /**
     * singleScaler，计数
     * @param {String} table表名
     * @param {String} option类型，max,min,sum,count...
     * @param {String} filed统计字段
     * @param {Object} con条件，json对象如:{id:1,username:'夜孤城'}
     * @param {Function} cb回调函数　fn(err,res),res为json对象{value:101}
     * @api private
     */
    singleScaler(table, option, filed, con) {
        if (filed !== 0) filed = mysql.escapeId(filed);
        let fileds = option + '(' + filed + ') as `value`';
        return this.scaler(table, fileds, con).then(res => res.value);
        // var sql = 'select ' + _opts + '(' + filed + ') as `value` from ' + mysql.escapeId(table);
        // sql += this.getWhere(con);
        // let rows = await this.exec(sql);
        // if (!rows || rows.length === 0) return 0;
        //return obj.value;
    }

    scaler(table, fileds, con) {
        var sql = 'select ' + fileds + ' from ' + mysql.escapeId(table);
        sql += this.getWhere(con);
        //let rows = await this.exec(sql);
        return this.exec(sql).then(rows => {
            if (!rows || rows.length === 0) return 0;
            return rows[0];
        })
        // if (!rows || rows.length === 0) return 0;
        // return rows[0];
    }


    max(table, filed, con, cb) {
        return this.singleScaler(table, 'max', filed, con, cb);
    }

    min(table, filed, con, cb) {
        return this.singleScaler(table, 'min', filed, con, cb);
    }

    count(table, con, cb) {
        return this.singleScaler(table, 'count', 0, con, cb);
    }

    sum(table, filed, con, cb) {
        return this.singleScaler(table, 'sum', filed, con, cb);
    }

    //获取条件，返回 where id=1 and username='sdfds'
    getWhere(con) {
        //console.log("con", con)
        con = util.formatObj(con);
        if (!con) return '';
        return ' where ' + this.parseCon(con);
    }

    //_or:[{status:1},{status:2}] 等同 status=1 or status=2
    //_or:[[{status:1},{status:2}],[{ccc:1},{ccc:2}]] (status=1 or status=2) and (ccc=1 or ccc=2)
    parseCon(con) {
        let obj = {};
        util.extend(obj, con);
        if (!obj || typeof obj !== 'object') return '';

        if (obj._or) {
            let arr = obj._or;
            if (arr.length == 0) {
                delete obj._or;
                return this.objToString(obj);
            }
            if (arr.length === 1) {
                if (typeof arr[0] === "object") return this.objToString(arr[0]);
            }

            let arrOr = [], arrAnd = [], str = "";
            for (var i = 0, len = arr.length; i < len; i++) {
                if (Array.isArray(arr[i])) {
                    let arrChild = [];
                    for (var j = 0, len2 = arr[i].length; j < len2; j++) {
                        arrChild.push(this.objToString(arr[i][j]));
                    }
                    if (arrChild.length > 0) arrAnd.push("(" + arrChild.join(" or ") + ")");
                } else {
                    arrOr.push(this.objToString(arr[i]));
                }
            }

            if (arrOr.length > 0) {
                str = arrOr.join(" or ");
                str = "(" + str + ")";
            } else {
                str = arrAnd.join(" and ");
            }
            delete obj._or;
            let otherCon = this.objToString(obj);
            return !otherCon ? str : str + " and " + otherCon;

        } else {
            return this.objToString(obj);
        }

        // if (Array.isArray(obj)) {
        //     if (obj.length === 1) return this.objToString(obj[0]);
        //     for (var i = 0, len = obj.length; i < len; i++) {
        //         values.push('(' + this.objToString(obj[i]) + ')');
        //     }
        // } else if (typeof obj === 'obj') {
        //     return this.objToString(obj);
        // }

    };

    objToString(object) {
        var values = [];
        for (var key in object) {
            var value = object[key];
            if (typeof value === 'function') {
                continue;
            }
            //"[1000,10000]" 大于等于
            let match = /^([\[\(])([\d\.]*),([\d\.]*)([\]\)])$/.exec(value);
            if (match && match.length == 5) {
                let s1 = match[1] == "[" ? ">=" : ">";
                if (match[2]) {
                    values.push(mysql.escapeId(key) + ' ' + s1 + ' ' + mysql.escape(match[2], true));
                }
                let s2 = match[4] == "]" ? "<=" : "<";
                if (match[3]) {
                    values.push(mysql.escapeId(key) + ' ' + s2 + ' ' + mysql.escape(match[3], true));
                }
                continue;
            }
            //username:"like '%aaa%'"　搜索
            let match2 = /^like '([\w\W]+)'$/i.exec(value);
            if (match2 && match2.length == 2) {
                values.push(mysql.escapeId(key) + ' like ' + mysql.escape(match2[1], true));
                continue;
            }
            //username:"!='dasd'"　不等于
            let match3 = /^!='([\w\W]+)'$/i.exec(value);
            if (match3 && match3.length == 2) {
                values.push(mysql.escapeId(key) + ' != ' + mysql.escape(match3[1], true));
                continue;
            }

            //正常等号
            values.push(mysql.escapeId(key) + ' = ' + mysql.escape(value, true));
        }
        return values.join(' and ');
    }

    // formatKey(str){
    //     let pat=/([0-9a-z_]+)([>|>=|<|<=|!=|=|\%]*)$/gi;
    //     let m=pat.exec(str);
    //     if(!m||m.length<3) return {sign:"=",key:str};
    //     console.log(m)
    //     if(m[2]=="%")return {sign:"like",key:m[1]};
    //
    //     return {sign:m[2],key:m[1]};
    // }

    getUp(object) {
        var values = [];
        for (var key in object) {
            var value = object[key];
            if (typeof value === 'function') {
                continue;
            }
            let objV = this.formatUpValue(value);
            if (!objV.sign) {
                values.push(mysql.escapeId(key) + ' = ' + mysql.escape(value, true));
            } else {
                values.push(mysql.escapeId(key) + ' = ' + mysql.escapeId(key) + objV.sign + mysql.escape(objV.value, true));
            }

        }
        return values.join(',');
    }

    // formatUpKey(str){
    //     let pat=/([0-9a-z_]+)([\+|\-|\*|\/]*)$/gi;
    //     let m=pat.exec(str);
    //     if(!m||m.length<3) return {sign:"",key:str};
    //     return {key:m[1],sign:m[2]};
    // }


    //{aa:"(+)ssss"}
    formatUpValue(str) {
        let pat = /^\(([\+|\-|\*|\/|\%]*)\)([\d\.]+)/gi;
        let m = pat.exec(str);
        if (!m || m.length < 3) return { sign: "", value: str };
        return { sign: m[1], value: m[2] };
    }

    //------------------------------------存储过程------------------------------------
    /**
     * 执行存储过程
     * @param {String} 1.存储过程：call fn(IN,OUT)
     * @param {Object} 返回值{err:0,rows:[],msg:""}
     * @api public
     */
    exesp(sql) {
        return this.exec(sql).then(res => {
            let obj = { err: 0 };
            if (!res || res.length == 0) return util.err(4);
            if (!res[0] || res[0].length == 0) return util.err(4);
            if (res[0].length == 1) {
                let doc = res[0][0];
                if (!doc.err) {
                    obj.rows = [];
                    obj.rows.push(doc);
                    return obj;
                }
                return util.err(doc.err)
            }
            obj.rows = res[0];
            return obj;
        })
    }




    //------------------------------------事务------------------------------------
    /**
     * 获取一个事务
     * @return {Object} 返回一个dbt，在同一个conn里进行多次操作
     * @api public
     */
    tx() {
        return new Promise((resolve, reject) => {
            this.pool.getConnection((err, connection) => {
                if (err) {
                    console.log(err);
                    return reject(console.err(4));
                }
                connection.beginTransaction((err) => {
                    if (err) {
                        console.log(err);
                        return reject(console.err(4));
                    }
                    var dbt = new Mysql({ conn: connection, collections: this.collections });
                    resolve(dbt);
                })
            })
        })
    }
    /**
     * 事务确认提交
     * @return {Boolen} 返回true|flase
     * @api public
     */
    commit() {
        return new Promise((resolve, reject) => {
            this.conn.commit((err) => {
                if (err) {
                    this.conn.rollback(() => {
                        this.conn.release();
                        console.log(err);
                        resolve(false);
                    });
                } else {
                    this.conn.release();
                    resolve(true);
                }
            })
        });
    }
    /**
     * 事务回滚
     * @api public
     */
    rollback() {
        return new Promise((resolve, reject) => {
            this.conn.rollback(() => {
                this.conn.release();
                resolve(true);
            });
        })
    }
}
module.exports = Mysql;
