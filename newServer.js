/**
 * Created by Tanya on 09.04.2016.
 */
// Dependencies
var http = require('http'),
    fs = require('fs');

// Cache
var cache = {};

//file with data
fname = '.\\person.json';

//1 read file
function rf() {
    return fs.readFileSync(fname);
}

//1 write file
function wf(data) {
    var state = true;
    fs.writeFile(fname, data, function (err) {
        state = !err;
    });
    return state;
}

//2 deserialize, execute with func and serialize data
function execute(string, func){
    var obj = JSON.parse(string);
    var new_obj = func(obj);
    return JSON.stringify(new_obj);
}

//4 business logic
function transformPersonObj(obj) {
    if (obj.name) obj.name = obj.name.trim();
    if (obj.birth) {
        var difference = new Date() - new Date(obj.birth);
        obj.age = Math.floor(difference / 31536000000);
        delete obj.birth;
    }
    return obj;
}

// 3.4 logging
function log(req) {
    var date = new Date().toISOString();
    console.log([date, req.method, req.url].join('  '));
}

//3.2 work with cookies
function parseCookies(cookie) {
    var cookies = {};
    if (cookie) cookie.split(';').forEach(function (item) {
        var parts = item.split('=');
        cookies[(parts[0]).trim()] = (parts[1] || '').trim();
    });
    return cookies;
}

//3.5 HTTP response
function HTTPreply(res, head, data, errorText) {
    res.writeHead(head);
    res.end((head === 200) ? data : errorText);
}

/*var routing = {
    '/': {'GET': function(req, res) {
        res.writeHead(200, {
            'Set-Cookie': 'mycookie=test',
            'Content-Type': 'text/html'
        });
        var ip = req.connection.remoteAddress;
        res.write('<h1>Welcome</h1>Your IP: ' + ip);
        res.end('<pre>' + JSON.stringify(cookies) + '</pre>');
    }},
    '/person': {
        'GET': function(req, res, data) {
            var head = data ? 200 : 500;
            HTTPreply(res, head, data, 'Read error');
        },
        'POST': function(req, res) {
            var body = [];
            req.on('data', function(chunk) {
                body.push(chunk);
            }).on('end', function() {
                var data = Buffer.concat(body).toString();
                data = execute(data, transformPersonObj);

                cache[req.url] = data;
                var head = writeFile(data) ? 200 : 500;
                HTTPreply(res, head, 'File saved', 'Write error');
            });
        }
        }
    };
    */

//3 HTTP Server
http.createServer(function (req, res) {

    cookies = parseCookies(req.headers.cookie);

    log(req);

    // Serve from cache
    if (cache[req.url] && req.method === 'GET') {
        res.writeHead(200);
        res.end(cache[req.url]);
    } else {

        // Routing
        if (req.url === '/' && req.method === 'GET') {
            res.writeHead(200, {
                'Set-Cookie': 'mycookie=test',
                'Content-Type': 'text/html'
            });
            var ip = req.connection.remoteAddress;
            res.write('<h1>Welcome</h1>Your IP: ' + ip);
            res.end('<pre>' + JSON.stringify(cookies) + '</pre>');
        } else if (req.url === '/person') {
            if (req.method === 'GET') {
                var data = execute(rf(), transformPersonObj);

                cache[req.url] = data;

                var head = data ? 200 : 500;
                HTTPreply(res, head, data, 'Read error');
            } else if (req.method === 'POST') {

                // Receiving POST data
                var body = [];
                req.on('data', function(chunk) {
                    body.push(chunk);
                }).on('end', function() {
                    var data = Buffer.concat(body).toString();
                    data = execute(data, transformPersonObj);

                    cache[req.url] = data;
                    var head = writeFile(data) ? 200 : 500;
                    HTTPreply(res, head, 'File saved', 'Write error');
                });
            }
        } else {
            HTTPreply(res, 404, '', 'Path not found');
        }
    }

}).listen(80);