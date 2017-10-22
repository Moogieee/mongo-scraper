// Dependencies
var express = require('express');
var exphbs = require('express-handlebars');
var bodyParser = require('body-parser');
var logger = require('morgan');
var mongoose = require('mongoose');

// Requiring our Note and Article models
var Comments = require('./models/Comments.js');
var Article = require('./models/Article.js');

// Our scraping tools
var request = require('request');
var cheerio = require('cheerio');
var axios = require('axios');

// Set mongoose to leverage built in JavaScript ES6 Promises
mongoose.Promise = Promise;

// Initialize Express
var app = express();

// Use morgan and body parser with our app
app.use(logger('dev'));
app.use(bodyParser.urlencoded({ extended: false }));

//setting up handlebars
app.engine('handlebars', exphbs({ defaultLayout: 'main' }));
app.set('view engine', 'handlebars');

// Make public a static dir
app.use(express.static('public'));

// Database configuration with mongoose
mongoose.Promise = Promise;
mongoose.connect('mongodb://localhost/onionscraper', {
    useMongoClient: true
});

var db = mongoose.connection;

// Show any mongoose errors
db.on('error', function(error) {
  console.log('Mongoose Error: ', error);
});

// Once logged in to the db through mongoose, log a success message
db.once('open', function() {
  console.log('Mongoose connection successful.');
});

app.listen(3000, function() {
    console.log('\nApp running on port 3000.\n');
});


//========================================================//
//                                                        //
//                        ROUTES                          //
//                                                        //
//========================================================//


app.get('/', function(req, res) {
  res.render('index');
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
  Article
  .findOne({ '_id': req.params.id })
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
                  res.send(doc);
              }
          });
      }
  });
});