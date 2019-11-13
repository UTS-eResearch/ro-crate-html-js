#!/usr/bin/env node

/*
This is part of RO-Crate-js Copyright (C) 2019  University of Technology Sydney

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

var paths = undefined;
const path = require("path");
const ejs  = require("ejs");

const Preview = require('./lib/ro-crate-preview-wrapper');
const HtmlFile = require('./lib/ro-crate-preview-file');
const ROCrate = require('./lib/rocrate');

const program = require("commander");
const defaults = require("./lib/defaults.js");
const htmlFileName = defaults.html_file_name;
const metadata_file_name = defaults.metadata_json_file_name;
const fs = require("fs-extra")
var dirs = undefined;

async function render(metadataPath, zip, script) {
  json = JSON.parse(fs.readFileSync(metadataPath));
  const crate = new ROCrate(json);
  const preview = new Preview(crate);
  const f = new HtmlFile(preview);
  newPath = path.join(path.dirname(metadataPath), defaults.roCratePreviewFileName);
  fs.writeFileSync(newPath, await f.render(zip, script));
}

program
  .version("0.1.0")
  .description(
    "Generates an HTML preview file for a Research-Object crate"
  )
  .arguments("<files...>")
  .action(function(files) {
    paths = files;
  })
  .option("-b,  --bag [bag-dir]", "Create Bagit Bag(s) under [bag-dir])")
  .option("-n,  --no", "No Citation - only applies ith --bag")
  .option(
    "-z,  --zip",
    "URL of zipped version")
  .option("-c,  --cratescript [cratesript]", "URL of Crate-script directory")
  .option(
    "-u, --url [distro]",
    "Distribution URL"
  );
var depth = 0;
program.parse(process.argv);


if (!program.rawArgs.length || !paths) program.help();

for (let p of paths) {
  render(p, program.zip, program.cratescript);
}