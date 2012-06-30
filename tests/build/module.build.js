{
    baseUrl: '../module',
    paths: {
        hm: '../../hm',
        esprima: '../../esprima'
    },
    name: 'module-tests',
    //Do not need esprima after the build.
    exclude: ['esprima'],
    out: 'module-tests-built.js',
    optimize: 'none',
    //Stub out hm the build. Need to keep
    //the plugin stub in the build since
    //loader will want to check it for any
    //normalize method.
    stubModules: ['hm']
}
