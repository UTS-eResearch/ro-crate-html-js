
const ROCrate = require("ro-crate").ROCrate;
const tempCrate = new ROCrate();
const asArray = tempCrate.utils.asArray;
const _ = require("lodash");
const { keys } = require("lodash");
const { throws } = require("assert");


class CratePruner {
    constructor(sourceCrate, config) {
        this.sourceCrate = _.clone(sourceCrate);
        this.config = _.clone(config);
   }
    prune(it) {
        const startItem = _.clone(it);
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
        this.getLinkedItems(newItem, targetCrate, this.config);
        newItem["@reverse"] = [];
        targetCrate.addBackLinks();
        return targetCrate;
    }

    isInTypes(item) {
        if (!Array.isArray(item["@type"])) {
            item["@type"] = [ item["@type"]];
        }
        return  Object.keys(this.config.types).filter(value => item["@type"].includes(value)).length > 0
    }

    getLinkedItems(item, targetCrate, config) {
        for (let type of this.sourceCrate.utils.asArray(item["@type"])) {
             if (config.types[type]) {
                if (item["@reverse"] && config.types[type].reverseProps) {
                    this.extractProps(item["@reverse"], targetCrate, config.types[type].reverseProps, config);
                } 
                if (config.types[type].props) {
                    this.extractProps(item,  targetCrate, config.types[type].props);
                }
            }
        }   
    }


    extractProps(item,  targetCrate, config){
        // Follow links and save the result

        // What do we keep?
        // Anything that's needed for context that is:
        // * Not going to get its own page - OR
        for (let prop of Object.keys(item)) {
            var newVals = []

            for (let val of asArray(item[prop])) {
                if (val["@id"]) {
                    
                    const potentialItem = _.clone(this.sourceCrate.getItem(val["@id"]));
                    if (potentialItem) {
                         if (config.hasOwnProperty(prop))  {
                          
                            newVals.push(val);
                          
                            if (!targetCrate.getItem(val["@id"])) {
                                    const newItem = _.clone(potentialItem);
                                    newItem["@reverse"] = [];
                                    // Recalculate what back-links there are later
                                    targetCrate.addItem(newItem); 
                                    if (config[prop].hasOwnProperty("types")) {             
                                        this.getLinkedItems(potentialItem, targetCrate, config[prop]);
                                    }
                                
                            } 
                        } else if (potentialItem.name) {
                                newVals.push(potentialItem.name)
                                
                            }
                        }
                    }
                else {
                    newVals.push(val);
                }
            }
                if (newVals.length === 1) {
                    item[prop] = newVals[0];
                } else {
                    item[prop] = newVals;
                }
                
            
        }
    }
        
}


 module.exports  = CratePruner;