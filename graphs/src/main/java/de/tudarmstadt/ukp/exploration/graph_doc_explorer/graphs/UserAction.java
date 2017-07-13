package de.tudarmstadt.ukp.exploration.graph_doc_explorer.graphs;

/**
 * An Enumeration for all the possible User actions that should be logged
 * 
 * @author Alexander Gössl, Arwed Gölz, Ramy Hcini, Sebastian Vollbrecht
 * @since 20 Jan 2017
 * @version 1.4
 */
public enum UserAction {
	/**
	 * User searches a keyword.
	 * message: [searchword],([relevant_document_name;]* | NO_RESULTS)
	 */
	SEARCH_ACTION,

	/**
	 * User clicked on the back to results button after viewing a document.
	 * message: [searchword]
	 */
	BACK_TO_RESULTS,

	/**
	 * User clicked on a graph node.
	 * message: [node_id]
	 */
	NODE_CLICKED,

	/**
	 * User clicked on a graph edge.
	 * message: [edge_id]
	 */
	EDGE_CLICKED,

	/**
	 * User clicked the 'show entire document' button.
	 * message: [relevant_document_name]
	 */
	VIEW_DOCUMENT_ACTION,

	/**
	 * User clicked on a graph element in such a way that a document tag was
	 * added.
	 * message: [corresponding_graph_element_id]
	 */
	TAG_ADDED,

	/**
	 * User removed a document tag.
	 * message: [corresponding_graph_element_id]
	 */
	TAG_DELETED,
	/**
	 * User clicked on an inactive tag and activated it.
	 * message: [corresponding_graph_element_id]
	 */
	TAG_ACTIVATED,

	/**
	 * User clicked on an active tag and deactivated it.
	 * message: [corresponding_graph_element_id]
	 */
	TAG_DEACTIVATED,

	/**
	 * User activated search word highlighting.
	 * message: none
	 */
	SEARCHWORD_HIGHLIGHT_ACTIVATED,

	/**
	 * User deactivated search word highlighting.
	 * message: none
	 */
	SEARCHWORD_HIGHLIGHT_DEACTIVATED,

	/**
	 * User switched the graph layout.
	 * message: [name_of_new_graph_layout]
	 */
	GRAPH_LAYOUT_SWITCHED,

	/**
	 * User scrolled a single document.
	 * message: [[visible_interval_begin_index, visible_interval_end_index]]
	 */
	DOCUMENT_SCROLLED,

	/**
	 * User scrolled the search results list.
	 * message: [visible_documents_names]
	 */
	SEARCH_RESULTS_SCROLLED,

	/**
	 * User centered a graph node (e.g. by clicking on one of its text
	 * occurrences).
	 * message: [node_id],[visible_nodes_ids]
	 */
	NODE_CENTERED,

	/**
	 * User centered a graph edge (e.g. by clicking on one of its text
	 * occurrences).
	 * message: [edge_id],[visible_nodes_ids]
	 */
	EDGE_CENTERED,

	/**
	 * User dragged a node.
	 * message: [node_id],[visible_nodes_ids]
	 */
	NODE_DRAGGED,

	/**
	 * User panned the graph window.
	 * message: [visible_nodes_ids]
	 */
	PANNED,

	/**
	 * User zoomed the graph window.
	 * message: [visible_nodes_ids]
	 */
	ZOOMED

}
