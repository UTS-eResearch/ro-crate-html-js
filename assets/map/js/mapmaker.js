/*
    This is a FRONT END JS FILE

    This file assumes the existence of a div with id "mapdiv"

    This script will handle
        Creating and Populating the map on the frontend using the given array
 */

/*
    Function takes an ARRAY of JSON objects of the form { name, geo: {latitude, longitude} }
 */
function mapinit(places, options=null) {
    if (places.type && places.type==="FeatureCollection") {
        //setup map
        var mymap = L.map('mapdiv');
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
            maxZoom: 18,
            id: 'mapbox/streets-v11',
            tileSize: 512,
            zoomOffset: -1,
        }).addTo(mymap);
        const coords = places.features[0].geometry.coordinates;
        var startlng = (coords[0]) ? coords[0] : 0
        var startlat = (coords[1]) ? coords[1] : 1

        mymap.setView([startlat, startlng], 6); //manually setting initial view to the first geopoint on map
       
        //marker layer group
        var markerLayer = L.layerGroup()

        //pin markers
        for (place of places.features) {
            var startDate = place.properties.startDate ? place.properties.startDate.toString() : "";
            var name = place.properties.name ? place.properties.name : "";
            var endDate = place.properties.endDate ? place.properties.endDate.toString() : "";
            var url = place.properties.url ? place.properties.url : "";
            var lng = place.geometry.coordinates[0] ? place.geometry.coordinates[0] : 0
            var lat = place.geometry.coordinates[1] ? place.geometry.coordinates[1] : 0
            var marker = L.marker([lat, lng], {color: 'red', startDate: startDate, timeStrLength: 4, alwaysShowDate: true, endDate: endDate})
            marker.bindPopup(name + "<br><br>latitude: " + lat + "<br>longitude: " + lng
                + "<br>startDate: " + startDate + "<br>endDate: " +endDate + "<br>"
                + "<br><a href='#" + url + "'>go to item</a>")
            marker.addTo(markerLayer)
        }

        //time slider
        var sliderControl = L.control.sliderControl({position: "topright", layer: markerLayer, timeStrLength: 4, timeAttribute: 'startDate', range: true, clusters: true}); //calls the initialize function
        mymap.addControl(sliderControl); //Adds the slider to the map, calls the onAdd function
        sliderControl.startSlider(); //calls the startSlider function
    }
};