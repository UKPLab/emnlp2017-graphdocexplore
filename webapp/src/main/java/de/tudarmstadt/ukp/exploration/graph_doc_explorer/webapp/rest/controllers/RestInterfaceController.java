package de.tudarmstadt.ukp.exploration.graph_doc_explorer.webapp.rest.controllers;

import java.util.Collections;
import java.util.HashMap;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RestController;

import de.tudarmstadt.ukp.exploration.graph_doc_explorer.graphs.IGraphGenerator;
import de.tudarmstadt.ukp.exploration.graph_doc_explorer.graphs.LogEntry;
import de.tudarmstadt.ukp.exploration.graph_doc_explorer.graphs.SearchResult;
import de.tudarmstadt.ukp.exploration.graph_doc_explorer.graphs.UpdateQueue;
import de.tudarmstadt.ukp.exploration.graph_doc_explorer.webapp.application.configs.WebAppConfiguration;
import de.tudarmstadt.ukp.exploration.graph_doc_explorer.webapp.application.domains.Collection;
import de.tudarmstadt.ukp.exploration.graph_doc_explorer.webapp.application.domains.GraphAPI;
import de.tudarmstadt.ukp.exploration.graph_doc_explorer.webapp.application.domains.SearchResponse;
import de.tudarmstadt.ukp.exploration.graph_doc_explorer.webapp.application.logging.ILogger;
import de.tudarmstadt.ukp.exploration.graph_doc_explorer.webapp.application.search.ISearcher;

/**
 * This class handles the communication between the client application and the
 * server. It is responsible for accepting the client's requests, for processing
 * the requests and for returning the corresponding responses. The
 * RestInterfaceController is also responsible for dispatching log actions for
 * incoming requests such as "node clicked" or "graph layout switched".
 *
 */
@RestController
@RequestMapping("/api")
public class RestInterfaceController {

	/**
	 * The RestInterfaceController accesses the the WebAppConfiguration which
	 * stores things such as the document collection in use or the logger in
	 * use.
	 */
	final private WebAppConfiguration config = WebAppConfiguration.getInstance();

	/**
	 * Generates a random user id and returns it. The user id is needed because
	 * without user ids it would be impossible to tell which user was
	 * responsible for generating which log entry. The user id is furthermore
	 * relevant for generating individual, dynamic graphs which might differ
	 * from user to user.
	 * 
	 * @return the generated user id which is used for all subsequent log
	 *         entries and for the generation of individual graphs.
	 */
	@RequestMapping(value = "/user/generate_id", method = RequestMethod.GET, produces = {
			MediaType.APPLICATION_JSON_VALUE })
	public ResponseEntity<Map<String, String>> generateUserID() {

		// generate the random user id
		String uuid = UUID.randomUUID().toString();

		// log the user id
		config.logger().logSystem("A new UUID has been generated for a user : " + uuid);

		// construct the response
		Map<String, String> userToIDMap = new HashMap<String, String>();
		userToIDMap.put("user_id", uuid);

		return new ResponseEntity<Map<String, String>>(userToIDMap, HttpStatus.OK);
	}

	/**
	 * Retrieves all document collections from the WebAppConfiguration and
	 * returns them.
	 * 
	 * @return All document collections which are indexed in SOLR.
	 */
	@RequestMapping(value = "/groups", method = RequestMethod.GET, produces = { MediaType.APPLICATION_JSON_VALUE })
	public ResponseEntity<List<String>> getGroups() {

		// access the WebAppConfiguration's document collections
		List<String> collections = config.getCollections();
		Collections.sort(collections);

		return new ResponseEntity<List<String>>(collections, HttpStatus.OK);
	}

	/**
	 * Retrieves all graph layout names from the WebAppConfiguration and returns
	 * them.
	 * 
	 * @return A list containing the layout names to be used in the client
	 *         application.
	 */
	@RequestMapping(value = "/layouts", method = RequestMethod.GET, produces = { MediaType.APPLICATION_JSON_VALUE })
	public ResponseEntity<List<String>> getLayoutNames() {

		// access the WebAppConfiguration's graph layout names
		List<String> layoutNames = config.getLayoutNames();

		return new ResponseEntity<List<String>>(layoutNames, HttpStatus.OK);
	}

