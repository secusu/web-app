'use strict';

window.SECU = window.SECU || {};

window.SECU.File = {

    _data: {
        maxFileSize: 1572864
    },

    base64ToBlob: function(dataURI) {
        var byteString = atob(dataURI.split(',')[1]),
            mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0],
            ab = new ArrayBuffer(byteString.length),
            ia = new Uint8Array(ab);
        
        for (var i = 0; i < byteString.length; i++) {
            ia[i] = byteString.charCodeAt(i);
        }

        var bb = new Blob([ab], {type: mimeString}),
            blobUrl = URL.createObjectURL(bb);
        
        return blobUrl;
    },

    fileToBase64: function(file) {
        var fileReader = new FileReader(),
            promise = new Promise(function(resolve, reject) {

                try{
                    fileReader.onload = function(event) {
                        resolve(event.target.result);
                    };

                    fileReader.readAsDataURL(file);
                } catch(e) {
                    reject(e);
                }
        });

        return promise;
    },

    getExtension: function(string) {
        return string.split('.').pop();
    },

    prettifySize: function(size) {
        size = Math.round(size/1000);

        if (size >= 1000) {
            size = (size/1000).toFixed(1) + 'MB'
        } else {
            size += 'KB'
        }

        return size;
    },

    validated: function(filesArray) {
        
        var data = this._data,
            file = filesArray[0];
        
        if (!file) {
            return false;
        }

        if (file.size > data.maxFileSize) {
            return ['The file is too big'];
        }

        return file;
    }
};