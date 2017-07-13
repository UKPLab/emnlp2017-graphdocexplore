package de.tudarmstadt.ukp.exploration.graph_doc_explorer.webapp.application.graph.parser;

import java.io.EOFException;
import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.LinkedList;
import java.util.List;

import de.tudarmstadt.ukp.exploration.graph_doc_explorer.graphs.Graph;
import de.tudarmstadt.ukp.exploration.graph_doc_explorer.graphs.GraphEdge;
import de.tudarmstadt.ukp.exploration.graph_doc_explorer.graphs.GraphNode;
import de.tudarmstadt.ukp.exploration.graph_doc_explorer.graphs.Label;
import de.tudarmstadt.ukp.exploration.graph_doc_explorer.graphs.Occurrence;

/**
 * A class modeling how a DataParser is supposed to be implemented
 * 
 * @author Alexander Gössl, Arwed Gölz, Ramy Hcini, Sebastian Vollbrecht
 *
 */
@SuppressWarnings("deprecation")
public final class SampleDataParser implements IGraphParser {

	private InputStreamReader reader;
	private Character currentChar;

	private boolean isVerbose = true;

	/**
	 * count how many nodes were parsed
	 */
	private int parsedNodes = 0;

	/**
	 * count how many edges were parsed
	 */
	private int parsedEdges = 0;

	/**
	 * for better error readability
	 */
	private int currentLine = 1;
	private int currentColumn = -1;

	/**
	 * the graph which is built during parsing
	 */
	private Graph graph;

	/**
	 * maps node IDs to their respective nodes for easy access
	 */
	private HashMap<Integer, GraphNode> idToNode;

	private String src = "/graph/org.graph";

	public void setSrc(String s) {
		src = s;
	}

	/**
	 * Returns the file's next character.
	 * 
	 * @return the file's next character
	 * @throws IOException
	 */
	private Character acceptIt() throws IOException {
		currentColumn++;
		int c = reader.read();
		if (c == -1)
			throw new EOFException();
		currentChar = (char) c;
		return currentChar;
	}

	/**
	 * Reads line separators and handles their effects.
	 * 
	 * @return the next character in the file
	 */
	private Character readEndOfLine() {

		try {
			// windows...
			if (currentChar == '\r')
				currentChar = (char) reader.read();
			if (currentChar == '\n') {
				currentLine++;
				currentColumn = 0;
			}
			currentChar = (char) reader.read();
			return currentChar;

		} catch (IOException e) {
			e.printStackTrace();
		}
		return null;
	}

	/**
	 * Returns the file's next character after checking an expected character
	 * against the current character.
	 * 
	 * @param c
	 *            the expected character
	 * @throws SyntaxErrorException
	 *             if the expected character does not match the current
	 *             character
	 * @throws IOException
	 */
	private void accept(Character c) throws SyntaxErrorException, IOException {
		if (!currentChar.equals(c))
			throw new SyntaxErrorException(currentLine, currentColumn, currentChar);
		else
			acceptIt();

	}

	/**
	 * Parses a graph node.
	 * 
	 * @throws SyntaxErrorException
	 *             if the line does not contain proper syntax for a node
	 *             definition
	 * @throws IOException
	 */
	private void parseNode() throws SyntaxErrorException, IOException {

		// the node's id
		int ID = parseNumber();
		accept('\t');

		// the node's label
		String name = parseLabel();

		accept('\t');

		// the file names in which the node is somehow relevant
		List<Occurrence> fileNames = parseOccurrences();
		Label label = new Label(name, fileNames);
		GraphNode node = new GraphNode(String.valueOf(ID), label);
		idToNode.put(ID, node);
		graph.addNode(node);
		parsedNodes++;

	}

	/**
	 * Parses a graph edge.
	 * 
	 * @throws SyntaxErrorException
	 *             if the line does not contain proper syntax for an edge
	 *             definition
	 * @throws IOException
	 */
	private void parseEdge() throws SyntaxErrorException, IOException {

		int sourceID = -1, targetID = -1;
		String name = null;
		List<Occurrence> occurences = null;
		try {
			sourceID = parseNumber();
			accept('\t');
			targetID = parseNumber();
			accept('\t');
			name = parseLabel();
			accept('\t');
			occurences = parseOccurrences();
		} catch (EOFException e) {
		}

		Label label = new Label(name, occurences);
		GraphNode sourceNode = idToNode.get(sourceID);
		GraphNode targetNode = idToNode.get(targetID);

		// the graph file contains some edges that havn't associated nodes
		// in
		// the same graph
		// Ex: org.graph in the example1, there "658 954 is related to" but
		// node
		// 658 doesn't exist
		if (sourceNode != null && targetNode != null) {
			graph.addEdge(new GraphEdge(sourceNode, targetNode, label));
			parsedEdges++;
		}
	}

