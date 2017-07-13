package de.tudarmstadt.ukp.exploration.graph_doc_explorer.webapp.application.graph;

import java.util.HashMap;
import java.util.Map;

import de.tudarmstadt.ukp.exploration.graph_doc_explorer.graphs.IGraphGenerator;

public class GeneratorsContainer {

	static private Map<String, IGraphGenerator> generators = new HashMap<String, IGraphGenerator>();

	public static void put(String id, IGraphGenerator g) {
		generators.put(id, g);
	}

	public static IGraphGenerator get(String id) {
		System.out.println(generators.get(id));
		return generators.get(id);
	}

	public static boolean have(String id) {
		return generators.containsKey(id);
	}

	public static void remove(String id) {
		generators.remove(id);
	}
}
