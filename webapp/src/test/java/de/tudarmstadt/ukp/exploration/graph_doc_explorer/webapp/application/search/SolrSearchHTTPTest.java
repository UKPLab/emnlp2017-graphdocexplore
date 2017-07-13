package de.tudarmstadt.ukp.exploration.graph_doc_explorer.webapp.application.search;

import static org.junit.Assert.assertEquals;

import java.util.LinkedList;

import org.junit.Ignore;
import org.junit.Test;

import de.tudarmstadt.ukp.exploration.graph_doc_explorer.graphs.SearchResult;

public class SolrSearchHTTPTest {

	LinkedList<SearchResult> searchResults = new LinkedList<SearchResult>();

	@Test
	@Ignore
	public void testSetup() {
		// ISearcher logic has changed. this test is depercated
		ISearcher search = new SolrSearchHTTP();
		searchResults.addAll(search.query("Howard Metzenbaum", "organisation"));
		assertEquals(8, searchResults.size());
	}
}
