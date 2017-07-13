package de.tudarmstadt.ukp.exploration.graph_doc_explorer.graphs;

/**
 * A class that models a graph edge
 * 
 * @author Alexander Gössl, Arwed Gölz, Ramy Hcini, Sebastian Vollbrecht
 * @since 20 Jan 2017
 * @version 1.4
 */
public class GraphEdge {
	private String id;
	private Label label;
	/**
	 * Source node ID
	 */
	private GraphNode source;
	/**
	 * Target node ID
	 */
	private GraphNode target;

	final private transient String NO_SOURCE_NODE = "null";
	final private transient String NO_TARGET_NODE = "null";

	/**
	 * Creates a new GraphEdge, consisting of a source node, a target node and
	 * the name of the edge
	 * Generate an ID
	 * 
	 * @param sourceNode
	 *            the source GraphNode
	 * @param targetNode
	 *            the target GraphNode
	 * @param label
	 *            the edge's label
	 */
	public GraphEdge(GraphNode sourceNode, GraphNode targetNode, Label _label) {
		this.source = sourceNode;
		this.target = targetNode;
		// construct id : concatenate sourceID and targetID with an underscore.
		this.id = this.source.id() + "_" + this.target.id();
		this.label = _label;
	}

	public String id() {
		return id;
	}

	public void setId() {
		this.id = this.source.id() + "_" + this.target.id();
	}

	public GraphNode getSource() {
		return source;
	}

	public void setSource(GraphNode node) {
		this.source = node;
		this.setId();
	}

	public GraphNode getTarget() {
		return target;
	}

	public void setTarget(GraphNode node) {
		this.target = node;
		this.setId();
	}

	public Label label() {
		return label;
	}

	@Override
	public String toString() {
		return source + "-" + target;
	}
}
