/* This is part of rocrate-js a node library for implementing the RO-Crate data
packaging spec. Copyright (C) 2019 University of Technology Sydney

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

const utils = require('./utils');
const _ = require('lodash');
const { isArray} = require("lodash");



class ROCrate {
    // Class for building, navigating, testing and rendering ROCrates (TODO: import validation and rendering from Calcyte)
    constructor(json) {
        this.defaults = require('./defaults');;

        if  (!json) {
            var root = _.clone(this.defaults.datasetTemplate);
            this.json_ld = {
                "@context": this.defaults.context,
                "@graph":  [
                    root,
                    _.clone(this.defaults.metadataFileDescriptorTemplate)
                ]
            }
        } else {
            this.json_ld = json;
        }
        this.utils = new utils();
    }
    index() {
        this._item_by_id = {};
        this._item_by_type = {}; // dict of arrays
        this.items_by_new_id = {}
        this.graph = this.json_ld["@graph"] ? this.json_ld["@graph"] : [];
        this._identifiers = {}; // Local IDs
        for (let i = 0; i < this.graph.length; i++) {
            var item = this.graph[i];
            if (item["@id"]) {
                this._item_by_id[item["@id"]] = item;
            }   
            for (let t of this.utils.asArray(item["@type"])) {
                if (!this._item_by_type[t]) {
                    this._item_by_type[t] = [];
                }
                if (t === "CreativeWork" && item.hasOwnProperty("identifier")  && item.identifier === this.defaults.roCrateMetadataID) {
                    this._rootId = item.about["@id"];
                    this.metadataFileEntity = item;
                }
                this._item_by_type[t].push(item);
            }
        }
        if (this._rootId) {
            this._rootNode = this._item_by_id[this._rootId];
            if (this._rootNode === undefined) {
                throw new Error("There is no root dataset");
            }
            for (var id of this.utils.asArray(this._rootNode["identifier"])){
                const idEntity = this.getItem(id["@id"]);
                if (idEntity && this.hasType(idEntity, "PropertyValue")) {
                    this._identifiers[idEntity.name] = idEntity.value;
                }
            }
        } 
        else {
            throw new Error("There is no pointer to the root dataset")
        }
    }

    indexItem(item) {
        if (item["@id"]) {
            this._item_by_id[item["@id"]] = item;
        } 
        for (let t of this.utils.asArray(item["@type"])) {
            if (!this._item_by_type[t]) {
                this._item_by_type[t] = [];
            }
            this._item_by_type[t].push(item);
        }
    }

    // todo: exceptions? 

    addItem(item) {
        if( !item['@id'] ) {
            return false;
        }
        if( this._item_by_id[item['@id']] ) {
            return false; // can't use this method to update an existing item
        }
        this.graph.push(item);
        this.indexItem(item);
        return true;
    }

    getItem(id) {
       return this._item_by_id[id];
    }
    
    hasType(item, type) {
        return this.utils.asArray(item["@type"]).includes(type);
    }

    getGraph() {
        return this.json_ld["@graph"];
    }

    getRootDataset() {
        return this._rootNode;
    }

    getRootId() {
        return this._rootId;
    }
    getJson() {
        return this.json_ld;
    }

    getNamedIdentifier(name) {
        return this._identifiers[name];
    }

    uniqueId(base) {
        var i = 1;
        var uid = base;
        while( uid in this._item_by_id ) {
            uid = base + String(i);
            i++;
        }
        return uid;   
    }

    // addIdentifier: add a new identifier as a PropertyValue to the
    // root DataSet. 

    // params: { name:, identifier:, description: }
    
    // identifier and name are compulsory

    addIdentifier(options) {
        if( !options['identifier'] || !options['name'] ) {
            return false;
        }
        const root = this._rootNode;
        if( !root ) {
            return false;
        }
        if( !root['identifier'] ) {
            root['identifier'] = [];
        } else {
            if( !Array.isArray(root['identifier']) ) {
                root['identifier'] = [ root['identifier'] ];
            }
        }
        const newItemID = `_:local-id:${options['name']}:${options['identifier']}`;
        const item = {
            '@id': newItemID,
            '@type': 'PropertyValue',
            value: options['identifier'],
            name: options['name']
        };
       
        if( options['description'] ) {
            item['description'] = options['description'];
        }
        if( this.addItem(item) ) {
            root['identifier'].push({ '@id': newItemID});
            this._identifiers[options.name] = options.identifier;
            return newItemID;
        } 
        return false;
    }

    // See if a value (could be a string or an object) is a reference to something
    referenceToItem(value) {
        // Check if node is a reference to something else
        // If it is, return the something else
        if (value["@id"] && this.getItem(value["@id"])) {
            return this.getItem(value["@id"]);
        }
        else {
            return null
        }
    }

    backLinkItem (item) {
        for (let key of Object.keys(item)) {
            if (key != "@id" && key != "@reverse") {
                for (let part of this.utils.asArray(item[key])) {         
                    var target = this.referenceToItem(part);
                    var back_link =  this.defaults.back_links[key];
                    // Dealing with one of the known stuctural properties
                    if (target && back_link) {
                        if (!target[back_link]) {
                            target[back_link] = [{ "@id": item["@id"] }];
                        }
                    } else if (
                        !back_link && target && !this.defaults.back_back_links.has(key)
                    ) {
                        // We are linking to something
                        //console.log("Doing a back link", key, target['name'], item['name'])
                        if (!target["@reverse"]) {
                            target["@reverse"] = {};
                        }
                        if (!target["@reverse"][key]) {
                            target["@reverse"][key] = [];
                        }

                        var got_this_reverse_already = false;
                        for (let r of target["@reverse"][key]) {
                          if (r["@id"] === item["@id"]) {
                            got_this_reverse_already = true
                           }
                        }
                        if (!got_this_reverse_already) {
                            //console.log("Back linking", key)
                            target["@reverse"][key].push({ "@id": item["@id"] });
                        }
                        //console.log(JSON.stringify(target, null, 2))
                    }
                }
            }
        }
    }

    addBackLinks() {
        // Add @reverse properties if not there
        for (let item of this.graph) {
            this.backLinkItem(item);
        }
    }

    async objectify() {
        this.index();
        const root = _.clone(this.getRootDataset());
        this.nest(root, {});
        this.objectified = root;    
    }

    nest(item, alreadySeen) {
        if (!alreadySeen[item["@id"]]) {
            alreadySeen[item["@id"]] = true;
            for (let prop of Object.keys(item)) {
                var newValues = [];
                
                for (let val of this.utils.asArray(item[prop])){
                    if (val["@id"]) {
                        var nested = this.getItem(val["@id"]);
                        if (nested)  {
                            var newVal = this.nest(nested, _.clone(alreadySeen));
                            if (newVal) {
                                newValues.push(newVal);
                                continue;
                            }               
                        }      
                    }
                    newValues.push(val)       
                }
                if (newValues.length = 1) {
                    newValues = newValues[0];
                }
                item[prop] = newValues;
                
            }
            return item;    
        }
       
    }

    //Made this a method so it can access the crate helper functions
    mapContent({ property, item}) {
        // property not being used???
        item = item.map(entry => {
            if (entry["@id"]) {
                let entryData = this.getItem(entry["@id"]);
                if (entryData) {
                    let properties = Object.keys(entryData);
                    for (let prop of properties) {
                        if (isArray(entryData[prop]))
                            entryData[prop] = this.mapContent({
                                property: prop,
                                item: entryData[prop]
                            });
                    }
                    entry = { ...entry, ...entryData };
                    // if (!maintainIds.includes(property))
                    //     delete entry["@id"];
                }
            }
            return entry;
        });
        return item;
    }

}


module.exports = ROCrate;