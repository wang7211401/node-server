var http = require('http')
var path = require('path')
var fs = require('fs')
var url = require('url')

var router = {
  '/getdata': function(req, res){
      var pathObj = url.parse(req.url, true)
      console.log(pathObj);
      var result
      if(pathObj.query){
        var page = pathObj.query.page;
        if(page == 1){
          result = [1,2,3]
          res.writeHead(200, {'Content-Type': 'text/html; charset=utf-8'});
          res.write(JSON.stringify(result))
        }else if(page == 2){
          result = [4,5,6]
          res.writeHead(200, {'Content-Type': 'text/html; charset=utf-8'});
          res.write(JSON.stringify(result))
        }else if(page == 3){
          result = [7,8,9]
          res.writeHead(200, {'Content-Type': 'text/html; charset=utf-8'});
          res.write(JSON.stringify(result))
        }else{
          result = "<h2>没有了</h2>"
          res.writeHead(200, {'Content-Type': 'text/html; charset=utf-8'});
          res.write(result)
        }
      }
      // res.writeHead(200, {'Content-Type': 'text/html; charset=utf-8'});
      // res.write(JSON.stringify(result))
      res.end()
  },
  '/hello': function(req, res){
    res.end('<h1>hello world</h1>')
  }
}


var server = http.createServer(function(req, res){
  console.log('__dirname',__dirname);
  console.log('__filename',__filename);

  var staticPath = path.join(__dirname, 'www')
  var pathObj = url.parse(req.url, true)
  var filePath = path.join(staticPath, pathObj.pathname)
  try{
    var fileContent = fs.readFileSync(filePath,'binary')
    console.log(fileContent)
    res.write(fileContent, 'binary')
    res.end()
  }catch(e){
    if(router[pathObj.pathname]){
      router[pathObj.pathname](req, res)
    }else{
      res.writeHead(404, 'not found')
      res.end('not found')
    }
  }
})

server.listen(8080)
console.log('打开 ' + 'http://localhost:8080')
