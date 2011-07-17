/**
 * @license hm 0.1.0 Copyright (c) 2010-2011, The Dojo Foundation All Rights Reserved.
 * Available via the MIT or new BSD license.
 * see: http://github.com/jrburke/require-hm for details
 */

/*jslint strict: false, plusplus: false, regexp: false */
/*global require: false, XMLHttpRequest: false, ActiveXObject: false,
  define: false, process: false, window: false */

(function () {

    var fs, getXhr,
        progIds = ['Msxml2.XMLHTTP', 'Microsoft.XMLHTTP', 'Msxml2.XMLHTTP.4.0'],

        exportFunctionRegExp = /export\s+function\s+([A-Za-z\d\_]+)/g,
        exportVarRegExp = /export\s+var\s+([A-Za-z\d\_]+)/g,

        importModuleRegExp = /module|import/g,
        commaRegExp = /\,\s*$/,
        spaceRegExp = /\s+/,
        quoteRegExp = /['"]/,
        endingPuncRegExp = /[\,\;]\s*$/,
        moduleNameRegExp = /['"]([^'"]+)['"]/,
        braceRegExp = /[\{\}]/g,

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

    /**
     * Trims any trailing spaces and punctuation so just have a JS string
     * literal, and inserts the hm! loader plugin prefix if necessary. If
     * there is already a ! in the string, then leave it be, unless it
     * starts with a ! which means "use normal AMD loading for this dependency".
     *
     * @param {String} text
     * @returns text
     */
    function cleanModuleName(text) {
        var moduleName = moduleNameRegExp.exec(text)[1],
            index = moduleName.indexOf('!');

        if (index === -1) {
            // Needs the hm prefix.
            moduleName = 'hm!' + moduleName;
        } else if (index === 0) {
            //Normal AMD loading, strip off the ! sign.
            moduleName = moduleName.substring(1);
        }

        return "'" + moduleName + "'";
    }

    /**
     * Expands things like
     * import { draw: drawShape } from shape
     * to be variable assignments.
     */
    function expandImportRefs(text, moduleName) {
        //Strip off the curly braces
        text = text.replace(braceRegExp, '');

        //Split by commas
        var parts = text.split(','),
            modifiedText = '',
            colonParts, i, part;

        if (parts[0] === '*') {
            throw 'Does not support import * yet.';
        }

        for (i = 0; (part = parts[i]); i++) {
            colonParts = part.split(':');

            //Normalize foo to be foo:foo
            colonParts[1] = colonParts[1] || colonParts[0];

            modifiedText += 'var ' + colonParts[1] + ' = ' + moduleName + '.' + colonParts[0] + ';';
        }

        return modifiedText;
    }

    function transformText(type, text) {
        //Strip off the "module" or "import"
        text = text.substring(type.length, text.length);

        var modifiedText = '',
            spaceParts = text.split(spaceRegExp),
            i, j, varName, moduleName, fromIndex, firstChar, propRefs;

        //First find the "from" part.
        for (i = 0; i < spaceParts.length; i++) {
            if (spaceParts[i] === 'from') {
                fromIndex = i;

                //Only handle the foo from 'foo', not module foo {}
                if (type === 'module') {
                    if (fromIndex > 0) {
                        varName = spaceParts[fromIndex - 1];
                        moduleName = cleanModuleName(spaceParts[fromIndex + 1]);
                        modifiedText += 'var ' + varName + ' = ' + 'require(' + moduleName + ');\n';
                    }
                } else if (type === 'import') {
                    if (fromIndex > 0) {
                        //Clean up the module name, if a string, do a require() around it.
                        moduleName = spaceParts[fromIndex + 1];
                        if (quoteRegExp.test(moduleName)) {
                            moduleName = 'require(' + cleanModuleName(moduleName) + ')';
                        } else {
                            // Strip off any trailing punctuation
                            moduleName = moduleName.replace(endingPuncRegExp, '');
                        }

                        //Find the staring brace or * for the start of the import
                        propRefs = '';
                        for (j = fromIndex - 1; j >= 0; j--) {
                            firstChar = spaceParts[j].charAt(0);
                            if (firstChar === '{' || firstChar === '*') {
                                //Property refs.
                                propRefs = spaceParts.slice(j, fromIndex).join('');
                                modifiedText += expandImportRefs(propRefs, moduleName);
                                break;
                            }
                        }
                    }
                }
            }
        }

        //console.log('TEXT: ' + text + '\nMODIFIED: ' + modifiedText);

        return modifiedText;

        //import { draw: drawShape } from shape -> var shape = require(';

        //import { messageBox, confirmDialog } from widgets.alert

        //HMM:
        //import * from math;

    }


    function compile(text, config) {
        var transformedText, currentIndex, startIndex, segmentIndex, match,
            tempText;

        //export function foo() - > exports.foo = function
        text = text.replace(exportFunctionRegExp, function (match, funcName) {
            return 'exports.' + funcName + ' = function ' + funcName;
        });

        //export var foo -> exports.foo
        text = text.replace(exportVarRegExp, function (match, varName) {
            return 'exports.' + varName;
        });

        //Reset regexp to beginning of file.
        importModuleRegExp.lastIndex = 0;
        transformedText = '';
        currentIndex = 0;

        while ((match = importModuleRegExp.exec(text))) {
            //Just make the match the module or import string.
            match = match[0];

            startIndex = segmentIndex = importModuleRegExp.lastIndex - match.length;

            //Copy text segment before the match.
            transformedText += text.substring(currentIndex, startIndex);

            while (true) {
                //Find the end of the current set of statements.
                segmentIndex = text.indexOf('\n', segmentIndex);
                if (segmentIndex === -1) {
                    //End of the file. Consume it all.
                    segmentIndex = text.length - 1;
                    break;
                } else {
                    //Grab the \n in the match.
                    segmentIndex += 1;

                    tempText = text.substring(startIndex, segmentIndex);

                    //If the tempText ends with a ,[whitespace], then there
                    //is still more to capture.
                    if (!commaRegExp.test(tempText)) {
                        break;
                    }
                }
            }

            transformedText += transformText(match, text.substring(startIndex, segmentIndex));

            importModuleRegExp.lastIndex = currentIndex = segmentIndex;
        }

        // Finish transferring the rest of the file
        if (currentIndex < text.length - 1) {
            transformedText += text.substring(currentIndex, text.length);
        }

        //?? export x (not with var or named function) means setting export
        //value for whole module?

        return "define(function (require, exports, module) {\n" +
                transformedText +
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


                //console.log("FINAL TEXT:\n" + text);

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