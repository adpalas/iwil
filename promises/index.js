const 	request 	= require("request"),
	  	bodyParser	= require("body-parser"),
	  	mongoose 	= require("mongoose"),
	  	Selection	= require("../models/selection"),
	  	Watchlist	= require("../models/watchlist")

function isEmpty(obj) {
  for(var prop in obj) {
    if(obj.hasOwnProperty(prop)) {
      return false;
    }
  }

  return JSON.stringify(obj) === JSON.stringify({});
}

// ==========================
// PROMISES
// ==========================

const promiseObj = {}

promiseObj.movieSearch = function(search) {
	return new Promise(function(resolve, reject){
		const url 			= 'https://www.omdbapi.com/?s=' + search + '&type=movie&apikey=' + process.env.OMDBKEY,
			  movieResults 	= [];
		
		request(url, function(error, response, body){
			var searchResults = JSON.parse(body);
			
			if(!error && response.statusCode == 200 && searchResults["Response"] !== "False") {
				searchResults["Search"].forEach(function(movie){
					if(movie["Poster"] === "N/A") {
						return;
					} // Filter results that are missing posters
					movieResults.push(movie);
				});
				
				if(movieResults.length === 0) {
					reject("Movie not found!");
				} else {
					resolve(movieResults);
				}
			} else {
				console.log("An Error has Occurred. movieSearch()");
				console.log(error);
				reject(searchResults["Error"]);
			}
		}); // request call to OMDB for search by 's' parameter
	}); // create a new promise when this function is run
} // A promise definition that parses input if needed and makes requests to omdb 

promiseObj.getMovieDetails = function(movie){
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
				console.log("An Error has Occurred. getMovieDetails()");
				console.log(e);
				reject(e);
			}
		}); // An http request to omdb to retrive movie details based on param: {imdbID: "____"}.
	}); // create a new promise when this function is run
} // A promise definition that requests details of a movie from omdb by param: {imdbID: "____"}.

promiseObj.findAvailability = function(movie) {
	return new Promise(function(resolve, reject){
		request({
			method: 'GET',
			url: "https://utelly-tv-shows-and-movies-availability-v1.p.rapidapi.com/idlookup",
			qs: {country: 'US', source_id: movie["imdbID"], source: 'imdb'},
			headers: {
				'x-rapidapi-host'	: 'utelly-tv-shows-and-movies-availability-v1.p.rapidapi.com',
				'x-rapidapi-key'	: process.env.UTELLYKEY,
				useQueryString	: true
			}
			
		}, function (error, response, body) {
				// in addition to parsing the value, deal with possible errors
				if (error || response.statusCode != 200) return reject(error);
				try {
					const movieDetails = JSON.parse(body);
					const availabilityInUS = []// Ran into a new issue with Utelly. Country param is no longer working for some reason. 7/11/2020
					
					if(!isEmpty(movieDetails["collection"])) {
						movieDetails["collection"].locations.forEach(function(movie){
							if (movie.country[0] === "us") {
								availabilityInUS.push(movie);
							}
						}); // For now, we need to go through the unfiltered results of locations and grab options available in the 'us'.
						resolve(availabilityInUS);
					} else {
						resolve(availabilityInUS);
					}
					
				} catch(e) {
					console.log("An Error has Occurred. findAvailability()");
					console.log(e);
					reject(e);
				}
		}); // An http request from utelly movie streaming details based on param: {imdbID: "____"}.
	}); // create a new promise when this function is run
} // A promise definition that requests from utelly movie streaming details based on param: {imdbID: "____"}.

promiseObj.checkIcon = function(provider) {
	return new Promise(function(resolve, reject){
		try {
			request({
				method: 'GET',
				url: provider["icon"]
			}, function(error, response, body) {
				if(provider["display_name"].includes("IVAUS")){
					provider["display_name"] = provider["display_name"].split("IVAUS")[0];
				}
				
				if (error || response.statusCode != 200) {
					provider["icon"] = null;	
					return resolve(provider);
				} else {
					resolve(provider);
				}
			}); // An http request to check on returned icon links from utelly for any 404 errors. Also parses out IVAUS from display name
		} catch(e) {
			console.log("An Error has Occurred. checkImage()");
			console.log(e);
			reject(e);
		}
	});
} // A promise definition that requests the icon image provided by the streaming providers on utelly. This will check if the image cannot be loaded and modify it if needed.

promiseObj.allWatchLists = function(){
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

promiseObj.getUserWatchLists = function(author){
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

promiseObj.getWatchList = function(id) {
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

promiseObj.getSelection = function(id) {
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

promiseObj.getMovieResults = function() {
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

module.exports = promiseObj;