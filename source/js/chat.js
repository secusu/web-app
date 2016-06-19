'use strict';

window.SECU = window.SECU || {};

window.SECU.Chat = {

    _data: {
        sentQueue: []
    },

    unreadPos: function() {

        var feed = this.getChat(),
            unread = feed.getElementsByClassName('unread');

        return unread[unread.length-1].offsetTop;
    },

    watchFeedScroll: function(cancel) {

        var _this = this,
            data = this._data,
            app = window.SECU.App._data.app,
            feed = this.getChat();

        if (!feed) {
            return;
        }

        function onScroll(event) {
            app.set('chat.room.unread', false);
            app.set('chat.room.scrolled', _this.scrolledToBottom());
        }

        if (cancel) {
            feed.removeEventListener('scroll', onScroll, false);
        } else {
            feed.addEventListener('scroll', onScroll, false);
        }
    },

    logout: function(obj) {
        window.SECU.Socket._data.chat.emit('room.leave', obj);
    },

    sortRoster: function(roster) {

        var name = window.SECU.App._data.app.get('chat.room.connection.name'),
            tempEl = null;

        if (roster.length === 1 || roster[0].name === name) {
            return roster;
        }

        for (var i = 0; i < roster.length; i++) {
            if (roster[i].name === name) {
                tempEl = roster[i];
                roster.splice(i, 1);
                break;
            }
        }

        roster.unshift(tempEl);

        return roster;
    },

    addSentQueue: function(obj) {
        this._data.sentQueue.push(JSON.parse(JSON.stringify(obj)));
    },

    extractSentQueue: function(timestamp) {

        var data = this._data,
            queue = data.sentQueue,
            dataPackage = null,
            index = null;

        for (var i = 0; i < queue.length; i++) {
            if (queue[i].sent_at === timestamp) {
                dataPackage = queue[i];
                index = i;
                break;
            }
        }

        queue.splice(i, 1);
        dataPackage.sender = window.SECU.App._data.app.get('chat.room.connection.name');

        return dataPackage;
    },

    getChat: function() {

        var chat = document.getElementById('chat-feed-block');

        if (!chat) {
            return false;
        } else {
            return chat.children[0];
        }
    },

    scrollPresent: function() {

        var chat = this.getChat();

        if (!chat) {
            return false;
        }

        if (chat.scrollHeight === chat.offsetHeight) {
            return false;
        } else {
            return true;
        }
    },

    scrolledToBottom: function() {

        var chat = this.getChat();

        if (!chat) {
            return false;
        }

        if (chat.scrollTop >= (chat.scrollHeight - chat.offsetHeight)) {
            return true;
        } else {
            return false;
        }
    },

    updateScroll: function(value) {

        var chat = this.getChat();

        if (!chat) {
            return;
        }

        switch(value) {
            case 'top':
                value = 0;
                break;
            case 'bottom':
                value = chat.scrollHeight;
                break;
            default:
                break;
        }

        chat.scrollTop = value;
    },

    decryptData: function(obj) {

        var message = '',
            file = null,
            files = [];

        if (typeof obj.text !== 'string') {
            try {
                message = window.SECU.Crypt.decrypt({
                    message: JSON.stringify(obj.text),
                    password: window.SECU.App._data.app.get('chat.room.connection.key')
                });
            } catch(e) {
                message = "Error. Couldn't decrypt text data.";
            }
        } else {
            message = obj.text;
        }

        if (obj.files && obj.files.length) {
            file = obj.files[0];
            
            files[0] = {
                name: file.name,
                extension: window.SECU.File.getExtension(file.name)
            };
            
            if (typeof file.data === 'string') {
                files[0].data = window.SECU.File.base64ToBlob(file.data);
            } else {
                files[0].data = window.SECU.File.base64ToBlob(window.SECU.Crypt.decrypt({
                    message: JSON.stringify(file.data),
                    password: window.SECU.App._data.app.get('chat.room.connection.key')
                }));
            }
        }

        return {
            text: message,
            files: files
        };
    },

    appendOwnData: function(obj) {
        this.appendData(this.extractSentQueue(obj.sent_at));
    },

    appendData: function(obj) {
        var app = window.SECU.App._data.app,
            scrolledToBottom = this.scrolledToBottom(),
            windowFocused = app.get('windowFocused');
        
        obj.data = this.decryptData(obj.data);

        obj.data.text = window.SECU.Helpers.convertToPlainText(obj.data.text);
        obj.data.text = window.SECU.Helpers.parseNewLines(obj.data.text);
        obj.data.text = window.SECU.Helpers.Autolinker.link(obj.data.text);

        obj.delivered_at = obj.delivered_at || window.SECU.Helpers.generateTimestamp();

        if (!app.get('chat.room.unread') && (!windowFocused || !app.get('show.chat') || (this.scrollPresent() && !scrolledToBottom))) {
            app.set('chat.room.feed.*.unread', false);
            obj.unread = true;
        }

        app.push('chat.room.feed', obj);

        if (windowFocused) {
            if (obj.sender === app.get('chat.room.connection.name') || scrolledToBottom) {
                app.set('chat.room.feed.*.unread', false);
                this.updateScroll('bottom');
            } else {
                if (this.scrollPresent() || !app.get('show.chat')) {
                    app.set('chat.room.unread', true);
                }
            }
        } else {
            app.set('chat.room.unread', true);
            app.set('chat.room.scrolled', this.scrolledToBottom());
        }

        if (app.get('supportedFeatures.notification')) {
            if (!windowFocused) {
                var notification = null;

                if (obj.sender === 'SYS') {
                    notification = obj.data.text;
                } else {
                    notification = obj.sender + ' has sent a message';
                }
            
                window.SECU.Notifications.fire({body: notification});
            }
        }
    },

    sendData: function(obj) {
        window.SECU.Socket._data.chat.emit('room.data', obj);
    },

    refreshRoster: function(obj) {
        window.SECU.App._data.app.set('chat.room.roster', obj);
    },

    join: function(obj) {
        window.SECU.Socket._data.chat.emit('room.join', obj);
    },

    create: function(obj) {
        window.SECU.Socket._data.chat.emit('room.create', {
            password: obj.password
        });
    },

    enable: function() {
        window.SECU.App._data.app.set('chat.enabled', true);
    },

    disable: function() {

        var app = window.SECU.App._data.app;

        if (app.get('show.chat')) {
            window.SECU.App._data.app.fire('toggleView', null, 'main');
        }

        if (app.get('chat.room.connection.key').length) {
            window.SECU.App.reinitApp('chat');
            window.SECU.Error.show(['Connection error']);
        }

        app.set('chat.enabled', false);
        this.watchFeedScroll(true);
    },

    start: function(data) {
        
        var app = window.SECU.App._data.app,
            urls = window.SECU.Ajax._data.url,
            room = app.get('chat.form.room');

        app.set('chat.done', true);
        app.set('chat.room.connection', {
            link: urls.web.host + urls.web.chat + room,
            room: room,
            name: data.name,
            key: data.key
        });
        this.appendData({
            sender: 'SYS',
            data: {
                text: data.name + ' joined the room'
            }
        });
        app.set('chat.formActive', false);
        app.set('chat.form', {
            room: '',
            password: ''
        });

        app.set('dock.chat', true);
        window.SECU.Helpers.dockNavbar(true);

        setTimeout(function() {
            window.SECU.Helpers.fixChatFeedHeight();
        }, 0);

        this.watchFeedScroll();
        
        if (app.get('supportedFeatures.notification')) {
            window.SECU.Notifications.init();
        }
    },

    init: function() {
        window.SECU.Helpers.fixChatFeedHeight();
        this.watchFeedScroll();

        if (window.SECU.App._data.app.get('chat.room.unread')) {
            this.updateScroll(this.unreadPos());
        } else {
            this.updateScroll('bottom');
        }
    }
};