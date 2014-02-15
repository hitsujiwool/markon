var fs = require('fs');
var path = require('path');
var markdown = require('markdown-stream');
var hl = require('highlight').Highlight;
var shoe = require('shoe');
var http = require('http');
var ecstatic = require('ecstatic')(__dirname + '/public');
var through = require('through');
var chokidar = require('chokidar');

function persist() {
  return through(null, function() {});
}

function stream(srcFile, dest) {
  var opts = {
    gfm: true,
    highlight: function(code, lang) {
      return hl(code, lang);
    }
  };
  fs.createReadStream(srcFile).pipe(markdown(opts)).pipe(persist()).pipe(dest);
}

module.exports = function(file, opts) {
  var lastPreviewedFile;
  var watcher;
  var port = opts.port || 3000;
  var extension = opts.extension;

  file = path.resolve(file || '.');
  
  shoe(function(dest) {
    var stats = fs.statSync(file);

    function onUpdate(file) {
      if (extension && path.extname(file).slice(1) !== extension) return;
      console.log('\033[90m[render]\033[36m %s\033[0m', file);
      lastPreviewedFile = file;
      stream(file, dest);      
    }

    if (!stats.isFile() && !stats.isDirectory()) throw new Error('error');

    if (watcher) watcher.close();

    if (stats.isFile()) {
      lastPreviewedFile = file;
    }
    
    // show last previewed file when browser is reloaded
    if (lastPreviewedFile) {
      stream(lastPreviewedFile, dest);
    }
    
    watcher = chokidar.watch(file, { ignoreInitial: true });
    console.log('\033[90mstart watching \033[36m*.%s\033[90m in \033[36m%s\033[0m', extension || '*', file);

    watcher
      .on('change', onUpdate)
      .on('add', onUpdate);    

  }).install(http.createServer(ecstatic).listen(port, function() {
    console.log('\033[90myou can preview changes at\033[36m http://localhost:%s\033[0m', port);
  }), '/markon');
};
