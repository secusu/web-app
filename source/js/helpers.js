'use strict';

window.SECU = window.SECU || {};

window.SECU.Helpers = {

    _data: {},

    watchScroll: function() {

        var data = this._data;

        data.nav = {};

        data.nav.bar = document.getElementsByClassName('navbar')[0];
        data.nav.spacer = document.getElementsByClassName('navbar-spacer')[0];

        function watch(event) {

            if (document.body.scrollTop > data.nav.spacer.offsetTop) {
                data.nav.bar.classList.add('docked');
                data.nav.spacer.classList.add('docked');
            } else {
                data.nav.bar.classList.remove('docked');
                data.nav.spacer.classList.remove('docked');
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
                    if (document.getElementsByClassName('attachedFile').length) {
                        ractive.set('encrypt.rawFile', [event.dataTransfer.files[0]]);
                        ractive.fire('checkFile');
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
        
        var id = window.location.pathname.substring(1);
        
        if (id.length) {
            window.SECU.App._data.app.set('decrypt.hash', id);
        }
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

    fixHeight: function(event, type) {
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