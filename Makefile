build:
	@make install
	@component build --dev
	@component build --standalone sgUploadToS3 --name sgUploadToS3 --out demo
	@uglifyjs demo/sgUploadToS3.js > demo/sgUploadToS3.min.js --mangle

install:
	@npm install
	@component install --dev > /dev/null

demo:
	@open http://localhost:5000/demo.html
	@node demo/server

.PHONY: build install demo