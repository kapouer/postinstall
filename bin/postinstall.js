#!/usr/bin/env node

const postinstall = require('../');

const { promises: fs } = require('node:fs');
const minimist = require('minimist');

const opts = minimist(process.argv, {
	alias: {
		allow: 'a'
	}
});

if (opts.allow && typeof opts.allow == "string") {
	opts.allow = [opts.allow];
}

delete opts.a;
delete opts.cwd;

const configFile = opts._.length == 3 && opts._[2] || "package.json";
delete opts._;

(async () => {
	const buf = await fs.readFile(configFile);
	const obj = JSON.parse(buf);
	try {
		await postinstall.process(
			obj[process.env.npm_lifecycle_event || 'postinstall'] || {},
			opts
		);
		process.exit(0);
	} catch (err) {
		console.error(err);
		process.exit(1);
	}
})();
