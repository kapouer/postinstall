var fs = require("fs");

module.exports = function(srcPaths, destPath) {
	var to = fs.createWriteStream(destPath, {flags: 'a'});
	return new Promise(function(resolve, reject) {
		write(srcPaths, to, resolve, reject);
	});
};

function write(files, to, resolve, reject) {
	if (files.length) {
		var readStream = fs.createReadStream(files.shift());
		readStream.pipe(to, {
			end: false
		});
		readStream.on('error', reject)
		readStream.on('end', function() {
			write(files, to, resolve, reject);
		});
	} else {
		to.end();
		resolve();
	}
}

