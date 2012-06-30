{
    baseUrl: '../export',
    paths: {
        hm: '../../hm',
        esprima: '../../esprima'
    },
    name: 'export-tests',
    //Do not need esprima after the build.
    exclude: ['esprima'],
    out: 'export-tests-built.js',
    optimize: 'none',
    //Stub out hm the build. Need to keep
    //the plugin stub in the build since
    //loader will want to check it for any
    //normalize method.
    stubModules: ['hm']
}
