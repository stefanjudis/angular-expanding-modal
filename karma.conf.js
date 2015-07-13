module.exports = function( config ) {
    config.set( {
    basePath : './',

    files : [
      'node_modules/angular/angular.js',
      'node_modules/angular-mocks/angular-mocks.js',
      'angular-expanding-modal-es5.js',
      'angular-expanding-modal-es5.spec.js'
    ],

    autoWatch  : true,
    frameworks : [ 'jasmine' ],
    browsers   : [ 'Chrome' ],

    plugins : [
      'karma-junit-reporter',
      'karma-chrome-launcher',
      'karma-firefox-launcher',
      'karma-jasmine'
    ],

    junitReporter : {
      outputFile : 'test_out/unit.xml',
      suite      : 'unit'
    }
} ) };
