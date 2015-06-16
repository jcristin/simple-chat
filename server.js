// Start libraries and server
var express = require('express')
    , app = express();

var http = require('http')
    , server = http.createServer(app)
    , io = require('socket.io').listen(server);


// app config
app.configure(function() {
    // Views directory
    app.set('views', __dirname + '/views');
    // Static files directory
    app.use(express.static(__dirname + '/public'));
    // Disable layout
    app.set("view options", {layout: false});
    // Views engine
    app.set('view engine', 'jade');
});


// Render the main page
app.get('/', function(req, res) {
    res.render('chat.jade');
});

// Users nickname's
var nicknames = [];
// Rooms & agents
var rooms = ['dhl1', 'dhl2', 'dhl3', 'dhl4'];
var agents = ['Jo\343o', 'Duarte', 'Teresa', 'Miguel'];

// Connection event
io.sockets.on('connection', function (socket) {
    
    // Once we receive a nickname we connect it to next free room    
    socket.once('nick', function (data) { connect(socket, data); });

    // Broadcast the message to all
    socket.on('message', function(data) {
        var userNickname = getNickname(socket);
        if (userNickname) {
            var transmit = {
                date: new Date().toISOString(),
                nickname: userNickname,
                message: data,
                sender: 1
            };
            socket.broadcast.to(socket.room).emit('message', transmit);
            console.log('User %s said "%s" at %s.', transmit.nickname, data, transmit.date);
        }
    });
    
    // Broadcast the message to all
    socket.on('info', function (data) {
        var userNickname = getNickname(socket);
        if (userNickname) {
            var transmit = {
                date: new Date().toISOString(),
                nickname: userNickname,
                message: data,
                sender: 3
            };
            socket.broadcast.to(socket.room).emit('message', transmit);
            console.log('User %s said "%s" at %s.', transmit.nickname, data, transmit.date);
        }
    });

    // Disconnection of the client
    // Remove the user's nickname
    socket.on('disconnect', function() {
        var userNickname = getNickname(socket);
        if (userNickname) {
            var index = nicknames.indexOf(userNickname);
            nicknames.splice(index, 1);
            var transmit = {
                date: new Date().toISOString(),
                nickname: userNickname,
                message: userNickname +' acabou de desligar o chat',
                sender: 3
            }
            socket.broadcast.to(socket.room).emit('message', transmit);
            console.log('User %s has been disconnected', userNickname);
        }
    });

});

function connect(socket, nickname) {
    
    console.log("Current users are %s.",nicknames);

    // if agent then subscribe to its room
    var i = rooms.indexOf(nickname);
    if ( i > -1 ) {
        socket.join(nickname);
        socket.set('nickname', nickname, function () {
            nicknames.push(nickname);
        });
        socket.room = rooms[i];
        socket.emit('logon', agents[i]);
        console.log('Agent %s connected.', agents[i]);
    }
    // if not agent then find the first empty room and subscribe to it
    else {
        
        if (nicknames.indexOf(nickname) == -1) {
            console.log('User %s connected.', nickname);
            for (var i in rooms) {
                var socketIds = io.sockets.manager.rooms["/"+rooms[i]];
                if (socketIds && socketIds.length === 1) {
                    socket.join(rooms[i]);
                    socket.room = rooms[i];
                    socket.set('nickname', nickname, function () { nicknames.push(nickname); });
                    socket.emit('welcome', agents[i]);
                    console.log('User %s connected to room %s.', nickname, rooms[i]);
                    return;
                }
            }
            socket.emit('noagents');
            socket.leave(socket);           
        } 
        else {
            // Send the error
            socket.emit('badnick');
        }
    }
}


/**
* Get the user nickname
*/
function getNickname(socket) {
    var nickname = false;
    
    socket.get('nickname', function(err, name) {
        if (name != null) {
            nickname = name;
        }
    });
    var i = rooms.indexOf(nickname);
    if (i > -1) {
        nickname = agents[i];
    }
    return nickname;
}

// Starts the server at port 3000
var port = Number(process.env.PORT || 3000);

server.listen(3000, function() {
    console.log('Listening on port %d', server.address().port);
});
