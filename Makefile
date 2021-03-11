M:=${shell pwd}/node_modules/.bin/

build:
	@${M}tsc

cmd:
	@echo Sync...
	@node bin/cmd.js

sponsor:
	@echo Sponsors...
	@node bin/sponsors.js

build:
	@echo build dev
	@${M}webpack 