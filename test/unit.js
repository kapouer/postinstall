const common = require('./common');
const assert = require('assert');

describe("Unit tests", function suite() {
	this.timeout(10000);
	before(() => {
		return common.prepare();
	});

	after(() => {

	});

	it("should install local file link and copy", async () => {
		const { dir, pkg } = await common.cmd("local-file", "install");
		await common.check(dir, pkg);
		await common.checkFiles(dir, [{
			path: 'dest/bundle.js',
			data: "// one\n// two\n"
		}, {
			path: 'dest/three.min.css',
			data: "/* three */\n"
		}, {
			path: 'dest/four.min.css',
			data: "/* four */\n"
		}, {
			path: 'dest/texts.txt',
			data: "text2\ntext1\n"
		}, {
			path: 'dest/rec/other.js',
			data: "// something\n"
		}, {
			path: 'dest/rec/dir/deep/test.js',
			data: "console.log('test.js')\n"
		}]);
	});

	it("should install dependency file link", async () => {
		const { dir, pkg } = await common.cmd("dep-file", "install");
		await common.check(dir, pkg);
	});

	it("should install scoped dependency file link", async () => {
		const { dir, pkg } = await common.cmd("scoped-dep-file", "install");
		await common.check(dir, pkg);
	});

	it("should install dependency wildcard link", async () => {
		const { dir, pkg } = await common.cmd("dep-wildcard", "install");
		await common.check(dir, pkg);
	});

	// it("should install dependency file installed within dependency", async () => {
	// 	const { dir, pkg } = await common.cmd("dep-dep-file", "install");
	// 	await common.check(dir, pkg);
	// 	const { dir: dir2, pkg: pkg2 } = await common.cmd("dep-dep-file", "update");
	// 	await common.check(dir2, pkg2);
	// });

	it("should throw when nothing matches", async () => {
		await assert.rejects(() => common.cmd("throw", "install"));
	});

	it("should not execute not whitelisted commands", async () => {
		const { dir, pkg } = await common.cmd("whitelist", "install");
		const count = await common.check(dir, pkg, { allow: ['link'] });
		assert.equal(1, count); // 1 because the star is not yet checked
	});

	it("should run postinstall module with cwd set properly", async () => {
		const { dir, pkg } = await common.cmd("ignore-scripts", [
			"install",
			"--ignore-scripts"
		]);
		const cwd = './test/tmp/ignore-scripts';
		await require('../').process(
			require('./tmp/ignore-scripts/package.json').postinstall,
			{ cwd }
		);
		const count = await common.check(dir, pkg, { cwd });
		assert.equal(1, count);
	});

	it("should access non-exported files", async () => {
		const { dir, pkg } = await common.cmd("non-exported", "install");
		const count = await common.check(dir, pkg);
		assert.equal(1, count);
	});

	it("should access non-exported files from pure css module", async () => {
		const { dir, pkg } = await common.cmd("getjustcss", "install");
		const count = await common.check(dir, pkg);
		assert.equal(1, count);
	});

});
