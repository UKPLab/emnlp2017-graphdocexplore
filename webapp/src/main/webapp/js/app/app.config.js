'use strict' ;

angular.module('searchApp').config(['$locationProvider', '$routeProvider',
    function config($locationProvider, $routeProvider) {
      $locationProvider.hashPrefix('!');
      $routeProvider.
      	when('/', {
      		templateUrl :'partials/home.template.jsp',
      		controller: 'HomeController'
      	}).
      	when('/error', {
        	templateUrl : 'partials/error.template.jsp',
        	controller: 'ErrorController'
        }).
        when('/search/:groupID/:searchwords', {
          templateUrl: 'partials/results.template.jsp',
          reloadOnSearch: false,
          controller: 'ResultsController'
        }).
        otherwise({
        	redirectTo: '/error'
        });
    }
  ]);