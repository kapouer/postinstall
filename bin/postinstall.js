#!/usr/bin/env node

var postinstall = require('../');

var fs = require('fs-extra');

var argv = process.argv;
var configFile = argv.length == 3 && argv[2] || "package.json";

fs.readJson(configFile).then(function(obj) {
	return postinstall.process(obj.postinstall || {});
}).catch(function(err) {
	console.error(err);
	process.exit(1);
});

