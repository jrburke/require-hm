require({
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
