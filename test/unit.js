var common = require('./common');


describe("Unit tests", function suite() {
	this.timeout(10000);
	before(function() {
		return common.prepare();
	});

	after(function() {

	});

	it("should install local file link", function() {
		return common.cmd("local-file", "install").then(function({dir, pkg}) {
			return common.checkLinks(dir, pkg);
		});
	});

	it("should install dependency file link", function() {
		return common.cmd("dep-file", "install").then(function({dir, pkg}) {
			return common.checkLinks(dir, pkg);
		});
	});

	it("should install scoped dependency file link", function() {
		return common.cmd("scoped-dep-file", "install").then(function({dir, pkg}) {
			return common.checkLinks(dir, pkg);
		});
	});

	it("should install dependency wildcard link", function() {
		return common.cmd("dep-wildcard", "install").then(function({dir, pkg}) {
			return common.checkLinks(dir, pkg);
		});
	});

	it("should install dependency file installed within dependency", function() {
		return common.cmd("dep-dep-file", "install").then(function({dir, pkg}) {
			return common.checkLinks(dir, pkg);
		}).then(function() {
			return common.cmd("dep-dep-file", "update").then(function({dir, pkg}) {
				return common.checkLinks(dir, pkg);
			});
		});
	});

});
