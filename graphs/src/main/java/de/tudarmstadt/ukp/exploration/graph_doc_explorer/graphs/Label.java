package de.tudarmstadt.ukp.exploration.graph_doc_explorer.graphs;

import java.util.ArrayList;
import java.util.List;

/**
 * Domain class modeling the Label
 * 
 * @author Alexander Gössl, Arwed Gölz, Ramy Hcini, Sebastian Vollbrecht
 * @since 30 Jan 2017
 * @version 1.0
 */
public class Label {
	private String l;
	private List<Occurrence> occurrences;

	public Label(String _l, List<Occurrence> _occurrences) {
		l = _l;
		occurrences = _occurrences;
	}

	public Label(String _l) {
		l = _l;
		occurrences = new ArrayList<Occurrence>();
	}

	public String label() {
		return l;
	}

	public List<Occurrence> occurrences() {
		return occurrences;
	}
}
