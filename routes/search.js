const express 	= require("express"),
	  router	= express.Router();

const promiseMethods = require("../promises/index");

// ==========================
// SEARCH ROUTES
// ==========================

router.get("/", function(req, res){
	const 	search			= req.query.search,
			searchPromises		= [],
			detailsPromises		= [];
	
	promiseMethods.movieSearch(search).then((movieResults) => {
		const filteredMovieResults = [];
		
		movieResults.forEach((movie) => {	
			detailsPromises.push(promiseMethods.getMovieDetails(movie));
		}); // Prepare an evaulation of a list of promises for filtered selection
			
		Promise.all(detailsPromises).then((detailResults) => {
			var detailList = [];
			
			detailResults.forEach((result) => {
				detailList.push(result["Plot"]);
			}); // Take the result of each evaluated promise and pass Plot details to the list. The list is in order with the selection order.
			
			if(req.user === undefined) {
				res.render("search/index", {search: search, movieResults: movieResults, detailList: detailList, watchLists: []});
			} else {
				promiseMethods.getUserWatchLists({id: req.user._id,username: req.user.username}).then((watchLists) => {
					res.render("search/index", {search: search, movieResults: movieResults, detailList: detailList, watchLists: watchLists});
				}).catch(function(err) {
					console.log("An Error has Occurred. allWatchLists() failed at index route `/search`");
					console.log(err);
					req.flash("error", "Oops! There was a problem. Please try again.");
					res.redirect("/");
				}); // Nested promise. Need to grab user's watchList for index template to locate all selections that have been added to db. THEN we will render the page.
			}			
		}).catch(function(err) {
			console.log("An Error has Occurred. getMovieDetails() failed at route index `/search`");
			console.log(err);
			req.flash("error", "Oops! There was a problem. Please try again.");
			res.redirect("/");
		});	// Grab some plot details for each selection and pass to the template for each selection's description. The INDEX page is rendered inside the last .then of the promise chain
	}).catch(function(err) {
		console.log("An Error has Occurred. movieSearch() failed at route index `/search`");
		console.log(err);
		
		if(err === "Movie not found!") {
			req.flash("error", err);
			res.redirect("/");
		} else if (err === "Too many results."){
			req.flash("error", "Please refine your search and try again.");
			res.redirect("/");
		} else {
			req.flash("error", "Oops! There was a problem. Please try again.");
			res.redirect("/");
		}
	});
}); // INDEX: Handles a get request that is using the OMDb api to search for movies based on movie titles, this utilizes the `mainSearchBar` form element for making the request.

router.get("/:id", function(req, res){
	const 	movie = { imdbID: req.params.id };
	
	promiseMethods.getMovieDetails(movie).then((results) => {
		
		promiseMethods.findAvailability(movie).then((response) => {
			const providers = response,
				  providerIconPromises = [];
			
			providers.forEach((provider)=>{
				providerIconPromises.push(promiseMethods.checkIcon(provider));
			});
			
			Promise.all(providerIconPromises).then((scannedProviders) => {
				if(req.user === undefined) {
					res.render("search/show", {results: results, providers: scannedProviders, watchLists: []});
				} else {
					promiseMethods.getUserWatchLists({id: req.user._id,username: req.user.username}).then((watchLists) => {
						res.render("search/show", {results: results, providers: scannedProviders, watchLists: watchLists}); 
					}).catch(function(err) {
						console.log("An Error has Occurred. allWatchLists() failed at show route `/search/" + movie["imdbID"] + "`");
						console.log(err);
						req.flash("error", "Oops! There was a problem. Please try again.");
						res.redirect("back");
					}); // Nested promise. Need to grab user's watchList for index template to locate all selections that have been added to db. THEN we will render the page.
				}
			}).catch(function(err) {
				console.log("An Error has Occurred. checkIcon() failed at show route `/search/" + movie["imdbID"] + "`");
				console.log(err);
			});
		}).catch(function(err) {
			console.log("An Error has Occurred. findAvailability() failed at show route `/search/" + movie["imdbID"] + "`");
			console.log(err);
			req.flash("error", "Oops! There was a problem. Please try again.");
			res.redirect("back");
		});; // Nested promise. Make request to Utelly to check all streaming platforms for this selection based on imdbid. THEN we will render the page.
		
	}).catch(function(err) {
		console.log("An Error has Occurred. getMovieDetails() failed at show route `/search/" + movie["imdbID"] + "`");
		console.log(err);
		req.flash("error", "Oops! There was a problem. Please try again.");
		res.redirect("back");
	});	// Promise. Grab all details for a selection and pass to the show template.
}); // SHOW: When clicking `details` from a .selection on search/index, handle a SHOW route for that particular film.

module.exports = router;
