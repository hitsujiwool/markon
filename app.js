require('./app.css');
var stream = require('shoe')('/markon');

stream.on('data', function(html) {
  document.getElementById('markdown').innerHTML = html;
});
