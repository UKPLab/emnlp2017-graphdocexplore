package de.tudarmstadt.ukp.exploration.graph_doc_explorer.webapp.application.graph.parser;

import static org.junit.Assert.assertEquals;

import org.junit.Test;

import de.tudarmstadt.ukp.exploration.graph_doc_explorer.webapp.application.graph.parser.SampleDataParser;

public class SampleDataParserTest {

	@Test
	public void testOrg() {
		SampleDataParser p = new SampleDataParser();
		p.setVerbose(true);
		assertEquals(true, p.parse());
		assertEquals(25, p.getGraph().nodes().size());
		assertEquals(28, p.getGraph().edges().size());

	}

	@Test
	public void testPersons1() {
		SampleDataParser p = new SampleDataParser();
		p.setSrc("/graph/persons1.graph");
		p.setVerbose(true);
		assertEquals(true, p.parse());
		assertEquals(13, p.getGraph().nodes().size());
		assertEquals(24, p.getGraph().edges().size());
	}

	@Test
	public void testPersons2() {
		SampleDataParser p = new SampleDataParser();
		p.setSrc("/graph/persons2.graph");
		p.setVerbose(true);
		assertEquals(true, p.parse());
		assertEquals(188, p.getGraph().nodes().size());
		assertEquals(179, p.getGraph().edges().size());
	}

}
