package de.tudarmstadt.ukp.exploration.graph_doc_explorer.indexer.application;

import java.nio.file.Path;

/**
 * ArgumentsHandler interface that will be used by the core application to handle the arguments
 * given to the application
 * @author Ramy Hcini
 * @since 20 Dec 2016
 * @version 1.0
 */
public interface IArgumentsHandler {
	/**
	 * sets the arguments received from the command line
	 * @param args an array of arguments
	 */
	public void setArguments(String[] args) ;
	/**
	 * @return the path of the directory containing the text files to be indexed
	 */
	public Path getDirectoryPath() ;
	
	/**
	 * @return the number of expected arguments
	 */
	public int getNbOfArgs() ;
	
	/**
	 * Sets the server url from the config file
	 * @param url
	 */
	public void setServerUrl(String url) ;
	/**
	 * @return the server url
	 */
	public String getServerUrl() ;
	
	/**
	 * @param key is the name of the argument to get, used to enable classes to have optional and special arguments
	 * @return the value of the argument with the key key
	 */
	public String get(String key) ;
}
