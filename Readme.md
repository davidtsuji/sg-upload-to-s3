# sg-upload-to-s3

Upload multiple files simultaneously directly from the browser to s3 using a queue. Extends https://github.com/component/s3.

## Installation

```bash
$ component install davidtsuji/sg-upload-to-s3
```

## Config

```js
var upload = require('sg-upload-to-s3');

upload.defaults.numSimultaneousUploads = 2;
upload.defaults.s3ConfigPath = '/config/s3';
upload.defaults.generateFileName = false;
```

- `numSimultaneousUploads` number of simultaneous uploads
- `s3ConfigPath` path to sign the s3 credentials
- `generateFileName` use a generated file name instead

## API

```js
var uploader = require('sg-upload-to-s3');

uploader.upload(FileList[, _generateFileName]);

// Events
uploader.upload('start', function(_uploader){});
uploader.on('progress', function(_uploader){});
uploader.on('abort', function(_abortedFiles, _uploader){});
uploader.on('error', function(_error, _uploader){});
uploader.on('end', function(_error, _uploader){});

// Abort
uploader.data.uploads[i].upload.abort();
```

### Uploader object

- `progress` 0-100
- `totalBytes` Total number of bytes of all uploads
- `uploadedBytes` Total number of uploaded bytes of all uploads
- `uploads` An array of upload objects

#### Upload object

- `file` The file object
- `fileName` Name of the file
- `progress` 0-100 of this file
- `route` the path to sign the s3 credentials
- `upload` the component upload object (https://github.com/component/s3)

### S3 Config

An end point must be created `s3ConfigPath` to sign the S3 credentials.

`sign.js` is included which can be used as middleware for express.

*Express example*

```js
app.get('/config/s3', require(__dirname + 'sign.js')({

    key:    'zdhim4jux81uxenybp55',
    secret: 'nm1q38dvwsu0bjumrskiamd8wag0uqr0fdnsxuq1',
    bucket: 'mybucket'

}));
```

The S3 bucket requires a CORS configuration which includes your origin.

*Example*
```xml
<CORSConfiguration xmlns="http://s3.amazonaws.com/doc/2006-03-01/">
    <CORSRule>
        <AllowedOrigin>*</AllowedOrigin>
        <AllowedMethod>GET</AllowedMethod>
        <MaxAgeSeconds>3000</MaxAgeSeconds>
        <AllowedHeader>Authorization</AllowedHeader>
    </CORSRule>
    <CORSRule>
        <AllowedOrigin>http://localhost:5000</AllowedOrigin>
        <AllowedMethod>POST</AllowedMethod>
        <MaxAgeSeconds>3000</MaxAgeSeconds>
        <AllowedHeader>*</AllowedHeader>
    </CORSRule>
</CORSConfiguration>
```

## License

MIT