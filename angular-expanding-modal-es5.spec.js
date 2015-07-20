'use strict';

describe( 'btfModal', function() {
  var container,
      target,
      ExpandingModal,
      $rootScope;

  beforeEach( module( 'sj.expandingModal' ) );

  beforeEach( function () {
    container = angular.element( '<div></div>' );
    target    = angular.element( '<button type="button">Click me</button>' );
  } );

  afterEach(function() {
    container = null;
  } );

  describe( 'ExpandingModal', function () {
    beforeEach( inject( function( _ExpandingModal_, _$rootScope_, $templateCache ) {
      ExpandingModal      = _ExpandingModal_;
      $rootScope          = _$rootScope_;
      $rootScope.greeting = 'こんばんは';

      $templateCache.put( 'test.html', [ 200, '<div>{{greeting}}</div>', {} ] );
    } ) );

    it( 'should not show a modal initially', function() {
      var modal = ExpandingModal.create( {
        templateUrl : 'test.html',
        container   : container
      } );

      $rootScope.$digest();

      expect( container.text() ).toBe( '' );
    } );


    it( 'should throw if called without a `template` or `templateUrl` option', function() {
      expect( function () { ExpandingModal.create( {} ); } ).toThrow();
    } );

    it( 'should throw if called with a `template` and `templateUrl` option', function() {
      expect( function () {
        ExpandingModal.create( {
          template    : 'foo',
          templateUrl : 'foo.html'
        } );
      } ).toThrow();
    } );

    it('should throw if called with a text node', function() {
      var modal = ExpandingModal.create( {
        template: 'hey'
      } );

      expect( function () {
        modal.open();

        $rootScope.$digest();
      } ).toThrow();
    } );


    describe( 'ExpandingModal.create().open', function () {
      it( 'should show a modal when activated with `templateUrl`', function() {
        var modal = ExpandingModal.create( {
          templateUrl : 'test.html',
          container   : container
        } );

        modal.open( target[ 0 ] );
        $rootScope.$digest();

        expect( container.text() ).toBe( 'こんばんは' );
      } );

      it( 'should show a modal when activated with `template`', function() {
        var modal = ExpandingModal.create( {
          template  : '<span>{{greeting}}</span>',
          container : container
        } );

        modal.open( target[ 0 ] );
        $rootScope.$digest();

        expect( container.text() ).toBe( 'こんばんは' );
      } );

      it( 'should instantiate a controller via the `controller` option', function() {
        var modal = ExpandingModal.create( {
          template   : '<span>{{greeting}}</span>',
          controller : function ( $scope ) {
            $scope.greeting = 'goodnight'
          },
          container  : container
        } );

        modal.open( target[ 0 ] );
        $rootScope.$digest();

        expect( container.text() ).toBe( 'goodnight' );
      } );

      it( 'should expose a controller to the scope via the `controllerAs` option', function() {
        var modal = ExpandingModal.create( {
          template   : '<span>{{ctrl.greeting}}</span>',
          controller : function () {
            this.greeting = 'boa noite'
          },
          controllerAs : 'ctrl',
          container    : container
        } );

        modal.open( target[ 0 ] );
        $rootScope.$digest();

        expect( container.text() ).toBe( 'boa noite' );
      } );

      it( 'should pass locals to the controller scope', function() {
        var modal = ExpandingModal.create( {
          template   : '<span>{{ctrl.greeting}}</span>',
          controller : function ( greeting ) {
            this.greeting = greeting;
          },
          controllerAs : 'ctrl',
          container    : container
        } );

        modal.open( target[ 0 ], {
          greeting: 'おはよう〜'
        } );

        $rootScope.$digest();

        expect( container.text() ).toBe( 'おはよう〜' );
      } );

      it( 'should pass locals to the modal scope if there is no controller', function() {
        var modal = ExpandingModal.create( {
          template  : '<span>{{greeting}}</span>',
          container : container
        } );

        modal.open( target[ 0 ], {
          greeting: 'bon soir'
        } );
        $rootScope.$digest();

        expect( container.text() ).toBe( 'bon soir' );
      } );

      it( 'should not activate multiple times', function() {
        var modal = ExpandingModal.create( {
          template  : '<span>x</span>',
          container : container
        } );

        modal.open( target[ 0 ] );
        $rootScope.$digest();

        modal.open( target[ 0 ] );
        $rootScope.$digest();

        expect( container.text() ).toBe( 'x' );
      } );
    } );


    describe( 'ExpandingModal.create().close', function () {
      it( 'should remove a modal when deactivated', function() {
        var modal = ExpandingModal.create( {
          template  : '<span>{{greeting}}</span>',
          container : container
        } );

        modal.open( target[ 0 ], {
          greeting: 'bon soir'
        } );
        $rootScope.$digest();

        modal.close().then( function() {
          expect( container.text() ).toBe( '' );
        } );

      } );

      it( 'should destroy the scope when deactivated', inject( function( $browser ) {
        var destroySpy = jasmine.createSpy( 'onDestroy' );

        var modal = ExpandingModal.create( {
          template   : '<span>{{greeting}}</span>',
          container  : container,
          controller : function( $scope ) {
            $scope.$on( '$destroy', destroySpy );
          }
        } );

        modal.open().then( function() {
          modal.close().then( destroySpy );
          $browser.defer.flush();

          expect( destroySpy ).toHaveBeenCalled();
        } );
      } ) );

      it('should resolve a promise after deactivating', inject(function($browser) {
        var spy = jasmine.createSpy( 'closed' );

        var modal = ExpandingModal.create({
          template  : '<span>x</span>',
          container : container
        } );

        modal.open().then( function() {
          modal.close().then( spy );
          $browser.defer.flush();

          expect( spy ).toHaveBeenCalled();
        } );
      } ) );
    } );
  } );
} );
