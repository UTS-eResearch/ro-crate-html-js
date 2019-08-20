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

const defaults = require('./defaults');
const utils = require('./utils');
const _ = require('lodash');



class ROCrate {
    // Class for building, navigating, testing and rendering ROCrates (TODO: import validation and rendering from Calcyte)
    constructor(json) {
        if  (!json) {
            var root = _.clone(defaults.datasetTemplate);
            this.json_ld = {
                "@context": defaults.context,
                "@graph":  [
                    root,
                    _.clone(defaults.metadataFileDescriptorTemplate)
                ]
            }
        } else {
            // TODO DIE if not correct
            this.json_ld = json;
            
        }
        this.utils = new utils();
    }
    index() {
        this._item_by_id = {};
        this._item_by_url = {};
        this._item_by_type = {}; // dict of arrays
        this.items_by_new_id = {}
        this.graph = this.json_ld["@graph"] ? this.json_ld["@graph"] : [];
        for (let i = 0; i < this.graph.length; i++) {
            var item = this.graph[i];
            if (item["@id"]) {
                this._item_by_id[item["@id"]] = item;
            }   
            for (let t of this.utils.asArray(item["@type"])) {
                if (!this._item_by_type[t]) {
                    this._item_by_type[t] = [];
                }
                if (t === "CreativeWork" && item.hasOwnProperty("identifier")  && item.identifier === defaults.roCrateMetadataID) {
                    this._rootId = item.about["@id"];
                    this.metadataFileEnity = item;
                }
                this._item_by_type[t].push(item);
            }
        }
        if (this._rootId) {
            this._rootNode = this._item_by_id[this._rootId];
            if (this._rootNode === undefined) {
                throw new Error("There is no root dataset");
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

    getRootDataset() {
        return this._rootNode;
    }

    getRootId() {
        return this._rootId;
    }
    getJson() {
        return this.json_ld;
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

    // params: { scope:, name:, description:, identifier }
    
    // only identifier is compulsory. If scope is present, it's appended to the
    // identifier in building the graph id, otherwise the bare identifier is used

    addIdentifier(options) {
        if( ! options['identifier'] ) {
            return false;
        }
        const root = this._rootNode;
        if( !root ) {
            return false;
        }
        if( !root['identifier'] ) {
            root['identifier'] = [];
        }
        const id = this.uniqueId(options['scope'] + options['identifier']);
        const item = {
            '@id': id,
            '@type': 'PropertyValue',
            identifier: options['identifier']
        };
        if( options['name'] ) {
            item['name'] = options['name'];
        }
        if( options['description'] ) {
            item['description'] = options['description'];
        }
        if( this.addItem(item) ) {
            root['identifier'].push({ '@id': id });
            return id;
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
                    var back_link =  defaults.back_links[key];
                    // Dealing with one of the known stuctural properties
                    if (target && back_link) {
                        if (!target[back_link]) {
                            target[back_link] = [{ "@id": item["@id"] }];
                        }
                    } else if (
                        !back_link && target && !defaults.back_back_links.has(key)
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

}


module.exports = ROCrate;