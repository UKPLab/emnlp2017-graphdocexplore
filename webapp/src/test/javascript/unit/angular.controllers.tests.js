'use strict' ;

//Tests for HomeController
describe("HomeController tests :", function() {

	beforeEach(module("searchApp")) ;
	
	var $controller ;
	
	var $location ;
	var $cookies ;
	var $http; 
	var dataService ;
	var RESTService ;
	var settingsService ;
	var searchService ;
	
	var controller
	var $scope ;
	
	beforeEach(inject(function(_$controller_, _$location_,_$cookies_, _$http_, _SearchService_, _DataService_, _RESTService_, _SettingsService_){
		$controller = _$controller_ ;
		$location = _$location_ ;
		searchService = _SearchService_ ;
		$cookies = _$cookies_ ;
		$http = _$http_ ;
		dataService = _DataService_ ;
		RESTService = _RESTService_;
		settingsService = _SettingsService_ ;
		
		$scope = {} ;
		
		// Call the controller
		controller = $controller("HomeController", {
			$scope: $scope,
			$location: $location,
			$cookies: $cookies,
			$http: $http,
			SearchService: searchService,
			DataService: dataService,
			RESTService: RESTService,
			SettingsService: settingsService
		}) ;
	})) ;

	describe("Keyword variable", function() {
		it("should be initialized when the controller is being initialized", function() {
			expect($scope.searchword).toBeDefined() ;
		})
	}) ;
	
	describe("Group ID", function() {
		it("should be initialized when the controller is being initialized", function() {
			expect($scope.groupID).toBeDefined() ;
		})
	}) ;
	
	describe("uuid cookie", function() {
		it("should be defined for every user", function() {
			expect($cookies.get(settingsService.userIDCookie)).not.toBeNull() ;
		})
	})
	describe("Search function", function() {
		it("should change the path part of the URL to /search/group/{keyword}", function(){
			$scope.searchword = "test keyword" ;
			$scope.groupID = "group" ;
			$scope.search() ;
			expect($location.path()).toEqual("/search/"+$scope.groupID+"/test keyword") ;
		}) ;
	})
}) ;

// Tests for ErrorController 
describe("ErrorController tests : ", function() {
	beforeEach(module("searchApp")) ;
	
	var $controller ;
	var $location ;
	
	var controller
	var $scope ;
	var dataService ;
	
	beforeEach(inject(function(_$controller_, _$location_,_DataService_){
		$controller = _$controller_ ;
		$location = _$location_ ;
		dataService = _DataService_ ;
		$scope = {} ;
		
		// Call the controller
		controller = $controller("ErrorController", {
			$scope: $scope,
			$location: $location,
			DataService: dataService
		}) ;
	})) ;
	
	describe("back to home function", function() {
		it("should forward the user back to the homepage = home controller", function(){
			$scope.backToHome() ;
			expect($location.path()).toEqual("/") ;
		})
	}) ;
	
})

// Tests for FooterController 
describe("FooterController tests : ", function() {
	beforeEach(module("searchApp")) ;
	
	var $controller ;
	var $location ;
	
	var controller
	var $scope ;
	var dataService ;
	
	beforeEach(inject(function(_$controller_, _$location_,_DataService_){
		$controller = _$controller_ ;
		$location = _$location_ ;
		dataService = _DataService_ ;
		$scope = {} ;
		
		// Call the controller
		controller = $controller("FooterController", {
			$scope: $scope,
			$location: $location,
			DataService: dataService
		}) ;
	})) ;
	
	describe("back to home function", function() {
		it("should forward the user back to the homepage = home controller", function(){
			$scope.backToHome() ;
			expect($location.path()).toEqual("/") ;
		})
	})
})

