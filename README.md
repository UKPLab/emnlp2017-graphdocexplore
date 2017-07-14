# Graph-based Document Exploration

This repository contains the GraphDocExplore framework. GraphDocExplore provides 
* an intuitive web interface for graph-based document exploration
* a generic interface to plug in different methods to extract graphs from text
* an example implementations of this interface that creates entity graphs
* extensive logging capabilities to support user studies

You can access a demo of the user interface [here](http://cmaps.ukp.informatik.tu-darmstadt.de/graph-doc-explorer/#!/).

For more details on the features of this framework, please refer to our [publication at EMNLP 2017](https://www.ukp.tu-darmstadt.de/publications/?no_cache=1&tx_dppublications_pi1%5Bpublication%5D=10518&tx_dppublications_pi1%5Baction%5D=show&tx_dppublications_pi1%5Bcontroller%5D=Publication&cHash=31cb6bc7dfbe23b24d6eaa4043be39d0#dp_publications-single).

Please use the following citation if you make use of the framework in your own work:

```
@inproceedings{TUD-CS-2017-0153,
	title = {GraphDocExplore: A Framework for the Experimental Comparison of Graph-based Document Exploration Techniques},
	author = {Falke, Tobias and Gurevych, Iryna},
	booktitle = {Proceedings of the 2017 Conference on Empirical Methods in Natural Language Processing (EMNLP)},
	pages = {(to appear)},
	year = {2017},
	location = {Copenhagen, Denmark}
}
```

> **Abstract:** Graphs have long been proposed as a tool to browse and navigate in a collection of documents in order to support exploratory search. Many techniques to automatically extract different types of graphs, showing for example entities or concepts and different relationships between them, have been suggested. While experimental evidence that they are indeed helpful exists for some of them, it is largely unknown which type of graph is most helpful for a specific exploratory task. However, carrying out experimental comparisons with human subjects is challenging and time-consuming. Towards this end, we present the GraphDocExplore framework. It provides an intuitive web interface for graph-based document exploration that is optimized for experimental user studies. Through a generic graph interface, different methods to extract graphs from text can be plugged into the system. Hence, they can be compared at minimal implementation effort in an environment that ensures controlled comparisons. The system is publicly available under an open-source license.


**Contacts** 
  * Tobias Falke, lastname@aihphes.tu-darmstadt.de
  * https://www.ukp.tu-darmstadt.de
  * https://www.aiphes.tu-darmstadt.de

Don't hesitate to send us an e-mail or report an issue, if something is broken (and it shouldn't be) or if you have further questions.

> This repository contains experimental software and is published for the sole purpose of giving additional background details on the respective publication. 

## Project Structure and Usage

The framework is built in Java (backend) and AngularJS (web UI). Documents are indexed and searched with Solr.

It is a Java Maven project with several modules:
* `graphs` central Java data structures, used by the webapp and graph extraction modules
* `webapp` backend and frontend code of web application
* `indexer` simple command-line application to index documents in Solr
* `graphs-ne-impl` example implementation of a graph extraction module, creating entity co-occurence graphs with Stanford NER
For more details, please refer to the respective modules README file. 

To build the full project, run Maven for the parent POM (this folder), which should compile, test and package all modules. The war created in the webapp module can then be deployed on a webserver (e.g. Tomcat).

For instructions to setup the system in your environment, please refer to `webapp/README.md`.



