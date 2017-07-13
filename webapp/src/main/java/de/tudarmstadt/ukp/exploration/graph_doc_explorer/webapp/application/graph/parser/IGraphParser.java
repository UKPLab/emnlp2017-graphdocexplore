package de.tudarmstadt.ukp.exploration.graph_doc_explorer.webapp.application.graph.parser;

import de.tudarmstadt.ukp.exploration.graph_doc_explorer.graphs.Graph;

/**
 * IGraphParser is the interface used to parse a graph from an input source
 * 
 * @author Ramy Hcini
 * @since 22 Dec 2016
 * @version 1.0
 */
@Deprecated
public interface IGraphParser {

	/**
	 * Parses an entire graph input, verifying that it contains a valid graph's
	 * definition.
	 * 
	 * @return true if the file was parsed successfully
	 * 
	 */
	public boolean parse();

	/**
	 * Returns the graph which was built during parsing.
	 * 
	 * @return the graph
	 */
	public abstract Graph getGraph();
}
