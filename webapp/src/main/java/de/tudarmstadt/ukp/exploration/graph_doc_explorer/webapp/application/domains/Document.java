package de.tudarmstadt.ukp.exploration.graph_doc_explorer.webapp.application.domains;

/**
 * A domain class for the text document
 * 
 * @author Alexander Gössl, Arwed Gölz, Ramy Hcini, Sebastian Vollbrecht
 * @since 20 Jan 2017
 * @version 1.0
 */

public class Document {
	private String id;
	private String text;
	private Collection collection;

	public Document(String _id, String _text, Collection _collection) {
		id = _id;
		text = _text;
		collection = _collection;
	}

	public String id() {
		return id;
	}

	public String text() {
		return text;
	}

	public Collection collection() {
		return collection;
	}
}
