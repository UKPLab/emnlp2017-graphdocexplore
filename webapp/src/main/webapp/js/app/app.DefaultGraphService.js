var searchApp = angular.module("searchApp")
searchApp.factory("DefaultGraphService", [function(){
	

	// ================== //
	//  PUBLIC FUNCTIONS  //
	// ================== //
	
	/*
	 * The typical call order when drawing the graph looks as follows:
	 * constructGraph > setViewport > printGraph
	 */
	
	/**
	 * Constructs the graph. Fills layout-specific objects with data.
	 * @param graphData is a graph object consisting of nodes and edges (see domains.js).
	**/
	function constructGraph(graphData) {};
	
	/**
	 * Prints the graph to the svg (child element of the div with id 'graph-container').
	**/
	function printGraph() {};

	/**
	 * Highlights a graph element. The graph element can either be a node or an edge.
	 * @param graphElementID the id of the graph element which should be highlighted.
	 * @param isNode true if the graph element is a node, false if it is an edge.
	**/
	function highlightGraphElement(graphElementID, isNode) {};
	
	/**
	 * Resets all highlights created by highlightGraphElement().
	**/
	function resetHighlights() {};

	/**
	 * Moves a graph element to the center of the svg. The graph element can either be a node or an edge.
	 * @param graphElementID the id of the graph element which should be highlighted.
	 * @param isNode true if the graph element is a node, false if it is an edge.
	**/
	function moveToCenter(graphElementID, isNode) {};
	
	/**
	 * Returns the layout's current viewport (e.g. global transformations or scalings, ...).
	**/
	function getViewport() {};
	
	/**
	 * Sets the layout's current viewport.
	 * @param viewportData the layout specific viewport data.
	**/
	function setViewport(viewportData) {};
	
	// =================== //
	//  PRIVATE FUNCTIONS  //
	// =================== //

	return {
		// 'interface functions' which all graph services must implement
		constructGraph: constructGraph,
		printGraph: printGraph,
		highlightGraphElement: highlightGraphElement,
		resetHighlights: resetHighlights,
		moveToCenter: moveToCenter,
		getViewport: getViewport,
		setViewport: setViewport,
		usesForces: false
		
		// note: if useForces is true, the graph service must also implement a function called 'stop()'.

	}
}]);
