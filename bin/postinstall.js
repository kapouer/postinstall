#!/usr/bin/env node

var postinstall = require('../');

var fs = require('fs-extra');
var minimist = require('minimist');

var opts = minimist(process.argv, {
});

var configFile = opts._.length == 3 && opts._[2] || "package.json";
delete opts._;


fs.readJson(configFile).then(function(obj) {
	return postinstall.process(obj.postinstall || {}, opts);
}).catch(function(err) {
	console.error(err);
	process.exit(1);
});

