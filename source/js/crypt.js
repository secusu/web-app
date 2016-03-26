'use strict';

window.SECU = window.SECU || {};

window.SECU.Crypt = {

    _data: {
        encryptionParameters: {
            iterations: 4096,
            keySize: 256,
            authenticationStrength: 128,
            authenticatedData: 'SËCU',
            cipherMode: 'gcm'
        }
    },

    getRandomHexValue: function(words, paranoia) {
        
        return sjcl.random.randomWords(words, paranoia);
    },

    decrypt: function(obj) {

        var enc = this._data.encryptionParameters,
            result = {},
            decryptedContainter = sjcl.decrypt(obj.password, obj.message, {}, result);

        return decryptedContainter;
    },

    encrypt: function(obj) {

        var enc = this._data.encryptionParameters,
            result = {},
            params = {
                adata: enc.authenticatedData + '-' + new Date().getTime(),
                iter: enc.iterations,
                mode: enc.cipherMode,
                ts: enc.authenticationStrength,
                ks: enc.keySize,
                iv: this.getRandomHexValue(4,0),
                salt: this.getRandomHexValue(2,0)
            },
            encryptedContainter = sjcl.encrypt(obj.password, obj.message, params, result);

        return encryptedContainter;
    }
};