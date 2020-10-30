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
const defaults = require("./defaults");
const _ = require("lodash");
const axios = require("axios");
const Page = require("./paginate");

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
        document.getElementById("summary").innerHTML =  datasetDisplay;
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
        const dontShowPreviews = (this.root.hasPart && this.root.hasPart.length > defaults.pageSize);
        var allMeta = `<div class='all-meta'>`;
        for (let i of keepIds) {
            allMeta += await this.renderMetadataForItem(i, dontShowPreviews);
        }
        allMeta += `</div>`;
        // Don't try to show files if there are a lot - ie more than one
        
        return allMeta;
    }

   

    async renderMetadataForItem(id, dontShowPreviews) {
       
        // makeCitation();
        var item = _.clone(this.crate.getItem(id));
        if (!item) {
            return "NO ITEM";
        }
        var name = item.name ? item.name : id;
        


        // Add a header
        var types = this.crate.utils.asArray(item["@type"]);
        var view;
        var path = item["@id"];
        delete item["@id"];
        var idLink = "";
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
                            idLink += `<a href="${u}">⬇️📦 Download this dataset: ${downloadName}</a><br/>`;
                            
                        }
                }
            }
            }   
        } else if ( types.includes("File") || types.includes("ImageObject") || types.includes("MediaObject")){
            view = "⬇️ Download: ";
        } 
        if (view){
           idLink += `<a href="${path}">${view} ${path}<a>`; 
        }

        // Check if there are any parts that should be displayed up top

        // See if there are any fragments to display - if there are references to things which have
        // articleBody but no name (for lab notebook display)
        var articleBody = ""
        for (let part of this.crate.utils.asArray(item.hasPart)) {
            const p = this.crate.getItem(part["@id"]);
            if (p && this.crate.utils.asArray(p["@type"]).includes("Article")  && p.articleBody) {
              for (let b of this.crate.utils.asArray(p.articleBody))
              {
                articleBody += `<div><hr><div style="font: small; text-align: right" >${p.description}</div>${b}</div>`
              }
            }
          }
        articleBody;


        // Thumbnail if present
        var image = "";
        if (item.image || item.thumbnail) {
            var src;
            if (item.image && item.image.length > 0 ) {
                src = this.crate.utils.asArray(item.image)[0];
                delete item.image;
             } else if (item.thumbnail && item.thumbnail.length > 0){
                src = this.crate.utils.asArray(item.thumbnail)[0];
                delete item.thumbnail;
             }
            if (src) {
                if (src["@id"]) {
                    src = src["@id"];
                }
                image = `<img src="${src}" width="80%">`; 
            }
        }
        var types = this.crate.utils.asArray(item["@type"]);
        var rows = "";
        for (let prop of this.sortKeys(Object.keys(item))) {
            if (prop === "@reverse") {
                // Do nothing
            } else {
                rows += this.metadataRow(item, prop);
            }      
        }
        if (item["@reverse"]) {
            rows += `<tr><td colspan="2">Items that reference this one:</td><tr>`;
            for (let prop of Object.keys(item["@reverse"])) {
                rows += this.metadataRow(item["@reverse"], prop);

            }
        }
        
        var metaTable = `<table class="table metadata table-striped" id="${id}"><tbody>${rows}</tbody></table>`;
      
        var previews = "";

        if (!dontShowPreviews && (types.includes("Dataset") || types.includes("File") ||types.includes("ImageObject") ||types.includes("MediaObject"))) {
            if (path.match(/(\.txt)|(\.html?)|(\.md)$/i)){
                previews += `<iframe src='${path}' width='100%' height='500'></iframe>`;
            } else if (path.match(/(\.mp3)|(\.ogg?)|(\.wav)$/i)){
              previews += `<audio controls><source src='${path}'/></audio>`;
            } else if (path.match(/(\.jpe?g)|(\.png)$/i)){
               previews += `<img width='100%' style='object-fit: contain' src='./${path}'/>`;
             } 
             else if (path.match(/pdf$/i)){
                previews += `<embed  src="./${path}" type="application/pdf" width="100%" height="600px" />`;
                  
             } 
        }
        var itemHtml = `
           <div>
            <h3>${name}</h3>
            ${image}
            ${previews}
            ${articleBody}
            ${metaTable}

        </div>
        `;
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
    

  metadataRow(item, prop){
    return `<tr>
            <th style="text-align:left;">${prop}</th>
            <td style='text-align:left'>${this.displayValues(item[prop])}</td>
            </tr>`;
  }

 displayValues(v) {
    var vals = this.crate.utils.asArray(v);
    const page = new Page({values: vals});
    return this.displayPage(page);
} 


displayPage(page) {
    var html = "";
    if (page.pages.length > 0) {
        for (let p of page.pages) {
            if (p.first && p.last) {
                html += `
                        <details style='margin-left: 3%'>
                            <summary>
                                ${this.displayValue(p.first)} -to- ${this.displayValue(p.last)}
                            </summary>
                            ${this.displayPage(p)}
                        </details>
                `;
            }
        }
    } else {
        if (page.values.length > 1 ) {
            html += "";
            for (let p of page.values) {
                html += `
                        <div>${this.displayValue(p)}</div>
                        `;
            }
            html += "";
        } else if (page.values[0]) {
            html += `${this.displayValue(page.values[0])}`;
        }
    }
    html += "";
    return html;
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
            return `<a href="#${escape(target["@id"])}">${name}</a>`
        }
    }
    
    else if (val.toString().match(/^https?:\/\//i)) {
        return $`<a> href="${val}>${val}</a>`;
    } else {
        return `<span>${val}</span>`;
    }
    }
       
    
}

module.exports = Preview;
