function fix_height(jQuery) {
	(function($){

		var height = 0;
		height = Math.ceil($(window).height() -  $('footer').height() - $('#search-field-wrapper').height() ) - 120; // $('header').height() 
		
		var titleOffset = 50 ;
		$('#results-wrapper').height(height);
		
		$('#document-wrapper').height(height);
		$('#document-wrapper .document-container').height(height-titleOffset);
		
		$('#graph-container').height(height);
		
	 })(jQuery);
	
	
}

/**
 * get maximum height for search results
 * @param jQuery
 * @returns
 */
function hide_header(jQuery) {
	$('header').css('display', 'none');
}

function show_header(jQuery) {
	$('header').css('display', '') ;
}


 