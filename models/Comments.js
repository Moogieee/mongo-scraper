var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var CommentSchema = new Schema({
    title: {
        type: String
    },
    body: {
        type: String
    }
});

//create the Comments model with the CommentsSchema
var Comments = mongoose.model('Comments', CommentSchema);

//export the Comments model
module.exports = Comments;