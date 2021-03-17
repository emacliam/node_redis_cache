const express = require('express');
const fetch = require('node-fetch');
const redis = require('redis');

const PORT = process.env.PORT || 5000;
const REDIS_PORT = process.env.PORT || 6379;

const client = redis.createClient(REDIS_PORT);

const app = express();

app.get('/repos/:username', cache, getRepos);

//function

async function getRepos(req, res, next) {
  try {
    const { username } = req.params;
    const response = await fetch(`https://api.github.com/users/${username}`);
    const data = await response.json();

    const repos = data.public_repos;

    //set data to redis

    client.setex(username, 3600, repos);

    res.send(setResponse(username, repos));
    console.log('fetching data ...');
  } catch (error) {
    console.log(error);
    res.status(500);
  }
}

function setResponse(username, repos) {
  return `<h2>${username} has  ${repos} repos</h2>`;
}

//cache data middleware
function cache(req, res, next) {
  const { username } = req.params;
  client.get(username, (err, data) => {
    if (err) {
      throw err;
    }

    if (data !== null) {
      res.send(setResponse(username, data));
    } else {
      next();
    }
  });
}

app.listen(5000, () => {
  console.log('App started');
});
