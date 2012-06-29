require({
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
