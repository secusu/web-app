'use strict';

window.SECU = window.SECU || {};

window.SECU.Error = {

    _data: {},
        
    show: function(messages) {

        var _this = window.SECU.Error,
            data = _this._data,
            ractive = window.SECU.App._data.app;

        ractive.set('errors.messages', messages);
        ractive.set('errors.show', true);

        clearTimeout(data.errorTimeout);

        data.errorTimeout = setTimeout(function() {
            _this.hide();
        }, 3000);
    },

    hide: function() {

        var data = window.SECU.Error._data,
            ractive = window.SECU.App._data.app;

        ractive.set('errors.show', false);
        clearTimeout(data.errorTimeout);
    }
};