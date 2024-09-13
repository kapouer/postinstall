const { promisify: pify } = require('node:util');
const fs = require('fs-extra');
const exec = pify(require('node:child_process').exec);
const Path = require('node:path');
const { glob } = require('glob');
const assert = require('node:assert');
const postinstall = require('../');

const tmpDir = Path.join(__dirname, "tmp");

exports.checkFiles = function(dir, list) {
	return Promise.all(list.map(async test => {
		const buf = await fs.readFile(Path.join(dir, test.path));
		assert.equal(buf.toString(), test.data);
	}));
};

exports.check = async function(dir, pkg, opts) {
	if (!opts) opts = {};
	const commands = postinstall.prepare(pkg.postinstall || {}, opts);
	let countCommands = 0;
	const cwd = opts.cwd || process.cwd();
	await Promise.all(commands.map(async obj => {
		if (!obj) {
			return;
		}
		if (obj.output.indexOf('*') >= 0) {
			return;
		}
		const dest = Path.resolve(cwd, Path.join(dir, obj.output));
		let count = 0;
		const files = obj.input.endsWith('*') ? await glob(Path.join(dest, '*'), {
			nosort: true,
			nobrace: true,
			noglobstar: true,
		}) : [dest];

		await Promise.all(files.map(async file => {
			try {
				const stat = await fs.lstat(file);
				count++;
				if (obj.cmd == "link") {
					assert.ok(stat.isSymbolicLink(), `is symbolic link ${file}`);
				}
			} catch (err) {
				assert.ifError(err);
			}
		}));
		assert.ok(count == files.length, `${count} files should have been installed`);
		countCommands++;
	}));
	return countCommands;
};

exports.prepare = async function() {
	await fs.remove(tmpDir);
	return fs.copy(Path.join(__dirname, "fixtures"), tmpDir);
};

exports.cmd = function(dir, cmd) {
	return run(Path.join(tmpDir, dir), cmd);
};

async function run(dir, cmd) {
	if (!Array.isArray(cmd)) cmd = [cmd];
	const out = await exec("pnpm " + cmd.join(' '), {
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
	});
	if (out.stderr) console.error(out.stderr);
	if (out.stdout) console.error(out.stdout);
	const buf = await fs.readFile(Path.join(dir, 'package.json'));
	return {dir: dir, pkg: JSON.parse(buf)};
}
