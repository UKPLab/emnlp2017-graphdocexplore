package de.tudarmstadt.ukp.exploration.graph_doc_explorer.graphs;

import java.util.Date;

/**
 * Class modeling one log entry in the log file for user actions
 * 
 * @author Alexander Gössl, Arwed Gölz, Ramy Hcini, Sebastian Vollbrecht
 */
public class LogEntry {

	public final static String NO_RESULTS = "NO_RESULTS";

	private Date date;
	private String user_id;
	private String collection_id;
	private UserAction action;
	private String message;

	private boolean isUserActionEntry;

	/**
	 * Create a new instance of log entry, thereby creating one new line in the
	 * log
	 * 
	 * @param user_id
	 *            The ID of the user causing this entry
	 * @param action
	 *            The user action causing this entry
	 * @param message
	 *            A string describing what was done
	 */
	public LogEntry(String user_id, UserAction action, String message) {
		this.date = new Date();
		this.user_id = user_id;
		this.action = action;
		this.message = message;

		isUserActionEntry = true;
	}

	public UserAction getAction() {
		return action;
	}

	public String getMessage() {
		return message;
	}

	public String getUserID() {
		return user_id;
	}

	public String getCollectionID() {
		return collection_id;
	}

	public void setCollection(String c) {
		collection_id = c;
	}

	@Override
	public String toString() {
		if (isUserActionEntry) {
			return date + "," + user_id + "," + action + "," + message;
		} else {
			return date + "," + user_id + "," + message;
		}
	}
}
