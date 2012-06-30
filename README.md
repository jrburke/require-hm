# require-hm

A simulation of some APIs that are proposed for ECMAScript Harmony for
JavaScript modules, but done as a loader plugin that works with
[RequireJS](http://requirejs.org), and other AMD loaders that support
the [loader plugin API](http://requirejs.org/docs/plugins.html) supported by
RequireJS.

The APIs are taken from here:

* [harmony:modules](http://wiki.ecmascript.org/doku.php?id=harmony:modules)
* [harmony:module_loaders](http://wiki.ecmascript.org/doku.php?id=harmony:module_loaders)
* [harmony:modules_examples](http://wiki.ecmascript.org/doku.php?id=harmony:modules_examples)

Not all the APIs are supported, see further below for more details.

## Goals

The goal is to allow using harmony-like modules today, that work in today's
browsers and in Node. This allows playing with the APIs to make sure
they get some use and understanding before baking them into a standard.

It is also a way for me to experiment with the API and suggest changes in a way
that holds together in real code.

## Limitations

The loader plugin cannot do the fancy compilation and linking that native
support can do, but it can simulate a lot of it.

This means some things that would be early errors in a native implementation are
not early errors with this approach.

## Choices done outside the proposals

1) The harmony proposals do not define a way to translate dependency strings to
actual file paths, just mentions the ability to use URLs.

This plugin uses the AMD ID-to-path resolution for IDs.

2) .hm is used for the text files that are processed by this plugin, not .js
files. This is to help separate that these files are "special" and not regular
.js files.

## Supported

    export var foo = 'foo';
    export function foo() {};
    module Bar = 'Bar';

    import y from Bar;
    import {y} from Bar;
    import { modProp: localProp } from Bar;
    import * from Bar;

## Unsupported

1) The following import variation is not supported, since the `module` form
is sufficient:

    //Use `module Bar = 'Bar'` instead.
    //This is not supported:
    import "Bar.js" as Bar;

2) cyclical import * not supported.

Circular references that do import * on each other will not work.

3) Using identifiers for "inline modules" is not supported:

    module Bar {}

What will be supported, but is not there yet, will be using string IDs,
since this matches better to `module Bar = 'Bar'` usage, particularly when
modules are combined in a build:

    module 'Bar' {}

## Installing

Grab the following files in this repo:

* hm.js
* esprima.js

## Configuration

You can pass the following configuration options to the loader plugin
via the requirejs
[the module config](http://requirejs.org/docs/api.html#config-moduleconfig):

```javascript
requirejs.config({
    config: {
        hm: {
            //Will log to console the before and
            //after text.
            logTransform: true
        }
    }
});

//Now start loading harmony modules
//This load main.hm, transpiles it to AMD
//then executes.
require(['hm!main'], function (main) {
    console.log('main: ' + main);
});
```

## Running Tests

### In Browser

Open `tests/index.html` in a browser. Serve the tests from a web site,
since XMLHttpRequest (XHR) is used to fetch .hm, and some browsers have security
restrictions when using XHR from file:// URLs.

### In Node

From within the `tests` directory:

    node ../tools/r.js all-node.js
