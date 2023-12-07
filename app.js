const path = require("path");
const fs = require("fs/promises");
let ejs = require("ejs");

const homeFilePath = path.join(__dirname, "home.ejs");
const dataFilePath = path.join(__dirname, "/database/data.json");
const getFeedFilePath = path.join(__dirname, "getfeed.ejs");

function getDataBase() {
  return fs.readFile(dataFilePath, "utf8").then((data) => {
    const fileUsers = JSON.parse(data);
    return fileUsers;
  });
}

function compileTemplate(users) {
  return new Promise((resolve, reject) => {
    ejs.renderFile(homeFilePath, { users: users }, {}, (err, str) => {
      if (err) {
        reject(err);
      } else {
        resolve(str);
      }
    });
  });
}

function compileGetFeed(user) {
  return new Promise((resolve, reject) => {
    ejs.renderFile(getFeedFilePath, { user }, {}, (err, str) => {
      if (err) {
        reject(err);
      } else {
        resolve(str);
      }
    });
  });
}

module.exports = {
  getDataBase,
  compileTemplate,
  compileGetFeed,
};
