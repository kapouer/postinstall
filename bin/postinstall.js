#!/usr/bin/node

var pify = require('util').promisify;
var glob = pify(require('glob'));
var mkdirp = pify(require('mkdirp'));
var resolvePkg = require('resolve-pkg');
var postinstall = require('../');

var readFile = pify(require("fs").readFile);

var Path = require('path');

var argv = process.argv;
var configFile = argv.length == 3 && argv[2] || "package.json";

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
	} else {
		destDir = Path.dirname(obj.output);
		destFile = Path.basename(obj.output);
	}

	var star = srcFile.indexOf('*') >= 0;
	var bundle = star && destFile && destFile.indexOf('*') < 0;

	assertRooted(process.cwd(), destDir);
	return mkdirp(destDir).then(function() {
		return glob(srcPath, {
			nosort: true,
			nobrace: true,
			noglobstar: true,
			noext: true
		}).then(function(paths) {
			if (bundle) return commandFn(paths, obj.output, obj.options);
			return Promise.all(paths.map(function(input) {
				var outputFile;
				if (star) {
					var inputFile = Path.basename(input);
					if (!destFile) {
						outputFile = inputFile;
					} else { // bundle == false
						// replace * in destFile by the match in input basename
						var reg = new RegExp(srcFile.replace('*', '(\\w+)'));
						var part = reg.exec(inputFile)[1];
						outputFile = destFile.replace('*', part);
					}
				} else {
					outputFile = destFile || srcFile;
				}

				return commandFn(input, Path.join(destDir, outputFile), obj.options);
			}));
		});
	});
}

function assertRooted(root, path) {
	if (!Path.resolve(path).startsWith(root)) {
		throw new Error(`path is not in root:\n ${root}\n ${path}`);
	}
}