	/**
	 * Retrieves all settings data from the WebAppConfiguration and returns
	 * them.
	 * 
	 * @return A list containing the settings data to be used in the client
	 *         application.
	 */
	@RequestMapping(value = "/settings", method = RequestMethod.GET, produces = { MediaType.APPLICATION_JSON_VALUE })
	public ResponseEntity<List<Integer>> getSettings() {

		// access the WebAppConfiguration's settings
		List<Integer> settings = config.getSettings();

		return new ResponseEntity<List<Integer>>(settings, HttpStatus.OK);
	}

	/**
	 * Retrieves a graph from the configuration's graph generator. The graph
	 * generator uses the given user id to return an individual graph.
	 * 
	 * @param userIDCookie
	 *            the given user id for the user which requested the graph.
	 * @return <b>HttpStatus.BAD_REQUEST</b> if the user id is no previously
	 *         generated user id, otherwise <b>HttpStatus.OK</b>.
	 */
	@RequestMapping(value = "/graph/{collectionID}", method = RequestMethod.GET, produces = {
			MediaType.APPLICATION_JSON_VALUE })
	public ResponseEntity<GraphAPI> getGraph(@PathVariable("collectionID") String collectionID,
			@CookieValue(name = "user_id", defaultValue = "default") String userIDCookie) {

		// if the user id is the default user id and not a previously generated
		// one, a teapot is returned
		if (!checkValidCookie(userIDCookie)) {
			return new ResponseEntity<GraphAPI>(HttpStatus.I_AM_A_TEAPOT);
		}

		Collection collection = config.getCollection(collectionID);
		if (collection == null)
			return new ResponseEntity<GraphAPI>(HttpStatus.BAD_REQUEST);
		String genID = userIDCookie + "_" + collection.name();

		IGraphGenerator generator = config.graphGenerator(userIDCookie, collection);
		UpdateQueue.getStateOf(genID); // remove the graph from the Queue
		return new ResponseEntity<GraphAPI>(new GraphAPI(generator.getGraph()), HttpStatus.OK);
	}

	/**
	 * Checks if the graph for the given user id has changed. The update queue
	 * determines if the graph for the given user has changed.
	 * 
	 * @param userIDCookie
	 *            the given user id
	 * @return <b>HttpStatus.BAD_REQUEST</b> if the user id is no previously
	 *         generated user id, <b>HttpStatus.OK</b> if the graph has changed
	 *         or <b>HttpStatus.NOT_FOUND</b> if the graph has not changed.
	 */
	@RequestMapping(value = "/graph/{collectionID}/changed", method = RequestMethod.HEAD)
	public ResponseEntity<Void> graphChanged(@PathVariable("collectionID") String collectionID,
			@CookieValue(name = "user_id", defaultValue = "default") String userIDCookie) {
		// if the user id is the default user id and not a previously generated
		// one, a teapot is returned
		if (!checkValidCookie(userIDCookie)) {
			return new ResponseEntity<Void>(HttpStatus.I_AM_A_TEAPOT);
		}

		Collection collection = config.getCollection(collectionID);
		if (collection == null)
			return new ResponseEntity<Void>(HttpStatus.BAD_REQUEST);

		String genID = userIDCookie + "_" + collection.name();
		boolean graphChanged = UpdateQueue.getStateOf(genID);

		if (graphChanged) {
			System.out.println("Graph changed ? " + genID + " => " + graphChanged);
			// return a 200 response
			return new ResponseEntity<Void>(HttpStatus.OK);
		} else {
			// return a 204 response
			return new ResponseEntity<Void>(HttpStatus.NO_CONTENT);
		}
	}

