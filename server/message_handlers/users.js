"use strict";
var event_bus = require(app.shared_root + '/event_bus');
var sessionator = require('../managers/sessionator');
var wiseau = require('../managers/wiseau');
var wuptil = require('../util/wuptil');

setInterval(function() {
    send_users_list();
}, 15000);

var send_users_list = function(room, session) {
    if (room == null) {
        room = wiseau.get_lobby();
    }

    var nice_users = wuptil.copy_object(room.users);
    var sessions = sessionator.get_sessions();

    for (var key in sessions) {
        var s = sessions[key];
        var idx = -1;

        for (var i = 0; i < nice_users.length; i++) {
            if (nice_users[i].username == s.profile.username) {
                idx = i;
                break;
            }
        }

        if (idx >= 0) {
            nice_users[idx].idle = (s.idle == true);
            nice_users[idx].ping = s.ping;
            nice_users[idx].rocket_league_rank = s.profile.rocket_league_rank;

            if (s.idle == true && s.idle_start) {
                nice_users[idx].idle_duration = Date.now() - s.idle_start;
            }

        }
    }

    if (session == null) {
        sessionator.broadcast('users', 'users_list', {users: nice_users, room_id: room.id});
    }
    else {
        session.send('users', 'users_list', {users: nice_users, room_id: room.id});
    }
};

exports.handle_message = function handle_message(session, message) {
    var sub_type = message.sub_type;
    var data = message.data;

    var send_user_settings = function() {
        var user_settings = {};
        var sessions = sessionator.get_sessions();

        for (var key in sessions) {
            var s = sessions[key];
            if (s.logged_in) {
                user_settings[s.profile.username] = s.profile.user_settings;
            }
        }

        session.send('users', 'user_settings', {user_settings: user_settings});
    };

    var handle = {
        idle: function() {
            if (data.idle == true) {
                session.idle_start = Date.now();
            }

            session.idle = data.idle;
            send_users_list();
        },
        sync: function() {
            var room = wiseau.get_room(data.room_id);
            if (room == null) {
                return;
            }

            send_user_settings();
            send_users_list(room, session);
        },
        warn: function() {
            var sessions = sessionator.get_sessions();
            var evil_session = null;

            for (var cid in sessions) {
                var s = sessions[cid];
                if (s.profile.username == data.username) {
                    evil_session = s;
                    break;
                }
            }

            if (!evil_session) {
                return;
            }

            if (!evil_session.profile.warning_level) {
                evil_session.profile.warning_level = 5;
            }
            else {
                evil_session.profile.warning_level += 5;
            }

            if (session.profile.username == data.username) {
                var message = evil_session.profile.username + ' warned himself.';
            }
            else {
                var message = session.profile.username + ' warned ' + data.username + '.';
            }

            message += " " + data.username + "'s warning level has been increased to " + evil_session.profile.warning_level + '.';
            sessionator.broadcast('chatterbox', 'system', {message: message, color: 'darkblue'}, {room_id: data.room_id});

            if (evil_session.profile.warning_level == 100) {
                evil_session.profile.warning_level = 0;
                evil_session.logout();
            }
        }
    };

    if (handle[sub_type] != null) {
        handle[sub_type]();
    }

};

event_bus.on('login', function(params) {
    var username = params.username;

    if (username == null || username.length == '') {
        throw 'wup find username';
    }

    var lobby = wiseau.get_lobby();
    lobby.join_room(username);
    send_users_list();
});

event_bus.on('logout', function(params) {
    var username = params.username;

    var lobby = wiseau.get_lobby();
    lobby.leave_room(username);
    send_users_list();
});