package de.tudarmstadt.ukp.exploration.graph_doc_explorer.graphs;

import java.util.List;

/**
 * This is the Model for a single node in the Graph.
 * The Node contains of:
 * label - The labeled displayed in the Graph.
 * id - The identifier for this node (this is necessary for rendering the Edges)
 * occurences - the documents where this node appears ( directly or in other
 * words )
 * 
 * @author Alexander Gössl, Arwed Gölz, Ramy Hcini, Sebastian Vollbrecht
 * @since 20 Jan 2017
 * @version 1.7
 */
public class GraphNode {

	private String id;
	private Label label;

	/**
	 * constructor for a graph node
	 * 
	 * @param id
	 *            The Node id
	 * @param label
	 *            The Node label with its occurences in a label class
	 */
	public GraphNode(String id, Label label) {
		this.label = label;
		this.id = id;
	}

	public GraphNode(String id, String label) {
		this.label = new Label(label);
		this.id = id;
	}

	/**
	 * constructor for a graph node
	 * 
	 * @param id
	 *            The Node id
	 * @param label
	 *            The Node label
	 * @param occurences
	 *            The occurences of this Node in documents
	 */
	public GraphNode(String id, String label, List<Occurrence> occurences) {
		this.label = new Label(label, occurences);
		this.id = id;
	}

	public Label label() {
		return label;
	}

	public String id() {
		return id;
	}

	@Override
	public int hashCode() {
		final int prime = 31;
		int result = 1;
		result = prime * result + ((id == null) ? 0 : id.hashCode());
		return result;
	}

	@Override
	public boolean equals(Object obj) {
		if (this == obj)
			return true;
		if (obj == null)
			return false;
		if (getClass() != obj.getClass())
			return false;
		GraphNode other = (GraphNode) obj;
		if (id == null) {
			if (other.id != null)
				return false;
		} else if (!id.equals(other.id))
			return false;
		return true;
	}

	@Override
	public String toString() {
		return id + "'" + label;
	}

}
