package de.tudarmstadt.ukp.exploration.graph_doc_explorer.webapp.application.search;

import java.io.IOException;
import java.util.ArrayList;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;

import org.apache.solr.client.solrj.SolrClient;
import org.apache.solr.client.solrj.SolrQuery;
import org.apache.solr.client.solrj.SolrServerException;
import org.apache.solr.client.solrj.impl.HttpSolrClient;
import org.apache.solr.client.solrj.response.QueryResponse;
import org.apache.solr.client.solrj.response.TermsResponse.Term;
import org.apache.solr.common.SolrDocument;
import org.apache.solr.common.SolrDocumentList;

import de.tudarmstadt.ukp.exploration.graph_doc_explorer.graphs.SearchResult;

/**
 * An implementation of the ISearcher interface using SolrJ Library
 * to perform queries and get results from the Solr server
 * 
 * @author Ramy Hcini
 * @since 20 Jan 2017
 * @version 1.9
 */
public class SolrSearch implements ISearcher {

	private static final String solrTextField = "dc_text";
	private static final String solrIdField = "name";
	private static final String solrGroupField = "groupID";
	private final int descriptionOffset = 300;
	private final int maxAnalyzedChars = 150000;
	private String urlString;

	@Override
	public void setUrl(String url) {
		urlString = url;
	}

	@Override
	public List<SearchResult> query(String keyword, String groupID) {
		try {
			SolrClient solr = new HttpSolrClient.Builder(urlString).build();

			SolrQuery query = new SolrQuery();
			query.set("fq", solrGroupField + ":" + groupID);
			query.set("df", solrTextField);
			query.set("rows", 1000);
			query.setQuery(keyword);

			query.setHighlight(true);
			query.set("hl.fl", solrTextField);
			query.setHighlightFragsize(descriptionOffset);
			query.set("hl.usePhraseHighlighter", true);
			query.set("hl.highlightMultiTerm", true);

			query.set("hl.maxAnalyzedChars", maxAnalyzedChars);

			query.setStart(0);
			query.set("defType", "edismax");

			// DEBUGGING
			System.out.println(query.toQueryString());

			QueryResponse response = solr.query(query);
			SolrDocumentList results = response.getResults();
			Map<String, Map<String, List<String>>> highlightings = response.getHighlighting();

			return convertSolrDocumentList(results, highlightings);

		} catch (SolrServerException | IOException e) {
			e.printStackTrace();
		}

		return null;
	}

	private List<SearchResult> convertSolrDocumentList(SolrDocumentList results,
			Map<String, Map<String, List<String>>> highlightings) {
		List<SearchResult> list = new LinkedList<SearchResult>();
		for (int i = 0; i < results.size(); ++i) {
			SolrDocument doc = results.get(i);

			// Seems to take the filename as id
			String id = (String) doc.get(solrIdField);

			String text = doc.getFirstValue(solrTextField).toString(); // Solr
																		// field
																		// is
			// _text_
			String highlight = "";

			if (highlightings.get(id) != null && highlightings.get(id).get(solrTextField) != null) {
				highlight = highlightings.get(id).get(solrTextField).get(0);
			}
			if (highlight.equals("")) {
				highlight = text.substring(0, text.indexOf(" ", descriptionOffset)); // get
																						// the
																						// whole
																						// last
																						// word
																						// in
																						// the
																						// description
			}

			list.add(new SearchResult(id, highlight, text));
		}

		return list;
	}

	@Override
	public List<String> groupIDs() {
		try {
			SolrClient solr = new HttpSolrClient.Builder(urlString).build();

			SolrQuery query = new SolrQuery();
			query.setTerms(true);
			query.set("terms.fl", solrGroupField);

			query.setStart(0);
			query.set("defType", "edismax");

			// DEBUGGING
			System.out.println(query.toQueryString());

			QueryResponse response = solr.query(query);
			List<Term> groups = response.getTermsResponse().getTerms(solrGroupField);
			List<String> ids = new ArrayList<String>();
			for (Term t : groups) {
				System.out.println(t.getTerm());
				ids.add(t.getTerm());
			}

			return ids;
		} catch (SolrServerException | IOException e) {
			e.printStackTrace();
		}

		return null;
	}

}
