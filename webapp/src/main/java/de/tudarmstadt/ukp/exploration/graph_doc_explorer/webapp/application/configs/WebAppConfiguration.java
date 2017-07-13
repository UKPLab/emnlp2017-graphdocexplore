package de.tudarmstadt.ukp.exploration.graph_doc_explorer.webapp.application.configs;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

import javax.xml.parsers.ParserConfigurationException;
import javax.xml.parsers.SAXParser;
import javax.xml.parsers.SAXParserFactory;

import org.xml.sax.Attributes;
import org.xml.sax.SAXException;
import org.xml.sax.helpers.DefaultHandler;

import de.tudarmstadt.ukp.exploration.graph_doc_explorer.graphs.IGraphGenerator;
import de.tudarmstadt.ukp.exploration.graph_doc_explorer.webapp.application.domains.Collection;
import de.tudarmstadt.ukp.exploration.graph_doc_explorer.webapp.application.graph.GeneratorsContainer;
import de.tudarmstadt.ukp.exploration.graph_doc_explorer.webapp.application.logging.ILogger;
import de.tudarmstadt.ukp.exploration.graph_doc_explorer.webapp.application.search.ISearcher;

/**
 * Configuration for the application, which is provided by a configuration file.
 * This class is a singleton.
 * 
 * @author Ramy Hcini
 * @since 7 Jan 2017
 * @version 1.4
 */
public class WebAppConfiguration {

	private static WebAppConfiguration instance;

	// Application parameters

	/**
	 * Stores the document collections.
	 */
	private List<Collection> collections = new ArrayList<Collection>();

	/**
	 * Stores the graph layout names.
	 */
	private List<String> graphLayoutNames = new ArrayList<String>();

	/**
	 * Stores the application's settings which are specified in the
	 * configuration XML file.
	 */
	private List<Integer> settings = new ArrayList<Integer>();

	/**
	 * Stores the url of the SOLR server.
	 */
	private String serverUrl;

	/**
	 * Stores an implementation of the ISearcher interface.
	 */
	private ISearcher searcher;

	/**
	 * Stores an implementation of the ILogger interface.
	 */
	private ILogger logger;

	/**
	 * Specifies where to find the webapp configuration file.
	 */
	static final private String defaultConfigurationFile = "/configs/config.xml";

	/**
	 * Specifies where to find the collections.xml file.
	 */
	static final private String defaultCollectionsList = "/configs/collections.xml";

	// XML tags used for parsing the configuration files.
	static final private String collectionTag = "collection";
	static final private String graphTag = "graph";
	static final private String searchTag = "search";
	static final private String layoutTag = "layout";
	static final private String settingTag = "setting";
	static final private String searcherTag = "searcher";
	static final private String serverUrlTag = "server-url";
	static final private String loggerTag = "logger";

	public static WebAppConfiguration getInstance() {
		if (instance != null) {
			return instance;
		}
		return new WebAppConfiguration();
	}

	/**
	 * The constructor uses the default configuration file paths.
	 */
	private WebAppConfiguration() {
		read(defaultConfigurationFile);
		readCollection(defaultCollectionsList);
	}

	/**
	 * Read the XML configuration file and populate this configuration object.
	 * 
	 * @param config
	 *            The path to the XML configuration file where the configuration
	 *            data is stored.
	 */
	private void read(String config) {
		try {
			SAXParserFactory factory = SAXParserFactory.newInstance();
			SAXParser saxParser = factory.newSAXParser();
			DefaultHandler handler = new DefaultHandler() {

				String searcherClassname = "";
				String loggerClassname = "";

				boolean graphConf = false;
				boolean searchConf = false;

				@Override
				public void startElement(String uri, String localName, String qName, Attributes attributes)
						throws SAXException {

					// parses the 'graph' element
					if (qName.equalsIgnoreCase(graphTag)) {
						graphConf = true;
					}

					// parses a layout element
					if (qName.equalsIgnoreCase(layoutTag) && graphConf) {
						graphLayoutNames.add(attributes.getValue(0));
					}

					// parses the 'search' element
					if (qName.equalsIgnoreCase(searchTag)) {
						searchConf = true;
					}

					// parses the searcher element
					if (qName.equalsIgnoreCase(searcherTag) && searchConf) {
						try {
							searcherClassname = attributes.getValue(0);
							searcher = ((ISearcher) Class.forName(searcherClassname).newInstance());
						} catch (InstantiationException | IllegalAccessException | ClassNotFoundException e) {
							e.printStackTrace();
						}

					}

					// parses the server URL element
					if (qName.equalsIgnoreCase(serverUrlTag) && searchConf) {
						serverUrl = attributes.getValue(0);
					}

					// parses the logger element
					if (qName.equalsIgnoreCase(loggerTag)) {
						try {
							loggerClassname = attributes.getValue(0);
							logger = (ILogger) Class.forName(loggerClassname).newInstance();
						} catch (InstantiationException | IllegalAccessException | ClassNotFoundException e) {
							e.printStackTrace();
						}
					}

					// parses the settings element
					if (qName.equalsIgnoreCase(settingTag)) {
						try {
							settings.add(Integer.parseInt(attributes.getValue(0)));
						} catch (NumberFormatException e) {
							e.printStackTrace();
						}
					}

				}

				@Override
				public void endElement(String uri, String localName, String qName) throws SAXException {

					// end of 'graph' element reached
					if (qName.equalsIgnoreCase(graphTag)) {
						graphConf = false;
					}

					// end of 'search' element reached
					if (qName.equalsIgnoreCase(searchTag)) {
						searchConf = false;
					}
				}
			};

			saxParser.parse(this.getClass().getResource(config).getPath(), handler);
		} catch (ParserConfigurationException | SAXException | IOException e) {
			e.printStackTrace();
		}
	}

