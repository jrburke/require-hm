
define('hm',{load: function(id){throw new Error("Dynamic load not allowed: " + id);}});
define('hm!funcs',['require','exports','module'],function (require, exports, module) {
var oneName = 'one';

exports.one = function  () {
    return oneName;
};

exports._helloWorld = function (value){
        return 'hello ' + value
    };


});
define('hm!vars',['require','exports','module'],function (require, exports, module) {

exports.foo =
    'foo';

exports.bar = 'bar'

});
require({
    baseUrl: require.isBrowser ? '.' : 'export',
    paths: {
        hm: '../../hm',
        esprima: '../../esprima'
    }
});

require(["hm!funcs", "hm!vars"],
function (funcs,   vars) {
    doh.register(
        "exportTests",
        [
            function exportTests(t){
                t.is("one", funcs.one());
                t.is("hello des moines", funcs._helloWorld('des moines'));
                t.is("foo", vars.foo);
                t.is("bar", vars.bar);
            }
        ]
    );
    doh.run();
});

define("export-tests", function(){});
