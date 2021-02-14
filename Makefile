M:=${shell pwd}/node_modules/.bin/

cmd:
	@echo Sync...
	@ts-node bin/cmd.ts

build:
	@echo build dev
	@${M}webpack 