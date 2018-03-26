var pify = require('util').promisify;
var fs = require('fs');
fs = {
	lstat: pify(fs.lstat),
	readFile: pify(fs.readFile)
};
var rimraf = pify(require('rimraf'));
var mkdirp = pify(require('mkdirp'));
var spawn = require('spawn-please');
var Path = require('path');
var ncp = pify(require('ncp').ncp);
var glob = pify(require('glob'));
var assert = require('assert');
var postinstall = require('../');

var tmpDir = Path.join(__dirname, "tmp");

exports.checkFiles = function(dir, list) {
	return Promise.all(list.map(function(test) {
		return fs.readFile(Path.join(dir, test.path)).then(function(buf) {
			assert.equal(buf.toString(), test.data);
		});
	}));
};

exports.check = function(dir, pkg) {
	var commands = postinstall.prepare(pkg.postinstall || {});
	return Promise.all(commands.map(function(obj) {
		if (obj.output.indexOf('*') >= 0) {
			return;
		}
		var dest = Path.join(dir, obj.output);
		var count = 0;
		return Promise.resolve().then(function() {
			if (obj.input.endsWith('*')) return glob(Path.join(dest, '*'), {
				nosort: true,
				nobrace: true,
				noglobstar: true,
			});
			else return [dest]
		}).then(function(files) {
			return Promise.all(files.map(function(file) {
				return fs.lstat(file).then(function(stat) {
					count++;
					if (obj.command == "link") {
						assert.ok(stat.isSymbolicLink(), `is symbolic link ${file}`);
					}
				}).catch(function(err) {
					assert.ifError(err);
				});
			})).then(function() {
				assert.ok(count == files.length, `${count} files should have been installed`);
			});
		});
	}));
};

exports.prepare = function() {
	return rimraf(tmpDir).then(function() {
		return ncp(Path.join(__dirname, "fixtures"), tmpDir);
	});
};

exports.cmd = function(dir, cmd) {
	return run(Path.join(tmpDir, dir), cmd);
};

function run(dir, cmd) {
	if (!Array.isArray(cmd)) cmd = [cmd];
	return spawn("npm", cmd, {
		cwd: dir,
		timeout: 10000,
		env: {
			HOME: process.env.HOME,
			PATH: process.env.PATH,
			npm_config_userconfig: '', // attempt to disable user config
			npm_config_ignore_scripts: 'false',
			npm_config_loglevel: 'info',
			npm_config_progress: 'false',
			npm_config_package_lock: 'false',
			npm_config_only: 'prod',
			npm_config_offline: 'true'
		}
	}).then(function(out) {
		if (out) console.log(out);
		return fs.readFile(Path.join(dir, 'package.json')).then(function(buf) {
			return {dir: dir, pkg: JSON.parse(buf)};
		});
	});
}