	/**
	 * Retrieves the search results from the SOLR server and returns them to the
	 * client application. Also retrieves and returns a graph from the
	 * WebAppConfiguration's graph generator.
	 * 
	 * @param collectionID
	 *            the document collection id corresponding to the document
	 *            collection in which SOLR is supposed to search
	 * @param searchword
	 *            the word the user wants to search for
	 * @param userIDCookie
	 *            the user id
	 * @return All search results from the collection which are relevant to the
	 *         user's searchword and the generated graph.
	 */
	@RequestMapping(value = "/search/{collectionID}/{searchword}", method = RequestMethod.GET, produces = {
			MediaType.APPLICATION_JSON_VALUE })
	public ResponseEntity<SearchResponse> getSearchResults(@PathVariable("collectionID") String collectionID,
			@PathVariable("searchword") String searchword,
			@CookieValue(name = "user_id", defaultValue = "default") String userIDCookie) {

		// if the user id is the default user id and not a previously generated
		// one, a teapot is returned
		if (!checkValidCookie(userIDCookie)) {
			return new ResponseEntity<SearchResponse>(HttpStatus.I_AM_A_TEAPOT);
		}

		Collection collection = config.getCollection(collectionID);
		if (collection == null)
			return new ResponseEntity<SearchResponse>(HttpStatus.BAD_REQUEST);

		// prepare the search results
		LinkedList<SearchResult> searchResults = new LinkedList<SearchResult>();

		// query the searcher with the given keyword and store the results in
		// the list
		ISearcher searcher = config.searcher();
		searcher.setUrl(config.solrServerUrl());
		searchResults.addAll(searcher.query(searchword, collectionID));

		// graph generation
		IGraphGenerator generator = config.graphGenerator(userIDCookie, collection);

		// initialize the graph generator with the search results and the path
		// to the document collection's folder
		String[] params = collection.params().split(" ");
		generator.initialize(searchResults, config.getCollection(collectionID).folder(), params);

		// logging
		ILogger logger = config.logger();

		// log the user's search query
		LogEntry entry = logger.logQuery(searchword, userIDCookie, searchResults);

		addUserAction(entry, userIDCookie, collection);

		// return the search results and the graph
		return new ResponseEntity<SearchResponse>(new SearchResponse(searchResults, generator.getGraph()),
				HttpStatus.OK);
	}

	/**
	 * Logs a <i>node clicked</i> event. These events occur whenever the user
	 * clicks on a graph node.
	 * 
	 * @param nodeID
	 *            the graph's node that was clicked.
	 * @param userIDCookie
	 *            the id of the user who clicked the graph's node.
	 * @return <b>HttpStatus.BAD_REQUEST</b> if the user id is no previously
	 *         generated user id, otherwise <b>HttpStatus.OK</b>.
	 */
	@RequestMapping(value = "/log/{collectionID}/node/{node_id}", method = RequestMethod.HEAD)
	public ResponseEntity<Void> logNode(@PathVariable("collectionID") String collectionID,
			@PathVariable("node_id") String nodeID,
			@CookieValue(name = "user_id", defaultValue = "default") String userIDCookie) {

		// if the user id is the default user id and not a previously generated
		// one, a teapot is returned
		if (!checkValidCookie(userIDCookie)) {
			return new ResponseEntity<Void>(HttpStatus.I_AM_A_TEAPOT);
		}
		Collection collection = config.getCollection(collectionID);
		if (collection == null)
			return new ResponseEntity<Void>(HttpStatus.BAD_REQUEST);

		// Logging
		ILogger logger = config.logger();

		// log the node click event
		LogEntry entry = logger.logNodeClick(userIDCookie, nodeID);

		addUserAction(entry, userIDCookie, collection);

		return new ResponseEntity<Void>(HttpStatus.OK);
	}

	/**
	 * Logs a <i>tag added</i> event. These events occur when the user clicks on
	 * either a graph node or a graph edge, but only if there currently is no
	 * document tag for the clicked graph element.
	 * 
	 * @param graphElementID
	 *            the clicked graph element's id. Can be a node id or an edge
	 *            id.
	 * @param userIDCookie
	 *            the user who clicked the graph element.
	 * @return <b>HttpStatus.BAD_REQUEST</b> if the user id is no previously
	 *         generated user id, otherwise <b>HttpStatus.OK</b>.
	 */
	@RequestMapping(value = "/log/{collectionID}/tag/add/{graphElement_id}", method = RequestMethod.HEAD)
	public ResponseEntity<Void> logTagAdded(@PathVariable("collectionID") String collectionID,
			@PathVariable("graphElement_id") String graphElementID,
			@CookieValue(name = "user_id", defaultValue = "default") String userIDCookie) {

		// if the user id is the default user id and not a previously generated
		// one, a teapot is returned
		if (!checkValidCookie(userIDCookie)) {
			return new ResponseEntity<Void>(HttpStatus.I_AM_A_TEAPOT);
		}
		Collection collection = config.getCollection(collectionID);
		if (collection == null)
			return new ResponseEntity<Void>(HttpStatus.BAD_REQUEST);

		// Logging
		ILogger logger = config.logger();

		// log that the tag was added
		LogEntry entry = logger.logTagAdded(userIDCookie, graphElementID);

		addUserAction(entry, userIDCookie, collection);

		return new ResponseEntity<Void>(HttpStatus.OK);
	}

