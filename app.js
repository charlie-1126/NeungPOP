var express = require('express');
var path = require('path');
var http = require('http');

//init db
require('./services/dbConnect');

// socket.js 파일 불러오기
var setupWebSocket = require('./socket');

var app = express();
var server = http.createServer(app);

// 웹소켓 설정
setupWebSocket(server);

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.render('index');
});

// catch 404 and forward to error handler
// app.use(function(req, res, next) {
//   res.redirect('/');
// });

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

server.listen(8080, () => {
  console.log('Server is running on http://localhost:8080');
})

module.exports = app;
