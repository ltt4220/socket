"use strict";
let util = require('co-util');
let mongodb = require('mongodb');

const MongoClient = require('mongodb').MongoClient;


class Mongo {
    constructor(opts) {
        this._opts = opts;
    }

    connect() {
        return new Promise((resolve, reject) => {
            this.ObjectID = mongodb.ObjectID;
            const url = this._opts.url;
            MongoClient.connect(url, {useNewUrlParser: true}, (err, client) => {
                console.log(url, ' started.')
                if (err) {
                    console.log(err);
                    return reject(err);
                }
                const db = client.db(this._opts.database);
                this._opts.collections.forEach((c) => {
                    this[c] = db.collection(c);
                    this[c].page = async (con) => {
                        let sort = con.option.sort || {_id: -1};
                        let size = util.toInt(con.option.size) || 10;
                        let skip = util.toInt(con.option.current);
                        skip = skip - 1;
                        if (skip < 1) skip = 0;
                        skip = skip * size;

                        return Promise.all([db.collection(c).find(con.query).count(),
                            db.collection(c).find(con.query).sort(sort).limit(size).skip(skip).toArray()]).then(arr => {
                            return {count: arr[0], rows: arr[1]}
                        });
                    }
                })
                this.collection = (name) => {
                    return db.collection(name);
                };

                this.db = (dbname) => {
                    return client.db(dbname)
                }
                return resolve(true);
            });
        })
    }

}

module.exports = Mongo;