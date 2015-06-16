
var $messageInput
    , $chatContainer
    , $nickname
    , $goChat
    , userNickname = ''
    , $scroll;

$(function() {
    $nickname = $('#nickname');
    $messageInput = $('#message');
    $chatContainer = $('#chat-container');
    $goChat = $('#go-chat');

    $scroll = $chatContainer.niceScroll({
        cursorwidth: 8
    });

    $goChat.on('click', setNickname);

    $('#submit').on('click', sendMessage);
    $('form').on('submit', function(e) {
        e.preventDefault();
        return false;
    });
    $('.form-chat').on('submit', function(e) {
        e.preventDefault();
        sendMessage();
        return false;
    });
});


// Socket.io
var socket = io.connect();
socket.on('connect', function() {
    console.log('Connected');
});

socket.on('message', function(data) {
    addMessage(data['message'], data['nickname'], data['date'], data['sender']);
});


// Helper functions
function sendMessage() {
    if (userNickname == '') {
        alert('Who are you?');
        $nickname.focus();
        return false;
    }

    var message = $messageInput.val();
    if (message != '') {
        socket.emit('message', message);
        addMessage(message, 'Me', new Date().toISOString(), 2)
        $messageInput.val('');
    }
}

function addMessage(msg, nick, date, sender) {
    var pClasses = 'message';
    var message;

    if (sender === 3) {
        pClasses += ' server';
        message = 'Server: ' + msg;
    }
    else {
        if (sender === 2) {
            pClasses += ' me';
            message = msg;
        }
        else {
            var message = nick + ': ' + msg;
        }
    } 

    $chatContainer.append('<div class="row"><p class="'+ pClasses+'">' + _.escape(message) + '</p></div>');
    $messageInput.focus();

    // Scroll to the last message
    setTimeout(function() {
        $scroll.doScrollTo(999999);
    }, 300);

}

function setNickname() {
    var btn = $(this);
    btn.button('loading');

    userNickname = $nickname.val();

    if (userNickname) {
        
        socket.emit('nick', userNickname);
        
        socket.on('badnick', function () {
            userNickname = '';
            alert('This nickname is already taken.');
            btn.button('reset');
        });
        
        socket.on('logon', function (data) {
            $('#form-nickname').hide();
            $('#chat').show();
            $messageInput.focus();
            addMessage('Entrou no chat como ' + data + '.',"", "", 3);
            btn.button('reset');
        });
        
        socket.on('welcome', function (agent) {
            $('#form-nickname').hide();
            $('#chat').show();
            $messageInput.focus();
            btn.button('reset');
            var day = new Date();
            var hr = day.getHours();
            var welcomeMsg = "Bom dia";
            if (hr >= 12) {
                if (hr < 20) {
                    welcomeMsg = "Boa tarde";
                }
                else {
                    welcomeMsg = "Boa noite";
                }
            }
            socket.emit('info', 'Cliente '+userNickname+' a iniciar conversa\347\343o.');
            addMessage(welcomeMsg + ', o meu nome \351 ' + agent + ', em que posso ajudar?', agent, "", 1);
        });

        socket.on('noagents', function (data) {
            alert("De momento n\343o h\341 agentes dispon\355veis. Por favor, tente mais tarde ou ligue 21 112 7303.");
            btn.button('reset');
        });     
    }
}
