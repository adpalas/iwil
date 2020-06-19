var mongoose = require("mongoose");

var watchListSchema = new mongoose.Schema({
	name: String,
	description: String,
	author: {
		id: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User"
		},
		username: String
	},
	dateAdded: {type: Date, default: Date.now},
	imageList: [String],
	selection: [
		{
			type: mongoose.Schema.Types.ObjectId,
			ref: "selection"
		}
	] // Creates the relationship between selectionn and watchList. A separate selection collection needs to be defined above for this to work.
}); // Collection definition (schema) for db `YelpCamp`

module.exports = mongoose.model("watchList", watchListSchema); // Compiling the schema's format and passes it to collection `watchList`.