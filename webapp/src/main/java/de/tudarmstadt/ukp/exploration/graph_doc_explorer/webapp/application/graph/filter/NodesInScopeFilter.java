package de.tudarmstadt.ukp.exploration.graph_doc_explorer.webapp.application.graph.filter;

import java.util.HashMap;
import java.util.LinkedList;
import java.util.List;

import de.tudarmstadt.ukp.exploration.graph_doc_explorer.graphs.Graph;
import de.tudarmstadt.ukp.exploration.graph_doc_explorer.graphs.GraphEdge;
import de.tudarmstadt.ukp.exploration.graph_doc_explorer.graphs.GraphNode;
import de.tudarmstadt.ukp.exploration.graph_doc_explorer.graphs.Occurrence;
import de.tudarmstadt.ukp.exploration.graph_doc_explorer.graphs.SearchResult;

/**
 * This class filters a graph file with regard to a specific search query,
 * removing all nodes and edges which are not relevant.
 */
@SuppressWarnings("deprecation")
public class NodesInScopeFilter implements IGraphFilter {

	private Graph graph;
	private List<SearchResult> searchResults;
	private HashMap<String, GraphNode> filteredNodes = new HashMap<String, GraphNode>();

	public NodesInScopeFilter() {
	}

	/**
	 * Constructor for a NodesInScopeFilter.
	 * 
	 * @param searchResults
	 *            the search results which are used for filtering out
	 *            unnecessary nodes and edges
	 * @param graph
	 *            the Graph instance which needs to be filtered
	 */
	public NodesInScopeFilter(List<SearchResult> searchResults, Graph graph) {
		this.searchResults = searchResults;
		this.graph = graph;
	}

	/**
	 * Creates the final list of GraphNodes which is sent to the client. This
	 * list only contains nodes which are truly relevant regarding a specific
	 * search query.
	 * 
	 * @return a list containing all relevant GraphNodes
	 */
	public HashMap<String, GraphNode> createNodesList() {

		List<GraphNode> nodes = graph.nodes();

		for (GraphNode node : nodes) {
			// System.out.println("Node " + node.getId());
			List<Occurrence> occurences = node.label().occurrences();

			/*
			 * only add the current node if the node's occurrences contain the
			 * search result
			 */
			for (Occurrence oc : occurences) {
				boolean f = false;
				for (SearchResult result : searchResults) {
					if (oc.docID().equals(result.id())) {
						filteredNodes.put(node.id(), node);
						f = true;
						break;
					}
				}
				if (f)
					break;
			}
		}
		return filteredNodes;
	}

	/**
	 * Creates the final list of GraphEdges which is sent to the client. This
	 * list only contains nodes which are truly relevant regarding a specific
	 * search query, i.e. all edges for which both the source and target
	 * GraphNode are relevant themselves.
	 * 
	 * @return a list containing all relevant GraphEdges
	 */
	public List<GraphEdge> createEdgesList() {

		List<GraphEdge> filteredEdges = new LinkedList<GraphEdge>();

		// only add the current edge if the edge's source and target node are
		// relevant themselves
		for (GraphEdge edge : graph.edges()) {
			if (filteredNodes.containsKey(edge.getSource().id()) && filteredNodes.containsKey(edge.getTarget().id())) {
				filteredEdges.add(edge);
			}
		}

		return filteredEdges;
	}

	@Override
	public Graph filter(List<SearchResult> searchResults, Graph g) {
		this.searchResults = searchResults;
		this.graph = g;

		HashMap<String, GraphNode> nodes = createNodesList();
		List<GraphEdge> edges = createEdgesList();

		System.out.println("nodes :" + nodes.size() + "--- edges : " + edges.size());
		return new Graph(nodes, edges);
	}

}
