const 	express 	= require("express"),
	  	router		= express.Router({mergeParams: true}),
	  	mongoose 	= require("mongoose"),
	  	Selection	= require("../models/selection"),
	  	Watchlist	= require("../models/watchlist")

const 	middleware	= require("../middleware/index.js");

// ==========================
// SELECTION ROUTES
// ==========================

router.post("/", middleware.isLoggedIn, function(req, res){
	const id = req.params.id;
		 
	const selection = {
		title: req.body.selection["Title"],
		imdbID: req.body.selection["imdbID"],
		image: req.body.selection["Poster"]
	} // Object for creating new selection in selections collection
	
	Selection.create(selection, function(err, newSelection){
		if(err || !newSelection){
			console.log("An Error has Occurred. Selection.create() failed at route `/watch/" + id + "/selection`");
			console.log(err);
			req.flash("error", "Oops! There was a problem. Please try again.");
			res.redirect(".");
		} else {
			Watchlist.findOne({_id: id}, function(err, watchList) {
				if(err || !watchList) {
					console.log("An Error has Occurred. Watchlist.fineOne() failed at route `/watch/`" + id + "/selection`");
					console.log(err);
					req.flash("error", "Oops! There was a problem. Please try again.");
					res.redirect(".");
				} else {
					watchList.selection.push(newSelection);
					
					if(watchList.imageList.length < 4) {
						watchList.imageList.push(selection["image"]);
					} else {
						watchList.imageList.shift();
						watchList.imageList.push(selection["image"]);
					} // Queuing/Dequeing images for the watchlist image. Keep at most 4 images in imageList of a watchlist
					
					watchList.save(function(err,response){
						if(err || !response) {
							console.log("An Error has Occurred. watchlist.save() failed at route `/watch/`" + id + "/selection`");
							console.log(err);
							req.flash("error", "Oops! There was a problem. Please try again.");
							res.redirect(".");
						} else {
							console.log("Added " + selection["imdbID"] + " to watch list " + id);
							console.log("watchlist imageList: " + watchList["imageList"]);
						} // Check if save to watchlist is successful
					}); // Save changes to watchlist after pushing to imageList
					
				} // If watchlist is successfully found, push the poster image to imageList of watchlist
			}); // Add poster image of new selection to imageList of watchlist.
			
			// Return to page regardless of successful push to imageList or not.
			res.status(200).send({status: "Added " + selection["imdbID"] + " to watch list " + id});
		} // Push postter image to watchlist's imageList, and send success status to .ajax call from client
	}); // Adds selection to db collection selections 
}); // CREATE: Handle requests from a user to add a selection to their watchlist

router.delete("/:selection_id", middleware.isLoggedIn, function(req, res){
	const watchListId = req.params.id,
		  selectionId = req.params.selection_id;
		
	Selection.findOneAndDelete({_id: selectionId}, function(err, movieList){
		if(err || !movieList){
			console.log("An Error has Occurred. Selection.findOneAndDelete() failed at /watch/" + watchListId + "/selection/" + selectionId);
			console.log(err);
			req.flash("error", "Oops! There was a problem. Please try again.");
			res.redirect(".");
		} else {
			Watchlist.findOne({_id: watchListId}, function(err, watchList) {
				if(err || !watchList) {
					console.log("An Error has Occurred. Watchlist.findOne() failed at /watch/" + watchListId + "/selection/" + selectionId);
					console.log(err);
					req.flash("error", "Oops! There was a problem. Please try again.");
					res.redirect(".");
				} else {
					const index = watchList.selection.indexOf(selectionId);
					watchList.selection.splice(index, 1);
					watchList.save(function(err, response) {
						if(err || !response) {
							console.log("An Error has Occurred. watchlist.save() failed at /watch/" + watchListId + "/selection/" + selectionId);
							console.log(err);
							req.flash("error", "Oops! There was a problem. Please try again.");
							res.redirect(".");
						} else {
							res.redirect("/watch/" + watchListId);
						} // Check if saving to watchlist after a removal of a selectionId was successful then redirect.
					}); // Save changes to watchlist after removing a selectionId
				} // If watchlist is found, remove associated selection from watchlist
			}); // Search for user's watchlist by id
		} // Sucessful removal from the db collection selections will then remove the selectionId from their watchlist
	}); // Removes selection from db collection selection then proceeds to remove selectionId from associated watchlist
}); // DESTROY: Handle requests to remove selection from db collection selections

module.exports = router;