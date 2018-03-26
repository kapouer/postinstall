#!/usr/bin/node

var pify = require('util').promisify;
var glob = pify(require('glob'));
var mkdirp = pify(require('mkdirp'));
var resolvePkg = require('resolve-pkg');
var postinstall = require('../');

var readFile = pify(require("fs").readFile);

var Path = require('path');

var argv = process.argv;
var configFile = argv.length > 0 && argv[argv.length - 1] || "package.json";

readFile(configFile).then(function(data) {
	var obj = JSON.parse(data);
	var commands = postinstall.prepare(obj.postinstall || {});
	return Promise.all(commands.map(function(obj) {
		return Promise.resolve().then(function() {
			processCommand(obj);
		}).catch(function(err) {
			console.error(`postinstall error, skipping ${obj.command} ${obj.input}`, err);
		});
	}));
}).catch(function(err) {
	console.error(err);
});

function processCommand(obj) {
	var srcPath = resolvePkg(obj.input) || Path.resolve(obj.input);
	var srcFile = Path.basename(srcPath);

	var commandFn;
	try {
		commandFn = require(`../commands/${obj.command}`);
	} catch(ex) {
		commandFn = require(`postinstall-${obj.command}`);
	}

	var destDir, destFile;
	if (obj.output.endsWith('/')) {
		destDir = obj.output;
		destFile = Path.join(obj.output, srcFile);
	} else {
		destDir = Path.dirname(obj.output);
		destFile = obj.output;
	}

	assertRooted(process.cwd(), destDir);
	return mkdirp(destDir).then(function() {
		if (srcFile == "*") {
			return glob(srcPath, {
				nosort: true,
				nobrace: true,
				noglobstar: true
			}).then(function(paths) {
				return Promise.all(paths.map(function(onePath) {
					return commandFn(onePath, Path.join(destDir, Path.basename(onePath)), obj.options);
				}));
			});
		} else {
			return commandFn(srcPath, destFile, obj.options);
		}
	});
}

function assertRooted(root, path) {
	if (!Path.resolve(path).startsWith(root)) {
		throw new Error(`path is not in root:\n ${root}\n ${path}`);
	}
}

