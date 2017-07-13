<%@ taglib uri="http://java.sun.com/jsp/jstl/core" prefix="c"%>
<%@ taglib prefix="spring" uri="http://www.springframework.org/tags"%>
<!doctype html>
<html lang="en" ng-app="searchApp">
<head>
<meta charset="utf-8">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Graph-based Document Exploration</title>

<!-- Bootstrap - CSS -->
<spring:url value="/vendor/bootstrap/dist/css/bootstrap.min.css"
	var="bootstrapCss" />
<spring:url value="/vendor/bootstrap/dist/css/bootstrap-theme.min.css"
	var="bootstrapTheme" />
<link rel="stylesheet" href="${bootstrapCss}">
<link rel="stylesheet" href="${bootstrapTheme}">
<!-- HTML5 shim and Respond.js for IE8 support of HTML5 elements and media queries -->
<!-- WARNING: Respond.js doesn't work if you view the page via file:// -->
<!--[if lt IE 9]>
	      <script src="https://oss.maxcdn.com/html5shiv/3.7.3/html5shiv.min.js"></script>
	      <script src="https://oss.maxcdn.com/respond/1.4.2/respond.min.js"></script>
	    <![endif]-->

<!-- custom css -->
<!-- TODO : Minify the css -->
<spring:url value="/css/custom.css" var="customCss" />
<link rel="stylesheet" href="${customCss}">

<!-- Angular JS -->
<spring:url value="/vendor/angular/angular.min.js" var="angularJS" />
<spring:url value="/vendor/angular-route/angular-route.min.js"
	var="angularRoute" />
<spring:url value="/vendor/angular-sanitize/angular-sanitize.min.js"
	var="angularSanitize" />
	<spring:url value="/vendor/angular-cookies/angular-cookies.min.js"
	var="angularCookies" />
<spring:url value="/js/app/app.module.js" var="angularJSappModule" />
<spring:url value="/js/app/app.config.js" var="angularJSappConfig" />
<spring:url value="/js/app/app.services.js" var="angularJSappServices" />
<spring:url value="/js/app/app.controllers.js" var="angularJSappControllers" />

<script src="${angularJS}"></script>
<script src="${angularRoute }"></script>
<script src="${angularSanitize }"></script>
<script src="${angularCookies }"></script>
<script src="${angularJSappModule }"></script>
<script src="${angularJSappConfig }"></script>
<script src="${angularJSappServices }"></script>
<script src="${angularJSappControllers }"></script>

<!-- Add graph layouts here. -->

<spring:url value="/js/app/app.DefaultGraphService.js" var="DefaultGraphService" />
<spring:url value="/js/app/app.D3ForceGraphService.js" var="D3ForceGraphService" />
<spring:url value="/js/app/app.D3NeighbourOnlyGraphService.js" var="D3NeighbourOnlyGraphService" />

<script src="${DefaultGraphService }"></script>
<script src="${D3ForceGraphService }"></script>
<script src="${D3NeighbourOnlyGraphService }"></script>

<!-- D3 -->
	<spring:url value="/vendor/d3/d3.min.js" var="d3Js" />
	<script src="${d3Js} "></script>
<!-- END D3 -->
</head>
<body>
	<div class="container-fluid">
		<div class="row">
			<div class="top-border"></div>
		</div>
		<header class="row">
			<!--<div class="form-group">
				<div class="col-md-2"></div>
				<div class="col-md-8">
					<div class="input-group">
						<input type="text" class="search-field form-control input-lg"
							ng-model="keyword" placeholder="Search for ..."
							ng-keyup="$event.keyCode == 13 && search()"> <span
							class="input-group-btn">
							<button class="btn btn-lg btn-danger" type="button"
								ng-click="search()">
								<span class="glyphicon glyphicon-search" aria-hidden="true"></span>
							</button>
						</span>
					</div>
				</div>
				<div class="col-md-2"></div>
			</div>-->
			<div class="col-md-12">
				<h1>Graph-based Document Exploration</h1>
			</div>
		</header>
		<!-- Angular JS view -->
		<div id="main" ng-view></div>
		<footer ng-controller="FooterController" class="row">
			<div>
				<ul>
					<li><a ng-click="backToHome()" href="">Home</a></li>
					<li>|</li>
					<li>User ID: <b><span ng-bind="uuid()"></span></b></li>
					<li>|</li>
					<li>Document Collection: <b><span ng-bind="groupID()"></span></b></li>
				</ul>
			</div>
		</footer>
	</div>
	<!-- jQuery (necessary for Bootstrap's JavaScript plugins) -->
	<spring:url value="/vendor/jquery/dist/jquery.min.js" var="jqueryJs" />
	<spring:url value="/vendor/bootstrap/dist/js/bootstrap.min.js"
		var="bootstrapJs" />
	<script src="${jqueryJs }"></script>
	<!-- Bootstrap - JS -->
	<script src="${bootstrapJs }"></script>



	<spring:url value="/js/domains.js" var="domainsJS" />
	<script src="${domainsJS }"></script>

	<spring:url value="/js/custom.js" var="customJS" />
	<script src="${customJS }"></script>
</body>
</html>