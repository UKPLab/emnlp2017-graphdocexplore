package de.tudarmstadt.ukp.exploration.graph_doc_explorer.graphs;

/**
 * Class modeling a search result used in the application.
 * Content comes from the results of the search engine
 * 
 * @author Alexander Gössl, Arwed Gölz, Ramy Hcini, Sebastian Vollbrecht
 * @since 20 Jan 2017
 * @version 1.8
 */
public class SearchResult {
	private String highlight;
	private String text;
	private String id;

	/**
	 * The ONE AND ONLY constructor used for creating Search instances
	 * 
	 * @param _id
	 *            of the search result
	 * @param _highlight
	 *            section
	 * @param _text
	 */
	public SearchResult(String _id, String _highlight, String _text) {
		highlight = _highlight;
		text = _text;
		id = _id;
	}

	public String highlight() {
		return highlight;
	}

	public String text() {
		return text;
	}

	public String id() {
		return id;
	}
}
