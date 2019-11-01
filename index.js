const pify = require('util').promisify;
const glob = pify(require('glob'));
const fs = require('fs').promises;
const resolveFrom = require('resolve-from');
const resolvePkg = require('resolve-pkg');
const Path = require('path');
const minimist = require('minimist');

exports.prepare = function(obj, globalOpts) {
	let list = [];
	Object.keys(obj).forEach(function(key) {
		const line = obj[key];
		let command, output, opts;
		if (Array.isArray(line)) {
			line.forEach(function(item) {
				list = list.concat(exports.prepare({[key]: item}, globalOpts));
			});
			return;
		}
		if (typeof line == "object") {
			opts = Object.assign({}, line);
			command = line.command;
			output = line.output;
			delete opts.command;
			delete opts.output;
		} else {
			const args = minimist(line.split(' '));
			if (args._.length == 2) {
				command = args._[0];
				output = args._[1];
			}
			delete args._;
			opts = args;
		}
		if (!command || !output) {
			console.error("Cannot parse postinstall command", line);
			return;
		}

		if (globalOpts.allow) {
			if (!globalOpts.allow.includes(command)) {
				console.error("Unauthorized postinstall command", command);
				return;
			}
		}
		list.push({
			command: command,
			output: output,
			input: key,
			options: opts
		});
	});
	return list;
};

exports.process = function(config, opts) {
	if (!opts) opts = {};
	const commands = exports.prepare(config, opts);
	return Promise.all(commands.map(function(obj) {
		if (!obj) return;
		return Promise.resolve().then(function() {
			return processCommand(obj, opts);
		});
	}));
};

function processCommand(obj, opts) {
	if (!opts.cwd) opts.cwd = process.cwd();
	else opts.cwd = Path.resolve(opts.cwd);

	let srcPath = resolvePkg(obj.input, {
		cwd: opts.cwd
	});
	if (!srcPath) srcPath = Path.resolve(opts.cwd, obj.input);
	var srcFile = Path.basename(srcPath);

	let commandFn;
	if (obj.command == "link" || obj.command == "copy" || obj.command == "concat") {
		commandFn = require(`./commands/${obj.command}`);
	} else {
		commandFn = require(resolveFrom(opts.cwd, `postinstall-${obj.command}`));
	}

	let destDir, destFile;
	if (obj.output.endsWith('/')) {
		destDir = obj.output;
	} else {
		destDir = Path.dirname(obj.output);
		destFile = Path.basename(obj.output);
	}

	const star = srcFile.indexOf('*') >= 0;
	const bundle = star && destFile && destFile.indexOf('*') < 0;

	destDir = Path.resolve(opts.cwd, destDir);
	assertRooted(opts.cwd, destDir);

	return fs.mkdir(destDir, {recursive:true}).then(function() {
		return glob(srcPath, {
			nosort: true,
			nobrace: true,
			noext: true
		}).then(function(paths) {
			if (paths.length == 0) throw new Error("No files found at " + srcPath);
			let list = paths;
			if (paths.length == 1 && obj.options.list) {
				list = obj.options.list.map(function(path) {
					return Path.join(paths[0], path);
				});
			}
			if (bundle || obj.options.list) return commandFn(list, obj.output, obj.options);
			return Promise.all(paths.map(function(input) {
				let outputFile;
				if (star) {
					const inputFile = Path.basename(input);
					if (!destFile) {
						outputFile = inputFile;
					} else { // bundle == false
						// replace * in destFile by the match in input basename
						const reg = new RegExp(srcFile.replace('*', '(\\w+)'));
						const part = reg.exec(inputFile)[1];
						outputFile = destFile.replace('*', part);
					}
				} else {
					outputFile = destFile || srcFile;
				}
				return commandFn([input], Path.join(destDir, outputFile), obj.options);
			}));
		});
	});
}

function assertRooted(root, path) {
	if (!Path.resolve(path).startsWith(root)) {
		throw new Error(`path is not in root:\n ${root}\n ${path}`);
	}
}

