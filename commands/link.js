const { promises: fs } = require("node:fs");
const Path = require('node:path');

module.exports = async function(inputs, output) {
	if (inputs.length > 1) {
		throw new Error("Cannot symlink more than one file at once to " + output);
	}
	const input = inputs[0];
	await fs.access(input);
	try {
		const stats = await fs.lstat(output);
		if (stats.isSymbolicLink()) await fs.unlink(output);
	} catch {
		// pass
	}
	return fs.symlink(Path.relative(Path.dirname(output), input), output);
};
