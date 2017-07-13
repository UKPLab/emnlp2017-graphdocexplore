package de.tudarmstadt.ukp.exploration.graph_doc_explorer.webapp.application.search;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.LinkedList;
import java.util.List;

import de.tudarmstadt.ukp.exploration.graph_doc_explorer.graphs.SearchResult;

/**
 * Pseudo search implementation of the ISearcher interface
 * 
 * @author Alexander Gössl, Arwed Gölz, Ramy Hcini, Sebastian Vollbrecht
 */
public class PseudoSearch implements ISearcher {

	private LinkedList<SearchResult> res;

	public PseudoSearch() {
	}

	/**
	 * Creates a new PseudoSearch instance
	 * 
	 * @param st
	 *            The string to search for
	 * @param sr
	 *            The list to store the search results
	 */
	public PseudoSearch(String st, LinkedList<SearchResult> sr) {
		res = sr;
		File file = new File("./src/test/resources/de/tu_darmstadt/bp/gruppe31/graph/persons2.graph");

		try {
			InputStreamReader reader = new InputStreamReader(new FileInputStream(file), StandardCharsets.UTF_8);
			BufferedReader bf = new BufferedReader(reader);

			while (bf.ready()) {
				String line = bf.readLine();
				if (line != null && line.contains(st)) {
					res.add(new SearchResult(line, null, null));
				}
			}
			bf.close();

		} catch (FileNotFoundException e) {
			res.add(new SearchResult("404 Not Found", null, null));
			e.printStackTrace();
		} catch (IOException e) {
			res.add(new SearchResult("404 Not Found", null, null));
			e.printStackTrace();
		}

	}

	@Override
	public LinkedList<SearchResult> query(String keyword, String groupID) {
		File file = new File("./src/test/resources/de/tu_darmstadt/bp/gruppe31/graph/persons2.graph");

		try {
			InputStreamReader reader = new InputStreamReader(new FileInputStream(file), StandardCharsets.UTF_8);
			BufferedReader bf = new BufferedReader(reader);

			while (bf.ready()) {
				String line = bf.readLine();
				if (line != null && line.contains(keyword)) {
					res.add(new SearchResult(line, null, null));
				}
			}
			bf.close();

		} catch (FileNotFoundException e) {
			res.add(new SearchResult("404 Not Found", null, null));
			e.printStackTrace();
		} catch (IOException e) {
			res.add(new SearchResult("404 Not Found", null, null));
			e.printStackTrace();
		}
		return res;
	}

	@Override
	public List<String> groupIDs() {
		// TODO Auto-generated method stub
		return null;
	}

	@Override
	public void setUrl(String url) {
		// TODO Auto-generated method stub

	}
}
