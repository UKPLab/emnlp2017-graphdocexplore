
<!-- Notification modal -->
<div class="modal fade" id="graphNotify" tabindex="-1" role="dialog" aria-labelledby="graphNotifyLabel">
  <div class="modal-dialog" role="document">
    <div class="modal-content">
      <div class="modal-header" style="text-align:center;">
        <button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
        <h4 class="modal-title" id="graphNotifyLabel">System notification </h4>
      </div>
      <div class="modal-body" style="text-align:center;">
		<p>A new graph is available!</p>
		<p>Press the reload button right next to the search input field to update your graph.</p>
		<img src="img/updateGraph.png" alt="[update graph button location]" style="width:254px;height:71px;border: 2px solid black;">
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-default" data-dismiss="modal">Close</button>
      </div>
    </div>
  </div>
</div>

<div id="search-field-wrapper" class="row">
	<div class="form-group">
		<div class="col-md-2">
			<button
				class="btn btn-lg"
				type="button"
				ng-class="{'active': serviceInUse == 0,'btn-danger': serviceInUse != 0}"
				ng-style="{'color': (serviceInUse == 0)? '#4085a8' : 'white','background-color': (serviceInUse == 0)? 'white' : '#c12e2a'}"
				ng-click="setService(0)"
				data-toggle="tooltip"
				data-placement="bottom"
				title="Switch to global graph layout.">
				<span class="glyphicon glyphicon-globe" aria-hidden="true"></span>
			</button>		
			<button
				class="btn btn-lg"
				type="button"
				ng-class="{'active': serviceInUse == 1,'btn-danger': serviceInUse != 1}"
				ng-style="{'color': (serviceInUse == 1)? '#4085a8' : 'white','background-color': (serviceInUse == 1)? 'white' : '#c12e2a'}"
				ng-click="setService(1)"
				data-toggle="tooltip"
				data-placement="bottom"
				title="Switch to neighbour-only graph layout.">
					<span class="glyphicon glyphicon-screenshot" aria-hidden="true"></span>
			</button>
			<button id="refreshButton" 
				class="btn btn-lg btn-danger loadGraph"
				type="button"
				ng-class="{'disabled': !updateAvailable}"
				ng-click="loadNewGraph()"
				data-toggle="tooltip"
				data-placement="bottom"
				title="Update the graph.">
				<span class="glyphicon glyphicon-refresh" aria-hidden="true"></span>
			</button>			
		</div>
		<div class="col-md-8">
			<div class="input-group">
				<input type="text" class="search-field form-control input-lg" ng-model="searchword" placeholder="Search for ..." ng-keyup="$event.keyCode == 13 && search()">
				<span class="input-group-btn">
					<button
						class="btn btn-lg btn-danger"
						type="button"
						ng-click="search()"
						data-toggle="tooltip"
						data-placement="bottom"
						title="Perform a search for the entered keyword.">
						<span class="glyphicon glyphicon-search" aria-hidden="true"></span>
					</button>
				</span>
			</div>

		</div>
		<div class="col-md-2">
			<button
				class="btn btn-lg"
				type="button"
				ng-class="{'active': searchwordHighlightOn,'btn-danger': !searchwordHighlightOn}"
				ng-style="{'color': searchwordHighlightOn? '#4085a8' : 'white','background-color': searchwordHighlightOn? 'white' : '#c12e2a'}"
				ng-click="searchwordHighlightingSwitch()"
				data-toggle="tooltip"
				data-placement="bottom"
				title="Toggle searchword highlighting in documents.">
				<span class="glyphicon glyphicon-erase" aria-hidden="true"></span>
			</button>
		</div>
	</div>
</div>
<div ng-cloack class="row" ng-show="isLoading()" ng-hide="!isLoading()">
	<div class="col-md-5"></div>
	<div class="spinner"></div>
</div>

