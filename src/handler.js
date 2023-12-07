const { parse } = require("url");
const { DEFAULT_HEADER } = require("./util/util.js");
const controller = require("./controller");
const { createReadStream } = require("fs");
const fs = require("fs/promises");
const path = require("path");

const allRoutes = {
  // GET: localhost:3000/form
  "/:get": async (request, response) => {
    await controller.getFormPage(request, response);
  },
  "/home.css:get": async (request, response) => {
    const cssFilePath = path.join(__dirname, "../home.css");
    try {
      const css = await fs.readFile(cssFilePath);
      response.writeHead(200, { "Content-Type": "text/css" });
      response.end(css);
    } catch (err) {
      console.error("Error reading CSS file:", err);
      response.writeHead(404, DEFAULT_HEADER);
      response.end("File not found");
    }
  },

  // POST: localhost:3000/form
  "/form:post": (request, response) => {
    controller.sendFormData(request, response);
  },
  // POST: localhost:3000/images
  "/images:post": async (request, response) => {
    try {
      await controller.uploadImages(request, response);
      response.writeHead(200, { "Content-Type": "text/html" });
      response.end(`
            <h2>Upload Successful</h2>
            <p>Image uploaded successfully.</p>
        `);
    } catch (error) {
      response.writeHead(500, { "Content-Type": "text/html" });
      response.end(`<h2>Error</h2><p>${error.message}</p>`);
    }
  },
  // GET: localhost:3000/feed
  "/feed:get": (request, response) => {
    controller.getFeed(request, response);
  },
  "/feed.css:get": async (request, response) => {
    const cssFilePath = path.join(__dirname, "../feed.css");
    try {
      const css = await fs.readFile(cssFilePath);
      response.writeHead(200, { "Content-Type": "text/css" });
      response.end(css);
    } catch (err) {
      console.error("Error reading CSS file:", err);
      response.writeHead(404, DEFAULT_HEADER);
      response.end("File not found");
    }
  },

  // 404 routes
  default: (request, response) => {
    response.writeHead(404, DEFAULT_HEADER);
    createReadStream(path.join(__dirname, "views", "404.html"), "utf8").pipe(
      response
    );
  },
};

function handler(request, response) {
  const { url, method } = request;
  const { pathname } = parse(url, true);
  const filePath = path.join(__dirname, "..", pathname);

  if (pathname.startsWith("/src/photos/")) {
    if (!filePath.startsWith(path.join(__dirname, "..", "src/photos/"))) {
      response.writeHead(403);
      response.end("Access Denied");
      return;
    }

    const stream = createReadStream(filePath);

    stream.on("open", () => {
      const ext = path.extname(filePath);
      let contentType;
      if (ext === ".png") {
        contentType = "image/png";
      } else if (ext === ".jpg" || ext === ".jpeg") {
        contentType = "image/jpeg";
      }
      response.writeHead(200, { "Content-Type": contentType });
      stream.pipe(response);
    });

    stream.on("error", (err) => {
      if (err.code === "ENOENT") {
        response.writeHead(404);
        response.end("Not Found");
      } else {
        console.error(err);
        response.writeHead(500);
        response.end("Internal Server Error");
      }
    });
  } else {
    const key = `${pathname}:${method.toLowerCase()}`;
    const chosen = allRoutes[key] || allRoutes.default;

    return Promise.resolve(chosen(request, response)).catch(
      handlerError(response)
    );
  }
}

function handlerError(response) {
  return (error) => {
    console.log("Something bad has  happened**", error.stack);
    response.writeHead(500, DEFAULT_HEADER);
    response.write(
      JSON.stringify({
        error: "internet server error!!",
      })
    );

    return response.end();
  };
}

module.exports = handler;
