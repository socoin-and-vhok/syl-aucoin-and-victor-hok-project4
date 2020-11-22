//PSEUDO CODE 
//Event listener on the button get value of that button (sport)
// Pass the value in the getSportsInfo ajax call
// That call returns the sports id for the chosen sport(aka this)
// Pass the id into the get locations call, get locations, print location onto page. 

/**
 * GENERAL NOTES:
 * It's a sports facilities locator app that accepts a sports slug and id pair and utilizes 
 * geolocation or a statically defined city centre coordinates in order to retrieve a list of
 * local parks, fields, and sports centres, etc... from Decathlon Sports Place API
 * 
 * For locations such as fields, parks, and public courts, addresses do not come defined
 * in a conventional way (ie only longitudinal and latitudinal coordinates given). Therefore,
 * a reverse geolocation look up using Map Quest API is used to fetch the street address, and
 * minimap to provide a complete set of information.
 */

 // ******* GLOBAL VARIABLES *******

const app = {};

// Variables to longitude and latitude coordinates to query Decathlon Sports Place API.
// Geolocation Input (Provided in event that geolocation is allowed on browser by user).
app.userLongitude;
app.userLatitude;
// Variable to hold formatted longitude and latitude for AJAX call request (If static, directly retrieved from html buttons. If geolocation, concatinated using app.userLongitude and app.userLatitude).
app.userLongLat;

app.sports; // An array representing a list of sports supported by Decathlon API.
app.sportId; // A variable used to temporarily hold the sportId when querying for sports facilities.
app.facilities; // An array representing a list of sports facilities fetched by Decathlon API.

app.facilitiesMissingAddresses = []; // An array of street addresses obtained from the MapQuest API (using the coordinates from app.facilities). This array is identical in size to app.facilities with corresponding elements in the same order.
app.reverseLocationPromises = []; 


// ******* EVENT LISTENERS ******* 

// Button Event Listener: This event listener is applied to all the HTML sports activity buttons.
$('.main__ul-sports-btn').on('click', 'button', function() {
    //Remove the class of btn--active to the previous butteon (if need be)
    $('.main__ul-sports-btn>li button.btn--active').removeClass('btn--active');
    //Add the class of btn--active to the current selection, as to give our user a visual indicator of the selected sport
    $(this).addClass('btn--active');
    // Upon clicking the button, retrieve its inline html value and assign to sportsValue
    app.sportId = app.getSportId($(this).data('slug'));
    //Call the function to get the facilities for the chosen sport
    //The function takes a single location paramter (a string composed of the longitude and the latitude)
    app.userLongLat = `${app.userLongitude},${app.userLatitude}`;
    app.getFacilities(app.sportId, app.userLongLat);
});


//*****FUNCTIONS *********/

//Function to get a array of all the sports (slug) and their matching IDs
// Purpose: Sport's name --> Sport's ID number
// AJAX request to retrieve the sport object using the sport's name (ie button value), access its id property, and assign the value to sportsId.
app.getAllSports = () => {
    $.ajax({
        url: `https://sports.api.decathlon.com/sports`,
        method: 'GET',
        dataType: 'json',
    }).then( (sportsActivitySuccessfulResponse) => {
        app.sports = sportsActivitySuccessfulResponse.data;
    })
    .fail((sportsActivityFailedResponse) => {
        $('.main__ul-sports-location').append(`<p>Oops! It seems that we're having some technical issues. ${sportsActivityFailedResponse.status} ${sportsActivityFailedResponse.statusText}</p>`)
    });
}

//Function to retreive the ID from selected sport (using the slug value)
app.getSportId = (slug) => {
    //Locates the id in the array using the slug
    for(let sport of app.sports) {
        if(sport.attributes.slug === slug) 
        return sport.id;
    }
}

//Function to get sports facilities based on user's location and chosen sport
// Purpose: Sport's ID number --> Array of sport facilities
app.getFacilities = (id, location) => {
    // AJAX request to retrieve the sports places object using the sport id, access its features property (array of sports facilities).
    $.ajax({
        url: 'https://sportplaces.api.decathlon.com/api/v1/places',
        method: 'GET',
        dataType: 'json',
        data: {
            sports: id,
            origin: location,
            radius: '99',
            limit: 15
        }
    })
    .then((facilitiesSuccessfulResponse) => {
        app.facilities = facilitiesSuccessfulResponse.data.features;
            //empty the page before we print more results
            $('.main__ul-sports-location').empty();
            //check if there are facilities
            //If there aren't any - print a message letting the user know.
            if (app.facilities.length <= 0) {
                $('.main__ul-sports-location').append(`<p>We're sorry, no facilities were found within a 99km radius for the selected sport.</p>`)
            } else {
            //declare a variable to store our array or returned promises
            app.reverseLocationPromises = [];
            //Get coordinates for each facility so that we can use those coordinates to get missing addresses
            for(let facility of app.facilities) {
                // facility.geometry.coordinates is either going to be an array that contains either 1) lat, lng as elements OR 2) an array of [lat, lng] arrays.
                // For 1) The lat, lng are assigned directly to the variables, else for 2) It stores the lat, lng of the first array that appears.
                let latitude = typeof facility.geometry.coordinates[1] === "number" ? facility.geometry.coordinates[1] : facility.geometry.coordinates[0][1];
                let longitude = typeof facility.geometry.coordinates[0] === "number" ? facility.geometry.coordinates[0] : facility.geometry.coordinates[0][0];
                // Pushes the promises of the reverse geolocation lookups for MapQuest API in the same order as the Decathlon sports places API.
                app.reverseLocationPromises.push(app.getFacilitiesMissingAddresses(latitude, longitude));
            }
            //call the print results function
            app.printFacilitiesResultsonPage();
            }
    })
    .fail((facilitiesFail) => {
        $('.main__ul-sports-location').empty();
        $('.main__ul-sports-location').append(`<p>Oops! It seems that we've encountered an error retreiving your results. Please make sure that you've shared your location. ${facilitiesFail.status} ${facilitiesFail.statusText}</p>`)
    });
}

