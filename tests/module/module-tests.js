require({
    paths: {
        hm: '../../hm'
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
            }
        ]
    );
    doh.run();
});
