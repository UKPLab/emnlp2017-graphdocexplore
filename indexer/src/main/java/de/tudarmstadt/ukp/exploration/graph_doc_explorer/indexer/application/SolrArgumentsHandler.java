package de.tudarmstadt.ukp.exploration.graph_doc_explorer.indexer.application;

import java.io.IOException;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.HashMap;


/**
 * Concrete implementation of the interface IArgumentsHandler
 * for Solr arguments
 * @author Ramy Hcini
 * @since 20 Dec 2016
 * @version 1.0
 */
public class SolrArgumentsHandler implements IArgumentsHandler {
	/**
	 * directory path
	 */
	private Path directoryPath ;

	private HashMap<String, String> specialArgs = new HashMap<String, String>();
	
	/**
	 * solr server url
	 */
	private String serverUrl ;
	
	final private int nbOfArgs = 3 ;
	
	public SolrArgumentsHandler() {
		// DEFAULT VALUES
		directoryPath = Paths.get("data") ;
		specialArgs.put("groupID", "default") ;
	}

	@Override
	public void setArguments(String[] args) {	
		// 2. argument = directory path
		String directoryName = args[1] ;
		try {
			directoryPath = Paths.get(directoryName).toRealPath();
		} catch (IOException e) {
			e.printStackTrace();
		}

		// 3. argument = groupID
		specialArgs.put("groupID",args[2]) ;
	}

	@Override
	public Path getDirectoryPath() {
		return directoryPath;
	}
	
	@Override
	public int getNbOfArgs() {
		return nbOfArgs;
	}

	@Override
	public void setServerUrl(String url) {
		serverUrl = url ;
	}

	@Override
	public String getServerUrl() {
		return serverUrl;
	}

	@Override
	public String get(String key) {
		return specialArgs.get(key) ;
	}

}
