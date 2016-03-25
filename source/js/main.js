'use strict';

Ractive.DEBUG = false;

window.SECU = {

    _data: {

        params: {
            maxFileSize: 1572864
        },

        nav: {},
        
        url: {
            
            api: {
                host: 'https://api.secu.su',
                feedback: '/feedback',
                post: '/s',
                get: '/s/'
            },
            
            web: {
                host: 'https://secu.su',
                page: '/'
            }
        },

        encryptionParameters: {
            iterations: 4096,
            keySize: 256,
            authenticationStrength: 128,
            authenticatedData: 'SËCU',
            cipherMode: 'gcm'
        }
    },

    watchScroll: function() {

        var data = this._data;

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

    error: {
        
        show: function(messages) {

            var _this = window.SECU,
                data = _this._data,
                ractive = data.app;

            ractive.set('errorMessages', messages);
            ractive.set('showError', true);

            clearTimeout(data.errorTimeout);

            data.errorTimeout = setTimeout(function() {
                _this.error.hide();
            }, 3000);
        },

        hide: function() {

            var _this = window.SECU,
                data = _this._data,
                ractive = data.app;

            ractive.set('showError', false);
            clearTimeout(data.errorTimeout);
        }
    },

    ajax: function(obj) {

        var promise = new Promise(function(resolve, reject) {

            var client = new XMLHttpRequest();
            client.open(obj.method, obj.url, true);
            /*if (obj.isImage) {
                client.responseType = 'blob';
            }*/
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

    getRandomHexValue: function(words, paranoia) {
        
        return sjcl.random.randomWords(words, paranoia);
    },

    decrypt: function(user) {

        var enc = this._data.encryptionParameters,
            result = {},
            decryptedContainter = sjcl.decrypt(user.password, user.message, {}, result);

        return decryptedContainter;
    },

    encrypt: function(user) {

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
            encryptedContainter = sjcl.encrypt(user.password, user.message, params, result);

        return encryptedContainter;
    },

    checkLocation: function() {
        
        var data = this._data,
            id = window.location.pathname.substring(1);
        
        if (id.length) {
            data.app.set('decryptHash', id);
        }
    },

    getFileExtension: function(string) {
        return string.split('.').pop();
    },

    checkCopy: function() {
        this._data.app.set('copySupported', document.queryCommandSupported('copy'));
    },

    checkDownload: function() {
        this._data.app.set('downloadSupported', 'download' in document.createElement('a'));
    },

    fixHeight: function(event, type) {
        var ractive = SECU._data.app,
            node = event ? event.node : document.getElementById(type + 'ContainerBody'),
            borderWidth = getComputedStyle(node).getPropertyValue('border-width');

        if (borderWidth.length) {
            borderWidth = parseInt(borderWidth, 10);
        } else {
            borderWidth = 1;
        }

        ractive.set(type + 'TextareaHeight', '0px');

        if (node.scrollHeight > node.offsetHeight) {
            ractive.set(type + 'TextareaHeight', (node.scrollHeight + borderWidth*2) + 'px');
        }
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

    prettifySize: function(size) {
        size = Math.round(size/1000);

        if (size >= 1000) {
            size = (size/1000).toFixed(1) + 'MB'
        } else {
            size += 'KB'
        }

        return size;
    },

    resetApp: function() {

        var app = this._data.app;

        this.error.hide();

        history.replaceState({}, 'Sëcu', '/');
                
        app.set('encryptForm', {
            message: '',
            file: '',
            password: ''
        });

        app.set('formDisabled', false);
        app.set('textCopied', false);
        
        app.set('decryptDone', false);
        app.set('decryptSuccess', true);
        app.set('decryptHash', '');
        app.set('decryptLoaded', false);
        app.set('decryptFormActive', false);
        app.set('decryptMessage', '');
        app.set('decryptFiles', []);
        app.set('decryptFileForm', {
            message: '',
            password: ''
        });
        app.set('decryptForm', {
            message: '',
            password: ''
        });

        app.set('encryptDone', false);
        app.set('encryptLink', '');
        app.set('encryptFormActive', true);
        app.set('encryptLink', '');
        app.set('encryptRawFile', []);

        app.set('encryptFileData', {
            size: '',
            name: '',
            extension: ''
        });
        app.set('encryptFile', {
            message: '',
            password: ''
        });
        app.set('encryptForm', {
            message: '',
            password: ''
        });
    },

    init: function() {

        var _this = this,
            data = this._data;
            
        data.app = new Ractive({
                el: document.getElementsByClassName('secuApp')[0],
                template: '#secuApp',
                data: {
                    show: {
                        main: true,
                        faq: false,
                        feedback: false
                    },
                    formDisabled: false,
                    textCopied: false,
                    copySupported: true,
                    downloadSupported: true,

                    showError: false,
                    errorMessages: [],

                    feedbackSent: false,
                    feedbackForm: {
                        body: '',
                        email: ''
                    },

                    decryptHash: '',
                    decryptDone: false,
                    decryptSuccess: true,
                    decryptLoaded: false,
                    decryptFormActive: false,
                    decryptMessage: '',
                    decryptFiles: [],
                    decryptFileForm: {
                        message: '',
                        password: ''
                    },
                    decryptForm: {
                        message: '',
                        password: ''
                    },

                    encryptDone: false,
                    encryptFormActive: false,
                    encryptLink: '',
                    encryptRawFile: [],
                    encryptFileData: {
                        size: '',
                        name: '',
                        extension: ''
                    },
                    encryptFile: {
                        message: '',
                        password: ''
                    },
                    encryptForm: {
                        message: '',
                        password: ''
                    }
                }
            });

        data.app.on({

            hideError: function() {
                _this.error.hide();
            },

            toggleView: function(event, view) {
                
                event.original.preventDefault();

                _this.error.hide();

                var views = this.get('show');

                for (var key in views) {
                    this.set('show.' + key, false);
                }
                
                this.set('show.' + view, true);
            },

            sendFeedback: function(event) {

                event.original.preventDefault();

                _this.error.hide();

                if (!this.get('feedbackForm.body').length) {
                    _this.error.show(["The message can't be empty"]);
                    return;
                }

                var ractive = this;

                this.set('formDisabled', true);
                
                SECU.ajax({
                    method: 'POST',
                    contentType: 'application/json;charset=UTF-8',
                    data: JSON.stringify(this.get('feedbackForm')),
                    url: data.url.api.host + data.url.api.feedback
                }).then(
                    
                    function(response) {

                        ractive.set('feedbackSent', true);
                        ractive.set('formDisabled', false);
                        ractive.set('feedbackForm', {
                            body: '',
                            email: ''
                        });
                    },
                    
                    function(error) {
                        
                        _this.error.show([error]);
                    }
                );
            },

            fixHeight: _this.fixHeight,

            uploadFile: function(event) {

                event.original.preventDefault();

                if (this.get('encryptRawFile').length) {
                    this.set('encryptRawFile', []);
                } else {
                    this.find('#messageFile').click();
                }
            },

            downloadFile: function(event) {

                if (!this.get('downloadSupported')) {
                    event.original.preventDefault();
                    var win = window.open(event.node.href, '_blank');
                    win.focus();
                }
            },

            checkFile: function(event) {
                
                var file = this.get('encryptRawFile.0');

                _this.error.hide();
                
                if (!file) {
                    this.set('encryptFileData', {
                        name: '',
                        size: '',
                        extension: ''
                    });
                    return;
                }

                if (file.size > data.params.maxFileSize) {
                    this.set('encryptRawFile', []);
                    this.set('encryptFileData', {
                        name: file.name,
                        size: size,
                        extension: ext
                    });
                    _this.error.show(['The file is too big']);
                    return;
                }

                var ractive = this,
                    size = _this.prettifySize(file.size),
                    ext = _this.getFileExtension(file.name);

                _this.fileToBase64(file).then(
                    
                    function(response) {
                        ractive.set('encryptFile.message', response);
                        ractive.set('encryptFileData', {
                            name: file.name,
                            size: size,
                            extension: ext
                        });
                    },
                    
                    function(error) {

                        _this.error.show([error]);
                    }
                );
            },
            
            resetApp: function(event) {
                
                event.original.preventDefault();

                _this.resetApp();
            },

            requestContainer: function(event, id) {

                event.original.preventDefault();

                var ractive = this;

                this.set('formDisabled', true);

                SECU.ajax({
                    method: 'GET',
                    url: data.url.api.host + data.url.api.get + id
                }).then(
                    
                    function(response) {

                        response = JSON.parse(response);

                        if (response.data.hasOwnProperty('text')) {
                            
                            if (typeof response.data.text === 'string') {
                                ractive.set('decryptMessage', response.data.text);
                                ractive.set('decryptDone', true);

                                if (response.data.text.length) {
                                    setTimeout(function() {
                                        _this.fixHeight(null, 'decrypt');
                                    }, 0);
                                }
                            } else {
                                ractive.set('decryptForm.message', JSON.stringify(response.data.text));
                            }
                        } else {
                            /* Old structure. Remove on April 27th */

                            if (response.data.hasOwnProperty('plaintext')) {
                                ractive.set('decryptMessage', response.data.plaintext);
                                ractive.set('decryptDone', true);

                                if (response.data.plaintext.lebgth) {
                                    setTimeout(function() {
                                        _this.fixHeight(null, 'decrypt');
                                    }, 0);
                                }
                            } else {
                                ractive.set('decryptForm.message', JSON.stringify(response.data));
                            }
                        }

                        if (response.data.files && response.data.files[0]) {
                            ractive.set('decryptFiles.0.name', response.data.files[0].name);
                            ractive.set('decryptFiles.0.extension', _this.getFileExtension(response.data.files[0].name));
                            
                            if (typeof response.data.files[0].data === 'string') {
                                ractive.set('decryptDone', true);
                                ractive.set('decryptFiles.0.data', _this.base64ToBlob(response.data.files[0].data));
                            } else {
                                ractive.set('decryptFileForm.message', JSON.stringify(response.data.files[0].data));
                            }
                            
                        }

                        ractive.set('decryptLoaded', true);
                        ractive.set('decryptFormActive', true);
                        ractive.set('formDisabled', false);
                    },
                    
                    function(error) {
                        
                        _this.error.show([error]);
                    }
                );
            },

            selectInput: function(event) {
                
                event.node.select();
            },

            copyText: function(event, id) {

                event.original.preventDefault();
                
                var ractive = this,
                    input = document.getElementById(id);

                input.select();
                document.execCommand('copy');
                input.blur();
                window.getSelection().removeAllRanges();
                this.set('textCopied', true);

                setTimeout(function() {
                    ractive.set('textCopied', false);
                }, 1000);
            },
            
            createContainer: function(event) {

                event.original.preventDefault();

                _this.error.hide();

                if (!this.get('encryptForm.message').length && !this.get('encryptRawFile').length) {
                    _this.error.show(["There should be either message or file"]);
                    return;
                }

                this.set('formDisabled', true);

                var ractive = this,
                    password = this.get('encryptForm.password'),
                    container = '',
                    files = [];

                if (!password.length) {
                    container = this.get('encryptForm.message');
                } else {
                    container = JSON.parse(_this.encrypt(this.get('encryptForm')));
                }

                if (this.get('encryptRawFile').length) {
                    
                    if (!password.length) {
                        
                        files.push({
                            data: this.get('encryptFile.message'),
                            name: this.get('encryptFileData.name')
                        });
                    } else {
                        
                        this.set('encryptFile.password', password);
                        
                        files.push({
                            data: JSON.parse(_this.encrypt(this.get('encryptFile'))),
                            name: this.get('encryptFileData.name')
                        });
                    }
                }

                SECU.ajax({
                    method: 'POST',
                    contentType: 'application/json;charset=UTF-8',
                    data: JSON.stringify({
                        data: {
                            text: container,
                            files: files
                        }
                    }),
                    url: data.url.api.host + data.url.api.post
                }).then(
                    
                    function(response) {
                        
                        response = JSON.parse(response);

                        ractive.set('encryptLink', data.url.web.host + data.url.web.page + response.hash);
                        ractive.set('encryptFormActive', false);
                        ractive.set('encryptDone', true);
                        ractive.set('formDisabled', false);

                        setTimeout(function() {
                            document.getElementById('containerLink').select();
                        }, 0);
                    },
                    
                    function(error) {
                        
                        _this.error.show([error]);
                    }
                );
            },

            decryptContainer: function(event) {

                event.original.preventDefault();

                _this.error.hide();

                if (!this.get('decryptForm.password').length) {
                    _this.error.show(['You have to provide a password']);
                    return;
                }

                var password = this.get('decryptForm.password');

                this.set('formDisabled', true);
                this.set('decryptFileForm.password', password);

                if (this.get('decryptForm.message').length) {
                    try {
                        this.set('decryptMessage', _this.decrypt(this.get('decryptForm')));
                    } catch(e) {
                        this.set('decryptMessage', e.toString());
                        this.set('decryptSuccess', false);
                    }
                }

                if (this.get('decryptFileForm.message').length) {
                    try {
                        this.set('decryptFiles.0.data', _this.base64ToBlob(_this.decrypt(this.get('decryptFileForm'))));
                    } catch(e) {
                        this.set('decryptSuccess', false);
                    }
                }

                this.set('decryptFileForm', {
                    message: '',
                    password: ''
                });
                this.set('decryptForm', {
                    message: '',
                    password: ''
                });

                this.set('decryptDone', true);
                this.set('formDisabled', false);

                if (this.get('decryptSuccess') && this.get('decryptMessage').length) {
                    setTimeout(function() {
                        _this.fixHeight(null, 'decrypt');
                        setTimeout(function() {
                            document.getElementById('decryptContainerBody').select();
                        }, 0);
                    }, 0);
                }
            }
        });

        this.checkLocation();
        this.checkCopy();
        this.checkDownload();
        this.watchScroll();
    }
};

window.SECU.init();