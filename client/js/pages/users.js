module.exports = function($parent) {
    var known_users = {};

    get_page('users', function(page) {
        $parent.append(page.$container);

        var update_user_list_style = function() {
            page.$("#users_list .user").each(function() {
                var $user = $(this);

                var user_colors = {
                    bg_color: 'white',
                    fg_color: 'black',
                    font_family: 'Verdana',
                    font_size: '1.25em'
                };

                var user = $user.prop('user');
                var extend_from = app.world.user_settings[user.username] && app.world.user_settings[user.username].outfit.user;

                $.extend(user_colors, extend_from);
                $user.css({
                    background: user_colors.bg_color,
                    color: user_colors.fg_color,
                    fontFamily: user_colors.font_family,
                    fontSize: user_colors.font_size + 'px'
                })
            });
        };

        page.listen('user_settings', function(data) {
            app.world.user_settings = data.user_settings;
            update_user_list_style();
        });

        page.listen('users_list', function(data) {
            var room_id = data.room_id;
            var $users = page.$("#users_list").empty();

            var logging_in = Object.keys(known_users).length == 0;
            var gone_to_a_better_place = Object.keys(known_users);

            data.users.map(function(user) {
                var nice_username = user.username.toLowerCase();

                if (!logging_in && known_users[nice_username] == null) {
                    page.emit('roams_the_earth', {username: user.username, room_id: room_id});
                }

                var idx = gone_to_a_better_place.indexOf(nice_username);
                if (idx >= 0) {
                    gone_to_a_better_place.splice(idx, 1);
                }

                known_users[nice_username] = user.username;

                var display_name = user.username;

                if (user.idle == true) {
                    var duration = user.idle_duration / 1000;
                    var unit = " s";

                    if (duration >= 60) {
                        duration /= 60;
                        unit = " m";
                    }

                    if (duration >= 60) {
                        duration /= 60;
                        unit = " h";
                    }

                    duration = duration.toFixed(0);
                    display_name += " (Away " + duration + " " + unit + ")";
                }

                var $user = $('<div class="user">' + display_name + '</div>');
                $user.prop('user', user);
                $user.attr('title', user.username);

                if (user.idle) {
                    $user.addClass('idle');
                }

                $users.append($user);
            });

            gone_to_a_better_place.forEach(function(user) {
                page.emit('has_gone_to_a_better_place', {username: known_users[user], room_id: room_id});
                delete known_users[user.toLowerCase()];
            });

            update_user_list_style();
            page.$("#users_list").append($users);
        });

        $(document).idle({
            onIdle: function() {
                page.send('idle', {idle: true});
            },
            onActive: function() {
                page.send('idle', {idle: false});
            },
            // idle: 60000 * 5 // 5 minutes
            idle: 5000
        });

        var wait_for_app = setInterval(function() {
            if (app.ready) {
                page.send('sync', {room_id: app.get_active_room(true)});
                clearInterval(wait_for_app);
            }
        }, 50);
    });

    return {};
};