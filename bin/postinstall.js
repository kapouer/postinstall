#!/usr/bin/node

var pify = require('util').promisify;
var postinstall = require('../');

var readFile = pify(require("fs").readFile);

var argv = process.argv;
var configFile = argv.length == 3 && argv[2] || "package.json";

readFile(configFile).then(function(data) {
	var obj = JSON.parse(data);
	return postinstall.process(obj.postinstall || {});
}).catch(function(err) {
	console.error(err);
});