<div ng-cloak class="row" ng-hide="isLoading()">

	<!-- filter bar which contains the document tags -->
	<div id="tag-filter-wrapper">
		<span id="filterTagListPlaceholder" class="tagListElement" ng-hide="tags.length > 0" style='cursor:default;color:white;background:white;border-color:white'>&nbsp;</span>
		<ul class='filterTagList'>
			<li class='tagListElement' ng-mouseenter="tagMouseEnter(tag)" ng-mouseleave="tagMouseLeave()" ng-repeat='tag in tags' style='color:{{tag.fontColor}};background:{{tag.backgroundColor}};border-color:{{tag.borderColor}}'>
				<span class='filterTagText' data-toggle="tooltip" data-placement="bottom" title="Toggle document filtering." ng-click='flipFilterTag(tag)'>{{tag.label}}</span>
				<span class='filterTagButton' ng-click='removeTag(tag.id); tagMouseLeave()'>&#10006;</span>
			</li>
		</ul>
	</div>

	<div id="empty-results" ng-show="emptyResults()" class="col-md-12">
		<p>No results found for the keyword <b><i>{{currentSearchword()}}</i></b>.</p>
	</div>
	
	<div id="graph-wrapper" class="col-md-6" ng-hide="emptyResults()">
		<div class="graph-spinner">
			<div class="bounce1"></div>
			<div class="bounce2"></div>
			<div class="bounce3"></div>
		</div>	
		<!-- GRAPH -->
		<div id="graph-container"></div>
	</div>
	<div id="results-wrapper" class="col-md-6" ng-hide="emptyResults() || viewDoc">
		<!-- Results template -->
		<div id="notifications" class="row">
			<div id="searchInformation" class="col-md-12 search-information">
				<samp>
				<!-- different samps for plural s handling -->
					<samp ng-show='nbOfResults() == 1'><b>1</b> document found for the keyword <b>{{currentSearchword()}}</b></samp>
					<samp ng-show='nbOfResults() != 1'><b>{{nbOfResults()}}</b> documents found for the keyword <b>{{currentSearchword()}}</b></samp>
					<samp ng-show='(nbOfResults() - nbOfFilteredOutDocs()) == 1 && (nbOfFilteredOutDocs() > 0)'>| <b>1</b> document shown</samp>
					<samp ng-show='(nbOfResults() - nbOfFilteredOutDocs()) !=  1 && (nbOfFilteredOutDocs() > 0)'>| <b>{{nbOfResults() - nbOfFilteredOutDocs()}}</b> documents shown</samp>
				</samp>
				<br>
				<samp ng-show="nbOfHighlightedDocs() > 0"><b>{{nbOfHighlightedDocs()}}</b> documents highlighted from the graph</samp>
			</div>
		</div>
		<div class="results-list-container">
			<div id="{{r.title}}" ng-repeat="(id, r) in results" class="result-container row" ng-hide="isFilteredOut(r)">
				<div class="col-md-12">
				
					<h3 ng-bind-html="trustAsHtml(r.title)">#</h3>
					
					<div class="littleTagBar">
						<ul class='tagList'>
							<li class='tagListElement' data-toggle="tooltip" data-placement="bottom" title="Center corresponding graph element." ng-mouseenter="tagMouseEnter(tag)" ng-mouseleave="tagMouseLeave()" ng-repeat="tag in tags | tagInDocument : r.title" style='color:{{tag.fontColor}};background:{{tag.backgroundColor}};border-color:{{tag.borderColor}}'>
								<span class="documentTag" ng-click="centerNode(tag)">{{tag.label}} ({{tagCount(tag, r.title)}})</span>
							</li>
						</ul>
					</div>
					
					<p>	
						<samp>
							<span ng-repeat="span in getSnippet(r)" class="{{span.class}}" ng-mouseenter="spanMouseEnter(span.class)" ng-mouseleave="spanMouseLeave()" ng-click="centerSpan(span.class)">{{span.text}}</span>
						</samp>
						<br>
						<button
							class="btn btn-sm btn-danger view-doc-btn"
							type="button"
							ng-click="viewDocument(r.id)"
							data-toggle="tooltip"
							data-placement="left"
							title="Show entire document.">
							<span class="glyphicon glyphicon-file" aria-hidden="true"></span>
						</button>
					</p>
					
				</div>
			</div>
		</div>
	</div>

	<button
		class="btn btn-sm btn-danger back-results-btn"
		id="backToResults"
		type="button"
		ng-click="backToResults()"
		data-toggle="tooltip"
		data-placement="left"
		title="Go back to document list.">
		<span class="glyphicon glyphicon-list" aria-hidden="true"></span>
	</button>

	
	<div id="document-wrapper" class="col-md-6" ng-show="viewDoc && !emptyResults()" ng-hide="!viewDoc || emptyResults()">
		<!-- View document template -->
		<button class="btn btn-sm btn-danger back-results-btn" id="backToResults" type="button"	ng-click="backToResults()">
			<span class="glyphicon glyphicon-list" aria-hidden="true"></span>
		</button>
		<div class="document-header">
				<h3 id="{{document.id}}" ng-bind-html="trustAsHtml(document.title)">#</h3>
		</div>
		<div class="document-container">
			<div class="document-body">
				<samp>
					<span ng-repeat="span in spans" class="{{span.class}}" ng-mouseenter="spanMouseEnter(span.class)" ng-mouseleave="spanMouseLeave()" ng-click="centerSpan(span.class)">{{span.text}}</span>
				</samp>
			</div>
		</div>
	</div>
</div>