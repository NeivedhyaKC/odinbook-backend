/* eslint-disable no-undef */
const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const UserSchema = new Schema({
    firstName : { type: String, required: true, maxLength: 100 },
    lastName : { type: String, required: true, maxLength: 100 },
    email : { type: String, required: true, maxLength: 100 },
    password: { type: String, required: true },
    description: { type: String },
    photoUrl: {type : String},
    friends: [{ type: Schema.Types.ObjectId, ref: "User" }],
    friendRequests: [{ type: Schema.Types.ObjectId, ref: "User" }],
    savedPosts :[{type:Schema.Types.ObjectId,ref:"Post"}]
});

module.exports = mongoose.model("User", UserSchema);

