const mongoose = require('mongoose');

const bookSchema = mongoose.Schema({
    title: { type: String },
    author: { type: String },
    imageUrl: { type: String },
    year: { type: Number },
    genre: { type: String },
    ratings: [
        {
            grade: { type: Number },
        },
    ],
    averageRating: { type: Number }
});

module.exports = mongoose.model('Book', bookSchema);