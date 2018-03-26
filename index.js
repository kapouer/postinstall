exports.prepare = function(obj) {
	return Object.keys(obj).map(function(key) {
		var line = obj[key];
		var command, output, opts;
		if (typeof line == "object") {
			opts = Object.assign({}, line);
			command = line.command;
			output = line.output;
			delete opts.command;
			delete opts.output;
		} else {
			var parts = line.split(' ');
			command = parts.shift();
			output = parts.join(' ');
			opts = {};
		}
		return {
			command: command,
			output: output,
			input: key,
			options: opts
		};
	});
};

