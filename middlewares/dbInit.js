const mongoose = require("mongoose");



module.exports = function dbConnection()
{
        // eslint-disable-next-line no-undef
    const mongoDB =process.env.MONGO_URL;
    mongoose.set('strictQuery', false);
    mongoose.connect(mongoDB, { useNewUrlParser: true, useUnifiedTopology: true });
    const db = mongoose.connection;
    db.on("error", console.error.bind(console, "MongoDB connection error:"));
    return { db, mongoose };
}