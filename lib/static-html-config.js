

class Config {
    constructor() {
        this.collectionTypes = ["Person", "Place"];
        this.datasetProperty = {"Person": "about"};
        this.followProperty =  {
                "birthPlace": {"@type": "Place"}, // Not using @type ATM
                "geo": {"@type": "geoCoordinates"},
                "location": {"@type": "Place"}, // Not using @type ATM
                "object": {},
                "about" : {}
            }

        //   "followReverseProperty":  {}
            
        this.templates = {
            "Person": null
        } //TODO

        this.pageSize = 60;
    }

    hasOwnPage(item) {
        if (!Array.isArray(item["@type"])) {
            item["@type"] = [ item["@type"]];
        }
        return  this.collectionTypes.filter(value => item["@type"].includes(value)).length > 0
    }
}

module.exports =  Config;