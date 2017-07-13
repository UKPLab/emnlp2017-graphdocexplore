package de.tudarmstadt.ukp.exploration.graph_doc_explorer.webapp.application.logging;

import java.util.List;

import org.apache.logging.log4j.Level;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;

import de.tudarmstadt.ukp.exploration.graph_doc_explorer.graphs.LogEntry;
import de.tudarmstadt.ukp.exploration.graph_doc_explorer.graphs.SearchResult;
import de.tudarmstadt.ukp.exploration.graph_doc_explorer.graphs.UserAction;

/**
 * Implementation of the ILogger interface using the log4j library
 * 
 * @author Ramy Hcini, Arwed Goelz
 * @since 20 Jan 2017
 * @version 1.4
 */
public class Log4jLogger implements ILogger {

	private static final Logger logger = LogManager.getLogger(Log4jLogger.class);

	@Override
	public LogEntry logQuery(String keyword, String user_id, List<SearchResult> results) {

		// build log string
		StringBuilder logString = new StringBuilder();
		logString.append(keyword);
		logString.append(',');
		if (results.size() == 0) {
			logString.append(LogEntry.NO_RESULTS);
		} else {
			for (SearchResult result : results) {
				logString.append(result.id());
				logString.append(';');
			}
		}
		LogEntry logEntry = new LogEntry(user_id, UserAction.SEARCH_ACTION, logString.toString());
		logger.log(Level.getLevel("USER_ACTION"), logEntry);
		return logEntry;
	}

	@Override
	public LogEntry logBackToResults(String user_id, String keyword) {
		LogEntry logEntry = new LogEntry(user_id, UserAction.BACK_TO_RESULTS, keyword);
		logger.log(Level.getLevel("USER_ACTION"), logEntry);
		return logEntry;
	}

	@Override
	public LogEntry logNodeClick(String user_id, String node_id) {
		LogEntry logEntry = new LogEntry(user_id, UserAction.NODE_CLICKED, node_id);
		logger.log(Level.getLevel("USER_ACTION"), logEntry);
		return logEntry;
	}

	@Override
	public LogEntry logEdgeClick(String user_id, String edge_id) {
		LogEntry logEntry = new LogEntry(user_id, UserAction.EDGE_CLICKED, edge_id);
		logger.log(Level.getLevel("USER_ACTION"), logEntry);
		return logEntry;
	}

	@Override
	public LogEntry logTagAdded(String user_id, String node_id) {
		LogEntry logEntry = new LogEntry(user_id, UserAction.TAG_ADDED, node_id);
		logger.log(Level.getLevel("USER_ACTION"), logEntry);
		return logEntry;
	}

	@Override
	public LogEntry logTagDeleted(String user_id, String node_id) {
		LogEntry logEntry = new LogEntry(user_id, UserAction.TAG_DELETED, node_id);
		logger.log(Level.getLevel("USER_ACTION"), logEntry);
		return logEntry;
	}

	@Override
	public LogEntry logTagActivated(String user_id, String node_id) {
		LogEntry logEntry = new LogEntry(user_id, UserAction.TAG_ACTIVATED, node_id);
		logger.log(Level.getLevel("USER_ACTION"), logEntry);
		return logEntry;
	}

	@Override
	public LogEntry logTagDeactivated(String user_id, String node_id) {
		LogEntry logEntry = new LogEntry(user_id, UserAction.TAG_DEACTIVATED, node_id);
		logger.log(Level.getLevel("USER_ACTION"), logEntry);
		return logEntry;
	}

	@Override
	public LogEntry logViewDocument(String user_id, String document_id) {
		LogEntry logEntry = new LogEntry(user_id, UserAction.VIEW_DOCUMENT_ACTION, document_id);
		logger.log(Level.getLevel("USER_ACTION"), logEntry);
		return logEntry;
	}

	@Override
	public LogEntry logGraphLayoutSwitched(String user_id, String layout_name) {
		LogEntry logEntry = new LogEntry(user_id, UserAction.GRAPH_LAYOUT_SWITCHED, layout_name);
		logger.log(Level.getLevel("USER_ACTION"), logEntry);
		return logEntry;
	}

	@Override
	public LogEntry logSearchwordHighlightingActivated(String user_id) {
		LogEntry logEntry = new LogEntry(user_id, UserAction.SEARCHWORD_HIGHLIGHT_ACTIVATED, "");
		logger.log(Level.getLevel("USER_ACTION"), logEntry);
		return logEntry;
	}

	@Override
	public LogEntry logSearchwordHighlightingDeactivated(String user_id) {
		LogEntry logEntry = new LogEntry(user_id, UserAction.SEARCHWORD_HIGHLIGHT_DEACTIVATED, "");
		logger.log(Level.getLevel("USER_ACTION"), logEntry);
		return logEntry;
	}

	@Override
	public LogEntry logScroll(String user_id, boolean isDocumentScrollEvent, String label) {
		LogEntry logEntry = null;
		if (isDocumentScrollEvent) {
			logEntry = new LogEntry(user_id, UserAction.DOCUMENT_SCROLLED, label);
		} else {
			logEntry = new LogEntry(user_id, UserAction.SEARCH_RESULTS_SCROLLED, label);
		}

		logger.log(Level.getLevel("USER_ACTION"), logEntry);
		return logEntry;
	}

	@Override
	public LogEntry logNodeCentered(String user_id, String label, String visibleNodes) {
		LogEntry logEntry = new LogEntry(user_id, UserAction.NODE_CENTERED, label + "," + visibleNodes);
		logger.log(Level.getLevel("USER_ACTION"), logEntry);
		return logEntry;
	}

	@Override
	public LogEntry logEdgeCentered(String user_id, String label, String visibleNodes) {
		LogEntry logEntry = new LogEntry(user_id, UserAction.EDGE_CENTERED, label + "," + visibleNodes);
		logger.log(Level.getLevel("USER_ACTION"), logEntry);
		return logEntry;
	}

	@Override
	public LogEntry logNodeDragEvent(String user_id, String label, String visibleNodes) {
		LogEntry logEntry = new LogEntry(user_id, UserAction.NODE_DRAGGED, label + "," + visibleNodes);
		logger.log(Level.getLevel("USER_ACTION"), logEntry);
		return logEntry;
	}

	@Override
	public LogEntry logPanEvent(String user_id, String label) {
		LogEntry logEntry = new LogEntry(user_id, UserAction.PANNED, label);
		logger.log(Level.getLevel("USER_ACTION"), logEntry);
		return logEntry;
	}

	@Override
	public LogEntry logZoomEvent(String user_id, String label) {
		LogEntry logEntry = new LogEntry(user_id, UserAction.ZOOMED, label);
		logger.log(Level.getLevel("USER_ACTION"), logEntry);
		return logEntry;
	}

	@Override
	public void logSystemError(String error) {
		logger.error(error);
	}

	@Override
	public void logSystem(String msg) {
		logger.info(msg);
	}

}
