const copy = require("@danieldietrich/copy");

module.exports = function(inputs, output) {
	return Promise.all(inputs.map((input) => {
		return copy(input, output);
	}));
};

