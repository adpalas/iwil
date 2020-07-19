const 	express 	= require("express"),
	  	router		= express.Router(),
	  	mongoose 	= require("mongoose"),
	  	Selection	= require("../models/selection"),
	  	Watchlist	= require("../models/watchlist")

const 	promiseMethods 	= require("../promises/index"),
		middleware		= require("../middleware/index.js");

// ==========================
// WATCH ROUTES
// ==========================

router.get("/", middleware.isLoggedIn, function(req, res){
	const author = {
		id: req.user._id,
		username: req.user.username
	}
	
	promiseMethods.getUserWatchLists(author).then((watchLists) =>{
		res.render("watch/index", {watchLists: watchLists});
	}).catch(function(err){
		console.log("An Error has Occurred. getUserWatchLists() failed at index route `/watch`");
		console.log(err);
		req.flash("error", "Oops! There was a problem. Please try again.");
		res.redirect("back");
	}); // Resolved promise grabs the saved watchlist
}); // INDEX: Navigate to /watch and show all saved selections if logged in to known user

router.get("/new", middleware.isLoggedIn, function(req, res) {
	res.render("watch/new");
}); // NEW: If logged in to known user, head to new page for adding new watchlist to user account

router.post("/", middleware.isLoggedIn, function(req, res){
	const newWatchListAuthor = {
		id: req.user._id,
		username: req.user.username
	} // Retrive logged in user info using passport's user object
	
	const newWatchList = {
		name: req.body.name,
		description: req.body.description,
		author: newWatchListAuthor
	} // Specify all required info for new user object
	
	Watchlist.create(newWatchList, function(err, watchlists){
		if(err || !watchlists){
			console.log("An Error has Occurred. Watchlist.create() failed at create route `/watch`");
			console.log(err);
			req.flash("error", "Oops! There was a problem. Please try again.");
			res.redirect("back");
		} else {
			console.log("New watchlist added: " + newWatchList);
			req.flash("success", "New watchlist added!");
			res.redirect("/watch");
		} // If new user creation is successful, notify user and return to '/watch' page
	}); // Call for creation for new Watchlist.
}); // CREATE: Handle requests to add new watchlists. Define new insert using the form's POST request on watch/new.ejs, insert into collection

router.get("/:id", middleware.isLoggedIn, function(req,res) {
	const id = req.params.id;
	
	promiseMethods.getWatchList(id).then((watchList) => {
		const getSelectionPromises = [];
		
		if (watchList["selection"].length > 0) {
			watchList["selection"].forEach((selection_id) =>{
				getSelectionPromises.push(promiseMethods.getSelection(selection_id));
			}); // Prepare nested promise. Use results of the first promise to prepare requests for grabbing details of each movie.
			
			Promise.all(getSelectionPromises).then((selectionList) => {
				res.render("watch/show", {watchList: watchList, selectionList: selectionList});
			}).catch(function(err){
				console.log("An Error has Occurred. getSelection() failed at show route `/watch/" + id + "`");
				console.log(err);
				req.flash("error", "Oops! There was a problem. Please try again.");
				res.redirect("back");
			}); // Resolve all nested promises regarding stored info of each selection for specific watchlist
		} else {
			res.render("watch/show", {watchList: watchList, selectionList: []});
		} // check if the retrieved watchlist is empty
	}).catch(function(err){
		console.log("An Error has Occurred. getWatchList() failed at show route `/watch/" + id + "`");
		console.log(err);
		req.flash("error", "Oops! There was a problem. Please try again.");
		res.redirect("back");
	}); // Resolved promise grabs the saved watchlist and then retirves associated selections
}); // SHOW: Handle requests to show a user one of their saved watchlists

router.get("/:id/edit", middleware.isLoggedIn, function(req,res){
	const id = req.params.id;
	
	promiseMethods.getWatchList(id).then((watchList) => {
		res.render("watch/edit", {watchList: watchList});
	}).catch(function(err){
		console.log("An Error has Occurred. Watchlist.findOne() failed at edit route `/watch/" + id + "/edit`");
		console.log(err);
		req.flash("error", "Oops! There was a problem. Please try again.");
		res.redirect("back");
	}); // Retrieve user's watchlist specified by id
}); // EDIT: Handle requests to retrieve information for a user's watchlist and pass to the edit page

router.put("/:id", middleware.isLoggedIn, function(req,res){
	const id 		= req.params.id,
		  watchList = req.body.watchList;
	
	Watchlist.findOneAndUpdate({_id:id}, watchList, function(err,updatedWatchList){
		if(err | !updatedWatchList) {
			console.log("An Error has Occurred. Watchlist.findOneAndUpdate() failed at update route `/watch/" + id + "`");
			console.log(err);
			req.flash("error", "Oops! There was a problem. Please try again.");
			res.redirect("/watch/" + id);
		} else {
			req.flash("success", "Watchlist Updated!");
			res.redirect("/watch/" + id);
		} // Return to watchlist after update has been made. Notify user.
	}); // locate and update the specific watchlist with specified data from user.
}); // UPDATE: Handle request to retrieve information from user for updating a specified watchlist

router.delete("/:id", middleware.isLoggedIn, function(req, res){ 
	const id = req.params.id;
	
	promiseMethods.getWatchList(id).then((watchList) => {
		watchList["selection"].forEach((selectionId) => {
			Selection.findOneAndDelete({_id: selectionId}, function(err, selection){
				if(err || !selection) {
					console.log("An Error has Occurred. Selection.findOneAndDelete() failed at delete route `/watch/" + id + "`");
					console.log("Watchlist " + id + " selection: " + selectionId + " could not be deleted.");
					console.log(err);
					req.flash("error", "Oops! There was a problem. Please try again.");
					res.redirect("/watch");
				} else {
					console.log("Watchlist " + id + " selection: " + selectionId + " deleted.");
				} // Check status of each deletion of selections associated with watchlist
			}); // Call the deletion of a single selection inside a watchlist
		}); // iterate through each selection of watchlist for individual deletes in the db
		
		Watchlist.findOneAndDelete({_id: id}, function(err, watchLists){
			if(err || !watchLists) {
				console.log("An Error has Occurred. Watchlist.findOneAndDelete() failed at delete route `/watch/" + id + "`");
				console.log("Watchlist " + id + " could not be deleted.");
				console.log(err);
				req.flash("error", "Oops! There was a problem. Please try again.");
				res.redirect("/watch");
			} else {
				console.log("Watchlist " + id + " deleted.");
				req.flash("success", "Watchlist deleted!");
				res.redirect("/watch");
			} // Check status of watchlist deletion and return
		}); // Call deletion of watchlist in the database
	}).catch(function(err){
		console.log("An Error has Occurred. getWatchList() failed at delete route `/watch/" + id + "`");
		console.log(err);
		req.flash("error", "Oops! There was a problem. Please try again.");
		res.redirect("/watch");
	}); // Resolved promise grabs the saved watchlist, deletes all selections associated with watchlist, then deletes watchlist
}); // DELETE: Handle request to delete a user's watchlist and it's assocaiated selections

module.exports = router;