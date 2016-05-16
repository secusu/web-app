'use strict';

window.SECU = window.SECU || {};

window.SECU.Notifications = {

    _data: {
        active: null,
        activeTimeout: null,
        timeout: 4000
    },

    fire: function(obj) {

        if (Notification.permission !== 'granted') {
            return;
        }

        var data = this._data;

        clearTimeout(data.activeTimeout);

        if (data.active) {
            obj.vibrate = 200;
        }

        obj.tag = 'SECU_SYS';
        obj.icon = '/images/secu.png';
        
        data.active = new Notification('SËCU', obj);
        
        data.activeTimeout = setTimeout(function() {
            data.active.close();
            data.active = null;
        }, data.timeout);
    },

    init: function() {

        if (Notification.permission === 'denied') {
            return;
        }

        var _this = this;

        if (Notification.permission !== 'granted') {
            Notification.requestPermission(function (response) {
                if (response === 'granted') {
                    _this.fire({body: 'Thanks!'});
                }
            });
        }
    }
};