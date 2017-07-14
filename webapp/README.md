# Graph-based Document Exploration
## webapp module

This module contains backend and frontend parts of the web application. 

### Configuration

Folder `src/main/resource/configs` contains two central configuration files:

* `collections.xml` Definition of document collections and assignment of graph generation modules.
* `config.xml` General settings.

### Build

The whole build process and all Java dependencies are managed by Maven. During a build, NPM and Bower will be automatically downloaded to take care of the dependency management for the frontend code. As a result, a war file will be generated that can be deployed on a web server (e.g. Tomcat).

### Installation

Please follow these steps to setup the system with the default configuration and demo collections:

1. Install Tomcat (or alternative Java web server)
1. Install solr and start solr (`bin/solr start`)
1. Create a new core with `bin/solr create -c documents`
1. Using solr web interface, create the following fields in the new core (select the core, then go to `Schema` and click `Add field`)
    * Name: dc_text, Type: text_general, Properties: indexed, required, stored
    * Name: groupID, Type: string, Properties: indexed, required, stored
    * Name: path, Type: string, Properties: indexed, required, stored
1. Index all documents of the demo collections with solr. Example:
    * `document-indexer config.xml data/enron_orgs enron-orgs`
   Please make sure that the collections name defined during indexing (last parameter) match those used in the `collections.xml` configuration file. For more infos on indexing, please refer to `indexer/README`.
1. Deploy the war file created during the build process to Tomcat.
1. Open the application in your Browser (preferably Chrome).

### Project Structure

The most important code lives here:
* `src/main/java` Java code for backend
* `src/main/resource/configs` configuration files
* `src/main/resource/data` data of demo collections
* `src/main/webapp` code of frontend



