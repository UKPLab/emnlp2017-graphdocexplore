var searchApp = angular.module("searchApp")
searchApp.factory("D3ForceGraphService", ["LoggingService", "HighlightService", function(LoggingService, HighlightService){
	
	// graph container properties
	var gcontainer = 'graph-container';
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
	var defaultNodeSize = 8;
	var maxNodeSize = 36;
	var defaultTextSize = 14;
	var maxTextSize = 24;
	var defaultStrokeWidth = 1.5;
	var highlightStrokeWidth = 2;
	var maxStrokeWidth = 4.5;
	
	var isDirected = true;
	
	// the graph data structure with the node and edge objects
	var graph;

	// the painted graph (g)roup containing all graph svg elements - currently empty, but all nodes and edges and stuff are appended to the group later on
	var g;
	
	// zooming properties
	var minZoom = 0.4;
	var maxZoom = 2;
	var zoomBehaviour;
	
	// useful for GLOBAL mouseup event which tells the loggingservice which nodes are visible
	// this should only happen if the user zooms or drags, not if he clicked outside the svg
	var userZoomsOrDrags = false;
	var previousScale = 1;
	
	// stores the viewport data which is needed when restoring the graph layout after switching back from another layout
	var viewport;
	
	// force data
	var force;
	var linkDistance;
	var graphIsReady = false;
	
	// d3 needs its links to have objects named 'source' and 'target'
	// therefore, we cannot use our graph.edges with objects named 'sourceNode' and 'targetNode'
	var forceLinks;
	
	// mouse event data
	var mouseDownX;
	var	mouseDownY;
	var mouseUpX;
	var mouseUpY;
	
	// these store the d3 objects to be drawn
	var d3Nodes;
	var d3NodeRectangles;
	var d3Edges;
	var d3EdgeLabels;
	var d3EdgeMarkers;
	
	// maps nodes to their corresponding d3 node object
	var nodeToD3NodeMap = {};
	
	// maps node to its rectangle
	var nodeToD3RectangleMap = {};

	// maps node to its neighbours
	// note that a node always neighbours itself
	var nodeToNeighbourMap = {};
		
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

		graphIsReady = false;
	
		// reset d3 nodes with and all corresponding elements
		d3Nodes = {};
		
		d3NodeRectangles = {};
		
		// reset d3 edges with and all corresponding elements
		d3Edges = {};
		d3EdgeLabels = {};
		d3EdgeMarkers = {};
		
		forceLinks = [];
		
		idToGraphElementMap = {};
		
		graph = graphData;
		isDirected = graphData.directed;
		
		// fill our special forceLinks object with data
		for(var i = 0; i < graph.edges.length; i++) {
	
			// create new link
			var newLink = {};

			// set edge's data
			newLink.id = graph.edges[i].id;
			newLink.label = graph.edges[i].label;
			newLink.source = graph.edges[i].sourceNode;
			newLink.target = graph.edges[i].targetNode;
			newLink.occurrences = graph.edges[i].occurrences;
			newLink.wasWrapped = false;
			
			forceLinks.push(newLink);
		}
		
		// gather connectivity data
		mapNodesToEdges();
		mapNodesToNeighbours();

	};
	
	/**
	 * Fills d3 objects with content, places nodes, places edges, places labels, defines events for d3 objects, ...
	**/
	function printGraph(){
		if(graph != undefined){
			$("#"+gcontainer).empty();
			$(document).ready(function(){
				
				maximumGraphWidth = $("#"+gcontainer).width();
				maximumGraphHeight = $("#"+gcontainer).height();

				graphCenterPoint = {x: maximumGraphWidth / 2, y: maximumGraphHeight / 2};
				
				zoomBehaviour = d3.behavior.zoom().center([graphCenterPoint.x, graphCenterPoint.y]).scaleExtent([minZoom, maxZoom]).on("zoom", zoomFunction);
				
				// initialize svg where the graph will be drawn
				svg = d3.select("#"+gcontainer)
				.append("svg")
				.attr({"width": maximumGraphWidth, "height": maximumGraphHeight})
				.call(zoomBehaviour)
				.style("cursor", "move")
				.append("g");
				
				
				// standard zooming function
				function zoomFunction() {
					var zoomEvent = d3.event;
					
					// zoomEvent.translate is an array containing two numbers which dictate the translated amount
					// zoomEvent.scale is a simple scalar value
					svg.attr("transform", "translate(" + zoomEvent.translate + ")scale(" + zoomEvent.scale + ")");
					
					// log visible nodes in case the scale changes
					if(zoomEvent.scale != previousScale) {
						LoggingService.logZoomEvent(calculateVisibleNodes());
						previousScale = zoomEvent.scale;
					}
					// we have a panning event and must set userZoomsOrDrags to true to enable the logging of visible nodes on release of the mouse button
					else {
						userZoomsOrDrags = true;
					}
				}
				
				// without the check we would get weird and random behaiour (e.g. when switching layouts)
				if(graph.nodes.length > 0) {
					
					// append the (currently empty) graph drawing to the svg
					g = svg.append("g");
					
					// color all nodes
					colorNodes();
					
					// place and draw nodes, node labels, edges, edge labels
					initGraph();

					// if we have some old viewport data (e.g. because the user switched to a different layout and has now switched back to this layout)
					// we should restore the old viewport
					if(viewport !== undefined) {
						svg.attr("transform", viewport.svgData);
						zoomBehaviour.translate(viewport.zoomTranslate);
						zoomBehaviour.scale(viewport.zoomScale);
					}
					
					// define force behaviour
					initForces();
					
					force.start();	
				
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
						for(var i = 0; i < graph.nodes.length; i++) {
							
							var currentNode = graph.nodes[i];
							
							// if the node is a neighbour of the focused node, we draw a black border around it
							if(neighbours.indexOf(currentNode) != -1) {
								
								// highlight neighbouring nodes (a node always neighbours itself)
								d3.select(nodeToD3RectangleMap[currentNode.id]).style("stroke", "black").style("stroke-width", highlightStrokeWidth);

							}
							// otherwise we make the node transparent
							else {
								
								// makes node transparent
								d3.select(nodeToD3NodeMap[currentNode.id]).style("opacity",  highlightOpacity);

							}
						}
						
						// to determine if an edge should be transparent, we iterate through all edges and find out if they connect to the focused node
						for(var j = 0; j < forceLinks.length; j++) {
							
							var currentEdge = forceLinks[j];
							
							// make edges transparent that do not have the focused node as source or target node
							if(currentEdge.source.id != graphElementID && currentEdge.target.id != graphElementID) {
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
						for(var i = 0; i < graph.nodes.length; i++) {
							
							var currentNode = graph.nodes[i];
							
							// if the node is the edge's source or target node, we draw a black border around it
							if(graphElement.source.id == currentNode.id || graphElement.target.id == currentNode.id) {
								
								// highlight node
								d3.select(nodeToD3RectangleMap[currentNode.id]).style("stroke", "black").style("stroke-width", highlightStrokeWidth);
							}
							// otherwise we make the node transparent
							else {
								
								// makes node transparent
								d3.select(nodeToD3NodeMap[currentNode.id]).style("opacity",  highlightOpacity);

							}
						}
						
						// to determine if an edge should be transparent, we iterate through all edges and check if their id is the id of the focused edge
						for(var j = 0; j < forceLinks.length; j++) {
							
							var currentEdge = forceLinks[j];
							
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
				
				svg.style("cursor","move");
				
				d3NodeRectangles.style("stroke", "none").style("stroke-width", defaultStrokeWidth);
				
				d3Edges.style("stroke", defaultEdgeColor);
				d3EdgeMarkers.style("fill", defaultEdgeColor);
				
				d3Nodes.style("opacity", 1);
				d3Edges.style("opacity", 1);
				d3EdgeLabels.style("opacity", 1);
			}
		}
	};

	/**
	 * Moves a specific node to the center.
	 * The parameter graphElementID determines which node to center.
	**/
	function moveToCenter(graphElementID, isNode) {
		
		var centeredElement = null;
		
		// if the element is a node, retrieve the node
		if(isNode) {
			for(var i = 0; i < graph.nodes.length; i++) {
				if(graph.nodes[i].id == graphElementID) {
					centeredElement = graph.nodes[i];
					centeredElement.isNode = true;
					
					// fix node to prevent it from drifting away
					centeredElement.fixed = true;
					d3.select(nodeToD3RectangleMap[centeredElement.id])
					.attr("rx", 0)
					.attr("ry", 0);
				}
			}
		}
		// otherwise retrieve the edge's source node
		else {
			for(var i = 0; i < graph.edges.length; i++) {
				if(graph.edges[i].id == graphElementID) {
					centeredElement = graph.edges[i];
					centeredElement.isNode = false;
					
					// fix source and target node to prevent them from drifting away
					centeredElement.sourceNode.fixed = true;
					d3.select(nodeToD3RectangleMap[centeredElement.sourceNode.id])
					.attr("rx", 0)
					.attr("ry", 0);
					
					centeredElement.targetNode.fixed = true;
					d3.select(nodeToD3RectangleMap[centeredElement.targetNode.id])
					.attr("rx", 0)
					.attr("ry", 0);
				}
			}
		}
		if(centeredElement !== null) {
			
			var graphElementPosition;
			
			if(isNode) {
				
				// get transformation attributes of the node which we want to center
				var nodeTranslation = d3.transform(d3.select(nodeToD3NodeMap[centeredElement.id]).attr("transform")).translate;
				// current node position in current viewport
				graphElementPosition = {
					x: nodeTranslation[0],
					y: nodeTranslation[1]
				}

			}
			else {
				
				// get transformation attributes of the edge which we want to center
				// these are determined by the source and target nodes' transformation attributes
				var sourceNodeTranslation = d3.transform(d3.select(nodeToD3NodeMap[centeredElement.sourceNode.id]).attr("transform")).translate;
				var targetNodeTranslation = d3.transform(d3.select(nodeToD3NodeMap[centeredElement.targetNode.id]).attr("transform")).translate;
				// current node position in current viewport: average value of both source and target nodes' tranformations
				graphElementPosition = {
					x: (sourceNodeTranslation[0] + targetNodeTranslation[0]) * 0.5,
					y: (sourceNodeTranslation[1] + targetNodeTranslation[1]) * 0.5
				}
				
			}
			
			// get transformation attributes of svg
			var svgTranslation = d3.transform(svg.attr("transform")).translate;
			var svgScale = d3.transform(svg.attr("transform")).scale;
			
			// current center of viewport
			var viewportCenter = {
				x: (graphCenterPoint.x - svgTranslation[0]) / svgScale[0],
				y: (graphCenterPoint.y - svgTranslation[1]) / svgScale[1]
			};

			
			// update viewport
			// complicated math to calculate the final translation of the entire svg
			// consists of the current translation and the offset between 'current viewport center' -> 'current node position' (scaled of course)
			var newViewPort = {
				x: svgTranslation[0] + (viewportCenter.x - graphElementPosition.x) * svgScale[0],
				y: svgTranslation[1] + (viewportCenter.y - graphElementPosition.y) * svgScale[1]
			};
			
			// update svg's transformation
			svg.attr("transform", "translate(" + newViewPort.x + "," + newViewPort.y + ")scale(" + svgScale + ")");
			
			// update zoom behaviour as well (would otherwise continue where it stopped which would render useless our centering)
			zoomBehaviour.translate([newViewPort.x, newViewPort.y]);
			
			// finally: log all visible nodes after translation (i.e. the nodes which are visible from our new viewport)
			if(isNode) {
				LoggingService.logNodeCentered(centeredElement.id, calculateVisibleNodes());
			}
			else {
				LoggingService.logEdgeCentered(centeredElement.id, calculateVisibleNodes());
			}
		}
	};
	
	/**
	 * Returns the viewport data.
	 * Usually called by the controller before switching graph services.
	 * On switching back, the controller can then immediately restore the old viewport.
	**/
	function getViewport() {
		
		// we return the svg's transformation data
		// we also return the zoom behaviour because otherwise the zoom events wouldn't continue where we left them
		return {
			svgData: svg.attr("transform"),
			zoomTranslate: zoomBehaviour.translate(),
			zoomScale: zoomBehaviour.scale()
		};
	};
	
	/**
	 * Sets viewport data.
	 * Usually called by the controller after switching to this graph service.
	**/
	function setViewport(viewportData) {
		
		viewport = viewportData;

	};

	/**
	 * Stops the force ticking. This is called when the graph service is changed in the controller.
	**/
	function stopForce() {
		
		// force is undefined if there is no graph
		if(force !== undefined) {
			force.stop();
		}
	}
	
	// =================== //
	//  PRIVATE FUNCTIONS  //
	// =================== //

	/**
	 * Draws nodes. Also draws the nodes' labels.
	**/
	function drawNodes() {
		
		// remove all nodes
		g.selectAll(".node").remove();
		
		// draw new nodes
		d3Nodes = g.selectAll(".node").data(graph.nodes)
		.enter()
		.append("g")
		.attr("class", "node")
		.call(mapNodesToD3NodeObjects);
		
		d3Nodes.append("text")
		.attr("dy", "0.71em")
		.attr("font-size", defaultTextSize + "px")
		.attr("text-anchor", "middle")
		.style("fill", function(node) {
			return HighlightService.getFontColor(node.color);
		})
		.call(wrapLabels)
		.call(getBB)
		.attr("transform", function(node) {
			if(node.wasWrapped)
				// wrapped texts must be placed slightly higher in order to properly center them
				return "translate(" + 0 + "," + -node.bbox.height * 0.45 + ")";
			else
				return "translate(" + 0 + "," + -node.bbox.height * 0.3 + ")";
		});
		
		d3NodeRectangles = d3Nodes.insert("rect", "text")
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
			return (node.bbox.width + defaultTextSize) / -2;
		})
		.attr("y",  function(node){
			return (node.bbox.height + defaultTextSize) / -2;
		})
		.attr("rx", function(node) {
			return node.fixed ? 0 : 10;
		})
		.attr("ry", function(node) {
			return node.fixed ? 0 : 10;
		})
		.call(mapNodesToD3Rectangles)
		.style("stroke", "none");
		
		// returns bounding box of text element
		// this is needed so that the background box's size (see below) is an exact fit
		function getBB(selection) {
			selection.each(function(element){
				element.bbox = this.getBBox();
			})
		};
		
		// === MOUSE EVENTS === //
		
		// highlight node when the mouse is above the rectangle
		d3Nodes.on("mouseover", function(node) {
			highlightGraphElement(node.id, true);
		});
		
		// make nodes clickable
		d3Nodes.on("mousedown", function(node) {
			
			// save coordinates to distinguish (in global mouseup) between a single mouseclick and dragging behaviour
			var coordinates = d3.mouse(svg.node());
			mouseDownX = coordinates[0];
			mouseDownY = coordinates[1];
			
			d3.event.stopPropagation();
			
			focusedGraphElement = node;
			focusedGraphElementIsNode = true;
		});
		
		// remove highlights when leaving the node's rectangle
		d3Nodes.on("mouseout", function() {
			resetHighlights();
		});
	}
	
	/**
	 * Draws edges, i.e. their corresponding path and marker. Also draws the edges' labels.
	**/
	function drawEdges() {
		
		// remove all edges
		g.selectAll(".edge").remove();
	
		// draw new edges
		d3Edges = g.selectAll(".edge").data(forceLinks)
		.enter()
		.append("path")
		.attr("class", "edge")
		.style("stroke-width", defaultStrokeWidth)
		.style("stroke", defaultEdgeColor)
		.call(mapEdgesToD3EdgeObjects);

		// remove all edge markers
		g.selectAll("marker").remove();
		
		// add arrowhead marker to edge
		d3Edges.attr("marker-end", function(edge) { return "url(#myOwnArrowhead_" + edge.id + ")"; });
		
		// define line marker properties
		d3EdgeMarkers = g.selectAll("marker")
			.data(forceLinks)
			.enter().append("marker")
			.attr("id", function(edge) { return "myOwnArrowhead_" + edge.id; })
			.attr("viewBox", "0 -5 12 10")
			.attr("refX", 11)
			.attr("refY", 0)
			.attr("markerWidth", 1.5 * defaultNodeSize)
			.attr("markerHeight", 1.5 * defaultNodeSize)
			// 'userSpaceOnUse' is important so that the edge width is NOT taken into account (would displace arrowhead - annoying)
			//.attr("markerUnits", "userSpaceOnUse")
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
		g.selectAll(".edgeLabel").remove();
		
		// draw new edge labels
		d3EdgeLabels = g.selectAll(".edgeLabel")
		.data(forceLinks)
		.enter()
		.append("g")
		.attr("class", "edgeLabel")
		.attr("transform", function(edge){
			return "translate(" + ((edge.source.x + edge.target.x) / 2) + "," + ((edge.target.y + edge.source.y) / 2) + ")";
		})
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
			selection.each(function(element){
				element.bbox = this.getBBox();
			})
		}
		
		// append white background box for better readability
		// accesses the text's bounding box for size calculation
		d3EdgeLabels.insert("rect", "text")
		.attr("x", function(label){return - (label.bbox.width / 2); })
		// - 2 is arbitrary for better positioning, moves the rectangle upwards just slightly
		.attr("y", - defaultTextSize / 2 - 2)
		.attr("width", function(label){ return label.bbox.width; })
		// + 2 is arbitrary for more vertical space
		.attr("height", function(label){ return label.bbox.height + 2; })
		.style("fill", "white");
		
		// === MOUSE EVENTS === //
		
		// make edges clickable
		d3Edges.on("mousedown", function(edge) {
			
			// save coordinates to distinguish (in global mouseup) between a single mouseclick and dragging behaviour
			var svgTranslation = d3.transform(svg.attr("transform")).translate;
			mouseDownX = svgTranslation[0];
			mouseDownY = svgTranslation[1];
			
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
			var svgTranslation = d3.transform(svg.attr("transform")).translate;
			mouseDownX = svgTranslation[0];
			mouseDownY = svgTranslation[1];
			
			focusedGraphElement = edge;
			focusedGraphElementIsNode = false;
		});
		
		// highlight edge on label mouseover
		d3EdgeLabels.on("mouseover", function(edge) {
			highlightGraphElement(edge.id, false);
		});
	
		// remove edge highlights when leaving edge label
		d3EdgeLabels.on("mouseout", function() {
			resetHighlights();
		});	
	}

	/**
	 * Draws a line for the given edge object.
	 * The line starts at the intersection of the path 'source -> target' with the source rectangle and stops at the border of the target rectangle.
	**/
	function drawLink(edge) {
		
		// get the source's bounding box (this is the source rectangle used for the calculation)
		var targetBox = edge.target.bbox;
		var targetWidth = targetBox.width + defaultTextSize;
		var targetHeight = targetBox.height + defaultTextSize;
		
		// get the target's bounding box (this is the target rectangle used for the calculation)
		var sourceBox = edge.source.bbox;
		var sourceWidth = sourceBox.width + defaultTextSize;
		var sourceHeight = sourceBox.height + defaultTextSize;
		
		var direction = {
			x: edge.target.x - edge.source.x,
			y: edge.target.y - edge.source.y
		};

		var length = Math.sqrt(direction.x * direction.x + direction.y * direction.y);

		direction.x = direction.x / length;
		direction.y = direction.y / length;

		var source = {
			x: edge.source.x,
			y: edge.source.y
		};
	
		var target = {
			x: edge.target.x,
			y: edge.target.y
		};
		
		if(direction.x != 0) {
		
			var slopeOfEdge = direction.y / direction.x;

			// calculate intersection point of edge with source rectangle
			// for calculation, see here: http://stackoverflow.com/a/1585620
			// note that the y coordinate calculations are flipped as the svg coordinate system has its center in the top left corner.
			// the two calculations might seem duplicated, but they are not. the comparison of the inner ifs are flipped for the source's calculations
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
				source.y = source.y + (sourceHeight * 0.5);
				target.y = target.y - (targetHeight * 0.5);
			}
			// hits bottom side of rectangle
			else {
				source.y = source.y - (sourceHeight * 0.5);
				target.y = target.y + (targetHeight * 0.5);
			}
			
		}
		
		var edgeCoordinates = {
			x1: source.x,
			y1: source.y,
			x2: target.x,
			y2: target.y
		};
		
		edge.coordinates = edgeCoordinates;

		return "M" + source.x + "," + source.y + "L" + target.x + "," + target.y;
	}
	
	/**
	 * Initialize the force simulation.
	**/
	function initForces() {
		
		// linkDistance is always 1/4th of the max available graph size
		linkDistance = maximumGraphWidth > maximumGraphHeight ? maximumGraphWidth * 0.4 : maximumGraphHeight * 0.4;
		
		// setup force properties
		force = d3.layout.force()
			.nodes(graph.nodes)
			.links(forceLinks)
			.charge(-4000)
			.linkDistance(linkDistance);
		
		// define node dragging behaviour
		d3Nodes.call(force.drag().on("dragstart", dragstart));
		
		// fixes the dragged node so the simulation does not reposition it anymore
		// also removes the round corners to convey that the rectangle is now fixed
		function dragstart(node) {
			d3.event.sourceEvent.preventDefault();
			d3.event.sourceEvent.stopPropagation();
		};
		
		// defines what to do in every tick of the simulation
		force.on("tick", function() {
			
			// only update positions if the graph is fully constructed
			// otherwise we might see some race conditions
			if(graphIsReady) {
				
				// update node positions
				d3Nodes.attr("transform", function(node) { return "translate(" + node.x + "," + node.y + ")"; });
				
				// draw edges anew
				d3Edges.attr("d", drawLink);
				
				// position edge labels anew
				d3EdgeLabels.attr("transform", function(edge){
					return "translate(" +
						((edge.coordinates.x1 + edge.coordinates.x2) / 2) +
						"," +
						((edge.coordinates.y1 + edge.coordinates.y2) / 2) + ")";
				});
			}
		});
	}
	
	/**
	 * Calculates the initial node coordinates based on the width and height of the available space.
	**/
	function initGraph() {
		
		if(graph.nodes.length > 0) {
	
			graphCenterPoint.x = maximumGraphWidth / 2;
			graphCenterPoint.y = maximumGraphHeight / 2;
	
			var nodes = graph.nodes;
		
			// sorts nodes based on the number of edges which connect to them
			// nodes with many connections are moved to the front
			nodes.sort(function(a,b) {
				return nodeToEdgesMap[b.id].length - nodeToEdgesMap[a.id].length;
			});
			
			nodes[0].x = graphCenterPoint.x;
			nodes[0].y = graphCenterPoint.y;
			
			// calculate positions of all nodes
			calculatePositions();
			
			// update graph drawing (edges first because of https://en.wikipedia.org/wiki/Painters_algorithm, would otherwise be on top of nodes
			drawEdges();
			drawNodes();
			
			// move graph to center (currently all nodes and edges are drawn at the top left corner)
			svg.attr("transform",  "translate(" + maximumGraphWidth / 2 + "," + maximumGraphHeight / 2 + ")");
			
			// update zoom translation as well (would otherwise jump back to the previous location upon panning/zooming the graph)
			zoomBehaviour.translate([maximumGraphWidth / 2, maximumGraphHeight / 2]);
			
			// === GLOBAL MOUSEUP EVENT === //
			
			d3.select(window).on("mouseup", function() {
				if (focusedGraphElement !== null && focusedGraphElementIsNode !== null) {
					
					if(focusedGraphElementIsNode) {
						var coordinates = d3.mouse(svg.node());
						mouseUpX = coordinates[0];
						mouseUpY = coordinates[1];
					}
					// if an edge was clicked, we must check if the svg was translated
					else {
						var svgTranslation = d3.transform(svg.attr("transform")).translate;
						mouseUpX = svgTranslation[0];
						mouseUpY = svgTranslation[1];
					}
					
					// only use element for highlighting if the graph or the element itself were not dragged around
					if(mouseUpX == mouseDownX && mouseUpY == mouseDownY) {
						
						if(focusedGraphElementIsNode) {
							LoggingService.logNode(focusedGraphElement.id);
							HighlightService.addNodeStyle(focusedGraphElement);
						}
						else {
							LoggingService.logEdge(focusedGraphElement.id);
							HighlightService.addEdgeStyle(focusedGraphElement);
						}
					}
					else {
						
						// dragging nodes should fix them in place so that they don't get moved around by the forces anymore
						if(focusedGraphElementIsNode) {
							focusedGraphElement.fixed = true;
							
							// remove round edges of the rectangle
							d3.select(nodeToD3RectangleMap[focusedGraphElement.id])
							.attr("rx", 0)
							.attr("ry", 0);
							
							LoggingService.logNodeDragEvent(focusedGraphElement.id, calculateVisibleNodes());
							
						}
					}
					focusedGraphElement = null;
					focusedGraphElementIsNode = null;
					
				}
				
				if(userZoomsOrDrags) {
					LoggingService.logPanEvent(calculateVisibleNodes());
					userZoomsOrDrags = false;
				}
				
			});
		}
	}
	
	/**
	 * Calculates which nodes are currently visible.
	**/
	function calculateVisibleNodes() {
		
		var visibleNodes = [];
		
		for(var i = 0; i < graph.nodes.length; i++) {
			
			var currentNode = graph.nodes[i];
			
			// get transformation attributes of the node which we want to center
			var nodeTranslation = d3.transform(d3.select(nodeToD3NodeMap[currentNode.id]).attr("transform")).translate;
			// current node position in current viewport
			nodePosition = {
				x: nodeTranslation[0],
				y: nodeTranslation[1]
			}
			
			// get transformation attributes of svg
			var svgTranslation = d3.transform(svg.attr("transform")).translate;
			var svgScale = d3.transform(svg.attr("transform")).scale;
			
			// current center of viewport
			var viewportCenter = {
				x: svgTranslation[0] / svgScale[0],
				y: svgTranslation[1] / svgScale[1]
			};
			
			// top side of viewport
			var viewportTop = (0 - svgTranslation[1]) / svgScale[1];
			
			// bottom side of viewport
			var viewportBottom = (maximumGraphHeight - svgTranslation[1]) / svgScale[1];
			
			// left side of viewport
			var viewportLeft = (0 - svgTranslation[0]) / svgScale[0];
			
			// right side of viewport
			var viewportRight = (maximumGraphWidth - svgTranslation[0]) / svgScale[0];
			
			var horizontallyInBounds = nodePosition.x <= viewportRight && nodePosition.x >= viewportLeft;
			var verticallyInBounds = nodePosition.y <= viewportBottom && nodePosition.y >= viewportTop;
			
			if(horizontallyInBounds && verticallyInBounds) {
				visibleNodes.push(currentNode.id);
			}
			
		}
		
		return visibleNodes;
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
				
				if (tspan.node().getComputedTextLength() > (maximumGraphWidth * 0.3) && !firstWord) {
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
	 * Calculates the initial node coordinates based on the width and height of the available space.
	 * Places them like this:
	 *
	 * O---|        O---O        O---O        O---O        O-O-O        O-O-O   ...
	 * |   |   ->   |   |   ->   |   |   ->   |   |   ->   |   |   ->   |   O   ...
	 * |---|        |---|        |---O        O---O        O---O        O---O   ...
	 *
	**/
	function calculatePositions() {
		
		if(graph.nodes.length > 0) {
	
			var nodes = graph.nodes;
			
			// decides which side to place a node on
			// 0: top side, 1: right side, 2: bottom side, 3: left side
			var sideCounter = 0;
			
			var stepLengthX = 128 / (nodes.length * 2);
			var stepLengthY = 128 / (nodes.length * 2);
			for(var i = 0; i < nodes.length; i++) {
				
				var stepsToTake = Math.floor(i * 0.25);
				
				// top side, start placing nodes in top left corner
				if(sideCounter == 0) {
					nodes[i].x = 0 + (stepLengthX * stepsToTake);
					nodes[i].y = 0;
				}
				// right side, start placing nodes in top right corner
				else if(sideCounter == 1) {
					nodes[i].x = maximumGraphWidth;
					nodes[i].y = 0 + (stepLengthY * stepsToTake);
				}
				// bottom side, start placing nodes in bottom right corner
				else if(sideCounter == 2) {
					nodes[i].x = maximumGraphWidth - (stepLengthX * stepsToTake);
					nodes[i].y = maximumGraphHeight;
				}
				// left side, start placing nodes in bottom left corner
				else if(sideCounter == 3) {
					nodes[i].x = 0;
					nodes[i].y = maximumGraphHeight - (stepLengthY * stepsToTake);
				}
								
				sideCounter = (sideCounter + 1) % 4;
				
			}
		}
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
		var edges = forceLinks;
		
		// clear map
		nodeToEdgesMap = {};
		
		// map node ids to connecting edges
		nodes.forEach(function(currentNode) {
			
			// every node id gets mapped to an array of edges
			nodeToEdgesMap[currentNode.id] = [];
				
			// iterate through all edges, check if the node is the edge's source node
			edges.forEach(function(currentEdge) {
			
				// if the current node is the edge's source or target node, the edge is added to the node's list of edges
				if((currentEdge.source.id == currentNode.id) || (currentEdge.target.id == currentNode.id)) {
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
	function mapNodesToD3Rectangles(nodes) {
				
		// clear map
		nodeToD3RectangleMap = {};
		
		// adds an 'node id -> d3 node label object' mapping for every node
		nodes.each(function(currentNode) {
			nodeToD3RectangleMap[currentNode.id] = this;
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
		var edges = forceLinks;
		
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
				if((currentEdge.source.id == currentNode.id) && (nodeToNeighbourMap[currentNode.id].indexOf(currentEdge.target) == -1)){
					nodeToNeighbourMap[currentNode.id].push(currentEdge.target);
				}
				if((currentEdge.target.id == currentNode.id) && (nodeToNeighbourMap[currentNode.id].indexOf(currentEdge.source) == -1)) {
					nodeToNeighbourMap[currentNode.id].push(currentEdge.source);
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
		usesForces: true,
		
		// additional functions
		stop: stopForce
	}
}]);