	/**
	 * Logs a <i>tag deleted</i> event. These events occur when the user removes
	 * a document tag.
	 * 
	 * @param tagID
	 *            the document tag's id which was removed.
	 * @param userIDCookie
	 *            the user who removed the document tag.
	 * @return <b>HttpStatus.BAD_REQUEST</b> if the user id is no previously
	 *         generated user id, otherwise <b>HttpStatus.OK</b>.
	 */
	@RequestMapping(value = "/log/{collectionID}/tag/del/{tag_id}", method = RequestMethod.HEAD)
	public ResponseEntity<Void> logTagDeleted(@PathVariable("collectionID") String collectionID,
			@PathVariable("tag_id") String tagID,
			@CookieValue(name = "user_id", defaultValue = "default") String userIDCookie) {

		// if the user id is the default user id and not a previously generated
		// one, a teapot is returned
		if (!checkValidCookie(userIDCookie)) {
			return new ResponseEntity<Void>(HttpStatus.I_AM_A_TEAPOT);
		}
		Collection collection = config.getCollection(collectionID);
		if (collection == null)
			return new ResponseEntity<Void>(HttpStatus.BAD_REQUEST);

		// Logging
		ILogger logger = config.logger();

		// log that the tag was removed
		LogEntry entry = logger.logTagDeleted(userIDCookie, tagID);

		addUserAction(entry, userIDCookie, collection);

		return new ResponseEntity<Void>(HttpStatus.OK);
	}

	/**
	 * Logs a <i>tag activated</i>/<i>tag deactivated</i> event. These events
	 * occur whenever the user activates or deactivates a document tag.
	 * 
	 * @param tagID
	 *            the document tag's id.
	 * @param tagActivated
	 *            <b>true</b> if the user activated the document tag,
	 *            <b>false</b> if the user deactivated the document tag.
	 * @param userIDCookie
	 *            the user who activated or deactivated the document tag.
	 * @return <b>HttpStatus.BAD_REQUEST</b> if the user id is no previously
	 *         generated user id, otherwise <b>HttpStatus.OK</b>.
	 */
	@RequestMapping(value = "/log/{collectionID}/tagStatus/{tag_id}/{tagActivated}", method = RequestMethod.HEAD)
	public ResponseEntity<Void> logTagClicked(@PathVariable("collectionID") String collectionID,
			@PathVariable("tag_id") String tagID, @PathVariable("tagActivated") boolean tagActivated,
			@CookieValue(name = "user_id", defaultValue = "default") String userIDCookie) {

		// if the user id is the default user id and not a previously generated
		// one, a teapot is returned
		if (!checkValidCookie(userIDCookie)) {
			return new ResponseEntity<Void>(HttpStatus.I_AM_A_TEAPOT);
		}
		Collection collection = config.getCollection(collectionID);
		if (collection == null)
			return new ResponseEntity<Void>(HttpStatus.BAD_REQUEST);

		// Logging
		// log the respective events
		ILogger logger = config.logger();
		LogEntry entry = null;
		if (tagActivated) {
			entry = logger.logTagActivated(userIDCookie, tagID);
		} else {
			entry = logger.logTagDeactivated(userIDCookie, tagID);
		}
		addUserAction(entry, userIDCookie, collection);

		return new ResponseEntity<Void>(HttpStatus.OK);
	}

	/**
	 * Logs an <i>edge clicked</i> event. These events occur whenever the user
	 * clicks a graph edge.
	 * 
	 * @param edgeID
	 *            the edge which was clicked.
	 * @param userIDCookie
	 *            the user who clicked the edge.
	 * @return <b>HttpStatus.BAD_REQUEST</b> if the user id is no previously
	 *         generated user id, otherwise <b>HttpStatus.OK</b>.
	 */
	@RequestMapping(value = "/log/{collectionID}/edge/{edge_id}", method = RequestMethod.HEAD)
	public ResponseEntity<Void> logEdge(@PathVariable("collectionID") String collectionID,
			@PathVariable("edge_id") String edgeID,
			@CookieValue(name = "user_id", defaultValue = "default") String userIDCookie) {

		// if the user id is the default user id and not a previously generated
		// one, a teapot is returned
		if (!checkValidCookie(userIDCookie)) {
			return new ResponseEntity<Void>(HttpStatus.I_AM_A_TEAPOT);
		}
		Collection collection = config.getCollection(collectionID);
		if (collection == null)
			return new ResponseEntity<Void>(HttpStatus.BAD_REQUEST);

		// Logging
		ILogger logger = config.logger();

		// log the edge click event
		LogEntry entry = logger.logEdgeClick(userIDCookie, edgeID);

		addUserAction(entry, userIDCookie, collection);

		return new ResponseEntity<Void>(HttpStatus.OK);
	}

