/* 
This is part of Calcyte a tool for implementing the DataCrate data packaging
spec.  Copyright (C) 2018-2019  University of Technology Sydney

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

var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
const defaults = require('./defaults');
const RoCrate = require('./rocrate');


const display_keys = [
    "@id",
    "name",
    "familyName",
    "givenName",
    "@type",
    "description",
    "funder",
    "memberOf",
    "isPartOf",
    "fileOf",
    "thumbnail",
    "datePublished",
    "creator",
    "path",
    "encodingFormat",
    "contentSize",
    "affiliation",
    "email",
    "@reverse"
    ];


const PAGE_SIZE = 20;

class Preview {
    constructor(crate) {
      this.crate = crate;
      this.crate.index();
      this.rootId = this.crate.getRootId();
      this.root = this.crate.getRootNode();
    }

    async display(id) {
        const datasetDisplay = await this.renderMetadataForItem(id);
        $("div#summary").html(datasetDisplay);
    }

    async summarizeDataset() {
        // Makes HTML tables for RO-Crate Core Metadata - just a teaser of the contents, not all of it  
        var keepIds = [this.rootId];
        for (let prop of this.sortKeys(Object.keys(this.root))) {
           var values = this.crate.utils.asArray(this.root[prop]);
           for (let v of values) {
               if (v["@id"] && !keepIds.includes(v["@id"]) ) {
                   keepIds.push(v["@id"]);
               }
           }
        }
        // Now prune out stuff we don't need into a new graph
        var newGraph = []
        for (let i of this.crate.json_ld["@graph"]) {
            if (keepIds.includes(i['@id'])) {
                newGraph.push(i);
            }
        }
        
        //this.crate.json_ld["@graph"] = newGraph;
        //this.crate.init(this.crate.json_ld);
        // And generate HTML for what's left
        var allMeta = $("<div class='all-meta'></div>");
        for (let i of keepIds) {
            allMeta.append(await this.renderMetadataForItem(i));
        }
        return allMeta;
    }

    makeDataCite() {
        // EXPERIMENTAL
        // Simple framing exercise but not using JSON-lD Framing
        // Make something that DataCite's Bolognese  tool can parse
        var newJson = JSON.parse(JSON.stringify(this.root));    //COPY
        newJson["@context"] = "http://schema.org"
        for (let prop of this.sortKeys(Object.keys(this.root))) {
            var newValues = [];
            var values = this.crate.utils.asArray(this.root[prop]);
            for (let v of values) {
                if (v["@id"] ) {
                    newValues.push(this.crate.getItem(v["@id"]));
                } else {
                    newValues.push(v);
                }
            }
            if (newValues.length === 1) {
                newValues = newValues[0];
            }
            newJson[prop] = newValues;
         }        
         //console.log(JSON.stringify(newJson, null, 5));
         return newJson;
    }
   

    async renderMetadataForItem(id) {
        // makeCitation();
        var item = this.crate.getItem(id);
        if (!item) {
            return;
        }
        var name = item.name ? item.name : id;
        $(".item_name").html(this.crate.utils.asArray(item["@type"]).join(", ") + ": " ).append(name);
        var itemHtml = $("<div/>");
        var metaTable = $("<table class='table metadata'><tbody></table>").attr("id", id);
        itemHtml.append(metaTable);
        var meta = metaTable.find("tbody");            
        for (let prop of this.sortKeys(Object.keys(item))) {
            if (prop === "@reverse") {
                var row = $("<tr><th style='text-align:left'> </th><td style='text-align:left'> </td></tr>");
                row.find("th").html("Referenced by").attr("style","white-space: nowrap; width: 1%;");
                var t = $("<table class='table'><tbody/><table>");
                var  back = t.find("tbody");
                for (let backProp of Object.keys(item["@reverse"])){
                     this.addMetadataRow(back, item["@reverse"], backProp);
                }
                row.find("td").append(back);
                meta.append(row);
            }
            else {
                this.addMetadataRow(meta, item, prop);
            }      
        }
        if (item.path){
            var path = this.crate.utils.asArray(item.path)[0];
            console.log(item.path)
            if (path.match(/(\.txt)|(\.html?)|(\.md)$/i)){
                itemHtml.append($(`<iframe src='${path}' width='100%' height='500'></iframe>`));
            } else if (path.match(/(\.mp3)|(\.ogg?)|(\.wav)$/i)){
               itemHtml.append($(`<audio controls><source src='${path}'/></audio>`));
            } else if (path.match(/(\.jpe?g)|(\.png)|(\.tiff?)$/i)){
                itemHtml.append($(`<img width='100%' style='object-fit: contain' src='${path}'/>`));
             }
        }
        const done =  await this.addGloss();
        return itemHtml;

    }

    // Add labels to properties that link back to definitions (mostly)
    async addGloss() {
        var data;
        var request = new XMLHttpRequest();
        request.open('GET', this.crate.json_ld["@context"], true);
        request.onload = function() {
            if (request.status >= 200 && request.status < 400) {
              // Success!
               data = JSON.parse(request.responseText);
            } else {
              // We reached our target server, but it returned an error
          
            }
          };

        request.onerror = function() {
            console.log("unable to load context")
        };
        request.send();
        //$.getJSON( this.crate.json_ld["@context"], function( data ) {
            if (data){
            $("th").each(
                function (th) {
                    var prop = $(this).text();
                    var href = data['@context'][prop];
                    if (href) {
                        $(this).append($("<span>&nbsp;</span>")).append($("<a>").html("[?]").attr('href', href));
                    }
                }
        )}
    } 

    sortKeys(keys) {
        // Sort a set or array of keys to be in a nice order
        // Returns set
        var keys_in_order = new Set();
        keys = new Set(keys);
        for (let key of display_keys) {
          if (keys.has(key)) {
            keys_in_order.add(key);
          }
        }
        for (let key of keys) {
          if (!keys_in_order.has(key)) {
            keys_in_order.add(key);
          }
        }
        return keys_in_order;
    }
    

  addMetadataRow(target, item, prop){
    var row = $("<tr><th style='text-align:left'> </th><td style='text-align:left'> </td></tr>");
    row.find("th").html(prop).attr("style","white-space: nowrap; width: 1%;");
    row.find("td").append(this.displayValues(item[prop]));
    if (prop === "path") {
        row.find("td span").each(
            function() {
                var path = $(this).text();
                $(this).html($("<a>").attr("href", path ).html(path))
            }
      ) 
    }
    else if (prop === 'thumbnail') {
        var helper = this.crate;
        row.find("td a").each(
            function() {
                var path = $(this).text();
                var target = helper.item_by_url[path];
                $(this).html($("<img>").attr('src', target.path));
            }
        )
    }
    target.append(row)
  }

 displayValues(v, details) {
    var vals = this.crate.utils.asArray(v);
    const l = vals.length;
    if (l === 1) {
        // Singleton value - display it
        return(this.displayValue(vals[0]));
    }
    else if (l <= PAGE_SIZE) {
        var div = $("<div>");
        var list  = $("<ul>");
        var detail_el;
        if (details) {
           var details_el =  $("<details></details>");
           var summary = $("<summary>");
           details_el.append(summary);
           details_el.append(list);
           summary.append(this.displayValue(vals.slice(0, 1)[0]));
           summary.append($("<span>--to--</span>"))  ;
           summary.append(this.displayValue(vals.slice(l-1,l)[0]));
        }
        else {
            details_el = list;
        }
        vals.map(
            (v) => {
                var li = $("<li>");
                li.html(this.displayValue(v));
                list.append(li);
            }   
        )
        return details_el;
    }
    else if (l <= PAGE_SIZE * PAGE_SIZE) {
        var div  = $("<div>");
        div.append(this.displayValues(vals.slice(0, PAGE_SIZE), true, "first"));
        div.append(this.displayValues(vals.slice(PAGE_SIZE, l), true, "second"));
        return div;
    }
    else {
        var div  = $("<div>");
        var details_el =  $("<details></details>").append(list);
        div.append(details_el);
        var summary = $("<summary>");
        details_el.append(summary);
        summary.append(this.displayValue(vals.slice(0,1)[0]));
        summary.append($("<span>--to--</span>"))  ;
        summary.append(this.displayValue(vals.slice(PAGE_SIZE, l)[0]));
        details_el.append(this.displayValues(vals.slice(0, PAGE_SIZE * PAGE_SIZE), true));
        div.append(this.displayValues(vals.slice(PAGE_SIZE * PAGE_SIZE, l), true));
        return div;
    }

}

 displayValue(val) {
    if (val["@id"]) {
        var target = this.crate.getItem(val["@id"]);
        if (target) {
            var name = target.name
            if (!name) {
                var name = target.path;
                if (!name) {
                    name = val['@id'];
                }
            }
            return $("<a href='#" + target["@id"] + "'> </a>").html(name);
        }
    }
    /*
    else if (val.match(/^https?:\/\//i)) {
        return $("<a>").attr("href", val).html(val);
    }
    */
    else {
        return $("<span>").html(val);
    }
    }
}

module.exports = Preview;
