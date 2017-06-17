
const express = require("express");
const app = express();
const PORT = process.env.PORT || 8080; // default port 8080
// const cookieParser = require('cookie-parser')
const bcrypt = require('bcrypt');
const cookieSession = require('cookie-session');

// app.use(cookieParser())
app.set("view engine", "ejs");
app.use(cookieSession({
  name: "session",
  keys: ["This-is-my-secrete-key"],
  maxAge: 20 * 365 * 24 * 60 * 60 * 1000 // 20 years
 }));

var urlDatabase = {
  "b2xVn2": {
    longURL: "http://www.lighthouselabs.ca",
    userId: 'userRandomID'
  },
  "9sm5xK": {
    longURL: "http://www.google.com",
    userId: 'user2RandomID'
  }
};

const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
 "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
}

// This function generates a new random string
// output: string
function generateRandomString() {
  var text = "";
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for(var i = 0; i < 6; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
};

  // This function returns the subset of the urlDatabase
  // that belongs to the user with id
function usersUrls(userId) {
  let results = {};
  for(let key in urlDatabase) {
    let url = urlDatabase[key];
    if (url.userId === userId) {
      results[key] = url;
    }
  }
  return results;
};

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

//Middleware
app.use((req, res, next) => {
  if(users[req.session.user_id]){
    res.locals.username = users[req.session.user_id].email;
  } else {
    res.locals.username = ""
  }
  res.locals.user_id = req.session.user_id
  next();
});

//-----------------------------------routes ------------------------------------------//

// Home page
// user is not logged in -> /login
// user is logged in -> /urls
app.get("/", (req, res) => {
  res.redirect("/login");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/urls", (req, res) => {
  let userId = req.session.user_id;
  let templateVars = {
    urls: usersUrls(userId)
  };
  res.render("urls_index", templateVars);
});

app.post("/urls", (req, res) => {
  var shortURL, longURL;
  longURL = req.body.longURL;
  //Check if the ShortURL exists and user is editing it.
  if(req.body.shortURL){
    shortURL = req.body.shortURL;
  }//Edit and updrate the URL;
  else { //Adding a new URL
    shortURL = generateRandomString();
  }
  //Add or update the database;
  urlDatabase[shortURL] = {
    longURL: longURL,
    userId: req.session.user_id
  };
  res.redirect(`/urls`);
});

// shows page allows user to add a new URL
// user is not logged in -> /login
app.get("/urls/new", (req, res) => {
  if (req.session.user_id){
    res.render("urls_new");
  } else {
    res.render('login_page');
  }
});

app.get("/urls/:id", (req, res) => {
  let templateVars = {
    shortURL: req.params.id,
    url: urlDatabase[req.params.id].longURL,
  };
  res.render("urls_show", templateVars);
});

app.post("/urls/:id", (req, res) => {
  urlDatabase[req.params.id] = req.body.Url
  res.redirect('/urls' + req.params.id);
  urlDatabase(shortUR, longUrl);
});

app.post("/urls/:id/delete", (req, res) =>{
  delete urlDatabase[req.params.id];
  res.redirect("/urls");
});

app.get('/register', (req, res) => {
  res.render("user-registration");
});

app.post('/register', (req, res) => {
  const {email, password} = req.body;
  const hashed_password = bcrypt.hashSync(password, 10);
  if (email === "" || password === ""){
    res.status(401).send("Please fil out login")
    return;
   }
  for (let user in users) {
   if (users[user].email === email) {
    console.log("Found match: " + JSON.stringify(users[user]) + " with " + email);
     res.status(401).send("user exists!!!!")
     return;
   }
  }
  const id = generateRandomString();
  users[id] = {
    id,
    email,
    password : bcrypt.hashSync(password, 10)
  }

  // res.cookie('user_id', id);
  req.session.user_id = id
  res.redirect('/urls');
});

 app.get('/login', (req, res) => {
   res.render("login_page")
 });

 app.post('/login', (req, res) => {
  for (let userId in users){
    let user = users[userId];
    if ((user.email === req.body.email) && (bcrypt.compareSync(req.body.password, user.password))){
      req.session.user_id === user.id;
      res.redirect('/urls');
      return;
    }
  }
  res.status(401).send("Wrong user<br><a href='/login'> Login to TinyApp</a><br> Or <br><a href='/register'> Regiter to TinyApp </a>");
});

app.get('/logout', (req, res)=>{
  req.session= null;
  res.redirect('/login');
})

// redirect user to the external web page
// short URL does not exitst -> not found
app.get("/u/:shortURL", (req, res) => {
  for (let key in urlDatabase){
    if (req.params.shortURL === key){
      let longURL = urlDatabase[req.params.shortURL].longURL;
      res.redirect(longURL); //({key: value})
    }
  }
  res.status(404).send("Sorry URL not find<br><a href='/urls'>Return to TinyApp</a>");
});


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

