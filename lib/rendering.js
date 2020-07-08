const path = require("path");
pairtree = require("pairtree");
const Config = require("./static-html-config");
const config = new Config();
const _ = require("lodash");
const Page = require("./paginate");
const renderPage = require("../defaults/metadata_template.js");

function makeHtml(item, crate) {
    if (!item["@reverse"]) {
        item["@reverse"] = {};
    }
    const displayed = {};
    if (item["@type"].includes("Person"))
    {
        return renderPerson(item, crate);
    }
    return renderPage(
        {
            title: item.name, 
            content: summarizeItem(item["@id"], crate, displayed),
            json: JSON.stringify(crate.json_ld, null, 2),
            heading: item.name,
            crate: crate,
            getLinkToPath: getLinkToPath,
            getLinkToMetadata: getLinkToMetadata
        })
}


function summarizeItem(id, crate, displayed) {
    if (!displayed) {
        displayed = {};
    }
    const item = _.clone(crate.getItem(id));

    //console.log("DISPLAYING", id, item);
    const stopRecursing = displayed[id] || false; 
    displayed[id] = true;

    var table = `<br><table id="${item["@id"]}" class='table metadata table-striped'><tbody>`;
    for (let prop of Object.keys(item)) {
      if (prop === "@reverse") {
         table += `<tr><th valign="top">${prop}</th><td valign="top"><table>`
         for (let revProp of Object.keys(item["@reverse"])) {
            const reverse = new Page({values: item["@reverse"][revProp], pageSize: Config.pageSize});
            table += `<tr><th valign="top">${revProp}</th><td valign="top">${displayPage(reverse, crate, displayed, stopRecursing)}</td></tr>`;
          }
          table += "</table></td></tr>"
      } else {
            var cell = `${display(item[prop], crate, displayed, stopRecursing)}`;
            table += `<tr><th valign="top">${prop}</th><td valign="top">${cell}</td></tr>`
      }
    }
    table += "</tbody></table>";
    return table;
 }


 
 function getLink(item, thisCrate){
    return path.join(path.relative(thisCrate._relPath, segmentPath(item["@id"])), "ro-crate-preview.html");
 }

 function getLinkToPath(p, thisCrate){
    return path.join(path.relative(thisCrate._relPath, segmentPath(p)), "ro-crate-preview.html");
 }

 function getLinkToMetadata(p, thisCrate){
    return path.join(path.relative(thisCrate._relPath, segmentPath(p)), "ro-crate-metadata.json");
 }


 function segmentPath(p) {
     if (p === "/") {
         return "/";
     }
     return pairtree.path(p.replace(/^#/, ""));
 }

 function displayVal(v, crate, displayed, stopRecursing) {
    var cell = ""
    if (v && v["@id"]) {
        const target = crate.getItem(v["@id"]);
        if (stopRecursing) {
            cell += `${target.name}`
        } else if (target) {  
                if (config.hasOwnPage(target)) {                              
                        cell += `<a href='${getLink(target, crate)}'>${target.name}</a>`;            
                } 
                else {
                // TODO - make this a link
                    cell += summarizeItem(target["@id"], crate, displayed)
                }
            }
        }
    else {
        cell += `<p>${v}</p>`;
    }
    return cell;
}

 function displayPage(page, crate, displayed, stopRecursing) {
    var html = "";
    if (page.pages.length > 0) {
        for (let p of page.pages) {
            html += `
<details style='margin-left: 3%'>
    <summary>
        ${displayVal(p.first, crate, displayed, true)} -to- ${displayVal(p.last, crate, displayed, true)}
    </summary>
    ${displayPage(p, crate, displayed, stopRecursing)}
</details>
            `
        }
    } else {
        if (page.values.length > 1 ) {
            html += "<ul>";
            for (let p of page.values) {
                html += `<li>${displayVal(p, crate, displayed, stopRecursing)}</li>`;
            }
            html += "</ul>"
        } else {
            html += `<p>${displayVal(page.values[0], crate, displayed, stopRecursing)}</p>`;
        }
    }
    return html;
 }

 function display(val, crate, displayed, stopRecursing) {
    if (!Array.isArray(val)) {
        val = [val];
    }
    const l = val.length;
    page = new Page({values: val, pageSize: config.pageSize});
    return displayPage(page,crate,displayed,stopRecursing);
}

function renderSentences(items, crate) {
    result = "<ul>";
    for (item of crate.utils.asArray(items)) {
        const target = crate.getItem(item["@id"]);   
        if (target) {
            const sent = "";
            result += `
                <li>
                    <details style='margin-left: 3%'>
                         <summary>${target.name}</summary>
                         ${summarizeItem(item["@id"], crate)}
                    </details>  
                </li>
            `
        }
    }
    result += "</ul>";
    return result;
}


function renderPerson(item, crate) {
    const pdfPath = item["@reverse"]["about"][0]["@id"];
    return renderPage(
        {
            title: item.name, 
            content: `
            Born: ${item.birthDate} - ${crate.getItem(item["birthPlace"]["@id"]).name}
                    
            <h1>Convictions</h1>
                   
            ${renderSentences(item["@reverse"]["object"], crate)}
            
            <h2>Prison Record</h2>
            <iframe src='${pdfPath}' width='100%' height='500'></iframe>
            `,
            json: JSON.stringify(crate.json_ld, null, 2),
            heading: item.name,
            crate: crate,
            getLinkToPath: getLinkToPath,
            getLinkToMetadata: getLinkToMetadata
        })

}



 module.exports = {
     summarizeItem: summarizeItem,
     getLink: getLink,
     segmentPath: segmentPath,
     display: display,
     makeHtml: makeHtml
 }

