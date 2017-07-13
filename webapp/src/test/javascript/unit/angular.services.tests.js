'use strict' ;

//Tests for the SearchService
describe("SearchService tests : ", function() {
	// Load the module
	beforeEach(module("searchApp")) ;

	var sut ; // Service Under Test
	var dataService; 
	
	var $httpBackend ;
	var $rootScope ;
	var fakeBackend ;
	var fakeLayoutBackend ;
	var fakeSettingsBackend ;

	var d = {"searchResults" : [ 
					{"highlight":"Title for ID#document","text":"Text for ID#document","id":"2.txt"},
					],
			"graph": [
			{"nodes": []},
			{"edges": []}
			]} ; // TEST DATA
				
	beforeEach(inject(function(_$httpBackend_, _$rootScope_, _SearchService_, _DataService_){
		sut = _SearchService_ ;
		dataService = _DataService_ ;
		
		$httpBackend = _$httpBackend_ ;
		$rootScope = _$rootScope_ ;

		// Fake Backend behaviour towards the /api/search/{keyword} request
		fakeBackend = $httpBackend.whenRoute("GET", "api/search/:groupID/:keywords")
		.respond(function(method, url, data, headers, params) {
			return [200, d];
		});
		
		fakeLayoutBackend = $httpBackend.whenRoute("GET", "api/layouts")
		.respond(function(method, url, data, headers, params) {
			return [200, {
					0: "DefaultGraphService",
					1: "DefaultGraphService"
					}];
		}) ;
		
		fakeLayoutBackend = $httpBackend.whenRoute("GET", "api/settings")
		.respond(function(method, url, data, headers, params) {
			return [200, {
					0: 42,
					1: 84
					}];
		}) ;
	})) ;

	afterEach(function() {
		$httpBackend.verifyNoOutstandingExpectation();
		$httpBackend.verifyNoOutstandingRequest();
	});

	describe("Checking keywords validity", function() {
		var keyword = "" ;

		it("should not accept an undefined variable", function() {
			expect(sut.isValidSearchword()).toBe(false) ;
		}) ;

		it("should not accept an empty keyword", function() {
			var keyword = "" ;
			expect(sut.isValidSearchword(keyword)).toBe(false) ;
		}) ;

		it("should accept all kind of other keywords", function() {
			var keyword = "an example of a keyword" ;
			expect(sut.isValidSearchword(keyword)).toBe(true);
		})
	}) ;

	describe("Search function", function() {
		it("should not change the current keyword when given an empty keyword", function() {
			var keyword = "" ;
			var oldKeyword = dataService.searchword ;
			sut.search(keyword) ;
			expect(dataService.searchword).toEqual(oldKeyword) ;
		}) ;

		it("should change the current keyword when given a keyword and getting a proper json response", function(){
			var keyword = "documents" ;
			dataService.setGroupID("group") ;
			var oldKeyword = dataService.searchword ;
			$httpBackend.expectGET("api/search/group/"+keyword) ;
			sut.search(keyword) ;
			$httpBackend.flush() ;
			expect(dataService.searchword != oldKeyword).toBeTruthy() ;
		})
	}) ;
	
	describe("is valid ID function", function() {
		it("should return false when given an empty ID", function() {
			expect(sut.isValidID()).toBe(false) ;
		}) ;
		
		it("should return false when given an invalid ID", function() {
			var invalidID = 23 ;
			expect(sut.isValidID(invalidID)).toBe(false) ;
		}) ;
		
		it("should return false when given a valid ID that doesn't exist in the results data structure", function() {
			var validID = "ID#2" ;
			expect(sut.isValidID(validID)).toBe(false) ;
		}) ;
		
		it("should return true when given a valid ID that does exist in the results data structure", function() {
			var validID = "2" ;
			var keyword = "documents" ;
			dataService.setGroupID("group") ;
			$httpBackend.expectGET("api/search/group/"+keyword) ;
			sut.search(keyword) ;
			$httpBackend.flush() ;
			
			expect(sut.isValidID(validID)).toBe(true) ;
		})
	}) ;
	
	describe("get current keyword", function() {
		
	})
})
//SettingsService is a wrapper service for constants, doesn't need to be tested

//Tests for the LoggingService
describe("LoggingService tests : ", function() {
	// Load the module
	beforeEach(module("searchApp")) ;

	var sut ; // Service Under Test

	var $httpBackend ;
	var $rootScope ;
	var fakeBackend ;

	beforeEach(inject(function(_$httpBackend_, _$rootScope_, _LoggingService_){
		sut = _LoggingService_ ;

		$httpBackend = _$httpBackend_ ;
		$rootScope = _$rootScope_ ;

		// TODO Update
		// Fake Backend behaviour towards the /api/log request
		fakeBackend = $httpBackend.whenRoute("GET", "api/search/:keywords")
		.respond(function(method, url, data, headers, params) {
			var d = [{"highlight":"Title for ID#document","text":"Text for ID#document","id":"id#333"}] ; // TEST DATA
			return [200, d];
		});
	})) ;
	
}) ;

//Tests for the HighlightService
describe("HighlightService tests : ", function() {
	// Load the module
	beforeEach(module("searchApp")) ;

	var sut ; // Service Under Test
	
	beforeEach(inject(function(_HighlightService_){
		sut = _HighlightService_ ;
	})) ;
})