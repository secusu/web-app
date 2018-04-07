'use strict';

window.SECU = window.SECU || {};

window.SECU.Helpers = {

    _data: {},

    getHumanTime: function(date) {

        function addLeadingZero(str) {
            if (str.toString().length === 1) {
                str = '0' + str;
            }

            return str;
        }

        date = new Date(date);

        return addLeadingZero(date.getHours()) + ':' + addLeadingZero(date.getMinutes());
    },

    checkVisibility: function() {

        var state = document.visibilityState,
            app = window.SECU.App._data.app;

        switch(state) {
            case 'hidden':
                app.set('windowFocused', false);
                break;
            case 'visible':
            default:
                app.set('windowFocused', true);
                break;
        }
    },

    watchWindowFocus: function() {
        document.addEventListener('visibilitychange', this.checkVisibility);
    },

    parseNewLines: function(string) {
        string = string.replace(/(?:\r\n|\r|\n)/g, '<br>');
        return string;
    },

    convertToPlainText: function(string) {
        return string.replace(/[&<>"']/g, function($0) {
            return "&" + {"&":"amp", "<":"lt", ">":"gt", '"':"quot", "'":"#39"}[$0] + ";";
        });
    },

    getPosition: function(elem) {
        
        var box = elem.getBoundingClientRect(),

            body = document.body,
            docEl = document.documentElement,

            scrollTop = window.pageYOffset || docEl.scrollTop || body.scrollTop,
            scrollLeft = window.pageXOffset || docEl.scrollLeft || body.scrollLeft,

            clientTop = docEl.clientTop || body.clientTop || 0,
            clientLeft = docEl.clientLeft || body.clientLeft || 0,

            top  = box.top + scrollTop - clientTop,
            left = box.left + scrollLeft - clientLeft;

        return {top: Math.round(top), left: Math.round(left)};
    },

    generateTimestamp: function(date) {

        var now = null;

        if (date) {
            now = new Date(date);
        } else {
            now = new Date();
        }

        return now.getTime();
    },

    watchResize: function() {

        window.addEventListener('resize', this.fixChatFeedHeight, false);

    },

    dockNavbar: function(state) {
        window.SECU.App._data.app.set('dock.navbar', state);
    },

    watchScroll: function() {

        var data = this._data,
            app = window.SECU.App._data.app;

        data.nav = {};
        data.nav.spacer = document.getElementsByClassName('navbar-spacer')[0];

        function watch(event) {
            
            if (app.get('show.chat') && !app.get('chat.formActive')) {
                return;
            }
            
            if (document.body.scrollTop > data.nav.spacer.offsetTop) {
                window.SECU.Helpers.dockNavbar(true);
            } else {
                window.SECU.Helpers.dockNavbar(false);
            }
        }

        window.addEventListener('scroll', watch, false);
    },

    watchDragDrop: function() {

        var ractive = window.SECU.App._data.app,
            data = this._data;

        if (!ractive.get('supportedFeatures.dragdrop')) {
            return;
        }

        function dragdrop(event) {
            
            event.preventDefault();

            clearTimeout(data.dropTimeout);

            var type = null,
                path = null,
                files = null;

            switch(event.type) {
                case 'dragenter':
                case 'dragover':
                    ractive.set('dropActive', true);
                    data.dropTimeout = setTimeout(function() {
                        ractive.set('dropActive', false);
                    }, 1000);
                    break;
                case 'dragleave':
                    data.dropTimeout = setTimeout(function() {
                        ractive.set('dropActive', false);
                    }, 1000);
                    break;
                case 'drop':
                    ractive.set('dropActive', false);

                    files = event.dataTransfer.files;

                    if (document.getElementById('chatFile')) {
                        type = 'room';
                        path = 'chat.room.rawFile';
                    } else if (document.getElementById('messageFile')) {
                        type = 'encrypt';
                        path = 'encrypt.rawFile';
                    }

                    if (files.length && type && path) {
                        ractive.set(path, [event.dataTransfer.files[0]]);
                        ractive.fire('checkFile', type);
                    }
                    
                    break;
            }
        }

        document.body.addEventListener('dragover', dragdrop, false);
        document.body.addEventListener('dragenter', dragdrop, false);
        document.body.addEventListener('dragleave', dragdrop, false);
        document.body.addEventListener('drop', dragdrop, false);
    },

    checkLocation: function() {
        var loc = window.location.pathname,
            id = null;

        if (loc.indexOf('/c/') > -1) {
            id = window.location.pathname.substring(3);

            if (id.length) {
                window.SECU.App._data.app.set('chat.form.room', id);
            }

            window.SECU.App._data.app.fire('toggleView', 'chat');
        } else {
            id = window.location.pathname.substring(1);

            if (id.length) {
                window.SECU.App._data.app.set('decrypt.hash', id);
            }
        }
    },

    checkNotification: function() {
        window.SECU.App._data.app.set('supportedFeatures.notification', 'Notification' in window);
    },

    checkCopy: function() {
        window.SECU.App._data.app.set('supportedFeatures.copy', document.queryCommandSupported('copy'));
    },

    checkDownload: function() {
        window.SECU.App._data.app.set('supportedFeatures.download', 'download' in document.createElement('a'));
    },

    checkDragDrop: function() {
        var div = document.createElement('div');
        window.SECU.App._data.app.set('supportedFeatures.dragdrop', 'ondragstart' in div && 'ondrop' in div);
    },

    /*getAbsoluteHeight: function(el) {

        var styles = window.getComputedStyle(el),
            margin = parseFloat(styles['marginTop']) + parseFloat(styles['marginBottom']);

        return Math.ceil(el.offsetHeight + margin);
    },*/

    fixChatFeedHeight: function() {

        var _this = window.SECU.Helpers,
            chat = document.getElementById('chat-feed-block'),
            form = document.getElementById('chat-form-block'),
            scrolledToBottom = window.SECU.Chat.scrolledToBottom();

        if (!chat) {
            return;
        }
        
        chat.style.height = '0px';
        chat.style.height = _this.getPosition(form).top - _this.getPosition(chat).top + 'px';

        if (scrolledToBottom) {
            window.SECU.Chat.updateScroll('bottom');
        }
    },

    fixTextareaHeight: function(event, type) {
        var ractive = window.SECU.App._data.app,
            node = event ? event.node : document.getElementById(type + 'ContainerBody'),
            borderWidth = getComputedStyle(node).getPropertyValue('border-width');

        if (borderWidth.length) {
            borderWidth = parseInt(borderWidth, 10);
        } else {
            borderWidth = 1;
        }

        ractive.set(type + '.textareaHeight', '0px');

        if (node.scrollHeight > node.offsetHeight) {
            ractive.set(type + '.textareaHeight', (node.scrollHeight + borderWidth*2) + 'px');
        }
    },

    copyText: function(node) {

        node.select();
        document.execCommand('copy');
        node.blur();
        window.getSelection().removeAllRanges();
    },

    formatCounter: function(number) {
        
        number = parseInt(number, 10);
        return number.toLocaleString();
    }
};
