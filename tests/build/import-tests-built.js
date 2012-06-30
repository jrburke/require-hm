
define('hm',{load: function(id){throw new Error("Dynamic load not allowed: " + id);}});
define('hm!gamma',['require','exports','module'],function (require, exports, module) {

exports.name = 'gamma';

});
define('hm!beta',['require','exports','module'],function (require, exports, module) {

// Simple module and a text comment that mentions module
exports.name = 'beta';

exports.func = function () {
    return 'beta function';
}

exports.uniqueBeta = 'uniqueBeta';

});
define('hm!alpha',['require','exports','module','hm!gamma','hm!beta','hm!beta','hm!beta'],function (require, exports, module) {

var gamma = require("hm!gamma");

var gammaName = gamma.name;
var betaName = require("hm!beta").name;
var betaFunc = require("hm!beta").func;
var uniqueBeta = require("hm!beta").uniqueBeta;
exports.gammaName = gammaName;

exports.betaName = betaName;

exports.betaFunc = betaFunc;

exports.uniqueBeta = uniqueBeta;

});
require({
    baseUrl: require.isBrowser ? '.' : 'import',
    paths: {
        hm: '../../hm',
        esprima: '../../esprima'
    }
});

require(["hm!alpha"],
function (alpha) {
    doh.register(
        "importTests",
        [
            function importTests(t){
                t.is("gamma", alpha.gammaName);
                t.is("beta", alpha.betaName);
                t.is("beta function", alpha.betaFunc());
                t.is("uniqueBeta", alpha.uniqueBeta);
            }
        ]
    );
    doh.run();
});

define("import-tests", function(){});
