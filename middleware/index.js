// ==================
// MIDDLEWARE DEFINITIONS
// ==================

const middlewareObj = {};

middlewareObj.isLoggedIn = function(req, res, next){
	if(req.isAuthenticated()){
		return next();
	} // When passing isLoggedIn to a route, if the req is validated by passport, the following route's callback function will be used
	req.flash("error", "Please Login.");
	res.redirect("/login"); // If not, we redirect to the login page and following route's callback is ignored
} // Will be used as the middleware function for checking authentication when going down specific routes

module.exports = middlewareObj;