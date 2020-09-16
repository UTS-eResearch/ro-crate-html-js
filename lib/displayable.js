
const ROCrate = require("ro-crate").ROCrate;
const tempCrate = new ROCrate();
const asArray = tempCrate.utils.asArray;
const Page = require("./paginate");
const path = require("path");
const pairtree = require("pairtree");


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
    constructor(graph, itemID, config, displayed, root) {
        // Graph needs to have a .getItem(id) method so a crate will do the trick
        this.rootDisplayableItem = root || this;
        this.graph = graph;
        
        this.itemID = itemID;
        this.config = config;
        this.displayedItems = displayed || {};
        this.item = graph.getItem(itemID);

        this.props = {};
        this.displayableProps= {"name": new DisplayableProp(this.graph, "name", "", this.config, this.displayedItems, this.rootDisplayableItem)};
        this.displayableReverseProps = {};
        this.doNotDisplayProps = {"@reverse":{}};
        this.doNotDisplayReverseProps = {};
       
        if (isInTypes(this.item, config)) {
            // This item has its own page
            this.relPath =this.segmentPath(itemID);
        }

        if (this.displayedItems[itemID]) {
            // Already showed this one so lets make a dummy reference to it
            this.displayableProps["name"] = new DisplayableProp(this.graph,"name", this.item.name, config, this.displayedItems, this.rootDisplayableItem);
            this.displayableProps["@id"] = new DisplayableProp(this.graph, "@id", this.item["@id"], config, this.displayedItems, this.rootDisplayableItem);
            this.displayableProps["@type"] = new DisplayableProp(this.graph, "@type", this.item["@type"], config, this.displayedItems, this.rootDisplayableItem);

        } else {
            this.displayedItems[itemID] = this; // Remember that we've been handled so we don't loop-d-loop
            for (let prop of Object.keys(this.item)) {
                this.displayableProps[prop] = new DisplayableProp(this.graph, prop, this.item[prop], this.config, this.displayedItems, this.rootDisplayableItem);
            }
            
            if (this.item.hasOwnProperty("@reverse")) {
                for (let prop of Object.keys(this.item["@reverse"])) {
                    this.displayableReverseProps[prop] = new DisplayableProp(this.graph, prop, this.item["@reverse"][prop], this.config, this.displayedItems, this.rootDisplayableItem);
                }
                //delete item["@reverse"];
            }
        }
   }
   getLink(p){
       var relPath = this.relPath;
        if (p) {
            relPath = this.segmentPath(p);
        } 
        const rel = path.relative("/" + this.graph._relPath, "/" + relPath);
        return path.join(rel, "ro-crate-preview.html");
   }

   getHomeLink() {
        return path.join(path.relative("/" + this.graph._relPath, "/"), "ro-crate-preview.html");

   }

   getRelDataPath() {
        
        return path.join(path.relative("/" + this.rootDisplayableItem.graph._relPath, "/" + this.itemID));
    }

   segmentPath(p) {
   if (p === "/") {
        return "/";
    }
  
    
    return `/ro-crate-preview_files/${pairtree.path(p.replace(/^#/, ""))}`;
}
   //            return path.join(path.relative(this.graph._relPath, path.join(this.graph._relPath, segmentPath(this.itemID))), "ro-crate-preview.html")

   
    
}

class DisplayableProp {
    constructor(graph, prop, value, config, displayed, root){
        this.rootDisplayableItem = root;
        this.graph = graph;
        this.config = config;
        this.name = prop;
        this.external = false;
        this.displayedItems = displayed || {};
        const displayableValues = [];
        const values = asArray(value);

        for (let val of values) {
            displayableValues.push(new DisplayableValue(graph, val, this.config, this.displayedItems, prop, this.rootDisplayableItem));
        }
        displayableValues.sort((a, b) => (a.text > b.text) ? 1 : -1)

        this.paginatedValues = new Page({
            values: displayableValues,
            pageSize: this.config.pageSize || 10
        });
    }

}

class DisplayableValue {
    constructor(graph, value, config, displayed, prop, root) {
        this.rootDisplayableItem = root;
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
                    this.displayableItem = new DisplayableItem(graph, value["@id"], config, this.displayedItems, this.rootDisplayableItem);
                    
                } else {
                    this.displayableItem = new DisplayableItem(graph, value["@id"], this.config, this.displayedItems, this.rootDisplayableItem);
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