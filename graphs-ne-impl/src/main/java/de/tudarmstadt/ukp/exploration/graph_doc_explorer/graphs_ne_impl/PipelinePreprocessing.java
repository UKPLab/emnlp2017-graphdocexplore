package de.tudarmstadt.ukp.exploration.graph_doc_explorer.graphs_ne_impl;

import java.io.IOException;

import org.apache.uima.UIMAException;
import org.apache.uima.analysis_engine.AnalysisEngineDescription;
import org.apache.uima.collection.CollectionReaderDescription;
import org.apache.uima.fit.factory.AnalysisEngineFactory;
import org.apache.uima.fit.factory.CollectionReaderFactory;
import org.apache.uima.fit.pipeline.SimplePipeline;

import de.tudarmstadt.ukp.dkpro.core.io.bincas.BinaryCasWriter;
import de.tudarmstadt.ukp.dkpro.core.io.text.TextReader;
import de.tudarmstadt.ukp.dkpro.core.stanfordnlp.StanfordNamedEntityRecognizer;
import de.tudarmstadt.ukp.dkpro.core.stanfordnlp.StanfordPosTagger;
import de.tudarmstadt.ukp.dkpro.core.stanfordnlp.StanfordSegmenter;

/**
 * Preprocessing Pipeline
 * 
 * prepares text documents to be used with a graph generator
 * creates a *.bin6 file for every *.txt file in the given folder
 * 
 * arguments:
 * - path to folder with *.txt files
 * 
 */
public class PipelinePreprocessing {

	public static String textFolder = "../webapp/src/main/resources/data/enron_orgs";
	public static final String[] textPattern = { "*.txt" };

	public static void main(String[] args) throws UIMAException, IOException {

		if (args.length > 0)
			textFolder = args[0];

		CollectionReaderDescription reader = CollectionReaderFactory.createReaderDescription(TextReader.class,
				TextReader.PARAM_SOURCE_LOCATION, textFolder, TextReader.PARAM_PATTERNS, textPattern,
				TextReader.PARAM_LANGUAGE, "en");

		AnalysisEngineDescription segmenter = AnalysisEngineFactory.createEngineDescription(StanfordSegmenter.class);
		AnalysisEngineDescription pos = AnalysisEngineFactory.createEngineDescription(StanfordPosTagger.class);
		AnalysisEngineDescription ner = AnalysisEngineFactory
				.createEngineDescription(StanfordNamedEntityRecognizer.class);

		AnalysisEngineDescription writer = AnalysisEngineFactory.createEngineDescription(BinaryCasWriter.class,
				BinaryCasWriter.PARAM_TARGET_LOCATION, textFolder, BinaryCasWriter.PARAM_STRIP_EXTENSION, false,
				BinaryCasWriter.PARAM_FILENAME_EXTENSION, ".bin6", BinaryCasWriter.PARAM_OVERWRITE, true,
				BinaryCasWriter.PARAM_FORMAT, "6");

		SimplePipeline.runPipeline(reader, segmenter, pos, ner, writer);
	}

}