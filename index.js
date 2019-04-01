const Koa = require("koa");
const puppeteer = require("puppeteer");
const chalk = require("chalk");
const qs = require("koa-qs");
const dotenv = require('dotenv').config();

/**
 * Launches Puppeteer.
 * We found this hinting mode to be the most reliable
 * when working with client fonts.
 */
 async function boot() {
  const browser = await puppeteer.launch({
    args: [
    "--no-proxy-server",
    "--no-sandbox",
    "--font-render-hinting=none"],
    pipe: true
  });
  return browser;
}

/**
 * Returns a simple Koa instance, with koa-qs injected.
 * On the app instance lies our puppeteer instance.
 */
 async function launch() {
  const app = new Koa();
  qs(app, "first");
  app.context.chrome = await boot();
  return app;
}

/**
 * Helpers to reject, return a successful PDF, an auth failure.
 */
 const reject = (response, message) => {
  response.type = 'text/plain';
  response.body = message;
  response.status = 400;
};

const printed = (response, pdf) => {
  response.type = 'application/pdf';
  response.body = pdf;
  response.status = 201;
}

const unauthorized = (response, message) => {
  response.type = 'text/plain';
  response.body = message;
  response.status = 401;
}

/**
 * Docs.
 */
 const doc = `
 Our only route.
 Accepts a GET request with the form
 http(s?)://service-url?
 url={url:base64 string} the URL to render, as a base64 string.
 &format={format:string} a paper format. Defaults to "A4".
 &range={range:range} the page range to print. Defaults to printing only the first page.
 &orientation={orientation:string} either "portrait" or "landscape", defaults to being portrait.
 &width={width::dimension+unit} dimensions with units. Is overriden by the "format" parameter.
 &height={height:dimension+unit} dimensions with units. Is overriden by the "format" parameter.
 &background={background:bool-like} bool-like : pass 0 or 1 as a string, defaults to true
 &token={token:string?} optional : if you'd like to compare against a PRINTSERVER_TOKEN env var.
 `;

 launch().then((app) => { app.use(async ({ request, response }) => {
  if (process.env.PRINTSERVER_TOKEN) {
    if (!request.query.token || request.query.token !== process.env.PRINTSERVER_TOKEN) {
      return unauthorized(response, `Unauthorized.`);
    }
  }
  if (!request.query.url) {
    return reject(response, `Bad request, \n ${doc}`);
  }
  const page = await app.context.chrome.newPage();
  const u = Buffer.from(request.query.url, "base64").toString("binary");
  await page.setViewport({ width: 1440, height: 900 });

  // Wait until all network activity is idle.
  // This should be changed if you expect ads or do not control the target page.
  await page.goto(u, { waitUntil: 'networkidle0' });

  let params = {
    format: "A4",
    landscape: false,
    printBackground: true,
    pageRanges: "1"
  };

  if (request.query.format) {
    params.format = request.query.format;
  } else {
    params.width = request.query.width;
    params.height = request.query.height;
  }

  if (request.query.range) {
    params.pageRanges = request.query.range;
  }

  params.landscape = request.query.orientation && request.query.orientation === 'landscape';
  params.printBackground = request.query.background && !!parseInt(request.query.background, 10);
  return printed(response, await page.pdf(params))
});
 const port = process.env.PRINTSERVER_PORT || 3468;
 app.listen(port);

 console.log(`Listening on port ${port}`);
});