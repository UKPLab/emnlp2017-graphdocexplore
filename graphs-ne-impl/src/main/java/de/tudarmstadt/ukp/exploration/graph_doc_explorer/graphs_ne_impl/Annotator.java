package de.tudarmstadt.ukp.exploration.graph_doc_explorer.graphs_ne_impl;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;
import java.util.Queue;
import java.util.Set;

import org.apache.uima.analysis_engine.AnalysisEngineProcessException;
import org.apache.uima.fit.component.JCasConsumer_ImplBase;
import org.apache.uima.fit.util.JCasUtil;
import org.apache.uima.jcas.JCas;

import de.tudarmstadt.ukp.dkpro.core.api.metadata.type.DocumentMetaData;
import de.tudarmstadt.ukp.dkpro.core.api.ner.type.NamedEntity;
import de.tudarmstadt.ukp.dkpro.core.api.segmentation.type.Sentence;
import de.tudarmstadt.ukp.exploration.graph_doc_explorer.graphs.GraphEdge;
import de.tudarmstadt.ukp.exploration.graph_doc_explorer.graphs.GraphNode;
import de.tudarmstadt.ukp.exploration.graph_doc_explorer.graphs.Label;
import de.tudarmstadt.ukp.exploration.graph_doc_explorer.graphs.Occurrence;

/**
 * UIMA CAS consumer that builds a graph based on named entity annotations
 * 
 * @author falke
 *
 */
public class Annotator extends JCasConsumer_ImplBase {

	// type of named entity
	public String type = "ORGANIZATION";
	// co-occurrence window size
	public int windowSize = 3;
	// maximum distance for edge
	public int maxDist = 50;
	// minimum occurrences for entity
	public int minOcc = 5;

	public static int nextId = 0;

	public List<GraphNode> nodes;
	public List<GraphEdge> edges;

	public Annotator(String type, int window, int maxDist, int minOcc) {
		this.nodes = new ArrayList<GraphNode>();
		this.edges = new ArrayList<GraphEdge>();
		this.type = type;
		this.windowSize = window;
		this.minOcc = minOcc;
		this.maxDist = maxDist;
	}

	public List<GraphNode> getNodes() {
		return this.nodes;
	}

	public List<GraphEdge> getEdges() {
		return this.edges;
	}

	/**
	 * process single document and collect NE annotations
	 * 
	 * @param aJCas
	 * @throws AnalysisEngineProcessException
	 */
	@Override
	public void process(JCas aJCas) throws AnalysisEngineProcessException {

		DocumentMetaData meta = (DocumentMetaData) aJCas.getDocumentAnnotationFs();
		String doc = meta.getDocumentId();

		Queue<GraphNode> window = new LinkedList<GraphNode>();
		for (Sentence s : JCasUtil.select(aJCas, Sentence.class)) {

			for (NamedEntity ne : JCasUtil.selectCovered(NamedEntity.class, s)) {
				if (!ne.getValue().equals(type))
					continue;

				String label = ne.getCoveredText().replaceAll("\n", " ").replaceAll("\\s+", " ");
				Occurrence occ = new Occurrence(ne.getBegin(), ne.getEnd(), doc.substring(0, doc.lastIndexOf('.')));
				List<Occurrence> occs = new ArrayList<Occurrence>();
				occs.add(occ);
				GraphNode n = new GraphNode(Integer.toString(nextId++), label, occs);
				nodes.add(n);

				for (GraphNode nb : window) {
					if (n.label().occurrences().get(0).begin() - nb.label().occurrences().get(0).end() < maxDist) {
						GraphEdge e = new GraphEdge(nb, n, new Label(""));
						edges.add(e);
					}
				}
				window.add(n);
				if (window.size() > windowSize)
					window.remove();
			}

		}
		window.clear();

	}

	/**
	 * build graph from collected NE annotations
	 * 
	 */
	@Override
	public void collectionProcessComplete() {

		Map<GraphNode, GraphNode> merged = new HashMap<GraphNode, GraphNode>();
		Set<GraphNode> remove = new HashSet<GraphNode>();
		for (int i = 0; i < nodes.size(); i++) {
			GraphNode n = nodes.get(i);
			if (!remove.contains(n)) {
				for (int j = i + 1; j < nodes.size(); j++) {
					GraphNode no = nodes.get(j);
					if (!remove.contains(no)) {
						String l1 = n.label().label().toLowerCase();
						String l2 = no.label().label().toLowerCase();
						if (l1.equals(l2)) {
							n.label().occurrences().addAll(no.label().occurrences());
							remove.add(no);
							merged.put(no, n);
						}
					}
				}
			}
		}
		nodes.removeAll(remove);

		Set<GraphNode> filtered = new HashSet<GraphNode>();
		for (GraphNode n : nodes)
			if (n.label().occurrences().size() < minOcc)
				filtered.add(n);
		nodes.removeAll(filtered);

		Set<GraphEdge> set = new HashSet<GraphEdge>();
		Set<String> ids = new HashSet<String>();
		for (GraphEdge e : edges) {
			if (remove.contains(e.getSource()))
				e.setSource(merged.get(e.getSource()));
			if (remove.contains(e.getTarget()))
				e.setTarget(merged.get(e.getTarget()));
			String id1 = e.getSource().id() + "_" + e.getTarget().id();
			String id2 = e.getTarget().id() + "_" + e.getSource().id();
			if (nodes.contains(e.getSource()) && nodes.contains(e.getTarget()) && e.getSource() != e.getTarget()
					&& !ids.contains(id1) && !ids.contains(id2)) {
				set.add(e);
				ids.add(id1);
				ids.add(id2);
			}
		}
		edges.clear();
		edges.addAll(set);
	}

}
