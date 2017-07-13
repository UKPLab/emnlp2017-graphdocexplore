package de.tudarmstadt.ukp.exploration.graph_doc_explorer.webapp.application.graph.filter;

import static org.junit.Assert.assertEquals;

import java.util.HashMap;
import java.util.LinkedList;
import java.util.List;

import org.junit.Test;

import de.tudarmstadt.ukp.exploration.graph_doc_explorer.graphs.Graph;
import de.tudarmstadt.ukp.exploration.graph_doc_explorer.graphs.GraphEdge;
import de.tudarmstadt.ukp.exploration.graph_doc_explorer.graphs.GraphNode;
import de.tudarmstadt.ukp.exploration.graph_doc_explorer.graphs.SearchResult;
import de.tudarmstadt.ukp.exploration.graph_doc_explorer.webapp.application.graph.parser.SampleDataParser;

public class NodesInScopeFilterTest {

	private Graph graph;

	private List<SearchResult> getSearchResults() {
		List<SearchResult> results = new LinkedList<SearchResult>();
		results.add(
				new SearchResult("a.txt", "highlight", "The test query's results only contain the document 'a.txt'."));
		return results;
	}

	private void parseGraphFile() {
		SampleDataParser p = new SampleDataParser();
		p.setSrc("/graph/filterTest.graph");
		p.parse();
		graph = p.getGraph();
	}

	@Test
	public void testCreateEdgesList() {

		parseGraphFile();

		List<SearchResult> searchResults = this.getSearchResults();

		NodesInScopeFilter nodesInScopeFilter = new NodesInScopeFilter(searchResults, graph);

		// should only contain nodes: Alex, Ramy, Basti
		HashMap<String, GraphNode> graphNodes = nodesInScopeFilter.createNodesList();
		assertEquals(3, graphNodes.size());

		// should only contain edges: Alex-Ramy, Alex-Basti
		List<GraphEdge> graphEdges = nodesInScopeFilter.createEdgesList();
		assertEquals(2, graphEdges.size());
	}

}
