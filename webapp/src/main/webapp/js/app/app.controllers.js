'use strict' ;
angular.module("searchApp")
.controller('HomeController', ['$scope', '$location', '$cookies', '$http', 'SearchService', 'DataService', 'GraphService', 'RESTService', 'SettingsService', function($scope, $location, $cookies, $http, SearchService, DataService, GraphService, RESTService, SettingsService) {
	
	// initialize services
	DataService.init();
	SearchService.init();
	GraphService.init();
	SettingsService.init();
	
	// initialize the loading state
	var userIDReady = false ;
	var groupsReady = false ;
	
	$scope.searchword = "" ;
	$scope.groupID = "" ;

	$scope.search = function() {
		if(SearchService.isValidSearchword($scope.searchword) && $scope.groupID != "") {
			
			DataService.setGroupID($scope.groupID) ;
			$location.path("/search/"+$scope.groupID+"/"+$scope.searchword) ;
		}
	}
	$scope.setGroupID = function(){
		DataService.setGroupID($scope.groupID);
	}
	$scope.groups = DataService.getGroups ;
	$scope.loading = function() {
		return !(userIDReady && groupsReady) ;
	}
	
	// check the UUID Cookie
	if($cookies.get(SettingsService.userIDCookie) != undefined) {
		DataService.setUserID($cookies.get(SettingsService.userIDCookie)) ;
		userIDReady = true ;
	}else{
		// generate a user id
		$http.get(RESTService.URI + "/" + RESTService.user + "/" + RESTService.generateID).then(function(response) {
			$cookies.put(SettingsService.userIDCookie, response.data.user_id) ;
			DataService.setUserID(response.data.user_id) ;
			userIDReady = true ;
		}) ;
	}
	
	// get the groups
	$http.get(RESTService.URI + "/" + RESTService.groups).then(function(response){
		DataService.setGroups(response.data);
		groupsReady = true ;
		// first group as a default group 
		$scope.groupID = DataService.getGroupID() ;
	})
	
	show_header(jQuery) ;
}])
.controller('ErrorController', ['$scope', '$location', function($scope, $location){
	$scope.backToHome = function() {
		$location.path("/") ;
	}
	show_header(jQuery) ;
}])
.controller('FooterController', ['$scope', '$location', 'DataService', function($scope, $location, DataService){
	$scope.uuid = DataService.getUserID ;
	$scope.groupID = DataService.getGroupID ;
	$scope.backToHome = function() {
		$location.path("/") ;
	}
}])
.controller('ResultsController', ['$scope', '$http', '$cookies', '$location', '$routeParams', '$sce', '$interval', 'SearchService', 'LoggingService', 'DataService', 'GraphService', 'HighlightService', 'FilterService', 'SettingsService',  function($scope, $http, $cookies, $location, $routeParams, $sce, $interval, SearchService, LoggingService, DataService, GraphService, HighlightService, FilterService, SettingsService){
	// check the user ID
	
	if($cookies.get(SettingsService.userIDCookie) == undefined){
		$location.path("/error") ;
	}else{
		DataService.setUserID($cookies.get(SettingsService.userIDCookie));
	}
	
	$scope.searchword = $routeParams.searchwords || "" ;

	$scope.loading = false ; 

	$scope.results = {} ;
	var groupID = $routeParams.groupID || undefined ;
	
	if(groupID != undefined){
		DataService.setGroupID(groupID) ;
	}else{
		$location.path("/error") ;
	}
	
	$scope.$watch(function(scope){
		return DataService.results() ;
	}, function() {
		$scope.results = FilterService.filter(DataService.results());
		HighlightService.calculateSnippets($scope.results);
	})
	
	var updateResults = function() {
		if(DataService.numberOfResults() > 0){
			$scope.results = FilterService.filter(DataService.results());
			HighlightService.calculateSnippets($scope.results);
		}
	}
	
	$scope.tagCount = function(tag, docID) {
		var count = 0;
		for(var i=0; i<tag.relevantDocuments.length; i++) {
			if(tag.relevantDocuments[i].docID == docID)
				count++;
		}
		return count;
	}
	
	$scope.document_id = "" ;
	
	$scope.searchwordHighlightOn = true;
	
	// stores the index of the graph layout service which is currently in use (service names are stored in the SettingsService)
	$scope.serviceInUse = 0;
	
	// BEGIN dynamic graph feature 
	$scope.graphIsLoading = false;
	
	$scope.updateAvailable = false;
	
	// get the new graph (if ready) and show it in the application
	$scope.loadNewGraph = function() {
		
		if($scope.updateAvailable) {

			$scope.graphIsLoading = true;
		
			$scope.updateAvailable = false;
			$('#refreshButton').toggleClass('btn-warning').toggleClass('btn-danger');
			
			$("#graph-wrapper .graph-spinner").show();
				
			$http.get("api/graph/"+DataService.getGroupID()).then(function(response){	
				// store graph for later use (when switching layouts for example)
				console.log("parsing graph data:");
				console.log(response.data) ;
				DataService.graph = new Graph(response.data);
				console.log("new graph:");
				console.log(DataService.graph) ;
				
				// iterate through all document tags which have beend added by the user
				// and remove the ones which do not have a corresponding graph element anymore
				var remainingTags = [];
				for(var i = 0; i < $scope.tags.length; i++) {
					
					var currentTag = $scope.tags[i];
					
					var shouldStillExist = false;
					
					// if the current tag is a node tag, iterate through all new graph nodes and check if the corresponding node still exists
					if(currentTag.isNodeTag) {
						for(var j = 0; j < DataService.graph.nodes.length; j++) {
							
							var currentNode = DataService.graph.nodes[j];
							// if the ids are the same, set the node's color to the color of the tag (in case the node is a new node which does not yet have a color)
							// also add the tag to the remaining tags array
							if(currentNode.id == currentTag.id) {
								currentNode.color = currentTag.initialBackgroundColor;
								shouldStillExist = true;
								remainingTags.push(currentTag);
							}					
						}
						
						// if the tag should not exist anymore, we have to remove its highlighting style
						if(!shouldStillExist) {
							$('#' + "node_" + currentTag.id).remove();
							FilterService.removeFilterTag(currentTag.id);
						}
					}
					// if the current tag is an edge tag, iterate through all new graph edges and check if the corresponding edge still exists
					else {
						for(var j = 0; j < DataService.graph.edges.length; j++) {
							
							var currentEdge = DataService.graph.edges[j];
							// if the ids are the same add the tag to the remaining tags array
							if(currentEdge.id == currentTag.id) {
								shouldStillExist = true;
								remainingTags.push(currentTag);
							}		
						}
						
						// if the tag should not exist anymore, we have to remove its highlighting style
						if(!shouldStillExist) {
							$('#' + "edge_" + currentTag.id).remove();
							FilterService.removeFilterTag(currentTag.id);
						}
					}
				}
				
				// remove tags from highlightservice's tag array which do not have a corresponding graph element anymore
				for(var i = 0; i < HighlightService.tags.length; i++) {
					
					var remove = true;
					
					// for every highlighting tag: check if it should still exist
					for(var j = 0; j < remainingTags.length && remove; j++) {
						if(HighlightService.tags[i].id == remainingTags[j].id) {
							remove = false;
						}
					}
					
					if(remove) {
						HighlightService.tags.splice(i, 1);
						i--;
					}
					
				}
				
				// with a new graph, the documents' occurrences might have changed
				// therefore we have to calculate them anew
				var resultDocuments = DataService.results();
				
				for(var documentID in resultDocuments){
					HighlightService.prepareDocument(resultDocuments[documentID]);
				}
				
				updateResults();
				
				GraphService.setLayout($scope.serviceInUse);
				
				$scope.graphIsLoading = false ;
				
				$("#graph-wrapper .graph-spinner").hide();
			})
		}
	}

	
	// what to do when the page changes
	$scope.$on('$destroy', function () {
		$interval.cancel($scope.updateInterval);
	});
	
	// END dynamic graph feature
	
	// state variable 
	$scope.viewDoc = false ;
	
	$scope.getSnippet = function(document) {
		return HighlightService.getSnippet(document);
	}
	
	
	$scope.currentSearchword = function() { return DataService.searchword ; };
	$scope.search = function() {
		if(SearchService.isValidSearchword($scope.searchword) && DataService.getGroupID() != "") {
			
			FilterService.removeAllFilters();
			HighlightService.removeAllTags();
			
			HighlightService.setSearchword($scope.searchword) ;
			
			SettingsService.init().then(function() {
				
				SearchService.search($scope.searchword);

				// Periodically requests of the server if the graph has changed.
				// If the graph has changed it shows the corresponding notification and enables the graph update button.
				if($scope.updateInterval === undefined) {
					$scope.updateInterval = $interval(function() {
						$http.head("api/graph/" + DataService.getGroupID() + "/changed").then(function(response) {
				
							if(!$scope.graphIsLoading && response.status == 200){
								$scope.updateAvailable = true ;
								$('#refreshButton').toggleClass('btn-warning').toggleClass('btn-danger');
								//$('#graphNotify').modal('show');
							}
					})}, SettingsService.getCheckInterval());
				}
			});
			
			$scope.graphIsLoading = false;
			$scope.updateAvailable = false;
			
			$location.path("/search/" + DataService.getGroupID() + "/" + $scope.searchword) ;
		}else{
			$location.path("/error") ;
		}
	}
	$scope.nbOfResults = function() { return DataService.numberOfResults() } ;
	$scope.emptyResults = function() { return DataService.numberOfResults() == 0 } ;
	$scope.trustAsHtml = function(t){
		return $sce.trustAsHtml(t) ;
	}
	$scope.backToResults = function() {
		$scope.viewDoc = false ;
		LoggingService.logBackToResults($scope.currentSearchword()) ;
		jQuery('#backToResults').hide();
	}
	$scope.viewDocument = function(id) {
		if(SearchService.isValidID(id)){
			var d = {} ;
			d[id] = DataService.document(id)
			$scope.document = d[id];
			$scope.viewDoc = true ;
			$scope.spans = HighlightService.getSpans(d[id]);
			$(document).ready(function() {
				$(".document-container").scrollTop(0);
			})
			LoggingService.logDocument(id) ;
			jQuery('#backToResults').show();
		}else{
			$location.path("/error") ;
		}
	}
	$scope.searchwordHighlightingSwitch = function() {
		
		if ($scope.searchwordHighlightOn) {
			jQuery('#searchword').remove();
			$scope.searchwordHighlightOn = false;
			HighlightService.toggleSearchwordHighlighting();
			LoggingService.toggleSwhl('0');
		} else {
			$scope.searchwordHighlightOn = true;
			HighlightService.toggleSearchwordHighlighting();
			jQuery('head').append('<style type="text/css" id="searchword" >.searchword{cursor:text;background-color:' + SettingsService.searchwordHighlightColor + '; color: #ffffff;}</style>');
			LoggingService.toggleSwhl('1');
		}
	}
	$scope.isLoading = function() {
		return SearchService.isLoading() || $scope.loading || $scope.graphIsLoading;
	}
	
	$scope.nbOfHighlightedDocs = HighlightService.nbOfHighlightedDocs ;
	
	// init first search
	$scope.search() ;
		
	// create tooltips (without this function call they wouldn't look good)
	$(document).ready(function(){
		$('body').tooltip({
			
			// needed so that the tooltips of dynamically added content are beautiful as well (e.g. the view document buttons)
			selector: '[data-toggle="tooltip"]',
			
			// needed because otherwise the tooltip remains visible after having clicked the button
			trigger : 'hover',
			
			// needed because otherwise the tooltip wraps way too early
			container: 'body',
			
			// only show the tooltip after hovering over the button for some time (in ms)
			delay: {show: 500, hide: 100}
		});
	});
		
	// update the DOM 
	fix_height(jQuery);
	hide_header(jQuery);

	// ======================== //
	//  graph service changing  //
	// ======================== //
	
	// can be called to change the graph service
	$scope.setService = function(indexOfService) {
		
		if($scope.serviceInUse != indexOfService) {

			// update graph layout
			GraphService.setLayout(indexOfService);
		
			// update serviceInUse variable (used by buttons to appear pressed / not pressed)			
			$scope.serviceInUse = indexOfService;
			
			LoggingService.graphLayoutSwitched(GraphService.getLayoutName(indexOfService));

		}

	};
	
	// ============================ //
	//  document tag related stuff  //
	// ============================	//
	
	// the array of added document tags
	$scope.tags = HighlightService.tags;
	
	$scope.removeTag = function(tagID) {
	
		FilterService.removeFilterTag(tagID);
		
		// calculated filtered out documents anew
		FilterService.filter($scope.results);
		
		HighlightService.removeTag(tagID);
		HighlightService.calculateSnippets($scope.results);
	
	}
	
	// highlights relevant graph elements when mouse enters the document tag
	$scope.tagMouseEnter = function(tag) {
		GraphService.highlightGraphElement(tag.id, tag.isNodeTag);
	}
	// removes highlights from relevant graph elements when mouse leaves the document tag
	$scope.tagMouseLeave = function() {
		GraphService.resetHighlights();
	}
	
	$scope.flipFilterTag = function(tag) {	
		var off = FilterService.flipFilterTag(tag);		
		LoggingService.tagClicked(tag.id, off, tag.isNodeTag);
	}
	
	$scope.isFilteredOut = function(result) {
		return FilterService.isFilteredOut(result);
	}
	
	$scope.nbOfFilteredOutDocs = function() {
		return FilterService.getNumberOfFilteredDocuments();
	}
	
	$scope.centerNode = function(tag) {
		GraphService.moveToCenter(tag.id, tag.isNodeTag);
	}

	// ===================================== //
	//  document text highlight interaction  //
	// ===================================== //
	
	/**
	 * Highlights the graph element corresponding to the given span.
	 * The graph highlighting will only take place if the given span is a span corresponding to a graph element.
	**/
	$scope.spanMouseEnter = function(spanClass) {
		
		if(spanClass != "noHighlight" && spanClass != "searchword") {
	
			//	spanClass looks like this:
			//		"node_4 node_23 edge_4_5"
					
			//	after the split the array looks like this:
			//		[node_4, node_23, edge_4_5]
			var possibleIDs = spanClass.split(" ");
	
			// only highlight the element if the current span is no searchword span or if searchword highlighting is disabled
			if(possibleIDs.indexOf("searchword") == -1 || !$scope.searchwordHighlightOn) {
	
				// check all tags that have been added so far (= clicked graph elements)
				var tags = HighlightService.tags;
				
				// changes to true if the last added tag is found
				var elementFound = false;
				
				// start with the last added tag (= uppermost style when several graph elements share the same interval)
				for(var i = tags.length - 1; i >= 0 && !elementFound; i--) {
					
					// check all possible classes
					for(var j = 0; j < possibleIDs.length && !elementFound; j++) {
						
						// get rid of "node_" or "edge_" first
						var currentID = possibleIDs[j].substring(5, possibleIDs[j].length);
						
						if(tags[i].id == currentID) {
							
							// it's a node's span if there is no '_' in the id
							var isNode = currentID.indexOf("_") == -1;
							
							elementFound = true;
							
							GraphService.highlightGraphElement(currentID, isNode);
						}
					}
				}
			}
		}
	}
	
	/**
	 * Removes highlights from relevant graph elements when the mouse leaves the span.
	**/
	$scope.spanMouseLeave = function() {
		GraphService.resetHighlights();		
	}
	
	/**
	 * Centers the last clicked graph element corresponding to the given span.
	 * The centering will only take place if the given span is a span corresponding to a graph element.
	**/
	$scope.centerSpan = function(spanClass) {
		if(spanClass != "noHighlight" && spanClass != "searchword") {
	
			//	spanClass looks like this:
			//		"node_4 node_23 edge_4_5"
					
			//	after the split the array looks like this:
			//		[node_4, node_23, edge_4_5]
			var possibleIDs = spanClass.split(" ");
			
			// only center the element if the current span is no searchword span or if searchword highlighting is disabled
			if(possibleIDs.indexOf("searchword") == -1 || !$scope.searchwordHighlightOn) {
				
				// check all tags that have been added so far (= clicked graph elements)
				var tags = HighlightService.tags;
				
				// changes to true if the last added tag is found
				var elementFound = false;
				
				// start with the last added tag (= uppermost style when several graph elements share the same interval)
				for(var i = tags.length - 1; i >= 0 && !elementFound; i--) {
					
					// check all possible classes
					for(var j = 0; j < possibleIDs.length && !elementFound; j++) {
						
						// get rid of "node_" or "edge_" first
						var currentID = possibleIDs[j].substring(5, possibleIDs[j].length);
						
						if(tags[i].id == currentID) {
							
							// it's a node's span if there is no '_' in the id
							var isNode = currentID.indexOf("_") == -1;
							
							elementFound = true;
							
							GraphService.moveToCenter(currentID, isNode);
							
						}
					}
				}
			}
		}	
	}

	// ============================= //
	//  Log viewable Search Results  //
	// ============================= //
	var lastHiddenTop = 0;
	var lastViewCount = 0;
	$('#results-wrapper').on('scroll', function() {

		var resultHeight = angular.element(document.querySelector('.result-container'))[0].offsetHeight;
		
		// we use half the result height for our calculation
		var halfHeight = resultHeight / 2;
		
		// substract the height of the search information (".. documents found for the keyword..")
		var scrollTop = $('#results-wrapper').scrollTop() - angular.element(document.querySelector('#searchInformation'))[0].offsetHeight;
	
		// it is possible to have a resultHeight = 0
		// e.g. in the following scenario:
		// 1) scroll the list a bit
		// 2) add a document tag
		// 3) voilà, resultHeight = 0
		if(resultHeight > 0) {
			
			// calculate how many halves are hidden
			var hiddenHalves = Math.floor(scrollTop / halfHeight);
			
			// halves hidden > documents hidden mapping
			// 0 > 0
			// 1 > 1
			// 2 > 1
			// 3 > 2
			// ...
			var hiddenTop;
			
			if((hiddenHalves % 2) == 0) {
				hiddenTop = hiddenHalves / 2;
			}
			else {
				hiddenTop = (hiddenHalves + 1) / 2;
			}
			
			var resultListHeight = angular.element(document.querySelector('#results-wrapper'))[0].offsetHeight;
			
			// calculate how many documents are visible
			// if hiddenHalves is an odd number, we can still see half of the uppermost document and must accomodate for this
			// (i.e. simply substract one half from the resultListHeight)
			if((hiddenHalves % 2) == 1) {
				resultListHeight = resultListHeight - halfHeight;
			}
			
			// calculate how many document halves are currently visible and divide by 2 to retrieve the number of visible documents
			var visibleHalves = Math.floor(resultListHeight / halfHeight);
			// halves visible > documents visible mapping
			// 0 > 0
			// 1 > 1
			// 2 > 1
			// 3 > 2
			// ...
			var inViewCount;
			
			if((visibleHalves % 2) == 0) {
				inViewCount = visibleHalves / 2;
			}
			else {
				inViewCount = (visibleHalves + 1) / 2;
			}
			
			if(lastHiddenTop != hiddenTop || lastViewCount != inViewCount) {
				lastHiddenTop = hiddenTop;
				lastViewCount = inViewCount;
				LoggingService.searchResultListScrolled(hiddenTop, hiddenTop + inViewCount, DataService.results());
			}
		}
	});


	// ============================ //
	//  Log viewable Document part  //
	// ============================ //
	// get current scroll position
	var lastUpdate = 0;
	var oldScrollTop = 0;
	$('.document-container').on('scroll', function() {
		var scrollTop = $('.document-container').scrollTop();
		
		var totalDocHeight = $('.document-body').height();		
		var viewablePartHeight = $('.document-container').height();
		
		var hiddenBottom = totalDocHeight - viewablePartHeight - scrollTop + 70 - 14;

		var time = new Date().getTime();
		if ((time - lastUpdate > 500 || hiddenBottom <= 0 || scrollTop < 70) && Math.abs(scrollTop - oldScrollTop) > 50) { // user scrolled a bit
			oldScrollTop = scrollTop;
			lastUpdate = time;

			// hidden part top in percent
			// remove 70 px document headline
			if (scrollTop > 70) {
				var topHiddenPart = (scrollTop - 70) / totalDocHeight;	
			} else {
				var topHiddenPart = 0;
			}
			
			
			// hidden part bottom in percent
			if (hiddenBottom < 0) hiddenBottom = 0;
			var bottomHiddenPart = hiddenBottom / totalDocHeight;
			var length = $scope.document.text.length;
			var viewStart = topHiddenPart * length;
			var viewEnd = Math.floor(length - (length * bottomHiddenPart));
			
			var hiddenTextAbove = $scope.document.text.substring(0, viewStart);
			var newlines = hiddenTextAbove.match(new RegExp("\n", "g"));
			var newLinesLength = 0;
			if (newlines != null) 
				 newLinesLength = newlines.length;
			
			var viewStart = Math.floor((topHiddenPart * length)- newLinesLength * 1.5);
			LoggingService.documentScrolled(viewStart, viewEnd);
		}
	});
}]);



// ================ //
//  CUSTOM FILTERS  //
// ================ // 
angular.module("searchApp").filter('tagInDocument', [function() {

	var tagInDocument = function(tags, documentTitle){

		return tags.filter(function(tag){

			var match = false;

			for(var i = 0; i < tag.relevantDocuments.length; i++) {
				
				var relevantDoc = tag.relevantDocuments[i];
				
				// remove things such as '.txt' from the docID
				var docIDWithoutEnding = relevantDoc.docID;
				var endingIndex = relevantDoc.docID.indexOf('.');	
				
				
				if(endingIndex != -1)
					docIDWithoutEnding = relevantDoc.docID.substring(0, endingIndex);
				
				
				// compare the tag's document occurence's document name with the given document title
				if(!(docIDWithoutEnding == documentTitle))
					continue;
				
				else {
					match = true;
					break;
				}
			}
			
			return match;
			
		});
	};
    
    return tagInDocument;
    
}]);