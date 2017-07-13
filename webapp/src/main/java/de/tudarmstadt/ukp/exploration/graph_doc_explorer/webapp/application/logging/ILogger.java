package de.tudarmstadt.ukp.exploration.graph_doc_explorer.webapp.application.logging;

import java.util.List;

import de.tudarmstadt.ukp.exploration.graph_doc_explorer.graphs.LogEntry;
import de.tudarmstadt.ukp.exploration.graph_doc_explorer.graphs.SearchResult;

/**
 * Interface for the logger that can be used in the application.
 * Goal is to enable the clients to further develop and extend the application
 * 
 * @author Alexander Gössl, Arwed Gölz, Ramy Hcini, Sebastian Vollbrecht
 * @since 20 Jan 2017
 * @version 1.2
 */
public interface ILogger {

	/**
	 * Logs a query performed by the user with the given user_id
	 * 
	 * @param keyword
	 *            the keyword the user entered into the search field
	 * @param user_id
	 *            the user's id or the session id
	 * @param results
	 *            the documents the application deems relevant
	 */
	public LogEntry logQuery(String keyword, String user_id, List<SearchResult> results);

	/**
	 * Logs a node click performed by the user with the given user_id
	 * 
	 * @param user_id
	 * @param node_id
	 */
	public LogEntry logNodeClick(String user_id, String node_id);

	/**
	 * Logs a edge click performed by the user with the given user_id
	 * 
	 * @param user_id
	 * @param edge_id
	 */
	public LogEntry logEdgeClick(String user_id, String edge_id);

	/**
	 * Logs the view document action performed by the user with the given
	 * user_id
	 * 
	 * @param user_id
	 * @param document_id
	 */
	public LogEntry logViewDocument(String user_id, String document_id);

	/**
	 * Logs the back to results action performed by the user with the given
	 * user_id
	 * 
	 * @param user_id
	 * @param keyword
	 *            the current keyword
	 */
	public LogEntry logBackToResults(String user_id, String keyword);

	/**
	 * Logs a click on the centered node (adds tag to the header line)
	 * 
	 * @param user_id
	 * @param node_id
	 */
	public LogEntry logTagAdded(String user_id, String node_id);

	/**
	 * Logs a click on the "x" included in each tag symbol
	 * 
	 * @param user_id
	 * @param node_id
	 */
	public LogEntry logTagDeleted(String user_id, String node_id);

	/**
	 * Logs a click on an inactive tag
	 * 
	 * @param user_id
	 * @param node_id
	 */
	public LogEntry logTagActivated(String user_id, String node_id);

	/**
	 * Logs a click on an active tag
	 * 
	 * @param user_id
	 * @param node_id
	 */
	public LogEntry logTagDeactivated(String user_id, String node_id);

	/**
	 * Logs a switch of the graph layout
	 * 
	 * @param user_id
	 * @param layout_name
	 *            the name of the graph layout the user switched to
	 */
	public LogEntry logGraphLayoutSwitched(String user_id, String layout_name);

	/**
	 * Logs the activation of searchword highlighting
	 * 
	 * @param user_id
	 */
	public LogEntry logSearchwordHighlightingActivated(String user_id);

	/**
	 * Logs the deactivation of searchword highlighting
	 * 
	 * @param user_id
	 */
	public LogEntry logSearchwordHighlightingDeactivated(String user_id);

	/**
	 * Logs the scroll action in a document or in the search result List.
	 * The viewable part of the document is approximated.
	 * 
	 * @param user_id
	 * @param isDocumentScrollEvent
	 *            <b>true</b> if the event is a document scroll event,
	 *            <b>false</b> if the event is a search result list scroll
	 *            event.
	 * @param label
	 *            the start and end position of the viewable part when scrolling
	 *            a document or the visible documents' title when scrolling the
	 *            search result list
	 */
	public LogEntry logScroll(String user_id, boolean isDocumentScrollEvent, String label);

	/**
	 * Logs a node centering action.
	 * 
	 * @param user_id
	 * @param label
	 *            the log message containing the node id which belongs to the
	 *            centered node
	 * @param visibleNodes
	 *            the node ids corresponding to the graph nodes which are
	 *            currently visible
	 */
	public LogEntry logNodeCentered(String user_id, String label, String visibleNodes);

	/**
	 * Logs an edge centering action.
	 * 
	 * @param user_id
	 * @param label
	 *            the log message containing the edge id which belongs to the
	 *            centered edge
	 * @param visibleNodes
	 *            the node ids corresponding to the graph nodes which are
	 *            currently visible
	 */
	public LogEntry logEdgeCentered(String user_id, String label, String visibleNodes);

	/**
	 * Logs a node dragging event.
	 * 
	 * @param user_id
	 * @param label
	 *            the log message containing the dragged node's id
	 * @param visibleNodes
	 *            the node ids corresponding to the graph nodes which are
	 *            currently visible
	 */
	public LogEntry logNodeDragEvent(String user_id, String label, String visibleNodes);

	/**
	 * Logs a pan event. The log entry itself contains the node ids
	 * corresponding to the nodes which are visible post-pan.
	 * 
	 * @param user_id
	 * @param label
	 *            the log message containing the visible nodes' ids
	 */
	public LogEntry logPanEvent(String user_id, String label);

	/**
	 * Logs a zoom event. The log entry itself contains the node ids
	 * corresponding to the nodes which are visible post-zoom.
	 * 
	 * @param user_id
	 * @param label
	 *            the log message containing the visible nodes' ids
	 */
	public LogEntry logZoomEvent(String user_id, String label);

	/**
	 * System logs section: log the errors/exceptions
	 * 
	 * @param error
	 */
	public void logSystemError(String error);

	/**
	 * System logs section: log all the actions performed by the user
	 * 
	 * @param msg
	 */
	public void logSystem(String msg);
}
