// ==========================
// APP CONFIG
// ==========================

var express 				= require("express"),
	app 					= express(),
	request 				= require("request"),
	methodOverride			= require("method-override"),
	bodyParser				= require("body-parser"),
	mongoose 				= require("mongoose"),
	dotenv 					= require("dotenv"),
	expressSession			= require("express-session"),
	connectFlash			= require("connect-flash"),
	passport				= require("passport"),
	passportLocal			= require("passport-local"),
	passportLocalMongoose	= require("passport-local-mongoose"),
	Selection				= require("./models/selection"),
	Watchlist				= require("./models/watchlist"),
	User					= require("./models/user")

dotenv.config(); // Utilize the .env file for all sensative url's and api keys

mongoose.connect(process.env.DATABASEURL, { useNewUrlParser: true, useUnifiedTopology: true}); // Create or Connect to db `iwil_*`

app.set("view engine", "ejs");
app.use(methodOverride("_method"));
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static(__dirname + "/public"));

app.use(expressSession({
	secret: "Alie is my adopted daughter.",
	resave: false,
	saveUninitialized: false
})); // Initialize express-session to allow the creation and use o middleware

app.use(connectFlash());

// ==========================
// PASSPORT CONFIG
// ==========================

// Set up passport to be used in app.js
app.use(passport.initialize()); 
app.use(passport.session());

// Create a new local strategy that uses the User.authenticate() method provided by passportLocalMongoose when `userSchema` is combined with passportLocalMongoose in `models/user.js`
passport.use(new passportLocal(User.authenticate()));

// Allows for reading or sending encoded data in the session. method provided by passportLocalMongoose when `userSchema` is combined with passportLocalMongoose in `models/user.js`
passport.serializeUser(User.serializeUser()); // re-encodes (serializing) data
passport.deserializeUser(User.deserializeUser()); // un-encodes (deserializing) data

app.use(function(req, res, next){
	res.locals.currentUser = req.user;
	res.locals.error = req.flash("error");
	res.locals.success = req.flash("success");
	next(); // This MUST be specified or else all routes will never reach their callbacks
}); // Applying a `middleware` function to each and every existing route below. This allows `views/partials/header.ejs` to reference currentUser for it's condition

// ==========================
// PROMISES
// ==========================

function getMovieDetails(movie){
	return new Promise(function(resolve, reject){
		const url = 'https://www.omdbapi.com/?i=' + movie["imdbID"] + '&plot=full&apikey=' + process.env.OMDBKEY;
		request(url, function (error, response, body) {
			// in addition to parsing the value, deal with possible errors
			if (error || response.statusCode != 200) return reject(error);
			try {
				// JSON.parse() can throw an exception if not valid JSON
				var movieDetails = JSON.parse(body);
				resolve(movieDetails);
			} catch(e) {
				reject(e);
			}
		}); // An http request to omdb to retrive movie details based on param: {imdbID: "____"}.
	}); // create a new promise when this function is run
} // A promise definition that requests details of a movie from omdb by param: {imdbID: "____"}.

function findAvailability(movie) {
	return new Promise(function(resolve, reject){
		request({
			headers: {
				'x-rapidapi-host'	: 'utelly-tv-shows-and-movies-availability-v1.p.rapidapi.com',
				'x-rapidapi-key'	: process.env.UTELLYKEY,
				'useQueryString'	: 'true'
			},
			uri: "https://utelly-tv-shows-and-movies-availability-v1.p.rapidapi.com/idlookup?country=US&source_id=" + movie["imdbID"] + "&source=imdb",
			method: 'GET'
		}, function (error, response, body) {
				// in addition to parsing the value, deal with possible errors
				if (error || response.statusCode != 200) return reject(error);
				try {
					var movieDetails = JSON.parse(body);
					resolve(movieDetails);
				} catch(e) {
					reject(e);
				}
		}); // An http request from utelly movie streaming details based on param: {imdbID: "____"}.
	}); // create a new promise when this function is run
} // A promise definition that requests from utelly movie streaming details based on param: {imdbID: "____"}.

function allWatchLists(){
	return new Promise(function(resolve, reject){
		Watchlist.find({}, function(err, watchLists){
			if(err || !watchLists){
				console.log("An Error has Occurred. allWatchLists()");
				console.log(err);
				reject(err)
			} else {
				resolve(watchLists);
			} // Grab the returned data from db and return array `watchLists`
		}); // Call to db collection `watchlist` for existing data
	}); // Establishes this db call as a promise when the method is called.
} // A promise definition that requests all existing  watchLists.

function getUserWatchLists(author){
	return new Promise(function(resolve, reject){
		Watchlist.find({author: author}, function(err, watchLists){
			if(err || !watchLists){
				console.log("An Error has Occurred. getUserWatchLists()");
				console.log(err);
				reject(err)
			} else {
				resolve(watchLists);
			} // Grab the returned data from db and return array `watchLists`
		}); // Call to db collection `watchlist` for existing data
	}); // Establishes this db call as a promise when the method is called.
} // A promise definition that requests all watchLists for a user.

