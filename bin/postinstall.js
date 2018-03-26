#!/usr/bin/node

var pify = require('util').promisify;
var glob = pify(require('glob'));
var mkdirp = pify(require('mkdirp'));
var resolvePkg = require('resolve-pkg');

var readFile = pify(require("fs").readFile);

var Path = require('path');

readFile('package.json').then(function(data) {
	var obj = JSON.parse(data);
	return Promise.all(Object.keys(obj.postinstall || {}).map(function(key) {
		var line = obj.postinstall[key];
		return Promise.resolve().then(function() {
			processKeyVal(key, line);
		}).catch(function(err) {
			console.error(`postinstall error, skipping ${key}`, err);
		});
	}));
}).catch(function(err) {
	console.error(err);
});

function processKeyVal(key, line) {
	var srcPath = resolvePkg(key) || Path.resolve(key);
	var srcFile = Path.basename(srcPath);

	var command, destPath, opts;

	if (typeof line == "object") {
		command = line.command;
		destPath = line.output;
		delete line.command;
		delete line.output;
		opts = line;
	} else {
		var parts = line.split(' ');
		command = parts.shift();
		destPath = parts.join(' ');
		opts = {};
	}
	var commandFn;
	try {
		commandFn = require(`../commands/${command}`);
	} catch(ex) {
		commandFn = require(`postinstall-${command}`);
	}

	var destDir, destFile;
	if (destPath.endsWith('/')) {
		destDir = destPath;
		destFile = Path.join(destPath, srcFile);
	} else {
		destDir = Path.dirname(destPath);
		destFile = destPath;
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
					return commandFn(onePath, Path.join(destDir, Path.basename(onePath)), opts);
				}));
			});
		} else {
			return commandFn(srcPath, destFile, opts);
		}
	});
}

function assertRooted(root, path) {
	if (!Path.resolve(path).startsWith(root)) {
		throw new Error(`path is not in root:\n ${root}\n ${path}`);
	}
}

function findModuleRoot(resolvedPath, moduleName) {
	moduleName = moduleName.split('/').pop();
	if (resolvedPath.endsWith(moduleName)) {
		return resolvedPath;
	} else {
		var dir = Path.dirname(resolvedPath);
		if (dir == resolvedPath) throw new Error("Cannot find module root: " + moduleName);
		return findModuleRoot(dir, moduleName);
	}
}
