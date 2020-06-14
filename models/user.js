var mongoose 				= require("mongoose"),
	passportLocalMongoose 	= require("passport-local-mongoose");

var userSchema = new mongoose.Schema({
	username: String,
	password: String
}); // The schema for associating with watchlists specific to a user

userSchema.plugin(passportLocalMongoose); // This will apply all authentication methods provided by passportLocalMongoose!

module.exports = mongoose.model("User", userSchema);