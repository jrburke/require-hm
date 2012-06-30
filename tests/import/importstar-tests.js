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
