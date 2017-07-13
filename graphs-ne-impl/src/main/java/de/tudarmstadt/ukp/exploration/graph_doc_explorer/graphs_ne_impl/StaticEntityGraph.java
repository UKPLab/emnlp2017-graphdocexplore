package de.tudarmstadt.ukp.exploration.graph_doc_explorer.graphs_ne_impl;

import java.io.File;
import java.util.List;

import org.apache.uima.UIMAException;
import org.apache.uima.jcas.JCas;

import de.tudarmstadt.ukp.exploration.graph_doc_explorer.graphs.Graph;
import de.tudarmstadt.ukp.exploration.graph_doc_explorer.graphs.GraphEdge;
import de.tudarmstadt.ukp.exploration.graph_doc_explorer.graphs.GraphNode;
import de.tudarmstadt.ukp.exploration.graph_doc_explorer.graphs.IGraphGenerator;
import de.tudarmstadt.ukp.exploration.graph_doc_explorer.graphs.LogEntry;
import de.tudarmstadt.ukp.exploration.graph_doc_explorer.graphs.SearchResult;
import edu.stanford.nlp.util.StringUtils;

/**
 * Creates a static graph based on entities found the in the documents
 * - relations are not labeled
 * 
 * needs access to a folder containing prepared *.bin6 files
 * created with PipelinePreprocessing for a document collection
 * 
 * @author falke
 *
 */
public class StaticEntityGraph implements IGraphGenerator {

	protected Graph graph;

	@Override
	public void initialize(List<SearchResult> searchResults, String folder, String[] args) {
		System.out.println("init: " + this.getClass().getSimpleName() + " " + StringUtils.join(args, " "));

		if (args.length != 4)
			throw new IllegalArgumentException();
		Annotator nerGraph = new Annotator(args[0], Integer.parseInt(args[1]), Integer.parseInt(args[2]),
				Integer.parseInt(args[3]));

		this.graph = new Graph();
		this.graph.setDirected(false);

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

		for (GraphNode node : nerGraph.getNodes())
			this.graph.addNode(node);
		for (GraphEdge edge : nerGraph.getEdges())
			this.graph.addEdge(edge);
	}

	@Override
	public void addUserAction(LogEntry userAction) {

	}

	@Override
	public Graph getGraph() {
		return this.graph;
	}

}
