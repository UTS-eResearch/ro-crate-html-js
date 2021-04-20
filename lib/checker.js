/* 

This is part of ro-crate-html-js a tool for generating HTMl 
previews of HTML files.

Copyright (C) 2021  University of Technology Sydney

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



const defaults = require("./defaults");
const axios = require("axios");

class Checker {
    constructor(crate) {
        this.crate = crate;
        this.crate.index();
        this.checklist = [];
        
    }


    async hasContext() {
        var checkItem = new CheckItem(
            {
                name: "Has @context",
                message: "Has an appropriate context with a name and version"

            }

        )

        // See if there is a URL in the context which has an appropriate name
        if (this.crate.getJson()["@context"]) {

            for (let contextUrl of  this.crate.utils.asArray(this.crate.getJson()["@context"])) {
                if (typeof contextUrl === 'string' || contextUrl instanceof String) {
                    try {

                        const response = await axios.get(contextUrl,{headers: {
                            'accept': "application/ld+json, application/ld+json, text/text" 
                            } });
                        const cont = response.data;
                        if (this.crate.utils.asArray(cont.name).includes("RO-Crate JSON-LD Context"))
                         {
                            checkItem.status = true;
                            checkItem.message = `Has a context named "RO-Crate JSON-LD Context", version ${cont.version}`

                        }
                    } 
                    catch (error) {
                        checkItem.message = error + contextUrl;

                        console.error(error);                
                    }
                } 
            }
        } 
        // TODO - fix this when we have a final release
      
        return checkItem;
    }
    hasRootDataset() {
        var checkItem = new CheckItem(
            {
                name: "Has root Dataset",
                message: "There is a JSON-LD item with @type of Dataset (http://schema.org/dataset)"
            }
        )
        if (this.crate.getRootDataset()) {
           checkItem.status = true;
        } 
        return checkItem;
    }

    hasRootDatasetWithProperID() {
        var checkItem = new CheckItem(
            {
                name: "Root dataset has appropriate @id",
                message: `The root dataset @id ends in "/"`
            }
        )
        const root = this.crate.getRootDataset();
        if (root && root["@id"].endsWith("/")) {
           checkItem.status = true;
        } 
        return checkItem;
    }

    hasName() {
        var checkItem = new CheckItem(
            {
                name: "Has name",
                message: "The root Dataset has a name (http://schema.org/name)"
            }

        )
        if (this.crate.getRootDataset() && this.crate.getRootDataset().name && this.crate.getRootDataset().name.length > 0) {
           checkItem.status = true;
        } 
        return checkItem;
    }

    hasDescription() {
        var checkItem = new CheckItem(
            {
                name: "Has description",
                message: "The root Dataset has a description (http://schema.org/description)"
            }

        )
        if (this.crate.getRootDataset() && this.crate.getRootDataset().description && this.crate.getRootDataset().description.length > 0) {
           checkItem.status = true;
        } 
        return checkItem;
    }

    hasAuthor() {
        var checkItem = new CheckItem(
            {
                name: "Has valid Authors",
                message: "The root Dataset has at least one Author (http://schema.org/author) referred to by @id, and all authors have @type Person (http://schema.org/Person) or Organization (http://schema.org/Organization)"
            }   
        )
        if (this.crate.getRootDataset() && this.crate.getRootDataset().author) {
           const targets = this.crate.utils.asArray(this.crate.getRootDataset().author);
           for (let t of targets) {
               if (t["@id"] && this.crate.getItem(t["@id"])) {
                    var author = this.crate.getItem(t["@id"]);
                    const types = this.crate.utils.asArray(author["@type"]);
                    if (types.includes("Person") || types.includes("Organization")){
                        checkItem.status = true;
                    }
                    else {
                        checkItem.status = false;
                        break;
                    }
               }
               else {
                   checkItem.status = false;
                   break;

               }
           }
             //checkItem.status = allTargetsOk;
           } 
        return checkItem;
    }

    hasLicense() {
        var checkItem = new CheckItem(
            {
                name: "Has a license ",
                message: "The root Dataset has a License of type CreativeWork with a description"
            }

        )
        if (this.crate.getRootDataset() && this.crate.getRootDataset().license) {
            const targets = this.crate.utils.asArray(this.crate.getRootDataset().license);
            for (let t of targets) {
                if (t["@id"]) {
                    var license = this.crate.getItem(t["@id"]);
                    const types = this.crate.utils.asArray(license["@type"]);
                    // TODO check that license path is a path or URL is a URL and check name and description are legit
                    if (types.includes("CreativeWork") && license.name && license.description){
                        checkItem.status = true;
                        break;
                    }
                }
            } 
        }  
        return checkItem;
    }

    hasDatePublished() {
        var checkItem = new CheckItem(
            {
                name: "Has a datePublished ",
                message: "The root Dataset has a datePublished with ONE value which is an  ISO 8601 format  precision of at least a day"
            }
        )
        var date = this.crate.utils.asArray(this.crate.getRootDataset().datePublished);
        if (date.length != 1) {
            checkItem.diagnostics = `Number of datePublished values is ${date.length} NOT 1`;
            return checkItem;
        }
        checkItem.status =date[0].match(/^\d{4}-([0]\d|1[0-2])-([0-2]\d|3[01])/)
        return checkItem;
    }


    hasContactPoint() {
        var checkItem = new CheckItem(
            {
                name: "Has a contactPoint",
                message: "The root Dataset has at least one contactPoint property which references a ContactPoint of type Customer Service"
            }
        )
       
        if (this.crate.getRootDataset() && this.crate.getRootDataset().contactPoint) {
            const targets = this.crate.utils.asArray(this.crate.getRootDataset().contactPoint);
            //console.log("targets", targets)
            for (let t of targets) {
                if (t["@id"]) {
                    var contact= this.crate.getItem(t["@id"]);
                    const types = this.crate.utils.asArray(contact["@type"]);
                    if (types.includes("ContactPoint") &&   this.crate.utils.asArray(contact.contactType).includes("customer service") && contact.email)  {
                        checkItem.status = true;
                        break;
                    }
                }
            } 
        }  

        return checkItem;
    }


    async check() {
        var context = await this.hasContext();
        this.checklist.push(context);
        var dataset = this.hasRootDataset();
        this.checklist.push(dataset);
        var datasetID = this.hasRootDatasetWithProperID();
        this.checklist.push(datasetID);
        var name = this.hasName()
        this.checklist.push(name);
        var description = this.hasDescription()
        this.checklist.push(description);
        //var author = this.hasAuthor();
        //this.checklist.push(author);
        var license = this.hasLicense();
        this.checklist.push(license);
        var date = this.hasDatePublished();
        this.checklist.push(date);

        /*
        var contact = this.hasContactPoint();
        this.checklist.push(contact);
        */


        this.isROCrate = context.status && dataset.status && name.status && description.status && license.status && date.status;

        // TODO: 
        // this.isDistributable


        // this.isCitable
    }

    summarize() {
        if (this.isROCrate) {
            return "This is a valid RO-Crate";
        }
        else {
            return "This is not a valid RO-Crate";
        }
    }

    report() {
        var report = [];
        for (var item of this.checklist) {
            const tick =  item.status ?  "✔️" : "❌";
            report.push(`${tick}   ${item.name}: ${item.message}`);
        }
        return report.join("\n");

    }

}

class CheckItem {
    constructor(data) {
        this.name = data.name;
        this.message = data.message;
        this.status = false;
    }
}

module.exports = Checker;
