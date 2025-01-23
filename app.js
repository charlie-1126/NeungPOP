var createError = require('http-errors');
var express = require('express');
var path = require('path');
var http = require('http');

//db
var db = require('./dbConnect');

// socket.js 파일 불러오기
var setupWebSocket = require('./socket');

var app = express();
var server = http.createServer(app);

// 웹소켓 설정
setupWebSocket(server);

app.use(express.static(path.join(__dirname, 'public')));

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

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
