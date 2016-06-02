/**
 * Created by Tanya on 09.04.2016.
 */
// 5 Dependencies
var http = require('http'),
    fs = require('fs');

//6 configuration
port = 80;
fname = '.\\person.json'; //file a-la "database"

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
function execute(string, func) {
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

//3.3 data concatenation
function concat(data) {
    return Buffer.concat(data).toString();
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

function createCookie(text, type) {
    return {'Set-Cookie': text, 'Content-Type': type };
}

function HTTPresponce(res, head, head_options, write_mes, data, errorText) {
    res.writeHead(head, head_options);
    if (write_mes) {
        res.write(write_mes)
    }
    ;
    res.end((head === 200) ? data : errorText);
}

// 3.1 http responce wrapper for cashing
var cache = {};
function res_wrapper(req, res, head, head_options, write_mes, data, errorText) {
    if (data) {
        cache[req.url] = data;
        HTTPresponce(res, head, head_options, write_mes, data, errorText);
    }
}

//3.5
var routing = {
    '/': {
        'GET': function (req) {
            var ip = req.connection.remoteAddress;
            opts = createCookie('mycookie=test', 'text/html');
            message1 = '<h1>Welcome</h1>Your IP: ' + ip;
            message2 = '<pre>' + JSON.stringify(cookies) + '</pre>';

            return [200, opts, message1, message2, ''];
        }},
    '/person': {
        'GET': function(req) {
            var data = execute(rf(), transformPersonObj);
            var head = data ? 200 : 500;
            return [head, null, null, data, 'Read error'];

        },
        'POST': function(req) {
            // Receiving POST data
            var body = [], data, head, flag;
            req.on('data', function (chunk) {
                body.push(chunk);
            });

            req.on('end', function () {
                data = execute(concat(body), transformPersonObj);
                head = wf(data) ? 200 : 500;
                flag = true;
            });

            if (flag) { return [head, null, null, 'File saved', 'Write error']}
        }
    }
};

//3 HTTP Server
http.createServer(function (req, res) {

    cookies = parseCookies(req.headers.cookie);

    log(req);

    // Serve from cache
    if (cache[req.url] && req.method === 'GET') {
        res_wrapper(req, res, 200, null, cache[req.url], '');
    } else if (req.url in routing) {
        res_wrapper.apply(this, [req, res].concat(routing[req.url][req.method](req)))
        } else {
        HTTPresponce(res, 404, null, null, '', 'Path not found');
    }
}).listen(port);
