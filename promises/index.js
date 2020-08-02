const 	axios 		= require("axios"),
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
		
		axios.get(url).then(function (searchResults) {
			try {
				searchResults.data["Search"].forEach(function(movie){
					if(movie["Poster"] === "N/A") {
						return;
					} // Filter results that are missing posters
					movieResults.push(movie);
				});
			} catch(err) {
				console.log("No results found for search: " + search);
				reject("Movie not found!");
			}
			
			if(movieResults.length === 0) {
				reject("Movie not found!");
			} else {
				resolve(movieResults);
			}
		}).catch(function (error) {
			console.log("An Error has Occurred. movieSearch()");
			console.log(error);
			reject(searchResults["Error"]);
		});
	}); // create a new promise when this function is run
} // A promise definition that parses input if needed and makes axios requests to omdb

promiseObj.getMovieDetails = function(movie){
	return new Promise(function(resolve, reject){
		const url = 'https://www.omdbapi.com/?i=' + movie["imdbID"] + '&plot=full&apikey=' + process.env.OMDBKEY;
		
		axios.get(url).then(function (movieDetails) {
			resolve(movieDetails.data);
		}).catch(function (error) {
			console.log("An Error has Occurred. getMovieDetails()");
			console.log(error);
			reject(error);
		});
	}); // create a new promise when this function is run
} // A promise definition that requests details of a movie from omdb by param: {imdbID: "____"} using axios.

promiseObj.findAvailability = function(movie) {
	return new Promise(function(resolve, reject){
		axios({
			"method":"GET",
			"url":"https://utelly-tv-shows-and-movies-availability-v1.p.rapidapi.com/idlookup",
			"headers":{
				"content-type":"application/octet-stream",
				"x-rapidapi-host":"utelly-tv-shows-and-movies-availability-v1.p.rapidapi.com",
				"x-rapidapi-key":process.env.UTELLYKEY,
				"useQueryString":true
		},"params":{
			"country":"us",
			"source_id": movie["imdbID"],
			"source":"imdb"
		}}).then((movieDetails)=>{
			if(!isEmpty(movieDetails.data.collection)){
				resolve(movieDetails.data.collection["locations"]);
			} else {
				resolve([]);
			}
			
		})
		.catch((error)=>{
			console.log("An Error has Occurred. findAvailability()");
			console.log(error);
			reject(error);
		})
	}); // create a new promise when this function is run
} // A promise definition that requests from utelly movie streaming details based on param: {imdbID: "____"} using axios.

promiseObj.checkIcon = function(provider) {
	return new Promise(function(resolve, reject){
		if(provider["display_name"].includes("IVAUS")){
			provider["display_name"] = provider["display_name"].split("IVAUS")[0];
		}
		try {
			axios.get(provider["icon"]).then(function (response) {
				resolve(provider);
			}).catch(function (error) {
				provider["icon"] = null;	
				resolve(provider);
			}); // In axios, a 404 reponse will enter the catch block. Will use this to update the provider for our promise return.
		} catch(e){
			console.log("An Error has Occurred. checkImage()");
			console.log(e);
			reject(e)
		}
	});
} // A promise definition that requests the icon image provided by the streaming providers on utelly. This will check if the image cannot be loaded and modify object's ey values it if needed.

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

module.exports = promiseObj;