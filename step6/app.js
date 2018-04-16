var PORT = process.argv[2] || 8000;
var http = require('http');
var path = require('path');
var fs = require('fs');
var url = require('url');
var mime = require("./mime").types;
var config = require("./config");
var zlib = require("zlib");
var utils = require("./utils")



var server = http.createServer(function(request,response){
    // response.setHeader("Server", "Node/V5");
    // response.setHeader('Accept-Ranges', 'bytes');
    var pathname = url.parse(request.url).pathname;
    // var realPath = path.join("static", pathname);
    if (pathname.slice(-1) === "/") {
        pathname = pathname + config.Welcome.file;
    }
    var realPath = path.join("static", path.normalize(pathname.replace(/\.\./g, "")))
    var pathHandle = function(realPath) {
      fs.stat(realPath,function(err,stats){
        if(err){
          response.writeHead(404,"Not Found",{'Content-Type':'text/plain'});
          response.write("This request URL " + pathname + " was not found on this server.");
          response.end()
        }else{
          if (stats.isDirectory()) {
              realPath = path.join(realPath, "/", config.Welcome.file);
              pathHandle(realPath);
          }else{
            var ext = path.extname(realPath);
            ext = ext ? ext.slice(1) : 'unknown';
            var contentType = mime[ext] || "text/plain";
            response.setHeader('Content-Type',contentType);

            var lastModified = stats.mtime.toUTCString();
            var ifModifiedSince = "If-Modified-Since".toLowerCase();
            response.setHeader("Last-Modified", lastModified);

            if (ext.match(config.Expires.fileMatch)) {
                var expires = new Date();
                expires.setTime(expires.getTime() + config.Expires.maxAge * 1000);
                response.setHeader("Expires", expires.toUTCString());
                response.setHeader("Cache-Control", "max-age=" + config.Expires.maxAge);
            }
            if (request.headers[ifModifiedSince] && lastModified == request.headers[ifModifiedSince]) {
                response.writeHead(304, "Not Modified");
                response.end();
            }else{
              var compressHandle = function (raw, statusCode, reasonPhrase,contentLength) {
                  var stream = raw;
                  var acceptEncoding = request.headers['accept-encoding'] || "";
                  var matched = ext.match(config.Compress.match);

                  if (matched && acceptEncoding.match(/\bgzip\b/)) {
                      response.setHeader("Content-Encoding", "gzip");
                      stream = raw.pipe(zlib.createGzip());
                  } else if (matched && acceptEncoding.match(/\bdeflate\b/)) {
                      response.setHeader("Content-Encoding", "deflate");
                      stream = raw.pipe(zlib.createDeflate());
                  }else{
                      response.setHeader('Content-Length',contentLength);
                  }
                  response.writeHead(statusCode, reasonPhrase);
                  stream.pipe(response);
              };
              if (request.headers["range"]) {
                  var range = utils.parseRange(request.headers["range"], stats.size);
                  if (range) {
                      response.setHeader("Content-Range", "bytes " + range.start + "-" + range.end + "/" + stats.size);
                      var raw = fs.createReadStream(realPath, {"start": range.start, "end": range.end});
                      compressHandle(raw, 206, "Partial Content",(range.end - range.start + 1));
                  } else {
                      response.writeHead(416, "Request Range Not Satisfiable");
                      response.end();
                  }
              } else {
                  var raw = fs.createReadStream(realPath);
                  compressHandle(raw, 200, "Ok",stats.size);
              }
              // var raw = fs.createReadStream(realPath);
              // var acceptEncoding = request.headers['accept-encoding'] || "";
              // var matched = ext.match(config.Compress.match);
              //
              // if (matched && acceptEncoding.match(/\bgzip\b/)) {
              //     response.writeHead(200, "Ok", {'Content-Encoding': 'gzip'});
              //     raw.pipe(zlib.createGzip()).pipe(response);
              // } else if (matched && acceptEncoding.match(/\bdeflate\b/)) {
              //     response.writeHead(200, "Ok", {'Content-Encoding': 'deflate'});
              //     raw.pipe(zlib.createDeflate()).pipe(response);
              // } else {
              //     response.writeHead(200, "Ok");
              //     raw.pipe(response);
              // }
              // fs.readFile(realPath,"binary",function(err,file){
              //   if(err){
              //     response.writeHead(500,{
              //       'Content-Type':'text-plain'
              //     });
              //     response.end(err)
              //   }else{
              //
              //     response.writeHead(200,'OK');
              //     response.write(file,"binary")
              //     response.end()
              //   }
              // })
            }

          }
        }
      })
    }
    pathHandle(realPath)

})

server.listen(PORT);
console.log('打开 ' + 'http://localhost:' + PORT)