function getWatchList(id) {
	return new Promise(function(resolve, reject){
		Watchlist.findOne({_id: id}, function(err, watchList){
			if(err || !watchList){
				console.log("An Error has Occurred. getWatchList(" + id + ")");
				console.log(err);
				reject(err)
			} else {
				resolve(watchList);
			} // Grab the returned data from db and return object `watchList`
		}); // Call to db collection `watchlist` for existing data
	}); // Establishes this db call as a promise when the method is called.
} // A promise definition that requests the watchList for a user.

function getSelection(id) {
	return new Promise(function(resolve, reject){
		Selection.findOne({_id: id}, function(err, foundSelection){
			if(err || !foundSelection) {
				console.log("An Error has Occurred. getSelection(" + id + ")");
				console.log(err);
				reject(err);
			} else {
				resolve(foundSelection);
			} // Grab the returned data from db and return object `selection`
		}); // Call to db collection `selection` for existing data
	}); // Establishes this db call as a promise when the method is called.
} // A promise definition that requests the selection for a user's watchlist.

function getMovieResults() {
	return new Promise(function(resolve, reject){
		const url	= 'https://www.omdbapi.com/?s=' + search + '&type=movie&apikey=' + process.env.OMDBKEY;
		request(url, function(error, response, body){
			var searchResults = JSON.parse(body);
			if(!error && response.statusCode == 200 && searchResults["Response"] !== "False") {
				
			} else {
				console.log(error);
				console.log(searchResults["Error"]);
				// reject(searchResults["Error"]);
				// res.render("search/index", {search: search, movieResults: [], detailList: [], watchLists: []});
			} // Response is accepted only if error is null AND status === 200
		});  // The request made to OMDb. Callback function will handle a successful render
	}); // Establishes this api request call as a promise when the method is called.
} // A promise definition that requests movies from OMDB based on title

app.get("/", function(req, res){
	res.render("home");
}); // Landing Page

// ==========================
// SEARCH ROUTES
// ==========================

app.get("/search", function(req, res){
	const 	search			= req.query.search,
			url				= 'https://www.omdbapi.com/?s=' + search + '&type=movie&apikey=' + process.env.OMDBKEY,
			promises		= [],
			movieResults 	= []
	
	request(url, function(error, response, body){
		var searchResults = JSON.parse(body);
		
		if(!error && response.statusCode == 200 && searchResults["Response"] !== "False") {
			searchResults["Search"].forEach(function(movie){
				if(movie["Poster"] === "N/A") {
					return;
				} // Filter results that are missing posters
				movieResults.push(movie);
				promises.push(getMovieDetails(movie));
			}); // Prepare an evaulation of a list of promises for filtered selection
			
			Promise.all(promises).then((results) => {
				
				var detailList = [];
				
				results.forEach((result) => {
					detailList.push(result["Plot"]);
				}); // Take the result of each evaluated promise and pass Plot details to the list. The list is in order with the selection order.
				
				allWatchLists().then((watchLists) => {
					res.render("search/index", {search: search, movieResults: movieResults, detailList: detailList, watchLists: watchLists});
				}).catch(function(err) {
					console.log("An Error has Occurred. allWatchLists() failed at index route `/search`");
					console.log(err);
					req.flash("error", "Oops! There was a problem. Please try again.");
					res.redirect("/");
				}); // Nested promise. Need to grab user's watchList for index template to locate all selections that have been added to db. THEN we will render the page.
				 
			}).catch(function(err) {
				console.log("An Error has Occurred. getMovieDetails() failed at route index `/search`");
				console.log(err);
				req.flash("error", "Oops! There was a problem. Please try again.");
				res.redirect("/");
			});	// Grab some plot details for each selection and pass to the template for each selection's description. The INDEX page is rendered inside the last .then of the promise chain
		} else {
			console.log(error);
			console.log(searchResults["Error"]);
			req.flash("error", searchResults["Error"]);
			res.redirect("/");
			// res.render("search/index", {search: search, movieResults: [], detailList: [], watchLists: []});
		} // Response is accepted only if error is null AND status === 200
	}); // The request made to OMDb. Callback function will handle a successful render
}); // INDEX: Handles a get request that is using the OMDb api to search for movies based on movie titles, this utilizes the `mainSearchBar` form element for making the request.

