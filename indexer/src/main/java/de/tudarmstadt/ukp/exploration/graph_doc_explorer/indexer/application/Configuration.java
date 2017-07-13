package de.tudarmstadt.ukp.exploration.graph_doc_explorer.indexer.application;

import java.io.IOException;

import javax.xml.parsers.ParserConfigurationException;
import javax.xml.parsers.SAXParser;
import javax.xml.parsers.SAXParserFactory;

import org.xml.sax.Attributes;
import org.xml.sax.SAXException;
import org.xml.sax.helpers.DefaultHandler;

public class Configuration {
	IDocumentIndexer indexer ;
	IArgumentsHandler argshandler ;
	String serverUrl ; 
	
	final private String indexTag = "indexer" ;
	final private String argshandlerTag = "arguments-handler" ;
	final private String serverUrlTag = "server-url" ;

	public Configuration(String filename) {
		try {
			SAXParserFactory factory = SAXParserFactory.newInstance();
			SAXParser saxParser = factory.newSAXParser();
			DefaultHandler handler = new DefaultHandler() {
				String indexerClassname = "" ;
				String handlerClassname = "" ;
				
				public void startElement(String uri, String localName,String qName,
						Attributes attributes) throws SAXException {
					if(qName.equalsIgnoreCase(indexTag)){ 
						try {
							indexerClassname = attributes.getValue(0) ; // we have only 1 attribute
							indexer = (IDocumentIndexer) Class.forName(indexerClassname).newInstance();
						} catch (InstantiationException | IllegalAccessException | ClassNotFoundException e) {
							e.printStackTrace();
						}
						 
					}
					if(qName.equalsIgnoreCase(argshandlerTag)) { 
						try {
							handlerClassname = attributes.getValue(0) ;
							argshandler = (IArgumentsHandler) Class.forName(handlerClassname).newInstance();
						} catch (InstantiationException | IllegalAccessException | ClassNotFoundException e) {
							e.printStackTrace();
						}
					}
					
					if(qName.equalsIgnoreCase(serverUrlTag)){
						serverUrl = attributes.getValue(0) ;
					}
				}
			} ;
			
			saxParser.parse(filename, handler);
		} catch (ParserConfigurationException | SAXException | IOException e) {
			e.printStackTrace();
		}
	}
	
	/**
	 * @return the indexer
	 */
	public IDocumentIndexer getIndexer() {
		return indexer;
	}
	/**
	 * @return the arghandler
	 */
	public IArgumentsHandler getArgshandler() {
		argshandler.setServerUrl(serverUrl);
		return argshandler;
	}

}
