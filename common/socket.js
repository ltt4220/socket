const path = require( 'path' );
let SocketIO = require( 'socket.io' );
const util = require( 'co-util' );
const redisAdapter = require( 'socket.io-redis' );
const config = require( '../config/redis' );
let arrRmd = require( './recommends' );

class Entity {
    constructor() {
        this.msglog = {};
    }

    use( server ) {
        this.io = SocketIO( server );
        // this.io.path('/room1');
        // this.io.adapter(redisAdapter(config.redis));

        // setInterval(()=>{
        //     let ii = util.random(0, arrRmd.length - 1);
        //      if(this.io) {
        //          this.sendForRobot(arrRmd[ii]);
        //
        //      }
        //
        //
        // },1000)


        this.io.on( 'connection', ( socket ) => {
            console.log( 'query', socket.handshake.query );
            socket.join( socket.handshake.query.rid, () => {
                //不包括自己
                // socket.broadcast.to('group1').emit('event_name', data);
                let rooms = Object.keys( socket.rooms );
                console.log( rooms ); // [ <socket.id>, 'room 237' ]

                //包括自己
                // this.io.sockets.in(msg.rid).emit('join', msg);
                // this.io.to(socket.handshake.query.rid).emit('msg', {type: 'join'});
                this.sendJoin( socket )

                if ( this.msglog[ socket.handshake.query.rid ] ) {
                    for ( let msg of this.msglog[ socket.handshake.query.rid ] ) {
                        this.io.to( socket.id ).emit( 'msg', msg );
                    }
                }

                // this.sendSystem(socket)
                // for (let i = 0; i < 10; i++) {
                //     let index = util.random(0, arrRmd.length - 1);
                //     this.sendRecommend(socket, arrRmd[index]);
                // }
            } );


            socket.on( 'msg', ( msg ) => {
                // console.log(socket.rooms);
                console.log( 'msg', msg )
                if ( socket.__status == -1 ) {
                    //已经禁言
                    return this.io.to( socket.id ).emit( 'err', {
                        msg: '您已经被禁言了'
                    } );
                }
                this.sendMessage( socket, msg.msg );
            } )


            socket.on( 'gift', ( msg ) => {
                // console.log(socket.rooms);
                console.log( 'gift', msg )
                this.sendGift( socket, 'gift', msg )
                // this.sendMessage(socket, msg.msg);
            } )

            socket.on( 'users', ( msg ) => {
                let users = [];
                this.io.in( socket.handshake.query.rid ).clients( ( err, clients ) => {
                    for ( let clientId of clients ) {
                        console.log( 'user socket', this.io.sockets.connected[ clientId ].id )
                        let query = this.io.sockets.connected[ clientId ].handshake.query;

                        if ( query.role != 0 ) continue;
                        users.push( {
                            _id: util.uuid(),
                            id: this.io.sockets.connected[ clientId ].id,
                            uid: query.uid,
                            username: query.username,
                            role: query.role,
                            avatar: query.avatar,
                            status: this.io.sockets.connected[ clientId ].__status || 0
                        } )
                    }
                    let obj = {};
                    let peon = users.reduce((cur,next) => {
                        obj[next.uid] ? "" : obj[next.uid] = true && cur.push(next);
                        return cur;
                    },[])
                    console.log( 'users', peon )
                    this.io.to( socket.id ).emit( 'users', peon );
                    // this.io.to(socket.handshake.query.rid).emit('users', {aa:1});

                } )


            } )

            socket.on( 'say', ( msg ) => {
                console.log( 'say', msg );
                let sk = this.io.sockets.connected[ msg.id ];
                if ( !sk ) return;
                sk.__status = msg.status;
            } )
            //监听 删除
            socket.on( 'deletecommend', ( msg ) => {
                this.sendDelete( socket, 'deletecommend', msg )
            } );
            socket.on( 'recommend', ( msg ) => {
                console.log( 'recommend', msg );
                // let sk = this.io.sockets.connected[msg.id];
                // if (!sk) return;
                this.io.to( socket.handshake.query.rid ).emit( 'recommend', msg );
            } )

        } );

    }


