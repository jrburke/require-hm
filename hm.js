/**
 * @license hm 0.1.0 Copyright (c) 2010-2011, The Dojo Foundation All Rights Reserved.
 * Available via the MIT or new BSD license.
 * see: http://github.com/jrburke/require-hm for details
 */

/*jslint strict: false, plusplus: false */
/*global require: false, XMLHttpRequest: false, ActiveXObject: false,
  define: false, process: false, window: false */

(function () {

    var fs, getXhr,
        progIds = ['Msxml2.XMLHTTP', 'Microsoft.XMLHTTP', 'Msxml2.XMLHTTP.4.0'],
        fetchText = function () {
            throw new Error('Environment unsupported.');
        },
        buildMap = [];

    if (typeof window !== "undefined" && window.navigator && window.document) {
        // Browser action
        getXhr = function () {
            //Would love to dump the ActiveX crap in here. Need IE 6 to die first.
            var xhr, i, progId;
            if (typeof XMLHttpRequest !== "undefined") {
                return new XMLHttpRequest();
            } else {
                for (i = 0; i < 3; i++) {
                    progId = progIds[i];
                    try {
                        xhr = new ActiveXObject(progId);
                    } catch (e) {}

                    if (xhr) {
                        progIds = [progId];  // so faster next time
                        break;
                    }
                }
            }

            if (!xhr) {
                throw new Error("getXhr(): XMLHttpRequest not available");
            }

            return xhr;
        };

        fetchText = function (url, callback) {
            var xhr = getXhr();
            xhr.open('GET', url, true);
            xhr.onreadystatechange = function (evt) {
                //Do not explicitly handle errors, those should be
                //visible via console output in the browser.
                if (xhr.readyState === 4) {
                    callback(xhr.responseText);
                }
            };
            xhr.send(null);
        };
    } else if (typeof process !== "undefined" &&
               process.versions &&
               !!process.versions.node) {
        //Using special require.nodeRequire, something added by r.js.
        fs = require.nodeRequire('fs');
        fetchText = function (path, callback) {
            callback(fs.readFileSync(path, 'utf8'));
        };
    }

    exportFunctionRegExp = /export\s+function\s+([A-Za-z\d\_]+)/g;
    exportVarRegExp = /export\s+var\s+([A-Za-z\d\_]+)/g;

    function compile(text, config) {

        //export function foo() - > exports.foo = function
        text = text.replace(exportFunctionRegExp, function (match, funcName) {
            return 'exports.' + funcName + ' = function ' + funcName;
        });

        //export var foo -> exports.foo
        text = text.replace(exportVarRegExp, function (match, varName) {
            return 'exports.' + varName;
        });

        //?? export x (not with var or named function) means setting export
        //value for whole module?

        //import { draw: drawShape } from shape -> var shape = require(';

        //import { messageBox, confirmDialog } from widgets.alert


        //module file from 'io/File';

        //HMM:
        //import * from math;

        return "define(['exports'], function (exports) {\n" +
                text +
                '\n});';
    }

    define({
        version: '0.1.0',

        load: function (name, require, load, config) {
            var path = require.toUrl(name + '.hm');
            fetchText(path, function (text) {

                //Do initial transforms.
                text = compile(text, config.hm);

                //Hold on to the transformed text if a build.
                if (config.isBuild) {
                    buildMap[name] = text;
                }

                //IE with conditional comments on cannot handle the
                //sourceURL trick, so skip it if enabled.
                /*@if (@_jscript) @else @*/
                if (!config.isBuild) {
                    text += "\r\n//@ sourceURL=" + path;
                }
                /*@end@*/

                load.fromText(name, text);

                //Give result to load. Need to wait until the module
                //is fully parsed, which will happen after this
                //execution.
                require([name], function (value) {
                    load(value);
                });
            });

        },

        write: function (pluginName, name, write) {
            if (name in buildMap) {
                var text = buildMap[name];
                write.asModule(pluginName + "!" + name, text);
            }
        }
    });

}());