package de.tudarmstadt.ukp.exploration.graph_doc_explorer.graph_ne_impl;

import java.io.File;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

import org.apache.commons.io.FileUtils;

import de.tudarmstadt.ukp.exploration.graph_doc_explorer.graphs.Graph;
import de.tudarmstadt.ukp.exploration.graph_doc_explorer.graphs.IGraphGenerator;
import de.tudarmstadt.ukp.exploration.graph_doc_explorer.graphs.SearchResult;
import de.tudarmstadt.ukp.exploration.graph_doc_explorer.graphs_ne_impl.StaticEntityGraph;

public class Test {

	public static void main(String[] args) {

		String collection = "enron_persons\\";

		// create search results for test
		List<SearchResult> results = new ArrayList<SearchResult>();
		File folder = new File("..\\webapp\\src\\main\\resources\\data\\" + collection);
		for (File f : folder.listFiles()) {
			if (f.getName().matches(".*txt")) {
				try {
					String text = FileUtils.readFileToString(f, "utf-8");
					SearchResult doc = new SearchResult(f.getName().substring(0, f.getName().lastIndexOf('.')), "",
							text);
					results.add(doc);
				} catch (IOException e) {
					e.printStackTrace();
				}
			}
		}
		System.out.println("docs: " + results.size());

		// call the interface
		IGraphGenerator generator = new StaticEntityGraph();
		String[] params = { "PERSON", "99999", "99999", "3" };
		generator.initialize(results,
				"C:\\Users\\falke\\EclipseWorkspace\\graph-doc-explorer\\webapp\\src\\main\\resources\\data\\"
						+ collection,
				params);

		Graph graph = generator.getGraph();

		System.out.println("nodes: " + graph.nodes().size());
		System.out.println("edges: " + graph.edges().size());

	}

}
