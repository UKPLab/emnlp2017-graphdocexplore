package de.tudarmstadt.ukp.exploration.graph_doc_explorer.indexer.application;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

/**
 * IndexApp is a java application that indexes the documents ( txt files ) in the directory
 * given as an argument. The application uses an indexer specified in the configuration XML file.
 * USAGE : ./document-indexer [config_file] [directory]
 * 
 * @author Ramy Hcini
 * @since 10 Dec 2016
 * @version 1.1
 */
public class IndexerApp {
	
	/**
	 * indexer implementing the IDocumentIndexer interface
	 */
	static IDocumentIndexer indexer ;
	/**
	 * arguments handler
	 */
	static IArgumentsHandler argshandler ;
	/**
	 * Configuration class. This class should be a singleton
	 */
	static Configuration config ;
	
	public static void main(String[] args) {
		StringBuilder sb = new StringBuilder() ;
		sb.append("------ Document Indexer Application ----- ").append(System.lineSeparator()) ;
		System.out.println(sb.toString());
		
		if(args.length == 0) {
			sb = new StringBuilder() ;
			sb.append("Usage : ./document-indexer config_filename directory_path [options]") ;
			System.out.println(sb.toString());
			System.exit(0);
		}
		
		String config_filename = args[0] ;
		Path configPath = Paths.get(config_filename) ;
		
		if(!Files.exists(configPath)){
			sb = new StringBuilder() ;
			sb.append("Please use a valid path for the configuration file.").append(System.lineSeparator()) ;
			sb.append("Usage : ./document-indexer config_filename directory_path [options]") ;
			System.out.println(sb.toString());
			System.exit(0);
		}
		
		config = new Configuration(config_filename) ;
		argshandler = config.getArgshandler() ;
		if(argshandler.getNbOfArgs() != args.length) {
			sb = new StringBuilder() ;
			sb.append("Please enter all the required arguments. The application expected " + argshandler.getNbOfArgs() + " but " + args.length + " was given").append(System.lineSeparator()) ;
			sb.append("Usage : ./document-indexer config_filename directory_path [options]") ;
			System.out.println(sb.toString());
			System.exit(0);
		}
		argshandler.setArguments(args);
		
		//TODO: Add the whole Solr management here to improve usability
		
		indexer = config.getIndexer() ;
		indexer.indexDocuments(argshandler) ;
		
		System.out.println("-------- Specified documents indexed ------- ");
	}

}
