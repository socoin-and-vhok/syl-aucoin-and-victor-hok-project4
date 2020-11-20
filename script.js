// Event listener on the button get value of that button
// Pass the value in the getSportsInfo ajax call
// That call returns the sports id for the chosen sport(aka this)
// Pass the id into the get locations call, get locations, print location onto page. 


//TO DO List - in no particular order
/**
 * Error Handling:
 * -Selected sport but not facility
 * 
 * 
 */

//General formating and styling of results + page
/**
 * Show active button
 */
//Bug: Clicking sport before city requires click on sport again to reveal locations
// Implement different UX scheme for if user chooses to share location vs. not (likely fix above issue)
// e.g. form submission for non-shared location UX scheme


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
sportsApp.sportsFacilitiesMissingAddresses = [];
sportsApp.reverseLocationPromises = [];



// ******* EVENT LISTENERS ******* 

// Button Event Listener: This event listener is applied to all the HTML sports activity buttons.
$('.main__ul-sports-btn').on('click', 'button', function() {
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

sportsApp.getSportsFacilitiesMissingAddresses = (latitude, longitude) => {
    return $.ajax({
        url: 'http://www.mapquestapi.com/geocoding/v1/reverse',
        method: 'GET',
        dataType: 'json',
        data: {
            key: 'ODaFMgthq8yJftHwGItv3AjG0fdnOHgp',
            location: `${latitude},${longitude}`,
        }
    });
};

sportsApp.getSportsFacilities = (id) => {
 // Purpose: Sport's ID number --> Array of sport facilities
        // AJAX request to retrieve the sports places object using the sport id, access its features property (array of sports facilities).
        $.ajax({
            url: 'https://sportplaces.api.decathlon.com/api/v1/places',
            method: 'GET',
            dataType: 'json',
            data: {
                sports: id,
                // origin: '-79.383302,43.653752', // T.O. Downtown
                origin: `${sportsApp.userLongitude}, ${sportsApp.userLatitude}`,
                radius: '20',
                limit: 3
            }
        })
        .then((sportsFacilitiesSuccessfulResponse) => {
            sportsApp.sportsFacilities = sportsFacilitiesSuccessfulResponse.data.features;
                console.log(sportsApp.sportsFacilities);
                //empty the page before we print more results
                $('.main__ul-sports-location').empty();
                sportsApp.reverseLocationPromises = [];

                for(let sportsFacility of sportsApp.sportsFacilities) {
                    // sportsFacility.geometry.coordinates is either going to be an array that contains either 1) lat, lng as elements OR an array or 2) [lat, lng] arrays.
                    // For 1) The lat, lng are assigned directly to the variables, else for 2) It stores the lat, lng of the first array that appears.
                    let latitude = typeof sportsFacility.geometry.coordinates[1] === "number" ? sportsFacility.geometry.coordinates[1] : sportsFacility.geometry.coordinates[0][1];
                    let longitude = typeof sportsFacility.geometry.coordinates[0] === "number" ? sportsFacility.geometry.coordinates[0] : sportsFacility.geometry.coordinates[0][0];
                    // Pushes the promises of the reverse geolocation lookups for MapQuest API in the same order as the Decathlon sports places API.
                    sportsApp.reverseLocationPromises.push(sportsApp.getSportsFacilitiesMissingAddresses(latitude, longitude));
                }
                //call the print resutls function
                sportsApp.printFacilitiesResultsonPage();
            // sportsApp.getSportsFacilitiesMissingAddresses(43.653752, -79.383302); ***
            console.log(sportsApp.reverseLocationPromises);
        })
        .fail(() => {
            // Do something to handle error. Display message on page to let user know no facilities were returned
            console.log('no facilities');
        });

    }


//function that gets the coordinates of the location - to be passed inside of an event listener
sportsApp.getLocation = () => {
    navigator.geolocation.getCurrentPosition(
        //If the user opts to share their locations and a place is returned:
        function(place){ 
            sportsApp.userLatitude = (place.coords.latitude);
            sportsApp.userLongitude = (place.coords.longitude);
        },
        //If the user blockes their current location:
        function() {
            $('.main__ul-city-btn').toggleClass('ul-city-btn--active')
            .on('click', 'button', function(){
                        sportsApp.userLatitude = $(this).data('lat');
                        sportsApp.userLongitude = $(this).data('long');
                        console.log(sportsApp.userLatitude);
                    });
            
        }
    )
}


//function to display info on page
sportsApp.printFacilitiesResultsonPage = () => {
    $.when(...sportsApp.reverseLocationPromises)
        .then(function(...missingAddressesResponse) {
        console.log(missingAddressesResponse);

        //Maps only the address property of the reverseLocationResponse array to a new array.
        sportsApp.sportsFacilitiesMissingAddresses = missingAddressesResponse.map( address => address[0].results[0].locations[0] );

        console.log(sportsApp.sportsFacilitiesMissingAddresses);
        
        //save city and street address so that we can print them on to the page!
        // sportsApp.facilityMissingStreet = sportsApp.sportsFacilitiesMissingAddresses.street;
        // sportsApp.facilityMissingCity = sportsApp.sportsFacilitiesMissingAddresses.adminArea5;

        // temporary loop for testing
        sportsApp.sportsFacilitiesMissingAddresses.forEach((location) => {
            console.log(location.street);
            console.log(location.adminArea5);
        });

        for (let i = 0; i < sportsApp.sportsFacilities.length; i++) {
            sportsApp.facilityName = sportsApp.sportsFacilities[i].properties.name;
            sportsApp.facilityAddress = sportsApp.sportsFacilities[i].properties.address_components;
        
            //print each on page! 
            //!!!!!! ERROR HANDLING if address and contact fields are null - get only ones with address? 
            $('.main__ul-sports-location').append(
    
                `<li>
                    <div class="main__div-address">
                        <h2>${sportsApp.facilityName}</h2>
                        <address>${sportsApp.facilityAddress.address !== null ? sportsApp.facilityAddress.address : sportsApp.sportsFacilitiesMissingAddresses[i].street}</address>
                        <address>${sportsApp.facilityAddress.city !== null ? sportsApp.facilityAddress.city : sportsApp.sportsFacilitiesMissingAddresses[i].adminArea5}</address>
                    </div>
                    <div class="main__div-map">
                        <img src="${sportsApp.sportsFacilitiesMissingAddresses[i].mapUrl.replace("marker-sm-50318A-1&scalebar=true&zoom=15", "marker-sm-ff6700-&scalebar=false&zoom=14")}" alt="a map">
                    </div>
                </li>`
            )
        }

        // console.log(sportsApp.facilityMissingStreet);
        // console.log(sportsApp.facilityMissingCity);
        })
        .fail(function(noAddresses) {

        });
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