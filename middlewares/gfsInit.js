const Grid = require('gridfs-stream');
const dbConnection = require("./dbInit");

let gfs;
let gridFsBucket;


module.exports = function gfsAndDbInit() {
    if (gfs === undefined || !gfs || gfs === null)
    {
        let { db, mongoose } = dbConnection();
        db.once("open", () => {
            gfs = Grid(db.db, mongoose.mongo);
            gfs.collection('uploads');
        })

        gridFsBucket = new mongoose.mongo.GridFSBucket(db, { bucketName: "uploads"});

        return { gfs, gridFsBucket };
    }
    else
    {
        return { gfs, gridFsBucket };
    }
}