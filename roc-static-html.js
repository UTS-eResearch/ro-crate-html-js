#!/usr/bin/env node


const program = require('commander');
const fs = require('fs-extra');
const path = require('path');
const ROCrate = require("ro-crate").ROCrate;
const _ = require("lodash");
const {segmentPath, getLink} = require("./lib/rendering");
const {renderPage} = require('./lib/display');
const {DisplayableItem} = require('./lib/displayable');

const CratePruner = require('./lib/prune-crate');


program
  .version("0.1.0")
  .description(
    "Extracts data from a spreadsheet to make an RO crate"
  )
  .arguments("<d>")
  .option("-c, --config [conf]", "configuration file")
  .option("-r, --output-path [rep]", "Directory into which to write output", null)
  .action((d) => {crateDir = d})


program.parse(process.argv);
const outPath = program.outputPath ?  program.outputPath : crateDir;

async function makeRepo(outPath) {
    await fs.mkdirp(outPath);
  }


  

function indexByType(crate, config) {
    const types = {}
    for (let item of crate.getGraph()) {
        if (!(item["@id"] === "./" || item["@id"].match(/^ro-crate-metadata.json$/))){
            for (t of crate.utils.asArray(item["@type"])) {
                if (config.collectionTypes.includes(t)) {
                    if (!types[t]) {
                        types[t] = [item];
                    } else {
                        types[t].push(item);
                    }
                }
            }
        }
    }
    return types;
}


async function main(file) {
    repo = await makeRepo(outPath);
    const config = JSON.parse(await fs.readFile(program.config));
    // load the crate
    const crate = new ROCrate(JSON.parse(await fs.readFile(path.join(crateDir, "ro-crate-metadata.json"))));
    crate.index();
    crate.addBackLinks();
    repoRoot = crate.getRootDataset();

    const Pruner = new CratePruner(crate, config);
    const repoCrate = Pruner.prune(repoRoot, config);
    repoCrate.index();
    repoRoot = repoCrate.getRootDataset();    
    repoRoot.hasPart = [];
    repoCrate._relPath = "./";


    const types = indexByType(crate, config);
    
    for (let type of Object.keys(types)) {
        const collection = 
                {"@id": `#type:${type}`,
                "@type": "RepositoryCollection",
                "name" : `${type} Collection`,
                "hasMember": []

            }
        repoCrate.addItem(collection);
        repoRoot.hasPart.push({"@id": collection["@id"]});
        
        for (let item of types[type]) {
            const itemCrate = Pruner.prune(item);
            const itemCrateRoot = itemCrate.getRootDataset();
            //itemCrateRoot["@reverse"] = []; // 
            itemCrateRoot.name = item.name;

         
            itemCrate._relPath = segmentPath(item["@id"]);
            itemCrate._dirPath = path.join(outPath, itemCrate._relPath)

            // Paths and directory setup
            await fs.mkdirp(itemCrate._dirPath);
            itemCrate._htmlpath = path.join(itemCrate._dirPath, "ro-crate-preview.html");
            itemCrate._relHtmlpath = path.join(itemCrate._relPath, "ro-crate-preview.html");

            // Make  displayable Item
            const dispItem = new DisplayableItem(itemCrate, item["@id"], config);
            dispItem.relPath = getLink(item, repoCrate);
            const html = renderPage(dispItem);



            await fs.writeFile(path.join(itemCrate._dirPath, "ro-crate-metadata.json"), JSON.stringify(itemCrate.json_ld, null, 2))
            await fs.writeFile(itemCrate._htmlpath, html)
            // Fetch the files - TODO - need much smarter type matching
            for (let item of itemCrate.getGraph().filter(i => i["@type"].includes("File"))) {
                // TODO LINK TO FILES CORRECTLY
                
            }

            // Add item to relevant collection
            collection.hasMember.push({"@id": item["@id"]});
            repoCrate.addItem({"@id": item["@id"], "name": item.name, "@type": type});

        }
    }
    const dispItem = new DisplayableItem(repoCrate, "./", config);
    const html = renderPage(dispItem);
    await fs.writeFile(path.join(outPath, "ro-crate-preview.html"), html);
    await fs.mkdirp(path.join(outPath, "ro-crate-preview_files/assets"));
    //await fs.copyFile(path.join(__dirname, "assets","tailwind",  "tailwind.css"), path.join(outPath, "ro-crate-preview_files/assets/tailwind.css"));
    //await fs.copyFile(path.join(__dirname, "assets", "tailwind", "site.css"), path.join(outPath, "ro-crate-preview_files/assets/site.css"));


}

main(crateDir);








//console.log(module);


