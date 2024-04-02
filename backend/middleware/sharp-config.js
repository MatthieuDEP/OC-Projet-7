const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

module.exports = (req, res, next) => {
    try {
        if (!req.file) {
            return next();
        } else {
            const ref = path.parse(req.file.originalname).name;
            sharp(req.file.path)
                .resize(500)
                .webp({ quality: 80 })
                .toFile('images/' + ref + '.webp')
                .then(() => fs.unlink(req.file.path, (e) => console.log(e)));
            next();
        }
    } catch(error) {
        res.status(401).json({ error });
    }
};