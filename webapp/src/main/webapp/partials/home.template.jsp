<div ng-cloack class="row" ng-show="loading()" ng-hide="!loading()">
	<div class="col-md-5"></div>
	<div class="spinner"></div>
</div>

<div id="search-box-wrapper" class="row" ng-hide="loading()" ng-show="!loading()">
	<div class="form-group">
		<div class="col-md-2"></div>
		<div class="col-md-8">
			<h3>Welcome</h3>
			<br/>
			<p>
			This is a demo of the graph-based document exploration system for EMNLP 2017.
			</p>
			<br/>
			<p>
			You can try the system with the following example collections:
			</p>
			<table class="table" style="font-size: 0.9em">
			    <thead>
			      <tr>
			        <th>Name</th>
			        <th>Documents</th>
			        <th>Node Type</th>
			        <th>Edge Type</th>
			        <th>Graph Type</th>
			        <th>Nodes</th>
			        <th>Edges</th>
			      </tr>
			    </thead>
			    <tbody>
			      <tr>
			        <td>studentloans-cmap</td>
			        <td>37 web pages on student loans</td>
			        <td>Concept<sup>1</sup></td>
			        <td>Labeled Relation<sup>1</sup></td>
			        <td>static</td>
			        <td>25</td>
			        <td>28</td>
			      </tr>
			      <tr>
			        <td>studentloans-orgs</td>
			        <td>37 web pages on student loans</td>
			        <td>Organization<sup>2</sup></td>
			        <td>Co-occurrence</td>
			        <td>static</td>
			        <td>188</td>
			        <td>232</td>
			      </tr>
			      <tr>
			        <td>enron-orgs</td>
			        <td>1000 mails from the Enron corpus</td>
			        <td>Organization<sup>2</sup></td>
			        <td>Co-occurrence</td>
			        <td>static</td>
			        <td>162</td>
			        <td>406</td>
			      </tr>
			      <tr>
			        <td>enron-persons</td>
			        <td>1000 mails from the Enron corpus</td>
			        <td>Person<sup>2</sup></td>
			        <td>Co-occurrence</td>
			        <td>dynamic</td>
			        <td>-</td>
			        <td>-</td>
			      </tr>
			    </tbody>
			</table>
			<p style="font-size: 0.8em">
				<sup>1</sup> based on manual annotations of concepts and relations, see: <a target="_blank" href="https://arxiv.org/abs/1704.04452">Bringing Structure into Summaries: Crowdsourcing a Benchmark Corpus of Concept Maps</a>
			</p>
			<p style="font-size: 0.8em">
				<sup>2</sup> as automatically detected by the Stanford Named Entity Recognizer (<a target="_blank" href="https://nlp.stanford.edu/software/CRF-NER.shtml">website</a>)
			</p>
			<br/><br/>
			<label class="control-label" for="groupID">Document Collection</label>
			<select name="groupID" class="search-field form-control input-lg" ng-model="groupID"
				ng-keyup="$event.keyCode == 13 && search()" ng-change="setGroupID()">
				<option ng-repeat="g in groups()" value="{{g}}">{{g}}</option>
			</select>
			<br>
			<div class="input-group">
				<input type="text" class="search-field form-control input-lg"
					ng-model="searchword" placeholder="Search for ..."
					ng-keyup="$event.keyCode == 13 && search()"> <span
					class="input-group-btn">
					<button class="btn btn-lg btn-danger" type="button"
						ng-click="search()">
						<span class="glyphicon glyphicon-search" aria-hidden="true"></span>
					</button>
				</span>
			</div>
			<br/><br/>
			<p>
			This demo is provided by the DFG research training group AIPHES (Adaptive Information Preparation from Heterogeneous Sources, <a target="_blank" href="https://www.aiphes.tu-darmstadt.de/de/aiphes/">www.aiphes.tu-darmstadt.de</a>) and UKP Lab, Technische Universität Darmstadt (<a target="_blank" href="https://www.ukp.tu-darmstadt.de">www.ukp.tu-darmstadt.de</a>).
			</p>
			<p>
			For questions, please contact <a target="_blank" href="https://www.aiphes.tu-darmstadt.de/de/aiphes/people/doctoral-researchers/tobias-falke/">Tobias Falke</a>
			</p>
		</div>
		<div class="col-md-2"></div>
	</div>
</div>
<div class="row" ng-hide="loading" ng-show="!loading">
	<div class="col-md-12">
		<img src="img/institutes.png" class="img-responsive center-block"
			alt="Partner institutes">
	</div>
</div>
