var express = require('express')
  , http = require('http')
  , path = require('path');

var app = express();
app.set('port', process.env.PORT || 5000);
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname)));
app.use(express.static(path.join(__dirname + '/../build')));


app.get('/config/s3', require(__dirname + '/../sign')({

	key:    'zdhim4jux81uxenybp55',
	secret: 'nm1q38dvwsu0bjumrskiamd8wag0uqr0fdnsxuq1',
	bucket: 'mybucket'

}));

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});