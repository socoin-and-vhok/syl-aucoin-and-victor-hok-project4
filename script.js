// Event listener on the button get value of that button
// Pass the value in the getSportsInfo ajax call
// That call returns the sports id for the chosen sport(aka this)
// Pass the id into the get locations call, get locations, print location onto page. 


//TO DO List - in no particular order
//Make getFacilities dynamic based on location chosen/or geolocation
//Access mapquest API to get the missing addresses based on long lat coordinates for locations results.(coordinates nested in geometry)
//Update the Hero image to the relevant sport
//Define a function to insert in the else statement for the getGeolocation function
    //This function will:
        // make the city buttons appear
        // on click of a button, set the location to the chosen city coordinates
//Get mini maps for each result (Stretch Goal)
//Message somewhere that indicates that this apop only works in canada!!!
//General formating and styling of results + page



const sportsApp = {};
//variable to store user's location (geolocation)
sportsApp.userLongitude;
sportsApp.userLatitude;
//Empty array to contain all the sports - for potential search/autocomplete
sportsApp.sportsResultsArray = [];

//will store all our sport
sportsApp.sports;
sportsApp.sportId;
sportsApp.sportFacilities;



// ******* EVENT LISTENERS ******* 

// Button Event Listener: This event listener is applied to all the HTML sports activity buttons.
$('button').on('click', function() {
    // Upon clicking the button, retrieve its inline html value and assign to sportsValue
    sportsApp.sportId = sportsApp.getSportId($(this).data('slug'));
    //Call the function to get the facilities for the chose sport
    sportsApp.getSportsFacilities(sportsApp.sportId);
});

//CITY Event listener to be used to get the location from a static button
//Purpose - Get the coordinates of a chosen city (when users wish to not share live location)
$('#city').on('click', function() {
    sportsApp.staticCoordinatesLong = $(this).data('long');
    sportsApp.staticCoordinatesLat = $(this).data('lat');
})






//*****FUNCTIONS *********/

//Function to retreive the ID from selected sport (using the slug value)
sportsApp.getSportId = (slug) => {
    // finds the id in the array using the slug
    for(let sport of sportsApp.sports) {
        if(sport.attributes.slug === slug) 
        return sport.id;
    }
}

// Purpose: Sport's name --> Sport's ID number
// AJAX request to retrieve the sport object using the sport's name (ie button value), access its id property, and assign the value to sportsId.
sportsApp.getAllSports = () => {
    $.ajax({
        url: `https://sports.api.decathlon.com/sports`,
        method: 'GET',
        dataType: 'json',
    }).then( (sportsActivitySuccessfulResponse) => {
        sportsApp.sports = sportsActivitySuccessfulResponse.data;
    })
    .fail(() => {
        // Do something to handle error.
    });
}


sportsApp.getSportsFacilities = (id) => {
 // Purpose: Sport's ID number --> Array of sport facilities
        // AJAX request to retrieve the sports places object using the sport id, access its features property (array of sports facilities).
        $.ajax({
            url: 'https://sportplaces.api.decathlon.com/api/v1/places',
            method: 'GET',
            dataType: 'json',
            data: {
                sports: id,
                origin: '-79.383302,43.653752', // T.O. Downtown
                radius: '20',
                limit: 200
            }
        })
        .then((sportsFacilitiesSuccessfulResponse) => {
            sportsApp.sportsFacilities = sportsFacilitiesSuccessfulResponse.data.features;
                console.log(sportsApp.sportsFacilities);
                //empty the page before we print more results
                $('.main__ul-sports-location').empty();
                //call the print resutls function
                sportsApp.printFacilitiesResultsonPage();
        })
        .fail(() => {
            // Do something to handle error. Display message on page to let user know no facilities were returned
        });
    }


//function that gets the coordinates of the location - to be passed inside of an event listener
sportsApp.getLocation = () => {
    if(navigator.geolocation){
        navigator.geolocation.getCurrentPosition(function(place){ 
            sportsApp.userLongitude = (place.coords.latitude);
            sportsApp.userLatitude = (place.coords.longitude);
            console.log(sportsApp.userLongitude, sportsApp.userLatitude);
        })
    } //else - if we dont get the location from user - maybe the city buttons show up on the page and they can choose one? OR a message!
}


//function to display info on page
sportsApp.printFacilitiesResultsonPage = () => {
    for (let i = 0; i <= 20; i++) {
        sportsApp.facilityName = sportsApp.sportsFacilities[i].properties.name;
        sportsApp.facilityAddress = sportsApp.sportsFacilities[i].properties.address_components;
        sportsApp.facilityContact = sportsApp.sportsFacilities[i].properties.contact_details;
    
        //print each on page! 
        //!!!!!! ERROR HANDLING if address and contact fields are null - get only ones with address? 
        $('.main__ul-sports-location').append(

            `<li>
                <div class="main__div-address">
                    <h2>${sportsApp.facilityName}</h2>
                    <address>${sportsApp.facilityAddress.address}</address>
                    <address>${sportsApp.facilityAddress.city}</address>
                    <address>${sportsApp.facilityContact.phone}</address>
                </div>
                <div class="main__div-map">
                    <img src="https://placebear.com/100/100" alt="a map">
                </div>
            </li>`
        )
    }
}




//********initialize!****** 
sportsApp.init = () => {
    sportsApp.getLocation();
    sportsApp.getAllSports();
    console.log('ready!');
}






// ******* DOCUMENT READY ******* 
$(function() {
    sportsApp.init();
});