//Function to get addresses for app.getFacilities results that do not have addresses. This issue was pretty common given that many sports facilities such as soccer fields and tennis courts are outdoors and often do not have addresses (number and street).
//We pass the coordinates into the mapquest API to get an address, and a mini map to display on the page.
app.getFacilitiesMissingAddresses = (latitude, longitude) => {
    return $.ajax({
        url: 'https://www.mapquestapi.com/geocoding/v1/reverse',
        method: 'GET',
        dataType: 'json',
        data: {
            key: 'xd47QVmAyNQy2XHKcudvcA6HcHf81INZ',
            location: `${latitude},${longitude}`,
        }
    });
};


//Function that gets the coordinates of the user's location - with their permission - to be passed inside of the get facilities function
app.getLocation = () => {
    navigator.geolocation.getCurrentPosition(
        //If the user opts to share their locations and a place is returned:
        function(place){ 
            app.userLatitude = (place.coords.latitude);
            app.userLongitude = (place.coords.longitude);
        },
        //If the user blockes their current location:
        //FORM Event listener to be used to get the users location
        //Purpose - Get the coordinates from a predetermined list of cities. We are using the center of the city/downtown for our coordinates
        function() {
            //Hide the sports selection buttons
            $('.main__ul-sports-btn').hide();
            $('main p:first-of-type').hide();
            //Display the form and retreive the values the user selects (city and sport).
            $('.main__form')
                .trigger('reset')
                .toggleClass('form--active')
                .on('submit', function(e){
                    e.preventDefault();
                    //Store the users location and sport on submit of the form
                    app.userLongLat = $('input[name=city]:checked').val();
                    app.sportId = app.getSportId($('input[name=sport]:checked').val());
                    //Call the app.getFacilities function passing in those varibales as arguments
                    app.getFacilities(app.sportId, app.userLongLat);
                });
        }
    )
}


//function to display/print the facilities onto the page
app.printFacilitiesResultsonPage = () => {
    $.when(...app.reverseLocationPromises)

    .then(function(...missingAddressesResponse) {
    
    //This if/else statement takes care of a very specific corner case where the result returned is an array of objects instead of array of arrays. This is the case when there is a single result being returned (this example can be viewed specifically when selecting Calgary as the city, and boxing as the sport).
    if(Array.isArray(missingAddressesResponse[0])) {
        //Maps only the address property of the reverseLocationResponse array to a new array.
        app.facilitiesMissingAddresses = missingAddressesResponse.map( address => address[0].results[0].locations[0] );
    } else {
        app.facilitiesMissingAddresses = [missingAddressesResponse[0].results[0].locations[0]];
    }
    //Loop through each facility and store the name and address.
        for (let i = 0; i < app.facilities.length; i++) {
            app.facilityName = app.facilities[i].properties.name;
            app.facilityAddress = app.facilities[i].properties.address_components;
            //print each facility on the page! 
            $('.main__ul-sports-location').append(
                //Tab index to allow user to tab through results with keyboard
                //If the address from the app.facilities array contains an address, we print it. If it is null, we move on to the app.facilitiesMissingAddresses array and print that result. 
                //Link to a google map of the location using the coordinates.
                //Modify the minimap link for esthetics (zoom, marker).
                `<li tabindex="0">
                
                    <div class="main__div-address">
                        <h2>${app.facilityName}</h2>
                        <address>${app.facilityAddress.address !== null ? app.facilityAddress.address : app.facilitiesMissingAddresses[i].street}</address>
                        <address>${app.facilityAddress.city !== null ? app.facilityAddress.city : app.facilitiesMissingAddresses[i].adminArea5}</address>
                    </div>

                    <div class="main__div-map">
                    <a href="https://www.google.com/maps/place/${app.facilitiesMissingAddresses[i].latLng.lat},${app.facilitiesMissingAddresses[i].latLng.lng}" target="_blank"><img src="${app.facilitiesMissingAddresses[i].mapUrl.replace("marker-sm-50318A-1&scalebar=true&zoom=15", "marker-sm-ff6700-&   scalebar=false&zoom=14").replace("http://", "https://")}" alt="a map of location"></a>
                    </div>
                    
                </li>`
            )
        }
    })
}


//********initialize!****** 
app.init = () => {
    //on page load - 
    //Call the function that prompts user for location
    app.getLocation();
    //Call the function that populates app.sports
    app.getAllSports();
}


// ******* DOCUMENT READY ******* 
$(function() {
    app.init();
});