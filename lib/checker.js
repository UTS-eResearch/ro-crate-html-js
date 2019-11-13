const defaults = require("./defaults");

class Checker {
    constructor(crate) {
        this.crate = crate;
        this.crate.index();
        this.checklist = [];
        
    }


    hasContext() {
        var checkItem = new CheckItem(
            {
                name: "Has @context",
                message: "The json-ld has an appropriate context"
            }

        )
        const context = this.crate.getJson()["@context"];
        // TODO - fix this when we have a final release
        if (context) {
           checkItem.status = true;
        } 
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
            console.log("targets", targets)
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


    check() {
        var context = this.hasContext();
        this.checklist.push(context);
        var dataset = this.hasRootDataset();
        this.checklist.push(dataset);
        var name = this.hasName()
        this.checklist.push(name);
        var author = this.hasAuthor();
        this.checklist.push(author);
        var license = this.hasLicense();
        this.checklist.push(license);
        var date = this.hasDatePublished();
        this.checklist.push(date);
        var contact = this.hasContactPoint();
        this.checklist.push(contact);

        this.isROCrate = context.status && dataset.status && name.status && author.status && license.status && date.status;

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
