'use strict';

var fs = require('fs');
var path = require('path');
var util = require('util');
var http = require('http');
var auth = require('http-auth');

var port = process.env.port || 1337;
var app = http.createServer(httpServer).listen(port);
var io = require('socket.io')(app);

// Basic Auth
var basic = null;
basic = auth({
    authRealm: 'id/pw is oogiri',
    authList : [
        'oogiri:oogiri'
    ]
});

// Seats
var seats = [];
try {
    seats = require('seats.json');
} catch (e) {
    seats = [
        {
            nick: 'utamaru',
            role: '司会者',
            zabuton: 1
        },
        {
            nick: 'kikuo',
            role: '回答者',
            zabuton: 1
        },
        {
            nick: 'koraku',
            role: '回答者',
            zabuton: 1
        },
        {
            nick: 'koyuza',
            role: '回答者',
            zabuton: 1
        },
        {
            nick: 'enraku',
            role: '回答者',
            zabuton: 1
        },
        {
            nick: 'shota',
            role: '回答者',
            zabuton: 1
        },
        {
            nick: 'taihei',
            role: '回答者',
            zabuton: 1
        }/*,
        {
            nick: 'yamada',
            role: '座布団運び',
            zabuton: 0
        }*/
    ];
}

var connectionCount = 0;

io.on('connection', function (socket) {
    
    connectionCount++;
    io.emit('count', connectionCount);
    console.log('connection', connectionCount);

    socket.emit('seats', seats);
    
    socket.on('zabuton++', function (data) {
        
        seats.forEach(function (seat) {
        
            if (seat.nick === data.nick) {
                seat.zabuton++;
            }
        });

        io.emit('seats', seats);

        fs.writeFileSync('seats.json', JSON.stringify(seats, null, '  '));
    });

    socket.on('disconnect', function () {
        
        connectionCount--;
        io.emit('count', connectionCount);
        console.log('connection', connectionCount);
    });
});

function httpServer(req, res) {

    // http request logging
    var log = function (statusCode) {
        util.log([
            statusCode,
            req.method + ':' + req.url,
            req.headers['x-forwarded-for'] || req.client.remoteAddress,
            (req.headers['user-agent'] || '').split(' ').pop() || '-'
        ].join(' '));
    };

    // serve static file
    var location = req.url;
    if (location.match(/(\?.*)$/) !== null) { location = location.match(/^(.+)\?.*$/)[1]; }
    if (location.match(/\/$/) !== null) { location += 'index.html'; }

    var filename = path.join('./web/', location);
    
    var ext = null;
    if (filename.match(/[^\/]+\..+$/) !== null) {
        ext = filename.split('.').pop();
    }

    // error response handler
    var resErr = function (code) {
        
        if (res.headersSent === false) {
            res.writeHead(code, { 'content-type': 'text/plain' });
        }
        if (req.method !== 'HEAD' && res.headersSent === false) {
            switch (code) {
                case 400:
                    res.write('400 Bad Request\n');
                    break;
                case 401:
                    res.write('401 Unauthorized\n');
                    break;
                case 403:
                    res.write('403 Forbidden\n');
                    break;
                case 404:
                    res.write('404 Not Found\n');
                    break;
                case 500:
                    res.write('500 Internal Server Error\n');
                    break;
            }
        }
        res.end();
        log(code);
    };
    
    // header writing handler
    var writeHead = function (code) {

        var type = 'text/plain';
        
        if (ext === 'html') { type = 'text/html'; }
        if (ext === 'js') { type = 'text/javascript'; }
        if (ext === 'css') { type = 'text/css'; }
        if (ext === 'png') { type = 'image/png'; }
        if (ext === 'json') { type = 'application/json; charset=utf-8'; }
        
        var head = {
            'Content-Type'             : type,
            'Server'                   : 'Zabuton (Node)',
            'Cache-Control'            : 'no-cache',
            'X-Content-Type-Options'   : 'nosniff',
            'X-Frame-Options'          : 'SAMEORIGIN',
            'X-XSS-Protection'         : '1; mode=block'
        };
        
        res.writeHead(code, head);
    };
    
    // if host request header is missing, response 400
    if (!req.headers.host) { return resErr(400); }
    
    // static file server
    var responseStatic = function () {
        
        if (fs.existsSync(filename) === false) { return resErr(404); }
        
        if (req.method !== 'HEAD' && req.method !== 'GET') {
            res.setHeader('Allow', 'HEAD, GET');
            return resErr(405);
        }
        
        var fstat = fs.statSync(filename);
        
        res.setHeader('Last-Modified', new Date(fstat.mtime).toUTCString());
        
        if (req.headers['if-modified-since'] && req.headers['if-modified-since'] === new Date(fstat.mtime).toUTCString()) {
            writeHead(304);
            log(304);
            return res.end();
        }
        
        res.setHeader('Content-Length', fstat.size);
        
        writeHead(200);
        log(200);
        
        if (req.method === 'GET') {
            fs.createReadStream(filename).pipe(res);
        } else {
            res.end();
        }
    };

    // safari web app support
    if (req.url.match(/^\/apple-.+\.png$/) !== null) {
        process.nextTick(responseStatic);
    } else {
        basic.apply(req, res, function () {
            process.nextTick(responseStatic);
        });
    }
}