	/**
	 * Read the XML collections list file and populate this configuration
	 * object.
	 * 
	 * @param collectionsFile
	 *            The path to the XML file which specifies the collections in
	 *            use.
	 */
	private void readCollection(String collectionsFile) {
		try {
			SAXParserFactory factory = SAXParserFactory.newInstance();
			SAXParser saxParser = factory.newSAXParser();
			DefaultHandler handler = new DefaultHandler() {

				@Override
				public void startElement(String uri, String localName, String qName, Attributes attributes)
						throws SAXException {
					if (qName.equalsIgnoreCase(collectionTag)) {
						String name = attributes.getValue(0);
						String folder = attributes.getValue(1);
						String className = attributes.getValue(2);
						String params = attributes.getValue(3);
						collections.add(new Collection(name, folder, className, params));
					}
				}
			};

			saxParser.parse(this.getClass().getResource(collectionsFile).getPath(), handler);
		} catch (ParserConfigurationException | SAXException | IOException e) {
			e.printStackTrace();
		}
	}

	/**
	 * Get the collection object for the given collection name.
	 * 
	 * @param name
	 *            The name of the collection object we want to retrieve.
	 * @return The collection if found, otherwise null.
	 */
	public Collection getCollection(String name) {
		for (Collection c : collections) {
			if (c.name().equals(name))
				return c;
		}
		return null;
	}

	/**
	 * @return The SOLR server URL.
	 */
	public String solrServerUrl() {
		return serverUrl;
	}

	/**
	 * Returns the graph generator instance for the given user id. If there
	 * exists no instance for the given user yet, a new one is created.
	 * 
	 * @param userID
	 *            The user id for the user whose graph generator instance should
	 *            be returned.
	 * @return If there is a graph generator instance for the given user
	 *         already, the instance is returned. Otherwise a new one is created
	 *         and returned.
	 */
	public IGraphGenerator graphGenerator(String userID, Collection collection) {
		String genID = userID + "_" + collection.name();
		System.out.println("Trying to access the GraphGenerator with ID = " + genID);
		if (GeneratorsContainer.have(genID)) {
			System.out.println("Already created");
			return GeneratorsContainer.get(genID);
		} else {
			try {
				String className = collection.className();
				IGraphGenerator instance = (IGraphGenerator) Class.forName(className).newInstance();
				GeneratorsContainer.put(genID, instance);
				System.out.println("created");
				return instance;
			} catch (InstantiationException | IllegalAccessException | ClassNotFoundException e) {
				e.printStackTrace();
			}
		}

		return null;
	}

	public void removeGraphGenerator(String userID, Collection collection) {
		String genID = userID + "_" + collection.name();
		if (GeneratorsContainer.have(genID))
			GeneratorsContainer.remove(genID);
	}

	/**
	 * @return The graph layout file names which specify the layouts to be used.
	 */
	public List<String> getLayoutNames() {
		return graphLayoutNames;
	}

	/**
	 * @return The application settings specified in the configuration XML file.
	 */
	public List<Integer> getSettings() {
		return settings;
	}

	/**
	 * @return The searcher object which is responsible for searching through
	 *         the document collection.
	 */
	public ISearcher searcher() {
		return searcher;
	}

	/**
	 * @return The logger object which is used for logging.
	 */
	public ILogger logger() {
		return logger;
	}

	/**
	 * @return All collection names specified in the collection.xml file.
	 */
	public List<String> getCollections() {
		List<String> c = new ArrayList<String>();
		for (Collection col : collections) {
			c.add(col.name());
		}
		return c;
	}

}