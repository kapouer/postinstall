var fs = require("fs").promises;

module.exports = function(inputs, output) {
	if (inputs.length > 1) {
		throw new Error("Cannot copy more than one file at once to " + output);
	}
	var input = inputs[0];
	return fs.copyFile(input, output);
};

