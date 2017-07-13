package de.tudarmstadt.ukp.exploration.graph_doc_explorer.graphs;

import java.util.HashSet;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * This class models a Graph including Nodes and Edges
 * 
 * @author Alexander Gössl, Arwed Gölz, Ramy Hcini, Sebastian Vollbrecht
 * @since 20 Jan 2017
 * @version 1.3
 */
public class Graph {

	private List<GraphNode> nodes;
	private List<GraphEdge> edges;
	private boolean directed;

	public Graph() {
		nodes = new LinkedList<GraphNode>();
		edges = new LinkedList<GraphEdge>();
		directed = true;
	}

	/**
	 * Construct a graph instance
	 * 
	 * @param nodes
	 *            as a map of nodeID (as String) -> node (as GraphNode)
	 * @param edges
	 */
	public Graph(Map<String, GraphNode> nodes, List<GraphEdge> edges) {
		this.nodes = new LinkedList<GraphNode>(nodes.values());
		this.edges = edges;
	}

	public boolean isDirected() {
		return directed;
	}

	public void setDirected(boolean dir) {
		directed = dir;
	}

	public List<GraphNode> nodes() {
		return nodes;
	}

	public List<GraphEdge> edges() {
		return edges;
	}

	public void addNode(GraphNode node) {
		nodes.add(node);
	}

	public void addEdge(GraphEdge edge) {
		edges.add(edge);
	}

	public void removeNode(GraphNode node) {
		this.nodes.remove(node);
		Set<GraphEdge> toRemove = new HashSet<GraphEdge>();

		for (GraphEdge e : this.edges)
			if (e.getSource().equals(node.id()) || e.getTarget().equals(node.id()))
				toRemove.add(e);

		this.edges.removeAll(toRemove);
	}

	public void removeEdge(GraphEdge edge) {
		this.edges.remove(edge);
	}
}
