/**
 * S3 Buckets require a CORS configuration that includes your origin in the <AllowedOrigin>
 *
 * <?xml version="1.0" encoding="UTF-8"?>
 * <CORSConfiguration xmlns="http://s3.amazonaws.com/doc/2006-03-01/">
 *     <CORSRule>
 *         <AllowedOrigin>*</AllowedOrigin>
 *         <AllowedMethod>GET</AllowedMethod>
 *         <MaxAgeSeconds>3000</MaxAgeSeconds>
 *         <AllowedHeader>Authorization</AllowedHeader>
 *     </CORSRule>
 *     <CORSRule>
 *         <AllowedOrigin>http://localhost:5000</AllowedOrigin>
 *         <AllowedMethod>PUT</AllowedMethod>
 *         <MaxAgeSeconds>3000</MaxAgeSeconds>
 *         <AllowedHeader>*</AllowedHeader>
 *     </CORSRule>
 * </CORSConfiguration>
 * 
 */

var crypto = require('crypto')
  , config

function sign(options) {

	var expires = (Date.now() + options.expires) / 1000 | 0;

	var str = options.method.toUpperCase()
		+ '\n\n' + options.mime
		+ '\n' + expires
		+ '\nx-amz-acl:public-read'
		+ '\n/' + options.bucket
		+ '/' + options.name;

	var sig = crypto
		.createHmac('sha1', options.secret)
		.update(str)
		.digest('base64');

	sig = encodeURIComponent(sig);

	return 'http://' + options.bucket
		+ '.' + config.region + '/'
		+ options.name
		+ '?Expires=' + expires
		+ '&AWSAccessKeyId=' + options.key
		+ '&Signature=' + sig;
}

module.exports = function(_config) {

	config = _config;

	return function(_req, _res, _next) {

		var obj = {
			bucket: config.bucket,
			key: config.key,
			secret: config.secret,
			expires: 5 * 60 * 1000,
			mime: _req.query.mime,
			name: _req.query.name,
			method: 'PUT'
		};

		_req.signed = sign(obj);
		_next();

	}

}