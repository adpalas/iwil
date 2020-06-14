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
	secret: "Alie is my adopter daughter.",
	resave: false,
	saveUninitialized: false
})); // Initialize express-session to allow the creation and use o middleware

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
} // A promise definition that requests the watchList for a user.

function getWatchList(id) {
	return new Promise(function(resolve, reject){
		Watchlist.findOne({_id: id}, function(err, watchList){
			if(err || !watchList){
				console.log("An Error has Occurred. getWatchList()");
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
				console.log("An Error has Occurred. getSelection()");
				console.log(err);
				reject(err);
			} else {
				resolve(foundSelection);
			} // Grab the returned data from db and return object `selection`
		}); // Call to db collection `selection` for existing data
	}); // Establishes this db call as a promise when the method is called.
} // A promise definition that requests the selection for a user's watchlist.

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
		
		console.log(searchResults);
		
		if(!error && response.statusCode == 200 && searchResults["Response"] !== "False") {
			searchResults["Search"].forEach(function(movie){
				promises.push(getMovieDetails(movie));
			}); // Prepare an evaulation of a list of promises for each and every returned selection
			
			Promise.all(promises).then((results) => {
				
				var detailList = [];
				
				results.forEach((result) => {
					detailList.push(result["Plot"]);
				}); // Take the result of each evaluated promise and pass Plot details to the list. The list is in order with the selection order.
				
				allWatchLists().then((watchLists) => {
					res.render("search/index", {search: search, movieResults: searchResults["Search"], detailList: detailList, watchLists: watchLists});
				}).catch(function(err) {
					console.log("An Error has Occurred. allWatchLists() failed at route `/search`");
					console.log(err);
				}); // Nested promise. Need to grab user's watchList for index template to locate all selections that have been added to db. THEN we will render the page.
				 
			}).catch(function(err) {
				console.log("An Error has Occurred. getMovieDetails() failed at route `/search`");
				console.log(err);
			});	// Grab some plot details for each selection and pass to the template for each selection's description. The INDEX page is rendered inside the last .then of the promise chain
		} else {
			console.log(error);
			console.log(searchResults["Error"]);
			res.render("search/index", {search: search, movieResults: [], detailList: [], watchLists: []});
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
				console.log(err);
			}); // Nested promise. Need to grab user's watchList for index template to locate all selections that have been added to db. THEN we will render the page.
			
		}).catch(function(err) {
			console.log("An Error has Occurred: findAvailability()");
			console.log(err);
		});; // Nested promise. Make request to Utelly to check all streaming platforms for this selection based on imdbid. THEN we will render the page.
		
	}).catch(function(err) {
		console.log("An Error has Occurred: getMovieDetails()");
		console.log(err);
	});	// Promise. Grab all details for a selection and pass to the show template.
}); // SHOW: When clicking `details` from a .selection on search/index, handle a SHOW route for that particular film.

// ==========================
// WATCH ROUTES
// ==========================

app.get("/watch", isLoggedIn, function(req, res){
	allWatchLists().then((watchLists) =>{
		res.render("watch/index", {watchLists: watchLists});
	}).catch(function(err){
		console.log(err);
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
			console.log("An Error has Occurred.");
			console.log(err);
			res.redirect("back");
		} else {
			console.log("Listing All Watchlists..");
			console.log(watchlists);
			res.redirect("/watch");
		} // If new user creation is successful, notify user and return to '/watch' page
	}); // Call
}); // CREATE: Handle requests to add new watchlists. Define new insert using the form's POST request on watch/new.ejs, insert into collection

app.get("/watch/:id", isLoggedIn, function(req,res) {
	console.log("get: /watch/:id");
	const id = req.params.id;
	
	getWatchList(id).then((watchList) => {
		const getSelectionPromises = [];
		
		if (watchList["selection"].length > 0) {
			watchList["selection"].forEach((selection_id) =>{
				getSelectionPromises.push(getSelection(selection_id));
			}); // Prepare nested promise. Use results of the first promise to prepare requests for greabbing details of each movie.
			
			Promise.all(getSelectionPromises).then((selectionList) => {
				res.render("watch/show", {watchList: watchList, selectionList: selectionList});
			}).catch(function(err){
				console.log(err);
			});
		} else {
			console.log(watchList);
			res.render("watch/show", {watchList: watchList, selectionList: []});
		}
	}).catch(function(err){
		console.log(err);
	}); // Resolved promise grabs the saved watchlist
}); // SHOW

app.get("/watch/:id/edit", isLoggedIn, function(req,res){
	const id = req.params.id;
	
	getWatchList(id).then((watchList) => {
		res.render("watch/edit", {watchList: watchList});
	}).catch(function(err){
		console.log("An Error has Occurred. Watchlist.findOne() failed at EDIT route `/watch/" + id + "/edit`");
		console.log(err);
	});
}); // EDIT

app.put("/watch/:id", isLoggedIn, function(req,res){
	const id 		= req.params.id,
		  watchList = req.body.watchList;
	
	Watchlist.findOneAndUpdate({_id:id}, watchList, function(err,updatedWatchList){
		if(err | !updatedWatchList) {
			console.log("An Error has Occurred. Watchlist.findOneAndUpdate() failed at UPDATE route `/watch/" + id + "`");
			console.log(err);
			res.redirect("/watch/" + id);
		} else {
			res.redirect("/watch/" + id);
		}
	});
}); // UPDATE

