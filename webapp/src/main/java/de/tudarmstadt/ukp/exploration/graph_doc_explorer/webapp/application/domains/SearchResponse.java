package de.tudarmstadt.ukp.exploration.graph_doc_explorer.webapp.application.domains;

import java.util.List;

import de.tudarmstadt.ukp.exploration.graph_doc_explorer.graphs.Graph;
import de.tudarmstadt.ukp.exploration.graph_doc_explorer.graphs.SearchResult;

/**
 * The wrapper class of the JSON response sent to the client application
 * 
 * @author Alexander Gössl, Arwed Gölz, Ramy Hcini, Sebastian Vollbrecht
 * @since 20 Jan 2017
 * @version 1.7
 */
public class SearchResponse {
	List<SearchResult> searchResults;
	GraphAPI graph;

	/**
	 * ONE AND ONLY constructor
	 * 
	 * @param _searchResults
	 * @param _graph
	 */
	public SearchResponse(List<SearchResult> _searchResults, Graph _graph) {
		searchResults = _searchResults;
		graph = new GraphAPI(_graph);
	}

	public List<SearchResult> searchResults() {
		return searchResults;
	}

	public GraphAPI graph() {
		return graph;
	}
}
