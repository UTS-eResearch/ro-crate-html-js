#!/usr/bin/env node


const program = require('commander');
const fs = require('fs-extra');
const path = require('path');
const ROCrate = require("ro-crate").ROCrate;
const commonmark = require("commonmark");
const _ = require("lodash");



program
  .version("0.1.0")
  .description(
    "Extracts a markdown or HTML page from an RO Crate "
  )
  .arguments("<d>")
  .option("-c, --config [conf]", "configuration file")
  .option(
    "-h,  --html",
    "Output HTML (default is markdown)"
  )
  .option("-r, --output-path [rep]", "Directory into which to write output", null)
  .action((d) => {crateDir = d})


program.parse(process.argv);
const outPath = program.outputPath ?  program.outputPath : crateDir;


async function main() {
    var md = ""
    const crate = new ROCrate(JSON.parse(await fs.readFile(path.join(crateDir, "ro-crate-metadata.json"))));
    for (let item of crate.getGraph()) {
        if (crate.utils.asArray(item["@type"]).includes("rdf:Property")) {
            md += `<div id="#${item["rdfs:label"]}">\n\n`;
                    md += `# Property: ${item["rdfs:label"]}\n\n`;
                    md += `${item["rdfs:comment"]}\n\n`;
            md += `</div>\n`;

        } else if (crate.utils.asArray(item["@type"]).includes("rdfs:Class")) {
          md += `<div id="#${item["rdfs:label"]}">\n\n`;
                  md += `# Class: ${item["rdfs:label"]}\n\n`;
                  md += `${item["rdfs:comment"]}\n\n`;
                  
          md += `</div>\n`;
          

      }
    }
    if (program.html) {
        const reader = new commonmark.Parser();
        const writer = new commonmark.HtmlRenderer();
        const parsed = reader.parse(md); 
        const result = writer.render(parsed); // result is a String
             console.log(result);
        } else {
        console.log(md);
    }
    
  }

main();

