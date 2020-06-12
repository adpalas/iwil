/* Javascript Declarations */

const mainSearchBar 		= document.querySelector("#mainSearchBar"),
	  mainSearchBarForm 	= document.querySelector("#mainSearchBar form"),
	  resultsContainer 		= document.querySelector("#resultsContainer"),
	  detailsSection 		= document.querySelector("#detailsSection"),
	  watchlistsContainer 	= document.querySelector("#watchlistsContainer"),
	  watchContainer 		= document.querySelector("#watchContainer"),
	  newWatchlistContainer = document.querySelector("#newWatchlistContainer");

/* jQuery Declarations */

function addToWatchlist(openPopup) {
	$(openPopup).click(element => {
		const selection		= $(element.currentTarget).val(),
			  state 		= $(element.currentTarget).attr("name");
		
		if (state === "Add") {
			$(".watchlist-content button").click(element => {
				const id = $(element.currentTarget).val();
				
				console.log("Adding " + JSON.parse(selection).imdbID + " to watchlist " + id);
				$.ajax({
					url: '/watch/' + id + '/selection', 
					type: 'POST',
					data: {selection: JSON.parse(selection)},
				}).done(function(res) {
					console.log(res["status"]);
					
					$("#addToWatchlist").each(function(){
						$(this).css("display", "none");
					});	
					
					$(".watchlist-content button").off(); // Don't forget to remove event handler to avoid multiple db writes
				}).fail(function(err) {
					console.log(err);
				});
			});
		} 
	});
}

/* search/index */

/* Javascript */

if (resultsContainer !== null){
	// mainSearchBar.style.justifyContent = "start";
	// mainSearchBar.style.height = "10%";
	// mainSearchBarForm.style.height = "100%";
	// resultsContainer.style.height = "80%";
	
	// Get the modal
	var modal = document.querySelector("#addToWatchlist");

	// Get the button that opens the modal
	var addToWatchlistButton = document.querySelectorAll(".addToWatchlistButton");

	// Get the <span> element that closes the modal
	var span = document.querySelector("#close");

	console.log(addToWatchlistButton);
	
	// When the user clicks on the button, open the modal
	addToWatchlistButton.forEach((elm) => {
		elm.onclick = function() {
			modal.style.display = "flex";
		}
	});

	// When the user clicks on <span> (x), close the modal
	span.onclick = function() {
	  modal.style.display = "none";
		$(".watchlist-content button").off(); // Don't forget to remove event handler to avoid multiple db writes
	}

	// When the user clicks anywhere outside of the modal, close it
	window.onclick = function(event) {
	  if (event.target == modal) {
		modal.style.display = "none";
		  $(".watchlist-content button").off(); // Don't forget to remove event handler to avoid multiple db writes
	  }
	}

	
	/* jQuery */
	
	const selectionCount 		= $('.selection').length,
		  selectionWidth 		= $('.selection').outerWidth(),
		  fullScrollLength 		= selectionCount*selectionWidth,
		  endOffset 			= $('.selection').last().offset().left - 50,
		  resultsContentLength 	= $("#resultsContent").innerWidth();
	
	// console.log(selectionWidth);

	// $('#resultsContent').scroll(); // Give the #resultsContent some scroll animations when run on a desktop
	
	$('#resultsContent').scroll(function() {
		var resultsContentEnd = $(this).scrollLeft() + $(this).innerWidth();
		var resultsContentPosition = $(this).scrollLeft();
		
		$(".fade").each(function() {
			/* Check the location of each desired element */
			var objectEnd = $(this).offset().left - 50; // For some reason, this function calculates an extra 50px that is not true which affects the right most selection. As a temp fix, -50px
			console.log(objectEnd);
			
			/* If the element is completely within bounds of the window, fade it in */
			if (objectEnd < resultsContentEnd) { //object comes into view (scrolling right)
				if ($(this).css("opacity")==0) {$(this).fadeTo(500,1);}
			} else { //object goes out of view (scrolling left)
				if ($(this).css("opacity")==1) {$(this).fadeTo(500,0);}
			}
		});
		
		$("#scrollRight").each(function(){
			if(resultsContentEnd >= endOffset) {
				$(this).fadeOut();
			} else {
				$(this).fadeIn();
			}
		});
		
		$("#scrollLeft").each(function(){
			if(resultsContentPosition === 0) {
				$(this).fadeOut();
			} else {
				$(this).fadeIn();
			}
		});
  	}).scroll();

	$("#scrollLeft").click(function(){
		const currentOffset = $("#resultsContent").scrollLeft();
	
		if(currentOffset >= resultsContentLength){ //The use of the integer 4 will need to later be more dynamic depending on how many full .selections fit in resultsContent at a time
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
	
	// initAddOrRemoveFromWatchList(".selection-options button", "indexPage");
	
	addToWatchlist(".addToWatchlistButton");
	
	
} // When on the results page, run some dynamic style changes and animations if desired here. 

/* search/show */

if (detailsSection !== null){
	// mainSearchBar.style.justifyContent = "start";
	// mainSearchBar.style.height = "10%";
	// mainSearchBarForm.style.height = "100%";
	// detailsSection.style.height = "80%";
	
	// Get the modal
	var modal = document.querySelector("#addToWatchlist");

	// Get the button that opens the modal
	var addToWatchlistButton = document.querySelector("#addToList button");

	// Get the <span> element that closes the modal
	var span = document.querySelector("#close");

	// When the user clicks on the button, open the modal
	addToWatchlistButton.onclick = function() {
	  modal.style.display = "flex";
	}

	// When the user clicks on <span> (x), close the modal
	span.onclick = function() {
	  modal.style.display = "none";
		$(".watchlist-content button").off(); // Don't forget to remove event handler to avoid multiple db writes
	}

	// When the user clicks anywhere outside of the modal, close it
	window.onclick = function(event) {
	  if (event.target == modal) {
		modal.style.display = "none";
		  $(".watchlist-content button").off(); // Don't forget to remove event handler to avoid multiple db writes
	  }
	}
	
	addToWatchlist("#addToList button");
}