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

    if (places) {
        //setup map
        var mymap = L.map('mapdiv');
        L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}', {
            attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
            maxZoom: 18,
            id: 'mapbox/streets-v11',
            tileSize: 512,
            zoomOffset: -1,
            accessToken: 'pk.eyJ1IjoiYmVub3oxMSIsImEiOiJjazNpMmsyeGIwM3ZnM2JwaW9mdG9sdWl1In0.RrwSfVxBLJhqSK3aTsEaNw'
        }).addTo(mymap);

        var startlat = (places[0].latitude) ? places[0].latitude : 0
        var startlng = (places[0].longitude) ? places[0].longitude : 0

        mymap.setView([startlat, startlng], 6); //manually setting initial view to the first geopoint on map

        //marker layer group
        var markerLayer = L.layerGroup()

        //pin markers
        for (place of places) {
            var startDate = (place.startDate === undefined) ? undefined : place.startDate.toString() //setting time variable to the startDate if exists, set undefined to 0000 to aid in sorting
            var endDate = (place.endDate === undefined) ? undefined : place.endDate.toString()
            var lat = (place.latitude) ? place.latitude : 0
            var lng = (place.longitude) ? place.longitude : 0
            var marker = L.marker([lat, lng], {color: 'red', startDate: startDate, timeStrLength: 4, alwaysShowDate: true, endDate: endDate})
            marker.bindPopup(place.name + "<br><br>latitude: " + lat + "<br>longitude: " + lng
                + "<br>startDate: " + place.startDate + "<br>endDate: " + place.endDate + "<br>"
                + "<br><a href='" + place.url + "'>go to item</a>")
            marker.addTo(markerLayer)
        }

        //time slider
        var sliderControl = L.control.sliderControl({position: "topright", layer: markerLayer, timeStrLength: 4, timeAttribute: 'startDate', range: true, clusters: true}); //calls the initialize function
        mymap.addControl(sliderControl); //Adds the slider to the map, calls the onAdd function
        sliderControl.startSlider(); //calls the startSlider function
    }
};