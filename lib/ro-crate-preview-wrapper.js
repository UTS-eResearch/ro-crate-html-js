// Load a wrapper for use off line

$ = require('cheerio');
window = {location: {href: ""}};

const Preview = require("./ro-crate-preview.js");
module.exports = Preview;