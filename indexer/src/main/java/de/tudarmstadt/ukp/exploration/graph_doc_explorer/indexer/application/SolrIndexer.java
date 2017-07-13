package de.tudarmstadt.ukp.exploration.graph_doc_explorer.indexer.application;

import java.io.IOException;
import java.nio.file.DirectoryStream;
import java.nio.file.Files;
import java.nio.file.Path;

import org.apache.commons.io.Charsets;
import org.apache.commons.io.FileUtils;
import org.apache.solr.client.solrj.SolrClient;
import org.apache.solr.client.solrj.SolrServerException;
import org.apache.solr.client.solrj.impl.HttpSolrClient;
import org.apache.solr.common.SolrInputDocument;

public class SolrIndexer implements IDocumentIndexer {
	@Override
	public void indexDocuments(IArgumentsHandler handler) {
		Path directory = handler.getDirectoryPath();
		String urlString = handler.getServerUrl();

		try (DirectoryStream<Path> stream = Files.newDirectoryStream(directory, "*.txt")) {
			SolrClient solr = new HttpSolrClient.Builder(urlString).build();
			for (Path entry : stream) {
				System.out.println("Indexing the file " + entry.getFileName());

				SolrInputDocument doc = new SolrInputDocument();
				String fileName = entry.getFileName().toString();
				String groupID = handler.get("groupID");
				String text = FileUtils.readFileToString(entry.toFile(), Charsets.UTF_8);

				doc.addField("id", groupID + "_" + fileName);
				doc.addField("name", fileName.substring(0, fileName.lastIndexOf('.')));
				doc.addField("groupID", groupID);
				doc.addField("dc_text", text);
				doc.addField("path", directory);

				try {
					solr.add(doc);
				} catch (SolrServerException e) {
					e.printStackTrace();
				}
			}
			try {
				// commit changes
				solr.commit();
			} catch (SolrServerException e) {
				e.printStackTrace();
			}
		} catch (IOException x) {
			// it can only be thrown by newDirectoryStream.
			System.err.println(x);
		}
	}

}