	/**
	 * Parses a single, positive integer number.
	 * 
	 * @return the parsed number
	 * @throws IOException
	 */
	private int parseNumber() throws IOException {

		StringBuilder sb = new StringBuilder();

		while (currentChar >= '0' && currentChar <= '9') {
			sb.append(currentChar);
			acceptIt();
		}

		return Integer.parseInt(sb.toString());

	}

	/**
	 * Parses a label, consisting of many different types of characters.
	 *
	 * @return the edge's or node's label
	 * @throws IOException
	 */
	private String parseLabel() throws IOException {

		StringBuilder sb = new StringBuilder();

		// almost every character needs to be allowed.. umlauts, underscores,
		// numbers, ...
		while (currentChar != '\t' && currentChar != '\r' && currentChar != '\n') {
			sb.append(currentChar);
			acceptIt();
		}

		return sb.toString();

	}

	/**
	 * Parses the entire occurrences definition by calling
	 * {@link #parseOccurrence() parseOccurence} several times.
	 * 
	 * @throws SyntaxErrorException
	 *             when the definition's syntax of an occurrence is invalid.
	 * @throws IOException
	 */
	private List<Occurrence> parseOccurrences() throws SyntaxErrorException, IOException {

		List<Occurrence> fileNames = new LinkedList<Occurrence>();

		// only parse occurrences if the current line does not end here
		if (currentChar != '\r' && currentChar != '\n') {
			fileNames.add(parseOccurrence());
			while (currentChar == '|') {
				accept('|');
				fileNames.add(parseOccurrence());
			}
		}
		readEndOfLine();
		return fileNames;
	}

	/**
	 * Parses a single occurrence's definition.
	 * 
	 * @throws SyntaxErrorException
	 *             when the definition's syntax of the occurrence is invalid
	 * @throws IOException
	 */
	private Occurrence parseOccurrence() throws SyntaxErrorException, IOException {

		StringBuilder sb = new StringBuilder();

		while (currentChar != ';') {
			sb.append(currentChar);
			acceptIt();
		}

		accept(';');
		int begin = parseNumber();
		accept(';');
		int end = parseNumber();

		return new Occurrence(begin, end, sb.toString());
	}

	public void setVerbose(boolean verbose) {
		isVerbose = verbose;
	}

	@Override
	public Graph getGraph() {
		return graph;
	}

	@Override
	public boolean parse() {
		try {
			System.out.println(this.src);
			File path = new File(this.getClass().getResource(src).getPath());
			reader = new InputStreamReader(new FileInputStream(path), StandardCharsets.UTF_8);

			graph = new Graph();
			idToNode = new HashMap<Integer, GraphNode>();

			currentChar = (char) reader.read();

			// every graph seems to start with the keyword 'nodes'
			accept('n');
			accept('o');
			accept('d');
			accept('e');
			accept('s');
			readEndOfLine();

			// parse nodes as long as the current line begins with a number
			while (currentChar >= '0' && currentChar <= '9')
				parseNode();

			accept('e');
			accept('d');
			accept('g');
			accept('e');
			accept('s');
			readEndOfLine();

			// parse edges until the EOF is reached
			while (reader.ready())
				parseEdge();

			// done reading
			reader.close();

			if (isVerbose)
				System.out.println(
						"Parsed graph successfully.\nNodes parsed: " + parsedNodes + "\nEdges parsed: " + parsedEdges);

			return true;

		} catch (EOFException e) {
			if (reader != null)
				try {
					reader.close();
				} catch (IOException e1) {
					e1.printStackTrace();
				}
			return true;
		} catch (SyntaxErrorException e) {
			e.printStackTrace();
			return false;

		} catch (IOException e) {
			e.printStackTrace();
			return false;
		}
	}

}