// Tests for ResultsController
describe("ResultsController tests :", function() {
	beforeEach(module("searchApp")) ;
	
	var $controller ;
	
	var $cookies ;
	var $location ;
	var $routeParams ;
	var $sce ;
	var $injector ;
	var d3NeighbourOnly ;
	var loggingService ;
	var dataService ;
	var highlightService ;
	var filterService ;
	var settingsService ;
	var searchService ;
	
	var controller
	var $scope ;
	
	var $httpBackend ;
	var fakeGroupBackend ;
	var fakeGenerateIDBackend ;
	var fakeLayoutBackend ;
	var fakeSettingsBackend ;
	var fakeSearchBackend ;
	var fakeLogBackend ;
	
	var d = {"searchResults" : [ 
					{"highlight":"Title for ID#document","text":"Text for ID#document","id":"2.txt"},
					],
			"graph": [
			{"nodes": []},
			{"edges": []}
			]} ; // TEST DATA
				
	// Override the graph function definition
	window.graph = function() {} ;
	
	beforeEach(inject(function(_$rootScope_, _$httpBackend_, _$controller_, _$cookies_, _$location_,_$routeParams_, _$sce_, _$injector_, _SearchService_, _D3NeighbourOnlyGraphService_, _LoggingService_, _DataService_, _HighlightService_, _FilterService_, _SettingsService_){
		$httpBackend = _$httpBackend_ ;
		
		$controller = _$controller_ ;
		$cookies = _$cookies_ ;
		$location = _$location_ ;
		$routeParams = _$routeParams_ ;
		$sce = _$sce_ ;
		$injector = _$injector_ ;
		searchService = _SearchService_ ;
		d3NeighbourOnly = _D3NeighbourOnlyGraphService_ ;
		loggingService = _LoggingService_ ;
		dataService = _DataService_ ;
		highlightService = _HighlightService_ ;
		filterService = _FilterService_ ;
		settingsService = _SettingsService_ ;
		
		$scope = _$rootScope_.$new()  ;
		
		// prepare the fake backend for the tests
		fakeGenerateIDBackend = $httpBackend.whenRoute("GET", "/user/generate_id")
		.respond(function(method, url, data, headers, params) {
			return [200, "defaultID"];
		}) ;
		
		fakeLayoutBackend = $httpBackend.whenRoute("GET", "api/layouts")
		.respond(function(method, url, data, headers, params) {
			return [200, {
					0: "DefaultGraphService",
					1: "DefaultGraphService"
					}];
		}) ;
		
		fakeSettingsBackend = $httpBackend.whenRoute("GET", "api/settings")
		.respond(function(method, url, data, headers, params) {
			return [200, {
					0: 42,
					1: 84
					}];
		}) ;
		
		fakeGroupBackend = $httpBackend.whenRoute("GET", "/group").respond(function(method, url, data, headers, params){
			return [200, "group"] ;
		});
		fakeSearchBackend = $httpBackend.whenRoute("GET", "api/search/:groupID/:keywords")
		.respond(function(method, url, data, headers, params) {
			
			return [200, d];
		});
		fakeLogBackend = $httpBackend.whenRoute("HEAD", "api/log/document/:id").respond() ;
		
		// set the conditions for the ResultsController :
		// - path : /search/groupID/keyword
		$location.path("/search/group/test keyword") ;
		$routeParams.searchwords = "test keyword" ;
		$routeParams.groupID = "group" ;
		
		// Call the controller
		controller = $controller("ResultsController", {
			$scope: $scope,
			$sce: $sce,
			$location: $location,
			$routeParams: $routeParams,
			$cookies: $cookies,
			$injector: $injector,
			SearchService: searchService,
			D3NeighbourOnlyGraphService: d3NeighbourOnly,
			LoggingService: loggingService,
			DataService: dataService,
			HighlightService: highlightService,
			SettingsService: settingsService
		}) ;
	})) ;
	
	afterEach(function() {
		$httpBackend.verifyNoOutstandingExpectation();
		$httpBackend.verifyNoOutstandingRequest();
	});
	
	describe("Keyword variable", function() {
		it("should be initialized to the location path variable {keyword}", function() {
			expect($scope.searchword).toBeDefined() ;
			expect($scope.searchword).toEqual("test keyword") ;
			$httpBackend.flush() ;
		})
	}) ;
	
	describe("Search function", function() {		
		it("should change the path part of the URL to /search/group/{new keyword}", function(){
			spyOn(searchService, "search") ; // no need to execute it
			$scope.searchword = "new test keyword" ;
			$scope.search() ;
			expect($location.path()).toEqual("/search/group/new test keyword") ;
			$httpBackend.flush() ;
		}) ;
	})
	
	describe("View document function", function(){
		it("should forward to the error view when given an empty ID", function() {
			$scope.viewDocument() ;
			expect($location.path()).toEqual("/error") ;
			$httpBackend.flush() ;
		}) ;
		
		it("should forward to the error view when given an invalid ID", function() {
			var invalidID = "invalidID" ;
			$scope.viewDocument(invalidID) ;
			expect($location.path()).toEqual("/error") ;
			$httpBackend.flush() ;
		}) ;
		
		it("should set the document view to true when given a valid ID", function() {
			console.log("We are here") ;
			var validID = 2 ;
			
			spyOn(searchService, "isValidID").and.returnValue(true) ;
			spyOn(dataService, "document").and.returnValue({
															id: "2",
															title: "Title",
															text: "text",
															highlight: "highlight"
														})	;		
			$scope.viewDocument(validID) ;
			expect($scope.viewDoc).toBeTruthy() ;
			$httpBackend.flush() ;
		})
	})
})