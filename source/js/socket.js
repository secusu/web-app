'use strict';

window.SECU = window.SECU || {};

window.SECU.Socket = {

    _data: {},

    init: function() {

        var data = this._data;

        data.socket = io.connect(window.SECU.Ajax._data.url.api.host + ':3000', {secure: true});
        data.socket.on('secu-channel:App\\Events\\SecuWasCreated', function(data) {
            window.SECU.App.refreshCount(data.id);
        });
    }
};