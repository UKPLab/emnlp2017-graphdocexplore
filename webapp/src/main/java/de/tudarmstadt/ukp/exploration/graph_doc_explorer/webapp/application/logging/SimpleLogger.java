package de.tudarmstadt.ukp.exploration.graph_doc_explorer.webapp.application.logging;

import java.io.File;
import java.io.FileWriter;
import java.io.IOException;
import java.util.List;

import de.tudarmstadt.ukp.exploration.graph_doc_explorer.graphs.LogEntry;
import de.tudarmstadt.ukp.exploration.graph_doc_explorer.graphs.SearchResult;
import de.tudarmstadt.ukp.exploration.graph_doc_explorer.graphs.UserAction;

/**
 * A basic logging class which handles the logging of queries and their results
 * only.
 *
 */
public class SimpleLogger implements ILogger {
	/*
	 * (non-Javadoc)
	 * 
	 * @see
	 * de.tu_darmstadt.bp.gruppe31.application.logging.ILogger#logQuery(java.
	 * lang.String, java.lang.String, java.util.List, java.lang.String)
	 */

	@Override
	public LogEntry logQuery(String keyword, String user_id, List<SearchResult> results) {

		String path = "/path/to/log";
		LogEntry logEntry = new LogEntry(user_id, UserAction.SEARCH_ACTION, keyword);

		try {

			String completePath = System.getProperty("user.dir") + path;

			// check if folders exist
			File logFile = new File(completePath);
			// if not, create them
			if (!logFile.exists())
				logFile.mkdirs();

			// DEBUGGING
			System.out.println("Complete log file path : " + completePath);
			// true needed so as to not overwrite the content of the file
			FileWriter writer = new FileWriter(completePath + "simpleLog", true);

			// build final log string
			StringBuilder logString = new StringBuilder();

			logString.append(logEntry);

			if (results.size() == 0) {
				logString.append(',');
				logString.append(LogEntry.NO_RESULTS);
			} else {
				for (SearchResult result : results) {
					logString.append(',');
					logString.append(result.id());
				}
			}
			logString.append('\n');

			writer.append(logString.toString());
			try {
				writer.close();
			} catch (IOException e) {
				e.printStackTrace();
			}
		} catch (IOException e) {
			e.printStackTrace();
		}
		return logEntry;
	}

	@Override
	public LogEntry logNodeClick(String user_id, String node_id) {
		// TODO Auto-generated method stub
		return null;
	}

	@Override
	public LogEntry logViewDocument(String user_id, String document_id) {
		// TODO Auto-generated method stub
		return null;
	}

	@Override
	public void logSystemError(String error) {
		// TODO Auto-generated method stub
	}

	@Override
	public void logSystem(String msg) {
		// TODO Auto-generated method stub

	}

	@Override
	public LogEntry logBackToResults(String user_id, String keyword) {
		// TODO Auto-generated method stub
		return null;
	}

	@Override
	public LogEntry logEdgeClick(String user_id, String edge_id) {
		// TODO Auto-generated method stub
		return null;
	}

	@Override
	public LogEntry logTagAdded(String user_id, String node_id) {
		// TODO Auto-generated method stub
		return null;
	}

	@Override
	public LogEntry logTagDeleted(String user_id, String node_id) {
		// TODO Auto-generated method stub
		return null;
	}

	@Override
	public LogEntry logTagActivated(String user_id, String node_id) {
		// TODO Auto-generated method stub
		return null;
	}

	@Override
	public LogEntry logTagDeactivated(String user_id, String node_id) {
		// TODO Auto-generated method stub
		return null;
	}

	@Override
	public LogEntry logGraphLayoutSwitched(String user_id, String layout_name) {
		// TODO Auto-generated method stub
		return null;
	}

	@Override
	public LogEntry logSearchwordHighlightingActivated(String user_id) {
		// TODO Auto-generated method stub
		return null;
	}

	@Override
	public LogEntry logSearchwordHighlightingDeactivated(String user_id) {
		// TODO Auto-generated method stub
		return null;
	}

	@Override
	public LogEntry logScroll(String user_id, boolean isDocumentScrollEvent, String label) {
		// TODO Auto-generated method stub
		return null;
	}

	@Override
	public LogEntry logNodeCentered(String user_id, String label, String visibleNodes) {
		// TODO Auto-generated method stub
		return null;
	}

	@Override
	public LogEntry logEdgeCentered(String user_id, String label, String visibleNodes) {
		// TODO Auto-generated method stub
		return null;
	}

	@Override
	public LogEntry logNodeDragEvent(String user_id, String label, String visibleNodes) {
		// TODO Auto-generated method stub
		return null;
	}

	@Override
	public LogEntry logPanEvent(String user_id, String label) {
		// TODO Auto-generated method stub
		return null;
	}

	@Override
	public LogEntry logZoomEvent(String user_id, String label) {
		// TODO Auto-generated method stub
		return null;
	}
}
