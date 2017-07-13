package de.tudarmstadt.ukp.exploration.graph_doc_explorer.webapp.application.graph.parser;

public class SyntaxErrorException extends Exception {

	/**
	 * 
	 */
	private static final long serialVersionUID = 8022147874769647737L;

	protected String message;

	/**
	 * SyntaxErrors are thrown whenever a graph file's syntax is invalid.
	 * 
	 * @param currentLine
	 *            the line, where the error occured
	 * @param currentColumn
	 *            the column, where the error occured
	 * @param currentChar
	 *            the current character which caused the error
	 */
	public SyntaxErrorException(int currentLine, int currentColumn, char currentChar) {

		if (currentChar == '\t' || currentChar == '\n' || currentChar == '\r')
			message = "Invalid tab, newline or return character in line " + currentLine + ", column " + currentColumn
					+ ".\n";
		else
			message = "The graph contains an error in line " + currentLine + ", column " + currentColumn + ": "
					+ currentChar + "\n";
	}

	/*
	 * (non-Javadoc)
	 * 
	 * @see java.lang.Throwable#getLocalizedMessage()
	 */
	@Override
	public String getLocalizedMessage() {
		return message;
	}

	/*
	 * (non-Javadoc)
	 * 
	 * @see java.lang.Throwable#getMessage()
	 */
	@Override
	public String getMessage() {
		return message;
	}

	/*
	 * (non-Javadoc)
	 * 
	 * @see java.lang.Throwable#toString()
	 */
	@Override
	public String toString() {
		return message;
	}

}
