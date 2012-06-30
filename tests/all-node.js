/**
 * @license require-hm Copyright (c) 2012, The Dojo Foundation All Rights Reserved.
 * Available via the MIT or new BSD license.
 * see: http://github.com/jrburke/require-hm for details
 */

/**
 * Use the r.js script to run these tests. Be sure require.js is updated
 * in that script.
 */

/*jslint strict: false, evil: true */
/*global Packages: false, process: false, require: true, define: true, doh: false */

//A hack to doh to avoid dojo setup stuff in doh/runner.js
var skipDohSetup = true,
    fs, vm, load, env;
    //requirejsVars = {};

(function () {
    if (typeof Packages !== 'undefined') {
        env = 'rhino';
    } else if (typeof process !== 'undefined') {
        env = 'node';

        fs = require.nodeRequire('fs');
        vm = require.nodeRequire('vm');

        load = function (path) {
            return vm.runInThisContext(require.makeNodeWrapper(fs.readFileSync(path, 'utf8'), path));
        };


    }

}());

//Load the tests.
load("doh/runner.js");
load('doh/_' + env + 'Runner.js');
load('export/export-tests.js');
load('module/module-tests.js');
load('import/import-tests.js');
load('import/importstar-tests.js');

//Print out the final report
doh.run();
