package de.tudarmstadt.ukp.exploration.graph_doc_explorer.graphs;

import java.util.HashSet;
import java.util.Set;

/**
 * This class stores for every user if there is an update available for their
 * graphs.
 */
public class UpdateQueue {
	static private Set<String> queue = new HashSet<String>();

	/**
	 * Add a user ID to the queue to notify the client that this user's
	 * graph has changed.
	 *
	 * @param uuid
	 *            the user ID.
	 */
	public static void add(String uuid) {
		queue.add(uuid);
	}

	/**
	 * Get the state of a given user's graph. If the user ID is in the set,
	 * the user's graph has changed.
	 * If not, the user's graph hasn't changed.
	 *
	 * @param uuid
	 *            the user ID.
	 * @return
	 * 		true if the given user's graph has changed, otherwise false.
	 */
	public static boolean getStateOf(String uuid) {
		if (queue.contains(uuid)) {
			queue.remove(uuid);
			return true;
		} else {
			return false;
		}
	}
}
