/* eslint-disable no-undef */
const mongoose = require("mongoose");


const Schema = mongoose.Schema;

const PostSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    content: { type: String, required: true },
    photoUrl: { type: String },
    postedAt: { type: Date, required: true },
    likes: [{ type: Schema.Types.ObjectId, ref: "User" }],
    comments: [{
        userId: { type: Schema.Types.ObjectId, ref: "User" },
        comment: { type : String }
    }]
});

module.exports = mongoose.model("Post", PostSchema);