const Config = require("./static-html-config");
const config = new Config();
const Page = require("./paginate");
const DisplayableItem = require("./displayable");

//const renderPage = require("../defaults/metadata_template.js");







function displayItem(id, graph) {
    // Get our starting item from the graph
    const item = graph.getItem(id);
    

   
 }


 
 function getLink(item, thisCrate){
    return path.join(path.relative(thisCrate._relPath, segmentPath(item["@id"])), "ro-crate-preview.html");
 }

  
 function getRootLink(p, thisCrate){
    return path.relative(thisCrate._relPath, p);
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
     return "/ro-crate-preview_files/" + pairtree.path(p.replace(/^#/, ""));
 }

 function displayVal(v, crate, displayed, stopRecursing) {
    var cell = ""
    if (v && v["@id"]) {
        const target = crate.getItem(v["@id"]);
        if (stopRecursing && target) {
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
        cell += `<div>${v}</div>`;
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
     getRootLink: getRootLink,
     segmentPath: segmentPath,
     display: display,
     makeHtml: makeHtml
 }