    sendRecommend( socket, msg ) {


        let obj = {
            _id: util.uuid(),
            id: util.uuid(),
            uid: util.uuid(),
            // avatar: socket.handshake.query.avatar,
            username: msg.username,
            role: 0,
            recommend: 1,
            msg: msg.msg,
            time: new Date().getTime()
        }
        this.io.to( socket.id ).emit( 'recommend', obj );

    }

    sendSystem( socket ) {
        // this.io.to(id).emit('msg', data);
        let obj = {
            _id: util.uuid(),
            id: util.uuid(),
            uid: util.uuid(),
            // avatar: socket.handshake.query.avatar,
            username: '系统提示',
            role: 2,
            recommend: 0,
            msg: '提倡绿色直播，严禁发布涉政、违法、色情低俗等违规内容。健康直播，文明互动。',
            time: new Date().getTime()
        }
        //全员包括自己
        this.io.to( socket.id ).emit( 'msg', obj );
    }

    sendMsgForRobot( msg ) {
        // this.io.to(id).emit('msg', data);
        let obj = {
            _id: util.uuid(),
            id: util.uuid(),
            uid: util.uuid(),
            // avatar: socket.handshake.query.avatar,
            username: msg.username,
            role: 1,
            recommend: 0,
            time: new Date().getTime(),
            msg: msg.msg,
        }
        //全员包括自己
        this.io.to( socket.handshake.query.rid ).emit( 'msg', obj );
    }

    sendGift( socket, type, msg ) {
        // this.io.to(id).emit('msg', data);
        let obj = {
            _id: util.uuid(),
            id: socket.id,
            uid: socket.handshake.query.uid,
            avatar: socket.handshake.query.avatar,
            username: socket.handshake.query.username,
            role: socket.handshake.query.role,
            recommend: 0,
            time: new Date().getTime()
        }
        if ( msg ) {
            util.extend( obj, msg );
        }
        //全员包括自己
        this.io.to( socket.handshake.query.rid ).emit( type, obj );
    }
    send( socket, type, msg ) {
        // this.io.to(id).emit('msg', data);
        let obj = {
            _id: util.uuid(),
            id: socket.id,
            uid: socket.handshake.query.uid,
            avatar: socket.handshake.query.avatar,
            username: socket.handshake.query.username,
            role: socket.handshake.query.role,
            recommend: 0,
            time: new Date().getTime(),

        }
        if ( msg ) obj.msg = msg;
        if ( type == 'msg' ) {
            this.msglog[ socket.handshake.query.rid ] = this.msglog[ socket.handshake.query.rid ] || [];
            this.msglog[ socket.handshake.query.rid ].push( obj );
            this.msglog[ socket.handshake.query.rid ] = this.msglog[ socket.handshake.query.rid ].slice( -10 );
        }
        //全员包括自己
        this.io.to( socket.handshake.query.rid ).emit( type, obj );
    }


    sendJoin( socket ) {
        this.send( socket, 'join' )
    }

    sendMessage( socket, msg ) {
        this.send( socket, 'msg', msg )
    }
    sendDelete( socket, type, msg ) {
         let obj = {
            _id: msg._id,
            id: socket.id,
            uid: socket.handshake.query.uid,
            avatar: socket.handshake.query.avatar,
            username: socket.handshake.query.username,
            role: socket.handshake.query.role,
            recommend: 0,
            time: new Date().getTime(),
            status:msg.status,
        }
        this.io.to( socket.handshake.query.rid ).emit( type, obj );
        if(msg.status==1){
            this.msglog[ socket.handshake.query.rid ] = this.msglog[ socket.handshake.query.rid ].filter(ele=>{
                return ele._id!=msg._id
            })
        }else{
             this.msglog[ socket.handshake.query.rid ] =[];
        }
    }

    sendForRobot( item ) {
        // this.io.to(id).emit('msg', data);
        let obj = {
            _id: util.uuid(),
            id: util.uuid(),
            uid: util.uuid(),
            // avatar: item.avatar,
            username: item.username,
            role: 0,
            recommend: 0,
            time: new Date().getTime(),
            msg: item.msg
        }

        //全员包括自己
        this.io.emit( 'msg', obj );
    }


}

module.exports = new Entity();