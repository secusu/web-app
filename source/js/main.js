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
                formDisabled: false,
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
                formDisabled: false,
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
                formDisabled: false,
                sent: false,
                form: {
                    body: '',
                    email: ''
                },
                textareaHeight: '0px'
            },
            chat: {
                enabled: false,
                done: false,
                formDisabled: false,
                formActive: true,
                room: {
                    scrolled: true,
                    unread: false,
                    connection: {
                        link: '',
                        room: '',
                        name: '',
                        key: ''
                    },
                    feed: [],
                    roster: [],
                    rawFile: [],
                    fileData: {
                        size: '',
                        name: '',
                        extension: ''
                    },
                    input: {
                        text: '',
                        file: ''
                    },
                    feedHeight: '0px'
                },
                form: {
                    room: '',
                    password: ''
                }/*,
                textareaHeight: '0px'*/
            }
        }
    },

    reinitApp: function(reset) {

        var data = this._data,
            app = data.app;

        app.set('textCopied', false);
        app.set('dropActive', false);

        if (reset) {
            window.SECU.Error.hide();
            history.replaceState({}, 'Sëcu', '/');
        }

        switch(reset) {
            case 'package':
                app.set('decrypt', JSON.parse(JSON.stringify(data.params.decrypt)));
                app.set('encrypt', JSON.parse(JSON.stringify(data.params.encrypt)));
                break;
            case 'feedback':
                app.set('feedback', JSON.parse(JSON.stringify(data.params.feedback)));
                break;
            case 'chat':
                app.set('chat', JSON.parse(JSON.stringify(data.params.chat)));
                break;
            default:
                app.set('decrypt', JSON.parse(JSON.stringify(data.params.decrypt)));
                app.set('encrypt', JSON.parse(JSON.stringify(data.params.encrypt)));
                app.set('feedback', JSON.parse(JSON.stringify(data.params.feedback)));
                app.set('chat', JSON.parse(JSON.stringify(data.params.chat)));
                break;
        }
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
                    windowFocused: true,

                    dock: {
                        navbar: false,
                        chat: false
                    },

                    modal: {
                        active: false,
                        closeText: 'Close'
                    },

                    counter: {
                        show: false,
                        number: '9000'
                    },
                    
                    show: {
                        main: true,
                        chat: false,
                        faq: false,
                        feedback: false
                    },

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
                    },

                    humanTime: window.SECU.Helpers.getHumanTime
                }
            });

        data.app = app;

        this.reinitApp();
        //app.set('encrypt.formActive', false);

        app.on({

            scrollToBottom: function() {
                if (this.get('chat.room.unread')) {
                    window.SECU.Chat.updateScroll(window.SECU.Chat.unreadPos());
                } else {
                    window.SECU.Chat.updateScroll('bottom');
                }
            },

            cancelSubmit: function() {
                return false;
            },

            hideError: function() {
                window.SECU.Error.hide();
            },

            chatLogout: function() {
                window.SECU.Chat.logout({
                    room: this.get('chat.room.connection.room')
                });
                
                _this.reinitApp('chat');
                window.SECU.Chat.enable();
                
                this.set('dock.chat', false);
                window.SECU.Helpers.dockNavbar(false);
                
                this.fire('modalClose');
            },

            showChatLogout: function() {
                this.set('modal.type', 'chatLogout');
                this.set('modal.closeText', 'No');
                this.set('modal.active', true);
            },

            showChatLink: function() {
                this.set('modal.type', 'chatLink');
                this.set('modal.closeText', 'Close');
                this.set('modal.active', true);
            },

            showChatUsers: function() {
                this.set('modal.type', 'chatRoster');
                this.set('modal.closeText', 'Close');
                this.set('modal.active', true);
            },

            modalClose: function() {
                document.activeElement.blur();
                this.set('modal.active', false);
            },

            toggleView: function(event, view) {

                if (event && event.original) {
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

                if (view === 'chat') {
                    if (!this.get('chat.formActive')) {
                        this.set('dock.chat', true);
                        window.SECU.Helpers.dockNavbar(true);
                    
                        setTimeout(function() {
                            window.SECU.Chat.init();

                            if (!window.SECU.Chat.scrollPresent() || (window.SECU.Chat.scrollPresent() && window.SECU.Chat.scrolledToBottom())) {
                                app.set('chat.room.unread', false);
                            }
                        }, 0);
                    }
                } else {
                    this.set('dock.chat', false);
                    window.SECU.Chat.watchFeedScroll(true);
                    window.SECU.Helpers.dockNavbar(false);
                }
            },

            sendFeedback: function(event) {

                if (event && event.original) {
                    event.original.preventDefault();
                }

                var form = this.get('feedback.form'),
                    ractive = this;

                window.SECU.Error.hide();

                if (!form.body.length) {
                    window.SECU.Error.show(["The message can't be empty"]);
                    return false;
                }

                ractive.set('feedback.formDisabled', true);

                window.SECU.Ajax.sendFeedback(form).then(
            
                    function(response) {

                        ractive.set('feedback.sent', true);
                        ractive.set('feedback.formDisabled', false);
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

            fixTextareaHeight: window.SECU.Helpers.fixTextareaHeight,

            attachFile: function(event, type) {

                if (event && event.original) {
                    event.original.preventDefault();
                }

                var paths = null;

                switch(type) {
                    case 'room':
                        paths = {
                            raw: 'chat.room.rawFile',
                            ractive: 'chat.room.input.file',
                            id: '#chatFile'
                        };
                        break;
                    case 'encrypt':
                        paths = {
                            raw: 'encrypt.rawFile',
                            ractive: 'encrypt.file.message',
                            id: '#messageFile'
                        };
                        break;
                    default:
                        break;
                }

                if (this.get(paths.raw).length) {
                    this.set(paths.raw, []);
                    this.set(paths.ractive, '');
                    this.find(paths.id).value = '';
                } else {
                    this.find(paths.id).click();
                }
            },

            downloadFile: function(event) {

                if (!this.get('supportedFeatures.download')) {
                    if (event && event.original) {
                        event.original.preventDefault();
                    }
                    
                    var win = window.open(event.node.href, '_blank');
                    win.focus();
                }
            },

            checkFile: function(event, type) {

                window.SECU.Error.hide();

                var ractive = this,
                    paths = null;

                switch(type) {
                    case 'room':
                        paths = {
                            raw: 'chat.room.rawFile',
                            ractive: 'chat.room.input.file',
                            data: 'chat.room.fileData'
                        };
                        break;
                    case 'encrypt':
                        paths = {
                            raw: 'encrypt.rawFile',
                            ractive: 'encrypt.file.message',
                            data: 'encrypt.fileData'
                        };
                        break;
                    default:
                        break;
                }
                
                if (!paths) {
                    window.SECU.Error.show(['No file domain']);
                }

                var file = window.SECU.File.validated(this.get(paths.raw));

                if (file && !file[0]) {

                    var size = window.SECU.File.prettifySize(file.size),
                        ext = window.SECU.File.getExtension(file.name);

                    window.SECU.File.fileToBase64(file).then(

                        function(response) {
                            ractive.set(paths.ractive, response);
                            ractive.set(paths.data, {
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
                    this.set(paths.data, {
                        name: '',
                        size: '',
                        extension: ''
                    });

                    if (file[0]) {
                        this.set(paths.raw, []);
                        window.SECU.Error.show(['The file is too big']);
                    }
                }
            },
            
            resetApp: function(event, reset) {

                if (event && event.original) {
                    event.original.preventDefault();
                }

                _this.reinitApp(reset);
            },

            requestContainer: function(event, id) {

                if (event && event.original) {
                    event.original.preventDefault();
                }

                var ractive = this,
                    file = null;

                ractive.set('decrypt.formDisabled', true);

                window.SECU.Ajax.requestContainer(id).then(
            
                    function(response) {

                        response = JSON.parse(response);

                        if (typeof response.data.text === 'string') {
                            ractive.set('decrypt.message', response.data.text);
                            ractive.set('decrypt.done', true);

                            if (response.data.text.length) {
                                setTimeout(function() {
                                    window.SECU.Helpers.fixTextareaHeight(null, 'decrypt');
                                }, 0);
                            }
                        } else {
                            ractive.set('decrypt.form.message', JSON.stringify(response.data.text));
                            setTimeout(function() {
                                document.getElementById('decryptPassword').focus();
                            }, 0);
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
                        ractive.set('decrypt.formDisabled', false);
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

                if (event && event.original) {
                    event.original.preventDefault();
                }
                
                var ractive = this;

                window.SECU.Helpers.copyText(document.getElementById(id));

                this.set('textCopied', true);

                setTimeout(function() {
                    ractive.set('textCopied', false);
                }, 1000);
            },

            sendChat: function(event) {

                if (event && event.original) {
                    event.original.preventDefault();
                }

                var room = this.get('chat.room'),
                    message = room.input.text,
                    file = room.input.file;

                if (!message.trim().length && !file.length) {
                    return;
                }

                if (message.trim().length) {
                    message = JSON.parse(window.SECU.Crypt.encrypt({message: message, password: room.connection.key}));
                } else {
                    message = '';
                }

                if (file.length) {
                    file = [
                        {
                            data: JSON.parse(window.SECU.Crypt.encrypt({message: file, password: room.connection.key})),
                            name: room.fileData.name
                        }
                    ];
                } else {
                    file = [];
                }

                var timestamp = window.SECU.Helpers.generateTimestamp(),
                    dataPackage = {
                        room: room.connection.room,
                        data: {
                            text: message,
                            files: file
                        },
                        sent_at: timestamp
                    };

                window.SECU.Chat.addSentQueue(dataPackage);
                window.SECU.Chat.sendData(dataPackage);

                this.set('chat.room.input', {text: '', file: ''});
                this.set('chat.room.rawFile', []);
                this.find('#chatFile').value = '';
            },

            createChat: function(event) {

                if (event && event.original) {
                    event.original.preventDefault();
                }

                window.SECU.Error.hide();

                if (!this.get('chat.form.password').length) {
                    window.SECU.Error.show(["You should provide a password"]);
                    return false;
                }

                this.set('chat.formDisabled', true);

                var ractive = this,
                    auth = this.get('chat.form');

                if (!auth.room.length) {
                    window.SECU.Chat.create(auth);
                } else {
                    window.SECU.Chat.join(auth);
                }
            },
            
            createContainer: function(event) {

                if (event && event.original) {
                    event.original.preventDefault();
                }

                window.SECU.Error.hide();

                if (!this.get('encrypt.form.message').length && !this.get('encrypt.rawFile').length) {
                    window.SECU.Error.show(["There should be either message or file"]);
                    return false;
                }

                this.set('encrypt.formDisabled', true);

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
                        ractive.set('encrypt.formDisabled', false);

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

                if (event && event.original) {
                    event.original.preventDefault();
                }

                window.SECU.Error.hide();

                if (!this.get('decrypt.form.password').length) {
                    window.SECU.Error.show(['You must provide a password']);
                    return false;
                }

                var password = this.get('decrypt.form.password');

                this.set('decrypt.formDisabled', true);
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
                this.set('decrypt.formDisabled', false);

                if (this.get('decrypt.success') && this.get('decrypt.message').length) {
                    setTimeout(function() {
                        window.SECU.Helpers.fixTextareaHeight(null, 'decrypt');
                        setTimeout(function() {
                            document.getElementById('decryptContainerBody').select();
                        }, 0);
                    }, 0);
                }
            }
        });

        app.observe('windowFocused', function(newValue, oldValue, keypath) {
            if (newValue && this.get('show.chat')) {
                if (!window.SECU.Chat.scrollPresent()) {
                    this.set('chat.room.unread', false);
                }
            }
        });

        window.SECU.Helpers.Autolinker = new Autolinker({
            twitter: false
        });

        window.SECU.Helpers.checkLocation();
        window.SECU.Helpers.checkCopy();
        window.SECU.Helpers.checkDownload();
        window.SECU.Helpers.checkDragDrop();
        window.SECU.Helpers.checkNotification();
        
        window.SECU.Helpers.watchDragDrop();
        window.SECU.Helpers.watchScroll();
        window.SECU.Helpers.watchResize();
        window.SECU.Helpers.watchWindowFocus();

        window.SECU.Helpers.checkVisibility();
        window.SECU.Ajax.assignHost();
        window.SECU.Socket.init();
    }
};

window.SECU.App.init();