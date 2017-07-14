# Graph-based Document Exploration
## graphs-ne-impl module

This module is an example implementation of a graph extraction module. It uses Stanford NER to identify entities and extracts graphs based on co-occurrences.

### Implementation

The implementation uses DKPro, a UIMA-based framework that provides access to a variety of linguistic annotation tools, such as Stanford NER. Document collections are preprocessed with it and the annotated data is used an runtime.

### Usage

When adding a new document collection, it has to be preprocessed with `PipelinePreprocessing.java`. Documents with annotations are then serialized as *.bin6-files in the document collection folder and accessed by this module at runtime.

### Create your own graph extraction module

Please follow these steps to add a new graph extraction module:

1. Create a new Maven module and add the `graphs` module as a dependency.
1. In that module, create a class that implements `de.tudarmstadt.ukp.exploration.graph_doc_explorer.graphs.IGraphGenerator`.
    * `initialize` is called once when the graph extractor is initialized and provides the documents returned by the search and the path to the document collection's fils.
    * `addUserAction` is called whenever a user action is reported to the server. The graph extractor can use this information to modify the current graph, if that's desired.
    * `getGraph` can be called by the framework at any time and should return the current state of the extracted graph.
    * Please refer to `StaticEntityGraph` and `DynamicEntityGraph` for example implementations.
1. Add your new module as a dependency to the `webapp` module.
1. In the webapp's `collections.xml`, assign your new class to a document collection.
1. Build and redeploy the webapp.







