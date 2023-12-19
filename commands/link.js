const fs = require("fs").promises;
const Path = require('path');

module.exports = function(inputs, output) {
	if (inputs.length > 1) {
		throw new Error("Cannot symlink more than one file at once to " + output);
	}
	const input = inputs[0];
	return fs.access(input).then(() => {
		return fs.lstat(output).catch((err) => {
			// ignore lstat error
		}).then((stats) => {
			if (stats && stats.isSymbolicLink()) return fs.unlink(output);
		});
	}).then(() => {
		return fs.symlink(Path.relative(Path.dirname(output), input), output);
	});
};

