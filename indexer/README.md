# Graph-based Document Exploration
## indexer module

This module contains a simple command-line tool to index a document collection in Solr as needed for the application.

### Build

Maven will create an executable jar of this module that can be used from a command prompt. 

### Usage

The executable can be invoked as follows:

* `document-indexer <path-to-config.xml> <path-to-document-folder> <collection-name>`

An example for the `config.xml` can be found in `de/tudarmstadt/ukp/exploration/graph_doc_explorer/indexer/config/config.xml`.

Please make sure that
* the config.xml points to the correct core of your solr installation
* the webapp's collection.xml refers to the collection with the name defined here during indexing as the third parameter

