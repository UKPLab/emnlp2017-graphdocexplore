package de.tudarmstadt.ukp.exploration.graph_doc_explorer.webapp.application.graph;

import static org.junit.Assert.assertEquals;

import java.util.ArrayList;
import java.util.List;

import org.junit.Before;
import org.junit.Test;

import de.tudarmstadt.ukp.exploration.graph_doc_explorer.graphs.SearchResult;

public class DummyGraphGeneratorTest {
	private List<SearchResult> searchResults;

	@Before
	public void setUp() throws Exception {
		searchResults = new ArrayList<SearchResult>();
		searchResults.add(new SearchResult("1018-7.txt", "", "")); // 4 nodes ;
																	// 2 edges
		searchResults.add(new SearchResult("1018-1.txt", "", "")); // 4 nodes ;
																	// 2 edges
	}

	@Test
	public void testGeneratedGraph() {
		FileGraphGenerator dummy = new FileGraphGenerator();
		String[] params = { "" };
		dummy.initialize(searchResults, null, params); // "/data/student_loans/");

		assertEquals(dummy.getGraph().edges().size(), 5);
		assertEquals(dummy.getGraph().nodes().size(), 7);
	}

}
