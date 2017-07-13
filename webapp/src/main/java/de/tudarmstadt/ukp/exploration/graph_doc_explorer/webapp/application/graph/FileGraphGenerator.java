package de.tudarmstadt.ukp.exploration.graph_doc_explorer.webapp.application.graph;

import java.util.List;

import de.tudarmstadt.ukp.exploration.graph_doc_explorer.graphs.Graph;
import de.tudarmstadt.ukp.exploration.graph_doc_explorer.graphs.IGraphGenerator;
import de.tudarmstadt.ukp.exploration.graph_doc_explorer.graphs.LogEntry;
import de.tudarmstadt.ukp.exploration.graph_doc_explorer.graphs.SearchResult;
import de.tudarmstadt.ukp.exploration.graph_doc_explorer.webapp.application.graph.filter.IGraphFilter;
import de.tudarmstadt.ukp.exploration.graph_doc_explorer.webapp.application.graph.filter.NodesInScopeFilter;
import de.tudarmstadt.ukp.exploration.graph_doc_explorer.webapp.application.graph.parser.IGraphParser;
import de.tudarmstadt.ukp.exploration.graph_doc_explorer.webapp.application.graph.parser.SampleDataParser;

/**
 * A dummy graph generator implementing the graph generator interface to
 * just for the developement phase. Later we will use the generator of the
 * Client
 * 
 * @author Alexander Gössl, Arwed Gölz, Ramy Hcini, Sebastian Vollbrecht
 * @since 20 Jan 2017
 * @version 1.0
 */
@SuppressWarnings("deprecation")
public class FileGraphGenerator implements IGraphGenerator {
	IGraphFilter filter;
	IGraphParser parser;
	Graph g;

	@Override
	public void initialize(List<SearchResult> searchResults, String folder, String[] args) {
		System.out.println("init: " + this.getClass().getSimpleName());
		SampleDataParser parser = new SampleDataParser();
		if (folder != null) {
			parser.setSrc(folder + "graph");
		}
		filter = new NodesInScopeFilter();
		parser.parse();
		g = filter.filter(searchResults, parser.getGraph());
		g.setDirected(true);
	}

	@Override
	public void addUserAction(LogEntry userAction) {
		// TODO Auto-generated method stub

	}

	@Override
	public Graph getGraph() {
		return g;
	}

}
