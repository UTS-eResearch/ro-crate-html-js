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

const DATASET_TEMPLATE = {
    "@type": "Dataset",
    "@id": "./",
   }

class ROCrate {
    // Class for building, navigating, testing and rendering ROCrates (TODO: import validation and rendering from Calcyte)
    constructor(json) {
        if  (!json) {
            this.rootDataset = JSON.parse(JSON.stringify(DATASET_TEMPLATE));
            this.json_ld = {
                "@context": defaults.context,
                "@graph":  [
                    root
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
                this._item_by_type[t].push(item);
            }
        }
        this._rootId = "./"
        this._rootNode = this._item_by_id[this._rootId];
        
    }

    indexItem(item) {
        if (item["@id"]) {
            this._item_by_id[item["@id"]] = item;
        }
        if (item["path"]) {
            this._item_by_url[item["path"]] = item;
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

    // params: { name:, identifier:, description: }
    
    // identifier and name are compulsory

    addIdentifier(options) {
        if( ! options['identifier'] || !options['name'] ) {
            return false;
        }
        const root = this._rootNode;
        if( !root ) {
            return false;
        }
        if( !root['identifier'] ) {
            root['identifier'] = [];
        }
        const item = {
            '@id': options['identifier'],
            '@type': 'PropertyValue',
            value: options['identifier'],
            name: options['name']
        };
        if( options['description'] ) {
            item['description'] = options['description'];
        }
        if( this.addItem(item) ) {
            root['identifier'].push({ '@id': options['identifier'] });
            return true;
        } 
        return false;
    }
}


module.exports = ROCrate;