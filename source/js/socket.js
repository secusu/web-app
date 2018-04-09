'use strict';

window.SECU = window.SECU || {};

window.SECU.Socket = {

    _data: {},

    initStats: function() {

        var data = this._data;

        data.stats = io.connect(window.SECU.Ajax._data.url.api.host + ':' + window.SECU.Ajax._data.url.api.port, {secure: true});
        
        data.stats.on('secu-channel:App\\Events\\SecuWasCreated', function(data) {
            window.SECU.App.refreshCount(data.id);
        });
    },

    initChat: function() {
        
        var data = this._data,
            app = window.SECU.App._data.app;

        data.chat = io.connect(window.SECU.Ajax._data.url.api.host + ':' + window.SECU.Ajax._data.url.api.port + '/c', {secure: true});

        data.chat.on('connect', function () {
            window.SECU.Chat.enable();
        });
        data.chat.on('reconnect', function () {
            window.SECU.Chat.enable();
        });

        data.chat.on('connecting', function () {
            window.SECU.Chat.disable();
        });
        data.chat.on('reconnecting', function () {
            window.SECU.Chat.disable();
        });
        data.chat.on('reconnect_failed', function () {
            window.SECU.Chat.disable();
        });
        data.chat.on('disconnect', function() {
            window.SECU.Chat.disable();
        });
        data.chat.on('connect_failed', function() {
            window.SECU.Chat.disable();
        });
        data.chat.on('connect_error', function() {
            window.SECU.Chat.disable();
        });
        data.chat.on('close', function() {
            window.SECU.Chat.disable();
        });
        data.chat.on('error', function() {
            window.SECU.Chat.disable();
        });

        data.chat.on('room.create', function (data) {
            if (data.success) {
                history.replaceState({}, 'Sëcu', '/c/' + data.room);
                app.set('chat.form.room', data.room);
                window.SECU.Chat.join(app.get('chat.form'));
            } else {
                app.set('chat.formDisabled', false);
                app.set('chat.formActive', true);
                window.SECU.Error.show(data.errors);
            }
        });

        data.chat.on('room.join', function (data) {
            if (data.success) {
                if (data.hasOwnProperty('key')) {
                    app.set('chat.formDisabled', false);
                    window.SECU.Chat.start(data);
                } else {
                    window.SECU.Chat.appendData({
                        sender: 'SYS',
                        data: {
                            text: data.name + ' joined the room'
                        }
                    });
                }
            } else {
                app.set('chat.formDisabled', false);
                app.set('chat.formActive', true);
                window.SECU.Error.show(data.errors);
            }
        });

        data.chat.on('room.join.attempt', function (data) {
            window.SECU.Chat.appendData({
                sender: 'SYS',
                data: {
                    text: data.errors[0]
                }
            });
        });

        data.chat.on('room.data.attempt', function (data) {
            window.SECU.Chat.appendData({
                sender: 'SYS',
                data: {
                    text: data.errors[0]
                }
            });
        });

        data.chat.on('room.leave', function (data) {
            if (data.success) {
                if (data.self) {
                    //window.SECU.Chat.start(data);
                } else {
                    window.SECU.Chat.appendData({
                        sender: 'SYS',
                        data: {
                            text: data.name + ' left the room'
                        }
                    });
                }
            } else {
                window.SECU.Error.show(data.errors);
            }
        });

        data.chat.on('room.roster', function (data) {
            data = window.SECU.Chat.sortRoster(data);
            window.SECU.Chat.refreshRoster(data);
        });

        data.chat.on('room.data', function(data) {
            if (data.hasOwnProperty('sender') && data.hasOwnProperty('data')) {
                window.SECU.Chat.appendData(data);
            } else {
                window.SECU.Chat.appendOwnData(data);
            }
        });
    },

    init: function() {
        this.initStats();
        this.initChat();
    }
};
