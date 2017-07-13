package de.tudarmstadt.ukp.exploration.graph_doc_explorer.graphs_ne_impl;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.InputStream;

import org.apache.uima.UIMAException;
import org.apache.uima.cas.impl.Serialization;
import org.apache.uima.fit.factory.JCasFactory;
import org.apache.uima.jcas.JCas;

import de.tudarmstadt.ukp.dkpro.core.api.metadata.type.DocumentMetaData;
import de.tudarmstadt.ukp.exploration.graph_doc_explorer.graphs.SearchResult;

public class UimaUtil {

	public static JCas createCas(SearchResult doc) {

		JCas jCas = UimaUtil.createEmptyCas();
		jCas.setDocumentLanguage("en");
		jCas.setDocumentText(doc.text());

		DocumentMetaData docMetaData = DocumentMetaData.create(jCas);
		docMetaData.setDocumentId(doc.id());

		return jCas;

	}

	public static JCas createEmptyCas() {
		try {
			JCas jCas = JCasFactory.createJCas();
			return jCas;
		} catch (UIMAException e) {
			e.printStackTrace();
			return null;
		}
	}

	public static JCas readBinCas(File binFile, JCas jcas) {
		try {
			InputStream in = new FileInputStream(binFile);
			Serialization.deserializeCAS(jcas.getCas(), in);
			return jcas;
		} catch (FileNotFoundException e) {
			e.printStackTrace();
			return null;
		}
	}

}
