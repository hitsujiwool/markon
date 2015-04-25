var fs = require('fs');
var resolve = require('path').resolve;
var marked = require('marked');
var hl = require('highlight.js');
var shoe = require('shoe');
var http = require('http');
var ecstatic = require('ecstatic')(__dirname + '/../public');
var through = require('through');
var chokidar = require('chokidar');

function compile(srcFile) {
  var opts = {
    gfm: true,
    tables: true,
    breaks: true,
    highlight: function(code) {
      return hl.highlightAuto(code).value;
    }
  };

  marked.setOptions(opts);
  var buffers = [];
  var s = through(function(data) {
    buffers.push(data);
  }, function() {
    marked(Buffer.concat(buffers).toString('utf8'), function(err, html) {
      if (err) {
        s.emit('error', err);
        return;
      }
      s.queue(html).queue(null);
    });
  });
  return fs.createReadStream(srcFile).pipe(s);
}

module.exports = function(path, opts) {
  var watcher;
  var port = opts.port || 3000;

  var server = http.createServer(ecstatic);
  server.listen(port, function() {
    console.log('\033[90m[init]\033[36m Listening on port %s\033[0m', port);
  });

  shoe(function(stream) {
    var absPath = resolve(path);
    if (watcher) watcher.close();
    watcher = chokidar.watch(absPath);    
    watcher.on('change', function() {
      console.log('\033[90m[render]\033[36m %s\033[0m', absPath);
      compile(absPath).pipe(stream, { end: false });
    });
    compile(absPath).pipe(stream, { end: false });
  }).install(server, '/markon');
};