	/**
	 * Logs a <i>view document</i> event. These events occur whenever the user
	 * views an entire document.
	 * 
	 * @param documentID
	 *            the document the user wants to see entirely.
	 * @param userIDCookie
	 *            the user who wants to see the document entirely.
	 * @return <b>HttpStatus.BAD_REQUEST</b> if the user id is no previously
	 *         generated user id, otherwise <b>HttpStatus.OK</b>.
	 */
	@RequestMapping(value = "/log/{collectionID}/document/{document_id}", method = RequestMethod.HEAD)
	public ResponseEntity<Void> logDocument(@PathVariable("collectionID") String collectionID,
			@PathVariable("document_id") String documentID,
			@CookieValue(name = "user_id", defaultValue = "default") String userIDCookie) {

		// if the user id is the default user id and not a previously generated
		// one, a teapot is returned
		if (!checkValidCookie(userIDCookie)) {
			return new ResponseEntity<Void>(HttpStatus.I_AM_A_TEAPOT);
		}
		Collection collection = config.getCollection(collectionID);
		if (collection == null)
			return new ResponseEntity<Void>(HttpStatus.BAD_REQUEST);

		// Logging
		ILogger logger = config.logger();

		// log the event
		LogEntry entry = logger.logViewDocument(userIDCookie, documentID);

		addUserAction(entry, userIDCookie, collection);

		return new ResponseEntity<Void>(HttpStatus.OK);
	}

	/**
	 * Logs a <i>back to results</i> event. These events occur whenever the user
	 * goes back to the search results page from viewing an entire document.
	 * 
	 * @param searchword
	 *            the searchword which was used to retrieve the search results.
	 * @param userIDCookie
	 *            the user who is done with viewing the entire document.
	 * @return <b>HttpStatus.BAD_REQUEST</b> if the user id is no previously
	 *         generated user id, otherwise <b>HttpStatus.OK</b>.
	 */
	@RequestMapping(value = "/log/{collectionID}/results/{searchword}", method = RequestMethod.HEAD)
	public ResponseEntity<Void> logBackToResults(@PathVariable("collectionID") String collectionID,
			@PathVariable("searchword") String searchword,
			@CookieValue(name = "user_id", defaultValue = "default") String userIDCookie) {

		// if the user id is the default user id and not a previously generated
		// one, a teapot is returned
		if (!checkValidCookie(userIDCookie)) {
			return new ResponseEntity<Void>(HttpStatus.I_AM_A_TEAPOT);
		}
		Collection collection = config.getCollection(collectionID);
		if (collection == null)
			return new ResponseEntity<Void>(HttpStatus.BAD_REQUEST);

		// Logging
		ILogger logger = config.logger();

		// log the event
		LogEntry entry = logger.logBackToResults(userIDCookie, searchword);

		addUserAction(entry, userIDCookie, collection);

		return new ResponseEntity<Void>(HttpStatus.OK);
	}

	/**
	 * Logs a <i>layout switched</i> event. These events occur whenever the user
	 * switches the graph layout.
	 * 
	 * @param layoutName
	 *            the name of the graph layout the user switched to.
	 * @param userIDCookie
	 *            the user who switched the graph layout.
	 * @return <b>HttpStatus.BAD_REQUEST</b> if the user id is no previously
	 *         generated user id, otherwise <b>HttpStatus.OK</b>.
	 */
	@RequestMapping(value = "/log/{collectionID}/layout/{layoutName}", method = RequestMethod.HEAD)
	public ResponseEntity<Void> logLayoutSwitched(@PathVariable("collectionID") String collectionID,
			@PathVariable("layoutName") String layoutName,
			@CookieValue(name = "user_id", defaultValue = "default") String userIDCookie) {

		// if the user id is the default user id and not a previously generated
		// one, a teapot is returned
		if (!checkValidCookie(userIDCookie)) {
			return new ResponseEntity<Void>(HttpStatus.I_AM_A_TEAPOT);
		}
		Collection collection = config.getCollection(collectionID);
		if (collection == null)
			return new ResponseEntity<Void>(HttpStatus.BAD_REQUEST);

		// Logging
		ILogger logger = config.logger();

		// log the layout switch
		LogEntry entry = logger.logGraphLayoutSwitched(userIDCookie, layoutName);

		addUserAction(entry, userIDCookie, collection);

		return new ResponseEntity<Void>(HttpStatus.OK);
	}

