package de.tudarmstadt.ukp.exploration.graph_doc_explorer.graphs;

/**
 * Class that models the occurences of a label node in the documents
 * 
 * @author Alexander Gössl, Arwed Gölz, Ramy Hcini, Sebastian Vollbrecht
 * @since 20 Jan 2017
 * @version 1.2
 */

public class Occurrence {
	private int begin;
	private int end;
	private String docID;

	/**
	 * The ONE AND ONLY usable contructor
	 * 
	 * @param _begin
	 *            the begin of the occurence in the document
	 * @param _end
	 *            the end of the occurence in the document
	 * @param _doc
	 *            the document ID
	 */
	public Occurrence(int _begin, int _end, String _doc) {
		begin = _begin;
		end = _end;
		docID = _doc;
	}

	public int begin() {
		return begin;
	}

	public int end() {
		return end;
	}

	public String docID() {
		return docID;
	}
}
