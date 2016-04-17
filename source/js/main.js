'use strict';

Ractive.DEBUG = false;

window.SECU = window.SECU || {};

window.SECU.App = {

    _data: {

        params: {
            encrypt : {
                done: false,
                link: '',
                formActive: true,
                rawFile: [],
                fileData: {
                    size: '',
                    name: '',
                    extension: ''
                },
                file: {
                    message: '',
                    password: ''
                },
                form: {
                    message: '',
                    password: ''
                },
                textareaHeight: '0px'
            },
            decrypt: {
                done: false,
                success: true,
                hash: '',
                loaded: false,
                formActive: false,
                message: '',
                files: [],
                fileForm: {
                    message: '',
                    password: ''
                },
                form: {
                    message: '',
                    password: ''
                },
                textareaHeight: '0px'
            },
            feedback: {
                sent: false,
                form: {
                    body: '',
                    email: ''
                },
                textareaHeight: '0px'
            }
        }
    },

    reinitApp: function(reset) {

        var data = this._data,
            app = data.app;

        if (reset) {
            window.SECU.Error.hide();
            history.replaceState({}, 'Sëcu', '/');
        }

        app.set('formDisabled', false);
        app.set('textCopied', false);
        app.set('dropActive', false);
        
        app.set('decrypt', JSON.parse(JSON.stringify(data.params.decrypt)));
        app.set('encrypt', JSON.parse(JSON.stringify(data.params.encrypt)));
        app.set('feedback', JSON.parse(JSON.stringify(data.params.feedback)));
    },

    refreshCount: function(number) {

        var data = this._data;
        data.app.set('counter.number', window.SECU.Helpers.formatCounter(number));
        data.app.set('counter.show', true);
    },

    init: function() {

        var _this = this,
            data = this._data,
            app = new Ractive({
                el: document.getElementsByClassName('secuApp')[0],
                template: '#secuApp',
                data: {
                    counter: {
                        show: false,
                        number: '9000'
                    },
                    
                    show: {
                        main: true,
                        faq: false,
                        feedback: false
                    },
                    
                    formDisabled: false,
                    textCopied: false,
                    dropActive: false,
                    
                    supportedFeatures: {
                        copy: true,
                        download: true,
                        dragdrop: true
                    },
                    
                    errors: {
                        show: false,
                        messages: []
                    }
                }
            });

        data.app = app;

        this.reinitApp();
        app.set('encrypt.formActive', false);

        app.on({

            hideError: function() {
                window.SECU.Error.hide();
            },

            toggleView: function(event, view) {

                if (event.original) {
                    event.original.preventDefault();
                }

                if (this.get('show.' + view)) {
                    return false;
                }

                window.SECU.Error.hide();

                var views = this.get('show');

                for (var key in views) {
                    this.set('show.' + key, false);
                }
                
                this.set('show.' + view, true);
            },

            sendFeedback: function(event) {

                if (event.original) {
                    event.original.preventDefault();
                }

                var form = this.get('feedback.form'),
                    ractive = this;

                window.SECU.Error.hide();

                if (!form.body.length) {
                    window.SECU.Error.show(["The message can't be empty"]);
                    return false;
                }

                ractive.set('formDisabled', true);

                window.SECU.Ajax.sendFeedback(form).then(
            
                    function(response) {

                        ractive.set('feedback.sent', true);
                        ractive.set('formDisabled', false);
                        ractive.set('feedback.form', {
                            body: '',
                            email: ''
                        });
                    },
                    
                    function(error) {
                        
                        window.SECU.Error.show([error]);
                    }
                );
            },

            fixHeight: window.SECU.Helpers.fixHeight,

            attachFile: function(event) {

                if (event.original) {
                    event.original.preventDefault();
                }

                if (this.get('encrypt.rawFile').length) {
                    this.set('encrypt.rawFile', []);
                    this.find('#messageFile').value = '';
                } else {
                    this.find('#messageFile').click();
                }
            },

            downloadFile: function(event) {

                if (!this.get('supportedFeatures.download')) {
                    if (event.original) {
                        event.original.preventDefault();
                    }
                    
                    var win = window.open(event.node.href, '_blank');
                    win.focus();
                }
            },

            checkFile: function(event) {

                window.SECU.Error.hide();

                var ractive = this,
                    file = window.SECU.File.validated(this.get('encrypt.rawFile'));

                if (file && !file[0]) {

                    var size = window.SECU.File.prettifySize(file.size),
                        ext = window.SECU.File.getExtension(file.name);

                    window.SECU.File.fileToBase64(file).then(

                        function(response) {
                            ractive.set('encrypt.file.message', response);
                            ractive.set('encrypt.fileData', {
                                name: file.name,
                                size: size,
                                extension: ext
                            });
                        },
                        
                        function(error) {

                            window.SECU.Error.show([error]);
                        }
                    );

                } else {
                    this.set('encrypt.fileData', {
                        name: '',
                        size: '',
                        extension: ''
                    });

                    if (file[0]) {
                        this.set('encrypt.rawFile', []);
                        window.SECU.Error.show(['The file is too big']);
                    }
                }
            },
            
            resetApp: function(event, reset) {
                
                if (event.original) {
                    event.original.preventDefault();
                }

                _this.reinitApp(reset);
            },

            requestContainer: function(event, id) {

                if (event.original) {
                    event.original.preventDefault();
                }

                var ractive = this,
                    file = null;

                ractive.set('formDisabled', true);

                window.SECU.Ajax.requestContainer(id).then(
            
                    function(response) {

                        response = JSON.parse(response);

                        if (!response.data.hasOwnProperty('text')) {
                            
                            /* Old structure. Remove on April 27th */

                            if (response.data.hasOwnProperty('plaintext')) {
                                ractive.set('decrypt.message', response.data.plaintext);
                                ractive.set('decrypt.done', true);

                                if (response.data.plaintext.length) {
                                    setTimeout(function() {
                                        window.SECU.Helpers.fixHeight(null, 'decrypt');
                                    }, 0);
                                }
                            } else {
                                ractive.set('decrypt.form.message', JSON.stringify(response.data));
                            }
                        } else {
                            if (typeof response.data.text === 'string') {
                                ractive.set('decrypt.message', response.data.text);
                                ractive.set('decrypt.done', true);

                                if (response.data.text.length) {
                                    setTimeout(function() {
                                        window.SECU.Helpers.fixHeight(null, 'decrypt');
                                    }, 0);
                                }
                            } else {
                                ractive.set('decrypt.form.message', JSON.stringify(response.data.text));
                            }
                        }

                        if (response.data.files && response.data.files[0]) {
                            file = response.data.files[0];
                            
                            ractive.set('decrypt.files.0.name', file.name);
                            ractive.set('decrypt.files.0.extension', window.SECU.File.getExtension(file.name));
                            
                            if (typeof file.data === 'string') {
                                ractive.set('decrypt.done', true);
                                ractive.set('decrypt.files.0.data', window.SECU.File.base64ToBlob(file.data));
                            } else {
                                ractive.set('decrypt.fileForm.message', JSON.stringify(file.data));
                            }
                            
                        }

                        ractive.set('decrypt.loaded', true);
                        ractive.set('decrypt.formActive', true);
                        ractive.set('formDisabled', false);
                    },
                    
                    function(error) {
                        
                        window.SECU.Error.show([error]);
                    }
                );
            },

            selectInput: function(event) {
                
                event.node.select();
            },

            copyText: function(event, id) {

                if (event.original) {
                    event.original.preventDefault();
                }
                
                var ractive = this;

                window.SECU.Helpers.copyText(document.getElementById(id));

                this.set('textCopied', true);

                setTimeout(function() {
                    ractive.set('textCopied', false);
                }, 1000);
            },
            
            createContainer: function(event) {

                if (event.original) {
                    event.original.preventDefault();
                }

                window.SECU.Error.hide();

                if (!this.get('encrypt.form.message').length && !this.get('encrypt.rawFile').length) {
                    window.SECU.Error.show(["There should be either message or file"]);
                    return false;
                }

                this.set('formDisabled', true);

                var ractive = this,
                    password = this.get('encrypt.form.password'),
                    container = '',
                    files = [];

                if (!password.length) {
                    container = this.get('encrypt.form.message');
                } else {
                    container = JSON.parse(window.SECU.Crypt.encrypt(this.get('encrypt.form')));
                }

                if (this.get('encrypt.rawFile').length) {
                    
                    if (!password.length) {
                        
                        files.push({
                            data: this.get('encrypt.file.message'),
                            name: this.get('encrypt.fileData.name')
                        });
                    } else {
                        
                        this.set('encrypt.file.password', password);
                        
                        files.push({
                            data: JSON.parse(window.SECU.Crypt.encrypt(this.get('encrypt.file'))),
                            name: this.get('encrypt.fileData.name')
                        });
                    }
                }

                window.SECU.Ajax.sendContainer({data: {text: container, files: files}}).then(
                    
                    function(response) {
                        
                        response = JSON.parse(response);

                        ractive.set('encrypt.link', window.SECU.Ajax._data.url.web.host + window.SECU.Ajax._data.url.web.page + response.hash);
                        ractive.set('encrypt.formActive', false);
                        ractive.set('encrypt.done', true);
                        ractive.set('formDisabled', false);

                        setTimeout(function() {
                            document.getElementById('containerLink').select();
                        }, 0);
                    },
                    
                    function(error) {
                        
                        window.SECU.Error.show([error]);
                    }
                );
            },

            decryptContainer: function(event) {

                if (event.original) {
                    event.original.preventDefault();
                }

                window.SECU.Error.hide();

                if (!this.get('decrypt.form.password').length) {
                    window.SECU.Error.show(['You must provide a password']);
                    return false;
                }

                var password = this.get('decrypt.form.password');

                this.set('formDisabled', true);
                this.set('decrypt.fileForm.password', password);

                if (this.get('decrypt.form.message').length) {
                    try {
                        this.set('decrypt.message', window.SECU.Crypt.decrypt(this.get('decrypt.form')));
                    } catch(e) {
                        this.set('decrypt.success', false);
                    }
                }

                if (this.get('decrypt.fileForm.message').length) {
                    try {
                        this.set('decrypt.files.0.data', window.SECU.File.base64ToBlob(window.SECU.Crypt.decrypt(this.get('decrypt.fileForm'))));
                    } catch(e) {
                        this.set('decrypt.success', false);
                    }
                }

                this.set('decrypt.fileForm', {
                    message: '',
                    password: ''
                });
                
                this.set('decrypt.form', {
                    message: '',
                    password: ''
                });

                this.set('decrypt.done', true);
                this.set('formDisabled', false);

                if (this.get('decrypt.success') && this.get('decrypt.message').length) {
                    setTimeout(function() {
                        window.SECU.Helpers.fixHeight(null, 'decrypt');
                        setTimeout(function() {
                            document.getElementById('decryptContainerBody').select();
                        }, 0);
                    }, 0);
                }
            }
        });

        window.SECU.Helpers.checkLocation();
        window.SECU.Helpers.checkCopy();
        window.SECU.Helpers.checkDownload();
        window.SECU.Helpers.checkDragDrop();
        window.SECU.Helpers.watchDragDrop();
        window.SECU.Helpers.watchScroll();

        window.SECU.Ajax.assignHost();

        window.SECU.Socket.init();
    }
};

window.SECU.App.init();