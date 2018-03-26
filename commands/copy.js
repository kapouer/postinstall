var fs = require("fs");
var pify = require('util').promisify;

fs = {
	copyFile: pify(fs.copyFile)
};

module.exports = function(srcPath, destPath) {
	return fs.copyFile(srcPath, destPath);
};

