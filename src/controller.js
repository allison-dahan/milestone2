const formidable = require("formidable");
const fs = require("fs/promises");
const { DEFAULT_HEADER } = require("./util/util");
const path = require("path");
const url = require("url");

var qs = require("querystring");
const { getDataBase, compileTemplate, compileGetFeed } = require("../app");

const controller = {
  getFormPage: async (request, response) => {
    const users = await getDataBase();
    const renderedString = await compileTemplate(users);
    return response.end(renderedString);
  },
  sendFormData: (request, response) => {

    var body = "";

    request.on("data", function (data) {
      body += data;
    });

    request.on("end", function () {
      var post = qs.parse(body);
      console.log(post);
    });
  },

  getFeed: async (request, response) => {
    try {
      const queryObject = url.parse(request.url, true).query;
      const username = queryObject.user;

      if (!username) {
        response.writeHead(400, DEFAULT_HEADER);
        response.end("User not specified");
        return;
      }

      const users = await getDataBase();
      const user = users.find((u) => u.username === username);

      if (!user) {
        response.writeHead(404, DEFAULT_HEADER);
        response.end("User not found");
        return;
      }

      const feedTemplate = await compileGetFeed(user);
      response.writeHead(200, { "Content-Type": "text/html" });
      response.end(feedTemplate);
    } catch (err) {
      console.error("Error in getFeed:", err);
      response.writeHead(500, DEFAULT_HEADER);
      response.end("Internal Server Error");
    }
  },
  uploadImages: async (request, response) => {
    const username = request.url.split("?")[1].split("=")[1];
    const form = new formidable.IncomingForm({ keepExtensions: true });
    form.uploadDir = path.join(__dirname, "..", "src", "photos", username);
    [fields, files] = await form.parse(request);
    const filename = files.image[0].newFilename;
    const getData = await fs.readFile("database/data.json", "utf8");
    const database = JSON.parse(getData);
    const profiles = database.find((data) => data.username === username);
    profiles.photos.push(filename);
    await fs.writeFile("database/data.json", JSON.stringify(database));
    response.writeHead(302, { Location: "/" });
    response.end("Upload Successful");
    return;
  },
};

module.exports = controller;
