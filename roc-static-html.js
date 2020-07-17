const program = require('commander');
const fs = require('fs-extra');
const path = require('path');
const Preview = require("ro-crate").Preview;
const HtmlFile = require("ro-crate").HtmlFile;
const ROCrate = require("ro-crate").ROCrate;
const _ = require("lodash");
const {segmentPath, display, makeHtml} = require("./lib/rendering");
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
    const repoCrate = new ROCrate(JSON.parse(await fs.readFile(path.join(crateDir, "ro-crate-metadata.json"))));
    repoCrate.index();
    repoRoot = repoCrate.getRootDataset();
    repoRoot.hasPart = [];
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
            const Pruner = new CratePruner( crate, config)
            const itemCrate = Pruner.prune(item);
            const itemCrateRoot = itemCrate.getRootDataset();
            itemCrateRoot.name = item.name;
            itemCrateRoot.about = {"@id": item.id};
            itemCrate._relPath = segmentPath(item["@id"]);
            itemCrate._dirPath = path.join(outPath, itemCrate._relPath)
            await fs.mkdirp(itemCrate._dirPath);
            itemCrate._htmlpath = path.join(itemCrate._dirPath, "ro-crate-preview.html");
            itemCrate._relHtmlpath = path.join(itemCrate._relPath, "ro-crate-preview.html");
            // TODO build the crate - follow all things that are not gonna get their own page && Link to the 
            // TODO Make nice HTML - link to the items HTML page - page per type?
            var html = makeHtml(item, itemCrate);
            collection.hasMember.push({"@id": item["@id"]});
            //const newItem = _.clone(item);
            //newItem["@id"] = itemCrate.relPath;

            repoCrate.index();
            repoCrate.addItem({"@id": item["@id"], "name": item.name});
            repoCrate._relPath = "/";
            await fs.writeFile(path.join(itemCrate._dirPath, "ro-crate-metadata.json"), JSON.stringify(itemCrate.json_ld, null, 2))
            await fs.writeFile(itemCrate._htmlpath, html)
            // Fetch the files - TODO - need much smarter type matching
            for (let item of itemCrate.getGraph().filter(i => i["@type"].includes("File"))) {
                // TODO make file heirarchy inside new object
                const source = path.join(crateDir, item["@id"]);
                const target = path.join(itemCrate._dirPath, item["@id"]);
                if (await fs.pathExists(source)) {
                    //console.log("Copying ", item["@id"]);
                    await fs.copyFile(source ,  target )

                }
                else {
                    console.log ("Not found: ", item["@id"])
                }
            }
        }
    }
    // await fs.writeFile(path.join(outPath, "ro-crate-metadata.json"), JSON.stringify(repoCrate.json_ld, null, 2));
    await fs.writeFile(path.join(outPath, "ro-crate-preview.html"), makeHtml(repoRoot, repoCrate));
}

main(crateDir);








//console.log(module);


