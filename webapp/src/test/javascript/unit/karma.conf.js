module.exports = function(config){
	config.set({
		reporters: ['progress', 'junit'],
		basePath : '../../../',

		files : [
			'main/webapp/vendor/jquery/dist/jquery.min.js',
			'main/webapp/vendor/angular/**.min.js',
			'main/webapp/vendor/angular-route/**.min.js',
			'main/webapp/vendor/angular-cookies/**.min.js',
			'main/webapp/vendor/angular-sanitize/**.min.js',
			'main/webapp/vendor/d3/**.min.js',
			'../node_modules/angular-mocks/angular-mocks.js',

			'main/webapp/js/app/app.module.js',
			'main/webapp/js/app/app.*.js',
			'main/webapp/js/*.js',

			'test/javascript/unit/*.tests.js'
			],

			autoWatch : true,

			frameworks: ['jasmine'],

			browsers : ['Chrome'],

			plugins : [
				'karma-chrome-launcher',
				'karma-jasmine',
				'karma-junit-reporter'
				],

				junitReporter : {
					outputFile: 'test/javascript/reports/unit.xml',
					suite: 'unit'
				}

	});
};
