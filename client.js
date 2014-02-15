var shoe = require('shoe');
var through = require('through');
var stream = shoe('/markon');

stream.pipe(through(function(data) {
  document.body.innerHTML = data;
}));
