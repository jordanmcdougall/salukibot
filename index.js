// import dependencies
require("dotenv").config();
const twit = require("./twit");
const fs = require("fs");
const path = require("path");

// file path to parameter file
// TODO: move this to a database
const paramsPath = path.join(__dirname, "params.json");

// function to write the last id to parameter file
const writeParams = (data) => {
  return fs.writeFileSync(paramsPath, JSON.stringify(data));
};

// function to read id from parameter file
const readParams = () => {
  const data = fs.readFileSync(paramsPath);
  return JSON.parse(data.toString());
};

// function to get tweets matching search query
const getTweets = (since_id, last_text) => {
  return new Promise((resolve, reject) => {
    let params = {
      q: "#saluki",
      count: 1,
    };

    if (since_id) {
      params.since_id = since_id;
      params.last_text = last_text;
    }

    twit.get("search/tweets", params, (err, data) => {
      if (err) {
        return reject(err);
      }
      return resolve(data);
    });
  });
};

// function to retweet tweets that match search
const postRetweet = (id) => {
  return new Promise((resolve, reject) => {
    const params = {
      id,
    };

    twit.post("statuses/retweet/:id", params, (err, data) => {
      if (err) {
        return reject(err);
      }
      return resolve(data);
    });
  });
};

// function to favorite tweets that match search
const postFavorite = (id) => {
  return new Promise((resolve, reject) => {
    const params = {
      id,
    };

    twit.post("favorites/create", params, (err, data) => {
      if (err) {
        return reject(err);
      }
      return resolve(data);
    });
  });
};

const main = async () => {
  try {
    const params = readParams();
    const data = await getTweets(params.since_id);
    const tweets = data.statuses;
    for await (let tweet of tweets) {
      try {
        if (
          parseInt(tweet.id_str) !== parseInt(params.since_id) &&
          tweet.text !== params.last_text
        ) {
          await postFavorite(tweet.id_str).then(async () => {
            await postRetweet(tweet.id_str);
          });
          console.log(
            `Retweeting and favoriting tweet with id ${tweet.id_str}`
          );
        }
      } catch (err) {
        console.error(
          err.allErrors.map((error) => {
            console.error(error.message);
          })
        );
      }
      params.since_id = parseInt(tweet.id_str);
      params.last_text = tweet.text;
    }
    writeParams(params);
  } catch (err) {
    console.error(err);
  }
};

setInterval(main, 10000);
