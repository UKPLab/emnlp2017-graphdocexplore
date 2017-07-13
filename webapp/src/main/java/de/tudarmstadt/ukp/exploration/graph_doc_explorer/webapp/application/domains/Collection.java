package de.tudarmstadt.ukp.exploration.graph_doc_explorer.webapp.application.domains;

/**
 * A class representing the Collection
 * 
 * @author Alexander Gössl, Arwed Gölz, Ramy Hcini, Sebastian Vollbrecht
 * @since 30 Jan 2017
 * @version 1.2
 */
public class Collection {
	String name;
	String folder;
	String className;
	String params;

	public Collection(String _n, String _f, String _c, String _p) {
		name = _n;
		folder = _f;
		className = _c;
		params = _p;
		if (params == null)
			params = "";
	}

	public String name() {
		return name;
	}

	public String folder() {
		return folder;
	}

	public String className() {
		return className;
	}

	public String params() {
		return params;
	}

	public void setName(String n) {
		name = n;
	}

	public void setFolder(String f) {
		folder = f;
	}

	public void setClassName(String c) {
		className = c;
	}

	public void setParams(String p) {
		params = p;
	}

}
