
const ROCrate = require("ro-crate").ROCrate;
const tempCrate = new ROCrate();
const asArray = tempCrate.utils.asArray;
const _ = require("lodash");
const { keys } = require("lodash");
const { throws } = require("assert");


class CratePruner {
    constructor(sourceCrate, config) {
        this.sourceCrate = sourceCrate;
        this.config = config;
   }
    prune(startItem) {
        const targetCrate = new ROCrate();
        targetCrate.index();
        const newItem = _.clone(startItem);
        const root = targetCrate.getRootDataset();
        if (newItem["@id"] === "./") {
            for (let p of Object.keys(newItem))
                root[p] = newItem[p];
        } 
        targetCrate.addItem(newItem); 
        root.about = {"@id": newItem["@id"]};
        this.getLinkedItems(newItem, this.sourceCrate, targetCrate, this.config);
        newItem["@reverse"] = [];
        targetCrate.addBackLinks();
        return targetCrate;
    }

    isInTypes(item) {
        if (!Array.isArray(item["@type"])) {
            item["@type"] = [ item["@type"]];
        }
        return  this.config.type.filter(value => item["@type"].includes(value)).length > 0
    }

    getLinkedItems(item, sourceCrate, targetCrate, config) {
        for (let type of sourceCrate.utils.asArray(item["@type"])) {
            
            if (config.types[type]) {
                if (item["@reverse"] && config.types[type].reverseProps) {
                    this.extractProps(item["@reverse"], sourceCrate, targetCrate, config.types[type].reverseProps, config);
                } 
                if (config.types[type].props) {
                    this.extractProps(item, sourceCrate, targetCrate, config.types[type].props);
                }
            }
        }   
    }


    extractProps(item, sourceCrate, targetCrate, config){
        // Follow links and save the result

        // What do we keep?
        // Anything that's needed for context that is:
        // * Not going to get its own page - OR
        for (let prop of Object.keys(item)) {
            for (let val of asArray(item[prop])) {
                var newVals = []
                if (val["@id"]) {
                    const potentialItem = sourceCrate.getItem(val["@id"]);
                    if (potentialItem) {
                        if (config.hasOwnProperty(prop))  {
                            newVals.push(val);
                            if (!targetCrate.getItem(val["@id"])) {
                                    const newItem = _.clone(potentialItem);
                                    newItem["@reverse"] = [];
                                    // Recalculate what back-links there are later
                                    targetCrate.addItem(newItem); 
                                    if (config[prop].hasOwnProperty("types")) {             
                                        this.getLinkedItems(potentialItem, sourceCrate, targetCrate, config[prop]);
                                    }
                                
                            } 
                        } else if (potentialItem.type) {

                        
                        } else if (potentialItem.name) {
                                // TODO: Add a URL if appropriatew
                                newVals.push(potentialItem.name)
                                
                            }
                        }
                    }
                else {
                    newVals.push(val);
                }
                if (newVals.length === 1) {
                    item[prop] = newVals[0];
                } else {
                    item[prop] = newVals;
                }
                
            }
        }
    }
        
}


 module.exports  = CratePruner;