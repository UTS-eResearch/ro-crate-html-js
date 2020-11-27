
const ROCrate = require("ro-crate").ROCrate;
const tempCrate = new ROCrate();
const asArray = tempCrate.utils.asArray;
const _ = require("lodash");
const { keys } = require("lodash");
const { throws } = require("assert");


class CratePruner {
    constructor(sourceCrate, config) {
        this.sourceCrate = _.clone(sourceCrate);
        this.config = JSON.parse(JSON.stringify(config));
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
        
        for (let type of this.sourceCrate.utils.asArray(startItem["@type"])){
            var subgraph = []
            if (this.config.types[type] && this.config.types[type].resolveAll) {
                for (let resolveThis of this.config.types[type].resolveAll) {
                    subgraph = this.sourceCrate.resolveAll(startItem, resolveThis)[1];     
                    for (let i of subgraph) {
                        if (!targetCrate.getItem(i["@id"])) {
                            targetCrate.addItem(JSON.parse(JSON.stringify(i)));
                        }
                    }                     
                }
                
            }
        }
        targetCrate.addBackLinks();
        return targetCrate;
    }

    isInTypes(item) {
        if (!Array.isArray(item["@type"])) {
            item["@type"] = [ item["@type"]];
        }
        return  Object.keys(this.config.types).filter(value => item["@type"].includes(value)).length > 0
    }

        
}


 module.exports  = CratePruner;