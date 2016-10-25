module.exports = function() {
    get_page('black_board', function(page) {
        $('body').append(page.$container);

        var ctx = page.$("#black_board_canvas")[0].getContext('2d');
        ctx.strokeStyle = "#FF0000";

        var resize_canvas = function() {
            var width = 1280;
            var height = 720;
            page.$("#black_board_canvas").attr({width: width, height: height});
        };

        resize_canvas();
        // $(window).on('resize', resize_canvas);

        var send_thing = function(type, data) {
            var domain = window.location.protocol + '//' + window.location.hostname;
            if (window.location.port != 80) {
                domain += ":" + window.location.port
            }

            var message = {type: type, data: data};
            window.opener.postMessage(message, domain);
        };

        var pinned_x = null;
        var pinned_y = null;
        var left_mouse_down = false;

        page.$("#black_board_canvas").on('mouseup', function(e) {
            if (e.which == 1) {
                left_mouse_down = false;
            }
        });

        page.$("#controls").on('click', '[menu_item]', function() {
            var menu_item = $(this).attr('menu_item');
            switch (menu_item) {
                case 'great_clear':
                    ctx.clearRect(0, 0, 1280, 720);
                    send_thing('great_clear', {});
                    break;

                default:
                    break;
            }
        });

        page.$("#black_board_canvas").on('mousedown', function(e) {
            // probably the LMB?
            if (e.which == 1) {
                left_mouse_down = true;
                pinned_x = e.clientX - this.offsetLeft;
                pinned_y = e.clientY - this.offsetTop;

                var r = 0;
                var g = 0;
                var b = 0;
                var a = 255;
                var size = 5;

                var x = pinned_x;
                var y = pinned_y;

                ctx.beginPath();
                ctx.fillStyle = "rgba(" + r + "," + g + "," + b + "," + (a / 255) + ")";
                ctx.fillRect(x, y, size, size);
                ctx.stroke();

                var rekt = {
                    r: r,
                    g: g,
                    b: b,
                    a: a,
                    x: pinned_x,
                    y: pinned_y,
                    size: 5
                };

                send_thing('rekt', rekt);
            }
        });

        page.$("#black_board_canvas").on('mousemove', function(e) {
            if (left_mouse_down) {
                left_mouse_down = true;
                var end_x = e.clientX - this.offsetLeft;
                var end_y = e.clientY - this.offsetTop;

                var line = {
                    start_x: pinned_x,
                    start_y: pinned_y,
                    end_x: end_x,
                    end_y: end_y
                };

                ctx.beginPath();
                ctx.moveTo(line.start_x, line.start_y);
                ctx.lineTo(line.end_x, line.end_y);
                ctx.stroke();

                pinned_x = end_x;
                pinned_y = end_y;

                send_thing('line', line);
            }
        });

        setInterval(function() {
            if (!window.opener || window.opener.closed) {
                window.close();
            }
        }, 100);
    });
};