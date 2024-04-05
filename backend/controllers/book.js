const { Console } = require('console');
const Book = require('../models/Book');
const fs = require('fs');
const path = require('path');

exports.getAllBooks = (req, res, next) => {
    Book.find()
        .then(books => res.status(200).json(books))
        .catch(error => res.status(400).json({ error }));
};

exports.getBestRatings = (req, res, next) => {
    Book.find()
        .sort({ averageRating: -1 })
        .limit(3)
        .then(books => res.status(200).json(books))
        .catch(error => res.status(400).json({ error }))
};

exports.createBook = (req, res, next) => {
    const bookObject = JSON.parse(req.body.book);
    delete bookObject._id;
    delete bookObject._userId;
    const book = new Book({
        ...bookObject,
        userId: req.auth.userId,
        imageUrl: `${req.protocol}://${req.get('host')}/images/${path.parse(req.file.originalname).name}.webp`
    });
    book.save()
        .then(() => res.status(201).json({ message: 'Livre enregistré !' }))
        .catch(error => res.status(400).json({ error }));
};

exports.getOneBook = (req, res, next) => {
    Book.findOne({ _id: req.params.id })
        .then(book => res.status(200).json(book))
        .catch(error => res.status(404).json[{ error }]);
};

exports.modifyBook = (req, res, next) => {
    const bookObject = req.file ? {
        ...JSON.parse(req.body.book),
        imageUrl: `${req.protocol}://${req.get('host')}/images/${path.parse(req.file.originalname).name}.webp`
    } : { ...req.body };
  
    delete bookObject._userId;
    Book.findOne({_id: req.params.id})
        .then((book) => {
            if (book.userId != req.auth.userId) {
                res.status(401).json({ message : 'Not authorized' });
            } else {
                const filename = book.imageUrl.split('/images/')[1];
                if (req.file && filename != bookObject.imageUrl) {
                    fs.unlink(`images/${filename}`, (e) => console.log(e))
                }
                Book.updateOne({_id: req.params.id}, {...bookObject, _id: req.params.id})
                    .then(() => res.status(200).json({ message : 'Livre modifié!' }))
                    .catch(error => res.status(401).json({ error }));
            }
        })
        .catch((error) => {
            res.status(400).json({ error });
        });
};

exports.deleteBook = (req, res, next) => {
    Book.findOne({_id: req.params.id})
        .then(book => {
            if (book.userId != req.auth.userId) {
                res.status(401).json({message: 'Not authorized' });
            } else {
                const filename = book.imageUrl.split('/images/')[1];
                fs.unlink(`images/${filename}`, () => {
                    Book.deleteOne({_id: req.params.id})
                        .then(() => {res.status(200).json({ message: 'Livre supprimé !' })})
                        .catch(error => res.status(401).json({ error }));
                });
            }
        })
        .catch( error => {
            res.status(500).json({ error });
        });
};

exports.rateBook = (req, res, next) => {
    const { userId, rating } = req.body;
    Book.findOne({_id: req.params.id})
        .then(book => {
            // on vérifie si on trouve le livre
            if (!book) {
                res.status(404).json({ message: 'Livre non trouvé' });
            }
            // On vérifie si le livre a déjà été noté
            const existingRating = book.ratings.find(item => item.userId === userId);
            if (existingRating) {
                res.status(400).json({ message: 'Livre déjà noté' });
            }
            // On ajoute la nouvelle note
            book.ratings.push({ userId, grade: rating });
            // On calcule la nouvelle note moyenne
            const totalRatings = book.ratings.reduce((sum, rating) => sum + rating.grade, 0);
            book.averageRating = totalRatings / book.ratings.length;
            // On enregistre les modifications
            book.save()
                .then(updateBook => res.status(200).json(updateBook))
                .catch(error => res.status(500).json({ error }));
        })
        .catch(error => res.status(500).json({ error }));
};