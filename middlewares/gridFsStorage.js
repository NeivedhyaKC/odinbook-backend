const { GridFsStorage } = require('multer-gridfs-storage');
var path = require('path');
const multer = require('multer');
const crypto = require('crypto');

const storage = new GridFsStorage({
    // eslint-disable-next-line no-undef
    url: process.env.MONGO_URL,
    file: (req, file) => {
      return new Promise((resolve, reject) => {
        crypto.randomBytes(16, (err, buf) => {
          if (err) {
            reject(err);
          }
          const filename = buf.toString('hex') + path.extname(file.originalname);
          const fileInfo = {
            filename: filename,
            bucketName: 'uploads'
          };
          req.fileInfo = fileInfo;
          resolve(fileInfo);
        });
      })
    }
});

const upload = multer({ storage });
module.exports = function getUpload()
{
    return upload;
}