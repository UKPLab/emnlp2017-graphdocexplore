package de.tudarmstadt.ukp.exploration.graph_doc_explorer.graphs_ne_impl;

import java.io.File;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.apache.uima.UIMAException;
import org.apache.uima.jcas.JCas;

import de.tudarmstadt.ukp.exploration.graph_doc_explorer.graphs.Graph;
import de.tudarmstadt.ukp.exploration.graph_doc_explorer.graphs.GraphEdge;
import de.tudarmstadt.ukp.exploration.graph_doc_explorer.graphs.GraphNode;
import de.tudarmstadt.ukp.exploration.graph_doc_explorer.graphs.IGraphGenerator;
import de.tudarmstadt.ukp.exploration.graph_doc_explorer.graphs.LogEntry;
import de.tudarmstadt.ukp.exploration.graph_doc_explorer.graphs.SearchResult;
import de.tudarmstadt.ukp.exploration.graph_doc_explorer.graphs.UpdateQueue;
import edu.stanford.nlp.util.StringUtils;

/**
 * Test implementation of graph generator interface - dynamic
 * see static example for details
 * 
 * added graph manipulation based on user interaction
 * 
 * @author falke
 *
 */
public class DynamicEntityGraph implements IGraphGenerator {

	protected List<GraphNode> allNodes;
	protected List<GraphEdge> allEdges;
	protected Map<GraphNode, Set<String>> neighbours;
	protected Map<GraphNode, Double> nodeWeights;
	protected int size;

	@Override
	public void initialize(List<SearchResult> searchResults, String folder, String[] args) {
		System.out.println("init: " + this.getClass().getSimpleName() + " " + StringUtils.join(args, " "));

		// init
		if (args.length != 5)
			throw new IllegalArgumentException();
		Annotator nerGraph = new Annotator(args[0], Integer.parseInt(args[1]), Integer.parseInt(args[2]),
				Integer.parseInt(args[3]));

		this.size = Integer.parseInt(args[4]);
		this.allNodes = new ArrayList<GraphNode>();
		this.allEdges = new ArrayList<GraphEdge>();
		this.neighbours = new HashMap<GraphNode, Set<String>>();
		this.nodeWeights = new HashMap<GraphNode, Double>();

		// create full entity graph
		JCas jCas = UimaUtil.createEmptyCas();
		for (SearchResult doc : searchResults) {
			try {
				File binFile = null;
				if (folder.startsWith("C:"))
					binFile = new File(folder + doc.id() + ".txt.bin6");
				else
					binFile = new File(this.getClass().getResource(folder + doc.id() + ".txt.bin6").getPath());
				jCas = UimaUtil.readBinCas(binFile, jCas);
				nerGraph.process(jCas);
			} catch (UIMAException e) {
				e.printStackTrace();
			}
		}
		nerGraph.collectionProcessComplete();

		// collect results and compute node degrees
		for (GraphNode node : nerGraph.getNodes()) {
			this.allNodes.add(node);
			this.neighbours.put(node, new HashSet<String>());
			this.nodeWeights.put(node, 0.0);
		}
		for (GraphEdge edge : nerGraph.getEdges()) {
			this.allEdges.add(edge);
			this.neighbours.get(edge.getSource()).add(edge.getTarget().id());
			this.neighbours.get(edge.getTarget()).add(edge.getSource().id());
			this.nodeWeights.merge(edge.getSource(), 1.0, Double::sum);
			this.nodeWeights.merge(edge.getTarget(), 1.0, Double::sum);
		}

		// normalize
		double max = this.nodeWeights.values().stream().mapToDouble(x -> x).max().getAsDouble();
		this.nodeWeights.replaceAll((k, v) -> v / max);
	}

	@Override
	public void addUserAction(LogEntry userAction) {
		switch (userAction.getAction()) {
		case NODE_CLICKED:

			String nodeId = userAction.getMessage().trim();

			for (GraphNode node : this.allNodes) {
				double w = nodeWeights.get(node);
				if (node.id().equals(nodeId))
					nodeWeights.put(node, Math.min(1, w + 1));
				else if (this.neighbours.get(node).contains(nodeId))
					nodeWeights.put(node, Math.min(1, w + 0.3));
				else
					nodeWeights.put(node, Math.max(0, w - 0.2));
			}

			UpdateQueue.add(userAction.getUserID() + "_" + userAction.getCollectionID());

			break;

		default:
			// none
		}
	}

	@Override
	public Graph getGraph() {

		Graph g = new Graph();
		g.setDirected(false);

		final Map<GraphNode, Double> w = this.nodeWeights;
		Collections.sort(this.allNodes, new Comparator<GraphNode>() {
			@Override
			public int compare(GraphNode n1, GraphNode n2) {
				return Double.compare(w.get(n2), w.get(n1));
			}
		});

		Set<GraphNode> nodes = new HashSet<GraphNode>();
		for (GraphNode n : this.allNodes.subList(0, Math.min(this.size, this.allNodes.size()))) {
			System.out.println(n.label().label() + " " + w.get(n));
			g.addNode(n);
			nodes.add(n);
		}
		System.out.println("nodes: " + g.nodes().size());

		for (GraphEdge e : this.allEdges) {
			if (nodes.contains(e.getSource()) && nodes.contains(e.getTarget()))
				g.addEdge(e);
		}
		System.out.println("edges: " + g.edges().size());

		return g;
	}

}
