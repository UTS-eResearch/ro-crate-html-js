
const ROCrate = require("ro-crate").ROCrate;
const tempCrate = new ROCrate();
const asArray = tempCrate.utils.asArray;
const Page = require("./paginate");
const path = require("path");

function segmentPath(p) {
    if (p === "/") {
        return "/";
    }
    return "/ro-crate-preview_files/" + pairtree.path(p.replace(/^#/, ""));
}

function isInTypes(item, config) {
    if (!Array.isArray(item["@type"])) {
        item["@type"] = [ item["@type"]];
    }
    if (!config.types) {
        config.types = {};
    }
    return  Object.keys(config.types).filter(value => item["@type"].includes(value)).length > 0
}


// NOT BEING used just yet - workin' on the idea
class Graph{
    constructor(graph) {
        this.graph = graph;
        this.index();
    }
    index() {   
        this._item_by_id = {};
        this._item_by_type = {}; // dict of arrays
        this.items_by_new_id = {}
        this._identifiers = {}; // Local IDs    
        for (let i = 0; i < this.graph.length; i++) {
            var item = this.graph[i];
            if (item["@id"]) {
                this._item_by_id[item["@id"]] = item;
            }   
            for (let t of asArray(item["@type"])) {
                if (!this._item_by_type[t]) {
                    this._item_by_type[t] = [];
                }
                this._item_by_type[t].push(item);
            }
        }
    }
}

class DisplayableItem {
    constructor(graph, itemID, config, displayed) {
        // Graph needs to have a .getItem(id) method so a crate will do the trick
        this.graph = graph;
        
        this.itemID = itemID;
        this.config = config;
        this.displayedItems = displayed || {};
        const item = graph.getItem(itemID);

        this.props = {};
        this.displayableProps= {"name": new DisplayableProp(this.graph, "name", "", this.config, this.displayedItems)};
        this.displayableReverseProps = {};
        this.doNotDisplayProps = {"@reverse":{}};
        this.doNotDisplayReverseProps = {"about": {}};
       
        if (isInTypes(item, config)) {
            // This item has its own page
            this.relPath = segmentPath(itemID);
        }

        if (this.displayedItems[itemID]) {
            // Already showed this one so lets make a dummy reference to it
            this.displayableProps["name"] = new DisplayableProp(this.graph,"name", item.name, config, this.displayedItems);
            this.displayableProps["@id"] = new DisplayableProp(this.graph, "@id", item["@id"], config, this.displayedItems);
            this.displayableProps["@type"] = new DisplayableProp(this.graph, "@type", item["@type"], config, this.displayedItems);

        } else {
            this.displayedItems[itemID] = this; // Remember that we've been handled so we don't loop-d-loop
            for (let prop of Object.keys(item)) {
                this.displayableProps[prop] = new DisplayableProp(this.graph, prop, item[prop], this.config, this.displayedItems);
            }
            
            if (item.hasOwnProperty("@reverse")) {
                for (let prop of Object.keys(item["@reverse"])) {
                    this.displayableReverseProps[prop] = new DisplayableProp(this.graph, prop, item["@reverse"][prop], this.config, this.displayedItems);
                }
                //delete item["@reverse"];
            }
        }
   }
   getLink(){
        return path.join(path.relative("/" + this.graph._relPath, "/" + this.relPath), "ro-crate-preview.html");
   }

   getHomeLink() {
        return path.join(path.relative("/" + this.graph._relPath, "/"), "ro-crate-preview.html");

   }
   //            return path.join(path.relative(this.graph._relPath, path.join(this.graph._relPath, segmentPath(this.itemID))), "ro-crate-preview.html")

   
    
}

class DisplayableProp {
    constructor(graph, prop, value, config, displayed){
        this.graph = graph;
        this.config = config;
        this.name = prop;
        this.external = false;
        this.displayedItems = displayed || {};
        const displayableValues = [];
        const values = asArray(value);
        for (let val of values) {
            displayableValues.push(new DisplayableValue(graph, val, this.config, this.displayedItems, prop));
        }
        this.paginatedValues = new Page({
            values: displayableValues,
            pageSize: this.config.pageSize || 10
        });
    }

}

class DisplayableValue {
    constructor(graph, value, config, displayed, prop) {
        this.config = config;
        this.graph = graph;
        this.url = null;
        this.isInternalLink = false;
        this.text = "";
        this.displayedItems = displayed || {};
        this.displayableItem = null;
        value = value || "";
        // Do we display this or follow it?
        // If it's in our graph then we will just display it
        if (value.hasOwnProperty("@id")) {
            // See if it's in our graph
            const targetItem = this.graph.getItem(value["@id"]);

            if (targetItem) {
                this.text = targetItem.name || targetItem["@id"];
                this.url = `#${targetItem["@id"]}`;

                if (targetItem["@reverse"] && targetItem["@reverse"][prop]) {
                    delete  targetItem["@reverse"][prop]
                }
                if (this.displayedItems[value["@id"]]) {
                    this.alreadyDisplayedItem = this.displayedItems[value["@id"]];
                    this.displayableItem = new DisplayableItem(graph, value["@id"], config, this.displayedItems);
                    
                } else {
                    this.displayableItem = new DisplayableItem(graph, value["@id"], this.config, this.displayedItems);
                }
            }
        } else {
            this.text = value;
        }
    }
}


 module.exports  = {
     DisplayableItem: DisplayableItem, 
     DisplayableProp: DisplayableProp,
     DisplayableValue: DisplayableValue,
     Graph: Graph
    }       