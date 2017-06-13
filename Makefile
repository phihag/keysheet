default: lint

deps:
	npm install

lint: eslint stylelint

eslint:
	@./node_modules/.bin/eslint keysheet.js

stylelint:
	@./node_modules/.bin/stylelint keysheet.css

.PHONY: default deps lint eslint
