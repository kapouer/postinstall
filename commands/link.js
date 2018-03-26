var fs = require("fs");
var pify = require('util').promisify;

fs = {
	access: pify(fs.access),
	lstat: pify(fs.lstat),
	unlink: pify(fs.unlink),
	symlink: pify(fs.symlink)
};

module.exports = function(srcPath, destPath) {
	return fs.access(srcPath).then(function() {
		return fs.lstat(destPath).catch(function(err) {
			// ignore lstat error
		}).then(function(stats) {
			if (stats && stats.isSymbolicLink()) return fs.unlink(destPath);
		});
	}).then(function() {
		return fs.symlink(srcPath, destPath);
	});
};

