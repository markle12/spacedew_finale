module.exports = (function() {
    "use strict";
    var toolio = {};

    toolio.alert = function(title, message) {
        $('<div>' + message + '</div>').dialog({
            title: title,
            modal: true
        });
    };

    toolio.nice_size = function(size) {
        var units = ['kb', 'mb', 'gb'];
        var unit = 'b';

        units.some(function(u) {
            if (size >= 1024) {
                size /= 1024;
                unit = u;
            }
            else {
                return true;
            }
        });

        return size.toFixed(2) + ' ' + unit;
    };

    toolio.prompt = function(title, message, existing_value, cb) {
        var use_input = false;

        if (typeof(existing_value) == "function") {
            cb = existing_value;
            existing_value = null;
        }

        var $blargh = $('<div>' + message + '<br/><input id="prompter" style="display: block; margin-top: 5px; min-width: 600px; width: 100%; height: 40px; padding: 5px;"/></div>').dialog({
            title: title,
            modal: true,
            width: 'auto',
            buttons: {
                'Ok': function() {
                    use_input = true;
                    $(this).dialog('close');
                },
                'Cancel': function() {
                    $(this).dialog('close');
                }
            },
            open: function() {
                $(this).find('#prompter').val(existing_value);

                $(this).find("#prompter").off('keydown.blargh').on('keydown.blargh', function(e) {
                    if (e.which == 13) {
                        use_input = true;
                        $blargh.dialog('close');
                    }
                });
            },
            close: function() {
                if (use_input) {
                    var val = $blargh.find('#prompter').val();
                    cb(val);
                }
                else {
                    cb(null);
                }
            }
        });
    };

    toolio.generate_id = function() {
        var d = Date.now();
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = (d + Math.random() * 16) % 16 | 0;
            d = Math.floor(d / 16);
            return (c == 'x' ? r : (r & 0x7 | 0x8)).toString(16);
        });
    };

    toolio.array_to_list = function(arr) {
        if (arr == null) {
            throw "Null array";
        }

        if (arr.length === 0) {
            return "(none)";
        }

        var nice_array = "<ol>";

        for (var i = 0; i < arr.length; i++) {
            nice_array += "<li>" + arr[i] + "</li>";
        }

        nice_array += "</ol>";
        return nice_array;
    };

    /* Fixed arrays are of a constant size and also don't accept duplicates. */
    toolio.push_to_fixed_array = function(arr, value, max_size) {
        if (max_size == null) {
            max_size = 10;
        }

        if (arr == null) {
            throw "Null array";
        }
        if (max_size <= 0) {
            throw "Max size <= 0";
        }

        // don't add again.
        if (arr.indexOf(value) >= 0) {
            return;
        }

        while (arr.length >= max_size) {
            arr.shift();
        }

        arr.push(value);
    };

    toolio.copy_object = function(obj) {
        return JSON.parse(JSON.stringify(obj));
    };

    toolio.string_to_array_buffer = function(str) {
        var buf = new ArrayBuffer(str.length * 2);
        var buf_view = new DataView(buf);

        for (var i = 0; i < str.length; i++) {
            buf_view.setUint16(i * 2, str.charCodeAt(i), true);
        }

        return buf;
    };

    toolio.blob_from_buffer = function(buffer, meta) {
        var header = toolio.string_to_array_buffer(JSON.stringify(meta));

        var header_length = new ArrayBuffer(4);    // 4 bytes = 32-bits.
        new DataView(header_length).setUint32(0, header.byteLength, true); // explicit little endian

        return new Blob([header_length, header, buffer]); // roll it up
    };

    toolio.array_buffer_to_string = function(buf) {
        return String.fromCharCode.apply(null, new Uint16Array(buf));
    };

    return toolio;
})();

