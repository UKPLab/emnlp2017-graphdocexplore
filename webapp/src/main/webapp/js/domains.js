'use strict' ;

//Search Result object ( kind of a class )
function SearchResult(data) {
	var title = data.title || data.id ;
	var text = data.text ;
	var highlight = data.highlight ;

	return {
		id: data.id,
		title: title,
		text: text,
		highlight:highlight
	}
}

//Document object 
function Document(data) {
	var title = data.title || data.id ;
	var text = data.text ;
	var highlight = data.highlight ;
	return {
		id: data.id,
		title: title,
		text: text,
		highlight: highlight
	}
}

/**
 * Graph object, consisting of an array of nodes and an array of edges.
**/
function Graph(data) {

	var nodes = [];
	var edges = [];
	var directed = data.directed;
	
	// gather all node objects based on given data	
	for(var id in data.nodes){
		
		// check if there already exists a node with the id to be added
		var existsAlready = false;
		for(var i = 0; i < nodes.length && !existsAlready; i++) {
			if(nodes[i].id == data.nodes[id].id) {
				existsAlready = true;
				console.log("GRAPH ERROR >>> The node you want to add exists already! (node " + nodes[i].id + ")");
			}
		}
		
		if(existsAlready == false) {
			// create new graph node
			var newNode = {};
			
			// set node's data
			newNode.id = data.nodes[id].id;
			newNode.label = data.nodes[id].label.l;
			newNode.occurrences = data.nodes[id].label.occurrences;
			
			// assign node a default color value
			// coloring algorithms check if the value is -1 and color accordingly
			newNode.color = "-1";
			
			// add new node to graph
			nodes.push(newNode);
		}
		
	}
	
	/**
	 * Returns the node object belonging to the given id.
	**/
	var getNode = function(id) {
		for(var i = 0; i < nodes.length; i++){
			if(nodes[i].id === id)
				return nodes[i];
		}
	}
	
	// gather all edge objects based on given data
	for(var id in data.edges){
		
		
		var addEdge = true;
		var currentEdge = data.edges[id];
		
		// check if the edge-to-be-added is problematic
		var sourceNode = getNode(currentEdge.source);
		var targetNode = getNode(currentEdge.target);
		
		// invalid case 1: source or target node of the new edge do not exist
		if(sourceNode === undefined) {
			addEdge = false;
			console.log("GRAPH ERROR >>> The source node of the edge you want to add does not exist! (edge " + currentEdge.id + ")");
		}
		
		if(targetNode === undefined) {
			addEdge = false;
			console.log("GRAPH ERROR >>> The target node of the edge you want to add does not exist! (edge " + currentEdge.id + ")");
		}

		// invalid case 2: source node is also target node
		if(sourceNode !== undefined && targetNode !== undefined && sourceNode.id == targetNode.id) {
			addEdge = false;
			console.log("GRAPH ERROR >>> The source and target node of the edge you want to add are the same! (edge " + currentEdge.id + ")");
		}
		
		for(var i = 0; i < edges.length && addEdge; i++) {
			
			// invalid case 3: source node of existing edge is source node of new edge and target node of existing edge is target node of new edge
			if(sourceNode.id == edges[i].sourceNode.id && targetNode.id == edges[i].targetNode.id) {
				addEdge = false;
				console.log("GRAPH ERROR >>> There exists an edge between the two nodes already! (edge " + currentEdge.id + ")");
			}
			
			// invalid case 4: source node of existing edge is target node of new edge and target node of existing edge is source node of new edge
			else if(sourceNode.id == edges[i].targetNode.id && targetNode.id == edges[i].sourceNode.id) {
				addEdge = false;
				console.log("GRAPH ERROR >>> There exists an edge between the two nodes already! (edge " + currentEdge.id + ")");
			}

		}
		
		if(addEdge == true) {
		
			// create new edge
			var newEdge = {};
			
			// set edge's data
			newEdge.id = currentEdge.id;
			newEdge.label = currentEdge.label.l;
			newEdge.sourceNode = getNode(currentEdge.source);
			newEdge.targetNode = getNode(currentEdge.target);
			newEdge.occurrences = currentEdge.label.occurrences;
			
			// add new edge to graph
			edges.push(newEdge);
			
		}
		
	}
	
	return {
		nodes: nodes,
		edges: edges,
		directed: directed
	}
}