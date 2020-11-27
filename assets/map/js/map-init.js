//defining places here, you could do this from json,kml,etc using file readers
const places = [
    {
        name: "place1",
        startDate: '1-JAN-2020',
        geo: {latitude: -31, longitude: 151}
    },
    {
        name: "place2",
        startDate: '2-JAN-2020',
        geo: {latitude: -32, longitude: 151}
    },
    {
        name: "place3",
        startDate: '3-JAN-2020',
        geo: {latitude: -33, longitude: 151}
    }
]

//setup map
var mymap = L.map('mapid');
L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}', {
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
    maxZoom: 18,
    id: 'mapbox/streets-v11',
    tileSize: 512,
    zoomOffset: -1,
    accessToken: 'pk.eyJ1IjoiYmVub3oxMSIsImEiOiJjazNpMmsyeGIwM3ZnM2JwaW9mdG9sdWl1In0.RrwSfVxBLJhqSK3aTsEaNw'
}).addTo(mymap);

mymap.setView([places[0].geo.latitude, places[0].geo.longitude], 6); //manually setting initial view to the first geopoint on map

//marker layer group
var markerLayer = L.layerGroup()



//add your places
addPlaces(places)

//initialize the slider
makeSlider()

/**
 * Add places to the markerLayer as markers
 * 
 * places is an array of json objects with the following properties: {name, startDate: , endDate: , geo: {longitude: , latitude: } }
 *     startDate and endDate are optional
 * @param {*} places 
 */
function addPlaces(places) {
    for (place of places) {
        var startDate =  place.startDate.toString() //setting time variable to the startDate if exists, set undefined to 0000 to aid in sorting
        var endDate = place.endDate.toString()
        console.log(startDate, endDate)
        var marker = L.marker([place.geo.latitude, place.geo.longitude], {color: 'red', startDate: startDate, timeStrLength: 4, alwaysShowDate: true, endDate: endDate})
        marker.bindPopup(place.name + "<br><br>latitude: " + place.geo.latitude + "<br>longitude: " + place.geo.longitude 
            + "<br>startDate: " + place.startDate + "<br>endDate: " + place.endDate + "<br>")
        marker.addTo(markerLayer)
    }
}

/**
 * Initialize the slider with the given options (optional)
 *     Timeslider requires the name of the marker layer variable, the rest will be initialized to defaults
 *         See BenSliderControls.js for a list of options that may be passed through
 * {}
 * @param {*} options 
 */
function makeSlider(options={}) {
    //time slider
    var sliderControl = L.control.sliderControl({position: "topright", layer: markerLayer, timeStrLength: 4, timeAttribute: 'startDate', range: true, clusters: true}); //calls the initialize function
    mymap.addControl(sliderControl); //Adds the slider to the map, calls the onAdd function
    sliderControl.startSlider(); //calls the startSlider function
}