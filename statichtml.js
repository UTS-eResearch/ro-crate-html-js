const program = require('commander');
const fs = require('fs-extra');
const path = require('path');
const Preview = require("ro-crate").Preview;
const HtmlFile = require("ro-crate").HtmlFile;
const ROCrate = require("ro-crate").ROCrate;
const _ = require("lodash");
const {segmentPath, display, makeHtml} = require("./lib/rendering");
const Config = require("./lib/static-html-config");
const config = new Config();

program
  .version("0.1.0")
  .description(
    "Extracts data from a spreadsheet to make an RO crate"
  )
  .arguments("<d>")
  .option("-c,  --cratescript [cratesript]", "URL of Crate-script directory")
  .option("-d, --data [data]", "Data directory from which to copy image files")
  .option("-r, --repoPath [repoPath]", "Data directory from which to copy image files")
  .action((d) => {crateDir = d})


program.parse(process.argv);
const crateScript = program.cratescript;
const repoPath = program.repoPath;

async function makeRepo(repoPath) {
    await fs.mkdirp(repoPath);
  }


  

function indexByType(crate) {
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

function getLinkedItems(item, sourceCrate, targetCrate, isExtraContext) {
    // Fetch everything linked from this item that is NOT going to become its own item
    // Also, change links
    if (item["@reverse"] && !isExtraContext) {
        extractProps(item["@reverse"] , sourceCrate, item["@reverse"], targetCrate, isExtraContext); 
    }
    extractProps(item, sourceCrate, item, targetCrate, isExtraContext);
}



function extractProps(vals, sourceCrate, item, targetCrate, isExtraContext){
    // Follow links and save the result

    // What do we keep?
    // Anything that's needed for context that is:
    // * Not going to get its own page - OR
    // * A special bit of context (isExtraContext) we do want but we don't want all the things it happens to link to

    for (let prop of Object.keys(vals)) {

        for (let val of sourceCrate.utils.asArray(item[prop])) {
            if (val["@id"]) {
                const potentialItem = sourceCrate.getItem(val["@id"]);
                if (potentialItem) {
                    
                    if (config.followProperty[prop]) { // Always follow this kind of property
                        if (!targetCrate.getItem(val["@id"])) {
                            var     newItem = _.cloneDeep(potentialItem);
                            getLinkedItems(potentialItem, sourceCrate, targetCrate, true);// config.collectionTypes.filter(value =>sourceCrate.utils.asArray(potentialItem["@type"]).includes(value)).length);
                            newItem["@reverse"] = {};
                            targetCrate.addItem(newItem);

                        } 
                    }
                    else if (config.hasOwnPage(potentialItem)) {
                    // TODO -  munge link to point to the _other_ object
                    }
                    else if (!targetCrate.getItem(val["@id"])) {
                        targetCrate.addItem(potentialItem);
                        getLinkedItems(potentialItem, sourceCrate, targetCrate, false);
                    }
                }
            }
        }
    
}
}

async function main(file, crateScript) {
    repo = await makeRepo(repoPath);
    // load the crate
    const crate = new ROCrate(JSON.parse(await fs.readFile(path.join(crateDir, "ro-crate-metadata.json"))));
    crate.index();
    crate.addBackLinks();
    const repoCrate = new ROCrate(JSON.parse(await fs.readFile(path.join(crateDir, "ro-crate-metadata.json"))));
    repoCrate.index();
    repoRoot = repoCrate.getRootDataset();
    repoRoot.hasPart = [];
    const types = indexByType(crate);
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
            const itemCrate = new ROCrate();
            itemCrate.index();
            itemCrate.addItem(item);
            const itemCrateRoot = itemCrate.getRootDataset();
            itemCrateRoot.name = item.name;
            itemCrateRoot.about = {"@id": item.id};
            itemCrate._relPath = segmentPath(item["@id"]);
            itemCrate._dirPath = path.join(repoPath, itemCrate._relPath)
            await fs.mkdirp(itemCrate._dirPath);
            itemCrate._htmlpath = path.join(itemCrate._dirPath, "ro-crate-preview.html");
            itemCrate._relHtmlpath = path.join(itemCrate._relPath, "ro-crate-preview.html");
            // TODO build the crate - follow all things that are not gonna get their own page && Link to the 
            getLinkedItems(item, crate, itemCrate);
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
    await fs.writeFile(path.join(repoPath, "ro-crate-metadata.json"), JSON.stringify(repoCrate.json_ld, null, 2));
    fs.writeFileSync(path.join(repoPath, "ro-crate-preview.html"), makeHtml(repoRoot, repoCrate));
}

main(crateDir, crateScript);








//console.log(module);


