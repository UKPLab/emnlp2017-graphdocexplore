package de.tudarmstadt.ukp.exploration.graph_doc_explorer.webapp.application.domains;

import java.util.LinkedList;
import java.util.List;

import de.tudarmstadt.ukp.exploration.graph_doc_explorer.graphs.Graph;
import de.tudarmstadt.ukp.exploration.graph_doc_explorer.graphs.GraphEdge;
import de.tudarmstadt.ukp.exploration.graph_doc_explorer.graphs.GraphNode;

/**
 * Graph for usage in API (with GraphEdgeAPI)
 */
public class GraphAPI {

	private List<GraphNode> nodes;
	private List<GraphEdgeAPI> edges;
	private boolean directed;

	public GraphAPI(Graph g) {
		this.nodes = g.nodes();
		this.edges = new LinkedList<GraphEdgeAPI>();
		for (GraphEdge e : g.edges())
			this.edges.add(new GraphEdgeAPI(e));
		this.directed = g.isDirected();
	}

	public List<GraphNode> nodes() {
		return nodes;
	}

	public List<GraphEdgeAPI> edges() {
		return edges;
	}

	public boolean isDirected() {
		return directed;
	}
}
