/*[global-shim-start]*/
(function(exports, global, doEval){ // jshint ignore:line
	var origDefine = global.define;

	var get = function(name){
		var parts = name.split("."),
			cur = global,
			i;
		for(i = 0 ; i < parts.length; i++){
			if(!cur) {
				break;
			}
			cur = cur[parts[i]];
		}
		return cur;
	};
	var set = function(name, val){
		var parts = name.split("."),
			cur = global,
			i, part, next;
		for(i = 0; i < parts.length - 1; i++) {
			part = parts[i];
			next = cur[part];
			if(!next) {
				next = cur[part] = {};
			}
			cur = next;
		}
		part = parts[parts.length - 1];
		cur[part] = val;
	};
	var modules = (global.define && global.define.modules) ||
		(global._define && global._define.modules) || {};
	var ourDefine = global.define = function(moduleName, deps, callback){
		var module;
		if(typeof deps === "function") {
			callback = deps;
			deps = [];
		}
		var args = [],
			i;
		for(i =0; i < deps.length; i++) {
			args.push( exports[deps[i]] ? get(exports[deps[i]]) : ( modules[deps[i]] || get(deps[i]) )  );
		}
		// CJS has no dependencies but 3 callback arguments
		if(!deps.length && callback.length) {
			module = { exports: {} };
			var require = function(name) {
				return exports[name] ? get(exports[name]) : modules[name];
			};
			args.push(require, module.exports, module);
		}
		// Babel uses the exports and module object.
		else if(!args[0] && deps[0] === "exports") {
			module = { exports: {} };
			args[0] = module.exports;
			if(deps[1] === "module") {
				args[1] = module;
			}
		} else if(!args[0] && deps[0] === "module") {
			args[0] = { id: moduleName };
		}

		global.define = origDefine;
		var result = callback ? callback.apply(null, args) : undefined;
		global.define = ourDefine;

		// Favor CJS module.exports over the return value
		result = module && module.exports ? module.exports : result;
		modules[moduleName] = result;

		// Set global exports
		var globalExport = exports[moduleName];
		if(globalExport && !get(globalExport)) {
			set(globalExport, result);
		}
	};
	global.define.orig = origDefine;
	global.define.modules = modules;
	global.define.amd = true;
	ourDefine("@loader", [], function(){
		// shim for @@global-helpers
		var noop = function(){};
		return {
			get: function(){
				return { prepareGlobal: noop, retrieveGlobal: noop };
			},
			global: global,
			__exec: function(__load){
				doEval(__load.source, global);
			}
		};
	});
}
)({},window,function(__$source__, __$global__) { // jshint ignore:line
	eval("(function() { " + __$source__ + " \n }).call(__$global__);");
}
)
/*steal-stache@3.0.0-pre.2#add-bundles*/
define('steal-stache/add-bundles', function (require, exports, module) {
    var loader = require('@loader');
    module.exports = function (dynamicImports, parentName) {
        if (!dynamicImports.length) {
            return Promise.resolve();
        }
        var localLoader = loader.localLoader || loader;
        var bundle = localLoader.bundle;
        if (!bundle) {
            bundle = localLoader.bundle = [];
        }
        var bundleNormalizes = [];
        dynamicImports.forEach(function (moduleName) {
            var bundleNormalize = loader.normalize(moduleName, parentName).then(function (moduleName) {
                if (!~bundle.indexOf(moduleName)) {
                    bundle.push(moduleName);
                }
            });
            bundleNormalizes.push(bundleNormalize);
        });
        return Promise.all(bundleNormalizes);
    };
});
/*steal-stache@3.0.0-pre.2#steal-stache*/
define('steal-stache', function (require, exports, module) {
    'format cjs';
    var getIntermediateAndImports = require('can-stache/src/intermediate_and_imports');
    var addBundles = require('steal-stache/add-bundles');
    function template(imports, intermediate) {
        imports = JSON.stringify(imports);
        intermediate = JSON.stringify(intermediate);
        return 'define(' + imports + ',function(module, stache, mustacheCore){\n' + '\tvar renderer = stache(' + intermediate + ');\n' + '\treturn function(scope, options, nodeList){\n' + '\t\tvar moduleOptions = { module: module };\n' + '\t\tif(!(options instanceof mustacheCore.Options)) {\n' + '\t\t\toptions = new mustacheCore.Options(options || {});\n' + '\t\t}\n' + '\t\treturn renderer(scope, options.add(moduleOptions), nodeList);\n' + '\t};\n' + '});';
    }
    function translate(load) {
        var intermediateAndImports = getIntermediateAndImports(load.source);
        var commonDependencies = Promise.all([
            this.normalize('can-view-import', module.id),
            this.normalize('can-stache-bindings', module.id)
        ]);
        return Promise.all([
            addBundles(intermediateAndImports.dynamicImports, load.name),
            commonDependencies
        ]).then(function (results) {
            var imports = results[1];
            intermediateAndImports.imports.unshift.apply(intermediateAndImports.imports, imports);
            intermediateAndImports.imports.unshift('can-stache/src/mustache_core');
            intermediateAndImports.imports.unshift('can-stache');
            intermediateAndImports.imports.unshift('module');
            return template(intermediateAndImports.imports, intermediateAndImports.intermediate);
        });
    }
    module.exports = { translate: translate };
});
/*[global-shim-end]*/
(function(){ // jshint ignore:line
	window._define = window.define;
	window.define = window.define.orig;
}
)();