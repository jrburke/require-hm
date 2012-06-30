
define('hm',{load: function(id){throw new Error("Dynamic load not allowed: " + id);}});
define('hm!two',['require','exports','module'],function (require, exports, module) {

exports.name = 'two';

exports.func = function () {
    return 'two function';
}
});
define('hm!three',['require','exports','module'],function (require, exports, module) {

exports.name = 'three';
});
define('four',{
    name: 'four'
});

define('hm!one',['require','exports','module','hm!two','hm!three','four'],function (require, exports, module) {

//Ask for some modules, use AMD module for four.
var two = require("hm!two");
var three = require("hm!three");
var four = require("four");

exports.twoName = two.name;

exports.twoFunction = two.func;

exports.threeName = three.name;

exports.fourName = four.name;
});
require({
    baseUrl: require.isBrowser ? '.' : 'module',
    paths: {
        hm: '../../hm',
        esprima: '../../esprima'
    }
});

require(["hm!one"],
function (one) {
    doh.register(
        "moduleTests",
        [
            function moduleTests(t){
                t.is("two", one.twoName);
                t.is("two function", one.twoFunction());
                t.is("three", one.threeName);
                t.is("four", one.fourName);
            }
        ]
    );
    doh.run();
});

define("module-tests", function(){});
