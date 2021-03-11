M:=${shell pwd}/node_modules/.bin/

cmd:
	@echo Sync...
	@ts-node bin/cmd.ts

sponsor:
	@echo Sponsors...
	@ts-node bin/sponsors.ts

build:
	@echo build dev
	@${M}webpack 