app.get("/search/:id", function(req, res){
	const movie = { imdbID: req.params.id };
	
	getMovieDetails(movie).then((results) => {
		
		findAvailability(movie).then((response) => {
			const providers = response["collection"].locations;
			
			allWatchLists().then((watchLists) => {
				res.render("search/show", {results: results, providers: providers, watchLists: watchLists}); 
			}).catch(function(err) {
				console.log("An Error has Occurred. allWatchLists() failed at show route `/search/" + movie["imdbID"] + "`");
				console.log(err);
				req.flash("error", "Oops! There was a problem. Please try again.");
				res.redirect("back");
			}); // Nested promise. Need to grab user's watchList for index template to locate all selections that have been added to db. THEN we will render the page.
			
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

// ==========================
// WATCH ROUTES
// ==========================

app.get("/watch", isLoggedIn, function(req, res){
	const author = {
		id: req.user._id,
		username: req.user.username
	}
	
	getUserWatchLists(author).then((watchLists) =>{
		res.render("watch/index", {watchLists: watchLists});
	}).catch(function(err){
		console.log("An Error has Occurred. getUserWatchLists() failed at index route `/watch`");
		console.log(err);
		req.flash("error", "Oops! There was a problem. Please try again.");
		res.redirect("back");
	}); // Resolved promise grabs the saved watchlist
}); // INDEX: Navigate to /watch and show all saved selections if logged in to known user

app.get("/watch/new", isLoggedIn, function(req, res) {
	res.render("watch/new");
}); // NEW: If logged in to known user, head to new page for adding new watchlist to user account

app.post("/watch", isLoggedIn, function(req, res){
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

app.get("/watch/:id", isLoggedIn, function(req,res) {
	const id = req.params.id;
	
	getWatchList(id).then((watchList) => {
		const getSelectionPromises = [];
		
		if (watchList["selection"].length > 0) {
			watchList["selection"].forEach((selection_id) =>{
				getSelectionPromises.push(getSelection(selection_id));
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

app.get("/watch/:id/edit", isLoggedIn, function(req,res){
	const id = req.params.id;
	
	getWatchList(id).then((watchList) => {
		res.render("watch/edit", {watchList: watchList});
	}).catch(function(err){
		console.log("An Error has Occurred. Watchlist.findOne() failed at edit route `/watch/" + id + "/edit`");
		console.log(err);
		req.flash("error", "Oops! There was a problem. Please try again.");
		res.redirect("back");
	}); // Retrieve user's watchlist specified by id
}); // EDIT: Handle requests to retrieve information for a user's watchlist and pass to the edit page

app.put("/watch/:id", isLoggedIn, function(req,res){
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

app.delete("/watch/:id", isLoggedIn, function(req, res){ 
	const id = req.params.id;
	
	getWatchList(id).then((watchList) => {
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


// ==========================
// SELECTION ROUTES
// ==========================

app.post("/watch/:id/selection", isLoggedIn, function(req, res){
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

app.delete("/watch/:id/selection/:selection_id", isLoggedIn, function(req, res){
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

// ==========================
// AUTH ROUTES
// ==========================

app.get("/register", function(req, res){
	res.render("register");
}); // NEW: form input for adding a new user
	
app.post("/register", function(req, res){
	var newUser =  new User({username: req.body.username});
	
	User.register(newUser, req.body.password, function(err, registeredUser){
		if(err){
			console.log(err);
			req.flash("error", err.message);
			return res.render('register');
		} // If we cannot register (create the new user), throw err and end function by returning to register page
		passport.authenticate("local")(req, res, function(){
			req.flash("success", "Registration Successful! Welcome " + newUser.username + "!");
			res.redirect("/");
		}); // This will abstract the `logging-in` of the use if successful and send us to the main search page. Uses passport.js' `local` strategy for authenticating
	}); // Create a user object and only pass in username first arguement, the password in the second arguement into order to `hash` it
}); // CREATE: Handle the sign up submission

app.get("/login", function(req, res){
	res.render("login");
}); // Show login form

app.post("/login", passport.authenticate("local", 
	{
		successRedirect: "/",
		failureRedirect: "/login",
		error: "Login failed. Username or password was incorrect.",
    	failureFlash: true
	}), function(req, res){
}); // Handle user login, uses `middleware` in the post route arguments`. The middleware will check in `users` collection for the submitted login and compare the password with the `hash` and `salt` key. 

app.get("/logout", function(req, res){
	req.logout();
	req.flash("success", "Signed out. Goodbye!");
	res.redirect("/");
}); // Handle logout request. req.logout() uses the simple passport logout functionality

// ==================
// MIDDLEWARE DEFINITIONS
// ==================

function isLoggedIn(req, res, next){
	if(req.isAuthenticated()){
		return next();
	} // When passing isLoggedIn to a route, if the req is validated by passport, the following route's callback function will be used
	req.flash("error", "Please Login.");
	res.redirect("/login"); // If not, we redirect to the login page and following route's callback is ignored
} // Will be used as the middleware function for checking authentication when going down specific routes

app.listen(process.env.PORT || 3000, process.env.IP, function(){
	console.log("IWIL has started!!!");
});