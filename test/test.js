var template = require('./template.stache!');
var nodeLists = require("can-view-nodelist");
var stache = require("can-stache");
var QUnit = require("steal-qunit");

QUnit.module("steal-stache");

QUnit.test("node-lists work", function(){
	var nl = nodeLists.register([], undefined, true);
	stache.registerHelper('importTestHelper', function(options) {
		QUnit.equal(options.nodeList, nl.replacements[0], 'correct node list reference');
	});

	template({}, {}, nl);
});
