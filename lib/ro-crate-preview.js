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
const _ = require("lodash");
const axios = require('axios');



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
    "author",
    "encodingFormat",
    "contentSize",
    "affiliation",
    "email",
    "@reverse"
    ];



class Preview {
    constructor(crate) {
      this.crate = crate;
      this.crate.index();
      this.crate.addBackLinks();
      this.rootId = this.crate.getRootId();
      this.root = this.crate.getRootDataset();
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
        // Don't try to show files if there are a lot - ie more than one
        const dontShowPreviews = (this.root.hasPart && this.root.hasPart.length > defaults.pageSize);
        for (let i of keepIds) {
            allMeta.append(await this.renderMetadataForItem(i, dontShowPreviews));
        }
        return allMeta;
    }

    makeDataCite() {
        // EXPERIMENTAL
        // Simple framing exercise but not using JSON-lD Framing
        // Make something that DataCite's Bolognese  tool can parse
        var newJson = JSON.parse(JSON.stringify(this.root));    //COPY
        newJson["@context"] = "http://schema.org";
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
         return newJson;
    }

    async renderMetadataForItem(id, dontShowPreviews) {
       
        // makeCitation();
        var item = _.clone(this.crate.getItem(id));
        if (!item) {
            return;
        }
        var name = item.name ? item.name : id;
        $(".item_name").html(this.crate.utils.asArray(item["@type"]).join(", ") + ": " ).append(name);
        var itemHtml = $("<div/>");
       


        var idLink = $("<h3/>");
        itemHtml.append(idLink);
        // Add a header
        var types = this.crate.utils.asArray(item["@type"]);
        var view;
        var path = item["@id"];
        delete item["@id"];

        // Special treatment for Datasets - add download links if there is a distribution
        if (path.match(/^https?:\/\//i)) {
            view = "Go to: ";
        } else if (types.includes("Dataset")){
            if (window.location.href.match(/^file:\/\//i)){
                view = "Browse files ";
            }
            if (item["distribution"]) {
                for (let dist of this.crate.utils.asArray(item["distribution"])){
                    const download = this.crate.getItem(dist["@id"]);
                    // Dealing with legacy - we used to have path mapped to contentUrl
                    if (download) {
                        var downloadName = download.name ? download.name : name;
                        var u = download["contentUrl"] ?  download["contentUrl"] : download["path"];
                        if (u) {
                            idLink.append($(`<a>⬇️📦 Download this dataset: ${downloadName}</a>`).attr("href", u));
                            idLink.append($("<br><br>"));
                        }
                }
            }
            }   
        } else if ( types.includes("File") || types.includes("ImageObject") || types.includes("MediaObject")){
            view = "⬇️ Download: ";
        } 

        if (view){
           idLink.append($("<a>").attr("href", path).html(view + path)) 
        }

        // Check if there are any parts that should be displayed up top

        
        // See if there are any fragments to display - if there are references to things which have
        // articleBody but no name (for lab notebook display)
        for (let part of this.crate.utils.asArray(item.hasPart)) {
            const p = this.crate.getItem(part["@id"]);
            if (p && this.crate.utils.asArray(p["@type"]).includes("Article")  && p.articleBody) {
              for (let b of this.crate.utils.asArray(p.articleBody))
              {
                  itemHtml.append($(`<div><hr><div style="font: small; text-align: right" >${p.description}</div>${b}</div>`));
              }
            }
          }

        // Thumbnail if present
        if (item.thumbnail) {
            var src = this.crate.utils.asArray(item.thumbnail)[0]; //Should only be one but don't die if there are more
            if (src["@id"]) {
                src = src["@id"];
            }

            itemHtml.append(($("<img>").attr('src', src).attr('width', "80%")));  
            delete item.thumbnail;
        }
        var metaTable = $("<table class='table metadata table-striped'><tbody></table>").attr("id", id);
        var types = this.crate.utils.asArray(item["@type"]);
        itemHtml.append(metaTable);
        var meta = metaTable.find("tbody");            
        for (let prop of this.sortKeys(Object.keys(item))) {
            if (prop === "@reverse") {
                var row = $("<tr><th style='text-align:left'> </th><td style='text-align:left'> </td></tr>");
                row.find("th").html("Referenced by").attr("style","white-space: nowrap;");
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
        if (!dontShowPreviews && (types.includes("Dataset") || types.includes("File") ||types.includes("ImageObject") ||types.includes("MediaObject"))) {
            if (path.match(/(\.txt)|(\.html?)|(\.md)$/i)){
                itemHtml.append($(`<iframe src='${path}' width='100%' height='500'></iframe>`));
            } else if (path.match(/(\.mp3)|(\.ogg?)|(\.wav)$/i)){
               itemHtml.append($(`<audio controls><source src='${path}'/></audio>`));
            } else if (path.match(/(\.jpe?g)|(\.png)$/i)){
                itemHtml.append($(`<img width='100%' style='object-fit: contain' src='./${path}'/>`));
             } 
             else if (path.match(/pdf$/i)){
                itemHtml.append($(`<embed  src="./${path}" type="application/pdf" width="100%" height="600px" />`));
                  
             } 
        }
        await this.addGloss(itemHtml);
        return itemHtml;

    }   

   
    async addGloss(itemHtml) {
        if (!this.crate.context) {
            await this.crate.resolveContext();
        } 
        const c = this.crate;
        itemHtml.find("th").each( 
            function () {
                var prop = $(this).text();
                var href = c.resolveTerm(prop);
                const same = c.getItem(href)
                if (same && same.sameAs) {
                    href = same.sameAs["@id"];
                }
                if (href) {
                    $(this).append($("<span>&nbsp;</span>")).append($("<a>").html("[?]").attr('href', href));
                }
            }
        )

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
    this.displayValues(row.find("td"), item[prop]);
    target.append(row)
  }

 displayValues(div, v, details) {
    var vals = this.crate.utils.asArray(v);
    const l = vals.length;

    if (l === 1) {
        // Singleton value - display it
        div.append(this.displayValue(vals[0]));
        return;
    }
    else if (l <= defaults.pageSize) {
        var details_el;
        var list  = $("<ul>");

        if (details) {
           details_el =  $("<details style='margin-left: 3%'></details>");
           var summary = $("<summary>");
           details_el.append(summary);
           details_el.append(list);
           summary.append(this.displayValue(vals[0]));
           summary.append($("<span>--to--</span>"))  ;
           summary.append(this.displayValue(vals[l-1]));
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
        div.append(details_el)
        return;
    }
    else if (l <= defaults.pageSize * defaults.pageSize) {
        this.displayValues(div, vals.slice(0, defaults.pageSize), true);
        this.displayValues(div, vals.slice(defaults.pageSize, l), true);
        return;
    }
    else {
        var details_el =  $("<details></details>").append(list);
        div.append(details_el);
        var summary = $("<summary>");
        details_el.append(summary);
        summary.append(this.displayValue(vals[0]));
        summary.append($("<span>--to--</span>"))  ;
        summary.append(this.displayValue(vals[defaults.pageSize * defaults.pageSize - 1]));
        this.displayValues(details_el, vals.slice(0, defaults.pageSize * defaults.pageSize), true);
        if (l -  defaults.pageSize * defaults.pageSize < defaults.pageSize * defaults.pageSize) {
            var det = $("<details>");
            var sum = $("<summary>");
            det.append(sum);
            sum.append(this.displayValue(vals[defaults.pageSize * defaults.pageSize]));
            sum.append("--to--");
            sum.append(this.displayValue(vals[l-1]));
            div.append(det);
            div  = det;
        }

        this.displayValues(div, vals.slice(defaults.pageSize * defaults.pageSize, l), true);
        return;
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
    
    else if (val.toString().match(/^https?:\/\//i)) {
        return $("<a>").attr("href", val).html(val);
    }
    
    else {
        return $("<span>").html(val);
    }
    }
       
    
}

module.exports = Preview;
