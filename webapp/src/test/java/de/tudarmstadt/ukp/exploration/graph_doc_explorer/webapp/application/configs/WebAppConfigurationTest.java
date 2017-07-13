package de.tudarmstadt.ukp.exploration.graph_doc_explorer.webapp.application.configs;

import static org.junit.Assert.assertEquals;

import java.util.List;

import org.junit.Before;
import org.junit.Test;

import de.tudarmstadt.ukp.exploration.graph_doc_explorer.webapp.application.domains.Collection;

public class WebAppConfigurationTest {
	private WebAppConfiguration config;

	@Before
	public void setUp() throws Exception {
		config = WebAppConfiguration.getInstance();
	}

	/**
	 * Collections
	 */
	@Test
	public void testGetCollection() {
		Collection c = config.getCollection("collectionTest1");
		assertEquals(c.folder(), "/data/test1/");
	}

	@Test
	public void testGetCollections() {
		List<String> lc = config.getCollections();
		assertEquals(lc.size(), 2);
	}

	/**
	 * Solr Server URL
	 */
	@Test
	public void testSolrServerUrl() {
		assertEquals(config.solrServerUrl(), "http://localhost:8983/solr/documents");
	}
}