	/**
	 * Logs a <i>searchword highlight toggled</i> event. These events occur
	 * whenever the user toggles the searchword highlighting on or off.
	 * 
	 * @param toggledOn
	 *            <b>true</b> if the searchword highlighting was toggled on,
	 *            <b>false</b> if it was toggled off.
	 * @param userIDCookie
	 *            the user who toggled the searchword highlighting.
	 * @return <b>HttpStatus.BAD_REQUEST</b> if the user id is no previously
	 *         generated user id, otherwise <b>HttpStatus.OK</b>.
	 */
	@RequestMapping(value = "/log/{collectionID}/swhl/{toggledOn}", method = RequestMethod.HEAD)
	public ResponseEntity<Void> logSearchwordHighlightingToggled(@PathVariable("collectionID") String collectionID,
			@PathVariable("toggledOn") boolean toggledOn,
			@CookieValue(name = "user_id", defaultValue = "default") String userIDCookie) {

		// if the user id is the default user id and not a previously generated
		// one, a teapot is returned
		if (!checkValidCookie(userIDCookie)) {
			return new ResponseEntity<Void>(HttpStatus.I_AM_A_TEAPOT);
		}
		Collection collection = config.getCollection(collectionID);
		if (collection == null)
			return new ResponseEntity<Void>(HttpStatus.BAD_REQUEST);

		// Logging
		ILogger logger = config.logger();

		// log the respective events
		LogEntry entry = null;
		if (toggledOn) {
			entry = logger.logSearchwordHighlightingActivated(userIDCookie);
		} else {
			entry = logger.logSearchwordHighlightingDeactivated(userIDCookie);
		}
		addUserAction(entry, userIDCookie, collection);

		return new ResponseEntity<Void>(HttpStatus.OK);
	}

	/**
	 * Logs a <i>scroll</i> event. These events occur whenever the user scrolls
	 * a document or the search results list.
	 * 
	 * @param isDocumentScrollEvent
	 *            <b>true</b> if the event is a document scroll event,
	 *            <b>false</b> if the event is a search result list scroll
	 *            event.
	 * @param message
	 *            the document's visible lines when scrolling a document or the
	 *            search result list's visible documents when scrolling the
	 *            list.
	 * @param userIDCookie
	 *            the user who scrolled.
	 * @return <b>HttpStatus.BAD_REQUEST</b> if the user id is no previously
	 *         generated user id, otherwise <b>HttpStatus.OK</b>.
	 */
	@RequestMapping(value = "/log/{collectionID}/scroll/{isDocumentScrollEvent}/{message}", method = RequestMethod.HEAD)
	public ResponseEntity<Void> logScrolled(@PathVariable("collectionID") String collectionID,
			@PathVariable("isDocumentScrollEvent") boolean isDocumentScrollEvent,
			@PathVariable("message") String message,
			@CookieValue(name = "user_id", defaultValue = "default") String userIDCookie) {

		// if the user id is the default user id and not a previously generated
		// one, a teapot is returned
		if (!checkValidCookie(userIDCookie)) {
			return new ResponseEntity<Void>(HttpStatus.I_AM_A_TEAPOT);
		}
		Collection collection = config.getCollection(collectionID);
		if (collection == null)
			return new ResponseEntity<Void>(HttpStatus.BAD_REQUEST);

		// Logging
		ILogger logger = config.logger();
		LogEntry entry = logger.logScroll(userIDCookie, isDocumentScrollEvent, message);

		addUserAction(entry, userIDCookie, collection);

		return new ResponseEntity<Void>(HttpStatus.OK);
	}

