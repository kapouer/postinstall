const pify = require('util').promisify;
const fs = require('fs-extra');
const exec = pify(require('child_process').exec);
const Path = require('path');
const { glob } = require('glob');
const assert = require('assert');
const postinstall = require('../');

const tmpDir = Path.join(__dirname, "tmp");

exports.checkFiles = function(dir, list) {
	return Promise.all(list.map((test) => {
		return fs.readFile(Path.join(dir, test.path)).then((buf) => {
			assert.equal(buf.toString(), test.data);
		});
	}));
};

exports.check = function(dir, pkg, opts) {
	if (!opts) opts = {};
	const commands = postinstall.prepare(pkg.postinstall || {}, opts);
	let countCommands = 0;
	const cwd = opts.cwd || process.cwd();
	return Promise.all(commands.map((obj) => {
		if (!obj) {
			return;
		}
		if (obj.output.indexOf('*') >= 0) {
			return;
		}
		const dest = Path.resolve(cwd, Path.join(dir, obj.output));
		let count = 0;
		return Promise.resolve().then(() => {
			if (obj.input.endsWith('*')) return glob(Path.join(dest, '*'), {
				nosort: true,
				nobrace: true,
				noglobstar: true,
			});
			else return [dest];
		}).then((files) => {
			return Promise.all(files.map((file) => {
				return fs.lstat(file).then((stat) => {
					count++;
					if (obj.cmd == "link") {
						assert.ok(stat.isSymbolicLink(), `is symbolic link ${file}`);
					}
				}).catch((err) => {
					assert.ifError(err);
				});
			})).then(() => {
				assert.ok(count == files.length, `${count} files should have been installed`);
			});
		}).then(() => {
			countCommands++;
		});
	})).then(() => {
		return countCommands;
	});
};

exports.prepare = function() {
	return fs.remove(tmpDir).then(() => {
		return fs.copy(Path.join(__dirname, "fixtures"), tmpDir);
	});
};

exports.cmd = function(dir, cmd) {
	return run(Path.join(tmpDir, dir), cmd);
};

function run(dir, cmd) {
	if (!Array.isArray(cmd)) cmd = [cmd];
	return exec("npm " + cmd.join(' '), {
		cwd: dir,
		timeout: 10000,
		env: {
			HOME: process.env.HOME,
			PATH: process.env.PATH,
			npm_config_userconfig: '', // attempt to disable user config
			npm_config_ignore_scripts: 'false',
			npm_config_loglevel: 'error',
			npm_config_progress: 'false',
			npm_config_package_lock: 'false',
			npm_config_only: 'prod',
			npm_config_offline: 'true',
			npm_config_audit: 'false'
		}
	}).then((out) => {
		if (out.stderr) console.error(out.stderr);
		if (out.stdout) console.error(out.stdout);
		return fs.readFile(Path.join(dir, 'package.json')).then((buf) => {
			return {dir: dir, pkg: JSON.parse(buf)};
		});
	});
}
