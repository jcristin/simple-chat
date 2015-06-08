
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
    addMessage(data['message'], data['nickname'], data['date'], false);
});

socket.on('online-users', function(data) {
    $('.online-users').html(data.join(', '));
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
        addMessage(message, 'Me', new Date().toISOString(), true)
        $messageInput.val('');
    }
}

function addMessage(msg, nick, date, isSelf) {
    var pClasses = 'message';
    var message = nick + ': ' + msg;

    if (isSelf) {
        pClasses += ' me';
        message = msg;
    }

    $chatContainer.append('<div class="row"><p class="'+ pClasses+'">' + _.escape(message) + '</p></div>');
    $messageInput.focus();

    // Scroll to the last message
    setTimeout(function() {
        //var $lastMessage= $chatContainer.find('.row:last');
        //var offsetTop = $lastMessage.offset().top + $lastMessage.height();

        $scroll.doScrollTo(999999);
    }, 300);

}

function setNickname() {
    var btn = $(this);
    btn.button('loading');

    userNickname = $nickname.val();

    if (userNickname) {
        socket.emit('setNickname', userNickname);

        socket.on('nickname', function(data) {
            if (data == 'ok') {
                $('#form-nickname').hide();
                $('#chat').show();
                $messageInput.focus();

                btn.button('reset');
            } else {
                userNickname = '';
                alert('This nickname is already taken.');

                btn.button('reset');
            }
        });
    }

}
