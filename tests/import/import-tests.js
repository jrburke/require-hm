require({
    paths: {
        hm: '../../hm'
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
