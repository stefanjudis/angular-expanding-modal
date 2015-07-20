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
    browsers   : [ 'Chrome', 'Firefox', 'Safari' ],

    plugins : [
      'karma-chrome-launcher',
      'karma-firefox-launcher',
      'karma-safari-launcher',
      'karma-jasmine'
    ]
} ) };
