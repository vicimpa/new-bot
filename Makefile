M:=${shell pwd}/node_modules/.bin/

tsc:
	@${M}tsc -w

cmd:
	@echo Sync...
	@node bin/cmd.js

sponsor:
	@echo Sponsors...
	@node bin/sponsors.js

build:
	@echo build dev
	@${M}webpack 