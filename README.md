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

The loader plugin just uses some regular expressions, and
it relies on existing JavaScript engines, which cannot do the fancy compilation
and linking that native support can do.

This means some things that would be early errors in a native implementation are
not early errors with this approach, and there are probably some parsing edge
cases that fail with this approach vs. native support.

It is possible to take this code and go further with some AST tools like
UglifyJS, and this code may expand for that purpose, but for now, the regexp
approach allows a quicker proof of concept.

## Supported APIs

TODO
module math {} NOT supported

string resolution: .js and mod/name
Mention .hm for the files that are harmony files.
Inclusion and exclusion lists?
