const 	express 	= require("express"),
	  	router		= express.Router(),
	  	passport	= require("passport"),
	  	User		= require("../models/user");

router.get("/", function(req, res){
	res.render("home");
}); // Landing Page

// ==========================
// AUTH ROUTES
// ==========================

router.get("/register", function(req, res){
	res.render("register");
}); // NEW: form input for adding a new user
	
router.post("/register", function(req, res){
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

router.get("/login", function(req, res){
	res.render("login");
}); // Show login form

router.post("/login", passport.authenticate("local", 
	{
		successRedirect: "/",
		failureRedirect: "/login",
		error: "Login failed. Username or password was incorrect.",
    	failureFlash: true
	}), function(req, res){
}); // Handle user login, uses `middleware` in the post route arguments`. The middleware will check in `users` collection for the submitted login and compare the password with the `hash` and `salt` key. 

router.get("/logout", function(req, res){
	req.logout();
	req.flash("success", "Signed out. Goodbye!");
	res.redirect("/");
}); // Handle logout request. req.logout() uses the simple passport logout functionality

module.exports = router;