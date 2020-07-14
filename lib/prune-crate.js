
const ROCrate = require("ro-crate").ROCrate;
const tempCrate = new ROCrate();
const asArray = tempCrate.utils.asArray;
const _ = require("lodash");
const { keys } = require("lodash");


function getLinkedItems(item, sourceCrate, targetCrate, config) {
    for (let type of sourceCrate.utils.asArray(item["@type"])) {
        if (config.types[type]) {
            if (item["@reverse"] && config.types[type].reverseProps) {
                extractProps(item["@reverse"], sourceCrate, targetCrate, config.types[type].reverseProps, config);
            } 
            if (config.types[type].props) {
                 extractProps(item, sourceCrate, targetCrate, config.types[type].props);
            }
        }
    }   
}



function extractProps(item, sourceCrate, targetCrate, config){
    // Follow links and save the result

    // What do we keep?
    // Anything that's needed for context that is:
    // * Not going to get its own page - OR

    for (let prop of Object.keys(config)) {
        if (item[prop]) {
            for (let val of asArray(item[prop])) {
                if (val["@id"]) {
                    const potentialItem = sourceCrate.getItem(val["@id"]);
                    if (potentialItem && !targetCrate.getItem(val["@id"])) {
                            targetCrate.addItem(_.clone(potentialItem));
                            if (config[prop]) {
                                     getLinkedItems(potentialItem, sourceCrate, targetCrate, config[prop]);
                            }
                        }
                    }
                }
        }
        }
}


function pruneCrate(startItem, sourceCrate, config) {
    const targetCrate = new ROCrate();
    targetCrate.index();
    targetCrate.addItem(startItem);
    const root = targetCrate.getRootDataset();
    root.about = {"@id": startItem["@id"]};
    getLinkedItems(startItem, sourceCrate, targetCrate, config)
    return targetCrate;
}

 module.exports  = pruneCrate;