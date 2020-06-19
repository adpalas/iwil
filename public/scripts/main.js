/* jQuery scripting for animations, and passing ajax requests to the app server */

// Methods

function openPopup(button) {
	$(button).click(element => {
		$("#addToWatchlist").css("display", "flex");
	}); // When the user clicks on the .addToWatchlistButton button, open #addToWatchlist

	$("#close").click(element => {
		$("#addToWatchlist").css("display", "none");
		$(".watchlist-content button").off(); // Don't forget to remove event handlers from the watchlists when done. Avoid multiple db writes
	}); // When the user clicks on #close, close #addToWatchlist

	$("#addToWatchlist").click(function(element) {
		if(element.target.id === "addToWatchlist") {
			$("#addToWatchlist").css("display", "none");
			$(".watchlist-content button").off(); // Don't forget to remove event handlers from the watchlists when done. Avoid multiple db writes
		} // checks if the click is outside addToWatchlist-content
	}); // When the user clicks outside addToWatchlist-content, close #addToWatchlist
} // A method that will initilize onclick events for buttons designated for opening/closing the #addToWatchlist popup


function addToWatchlist(button) {
	$(button).click(element => {
		// Retrieve value and name attrbutes from the addToWatchlist button of a selection. This provides the info for ajax request
		const selection	= $(element.currentTarget).val(),
			  state 	= $(element.currentTarget).attr("name");
		
		if (state === "Add") {
			$(".watchlist-content button").click(element => {
				const id = $(element.currentTarget).val(); // Retrieve value attrbutes from a watchlist. This provides the info for ajax request
				
				console.log("Adding " + JSON.parse(selection).imdbID + " to watchlist " + id);
				$.ajax({
					url: '/watch/' + id + '/selection', 
					type: 'POST',
					data: {selection: JSON.parse(selection)},
				}).done(function(res) {
					console.log(res["status"]);
					
					$("#addToWatchlist").each(function(){
						$(this).css("display", "none");
					});	// Once the request is finished hide the #addToWatchlist popup
					$(".watchlist-content button").off(); // Don't forget to remove event handlers from the watchlists when done. Avoid multiple db writes
				}).fail(function(err) {
					console.log(err);
					$("#addToWatchlist").each(function(){
						$(this).css("display", "none");
					});	// Once the ajax request is finished hide the #addToWatchlist popup
					$(".watchlist-content button").off(); // Don't forget to remove event handlers from the watchlists when done. Avoid multiple db writes
				}); // Ajax request to app server. Calls post request for adding a selection to a user's watchlist
			}); // Create an onclick event for each watchlist inside #addToWatchlist which holds the attributes of a selection
		}  // Create an onclick event if the clicked element from the first event handler has the name attribute "Add"
	}); // Create an onclick event on buttons designated for adding selections to watchlists
} // A method that will initilize onclick events for buttons designated for adding selections to watchlists.

if ($("#resultsContainer").length && $(window).outerWidth() > 411){ // Temporary second condition value. This jquery is causing bugs with mobile versions
	$("#resultsContainer").ready(function() {
		const selectionCount 		= $('.selection').length,
			  selectionWidth 		= $('.selection').outerWidth(),
			  fullScrollLength 		= selectionCount*selectionWidth,
			  endOffset 			= $('.selection').last().offset().left - selectionWidth,
			  resultsContentLength 	= $("#resultsContent").innerWidth();
		
		$('#resultsContent').scroll(function() {
			const resultsContentPosition 	= $(this).scrollLeft(),
				  resultsContentEnd			= resultsContentPosition + $(this).innerWidth();
			
			
			$(".fade").each(function() {
				/* Check the location of each desired element */
				var objectEnd = $(this).offset().left - selectionWidth; // Not too sure why when grabbing the offset of the right most selection in view needs subtracting.
				
				if (objectEnd < resultsContentEnd) { //object comes into view (scrolling right)
					if ($(this).css("opacity")==0) {$(this).fadeTo(500,1);}
				} else { //object goes out of view (scrolling left)
					if ($(this).css("opacity")==1) {$(this).fadeTo(500,0);}
				} // If the element is completely within bounds of the window, fade it in
			}); // For every element that contains the .fade class
			
			$("#scrollRight").each(function(){
				if(resultsContentEnd >= endOffset) {
					$(this).fadeOut();
				} else {
					$(this).fadeIn();
				}
			}); // Hide/Show the scrollRight button depending on the position of the scroll offset
			
			$("#scrollLeft").each(function(){
				if(resultsContentPosition === 0) {
					$(this).fadeOut();
				} else {
					$(this).fadeIn();
				}
			}); // Hide/Show the scrollLeft button depending on the position of the scroll offset
		}).scroll();
		
		$("#scrollLeft").click(function(){
			const currentOffset = $("#resultsContent").scrollLeft();
			
			if(currentOffset >= resultsContentLength){
				$("#resultsContent").animate({
				  scrollLeft: currentOffset - resultsContentLength
				}, 1000);
			} else {
				$("#resultsContent").animate({
				  scrollLeft: 0
				}, 1000);
			} // When clicked, always check the current position of the scroll bar for the resultsContent to decide how far we scroll
		}); // Applies to the scroll left button on the left side of the resultsContent div
		
		$("#scrollRight").click(function(){
			const currentOffset = $("#resultsContent").scrollLeft();
			
			if(((fullScrollLength - currentOffset) - resultsContentLength) >= resultsContentLength){
				$("#resultsContent").animate({
				  scrollLeft: currentOffset + resultsContentLength
				}, 1000);
			} else {
				$("#resultsContent").animate({
				  scrollLeft: endOffset
				}, 1000);
			} // When clicked, always check the current position of the scroll bar for the resultsContent to decide how far we scroll
		}); // Applies to the scroll right button on the right side of the resultsContent div
		
		openPopup(".addToWatchlistButton");
		addToWatchlist(".addToWatchlistButton");
	});
} // When on the search/index page, run event handlers 

if ($("#resultsContainer").length && $(window).outerWidth() <= 411){ // Temporary second condition value. This jquery is causing bugs with mobile versions
	console.log("Hello Mobile");
	
	$(".selection").click(function(){
		console.log("Hello there");
		$(this).toggleClass(".selection-hasHover");
	});
} // Can't figure out how to disable the hover class for selection :(

if ($("#detailsSection").length){
	$("#detailsSection").ready(function() {		
		openPopup("#addToList button");
		addToWatchlist("#addToList button");
	});
} // When on the search/show page, run event handlers 


