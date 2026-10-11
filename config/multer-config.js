const multer = require('multer');

const storage = multer.memoryStorage();
const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB max
    },
    fileFilter: (req, file, cb) => {
        if (allowedMimeTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only JPEG, PNG, and WebP images are allowed.'));
        }
    },
});

module.exports = upload;