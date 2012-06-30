{
    baseUrl: '../import',
    paths: {
        hm: '../../hm',
        esprima: '../../esprima'
    },
    name: 'import-tests',
    //Do not need esprima after the build.
    exclude: ['esprima'],
    out: 'import-tests-built.js',
    optimize: 'none',
    //Stub out hm the build. Need to keep
    //the plugin stub in the build since
    //loader will want to check it for any
    //normalize method.
    stubModules: ['hm']
}
