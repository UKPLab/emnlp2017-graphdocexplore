package de.tudarmstadt.ukp.exploration.graph_doc_explorer.webapp.application.search;

import java.util.List;

import de.tudarmstadt.ukp.exploration.graph_doc_explorer.graphs.SearchResult;

/**
 * The interface utilized by all search class implementations
 * 
 * @author Alexander Gössl, Ramy Hcini, Sebastian Vollbrecht, Arwed Gölz
 */
public interface ISearcher {

	/**
	 * Perform a query on the underlying search method
	 * 
	 * @param keyword
	 *            The string to search for
	 * @param groupID
	 *            The document collection to search
	 * @return A list of the results
	 */
	public List<SearchResult> query(String keyword, String groupID);

	/**
	 * Sets the string url of the server
	 * 
	 * @param url:
	 *            url of the server
	 */
	public void setUrl(String url);

	/**
	 * List the available document collections that can be searched through
	 * 
	 * @return A list of available document collections
	 */
	public List<String> groupIDs();
}
