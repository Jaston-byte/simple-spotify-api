const express = require("express");
const querystring = require("querystring");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const winston = require("winston");
const dotenv = require("dotenv");
// You need to dotenv.config() to actually import the environmental vars
const result = dotenv.config();
const PORT = 3500;

const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp({
      format: "YYYY-MM-DD HH:mm:ss",
    }),
    winston.format.json()
  ),
  defaultMeta: { service: "user-service" },
  transports: [new winston.transports.File({ filename: "application.log" })],
});

logger.info(result);

const app = express();

// func to create string that conform with standards of creating a unique "state" identifier
var generateRandomString = function (length) {
  var text = "";
  var possible =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for (var i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
};

// applies middle-ware to statically served files located in /public
app
  .use(express.static(__dirname + "/public"))
  .use(cors())
  .use(cookieParser());

// routing a get req on the route "/login", including our relevant info
app.get("/login", function (req, res) {
  /* building our auth string to use a get request for the /authorize endpoint */
  const client_id = process.env.CLIENT_ID;
  logger.info("client_id: " + client_id);
  const response_type = "code";
  const redirect_uri = process.env.REDIRECT_URI;
  logger.info("redirect_uri: " + redirect_uri);
  const stateKey = "spotify_auth_state";
  const state = generateRandomString(16); // optional
  const scope = "user-read-currently-playing user-library-read"; // optional
  // const show_dialog = "" // optional

  // saving the state id as a cookie, for later usage
  res.cookie(stateKey, state);

  const reqAuthString = {
    response_type: response_type,
    client_id: client_id,
    scope: scope,
    redirect_uri: redirect_uri,
    state: state,
  };

  const savedString =
    "https://accounts.spotify.com/authorize?" +
    querystring.stringify(reqAuthString);

  res.on("finish", () => {
    logger.info("Saved url string: " + savedString);
  });

  res.redirect(savedString);
});

app.use((err, req, res, next) => {
  console.error(err.message, err.stack);
  res
    .status(err.status || 500)
    .send("There was an error with our system. Please try again.");
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
