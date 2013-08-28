var async = require('async')
  , request = require('superagent')
  , uid = require('sg-uid')
  , mime = require('mime')
  , type = require('type')
  , Emitter = require('emitter')
  , Upload = require('s3')

Emitter(exports);

function queueDrained(_error) {

	exports.emit('end', _error, exports);

}

function processUpload(_file, _callback) {

	var self = exports
	  , upload = Upload(_file.file, {name: _file.fileName});

	_file.upload = upload;

	upload.route = _file.route;

	upload.on('progress', function(_event){

		_file.progress = _event.percent | 0;
		calculateProgress();

	});

	upload.on('abort', function(){

		var abortedFiles;


		for (var i=0; i<self.data.uploads.length; i++) {

			if (self.data.uploads[i] === _file) {
				abortedFiles = self.data.uploads.splice(i, 1);
				break;
			}

		}

		self.emit('abort', abortedFiles, self);

	});

	upload.end(function(_error){

		if (_error) {
			_file.progress = 0;
			_file.error = _error;
			self.data.totalBytes -= _file.file.size | 0;
			self.emit('error', _error, self);
		} else {
			_file.progress = 100;
		}

		calculateProgress();

		_callback(_error);
		
	});

}

function lookupFileExtension(_file) {

	var extension
	  , mimeTypes = Object.keys(mime.types)

	for (var i=0; i < mimeTypes.length; i++) {

		if (mime.types[mimeTypes[i]] == _file.type) {
			extension = mimeTypes[i];
			break;
		}

	};

	return extension;

}

function getUTCUnixTimestamp() {
	return Date.parse(new Date().toUTCString()) / 1000;
}

function sumUploadedBytes(_files) {

	var uploadedBytes = 0;

	_files.forEach(function(_file){
		
		uploadedBytes += _file['error'] ? 0 : _file.file.size * (_file.progress / 100);

	});

	return uploadedBytes;

}

function calculateProgress() {

	var self = exports

	self.data.uploadedBytes = sumUploadedBytes(self.data.uploads);
	self.data.progress = (self.data.uploadedBytes / self.data.totalBytes) * 100;
	self.emit('progress', self);

}

exports.data = {

	uploads: [],
	totalBytes: 0,
	uploadedBytes: 0,
	progress: 0

}

exports.upload = function(_files, _generateFileName) {

	var self = this;

	self.emit('start', self);
	self.started = true;

	if ( ! self['queue']) {
		self.queue = async.queue(processUpload, self.defaults.numSimultaneousUploads);
		self.queue.drained = queueDrained;
	}

	for (var i=0; i<_files.length; i++) {

		var upload = {

			file: _files[i],
			progress: 0,
			fileName: (_generateFileName || self.defaults.generateFileName) ? getUTCUnixTimestamp() + '-' + uid(4) + '.' + lookupFileExtension(_files[i]) : _files[i].name,

		}

		self.data.totalBytes += upload.file.size | 0;
		self.data.uploads.push(upload);
		self.queue.push(upload);

	}

}

exports.defaults = {

	numSimultaneousUploads: 2,
	s3ConfigPath: '/config/s3',
	generateFileName: false,

}

setTimeout(function(){

	request
		.get(exports.defaults.s3ConfigPath)
		.set('Content-Type', 'application/json')
		.end(function(_error, _res){

			window.S3 = _res.body.s3;

		});

}, 100);