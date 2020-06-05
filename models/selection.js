var mongoose = require("mongoose");

var selectionSchema = new mongoose.Schema({
	title: String,
	image: String,
	imdbID: String,
	dateAdded: {type: Date, default: Date.now}
}); // Collection definition (schema) for db `iwil_v*`

module.exports = mongoose.model("selection", selectionSchema);