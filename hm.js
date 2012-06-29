/**
 * @license hm 0.2.0pre Copyright (c) 2010-2011, The Dojo Foundation All Rights Reserved.
 * Available via the MIT or new BSD license.
 * see: http://github.com/jrburke/require-hm for details
 */

/*jslint plusplus: true, regexp: true */
/*global require, XMLHttpRequest, ActiveXObject, define, process, window,
console */

define(['esprima'], function (esprima) {
    'use strict';

    /**
     * Helper function for iterating over an array. If the func returns
     * a true value, it will break out of the loop.
     */
    function each(ary, func) {
        if (ary) {
            var i;
            for (i = 0; i < ary.length; i += 1) {
                if (ary[i] && func(ary[i], i, ary)) {
                    break;
                }
            }
        }
    }

    var fs, getXhr,
        progIds = ['Msxml2.XMLHTTP', 'Microsoft.XMLHTTP', 'Msxml2.XMLHTTP.4.0'],

        exportRegExp = /export\s+([A-Za-z\d\_]+)(\s+([A-Za-z\d\_]+))?/g,
        commentRegExp = /(\/\*([\s\S]*?)\*\/|[^\:]\/\/(.*)$)/mg,
        importModuleRegExp = /module|import/g,
        commaRegExp = /\,\s*$/,
        spaceRegExp = /\s+/,
        quoteRegExp = /['"]/,
        endingPuncRegExp = /[\,\;]\s*$/,
        moduleNameRegExp = /['"]([^'"]+)['"]/,
        startQuoteRegExp = /^['"]/,
        braceRegExp = /[\{\}]/g,

        fetchText = function () {
            throw new Error('Environment unsupported.');
        };

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
     * Inserts the hm! loader plugin prefix if necessary. If
     * there is already a ! in the string, then leave it be, and if it
     * starts with a ! it means "use normal AMD loading for this dependency".
     *
     * @param {String} id
     * @returns id
     */
    function cleanModuleId(id) {
        id = moduleNameRegExp.exec(id)[1];
        var index = id.indexOf('!');

        if (index === -1) {
            // Needs the hm prefix.
            id = 'hm!' + id;
        } else if (index === 0) {
            //Normal AMD loading, strip off the ! sign.
            id = id.substring(1);
        }

        return id;
    }

    /**
     * Expands things like
     * import { draw: drawShape } from shape
     * to be variable assignments.
     */
/*
    function expandImportRefs(moduleMap, text, moduleName) {
        //Strip off the curly braces
        text = text.replace(braceRegExp, '');

        //Split by commas
        var parts = text.split(','),
            modifiedText = '',
            stars = [],
            hasQuotes = quoteRegExp.test(moduleName),
            stringLiteralName = hasQuotes ? moduleName : moduleMap[moduleName],
            colonParts,
            i,
            part;

        stringLiteralName = stringLiteralName.substring(1, stringLiteralName.length - 1);

        if (parts[0] === '*') {
            //Strip the quotes from the string name and put it in the stars
            stars.push(stringLiteralName);

            //Put in placeholder in module text to replace later once
            //module is fetched.
            modifiedText = '/ *IMPORTSTAR:' + stringLiteralName + '* /';
        } else {
            for (i = 0; (part = parts[i]); i++) {
                colonParts = part.split(':');

                //Normalize foo to be foo:foo
                colonParts[1] = colonParts[1] || colonParts[0];

                modifiedText += 'var ' + colonParts[1] + ' = ' +
                    (hasQuotes ? 'require(' + moduleName + ')' : moduleName) +
                    '.' + colonParts[0] + ';';
            }
        }

        return {
            stars: stars,
            text: modifiedText
        };
    }

    function transformText(moduleMap, type, text) {
        //Strip off the "module" or "import"
        text = text.substring(type.length, text.length);

        var modifiedText = '',
            spaceParts = text.split(spaceRegExp),
            stars = [],
            i, j, varName, moduleName, fromIndex, firstChar, propRefs, imports;

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
                        moduleMap[varName] = moduleName;
                    }
                } else if (type === 'import') {
                    if (fromIndex > 0) {
                        //Clean up the module name, if a string, do a require() around it.
                        moduleName = spaceParts[fromIndex + 1];
                        if (quoteRegExp.test(moduleName)) {
                            moduleName = cleanModuleName(moduleName);
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
                                imports = expandImportRefs(moduleMap, propRefs, moduleName);
                                if (imports.stars && imports.stars.length) {
                                    stars = stars.concat(imports.stars);
                                }
                                modifiedText += imports.text;
                                break;
                            }
                        }
                    }
                }
            }
        }

        //console.log('TEXT: ' + text + '\nMODIFIED: ' + modifiedText);

        return {
            stars: stars,
            text: modifiedText
        };
    }
*/

    function convertImportSyntax(tokens, start, end, moduleTarget) {
        var token = tokens[start],
            cursor = start,
            replacement = '',
            localVars = {},
            currentVar;

        if (token.type === 'Punctuator' && token.value === '*') {
            //import * from x
        } else if (token.type === 'Identifier') {
            //import y from x
            replacement += 'var ' + token.value + ' = ' +
                            moduleTarget + '.' + token.value + ';';
        } else if (token.type === 'Identifier' && token.value === '{') {
            cursor += 1;
            token = tokens[cursor];
            while (cursor !== end && token.value !== '}') {
                if (token.type === 'Identifier') {
                    if (currentVar) {
                        localVars[currentVar] = token.value;
                        currentVar = null;
                    } else {
                        currentVar = token.value;
                    }
                } else if (token.type === 'Punctuator') {
                    if (token.value === ',') {
                        if (currentVar) {
                            localVars[currentVar] = currentVar;
                            currentVar = null;
                        }
                    }
                }
                cursor += 1;
                token = tokens[cursor];
            }
            if (currentVar) {
                localVars[currentVar] = currentVar;
            }

            //Now serialize the localVars

        } else {
            throw new Error('Invalid import: import ' +
                token.value + ' ' + tokens[start + 1].value +
                ' ' + tokens[start + 2].value);
        }
    }

    function convertModuleSyntax(tokens, i) {
        //Converts `foo = 'bar'` to `foo = require('bar')`
        var varName = tokens[i],
            eq = tokens[i + 1],
            id = tokens[i + 2];

        if (varName.type === 'Identifier' &&
                eq.type === 'Punctuator' && eq.value === '=' &&
                id.type === 'String') {
            return varName.value + ' = require("' + cleanModuleId(id.value) + '")';
        } else {
            throw new Error('Invalid module reference: module ' +
                varName.value + ' ' + eq.value + ' ' + id.value);
        }
    }

    function transpile(text, target, replacement) {
        return text.substring(0, target.start) +
               replacement +
               text.substring(target.end, text.length);
    }

    function compile(path, text) {
        var stars = [],
            moduleMap = {},
            transforms = {},
            targets = [],
            currentIndex = 0,
            //Remove comments from the text to be scanned
            scanText = text.replace(commentRegExp, ""),
            transformedText = text,
            transformInputText,
            startIndex,
            segmentIndex,
            match,
            tempText,
            transformed,
            tokens;

        try {
            tokens = esprima.parse(text, {
                tokens: true,
                range: true
            }).tokens;
        } catch (e) {
            throw new Error('Esprima cannot parse: ' + path + ': ' + e);
        }

        each(tokens, function (token, i) {
            if (token.type !== 'Keyword') {
                //Not relevant, skip
                return;
            }

            var next = tokens[i + 1],
                next2 = tokens[i + 2],
                next3 = tokens[i + 3],
                cursor = i,
                replacement,
                moduleTarget,
                target;

            if (token.value === 'export') {
                // EXPORTS
                if (next.type === 'Keyword') {
                    if (next.value === 'var' || next.value === 'let') {
                        targets.push({
                            start: token.range[0],
                            end: next2.range[0],
                            type: 'export',
                            subType: next.value
                        });
                    } else if (next.value === 'function' && next2.type === 'Identifier') {
                        targets.push({
                            start: token.range[0],
                            end: next2.range[1],
                            type: 'export',
                            subType: 'function',
                            functionName: next2.value
                        });
                    } else {
                        throw new Error('Invalid export: ' + token.value +
                                        ' ' + next.value + ' ' + tokens[i + 2]);
                    }
                }
            } else if (token.value === 'module') {
                // MODULE
                // module Bar = "bar.js";
                replacement = 'var ';
                target = {
                    start: token.range[0],
                    type: 'module'
                };

                while (token.value === 'module' || (token.type === 'Punctuator'
                        && token.value === ',')) {
                    cursor = cursor + 1;
                    replacement += convertModuleSyntax(tokens, cursor);
                    token = tokens[cursor + 3];
                    //Current module spec does not allow for
                    //module a = 'a', b = 'b';
                    //must end in semicolon. But keep this in case for later,
                    //as comma separators would be nice.
                    //esprima will throw if comma is not allowed.
                    if ((token.type === 'Punctuator' && token.value === ',')) {
                        replacement += ',\n';
                    }
                }

                target.end = token.range[0];
                target.replacement = replacement;
                targets.push(target);
            } else if (token.value === 'import') {
                // IMPORT
                //import * from Bar;

                cursor = i;
                //Find the "from" in the statement
                while (tokens[cursor] &&
                        tokens[cursor].type !== 'Keyword' &&
                        tokens[cursor].value !== 'from') {
                    cursor += 1;
                }

                //Increase cursor one more value to find the module target
                moduleTarget = tokens[cursor + 1];

                //Convert module target to an AMD usable name. If a string,
                //then needs to be accessed via require()
                moduleTarget = startQuoteRegExp.test(moduleTarget) ?
                                'require(' + moduleTarget + ')' :
                                moduleTarget;
                replacement = convertImportSyntax(tokens, i, cursor - 1, moduleTarget);

                target.push({
                    type: 'import',
                    start: token.range[0],
                    end: tokens[cursor + 2].range[0],
                    replacement: replacement
                });
            }
        });

        //Now sort all the targets, but by start position, with the
        //furthest start position first, since we need to transpile
        //in reverse order.
        targets.sort(function (a, b) {
            return a.start > b.start ? -1 : 1;
        });

        //Now walk backwards through targets and do source modifications
        //to AMD. Going backwards is important since the modifications will
        //modify the length of the string.
        each(targets, function (target, i) {
            if (target.type === 'export') {
                if (target.subType === 'function') {
                    transformedText = transpile(transformedText, target, 'exports.' +
                                                    target.functionName +
                                                    ' = function ');
                } else {
                    transformedText = transpile(transformedText, target, 'exports.');
                }
            } else if (target.type === 'module' || target.type === 'import') {
                transformedText = transpile(transformedText, target, target.replacement);
            }
        });



/*

        //Reset regexp to beginning of file.
        importModuleRegExp.lastIndex = 0;

        while ((match = importModuleRegExp.exec(scanText))) {
            //Just make the match the module or import string.
            match = match[0];

            startIndex = segmentIndex = importModuleRegExp.lastIndex - match.length;

            while (true) {
                //Find the end of the current set of statements.
                segmentIndex = scanText.indexOf('\n', segmentIndex);
                if (segmentIndex === -1) {
                    //End of the file. Consume it all.
                    segmentIndex = scanText.length - 1;
                    break;
                } else {
                    //Grab the \n in the match.
                    segmentIndex += 1;

                    tempText = scanText.substring(startIndex, segmentIndex);

                    //If the tempText ends with a ,[whitespace], then there
                    //is still more to capture.
                    if (!commaRegExp.test(tempText)) {
                        break;
                    }
                }
            }


            transformInputText = scanText.substring(startIndex, segmentIndex);
            if (!transforms[transformInputText]) {
                transformed = transformText(moduleMap, match, transformInputText);
                transforms[transformInputText] = transformed.text;

                if (transformed.stars && transformed.stars.length) {
                    stars = stars.concat(transformed.stars);
                }
            }

            importModuleRegExp.lastIndex = currentIndex = segmentIndex;
        }

        //Apply the text transforms
        transformedText = text;
        for (transformInputText in transforms) {
            if (transforms.hasOwnProperty(transformInputText)) {
                transformedText = transformedText.replace(transformInputText, transforms[transformInputText]);
            }
        }

        //Convert export calls. Supported:
        //export var foo -> exports.foo
        //export function foo(){} -> exports.foo = function(){}
        //export varName -> exports.varName = varName
        transformedText = transformedText.replace(exportRegExp, function (match, varOrFunc, spacePlusName, name) {
            if (!name) {
                //exposing a local variable as an export value, where
                //its value was assigned before the export call.
                return 'exports.' + varOrFunc + ' = ' + varOrFunc;
            } else if (varOrFunc === 'var') {
                return 'exports.' + name;
            } else if (varOrFunc === 'function') {
                return 'exports.' + name + ' = function ' + name;
            } else {
                return match;
            }
        });

        //?? export x (not with var or named function) means setting export
        //value for whole module?
 */

        console.log("INPUT:\n" + text + "\n\nTRANSFORMED:\n" + transformedText);
        return {
            text: "define(function (require, exports, module) {\n" +
                  transformedText +
                  '\n});',
            stars: stars
        };
    }

    function finishLoad(require, load, name, text) {
        load.fromText(name, text);

        //Give result to load. Need to wait until the module
        //is fully parsed, which will happen after this
        //execution.
        require([name], function (value) {
            load(value);
        });
    }

    return {
        version: '0.2.0pre',

        load: function (name, require, load, config) {
            var path = require.toUrl(name + '.hm');
            fetchText(path, function (text) {
                var result = compile(path, text);
                //Do initial transforms.
                text = result.text;

                //IE with conditional comments on cannot handle the
                //sourceURL trick, so skip it if enabled.
                /*@if (@_jscript) @else @*/
                if (!config.isBuild) {
                    text += "\r\n//@ sourceURL=" + path;
                }
                /*@end@*/

                if (result.stars && result.stars.length) {
                    //First load any imports that require recursive analysis
                    //TODO: this will break if there is a circular
                    //dependency with each file doing an import * on each other.
                    require(result.stars, function () {
                        var i, star, mod, starText, prop;

                        //Now fix up the import * items for each module.
                        for (i = 0; i < result.stars.length; i++) {
                            star = result.stars[i];
                            starText = '';
                            mod = arguments[i];
                            for (prop in mod) {
                                if (mod.hasOwnProperty(prop)) {
                                    starText += 'var ' + prop + ' = require("' + star + '").' + prop + '; ';
                                }
                            }
                            text = text.replace('/*IMPORTSTAR:' + star + '*/', starText);
                        }

                        //console.log("FINAL TEXT:\n" + text);

                        finishLoad(require, load, name, text);
                    });


                } else {
                    finishLoad(require, load, name, text);
                }
            });
        }
    };
});