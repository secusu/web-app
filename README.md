# SЁCU WEB-APP

[![Gitter chat](https://badges.gitter.im/secusu/secusu.svg)](https://gitter.im/secusu/secusu)

SËCU is a web application design to create, store and provide [SËCU API](https://github.com/secusu/secusu) self-destructing data payloads.

<p align="center">
<img src="https://cloud.githubusercontent.com/assets/1849174/14016031/cbd32b58-f1d6-11e5-9a18-864e660b9af5.png">
</p>

## Server Configuration

### NGINX

```sh
server {
    listen      127.0.0.1:80;
    server_name secu.int;
    
    rewrite ^/(.*)/$ /$1 permanent;

    root `{/path/to/secu/web-app}`/public;
    index index.html;

    location ~* \.(jpg|jpeg|gif|png|ico|css|pdf|ppt|txt|bmp|rtf|js)$ {
        expires 7d;
    }

    location / {
        try_files $uri $uri/ /index.html?$query_string;
    }
}
```

## Installation

```sh
npm install
```

## Rebuild web application

You can build public directory using Gulp.

```sh
gulp
```

## Contributing

Please refer to [CONTRIBUTING.md](https://github.com/secusu/web-app/blob/master/CONTRIBUTING.md) for information on how to contribute to SËCU and its related projects.

## License

The SËCU web application is an open-sourced software licensed under the [MIT](https://opensource.org/licenses/MIT).
