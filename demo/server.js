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

var s3Signature = require(__dirname + '/../sign')({

	key:    "zdhim4jux81uxenybp55",
	secret: "nm1q38dvwsu0bjumrskiamd8wag0uqr0fdnsxuq1",
	bucket: "mybucket",
	region: "s3-ap-southeast-2.amazonaws.com"

})

app.get('/signS3', s3Signature, function(_req, _res){

	_res.send(_req.signed);

});

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});