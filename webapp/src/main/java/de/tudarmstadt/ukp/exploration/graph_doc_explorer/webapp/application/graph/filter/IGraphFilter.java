package de.tudarmstadt.ukp.exploration.graph_doc_explorer.webapp.application.graph.filter;

import java.util.List;

import de.tudarmstadt.ukp.exploration.graph_doc_explorer.graphs.Graph;
import de.tudarmstadt.ukp.exploration.graph_doc_explorer.graphs.SearchResult;

/**
 * Interface for a graph filter
 * 
 * @author Alexander Gössl, Arwed Gölz, Ramy Hcini, Sebastian Vollbrecht
 * @since 20 Jan 2017
 * @version 1.0
 */

@Deprecated
public interface IGraphFilter {
	/**
	 * Filter the Graph using the search results
	 * 
	 * @param searchResults
	 * @param g
	 *            : graph
	 * @return a filtered Graph
	 */
	public Graph filter(List<SearchResult> searchResults, Graph g);
}
