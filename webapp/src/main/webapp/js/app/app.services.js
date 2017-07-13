'use strict' ;
angular.module("searchApp")
.factory("DataService", [function(){
	/**
	 * DataService is an angular service for handling and manipulating the data of the client application.
	 * Data can be shared between other services and controllers
	 */

	var results = {} ;
	var nbOfResults = 0 ;

	var groupID = "" ;
	var groups = [];

	var userID = "" ;

	var init = function() {
		results = {} ;
		nbOfResults = 0 ;
		groupID = "" ;
		groups = [] ;
		userID = "" ;
	}

	var setUserID = function(id){ userID = id ; }
	var getUserID = function() { return userID ; }

	var getGroups = function() { return groups ; }
	var setGroups = function(gs) { 
		groups = gs ; 
		// set default group
		if(gs.length > 0)
			setCurrentGroup(gs[0]);
	}
	var getCurrentGroup = function() { return groupID ; }
	var setCurrentGroup = function(g) { groupID = g ; }

	var empty = function() {
		results = {} ;
		nbOfResults = 0 ;
	}
	var addResult = function(index, result) {
		if(results[index] == null){
			nbOfResults++ ;
		}
		results[index] = result ;
	}

	var getResults = function() {
		return results ;
	}
	var nbOfResults = function() {
		return nbOfResults ;
	}
	var document = function(id) {
		var document = new Document(results[id]) ;
		return document ;
	}
	
	var graph = {};

	var searchword = "";
	
	return {
		emptyResults: empty,
		add: addResult,
		results: getResults,
		numberOfResults: nbOfResults,
		setGroups: setGroups,
		getGroups: getGroups,
		getGroupID: getCurrentGroup,
		setGroupID: setCurrentGroup,
		getUserID: getUserID,
		setUserID: setUserID,
		init: init,
		document: document,
		graph: graph,
		searchword: searchword
	}
}])
.factory("SearchService", ["$http", "SettingsService", "HighlightService", "DataService", "GraphService", function($http, SettingsService, HighlightService, DataService, GraphService) {

	// Intern functions
	var searchUrl = function(searchword) { return "api/search/" + DataService.getGroupID() + "/" + searchword ; }
	var isIDTypeValid = function(id) { return typeof id === 'string' }
	var existID = function(id) { return (id in DataService.results())}
	
	// loading state FLAG
	var LOADING = false ;
	
	var init = function() {
		DataService.searchword = "" ;
		LOADING = false ;
		
	}
	// public functions
	var search = function(searchword) {
	
		if(isValidSearchword(searchword)) {
			if(searchword != DataService.searchword){
				
				DataService.searchword = searchword;
				
				LOADING = true ;
				
				$http.get(searchUrl(searchword)).then(function(response){
					
					// remove the current searchword style (is added later on anyways, this way duplicates are avoided)
					jQuery('#searchword').remove();
					
					DataService.emptyResults() ;
					var d = response.data.searchResults ;
					// store graph for later use (when switching layouts for example)
					DataService.graph = new Graph(response.data.graph);
					
					// print the graph
					$("#graph-wrapper .graph-spinner").show();
					GraphService.setLayout(0);
					$("#graph-wrapper .graph-spinner").hide();
					
					for(var i = 0 ; i < d.length ; i++){
						//d[i].id = d[i].id.substring(0, d[i].id.lastIndexOf(".")) ;

						if(isIDTypeValid(d[i].id) && !existID(d[i].id)){
							
							HighlightService.prepareDocument(d[i]);
							DataService.add(d[i].id, new SearchResult(d[i]) ) ;
						}
					}
					HighlightService.calculateSnippets(DataService.results());

					$('head').append('<style type="text/css" id="searchword" >.searchword{cursor:text;background-color:' + SettingsService.searchwordHighlightColor + ';color:#ffffff;}</style>');

					LOADING = false ;
				});
			}	
		}		
	}


	var isValidSearchword = function(searchword) { return searchword != undefined && searchword != "" ; }
	// A valid ID should be a string, and should be in the array results
	var isValidID = function(id) { return isIDTypeValid(id) && existID(id) ; }

	return {
		isValidSearchword: isValidSearchword,
		isValidID: isValidID ,
		search: search,
		isLoading: function() {
			return LOADING ;
		},
		init: init
	} ;
}])
.factory("FilterService", [function(){

	var filteringTags = [];
	var filteredOutDocuments = [];

	var resultDocuments;
	
	var useLogicalOrForFiltering = false;
	
	/**
	 * Flips filtering for the given tag, i.e. if the tag is not included in the filter, it is added to the filter.
	 * Otherwise it is removed from the filter.
	 */
	var flipFilterTag = function(tag) {
		
		var index = filteringTags.indexOf(tag);
		var on = true;
		if(index == -1) {
			filteringTags.push(tag);
			tag.backgroundColor =  tag.initialBackgroundColor;
			tag.fontColor = tag.initialFontColor;
		}
		else {
			filteringTags.splice(index, 1);
			tag.backgroundColor = '#ffffff';
			tag.fontColor = '#000000';
			on = false;
		}		
		
		filterResults(resultDocuments);
		return on;
	}
	
	var isFilteredOut = function(result) {
		return (filteredOutDocuments.indexOf(result.id) != -1);
	}

	/**
	 * Filters out result documents which are not relevant to any of the document tags added by the user.
	 * Filtering can be done either by using a conjunction of document tags or by using a disjunction of document tags.
	 * If you want to use a disjuntion, set useLogicalOrForFiltering (above) to true.
	 * The parameter results is an array of result documents.
	**/
	var filterResults = function(results) {
	
		resultDocuments = results;
	
		// reset filteredOutDocuments
		filteredOutDocuments.length = 0;
		
		// iterate through all results in order to check if they are relevant/should be filtered out
		for (var result in results) {
			if (results.hasOwnProperty(result)) {
				
				// stores whether the current result is relevant or not
				var isRelevant;
				
				// when using logical or for filtering, a document is relevant if it is tagged with at least one tag
				// therefore we start with the relevance set to false
				// as soon as the document is contained within at least one tag's occurrence list, the relevane is set to true and we can stop
				if(useLogicalOrForFiltering == true)
					isRelevant = false;
				// when using logical and for filtering, we must start with the relevance set to true and set it to false as soon as
				// the document is not relevant for at least one tag
				else
					isRelevant = true;
				
				// iterate through all filtering tags.
				// if a tag's occurrence list contains the document, the document is deemed relevant and thus
				// not added to the filteredOutDocuments array
				for(var i = 0; i < filteringTags.length; i++) {
					
					// there are two cases when we can stop looking:
					// 1: (isRelevant == true && useLogicalOrForFiltering == true)
					// 2: (isRelevant == false && useLogicalOrForFiltering == false)
					// this can be simplified to (isRelevant == useLogicalOrForFiltering)
					if(isRelevant == useLogicalOrForFiltering)
						break;
					
					// the current filtering tag
					var tag = filteringTags[i];			
					
					// accumulate relevancies for logical and filtering before setting the relevance
					var relevantInAtLeastOne = false;
					
					// iterate through the tag's occurrence list
					for(var j = 0; j < tag.relevantDocuments.length; j++) {
			
						var occurrence = tag.relevantDocuments[j];
				
						// check if the occurrence equals the current document (must remove .txt and such first)
						if(occurrence.docID == results[result].id) { //.substring(0, occurrence.docID.indexOf('.'))
							// relevance is immediately set upon equality when using logical or for filtering
							if(useLogicalOrForFiltering == true) {
								isRelevant = true;
								break;
							}
							// for logical and filtering we must iterate through all occurenes (always on the watchout for that one false..)
							else {
								relevantInAtLeastOne = true;
							}
						}
					}
					
					isRelevant = isRelevant && relevantInAtLeastOne;
					
				}
			}
			
			// only filter out documents if there are filtering tags
			if(filteringTags.length > 0) {
				if(isRelevant == false) {
					filteredOutDocuments.push(results[result].id);
				}
			}
		}
	
		return results;
		
	}

	var removeFilterTag = function(tagID) {
		var found = false;
		for(var i = 0; i < filteringTags.length && !found; i++) {
			if(filteringTags[i].id == tagID) {
				filteringTags.splice(i, 1);
				found = true;
			}
		}
	}
	
	var getFilteredOutDocuments = function() {
		return filteredOutDocuments.length;
	}

	var removeAllFilters = function() {
		filteringTags.length = 0;
		filteredOutDocuments.length = 0;
	}
	
	return {
		filter: filterResults,
		filteringTags: filteringTags,
		flipFilterTag: flipFilterTag,
		isFilteredOut: isFilteredOut,
		removeFilterTag: removeFilterTag,
		getNumberOfFilteredDocuments: getFilteredOutDocuments,
		removeAllFilters: removeAllFilters
	}
}])
.factory("GraphService", ["$http", "$injector", "DataService", function($http, $injector, DataService){
	
	// stores the names of the graph layouts to be used
	var graphLayouts;
	
	// this object stores the viewport (camera) data for every graph service
	// when switching back to the service the camera can be restored again
	var graphViewports;
	
	// stores which layout is currently shown
	var drawnLayout;
	
	// stores the index corresponding to the layout in use
	var currentIndex = 0;
	
	/**
	 * Requests the layout names of the server and initializes some variables.
	 * @return returns a promise for the layout name request.
	**/
	function init() {
		
		graphLayouts = [];
		graphViewports = [];
		
		// return the request as a promise so that we can draw the graph as soon as the promise resolves
		return $http.get("api/layouts").then(function(response){
			
			for(var index in response.data) {
				graphLayouts.push(response.data[index]);
			}
			
		});
	};
	
	/**
	 * Sets the graph layout to the layout at the specified index.
	 * @param index the index corresponding to the graph layout in the graph layout array which should be drawn in the graph container.
	**/
	function setLayout(index) {
		
		// if we somehow got here without calling init first, we have to call init first, then set the layout as soon as init is finished
		if(graphLayouts === undefined || graphViewports === undefined) {
			init().then(function() {
				setLayout(index);
			});
		}
		
		// otherwise draw the new layout
		else {
			// stores the name of the layout which should be drawn
			var layoutName;
			
			// if the index is invalid: use default graph layout
			if(index >= graphLayouts.length || index < 0) {
				layoutName = "DefaultGraphService";
			}
			else {
				layoutName = graphLayouts[index];
			}

			// store the viewport data if there is already a layout being drawn
			if(drawnLayout !== undefined) {
				
				// tell force-using graph services to stop their forces ticking away
				// without it the ticks would continue for some time even after having completed the service change -> errors
				if(drawnLayout.usesForces) {
					drawnLayout.stop();
				}
				
				// retrieve the element of the graph service that was centered last (consists of and id and a boolean value describing if the element is a node or not)
				graphViewports[currentIndex] = drawnLayout.getViewport();
			}
			
			drawnLayout = $injector.get(layoutName);
		
			// construct graph (initializes some graph related data)
			drawnLayout.constructGraph(DataService.graph);
			
			drawnLayout.setViewport(graphViewports[index]);
			
			// print the graph
			drawnLayout.printGraph();
			
			currentIndex = index;
		}
	}
	
	/**
	 * Returns the name of the layout at the specified position.
	 * @param index the index of the layout whose name should be returned.
	 * @return the layout name of the graph layout at the specified index.
	**/
	function getLayoutName(index) {	
		return graphLayouts[index];	
	}
	
	/**
	 * Moves a graph element to the center of the graph container.
	 * @param graphElementID the id of the graph element to be centered.
	 * @param true isNode if the graph element is a node, false if the graph element is an edge.
	**/
	function moveToCenter(graphElementID, isNode) {
		if(drawnLayout !== undefined) {
			drawnLayout.moveToCenter(graphElementID, isNode);
		}
	}
	
	/**
	 * Highlights a graph element. This is usually done if the user places the mouse above a graph element, its corresponding document tag or one of its  occurrences.
	 * @param graphElementID the id of the graph element to be centered.
	 * @param true isNode if the graph element is a node, false if the graph element is an edge.
	**/
	function highlightGraphElement(graphElementID, isNode) {
		if(drawnLayout !== undefined) {
			drawnLayout.highlightGraphElement(graphElementID, isNode);
		}
	}
	
	/**
	 * Removes all graph highlights (e.g. when the mouse leaves a graph element, the graph element should not be highlighted anymore).
	**/
	function resetHighlights() {
		if(drawnLayout !== undefined) {
			drawnLayout.resetHighlights();
		}
	}
	
	return {
		init: init,
		setLayout: setLayout,
		getLayoutName: getLayoutName,
		moveToCenter: moveToCenter,
		highlightGraphElement: highlightGraphElement,
		resetHighlights: resetHighlights
	}
}])
.factory("LoggingService", ["$http", "DataService", function($http, DataService){
	
	var getUrlFor = function(element, id, param = null){
		if (param != null) {	
			return "api/log/" + DataService.getGroupID() + "/" + element + "/" + id + "/" + param ;
		} else {
			return "api/log/" + DataService.getGroupID() + "/" + element + "/" + id;
		}
	}
	
	var getVisibleNodeString = function(nodes) {
		
		var returnString = ""; 

		if(nodes.length > 0) {
			
			for(var i = 0; i < nodes.length - 1; i++) {
				returnString = returnString + nodes[i] + " ";
			}
			
			returnString = returnString + nodes[nodes.length - 1];
			
		}
		else {
			returnString = "none";
		}
		
		return returnString;
	}
	

	var nodeClick = function(nodeID) {
		console.log("node clicked: " + nodeID);
		$http.head(getUrlFor("node", nodeID)).then(function(response){}) ;
	}

	var edgeClick = function(edgeID) {
		console.log("edge clicked: " + edgeID);
		$http.head(getUrlFor("edge", edgeID)).then(function(response){}) ;
	}

	var documentView = function(documentID){
		console.log("viewing entire document: " + documentID);
		$http.head(getUrlFor("document", documentID)).then(function(response){}) ;
	}

	var backToList = function(searchword){
		console.log("going back to result list for searchword: " + searchword);
		$http.head(getUrlFor("results", searchword)).then(function(response){}) ;
	}

	var toggleSwhl = function(searchword){
		console.log("searchword highlighting toggled: " + searchword);
		$http.head(getUrlFor("swhl", searchword)).then(function(response){}) ;
	}

	var tagAdded = function(tagID, isNode) {
		var prefix = isNode ? "node_" : "edge_";
		console.log("tag added: " + prefix + tagID);
		$http.head(getUrlFor("tag/add", tagID)).then(function(response){}) ;	
	}

	var tagRemoved = function(tagID, isNode){
		var prefix = isNode ? "node_" : "edge_";
		console.log("tag removed: " + prefix + tagID);
		$http.head(getUrlFor("tag/del", tagID)).then(function(response){}) ;	
	}

	var tagClicked = function(tagID, b, isNode){
		var prefix = isNode ? "node_" : "edge_";
		console.log("tag clicked: "+ b + " " + prefix + tagID);
		$http.head(getUrlFor("tagStatus", tagID, b)).then(function(response){}) ;	
	}

	var graphLayoutSwitched = function(newLayout) {
		console.log("layout switching to: " + newLayout);
		$http.head(getUrlFor("layout", newLayout)).then(function(response){}) ;	
	}

	var documentScrolled = function(start, end) {
		console.log("document scrolled to: " + "[" + start + "," + end + "]");
		$http.head(getUrlFor("scroll", true, "[" + start + "," + end +"]")).then(function(response){}) ;	
	}

	var searchResultListScrolled = function(start, end, results) {
		
		var message = "";
		
		if(start < end) {
			// use start and end indices of the resulst list's visible documents to retrieve the document titles
			for(var i = start; i < end - 1; i++) {
				message = message + results[Object.keys(results)[i]].title + " ";
			}
			
			message = message + results[Object.keys(results)[end - 1]].title;
			
		}
		else {
			message = "none";
		}
		console.log("visible search results: " + message);
		$http.head(getUrlFor("scroll", false, message)).then(function(response){}) ;	

	}

	var logNodeCentered = function(centeredNode, visibleNodes) {
		console.log("node centered: " + centeredNode + ", visible nodes: " + getVisibleNodeString(visibleNodes));
		$http.head(getUrlFor("nodeCentered", centeredNode, getVisibleNodeString(visibleNodes))).then(function(response){}) ;	
	}
	
	var logEdgeCentered = function(centeredEdge, visibleNodes) {
		console.log("edge centered: " + centeredEdge + ", visible nodes: " + getVisibleNodeString(visibleNodes));
		$http.head(getUrlFor("edgeCentered", centeredEdge, getVisibleNodeString(visibleNodes))).then(function(response){}) ;	
	}

	var logNodeDragEvent = function(draggedNode, visibleNodes) {
		console.log("node dragged: " + draggedNode + ", visible nodes: " + visibleNodes);
		$http.head(getUrlFor("nodeDragEvent", draggedNode, getVisibleNodeString(visibleNodes))).then(function(response){}) ;	
	}

	var logPanEvent = function(visibleNodes) {
		console.log("user panned the graph, visible nodes: " + getVisibleNodeString(visibleNodes));
		$http.head(getUrlFor("panEvent", getVisibleNodeString(visibleNodes))).then(function(response){}) ;	
	}

	var logZoomEvent = function(visibleNodes) {
		console.log("user zoomed the graph, visible nodes: " + getVisibleNodeString(visibleNodes));
		$http.head(getUrlFor("zoomEvent", getVisibleNodeString(visibleNodes))).then(function(response){}) ;	
	}
	
	return {
		logNode: nodeClick,
		logEdge: edgeClick,
		logDocument: documentView,
		logBackToResults: backToList,
		toggleSwhl : toggleSwhl,
		tagAdded: tagAdded,
		tagClicked: tagClicked,
		tagRemoved: tagRemoved,
		graphLayoutSwitched : graphLayoutSwitched,
		documentScrolled: documentScrolled,
		searchResultListScrolled: searchResultListScrolled,
		logNodeCentered: logNodeCentered,
		logEdgeCentered: logEdgeCentered,
		logNodeDragEvent: logNodeDragEvent,
		logPanEvent: logPanEvent,
		logZoomEvent: logZoomEvent
	}
}])
.factory("HighlightService", ['SettingsService', 'FilterService', 'DataService', 'LoggingService', function(SettingsService, FilterService, DataService, LoggingService){
	// highlights parameters
	var searchword = "" ;
	var searchwordUnderScore = "" ;

	var getRandomColor = function () {
		var r, g, b;
		do {
		// Math.floor rounds even x.999999... to x, so this should work better, since otherwise we don't have 00-colors (bug #6651)
		r =  Math.floor((Math.random() * 256)); 
		g =  Math.floor((Math.random() * 256)); 
		b =  Math.floor((Math.random() * 256));
		// Check for illegal colors (too white 0xffffff or too yellow 0xffff00) (bug #6629)
		} while (r >= 220 && g >= 220);
		// Fixes bug with too short color definitions, which results in tags not being painted at all
		var color = "#";
		if (r < 16)
			color += "0";
		
		color += r.toString(16);
		
		if (g < 16)
			color += "0";
		
		color += g.toString(16);
		
		if (b < 16)
			color += "0";
		
		color += b.toString(16);
		
		return color;
	}
	
	var getFontColor = function(color) {
		
		color = color.replace('#', '');
		var r = parseInt('0x'+color.substring(0, 2));
		var g = parseInt('0x'+color.substring(2, 4));
		var b = parseInt('0x'+color.substring(4, 6));
		
		// relative luminance https://en.wikipedia.org/wiki/Relative_luminance
		var brightness = (0.2126 * r + 0.7152 * g + 0.0722 * b);
		
		// bias so that we can individually adjust the turning point
		var bias = 32;
		
		if (brightness > (128 + bias)) return '#000000';
		if (brightness < (128 + bias)) return '#ffffff';
	}


	
	// ======================== //
	//  document highlighting  //
	// ======================== //
	
	var searchwordHighlightOn = true;
	
	/**
	 * Removes the highlight added by clicking graph nodes or graph edges.
	 */
	var removeHighlight = function(id) {
		$('#' + id).remove();
	}
	
	// contains the snippet spans for each document
	var snippetSpans = {};
	
	/**
	 * Calculates the text snippet for the given document.
	 * The resulting text snippet is based on filtering document tags and searchword occurrences.
	**/
	var calculateSnippet = function(document){
		
		// first we have to determine which span we want to show in the snippet
		// in case the user added some document tags, we have to use the document's first occurrence corresponding to any of the document tags
		// otherwise we simply use the very first searchword occurrence
		var smallestIndex = 0;

		var documentOccurrences = documentToOccurrences[document.id];
		
		// to break the for loops
		var firstOccurrenceFound = false;
		
		// we must have a look at the document tags if the user has added any
		// otherwise we can simply get the first searchword occurrence in the document
		var needTagOccurrences = tags.length > 0;
		var firstOccurrence;
		
		// iterate through all document occurrences (i.e. both searchword and graph occurrences)
		for(var i = 0; i < documentOccurrences.length && !firstOccurrenceFound; i++) {
			
			var currentOccurrence = documentOccurrences[i];

			// if we have document tags, we must search for occurrence ids which are not "searchword"
			if(needTagOccurrences) {

				// we have to iterate through all added tags and check if the current occurrence is relevant to any of them
				for(var j = 0; j < tags.length && !firstOccurrenceFound; j++) {
					
					// check if the list of the occurrence's ids contains the tag id
					if(currentOccurrence.id.indexOf(tags[j].id) != -1) {
						
						firstOccurrenceFound = true;
						firstOccurrence = currentOccurrence;
						smallestIndex = currentOccurrence.begin;
						
					}				
				}		
			}
			// if we don't have document tags, we must search for occurrence ids which are "searchword"
			else {
				if(currentOccurrence.id.indexOf("searchword") != -1) {
					
					firstOccurrenceFound = true;
					firstOccurrence = currentOccurrence;
					smallestIndex = currentOccurrence.begin;
					
				}
			}
		}
		
		// get the current span array
		var spanArray = snippetSpans[document.id];
		
		// if this is the very first time this document's snippet is calculated, the array will be undefined
		// in this case we should create a new array
		if(spanArray === undefined) {
			spanArray = [];
		}
		
		// first occurrence is not undefined, so we have to calculate the snippet anew
		if(firstOccurrence !== undefined) {
	
			// reset array which will be returned
			// this array contains all the spans which we want to show in the text snippet
			spanArray.length = 0;
	
			// now we have to calculate the text snippet with the index of our very first occurrence
			var charactersBeforeOccurrence = 20;
			
			// define the snippet's bounds
			var snippetStart = smallestIndex > charactersBeforeOccurrence ? smallestIndex - charactersBeforeOccurrence : 0;
			
			var snippetEnd = snippetStart + SettingsService.getDescriptionLength();
			
			// we must add some non-highlighed text because we want to display #charactersBeforeOccurrence characters before the first occurrence appears
			// like this: blabla[firstOccurrence][...]
			if(snippetStart > 0) {
				spanArray.push({
					class: "noHighlight",
					text: document.text.substring(snippetStart, smallestIndex)
				});
			}

			// if the snippet does not contain the beginning of the document, add some dots to indicate this
			if(snippetStart > charactersBeforeOccurrence) {
				spanArray[0].text = "..." + spanArray[0].text;
			}
			
			// stores the index of the previous occurrence which is needed to determine if there is text in between two occurrences
			var oldEnd = smallestIndex;
			
			// iterate through all the occurrences which appear behind our very first occurrence (which we determined earlier)
			// but only as long as the end index of our last occurrence is smaller than the text snippet's end index
			for(var i = documentOccurrences.indexOf(firstOccurrence); i < documentOccurrences.length && oldEnd < snippetEnd; i++) {
				
				var currentOccurrence = documentOccurrences[i];
				
				// calculate the occurrence's end index: either the occurrence's end index if it is in our text snippet, otherwise the text snippet's maximum
				var occurrenceEnd = currentOccurrence.end > snippetEnd ? snippetEnd : currentOccurrence.end;
				
				// check if there is space in between the end index of the previous span and the current span's begin index
				if(currentOccurrence.begin - oldEnd > 0) {
					
					// create a new span for the text in between the two occurrences
					// if the current occurrence begins behind our snippet ends we have to use the snippet's end for the end of our 'in between span'
					// otherwise we would include more text than the SettingsService allows us to use
					var inBetweenSpan = {
						class: "noHighlight",
						text: document.text.substring(oldEnd, currentOccurrence.begin > snippetEnd ? snippetEnd : currentOccurrence.begin)
					};
					
					spanArray.push(inBetweenSpan);
				}
				
				// only add this occurrence if it does not begin behind our text snippet
				if(currentOccurrence.begin < snippetEnd) {
					
					// the span for the current occurrence
					var highlightSpan = {
						class: currentOccurrence.id,
						text: document.text.substring(currentOccurrence.begin, occurrenceEnd)
					};
					
					spanArray.push(highlightSpan);
				}
				
				oldEnd = occurrenceEnd;
			}
			
			// create an 'endspan' if the need arises (i.e. if we ran out of occurrences before the end of the possible snippet text length was reached)
			if(oldEnd < snippetEnd) {
				var endSpan = {
					class: "noHighlight",
					text: document.text.substring(oldEnd, snippetEnd)
				};
				
				spanArray.push(endSpan);
			}
			
			// if the snippet does not contain the end of the document, add some dots to indicate this
			if(oldEnd < document.text.length) {
				spanArray[spanArray.length - 1].text = spanArray[spanArray.length - 1].text + "...";
			}
		}
		
		snippetSpans[document.id] = spanArray;
	}
	
	/**
	 * Returns all the span ojects the given document snippet of.
	**/
	var getSnippet = function(document) {
		return snippetSpans[document.id];
	}
	
	
	var addNodeStyle = function(node) {
		
		var exists = false;
		for(var i = 0; i < tags.length; i++) {
			if(tags[i].id == node.id) 
				exists = true;
		}
		
		if(!exists) {
			var fontColor = getFontColor(node.color);
			
			// if searchword highlighting is enabled, we have to insert the new style before the style of the searchword
			// otherwise the searchword style might be overwritten
			if(searchwordHighlightOn) {
				$('#searchword').before('<style type="text/css" id="node_' + node.id + '">.' + "node_" + node.id + '{cursor:pointer;background-color:' + node.color+';color:' + fontColor+'}</style>');
			}
			else {
				$('head').append('<style type="text/css" id="node_' + node.id + '">.' + "node_" + node.id + '{cursor:pointer;background-color:' + node.color+';color:' + fontColor+'}</style>');
			}

			// add document tags
			addTag(node, fontColor, node.color, true);
		}
		
	}
	
	var addEdgeStyle = function(edge) {
		
		var exists = false;
			for(var i = 0; i < tags.length; i++) {
				if(tags[i].id == edge.id) 
					exists = true;
			}
		
		if(!exists) {
		
			var color = getRandomColor();
			
			var fontColor = getFontColor(color);
			
			// if searchword highlighting is enabled, we have to insert the new style before the style of the searchword
			// otherwise the searchword style might be overwritten
			if(searchwordHighlightOn) {
				$('#searchword').before('<style type="text/css" id="edge_' + edge.id + '">.' + "edge_" + edge.id + '{cursor:pointer;background-color:' + color+';color:' + fontColor+'}</style>');
			}
			else {
				$('head').append('<style type="text/css" id="edge_' + edge.id+'">.' + "edge_" + edge.id+'{cursor:pointer;background-color:' + color+';color:' + fontColor + '}</style>');
			}
			// add document tags
			addTag(edge, fontColor, color, false);
		}
	}
	
	/**
	 * This method calls calculateSnippet for every of the given documents.
	**/
	var calculateSnippets = function(results) {
		
		for(var index in results) {
			calculateSnippet(results[index]);
		}
	}
	
	
	var setSearchword = function(searchword) {
		searchword = searchword ;
	}
	
	/**
	 * Toggles searchword highlighting. The variable searchwordHighlightOn is used when adding new node and edge styles.
	 * If searchwordHighlightOn is true, the node and edge styles must be inserted BEFORE the searchword style. (see addNodeStyle/addEdgeStyle)
	 * Otherwise they are appended to the head.
	**/
	var toggleSearchwordHighlighting = function() {
		searchwordHighlightOn = !searchwordHighlightOn;
	}
	
	// ========================== //
	//  document occurrence data  //
	// ========================== //
	
	// stores all occurrences as a 'document id -> occurrence' map (including the searchword occurrences)
	var documentToOccurrences = {};

	/**
	 * Gathers all occurrences for the given document.
	 * These include the occurrences for the current searchword and all the graph's occurrence data.
	**/
	var gatherOccurrences = function(document) {
		
		// initialize the occurrence array for the current document
		documentToOccurrences[document.id] = [];
		
		// gather occurrences for the current searchword
		gatherSearchwordOccurrences(document, DataService.searchword);
		
		// gather all the graph's occurrences
		gatherGraphOccurrences(document, DataService.graph);
	}
	
	/**
	 * Gathers searchword occurrences in the current document.
	 * The searchword occurrences are needed later on when creating spans for the node and edge occurrences in order to
	 * avoid searchword and 'normal' occurrences from overlapping.
	**/
	var gatherSearchwordOccurrences = function(document, searchword) {
		
		// get the text of the document
		var text = document.text;
		
		// in case the searchword consists of multiple words (e.g. 'student loans')
		// we split the searchword and go through the entire document for all the searchwords we have
		var searchwords = searchword.split(/\W/);
		
		for(var i = 0; i < searchwords.length; i++) {
			if(searchwords[i].length == 0 || searchwords[i] == "*") 
				continue;
			
			// startingIndex denotes where to begin looking, without it we would always get the first occurrence only
			var startingIndex = 0;
			var index = text.indexOf(searchwords[i], startingIndex);

			// "i" is needed to ignore the case, "g" is needed to search for all searchword occurrences (otherwise we would only get the first one)
			var currentSearchwordRegExp = new RegExp(searchwords[i], "ig");
			
			// stores a single searchword match
			var match;

			while((match = currentSearchwordRegExp.exec(text)) !== null) {
				
				// create new occurrence
				var occurrence = {
					id: "searchword",
					begin: match.index,
					end: match.index + searchwords[i].length
				};
				
				// add occurrence to searchword occurrences of the current document
				documentToOccurrences[document.id].push(occurrence);
	
			}
	
		}
		
		// no occurrence of searchword -> add dummy for snippet selection
		if(documentToOccurrences[document.id].length == 0) {
			var occurrence = {
				id: "searchword",
				begin: 0,
				end: 0
			};
			documentToOccurrences[document.id].push(occurrence);
		}
	}

	/**
	 * Gathers all graph occurrences for a given document.
	 * These include the nodes' and the edges' occurrences.
	**/
	var gatherGraphOccurrences = function(document, graph) {
		
		// gather all occurrences for the graph's nodes
		for (var i=0; i < graph.nodes.length; i++) {
			var node = graph.nodes[i];
			
			if (!node.hasOwnProperty('occurrences'))
				continue;
			
			// for all node occurrences: create a new occurrence object and store it in the document's occurrences
			for (var j=0; j < node.occurrences.length; j++) {
				
				var occurrence = node.occurrences[j];
				if (occurrence.docID.replace('.txt', '') != document.id)
					continue;
				
				// the new occurrence object
				var newOccurrence = {
					id: "node_" + node.id,
					begin: occurrence.begin,
					end: occurrence.end
				};

				// add new occurrence to document's occurrence array
				documentToOccurrences[document.id].push(newOccurrence);
			}
		}
		
		// gather all occurrences for the graph's edges
		for (var i=0; i < graph.edges.length; i++) {
			
			var edge = graph.edges[i];
			if (!edge.hasOwnProperty('occurrences'))
				continue;
			
			// for all edge occurrences: create a new occurrence object and store it in the document's occurrences
			for (var j=0; j < edge.occurrences.length; j++) {
				
				var occurrence = edge.occurrences[j];
				
				if (occurrence.docID.replace('.txt', '') != document.id)
					continue;
				
				// the new occurrence object
				var newOccurrence = {
					id: "edge_" + edge.id,
					begin: occurrence.begin,
					end: occurrence.end
				};
				
				// add new occurrence to document's occurrence array
				documentToOccurrences[document.id].push(newOccurrence);
			}
		}	
	}
	
	/**
	 * Splits up all interleaving or overlapping occurrence intervals.
	 * Without splitting them up the document highlighting would produce unreliable results.
	**/
	var splitOccurrenceIntervals = function(document) {

	// get the document's occurrences
		var occurrences = documentToOccurrences[document.id];
	
		 // sort occurrences in ascending order
		 // if two intervals share the same starting index, the larger one is placed in front of the smaller one
		occurrences.sort(function occurrenceSort(a, b) {
			if (a.begin > b.begin) {
				return 1;
			}
			if (a.begin < b.begin) {
				return -1;
			}
			if (a.end > b.end) {
				return -1;
			}
			if (a.end < b.end) {
				return 1;
			}
			return 0;
		});
		
		// determine interleaving of intervals and solve interleaving
		for(var i = 0; i < occurrences.length - 1; i++) {
			
			// always compare two adjacent intervals
			var currentOccurrence = occurrences[i];
			var nextOccurrence = occurrences[i+1];
			
			// only start looking into interleaving and overlapping if the next interval begins before the current interval is finished
			if(nextOccurrence.begin < currentOccurrence.end) {
				
				// if the two occurrences share the exact same start and end points, they can be fused together
				if(currentOccurrence.begin != nextOccurrence.begin || currentOccurrence.end != nextOccurrence.end) {
					
					//      [x, x, x, x, x, x]        << currentOccurrence
					//   +           [x, x, x, x, x]  << nextOccurrence
					//
					//   =  [x, x, x][x, x, x][x, x]
					//          |        |       |
					//          |        |       -> 'behindOccurrenceOverlap'
					//          |        -> 'occurrenceOverlap'
					//          -> 'frontOccurrenceOverlap'
					if(nextOccurrence.begin > currentOccurrence.begin && nextOccurrence.end > currentOccurrence.end) {
						
						var frontOccurrenceOverlap = {
							id: currentOccurrence.id,
							begin: currentOccurrence.begin,
							end: nextOccurrence.begin
						};
						
						occurrences.splice(i, 1, frontOccurrenceOverlap);
						
						var occurrenceOverlap = {
							id: (currentOccurrence.id != nextOccurrence.id) ? currentOccurrence.id + " " + nextOccurrence.id : currentOccurrence.id,
							begin: nextOccurrence.begin,
							end: currentOccurrence.end
						};
						
						occurrences.splice(i + 1, 1, occurrenceOverlap);
						
						var behindOccurrenceOverlap = {
							id: nextOccurrence.id,
							begin: currentOccurrence.end,
							end: nextOccurrence.end
						};
						
						// insert behindOccurrenceOverlap at its designated location (behind all occurrences with a begin index < behindOccurrenceOverlap's begin index)
						var index = i + 2;
						if(index < occurrences.length) {
							while(occurrences[index].begin < behindOccurrenceOverlap.begin) {
								index++;
							}
							// if the two intervals share the same starting index, the larger one must be placed in front of the smaller one
							if(occurrences[index].begin == behindOccurrenceOverlap.begin) {
								if(occurrences[index].end > behindOccurrenceOverlap.end) {
									index++;
								}
							}
						}
						occurrences.splice(index, 0, behindOccurrenceOverlap);
					}
					
					//      [x, x, x, x, x, x]  << currentOccurrence
					//   +     [x, x, x]        << nextOccurrence
					//
					//   =  [x][x, x, x][x, x]
					//       |     |       |
					//       |     |       -> 'behindOccurrenceOverlap'
					//       |     -> 'occurrenceOverlap'
					//       -> 'frontOccurrenceOverlap'				
					else if(nextOccurrence.begin > currentOccurrence.begin && nextOccurrence.end < currentOccurrence.end) {
					
						var frontOccurrenceOverlap = {
							id: currentOccurrence.id,
							begin: currentOccurrence.begin,
							end: nextOccurrence.begin
						};
						
						occurrences.splice(i, 1, frontOccurrenceOverlap);
						
						var occurrenceOverlap = {
							id: (currentOccurrence.id != nextOccurrence.id) ? currentOccurrence.id + " " + nextOccurrence.id : currentOccurrence.id,
							begin: nextOccurrence.begin,
							end: nextOccurrence.end
						};
						
						occurrences.splice(i + 1, 1, occurrenceOverlap);
						
						var behindOccurrenceOverlap = {
							id: currentOccurrence.id,
							begin: nextOccurrence.end,
							end: currentOccurrence.end
						};
						
						// insert behindOccurrenceOverlap at its designated location (behind all occurrences with a begin index < behindOccurrenceOverlap's begin index)
						var index = i + 2;
						if(index < occurrences.length) {
							while(occurrences[index].begin < behindOccurrenceOverlap.begin) {
								index++;
							}
							// if the two intervals share the same starting index, the larger one must be placed in front of the smaller one
							if(occurrences[index].begin == behindOccurrenceOverlap.begin) {
								if(occurrences[index].end > behindOccurrenceOverlap.end) {
									index++;
								}
							}
						}
						occurrences.splice(index, 0, behindOccurrenceOverlap);
					}
					
					//      [x, x, x, x, x, x]  << currentOccurrence
					//   +  [x, x]              << nextOccurrence
					//
					//   =  [x, x][x, x, x, x]
					//         |       |
					//         |       -> 'behindOccurrenceOverlap'
					//         -> 'occurrenceOverlap'
					else if(nextOccurrence.begin == currentOccurrence.begin && nextOccurrence.end < currentOccurrence.end) {
						
						var occurrenceOverlap = {
							id: (currentOccurrence.id != nextOccurrence.id) ? currentOccurrence.id + " " + nextOccurrence.id : currentOccurrence.id,
							begin: currentOccurrence.begin,
							end: nextOccurrence.end
						};
						
						occurrences.splice(i, 1, occurrenceOverlap);
						
						var behindOccurrenceOverlap = {
							id: currentOccurrence.id,
							begin: nextOccurrence.end,
							end: currentOccurrence.end
						};
						
						occurrences.splice(i + 1, 1, behindOccurrenceOverlap);
						
					}
					
					//      [x, x, x, x, x, x]  << currentOccurrence
					//   +              [x, x]  << nextOccurrence
					//
					//   =  [x, x, x, x][x, x]
					//            |        |
					//            |        |
					//            |        -> 'occurrenceOverlap'
					//            -> 'frontOccurrenceOverlap'
					else if(nextOccurrence.begin > currentOccurrence.begin && nextOccurrence.end == currentOccurrence.end) {
					
						var frontOccurrenceOverlap = {
							id: currentOccurrence.id,
							begin: currentOccurrence.begin,
							end: nextOccurrence.begin
						};
						
						occurrences.splice(i, 1, frontOccurrenceOverlap);
						
						var occurrenceOverlap = {
							id: (currentOccurrence.id != nextOccurrence.id) ? currentOccurrence.id + " " + nextOccurrence.id : currentOccurrence.id,
							begin: nextOccurrence.begin,
							end: currentOccurrence.end
						};
						
						occurrences.splice(i + 1, 1, occurrenceOverlap);
						
					}					
				}
				// both intervals share the exact same start and end points
				// fuse them together by concatenating their ids (= class attribute which is used for styling)
				else {
					occurrences.splice(i + 1, 1);
					if(currentOccurrence.id != nextOccurrence.id) {
						currentOccurrence.id = currentOccurrence.id + " " + nextOccurrence.id;
					}
					i--;
				}
			}
		}
	}

	// ==================== //
	//  document text data  //
	// ==================== //
	
	// stores all spans as a 'document id -> spans' map
	// the document's list of spans is accessed by angular when filling the document wrapper's body with text
	var spans = {};
	
	/**
	 * Prepares the given document for future highlighting.
	 * This includes gathering and splitting all searchword and graph occurrences and creating the spans for the text.
	**/
	var prepareDocument = function(document) {
		
		// gather all occurences
		gatherOccurrences(document);
		
		// split up possibly overlapping or interleaving occurrences
		splitOccurrenceIntervals(document);
		
		// creates spans for the final occurrence intervals
		createSpans(document);
	} 
	
	/**
	 * Transforms a given document's text into an array of spans.
	 * The spans are based on the document's occurrence intervals.
	**/
	var createSpans = function(document) {
		
		// create new span object array for the current document
		spans[document.id] = [];
		
		// get the document's occurrence intervals
		var occurrences = documentToOccurrences[document.id];
		
		// if there are zero occurrences (should not really happen, but just in case)
		// the entire document is a single span
		if(occurrences.length == 0) {
			
			var entireSpan = {
				class: "noHighlight",
				text: document.text
			};
			spans[document.id].push(entireSpan);
		}
		else {
		
			// old end is needed to check if we have to put a span in between two highlights
			var oldEnd = 0;
		
			for(var i = 0; i < occurrences.length; i++) {
				
				// check if there is space in between the end index of the previous span and the current span's begin index
				if(occurrences[i].begin - oldEnd > 0) {
					
					// create a new span for the text in between the two occurrences
					var inBetweenSpan = {
						class: "noHighlight",
						text: document.text.substring(oldEnd, occurrences[i].begin)
					};
					
					spans[document.id].push(inBetweenSpan);
				}
				
				// the span for the current occurrence
				var highlightSpan = {
					class: occurrences[i].id,
					text: document.text.substring(occurrences[i].begin, occurrences[i].end)
				};
				
				oldEnd = occurrences[i].end;
				
				spans[document.id].push(highlightSpan);
				
			}
			
			// it is possible to end up with a situation like this:
			//
			// [span][span][span][span][the rest of the document text that is not included in any span]
			//
			// therefore we need to create an 'endspan' if the need arises
			if(document.text.length - oldEnd > 0) {
				var endSpan = {
					class: "noHighlight",
					text: document.text.substring(oldEnd, document.text.length)
				};
				
				spans[document.id].push(endSpan);
			}
		}
	}
	
	/**
	 * Returns all the span ojects the given document consists of.
	**/
	var getSpans = function(document) {
		return spans[document.id];
	}
	
	// =================== //
	//  document tag data  //
	// =================== //
	
	// the tag list
	var tags = [];

	/**
	 * Adds a new tag for the given graph element to the tag list.
	**/
	var addTag = function(graphElement, fontColour, backgroundColour, isNode) {
		
		// check if the tag exists already and add it to the tag list if it does not exist yet
		var exists = false;
		for(var i = 0; i < tags.length; i++) {
			if(tags[i].id == graphElement.id) {
				exists = true;
			}
		}
		
		// tag does not exist so far, create it and add it to the tag list
		if(exists == false) {
			
			var newTag = {
				id: graphElement.id,
				label: graphElement.label,
				relevantDocuments: graphElement.occurrences,
				count: graphElement.occurrences.length,
				isNodeTag: isNode,
				backgroundColor: backgroundColour,
				initialBackgroundColor: backgroundColour,
				fontColor: fontColour,
				initialFontColor: fontColour,
				borderColor: backgroundColour
			};
			
			tags.push(newTag);
			
			// enables tag filtering
			FilterService.flipFilterTag(newTag);
			
			// we have to update the document snippets when adding tags
			calculateSnippets(DataService.results());
			
			LoggingService.tagAdded(newTag.id, isNode);
		}
	};
	
	/**
	 * Removes the given tag from the tag list.
	 * Also removes the style from the header.
	**/
	var removeTag = function(tagID) {
	
		var found = false;
		
		for(var i = 0; i < tags.length && !found; i++) {
			if(tags[i].id == tagID) {
				found = true;
				LoggingService.tagRemoved(tags[i].id, tags[i].isNodeTag);
				// remove <style>..</style> from <head>
				var prefix = tags[i].isNodeTag ? "node_" : "edge_";
				tags.splice(i, 1);
				removeHighlight(prefix + tagID);
			}
		}
	};
	
	/**
	 * Clears the entire tag list.
	**/
	var removeAllTags = function() {
		
		// if tags were added, we'll have to remove the styles
		if(tags !== undefined) {
			// remove all text highlight styles which were added together with the document tags
			for(var i = 0; i < tags.length; i++) {
				jQuery('#' +tags[i].id).remove();
			}
		}
		
		tags.length = 0;
	}
	
	return {
		setSearchword: setSearchword,
		prepareDocument: prepareDocument,
		getSpans: getSpans,
		calculateSnippets: calculateSnippets,
		getSnippet: getSnippet,
		toggleSearchwordHighlighting: toggleSearchwordHighlighting,
		addNodeStyle: addNodeStyle,
		addEdgeStyle: addEdgeStyle,
		tags: tags,
		removeTag: removeTag,
		removeAllTags: removeAllTags,
		getRandomColor: getRandomColor,
		getFontColor: getFontColor
	}
}])
.factory("RESTService", [function() {
	return {
		URI: "api",
		log: "log",
		search: "search",
		user: "user",
		generateID: "generate_id",
		groups: "groups",
		checkGraph: "graph"
	}
}])
.factory("SettingsService", ["$http", function($http) {

	// stores the text snippet's length
	var descriptionLength;
	
	// stores the interval which determines how often the application should check for graph updates (in ms)
	var checkInterval;
	/**
	 * Initializes the SettingsService by requesting some vital data of the server.
	 * @return returns a promise for the settings request.
	**/
	function init() {
		
		// return the request as a promise
		return $http.get("api/settings").then(function(response){
			
			if(response.data.hasOwnProperty('0')) {
				descriptionLength = response.data['0'];
			}
			else {
				descriptionLength = 250;
			}
			
			if(response.data.hasOwnProperty('1')) {
				checkInterval = response.data['1'];
			}
			else {
				checkInterval = 60000;
			}
			
		});
	}
	
	/**
	 * Returns the text snippet's description length.
	 * @return the text snippet length as specified in the config.xml file, or 250 as a default value if there was none specified in the config.xml file.
	**/
	function getDescriptionLength() {
		return descriptionLength;
	}
	
	/**
	 * Returns the interval which determines how often the application should check for graph updates (in ms).
	 * @return the graph update check interval.
	**/
	function getCheckInterval() {
		return checkInterval;
	}
	
	return {
		init: init,
		
		// config.xml settings
		getDescriptionLength : getDescriptionLength,
		getCheckInterval: getCheckInterval,
		
		// other settings
		searchwordHighlightColor: "#4085a8",
		userIDCookie: "user_id"
	}
}])
;