app.delete("/watch/:id", isLoggedIn, function(req, res){ 
	const id = req.params.id;
	
	getWatchList(id).then((watchList) => {
		watchList["selection"].forEach((selectionId) => {
			Selection.findOneAndDelete({_id: selectionId}, function(err, selection){
				if(err || !selection) {
					console.log("An Error has Occurred. Selection.findOneAndDelete() failed at DELETE route `/watch/" + id + "`");
					console.log(err);
				} else {
					console.log("Watchlist " + id + " selection: " + selectionId + " deleted.");
				}
			});
		});
		
		Watchlist.findOneAndDelete({_id: id}, function(err, watchLists){
			if(err || !watchLists) {
				console.log("An Error has Occurred. Watchlist.findOneAndDelete() failed at DELETE route `/watch/" + id + "`");
				console.log(err);
				res.status(400).send(err);
			} else {
				console.log("Watchlist " + id + " deleted.");
				console.log(watchLists);
				res.redirect("/watch");
			}
		});
	}).catch(function(err){
		console.log("An Error has Occurred. getWatchList() failed at DELETE route `/watch/" + id + "`");
		console.log(err);
	}); // Resolved promise grabs the saved watchlist;
}); // DELETE


// ==========================
// SELECTION ROUTES
// ==========================

app.post("/watch/:id/selection", isLoggedIn, function(req, res){
	console.log("post: /watch/:id/selection");
	const id		= req.params.id;
		 
	const selection = {
		title: req.body.selection["Title"],
		imdbID: req.body.selection["imdbID"],
		image: req.body.selection["Poster"]
	}
	
	Selection.create(selection, function(err, newSelection){
		if(err || !newSelection){
			console.log("An Error has Occurred. Selection.create() failed at route `/watch/" + id + "/selection`");
			console.log(err);
			res.status(400).send(err);
		} else {
			Watchlist.findOne({_id: id}, function(err, watchList) {
				if(err || !watchList) {
					console.log("An Error has Occurred. Watchlist.fineOne() failed at route `/watch/`" + id + "/selection`");
					console.log(err);
					res.status(400).send(err);
				} else {
					watchList.selection.push(newSelection);
					
					if(watchList.imageList.length < 4) {
						watchList.imageList.push(selection["image"]);
					} else {
						watchList.imageList.shift();
						watchList.imageList.push(selection["image"]);
					} // Queuing/Dequeing images for the watchlist image 
					
					watchList.save(function(err,response){
						if(err || !response) {
							console.log("An Error has Occurred. watchlist.save() failed at route `/watch/`" + id + "/selection`");
							console.log(err);
							res.status(400).send(err);
						} else {
							console.log("Added " + selection["imdbID"] + " to watch list " + id);
							console.log("watchlist imageList: " + watchList["imageList"]);
							res.status(200).send({status: "Added " + selection["imdbID"] + " to watch list " + id});
						}
					});
					
				}
			});
			
		} // Send success status to .ajax call from client
	}); // Adds selection to db  
}); // CREATE

app.delete("/watch/:id/selection/:selection_id", isLoggedIn, function(req, res){
	console.log("delete: /watch/:id/selection/:selection_id");
	const watchListId = req.params.id,
		  selectionId = req.params.selection_id;
		
	Selection.findOneAndDelete({_id: selectionId}, function(err, movieList){
		if(err || !movieList){
			console.log("An Error has Occurred. Selection.findOneAndDelete() failed at /watch/:id/selection/:selection_id");
			console.log(err);
			res.status(400).send(err);
		} else {
			
			Watchlist.findOne({_id: watchListId}, function(err, watchList) {
				if(err || !watchList) {
					console.log("An Error has Occurred. Watchlist.findOne() failed at /watch/:id/selection/:selection_id");
					console.log(err);
					res.status(400).send(err);
				} else {
					const index = watchList.selection.indexOf(selectionId);
					watchList.selection.splice(index, 1);
					watchList.save(function(err, response) {
						if(err || !response) {
							console.log("An Error has Occurred. watchlist.save() failed at /watch/:id/selection/:selection_id");
							console.log(err);
							res.status(400).send(err);
						} else {
							res.redirect("/watch/" + watchListId);
						}
					});
				}
			});
			
		} // Sucessful removal from the db will notify user and/or remove the selection from their watchlist
	}); // Removes selection from db
}); // DESTROY: Handle requests to remove selections from db collection

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
			return res.render('register');
		} // If we cannot register (create the new user), throw err and end function by returning to register page
		passport.authenticate("local")(req, res, function(){
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
		failureRedirect: "/login"
	}), function(req, res){
}); // Handle user login, uses `middleware` in the post route arguments`. The middleware will check in `users` collection for the submitted login and compare the password with the `hash` and `salt` key. 

app.get("/logout", function(req, res){
	req.logout();
	res.redirect("/");
}); // Handle logout request. req.logout() uses the simple passport logout functionality

// ==================
// MIDDLEWARE DEFINITIONS
// ==================

function isLoggedIn(req, res, next){
	if(req.isAuthenticated()){
		return next();
	} // When passing isLoggedIn to a route, if the req is validated by passport, the following callback function will be used
	res.redirect("/login"); // If not, we redirect to the login page and the secret route's callback is ignored
} // Will be used as the middleware function for checking authentication when going down specific routes

app.listen(process.env.PORT || 3000, process.env.IP, function(){
	console.log("IWIL has started!!!");
});