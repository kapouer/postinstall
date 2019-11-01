const fs = require("fs").promises;
const Path = require('path');

module.exports = function(inputs, output) {
	return Promise.all(inputs.map(function(input) {
		const dirs = {};
		return copy(dirs, input, output);
	}));
};

function copy(dirs, from, to) {
	console.error("copy", from, to);
	return fs.stat(from).then(function(stat) {
		if (stat.isDirectory()) return;
		const dir = Path.dirname(to);
		return Promise.resolve().then(() => {
			if (dirs[dir]) return;
			dirs[dir] = true;
			return fs.mkdir(dir, {
				recursive: true
			});
		}).then(function() {
			return fs.copyFile(from, to);
		});
	});
}