	/**
	 * Logs a <i>node centered</i> event. These events occur whenever the user
	 * centers a node, for example when clicking some highlighted text which
	 * corresponds to one of the node's occurrences.
	 * 
	 * @param nodeID
	 *            the node that was centered.
	 * @param visibleNodes
	 *            the nodes which are visible after the centering event.
	 * @param userIDCookie
	 *            the user who centered the node.
	 * @return <b>HttpStatus.BAD_REQUEST</b> if the user id is no previously
	 *         generated user id, otherwise <b>HttpStatus.OK</b>.
	 */
	@RequestMapping(value = "/log/{collectionID}/nodeCentered/{node_id}/{visibleNodes}", method = RequestMethod.HEAD)
	public ResponseEntity<Void> logNodeCentered(@PathVariable("collectionID") String collectionID,
			@PathVariable("node_id") String nodeID, @PathVariable("visibleNodes") String visibleNodes,
			@CookieValue(name = "user_id", defaultValue = "default") String userIDCookie) {

		// if the user id is the default user id and not a previously generated
		// one, a teapot is returned
		if (!checkValidCookie(userIDCookie)) {
			return new ResponseEntity<Void>(HttpStatus.I_AM_A_TEAPOT);
		}
		Collection collection = config.getCollection(collectionID);
		if (collection == null)
			return new ResponseEntity<Void>(HttpStatus.BAD_REQUEST);

		// Logging
		ILogger logger = config.logger();
		LogEntry entry = logger.logNodeCentered(userIDCookie, nodeID, visibleNodes);

		addUserAction(entry, userIDCookie, collection);

		return new ResponseEntity<Void>(HttpStatus.OK);
	}

	/**
	 * Logs an <i>edge centered</i> event. These events occur whenever the user
	 * centers an edge, for example when clicking some highlighted text which
	 * corresponds to one of the edge's occurrences.
	 * 
	 * @param edgeID
	 *            the edge that was centered.
	 * @param visibleNodes
	 *            the nodes which are visible after the centering event.
	 * @param userIDCookie
	 *            the user who centered the edge.
	 * @return <b>HttpStatus.BAD_REQUEST</b> if the user id is no previously
	 *         generated user id, otherwise <b>HttpStatus.OK</b>.
	 */
	@RequestMapping(value = "/log/{collectionID}/edgeCentered/{edge_id}/{visibleNodes}", method = RequestMethod.HEAD)
	public ResponseEntity<Void> logEdgeCentered(@PathVariable("collectionID") String collectionID,
			@PathVariable("edge_id") String edgeID, @PathVariable("visibleNodes") String visibleNodes,
			@CookieValue(name = "user_id", defaultValue = "default") String userIDCookie) {

		// if the user id is the default user id and not a previously generated
		// one, a teapot is returned
		if (!checkValidCookie(userIDCookie)) {
			return new ResponseEntity<Void>(HttpStatus.I_AM_A_TEAPOT);
		}
		Collection collection = config.getCollection(collectionID);
		if (collection == null)
			return new ResponseEntity<Void>(HttpStatus.BAD_REQUEST);

		// Logging
		ILogger logger = config.logger();
		LogEntry entry = logger.logEdgeCentered(userIDCookie, edgeID, visibleNodes);

		addUserAction(entry, userIDCookie, collection);

		return new ResponseEntity<Void>(HttpStatus.OK);
	}

	/**
	 * Logs a <i>node dragged</i> event. These events occur whenever the user
	 * drags a graph node.
	 * 
	 * @param nodeID
	 *            the node that was dragged.
	 * @param visibleNodes
	 *            the nodes which are visible after the drag event.
	 * @param userIDCookie
	 *            the user who dragged the node.
	 * @return <b>HttpStatus.BAD_REQUEST</b> if the user id is no previously
	 *         generated user id, otherwise <b>HttpStatus.OK</b>.
	 */
	@RequestMapping(value = "/log/{collectionID}/nodeDragEvent/{node_id}/{visibleNodes}", method = RequestMethod.HEAD)
	public ResponseEntity<Void> logNodeDragEvent(@PathVariable("collectionID") String collectionID,
			@PathVariable("node_id") String nodeID, @PathVariable("visibleNodes") String visibleNodes,
			@CookieValue(name = "user_id", defaultValue = "default") String userIDCookie) {

		// if the user id is the default user id and not a previously generated
		// one, a teapot is returned
		if (!checkValidCookie(userIDCookie)) {
			return new ResponseEntity<Void>(HttpStatus.I_AM_A_TEAPOT);
		}
		Collection collection = config.getCollection(collectionID);
		if (collection == null)
			return new ResponseEntity<Void>(HttpStatus.BAD_REQUEST);

		// Logging
		ILogger logger = config.logger();
		LogEntry entry = logger.logNodeDragEvent(userIDCookie, nodeID, visibleNodes);

		addUserAction(entry, userIDCookie, collection);

		return new ResponseEntity<Void>(HttpStatus.OK);
	}

