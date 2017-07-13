var searchApp = angular.module("searchApp")
searchApp.factory("D3NeighbourOnlyGraphService", ["LoggingService", "HighlightService", function(LoggingService, HighlightService){
	
	// graph container properties
	var svg;
	var maximumGraphWidth;
	var maximumGraphHeight;
	var graphCenterPoint;
	
	// highlighting and focusing properties
	var defaultEdgeColor = "#888";
	var highlightColor = "#a8001b";
	var highlightOpacity = 0.1;

	var focusedGraphElement = null;
	var focusedGraphElementIsNode = null;
	
	
	// graph element properties
	var defaultNodeSize = 14;
	var defaultTextSize = 14;
	var nodeNumberFactor = 0.85;
	var defaultStrokeWidth = 1.5;
	
	var isDirected = true;
	
	// the actual graph structure with the node and edge objects
	var graph;
	
	// must be true in order to draw nodes without errors (e.g. by calling moveToCenter from the controller)
	var graphIsReady = false;
	
	// centralNode stores which node is currently being drawn at the very center of the graph
	// this is the only node which is allowed to add a document tag when clicked
	var centralNode;
	
	// previousNode stores the node id which was previously centered so that a dotted line can be drawn
	var previousNodeID;
	
	// stores all nodes which are currently being drawn, i.e. the central node and all of its neighbours
	var currentlyDrawnNodes = [];
	// stores all edges which connect the central node and all its neigbours or vice versa
	var currentlyDrawnEdges = [];

	// mouse event data
	var mouseDownX;
	var	mouseDownY;
	var mouseUpX;
	var mouseUpY;
	
	// needed for smoother dragging behaviour
	// without it the dragged nodes would 'jump' to the current mouse position when not clicked at the very center
	var distanceToMouse;
	
	// these store the d3 objects to be drawn
	var d3Nodes;
	var d3NodeLabels;
	var d3NodeNumbers;
	var d3Edges;
	var d3EdgeLabels;
	var d3EdgeMarkers;
	
	// maps nodes to their corresponding d3 node object
	var nodeToD3NodeMap = {};
	
	// maps nodes to edges 
	var nodeToEdgesMap = {};
	
	// maps node to its label
	var nodeToD3LabelMap = {};

	// maps node to its neighbours
	// note that a node always neighbours itself
	var nodeToNeighbourMap = {};
	
	// maps nodes to their corresponding edge number
	// the edge number denotes how many of the edges connecting to the node are currently not being drawn
	var nodeToD3EdgeNumberMap = {};
	
	// maps edge to its label
	var edgeToD3LabelMap = {};
		
	// maps edges to their corresponding d3 edge object
	var edgeToD3EdgeMap = {};
	
	// maps edges to their corresponding d3 marker object
	var edgeToD3MarkerMap = {};
	
	// maps ids to their corresponding graph element (useful for highlighting and focussing across several services)
	var idToGraphElementMap = {};

	// ================== //
	//  PUBLIC FUNCTIONS  //
	// ================== //
	
	
	/**
	 * Clears and initializes all d3 objects based on parameter 'data' which contains the graph's data.
	**/
	function constructGraph(graphData) {
		
		// reset central node
		centralNode = null;
		
		// reset previous node
		previousNodeID = null;
		
		// graph is not ready yet, must clear container first etc.
		graphIsReady = false;
		
		// reset d3 nodes with and all corresponding elements
		d3Nodes = {};
		d3NodeLabels = {};
		d3NodeNumbers = {};
		
		// reset d3 edges with and all corresponding elements
		d3Edges = {};
		d3EdgeLabels = {};
		d3EdgeMarkers = {};
		
		graph = graphData;
		isDirected = graphData.directed;
		
		idToGraphElementMap = {};
		
		// gather connectivity data
		mapNodesToEdges();
		mapNodesToNeighbours();

	};
	
	/**
	 * Fills d3 objects with content, places nodes, places edges, places labels, defines events for d3 objects, ...
	**/
	function printGraph(){
		if(graph !== undefined){
			$("#graph-container").empty();
			$(document).ready(function(){
				
				maximumGraphWidth = $("#graph-container").width();
				maximumGraphHeight = $("#graph-container").height();

				graphCenterPoint = {x: maximumGraphWidth / 2, y: maximumGraphHeight / 2};
				
				// initialize svg where the graph will be drawn
				svg = d3.select("#" + 'graph-container').append("svg")
				.attr({"width": maximumGraphWidth, "height": maximumGraphHeight});
				
				if(graph.nodes.length > 0) {
				
					// color all nodes
					colorNodes();				
					
					// place and draw nodes, node labels, edges, edge labels
					initGraph();

					d3.select(window).on("resize", resize);

					function resize() {
						var width = $("#graph-container").width(), height = $("#graph-container").height();
						svg.attr("width", width).attr("height", height);
						maximumGraphWidth = width;
						maximumGraphHeight = height;
						
						graphCenterPoint.x = maximumGraphWidth / 2;
						graphCenterPoint.y = maximumGraphHeight / 2;
					}
					
					// graph drawing has finished
					graphIsReady = true;
				}				
			})
		}
	}

	/**
	 * Highlights a graph element.
	 * If isNode == true, a node is highlighted: the node itself, all adjoining nodes and the edges in between.
	 * If isNode == false, an edge is highlighted: the edge itself and the source and target node.		
	**/
	function highlightGraphElement(graphElementID, isNode) {
		
		if(graphIsReady) {
		
			// change mouse cursor
			svg.style("cursor", "pointer");
			
			// only calculate the highlights if no node is currently being dragged around and if the desired transparency is < 1
			if(focusedGraphElement === null) {
				
				// fetch the graph element corresponding to the graphElementID
				var graphElement = idToGraphElementMap[graphElementID];
				
				// only highlight if the graph element exists in the graph
				// otherwise: errors
				if(graphElement !== null) {
				
					// node highlighting
					if(isNode) {
						
						// get all the focused node's neighbours
						var neighbours = nodeToNeighbourMap[graphElementID];
						
						// iterate through all nodes and update their style properties
						for(var i = 0; i < currentlyDrawnNodes.length; i++) {
							
							var currentNode = currentlyDrawnNodes[i];
							
							// if the node is a neighbour of the focused node, we draw a black border around it
							if(neighbours.indexOf(currentNode) != -1) {
								
								// the central node needs special rectangle highlighting
								if(currentNode.id == centralNode.id) {
									d3.selectAll(".centerRectangle").style("stroke", "black");
								}
								// highlight neighbouring nodes (a node always neighbours itself)
								else {
									d3.select(nodeToD3NodeMap[currentNode.id]).style("stroke", "black");
								}
							}
							// otherwise we make the node, its label and its edge number transparent
							else {
								
								// makes node transparent
								d3.select(nodeToD3NodeMap[currentNode.id]).style("opacity",  highlightOpacity);

								// make the node's label transparent
								d3.select(nodeToD3LabelMap[currentNode.id]).style("opacity",  highlightOpacity);
								
								// make the node's edge numbers transparent
								d3.select(nodeToD3EdgeNumberMap[currentNode.id]).style("opacity",  highlightOpacity);

							}
						}
						
						// to determine if an edge should be transparent, we iterate through all edges and find out if they connect to the focused node
						for(var j = 0; j < currentlyDrawnEdges.length; j++) {
							
							var currentEdge = currentlyDrawnEdges[j];
							
							// make edges transparent that do not have the focused node as source or target node
							if(currentEdge.sourceNode.id != graphElementID && currentEdge.targetNode.id != graphElementID) {
								// make the edge transparent
								d3.select(edgeToD3EdgeMap[currentEdge.id]).style("opacity",  highlightOpacity);
							
								// make the edge's label transparent
								d3.select(edgeToD3LabelMap[currentEdge.id]).style("opacity",  highlightOpacity);
							}
							// if the current edge is connected to our focused node, we draw it red
							else {
								// highlight the edge
								d3.select(edgeToD3EdgeMap[currentEdge.id]).style("stroke", highlightColor);
								
								// highlight the edge's marker
								d3.select(edgeToD3MarkerMap[currentEdge.id]).style("fill", highlightColor);
							}
						}

					}
					// edge highlighting
					else {
						
						// iterate through all nodes and update their style properties
						for(var i = 0; i < currentlyDrawnNodes.length; i++) {
							
							var currentNode = currentlyDrawnNodes[i];
							
							// if the node is the edge's source or target node, we draw a black border around it
							if(graphElement.sourceNode.id == currentNode.id || graphElement.targetNode.id == currentNode.id) {
								
								// the central node needs special rectangle highlighting
								if(currentNode.id == centralNode.id) {
									d3.selectAll(".centerRectangle").style("stroke", "black");
								}
								// highlight node
								else {
									d3.select(nodeToD3NodeMap[currentNode.id]).style("stroke", "black");
								}
							}
							// otherwise we make the node, its label and its edge number transparent
							else {
								
								// makes node transparent
								d3.select(nodeToD3NodeMap[currentNode.id]).style("opacity",  highlightOpacity);

								// make the node's label transparent
								d3.select(nodeToD3LabelMap[currentNode.id]).style("opacity",  highlightOpacity);
								
								// make the node's edge numbers transparent
								d3.select(nodeToD3EdgeNumberMap[currentNode.id]).style("opacity",  highlightOpacity);

							}
						}
						
						// to determine if an edge should be transparent, we iterate through all edges and check if their id is the id of the focused edge
						for(var j = 0; j < currentlyDrawnEdges.length; j++) {
							
							var currentEdge = currentlyDrawnEdges[j];
							
							// make edges transparent whose id does not equal the focused edge's id
							if(currentEdge.id != graphElementID) {
								// make the edge transparent
								d3.select(edgeToD3EdgeMap[currentEdge.id]).style("opacity",  highlightOpacity);
							
								// make the edge's label transparent
								d3.select(edgeToD3LabelMap[currentEdge.id]).style("opacity",  highlightOpacity);
							}
							
							// if the current edge is our focused edge, we draw it red
							else {
								// highlight the edge
								d3.select(edgeToD3EdgeMap[currentEdge.id]).style("stroke", highlightColor);
								
								// highlight the edge's marker
								d3.select(edgeToD3MarkerMap[currentEdge.id]).style("fill", highlightColor);
							}
						}
					}
				}
			}
		}
	};
	
	/**
	 * Removes all highlights (draws everything normally again).
	**/
	function resetHighlights() {
		
		if(graphIsReady) {
		
			// but only if no node is currently being dragged around and the border color is not white itself
			if (focusedGraphElement === null) {
				
				svg.style("cursor", "default");
				
				d3Nodes.style("stroke", "white").style("opacity", 1);
				
				d3NodeLabels.style("opacity", 1);
				d3NodeNumbers.style("opacity", 1);
				
				d3.selectAll(".centerRectangle").style("stroke", defaultEdgeColor);
				
				d3Edges.style("stroke", defaultEdgeColor).style("opacity", 1);
				
				d3EdgeLabels.style("opacity", 1);
				
				d3EdgeMarkers.style("fill", defaultEdgeColor).style("opacity", 1);

			}
		}
	};

	/**
	 * Moves a specific node to the center.
	 * The parameter graphElementID determines which node to center.
	**/
	function moveToCenter(graphElementID, isNode) {
		
		// store current central node in previous node
		if(centralNode !== null) {
			previousNodeID = centralNode.id;
		}
		
		centralNode = null;
		
		if(isNode) {
			for(var i = 0; i < graph.nodes.length; i++) {
				if(graph.nodes[i].id == graphElementID) {
					centralNode = graph.nodes[i];
				}
			}
			
		}
		else {
			for(var i = 0; i < graph.edges.length; i++) {
				if(graph.edges[i].id == graphElementID) {
					centralNode = graph.edges[i].sourceNode;
				}
			}
			
		}
		
		if(centralNode != null) {
			calculatePositions(centralNode);
			
			if(graphIsReady) {
				drawEdges();
				drawNodes();
				d3Edges.attr("d", drawLink);
			}
		}
		
		// log the centering
		// get the node ids of the currently visible nodes
		var visibleNodes = [];
		
		for(var i = 0; i < currentlyDrawnNodes.length; i++) {
			visibleNodes.push(currentlyDrawnNodes[i].id);
		}
		
		if(isNode) {
			LoggingService.logNodeCentered(graphElementID, visibleNodes);
		}
		else {
			LoggingService.logEdgeCentered(graphElementID, visibleNodes);
		}
	};
	
	/**
	 * Returns the viewport data.
	 * Usually called by the controller before switching graph services.
	 * On switching back, the controller can then immediately restore the old viewport.
	**/
	function getViewport() {
		
		// we return the central node id because this is all we need
		if(centralNode !== null && centralNode !== undefined) {
			return centralNode.id;
		}
	};
	
	/**
	 * Sets viewport data.
	 * Usually called by the controller after switching to this graph service.
	**/
	function setViewport(viewportData) {
		
		// retrieve the node corresponding to the viewport data (i.e. the central node's id, see above)
		for(var i = 0; i < graph.nodes.length; i++) {
			if(graph.nodes[i].id == viewportData) {
				centralNode = graph.nodes[i];
			}
		}
		
		// it might be possible that the node does not exist anymore (due to a dynamic graph removing the node)
		// therefore we have to be sure that it exists before calculating the positions
		if(centralNode != null) {
			calculatePositions(centralNode);
			
		}
		
	};
	
	// =================== //
	//  PRIVATE FUNCTIONS  //
	// =================== //

	/**
	 * Draws nodes. Also draws the nodes' labels.
	**/
	function drawNodes() {
		
		// remove all node labels
		svg.selectAll(".nodeLabel").remove();
		
		// draw new node labels
		d3NodeLabels = svg.selectAll(".nodeLabel")
		.data(currentlyDrawnNodes)
		.enter()
		.append("g")
		.attr("class", "nodeLabel")
		.call(mapNodesToD3NodeLabels);
		
		d3NodeLabels.append("text")
		.attr("dy", "0.35em")
		.style("font-size", defaultTextSize + "px")
		.style("text-anchor", "middle")
		.style("dominant-baseline", "central")
		.style("fill", function(node) {
			return (node.id == centralNode.id)? HighlightService.getFontColor(node.color) : "black";
		})
		.call(wrapLabels)
		.call(getBB)
		.call(pushFromBorder);
		
		d3NodeLabels.attr("transform", function(node) {
			if(node.wasWrapped)
				// wrapped texts must be placed slightly higher in order to properly center them
				return "translate(" + 0 + "," + -node.bbox.height * 0.45 + ")";
			else
				return "translate(" + 0 + "," + -node.bbox.height * 0.3 + ")";
		});
		
		// returns bounding box of text element
		// this is needed so that the node label can be move to the graph container's border just until the bounding box touches the border
		function getBB(selection) {
			selection.each(function(node){
				node.bbox = this.getBBox();
			})
		}
				
		// remove all nodes
		svg.selectAll(".node").remove();
		
		// only draw circles for non central nodes
		var trueNeighbours = [];
		for(var i = 0; i < currentlyDrawnNodes.length; i++) {
			if(currentlyDrawnNodes[i].id != centralNode.id) {
				trueNeighbours.push(currentlyDrawnNodes[i]);
			}
		}
		// draw new nodes
		d3Nodes = svg.selectAll(".node")
		.data(trueNeighbours)
		.enter()
		.append("circle")
		.attr("r",  defaultNodeSize)
		.attr("class", "node")
		.style("stroke", function(currentNode) {
			return (currentNode.id == centralNode.id) ? defaultEdgeColor : "white";
		})
		.style("fill", function(currentNode) {
			return currentNode.color;
		})
		.call(placeCircles)
		.call(mapNodesToD3NodeObjects)
		.call(calculateEdgeNumbers)
		.call(d3.behavior.drag().on("drag", draggingFunction));
		
		
		// draw rectangle around center label
		var centralNodeLabel = d3.select(nodeToD3LabelMap[centralNode.id]);
		
		/* current label structure		|		what we want to end up with
			<g>							|		<g>
				<text></text>			|			<rect></rect>
			</g>						|			<text></text>		<- selection returned this element
										|		</g>
			
			we have to insert our rect before the first child of the parent node since the selection returns the text element and NOT the group element
		*/			
		var rect = centralNodeLabel.insert("rect", "text")
		.attr("width", function(node){
			return node.bbox.width + defaultTextSize;
		})
		.attr("height", function(node){
			return node.bbox.height + defaultTextSize;
		})
		.attr("fill", function(node){
			return node.color;
		})
		.attr("x", function(node){
			return centralNode.x - (node.bbox.width + defaultTextSize) / 2;
		})
		.attr("y",  function(node){
			return node.y - defaultTextSize * 0.75;
		})
		.style("stroke", defaultEdgeColor)
		.attr("class", "centerRectangle");
		
		
		// remove all node numbers
		svg.selectAll(".nodeNumber").remove();
		
		// draw new node numbers for neighbours only
		d3NodeNumbers = svg.selectAll(".nodeNumber")
		.data(trueNeighbours)
		.enter()
		.append("text")
		.attr("x", function(node) {
			return node.circlePosition.x;
		})
		.attr("y", function(node) {
			return node.circlePosition.y + (defaultNodeSize / 4);
		})
		.attr("class", "nodeNumber")
		.attr("font-size", (defaultTextSize * nodeNumberFactor) + "px")
		.attr("text-anchor", "middle")
		.attr("fill", function(node) {
			return HighlightService.getFontColor(node.color);
		});
		// if there are edges connecting to the node which are not drawn currently
		// append number to the circle
		d3NodeNumbers.text(function(node) {
			return (node.notDrawnEdges > 0) ? "+" + node.notDrawnEdges : '\u2022';
		})
		.call(mapNodesToD3EdgeNumbers)
		.call(d3.behavior.drag().on("drag", draggingFunction));
		
		// === MOUSE EVENTS === //
		
		// highlight node when entering the circle
		d3Nodes.on("mouseenter", function(node) {
			highlightGraphElement(node.id, true);
		});
		
		// make nodes clickable
		d3Nodes.on("mousedown", function(node) {
			
			// save coordinates to distinguish (in global mouseup) between a single mouseclick and dragging behaviour
			var coordinates = d3.mouse(svg.node());
			mouseDownX = coordinates[0];
			mouseDownY = coordinates[1];
			
			// update distance to mouse for smoother dragging behaviour
			distanceToMouse = {
				x: mouseDownX - node.circlePosition.x,
				y: mouseDownY - node.circlePosition.y
			};

			d3.event.stopPropagation();
			
			focusedGraphElement = node;
			focusedGraphElementIsNode = true;
		});
		
		// remove highlights when leaving the node's circle
		d3Nodes.on("mouseout", function() {
			resetHighlights();
		});
	
		// highlight node when entering the node's number
		d3NodeNumbers.on("mouseover", function(node) {
			highlightGraphElement(node.id, true);
		});
		
		// remove highlights when leaving the node's number
		d3NodeNumbers.on("mouseout", function() {
			resetHighlights();
		});
		
		// make node numbers clickable
		d3NodeNumbers.on("mousedown", function(node) {
			
			// save coordinates to distinguish (in global mouseup) between a single mouseclick and dragging behaviour
			var coordinates = d3.mouse(svg.node());
			mouseDownX = coordinates[0];
			mouseDownY = coordinates[1];
			
			// update distance to mouse for smoother dragging behaviour
			distanceToMouse = {
				x: mouseDownX - node.circlePosition.x,
				y: mouseDownY - node.circlePosition.y
			};

			d3.event.stopPropagation();
			
			focusedGraphElement = node;
			focusedGraphElementIsNode = true;
		});
		
		// highlight node when entering the node's label
		d3NodeLabels.on("mouseover", function(node) {
			highlightGraphElement(node.id, true);
		});		
	
		// make node labels clickable
		d3NodeLabels.on("mousedown", function(node) {
			
			// save coordinates to distinguish (in global mouseup) between a single mouseclick and dragging behaviour
			var coordinates = d3.mouse(svg.node());
			mouseDownX = coordinates[0];
			mouseDownY = coordinates[1];
			
			focusedGraphElement = node;
			focusedGraphElementIsNode = true;
		});
		
		// remove node highlights on mouseout
		d3NodeLabels.on("mouseout", function() {
			resetHighlights();
		});
		
	}
	
	/**
	 * Draws edges, i.e. their corresponding path and marker. Also draws the edges' labels.
	**/
	function drawEdges() {
		
		// remove all edges
		svg.selectAll(".edge").remove();
	
		// draw new edges
		d3Edges = svg.selectAll(".edge").data(currentlyDrawnEdges)
		.enter()
		.append("path")
		.attr("class", "edge")	
		.style("stroke-width", defaultStrokeWidth)
		.style("stroke", defaultEdgeColor)
		.call(mapEdgesToD3EdgeObjects);

		// remove all edge markers
		svg.selectAll("marker").remove();
		
		// add arrowhead marker to edge
		d3Edges.attr("marker-end", function(d) { return "url(#myOwnArrowhead_" + d.id + ")"; });
		
		// define line marker properties
		d3EdgeMarkers = svg.selectAll("marker")
			.data(currentlyDrawnEdges)
			.enter().append("marker")
			.attr("id", function(d) { return "myOwnArrowhead_" + d.id; })
			.attr("viewBox", "0 -5 12 10")
			.attr("refX", function(edge) {
				// if the target node is a neighbour (circle), we have to move the marker even farther away because the circle itself is offset already
				// 12 is used as a basis because the arrow is 12 pixels 'long'
				return (edge.targetNode.id == centralNode.id) ? 12 : 22;
			})
			.attr("refY", 0)
			.attr("markerWidth", 1.25 * defaultNodeSize)
			.attr("markerHeight", 1.25 * defaultNodeSize)
			// 'userSpaceOnUse' is important so that the edge width is NOT taken into account (would displace arrowhead - annoying)
			.attr("markerUnits", "userSpaceOnUse")
			.attr("orient", "auto")
			.style("fill", defaultEdgeColor)
			.style("opacity", 1)
			.call(mapEdgesToD3MarkerObjects);
			
		// define marker itself in a local coordinate system (a nice arrowhead)
		// M 0, -5	: start drawing at	(0 , -5)
		// L 12, 0	: draw a line to	(12,  0)
		// L 0, 5	: draw a line to	(0 ,  5)
		// L 5, 0	: draw a line to	(5 ,  0)
		// style 'fill' automatically fills in the path
		if(isDirected) {
			d3EdgeMarkers.append("path")
			.attr("d", "M0,-5 L12,0 L0,5 L5,0");
		} else {
			d3EdgeMarkers.append("path")
			.attr("d", "M0,0");
		}
		
		// remove all edge labels
		svg.selectAll(".edgeLabel").remove();
		
		// draw new edge labels
		d3EdgeLabels = svg.selectAll(".edgeLabel")
		.data(currentlyDrawnEdges)
		.enter()
		.append("g")
		.attr("class", "edgeLabel")
		.call(mapEdgesToD3EdgeLabels);
		
		d3EdgeLabels.append("text")
		.attr("dy", ".35em")
		.style("font-size", defaultTextSize + "px")
		.style("text-anchor", "middle")
		.call(wrapLabels)
		.call(getBB);
		
		
		// returns bounding box of text element
		// this is needed so that the white background box's size (see below) is an exact fit
		function getBB(selection) {
			selection.each(function(d){
				d.bbox = this.getBBox();
			})
		}
		
		// append white background box for better readability
		// accesses the text's bounding box for size calculation
		d3EdgeLabels.insert("rect", "text")
		.attr("x", function(d){return - (d.bbox.width / 2); })
		// - 2 is arbitrary for better positioning, moves the rectangle upwards just slightly
		.attr("y", function(d){return - defaultTextSize / 2 - 2; })
		.attr("width", function(d){ return d.bbox.width; })
		// + 2 is arbitrary for more vertical space
		.attr("height", function(d){ return d.bbox.height + 2; })
		.style("fill", "white");
		
		// === MOUSE EVENTS === //
		
		// make edges clickable
		d3Edges.on("mousedown", function(edge) {
			
			// save coordinates to distinguish (in global mouseup) between a single mouseclick and dragging behaviour
			var coordinates = d3.mouse(svg.node());
			mouseDownX = coordinates[0];
			mouseDownY = coordinates[1];
			
			focusedGraphElement = edge;
			focusedGraphElementIsNode = false;
		});
		
		// highlight edge on mouseenter
		d3Edges.on("mouseenter", function(edge) {
			highlightGraphElement(edge.id, false);
		});

		// remove edge highlights when leaving edge
		d3Edges.on("mouseout", function() {
			resetHighlights();
		});
		
		// make edge labels clickable
		d3EdgeLabels.on("mousedown", function(edge) {
			
			// save coordinates to distinguish (in global mouseup) between a single mouseclick and dragging behaviour
			var coordinates = d3.mouse(svg.node());
			mouseDownX = coordinates[0];
			mouseDownY = coordinates[1];
			
			focusedGraphElement = edge;
			focusedGraphElementIsNode = false;
		});
		
		// highlight edge on label mouseenter
		d3EdgeLabels.on("mouseover", function(edge) {
			highlightGraphElement(edge.id, false);
		});
	
		// remove edge highlights when leaving edge label
		d3EdgeLabels.on("mouseout", function() {
			resetHighlights();
		});
	}
	
	/**
	 * Calculates the initial node coordinates based on the width and height of the available space.
	**/
	function initGraph() {
	
		var nodes = graph.nodes;
	
		// if no central node has been defined yet (e.g. from the controller by calling moveToCenter before drawing the graph)
		// determine the node which has the most edges connecting to it and use it as the central node
		if(centralNode === null) {
			// sorts nodes based on the number of edges which connect to them
			// nodes with many connections are moved to the front
			nodes.sort(function(a,b) {
				return nodeToEdgesMap[b.id].length - nodeToEdgesMap[a.id].length;
			});
			
			centralNode = nodes[0];
			
			// now that we have our central node, all that's left is to calculate the positions of the neighbouring nodes
			// also fills currentlyDrawnNodes and currentlyDrawnEdges with data
			calculatePositions(centralNode);
			
		}
		
		drawEdges();
		drawNodes();
	
		d3Edges.attr("d", drawLink);
		
		// === GLOBAL MOUSEUP EVENT === //
			
			
		d3.select(window).on("mouseup", function() {
			if (focusedGraphElement !== null && focusedGraphElementIsNode !== null) {
				
				var coordinates = d3.mouse(svg.node());
				mouseUpX = coordinates[0];
				mouseUpY = coordinates[1];
				
				// only use element for highlighting if the graph or the element itself were not dragged around
				if(mouseUpX == mouseDownX && mouseUpY == mouseDownY) {
					
					if(focusedGraphElementIsNode) {
						// only add document tags if the clicked graph element is the central node
						// this is important as otherwise we wouldn't be able to distinguish between a 'add document tag' click and
						// a 'draw THIS node with its neighbours' click
						if(focusedGraphElement.id == centralNode.id) {
							LoggingService.logNode(focusedGraphElement.id);
							HighlightService.addNodeStyle(focusedGraphElement);
						}
						// if the clicked node is not the central node, move the clicked node to the very center and draw all of its neighbours around it
						else {
							
							previousNodeID = centralNode.id;
							
							centralNode = focusedGraphElement;
							
							calculatePositions(focusedGraphElement);
							
							// log the centering
							
							// get the node ids of the currently visible nodes
							var visibleNodes = [];
							
							for(var i = 0; i < currentlyDrawnNodes.length; i++) {
								visibleNodes.push(currentlyDrawnNodes[i].id);
							}
							LoggingService.logNodeCentered(focusedGraphElement.id, visibleNodes);
							
							
							// update graph drawing (edges first because of https://en.wikipedia.org/wiki/Painters_algorithm, would otherwise be on top of nodes)
							drawEdges();
							drawNodes();
							d3Edges.attr("d", drawLink);
							
							focusedGraphElement = null;
							focusedGraphElementIsNode = null;
							
							resetHighlights();
							
						}
					}
					else {
						LoggingService.logEdge(focusedGraphElement.id);
						HighlightService.addEdgeStyle(focusedGraphElement);
					}
				}
				
				// user dragged a node, we should log that
				else {
					
					// get the node ids of the currently visible nodes
					var visibleNodes = [];
					for(var i = 0; i < currentlyDrawnNodes.length; i++) {
						visibleNodes.push(currentlyDrawnNodes[i].id);
					}
					LoggingService.logNodeDragEvent(focusedGraphElement.id, visibleNodes);
				}
				
				focusedGraphElement = null;
				focusedGraphElementIsNode = null;
			}
		});
	}
	
	/**
	 * This function updates the position related properties of the node being dragged,
	 * the edges which connect to the node, the node's label and the edges' labels.
	**/
	function draggingFunction(node) {
		
		node.circlePosition.x = d3.event.x - distanceToMouse.x;
		node.circlePosition.y = d3.event.y - distanceToMouse.y;
		
		// update node position
		d3.select(nodeToD3NodeMap[node.id]).attr("cx", node.circlePosition.x).attr("cy", node.circlePosition.y);
		
		// move node's edge number as well
		d3.select(nodeToD3EdgeNumberMap[node.id]).attr("x", node.circlePosition.x).attr("y", node.circlePosition.y +  (defaultNodeSize / 4));

		// move node's label as well by updating all child elements of the label
		// nodeToD3LabelMap[node.id] returns the label group, firstChild is the text element itself which consists of (several) tspans
		var childNodes = d3.selectAll(nodeToD3LabelMap[node.id].firstChild.childNodes);
		childNodes.attr("x", node.circlePosition.x + node.vectorToLabel.x).attr("y", node.circlePosition.y + node.vectorToLabel.y);
		
		// update connecting edges' positions
		
		// get all connecting edges
		var connectingEdges = nodeToEdgesMap[node.id];
		
		// for every connecting edge, get and update corresponding d3 edge object
		for(var i = 0; i < connectingEdges.length; i++) {
			
			var currentEdge = connectingEdges[i];
			
			// draw line anew
			d3.select(edgeToD3EdgeMap[currentEdge.id]).attr("d", drawLink);
			
		}
	}

	/**
	 * Draws a line for the given edge object.
	 * The line starts at the intersection of the path 'source -> target' with the source rectangle and stops at the border of the target rectangle.
	**/
	function drawLink(edge) {
		
		
		// the source point to be calculated (the intersection point of the source object and the edge)
		var source;
		// the target point to be calculated (the intersection point of the target object and the edge)		
		var target;
		
		// check if the edge's source or target node are the central node
		// edge's source node is central node: calculate intersection of the edge with a source rectangle
		if(edge.sourceNode.id == centralNode.id) {
			
			// get the central node's bounding box (this is the rectangle used for the calculation)
			var sourceBox = edge.sourceNode.bbox;
			var sourceWidth = sourceBox.width + defaultTextSize;
			var sourceHeight = sourceBox.height + defaultTextSize;
			
			var direction = {
				x: edge.targetNode.circlePosition.x - centralNode.x,
				y: edge.targetNode.circlePosition.y - centralNode.y
			};

			var length = Math.sqrt(direction.x * direction.x + direction.y * direction.y);

			direction.x = direction.x / length;
			direction.y = direction.y / length;

			source = {
				x: centralNode.x,
				y: centralNode.y
			};
		
			target = {
				x: edge.targetNode.circlePosition.x,
				y: edge.targetNode.circlePosition.y
			};
			
			if(direction.x != 0) {
		
				var slopeOfEdge = direction.y / direction.x;

				// calculate intersection point of edge with source rectangle
				// for calculation, see here: http://stackoverflow.com/a/1585620
				// note that the y coordinate calculations are flipped as the svg coordinate system has its center in the top left corner.
				// why? it's probably best if you draw two boxes, connect them with a line and see for yourself why the differentiation has to be made :)
				
				// check which side of the rectangle is intersected
				if( ((-sourceHeight * 0.5) <= (slopeOfEdge * sourceWidth * 0.5)) && ((slopeOfEdge * sourceWidth * 0.5) <= (sourceHeight * 0.5))) {
					
					// edge hits right side of rectangle
					if(direction.x > 0) {
						source.x = source.x + sourceWidth * 0.5; 
						source.y = source.y + (slopeOfEdge * sourceWidth * 0.5);
					}
					// edge hits left side of rectangle
					else {
						source.x = source.x - (sourceWidth * 0.5);
						source.y = source.y - (slopeOfEdge * sourceWidth * 0.5);
					}
				}
				if( ((-sourceWidth * 0.5) <= ((sourceHeight * 0.5) / slopeOfEdge)) && (((sourceHeight * 0.5) / slopeOfEdge) <= sourceWidth * 0.5) ) {
					
					// edge hits top side of rectangle
					if(direction.y < 0) {
						source.x = source.x - ((sourceHeight * 0.5) / slopeOfEdge);
						source.y = source.y - (sourceHeight * 0.5);
					}
					
					// edge hits bottom side of rectangle
					else {
						source.x = source.x + ((sourceHeight * 0.5) / slopeOfEdge);
						source.y = source.y + (sourceHeight * 0.5);
					}
				}
			}
			// if direction.x == 0: set the positions manually
			else {
				
				target.x = source.x;
				
				// hits bottom side of rectangle
				if(direction.y > 0) {
					source.y = source.y + (sourceHeight * 0.5);
				}
				// hits top side of rectangle
				else {
					source.y = source.y - (sourceHeight * 0.5);
				}
				
			}	
		}
		// edge's target node is central node: calculate intersection of the edge with a target rectangle
		else {
			
			// get the central node's bounding box (this is the rectangle used for the calculation)
			var targetBox = edge.targetNode.bbox;
			var targetWidth = targetBox.width + defaultTextSize;
			var targetHeight = targetBox.height + defaultTextSize;
			
			var direction = {
				x: centralNode.x - edge.sourceNode.circlePosition.x,
				y: centralNode.y - edge.sourceNode.circlePosition.y
			};

			var length = Math.sqrt(direction.x * direction.x + direction.y * direction.y);

			direction.x = direction.x / length;
			direction.y = direction.y / length;

			source = {
				x: edge.sourceNode.circlePosition.x,
				y: edge.sourceNode.circlePosition.y
			};
		
			target = {
				x: centralNode.x,
				y: centralNode.y
			};
			
			if(direction.x != 0) {
		
				var slopeOfEdge = direction.y / direction.x;

				// calculate intersection point of edge with target rectangle
				// note that the y coordinate calculations are flipped as the svg coordinate system has its center in the top left corner.
				
				// check which side of the rectangle is intersected
				if( ((-targetHeight * 0.5) <= (slopeOfEdge * targetWidth * 0.5)) && ((slopeOfEdge * targetWidth * 0.5) <= (targetHeight * 0.5))) {
					
					// edge hits right side of rectangle
					if(direction.x < 0) {
						target.x = target.x + targetWidth * 0.5; 
						target.y = target.y + (slopeOfEdge * targetWidth * 0.5);
					}
					// edge hits left side of rectangle
					else {
						target.x = target.x - (targetWidth * 0.5);
						target.y = target.y - (slopeOfEdge * targetWidth * 0.5);
					}
				}
				if( ((-targetWidth * 0.5) <= ((targetHeight * 0.5) / slopeOfEdge)) && (((targetHeight * 0.5) / slopeOfEdge) <= targetWidth * 0.5) ) {
					
					// edge hits top side of rectangle
					if(direction.y > 0) {
						target.x = target.x - ((targetHeight * 0.5) / slopeOfEdge);
						target.y = target.y - (targetHeight * 0.5);
					}
					
					// edge hits bottom side of rectangle
					else {
						target.x = target.x + ((targetHeight * 0.5) / slopeOfEdge);
						target.y = target.y + (targetHeight * 0.5);
					}
				}
				
			}
			// if direction.x == 0: set the positions manually
			else {
				
				target.x = source.x;
				
				// hits top side of rectangle
				if(direction.y > 0) {
					target.y = target.y - (targetHeight * 0.5);
				}
				// hits bottom side of rectangle
				else {
					target.y = target.y + (targetHeight * 0.5);
				}
				
			}
		}
		
		// store calculated coordinates in edge object for easier dragging calculations
		var edgeCoordinates = {
			x1: source.x,
			y1: source.y,
			x2: target.x,
			y2: target.y
		};
		
		edge.coordinates = edgeCoordinates;

		// in both cases: update edge label as well
		d3.select(edgeToD3LabelMap[edge.id]).attr("transform", function(edge){
			return "translate(" +
				((edge.coordinates.x1 + edge.coordinates.x2) / 2) +
				"," +
				((edge.coordinates.y1 + edge.coordinates.y2) / 2) + ")";
		});
		
		// differentiate between a normal line and the line drawn for the previously centered Node
		if(previousNodeID != null && previousNodeID != centralNode.id) {
			
			// draw a dotted line for the edge of the previous node
			if(edge.sourceNode.id == previousNodeID || edge.targetNode.id == previousNodeID) {
				
				// calculate edge's length
				var length = Math.sqrt(Math.pow(edgeCoordinates.x2 - edgeCoordinates.x1, 2) + Math.pow(edgeCoordinates.y2 - edgeCoordinates.y1, 2));
				
				// calculate edge's direction
				var direction = {
					x: (edgeCoordinates.x2 - edgeCoordinates.x1) / length,
					y: (edgeCoordinates.y2 - edgeCoordinates.y1) / length
				};
				
				var currentCoordinates = {
					x: edgeCoordinates.x1,
					y: edgeCoordinates.y1
				};
				
				
				var distance = Math.sqrt(Math.pow(edgeCoordinates.x2 - currentCoordinates.x, 2) + Math.pow(edgeCoordinates.y2 - currentCoordinates.y, 2));
			
				// set starting point for next line segment
				var line = "M" + currentCoordinates.x + "," + currentCoordinates.y;
				
				// segment length in px
				var segmentLength = 10;
				
				// keep drawing small lines while the distance from the current coordinates to the target coordinates is less than 2 * segment length
				// because we have to accomodate for the drawn segment as well as for the empty space added next
				while(distance > 2 * segmentLength) {
				
					// calculate end position of next line segment
					currentCoordinates.x = currentCoordinates.x + segmentLength * direction.x;
					currentCoordinates.y = currentCoordinates.y + segmentLength * direction.y;
					
					// draw a line to the new current coordinates
					line = line + "L" + currentCoordinates.x + "," + currentCoordinates.y;
					
					// add empty space to line which creates the dotted effect
					currentCoordinates.x = currentCoordinates.x + segmentLength * direction.x;
					currentCoordinates.y = currentCoordinates.y + segmentLength * direction.y;
					
					// set starting point for next line segment
					line = line + "M" + currentCoordinates.x + "," + currentCoordinates.y;
					
					// calculate the remaining distance anew
					distance = Math.sqrt(Math.pow(edgeCoordinates.x2 - currentCoordinates.x, 2) + Math.pow(edgeCoordinates.y2 - currentCoordinates.y, 2));

				}

				// always draw the very last line segment
				line = line + "L" + edgeCoordinates.x2 + "," + edgeCoordinates.y2;
				
				return line;
				
			}
		}
		
		return "M" + source.x + "," + source.y + "L" + target.x + "," + target.y;
	}
	
	/**
	 * Wrapping function for labels, see https://bl.ocks.org/mbostock/7555321.
	 * Uses maximum graph container width for calculation.
	**/
	function wrapLabels(labels) {
		labels.each(function(associatedGraphElement) {
			
			// needed to place wrapped texts slightly higher in order to center them correctly
			var wasWrapped = false;
			
			var currentLabel = d3.select(this);
			var words = associatedGraphElement.label.split(/\s+/).reverse();
			var word;
			var line = [];
			var lineNumber = 0;
			var lineHeight = 1.1; // ems
			var dy = parseFloat(currentLabel.attr("dy"));
			var tspan = currentLabel.text(null).append("tspan").attr("x", 0).attr("y", 0).attr("dy", dy + "em");
			
			// wrapping the very first word introduces empty spaces that's not needed
			var firstWord = true;
			
			while (word = words.pop()) {
				
				line.push(word);
				tspan.text(line.join(" "));
				
				if (tspan.node().getComputedTextLength() > (maximumGraphWidth * 0.25) && !firstWord) {
					line.pop();
					tspan.text(line.join(" "));
					line = [word];
					// x and y are placeholder values but are somehow important
					// omitting them produces weird results
					tspan = currentLabel.append("tspan").attr("x", 0).attr("y", 0).attr("dy", ++lineNumber * lineHeight + dy + "em").text(word);
					
					wasWrapped = true;
					
				}
				if(firstWord) {
					firstWord = false;
				}
			}
			
			associatedGraphElement.wasWrapped = wasWrapped;
			
		});
	}
	
	/**
	 * Calculates the positions of all nodes which neighbour 'node' and positions 'node' at the very center of the graph.
	 * Also fills currentlyDrawnNodes and currentlyDrawnEdges with data.
	**/
	function calculatePositions(node) {
		
		// move node to graph's center
		node.x = graphCenterPoint.x;
		node.y = graphCenterPoint.y;
		
		// calculate radius (= roughly edge length)
		var radius = maximumGraphWidth > maximumGraphHeight ? maximumGraphWidth * 0.5 : maximumGraphHeight * 0.5;
		
		// reset current selection
		currentlyDrawnNodes.length = 0;
		currentlyDrawnEdges.length = 0;
				
		currentlyDrawnNodes.push(node);
		
		// determine the nodes to be drawn (neighbours of 'node', based on its connecting edges
		// we use the edges since we would need to iterate through them later on anyways when adding the edges to be drawn
		var connectingEdges = nodeToEdgesMap[node.id];
		
		for(var i = 0; i < connectingEdges.length; i++) {
			
			// only add the node if it is not 'node' itself (because every node is an element of its own neighbours list)
			// also don't add nodes which have been added already			
			if(connectingEdges[i].sourceNode.id != node.id) {
				if(currentlyDrawnNodes.indexOf(connectingEdges[i].sourceNode) == -1) {
					currentlyDrawnNodes.push(connectingEdges[i].sourceNode);
				}
			}
			if(connectingEdges[i].targetNode.id != node.id) {
				if(currentlyDrawnNodes.indexOf(connectingEdges[i].targetNode) == -1) {
					currentlyDrawnNodes.push(connectingEdges[i].targetNode);
				}
			}			
			
			// add edge to edges-to-be-drawn-array
			currentlyDrawnEdges.push(connectingEdges[i]);
		}
		
		// place all neighbouring nodes in a circular fashion around the central node
		var alphaSteps;
		// if only two nodes are to be drawn, place the non-central node in the top left corner
		if(currentlyDrawnNodes.length == 2) {
			alphaSteps = (3 * Math.PI) / 4;
		}
		else {
			alphaSteps = (2 * Math.PI) / (currentlyDrawnNodes.length - 1);
		}
		
		// bias changes where the node placement starts by going a 'bias * alphaSteps' amount around the central node
		// 0.15 so that the edges are not perfectly vertical at the beginning
		var bias = 0;
		
		// i = 0 would be the central node for which we already have the coordinates
		for(var i = 1; i < currentlyDrawnNodes.length; i++) {
		
				var xPosition = graphCenterPoint.x - radius * Math.sin(bias * alphaSteps);
				var yPosition = graphCenterPoint.y - radius * Math.cos(bias * alphaSteps);
				
				currentlyDrawnNodes[i].x = xPosition;
				currentlyDrawnNodes[i].y = yPosition;
				
				bias++;
		}
	}

	/**
	 * Calculates the positions for the nodes' circles, which depend on where the nodes' labels were placed earlier.
	 * Mainly uses the calculation of the intersection point between the connecting edge and the node's label's bounding box for placing the circles.
	**/
	function placeCircles(nodes) {
		nodes.each(function(node) {
			
			var nodeObject = d3.select(this);
			
			var circlePosition = {
				x: node.x,
				y: node.y
			};
			
			// only calculate the positions for the neighbours of the central node
			// the central node's circle is easily set without needing to calculate it
			if(node.id != centralNode.id) {
			
				var box = node.bbox;
				var w = box.width;
				var h = box.height;
				
				var direction;
				
				// because we earlier pushed the labels slightly upwards we must alter the direction
				if(node.wasWrapped) {
					direction = {
						x: node.x - centralNode.x,
						y: (node.y + 0.45 * h) - centralNode.y
					};
				}
				else {
					direction = {
						x: node.x - centralNode.x,
						y: (node.y + 0.3 * h) - centralNode.y
					};	
				}

				// direction.x == 0 would lead to a division by zero when calculating the slope
				// in case direction.x == 0 the x and y coordinates can be set manually without needing to calculate an intersection point
				if(direction.x != 0) {
				
					var length = Math.sqrt(direction.x * direction.x + direction.y * direction.y);

					direction.x = direction.x / length;
					direction.y = direction.y / length;

					var slopeOfEdge = direction.y / direction.x;
								
					// check which side of the text box is intersected
					if( ((-h * 0.5) <= (slopeOfEdge * w * 0.5)) && ((slopeOfEdge * w * 0.5) <= (h * 0.5))) {
						
						// edge hits right side of text box
						if(direction.x < 0) {
							circlePosition.x = circlePosition.x + (w * 0.5) + defaultNodeSize; 
							circlePosition.y = circlePosition.y + (slopeOfEdge * w * 0.5);
						}
						// edge hits left side of text box
						else {
							circlePosition.x = circlePosition.x - (w * 0.5) - defaultNodeSize;
							circlePosition.y = circlePosition.y - (slopeOfEdge * w * 0.5);
						}
					}
					if( ((-w * 0.5) <= ((h * 0.5) / slopeOfEdge)) && (((h * 0.5) / slopeOfEdge) <= w * 0.5) ) {
						
						// edge hits top side of text box
						if(direction.y > 0) {
							circlePosition.x = circlePosition.x - ((h * 0.5) / slopeOfEdge);
							circlePosition.y = circlePosition.y - (h * 0.5) - defaultNodeSize;
						}
						
						// edge hits bottom side of text box
						else {
							circlePosition.x = circlePosition.x + ((h * 0.5) / slopeOfEdge);
							circlePosition.y = circlePosition.y + (h * 0.5) + defaultNodeSize;
						}
					}
				}
				// direction.x == 0: set coordinates manually, no need to calculate intersection
				else {
					
					circlePosition.x = centralNode.x;
					
					// hits top side of label
					if(direction.y > 0) {
						circlePosition.y = circlePosition.y - (h * 0.5) - defaultNodeSize;
					}
					// hits bottom side of label
					else {
						circlePosition.y = circlePosition.y + (h * 0.5) + defaultNodeSize;
					}
				}
				
				// now that we have our circle positions: update the connecting edges
						
				var connectingEdges = nodeToEdgesMap[node.id];
						
				for(var i = 0; i < connectingEdges.length; i++) {
					
					var currentEdge = connectingEdges[i];
					var edgeObject = d3.select(edgeToD3EdgeMap[currentEdge.id]);
					
					// handle case when the current node is the edge's source node
					if(currentEdge.sourceNode.id == node.id) {
						edgeObject
						.attr("x1", circlePosition.x)
						.attr("y1", circlePosition.y)
						.attr("x2", function(d) { return d.targetNode.x; })
						.attr("y2", function(d) { return d.targetNode.y; });
					}
					// handle case when the current node is the edge's target node
					else {
						edgeObject
						.attr("x1", function(d) { return d.sourceNode.x; })
						.attr("y1", function(d) { return d.sourceNode.y; })
						.attr("x2", circlePosition.x)
						.attr("y2", circlePosition.y);
					}
				}
			}
			// in case the current node is the central node: place the circle at the very center
			else {
				circlePosition.x = centralNode.x;
				circlePosition.y = centralNode.y;
			}
			
			nodeObject.attr("cx", circlePosition.x).attr("cy", circlePosition.y);
			
			// store displacement vector (circle -> node label) for easier dragging calculations
			node.vectorToLabel = {
				x: node.x - circlePosition.x,
				y: node.y - circlePosition.y
			};	

			// store circle position in node object (handy for dragging and stuff)
			node.circlePosition = circlePosition;
		})
		}
		
	/**
	 * Calculates the number of connecting edges which aren't shown currently for the neighbouring nodes.
	**/
	function calculateEdgeNumbers(nodes) {
		
		nodes.each(function(node) {
			
			// only calculate the number if the current node is not the central node
			if(node.id != centralNode.id) {
				
				var number = 0;
				
				// get the connecting edges of neighbouring node
				var connectingEdges = nodeToEdgesMap[node.id];
				
				for(var i = 0; i < connectingEdges.length; i++) {
					
					var isDrawn = false;
					
					// check if the edge is currently not being drawn and increase the number accordingly
					for(var j = 0; j < currentlyDrawnEdges.length; j++) {
						if(currentlyDrawnEdges[j].id == connectingEdges[i].id) {
							isDrawn = true;
						}	
					}
					
					if(!isDrawn) {
						number++;
					}
					
				}
				
				node.notDrawnEdges = number;
			}
		});
	}
	
	/**
	 * Pushes the neighbouring labels with all their corresponding node to the graph's border, so that all the graph's space is used optimally.
	**/		
	function pushFromBorder(nodes) {
		
		nodes.each(function(node) {
		
			// only try to push those nodes away from the borders which aren't the central node
			if(node.id != centralNode.id) {
							
				var boundingBoxCenter = {
					x: node.bbox.width,
					y: node.bbox.height
				};
									
				// capping
				if((node.x - boundingBoxCenter.x / 2) < 0) {
					node.x = boundingBoxCenter.x  / 2;
				}
				else if((node.x + boundingBoxCenter.x / 2) > maximumGraphWidth) {
					node.x = maximumGraphWidth - boundingBoxCenter.x / 2;
				}
				if((node.y - boundingBoxCenter.y / 2) < 0) {
					node.y = boundingBoxCenter.y / 2;
				}
				else if((node.y + boundingBoxCenter.y / 2) > maximumGraphHeight) {				
					node.y = maximumGraphHeight - boundingBoxCenter.y / 2;
				}				
			}
			
			// update all child nodes' data
			d3.selectAll((d3.select(this))[0][0].childNodes)
			.attr("x", node.x)
			.attr("y", node.y);			
			
		})
	}
	
	/**
	 * Assigns random colors to all graph nodes.
	**/
	function colorNodes() {
		var nodes = graph.nodes;
		nodes.forEach(function(node){
			
			// color is set to -1 per default in domains.js when constructing the graph object
			if(node.color == "-1") {
				node.color = HighlightService.getRandomColor();
			}
		})
	}
	
	/**
	 * Maps nodes to connecting edges.
	**/
	function mapNodesToEdges() {
		
		var nodes = graph.nodes;
		var edges = graph.edges;
		
		// clear map
		nodeToEdgesMap = {};
		
		// map node ids to connecting edges
		nodes.forEach(function(currentNode) {
			
			// every node id gets mapped to an array of edges
			nodeToEdgesMap[currentNode.id] = [];
				
			// iterate through all edges, check if the node is the edge's source node
			edges.forEach(function(currentEdge) {
			
				// if the current node is the edge's source or target node, the edge is added to the node's list of edges
				if((currentEdge.sourceNode.id == currentNode.id) || (currentEdge.targetNode.id == currentNode.id)) {
					nodeToEdgesMap[currentNode.id].push(currentEdge);
				}
				
				// also map the edge's id to the edge's data
				idToGraphElementMap[currentEdge.id] = currentEdge;
				
				
			});
			
			// also map the node's id to the node's data
			idToGraphElementMap[currentNode.id] = currentNode;
			
		});
	}
	
	/**
	 * Maps nodes to their corresponding d3 node object.
	**/
	function mapNodesToD3NodeObjects(nodes) {
		
		// clear map
		nodeToD3NodeMap = {};
		
		// adds an 'node id -> d3 node object' mapping for every node
		nodes.each(function(currentNode) {
			nodeToD3NodeMap[currentNode.id] = this;
		});
	}
	
	/**
	 * Maps edges to their corresponding d3 edge object.
	**/
	function mapEdgesToD3EdgeObjects(edges) {
		
		// clear map
		edgeToD3EdgeMap = {};
		
		// adds an 'edge id -> d3 edge object' mapping for every edge
		edges.each(function(currentEdge) {
			edgeToD3EdgeMap[currentEdge.id] = this;
		});
	}
	
	/**
	 * Maps nodes to their corresponding node label.
	**/
	function mapNodesToD3NodeLabels(nodes) {
				
		// clear map
		nodeToD3LabelMap = {};
		
		// adds an 'node id -> d3 node label object' mapping for every node
		nodes.each(function(currentNode) {
			nodeToD3LabelMap[currentNode.id] = this;
		});
	}
	
	/**
	 * Maps nodes to their corresponding edge number.
	 * The edge number denotes how many of the edgse connecting to the node are currently not being drawn.
	**/
	function mapNodesToD3EdgeNumbers(nodes) {
		
		// clear map
		nodeToD3EdgeNumberMap = {};
		
		// adds a 'node id -> d3 edge number object' mapping for every node
		nodes.each(function(currentNode) {
			nodeToD3EdgeNumberMap[currentNode.id] = this;
		});
		
	}
	
	/**
	 * Maps edges to their corresponding edge label.
	**/
	function mapEdgesToD3EdgeLabels(edges) {
				
		// clear map
		edgeToD3LabelMap = {};
		
		// adds an 'edge id -> d3 edge label object' mapping for every edge
		edges.each(function(currentEdge) {
			edgeToD3LabelMap[currentEdge.id] = this;
		});
	}
	
	/**
	 * Maps nodes to an array of neighbours.
	 * A node b is a neighbor of an other node a if there exists an edge from a to b (exception: a node always neighbors itself).
	**/
	function mapNodesToNeighbours() {
		
		var nodes = graph.nodes;
		var edges = graph.edges;
		
		// clear map
		nodeToNeighbourMap = {};
		
		// map node ids to a list of the node's neighbours
		nodes.forEach(function(currentNode) {
			nodeToNeighbourMap[currentNode.id] = [];
			
			// add itself to map
			nodeToNeighbourMap[currentNode.id].push(currentNode);
				
			// iterate through all edges, check if the node is the edge's source or target node
			edges.forEach(function(currentEdge) {
			
				// if the current node is the edge's source or target node, add the edge's source or target node as a neighbour to the current node's neighbour list
				// also only add the node if it has not yet been added as a neighbour
				if((currentEdge.sourceNode.id == currentNode.id) && (nodeToNeighbourMap[currentNode.id].indexOf(currentEdge.targetNode) == -1)){
					nodeToNeighbourMap[currentNode.id].push(currentEdge.targetNode);
				}
				if((currentEdge.targetNode.id == currentNode.id) && (nodeToNeighbourMap[currentNode.id].indexOf(currentEdge.sourceNode) == -1)) {
					nodeToNeighbourMap[currentNode.id].push(currentEdge.sourceNode);
				}
			});
			
		});
		
	}
	
	/**
	 * Maps edges to their corresponding d3 marker object.
	**/
	function mapEdgesToD3MarkerObjects(edges) {
		
		// clear map
		edgeToD3MarkerMap = {};
		
		// adds an 'edge id -> d3 marker object' mapping for every edge
		edges.each(function(currentEdge) {
			edgeToD3MarkerMap[currentEdge.id] = this;
		});
	}	
	
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
		
		// no additional functions
	}
}]);