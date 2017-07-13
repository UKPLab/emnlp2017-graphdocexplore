package de.tudarmstadt.ukp.exploration.graph_doc_explorer.webapp.application.domains;

import de.tudarmstadt.ukp.exploration.graph_doc_explorer.graphs.GraphEdge;
import de.tudarmstadt.ukp.exploration.graph_doc_explorer.graphs.Label;

/**
 * Graph edge for usage in API -> without references to nodes
 */
public class GraphEdgeAPI {
	private String id;
	private Label label;
	/**
	 * Source node ID
	 */
	private String source;
	/**
	 * Target node ID
	 */
	private String target;

	final private transient String NO_SOURCE_NODE = "null";
	final private transient String NO_TARGET_NODE = "null";

	public GraphEdgeAPI(GraphEdge e) {
		this.id = e.id();
		this.label = e.label();
		this.source = e.getSource().id();
		if (this.source == null)
			this.source = NO_SOURCE_NODE;
		this.target = e.getTarget().id();
		if (this.target == null)
			this.target = NO_TARGET_NODE;
	}

	public String id() {
		return id;
	}

	public String source() {
		return source;
	}

	public String target() {
		return target;
	}

	public Label label() {
		return label;
	}

	@Override
	public String toString() {
		return source + "-" + target;
	}
}
