/* Javascript Declarations */

const mainSearchBar 	= document.querySelector("#mainSearchBar"),
	  mainSearchBarForm = document.querySelector("#mainSearchBar form"),
	  resultsContainer 	= document.querySelector("#resultsContainer"),
	  detailsSection 	= document.querySelector("#detailsSection"),
	  watchContainer 	= document.querySelector("#watchContainer");

const buttonStates = {
	indexPage: {
		Added: { 
			html: '<i class="fas fa-check"></i> Added!'
		},
		Removed: {
			html: '<i class="fas fa-plus"></i> Quick Add'
		}
	},
	showPage: {
		Added: { 
			html: '<i class="fas fa-check"></i> Added To WatchList!'
		},
		Removed: {
			html: '<i class="fas fa-plus"></i> Add To WatchList'
		}
	}
	
}

/* jQuery Declarations */

function initAddOrRemoveFromWatchList(selector, pageName) {
	$(selector).click(element => {
		const imdbID 	= $(element.currentTarget).val(),
			  state 	= $(element.currentTarget).attr("name");
		
		if (state === "Add") {
			console.log("Adding " + imdbID + " to watch list.");
			$.ajax({
				url: '/watch/' + imdbID, 
				type: 'POST', 
			}).done(function(res) {
				console.log(res["status"]);
				$(element.currentTarget).attr("name", "Remove");
				$(element.currentTarget).html(buttonStates[pageName].Added.html);
			}).fail(function(err) {
      			console.log(err);
   			});
		} else if (state === "Remove") {
			console.log("Removing " + imdbID + " from watch list.");
			$.ajax({
				url: '/watch/' + imdbID, 
				type: 'DELETE', 
			}).done(function(res) {
				console.log(res["status"]);
				$(element.currentTarget).attr("name", "Add");
				$(element.currentTarget).html(buttonStates[pageName].Removed.html);
			}).fail(function(err) {
      			console.log(err);
   			});
		}
	}); // jquery function for handling POST/DELETE requests for the watch CREATE/DESTROY routes
}

/* search/index */

/* Javascript */

if (resultsContainer !== null){
	mainSearchBar.style.justifyContent = "start";
	mainSearchBar.style.height = "10%";
	mainSearchBarForm.style.height = "100%";
	resultsContainer.style.height = "65%";
	
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
	
	initAddOrRemoveFromWatchList(".selection-options button", "indexPage");
	
} // When on the results page, run some dynamic style changes and animations if desired here. 

/* search/show */

if (detailsSection !== null){
	console.log(resultsContainer);
	mainSearchBar.style.justifyContent = "start";
	mainSearchBar.style.height = "10%";
	mainSearchBarForm.style.height = "100%";
	detailsSection.style.height = "65%";
	
	initAddOrRemoveFromWatchList("#movie-options button", "showPage");
}

/* watch/index */

if (watchContainer !== null){
	console.log(resultsContainer);
	mainSearchBar.style.justifyContent = "start";
	mainSearchBar.style.height = "10%";
	mainSearchBarForm.style.height = "100%";
	watchContainer.style.height = "65%";
}



