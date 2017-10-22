var request = require('request');
var cheerio = require('cheerio');

var Comments = require('../models/Comments.js');
var Article = require('../models/Article.js');

module.exports = function(app) {
    app.get('/', function(req, res) {
        res.render('index', {
            title: 'Main',
            layout: 'main.handlebars',
            condition: false
        });
    });

    app.get('/article', function(req, res) {
        res.render('article', {
            title: 'Archives',
            layout: 'main.handlebars',
            condition: true
        });
    });

    //a GET request to scrape The Onion website
    app.get('/scrape', function(req, res) {
        //grab the body of the html with request
        request('https://www.theonion.com/', function(error, response, html) {
            var $ = cheerio.load(html);
            //grab every h3 within the article tag
            $('article h3').each(function(i, element) {
                //save an empty result object
                var result = {};

                result.title = $(this).children('a').text();
                result.summary = $(this).children('p').text();
                result.link = $(this).children('a').attr('href');

                var entry = new Arcticle(result);

                //saving entry to db
                entry.save(function(err, doc) {
                    if(err) {
                        console.log(err);
                    }
                    else {
                        console.log(doc);
                    }
                });
            });
        });
        res.send('Scrape Complete!');
    });

    //get the articles we scraped from the mongoDB
    app.get('/articles', function(req, res) {
        //grab every doc in the Articles array
        Article.find({}, function(error, doc) {
            if (error) {
                console.log(error);
            }
            else {
                res.json(doc);
            }
        });
    });

    //grab an article by it's ObjectId
    app.get('/articles/:id', function(req, res) {
        Article.findOne({ '_id': req.params.id })
        //populate comments that are associated with article id
        .populate('comments')
        .exec(function(error, doc) {
            if (error) {
                console.log(error);
            }
            else {
                res.json(doc);
            }
        });
    });

    //create new comment or replace exisiting comment
    app.post('/articles/:id', function(req, res) {
        //create a new comment and pass the req.body to the entry
        var newComment = new Comment(req.body);

        //save new comment to db
        newComment.save(function(error, doc) {
            if (error) {
                console.log(error);
            }
            else {
                //use the article id to find and update it's comments
                Article.findOneAndUpdate({ '_id': req.params.id }, { 'note': doc._id })
                .exec(function(err, doc) {
                    if (err) {
                        console.log(err);
                    }
                    else {
                        console.log(doc);
                    }
                });
            }
        });
    });
};

