var express = require('express'),
    mongoose = require('mongoose'),
    passport = require('passport'),
    localStrategy = require('passport-local'),
    User = require('../model/users'),
    nodemailer =require("nodemailer"),
    ejs = require('ejs'),
    path = require("path"),
    router = express.Router();

mongoose.connect("mongodb+srv://zairzacetb:arpanet123@cluster0-coz0t.mongodb.net/test", {
    useNewUrlParser: true
});

// Utility to check if a string is a valid event ID
function isValidEventID(value) {
  return (/^\d+$/.test(value)) && (event_json.hasOwnProperty(value));
}

router.use(require("express-session")({
    secret: "Secrets shall not be disclosed",
    resave: false,
    saveUninitialized: false
}));
router.use(passport.initialize());
router.use(passport.session());

//Initialization of passportjs
passport.use(new localStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
router.use(passport.initialize());
router.use(passport.session());

///////////////////////////////////////////////////////////

const transporter = nodemailer.createTransport({
  service:"Gmail",
  auth:{
  type:"OAuth2",
    user:"prateek.mohanty2599@gmail.com",
    clientId: "714535567108-ic2r9blns2uirlr64lrr7tr4022mq8mo.apps.googleusercontent.com",
    clientSecret: "G0McjpXhqA8bXVXwzA6cFpX2",
    refreshToken: "1//042was1i6eFkeCgYIARAAGAQSNwF-L9IrY4u2XRqbxrjWKxorHuzjwnFOSsu6ymB5ydJiWG88NsWd6ve0fm0eCog3JKn-m7BLDco"
  }
});

router.get('/getpaidstatus/:uid', (req, res, next) => {
var res_data = {};
    User.findById(req.params.uid, (err ,document) => {
        if (document.paidstatus == "unpaid") {
            res_data.paid = false
        }
        if (document.paidstatus == "paid") {
            res_data.paid = true
        }
        if (err) {
            res_data.err = err;
        }
        res.send(JSON.stringify(res_data));
    })
}); 

router.get('/togglepaidstatus/:uid', (req, res, next) => {
    User.findById(req.params.uid, (err, doc) => {
        if (err) {
            res.statusCode = 500;
            res.end();
        } else {
        if (doc.paidstatus === "unpaid") {
            doc.paidstatus = "paid"
        }else {
            doc.paidstatus = "unpaid"
        }
        doc.save((err) => {
            if (err) {
                res.statusCode = 500;
                res.end();
            } else {
                res.send("OK");
            }
        });
        }
    });
});

router.post('/register', (req, res) => {
    const newUser = new User({
        username: req.body.username,
        name: req.body.name,
        gender: req.body.gender,
        phone: req.body.phone,
        college: req.body.college
      });
    User.register(newUser, req.body.password, (err, user) => {
        if(err) return res.redirect(`/register?err=${err.message}`);
                
        passport.authenticate("local")(req, res, () => {
          ejs.renderFile(__dirname+"/mailTemplate.ejs", { name: req.user.name, uid: req.user.uid }, (err, data) => {
            if (err) {
              console.log(err)
            }
            // res.locals.message = "Registered successfully";
            transporter.sendMail({
              from: 'Xtasy 2020 Team, CETB',
              to: req.user.username,
              subject: 'Xtasy 2020 | Registration Successful',
              attachments: [
                {
                  filename: "xtasy.jpg",
                  path: path.join(__dirname, "..", "/public/images/xtasy.jpg"),
                  cid:"logo"
                }
              ],
              html: data
            }, function(error, info){
              if (error) {
                console.log("mail error",error);
              } else {
                console.log('Email sent: ' + info.response);
              }
            });
          })
            if (req.query.ref) {
                res.redirect(`${req.query.ref}?registerSuccess=1`);
              } else {
                res.redirect('/?registerSuccess=1');
              }
        });
    });
});

router.post('/login', function(req, res, next) {
    passport.authenticate('local', function(err, user, info) {
      if (err) {
         return console.log(err); 
        }
      if (!user) {
         return res.redirect(`/login?err=${info.message}`); 
        }
        // console.log('hash',user.getHash());
      req.logIn(user, function(err) {
        if (err) {
           return console.log(err); 
        } else {
          // res.locals.message = `Welcome ${user.name}`;
          if (req.query.ref) {
            return res.redirect(`${req.query.ref}?loginSuccess=1`);
          } else {
            res.redirect('/?loginSuccess=1');
          }
        }
      });
    })(req, res, next);
  });
  

router.get('/logout', (req, res) => {
    req.logout();
    res.redirect("/?logoutSuccess=1");
});

/* Backend for event registration */
router.get('/register/:eventID', (req, res) => {
    // Checks if the eventID is a valid event ID
    if (isValidEventID(req.params.eventID)) {
      User.findOne({ _id: req.user._id }, (err, user) => {
        user.events.push(req.params.eventID)
        user.save((err, data) => {
          if (err) {
            console.log(err);
            res.send("F");
          }
          else {
            res.send("T");
          }
        });
      });
    } else {
      res.statusCode = 500;
      res.send('F');
    }
  });
  
  router.get('/chregister/:eventID', (req, res) => {
    // Checks if the eventID is a valid event ID
    if (isValidEventID(req.params.eventID)) {
      var ID = req.params.eventID;
      User.findOne({ _id: req.user._id }, (err, user) => {
        if (err) {
          res.statusCode = 500;
          res.send('F');
        }
        else {
  
          let found = user.events.includes(ID);
          if (found)
            res.send("T");
          else
            res.send("F");
        }
      });
    } else {
      res.statusCode = 500;
      res.send('F');
    }
  });
  
  router.get('/unregister/:eventID', (req, res) => {
    // Checks if the eventID is a valid event ID
    if (isValidEventID(req.params.eventID)) {
      User.findOne({ _id: req.user._id }, (err, user) => {
        user.events.pull(req.params.eventID)
        user.save((err, data) => {
          if (err) {
            res.statusCode = 500;
            res.send("F");
          }
          else {
            res.send("T");
          }
        });
      });
    } else {
      res.statusCode = 500;
      res.send('F');
    }
  });
  
///////////////////////////////////////////////////////////

module.exports = router;