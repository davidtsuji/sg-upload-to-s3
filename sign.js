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

module.exports = function(_config){

	var Policy = require('s3-policy')

	return function(_req, _res, _next) {

		var policy = Policy({

			acl:       'public-read',
			expires:   new Date(Date.now() + 3600000),
			bucket:    _config.bucket,
			secret:    _config.secret,
			key:       _config.key,
			name:      _config['name'] || '',
			length:    _config['bytes'] | 524288000

		});

		var s3 = {
			policy:    policy.policy,
			signature: policy.signature,
			bucket:    _config.bucket,
			acl:       'public-read',
			key:       _config.key,
		};

		_res.json({s3: s3});

	}

}