	/**
	 * Logs a <i>graph panned</i> event. These events occur whenever the user
	 * pans the entire graph window.
	 * 
	 * @param visibleNodes
	 *            the nodes which are visible after the pan event.
	 * @param userIDCookie
	 *            the user who panned the graph.
	 * @return <b>HttpStatus.BAD_REQUEST</b> if the user id is no previously
	 *         generated user id, otherwise <b>HttpStatus.OK</b>.
	 */
	@RequestMapping(value = "/log/{collectionID}/panEvent/{visibleNodes}", method = RequestMethod.HEAD)
	public ResponseEntity<Void> logPanEvent(@PathVariable("collectionID") String collectionID,
			@PathVariable("visibleNodes") String visibleNodes,
			@CookieValue(name = "user_id", defaultValue = "default") String userIDCookie) {

		// if the user id is the default user id and not a previously generated
		// one, a teapot is returned
		if (!checkValidCookie(userIDCookie)) {
			return new ResponseEntity<Void>(HttpStatus.I_AM_A_TEAPOT);
		}
		Collection collection = config.getCollection(collectionID);
		if (collection == null)
			return new ResponseEntity<Void>(HttpStatus.BAD_REQUEST);

		// Logging
		ILogger logger = config.logger();
		LogEntry entry = logger.logPanEvent(userIDCookie, visibleNodes);

		addUserAction(entry, userIDCookie, collection);

		return new ResponseEntity<Void>(HttpStatus.OK);
	}

	/**
	 * Logs a <i>graph zoomed</i> event. These events occur whenever the user
	 * zooms the entire graph window.
	 * 
	 * @param visibleNodes
	 *            the nodes which are visible after the zoom event.
	 * @param userIDCookie
	 *            the user who zoomed the graph.
	 * @return <b>HttpStatus.BAD_REQUEST</b> if the user id is no previously
	 *         generated user id, otherwise <b>HttpStatus.OK</b>.
	 */
	@RequestMapping(value = "/log/{collectionID}/zoomEvent/{visibleNodes}", method = RequestMethod.HEAD)
	public ResponseEntity<Void> logZoomEvent(@PathVariable("collectionID") String collectionID,
			@PathVariable("visibleNodes") String visibleNodes,
			@CookieValue(name = "user_id", defaultValue = "default") String userIDCookie) {

		// if the user id is the default user id and not a previously generated
		// one, a teapot is returned
		if (!checkValidCookie(userIDCookie)) {
			return new ResponseEntity<Void>(HttpStatus.I_AM_A_TEAPOT);
		}
		Collection collection = config.getCollection(collectionID);
		if (collection == null)
			return new ResponseEntity<Void>(HttpStatus.BAD_REQUEST);

		// Logging
		ILogger logger = config.logger();
		LogEntry entry = logger.logZoomEvent(userIDCookie, visibleNodes);

		addUserAction(entry, userIDCookie, collection);

		return new ResponseEntity<Void>(HttpStatus.OK);
	}

	/**
	 * Checks the user id from the cookie against the default value.
	 * 
	 * @param userIDCookie
	 *            The user id read from the cookie.
	 * @return true if the user id is valid, e.g. doesn't contain the default
	 *         value. Otherwise false.
	 */
	private boolean checkValidCookie(String userIDCookie) {
		if (userIDCookie.equals("default") || userIDCookie == "")
			return false;

		return true;
	}

	/**
	 * Notifies the graph generator that a user action occurred.
	 * 
	 * @param entry
	 *            The LogEntry corresponding to the user action.
	 * @param userIDCookie
	 *            The user who is responsible for the user action.
	 */
	private void addUserAction(LogEntry entry, String userIDCookie, Collection collection) {
		entry.setCollection(collection.name());
		config.graphGenerator(userIDCookie, collection).addUserAction(entry);
	}

}
