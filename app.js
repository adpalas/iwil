// ==========================
// APP CONFIG
// ==========================

const 	express 				= require("express"),
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

/* Route Imports */

const	indexRoutes		= require("./routes/index"),
	  	searchRoutes	= require("./routes/search"),
	  	watchRoutes		= require("./routes/watch"),
	  	selectionRoutes	= require("./routes/selection");

dotenv.config(); // Utilize the .env file for all sensative url's and api keys

mongoose.connect(process.env.DATABASEURL, 
{ 
	useNewUrlParser: true,
	useUnifiedTopology: true
}).then(() => {
	console.log("Connected to DB");
}).catch(err => {
	console.log("ERROR", err.message);
}); // Create or Connect to db `iwil_*`

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

app.use(indexRoutes);
app.use("/search", searchRoutes);
app.use("/watch", watchRoutes);
app.use("/watch/:id/selection", selectionRoutes);

app.listen(process.env.PORT || 3000, process.env.IP, function(){
	console.log("IWIL has started!!!");
});