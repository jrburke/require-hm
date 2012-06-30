
define('hm',{load: function(id){throw new Error("Dynamic load not allowed: " + id);}});
define('hm!theta',['require','exports','module'],function (require, exports, module) {

exports.thetaOne = 'thetaOne'
exports.thetaTwo = 'thetaTwo'

});
define('hm!sigma',['require','exports','module'],function (require, exports, module) {

var sigmaNumber = 4;

function sigmaFunc() {
    return 'sigma function';
}

exports.sigmaNumber = sigmaNumber;
exports.sigmaFunc = sigmaFunc;

});
define('hm!epsilon',['require','exports','module'],function (require, exports, module) {

/*
Fake comment to try to break the hm parser.
module bad = 'bad';
*/

//import {bad2} from 'bad2'



exports.thetaOne = thetaOne;

exports.thetaTwo = thetaTwo;

exports.sigmaFunc = sigmaFunc;

exports.sigmaNumber = sigmaNumber;

});
require({
    baseUrl: require.isBrowser ? '.' : 'import',
    paths: {
        hm: '../../hm',
        esprima: '../../esprima'
    },
    config: {
        hm: {
            logTransform: require.isBrowser
        }
    }
});

require(["hm!epsilon"],
function (epsilon) {
    doh.register(
        "importStarTests",
        [
            function importStarTests(t){
                t.is("thetaOne", epsilon.thetaOne);
                t.is("thetaTwo", epsilon.thetaTwo);
                t.is("sigma function", epsilon.sigmaFunc());
                t.is("4", epsilon.sigmaNumber);
            }
        ]
    );
    doh.run();
});

define("importstar-tests", function(){});
