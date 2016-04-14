'use strict';

window.SECU = window.SECU || {};

window.SECU.Ajax = {

    _data: {

        url: {
            
            api: {
                host: 'https://api.secu.su',
                feedback: '/feedback',
                post: '/s',
                get: '/s/',
                stat: '/stat'
            },
            
            web: {
                host: 'https://secu.su',
                page: '/'
            }
        }
    },

    assignHost: function() {

        var data = this._data,
            host = window.location.host;

        if (host.indexOf('localhost') > -1) {
            data.url.api.host = 'https://api-test.secu.su';
            data.url.web.host = host;
        }
    },

    call: function(obj) {

        var promise = new Promise(function(resolve, reject) {

            var client = new XMLHttpRequest();
            client.open(obj.method, obj.url, true);

            if (obj.contentType) {
                client.setRequestHeader("Content-type", obj.contentType);
            }
            
            client.send(obj.data);

            client.onload = function() {
                if (this.status >= 200 && this.status < 300) {
                    resolve(this.response);
                } else {
                    reject(this.statusText);
                }
            };
        
            client.onerror = function() {
                reject(this.statusText);
            };
        });

        return promise;
    },

    sendFeedback: function(obj) {

        var data = this._data;
        
        return this.call({
            method: 'POST',
            contentType: 'application/json;charset=UTF-8',
            data: JSON.stringify(obj),
            url: data.url.api.host + data.url.api.feedback
        });
    },

    requestContainer: function(id) {

        var data = this._data;

        return this.call({
            method: 'GET',
            url: data.url.api.host + data.url.api.get + id
        });
    },

    sendContainer: function(obj) {

        var data = this._data;

        return this.call({
            method: 'POST',
            contentType: 'application/json;charset=UTF-8',
            data: JSON.stringify(obj),
            url: data.url.api.host + data.url.api.post
        });
    },

    getCount: function() {

        var data = this._data;

        return this.call({
            method: 'GET',
            url: data.url.api.host + data.url.api.stat
        });
    }
};