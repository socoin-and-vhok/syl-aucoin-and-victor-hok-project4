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

//STRETCH
// On click of map, a maps directions page pops up?


const app = {};
//variable to store user's location (geolocation)
app.userLongitude;
app.userLatitude;

//Empty array to contain all the sports - for potential search/autocomplete
// app.sportsArray = [];

//will store all our sport
app.sports;
app.sportId;
app.facilities;
app.facilitiesMissingAddresses = [];
app.reverseLocationPromises = [];



// ******* EVENT LISTENERS ******* 

// Button Event Listener: This event listener is applied to all the HTML sports activity buttons.
$('.main__ul-sports-btn').on('click', 'button', function() {
    // Upon clicking the button, retrieve its inline html value and assign to sportsValue
    app.sportId = app.getSportId($(this).data('slug'));
    //Call the function to get the facilities for the chose sport
    app.getFacilities(app.sportId);
});

//CITY Event listener to be used to get the location from a static button
//Purpose - Get the coordinates of a chosen city (when users wish to not share live location)
$('#city').on('click', function() {
    app.staticCoordinatesLong = $(this).data('long');
    app.staticCoordinatesLat = $(this).data('lat');
})





//*****FUNCTIONS *********/

//Function to retreive the ID from selected sport (using the slug value)
app.getSportId = (slug) => {
    // finds the id in the array using the slug
    for(let sport of app.sports) {
        if(sport.attributes.slug === slug) 
        return sport.id;
    }
}

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
    .fail(() => {
        // Do something to handle error.
    });
}

app.getFacilitiesMissingAddresses = (latitude, longitude) => {
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

app.getFacilities = (id) => {
 // Purpose: Sport's ID number --> Array of sport facilities
        // AJAX request to retrieve the sports places object using the sport id, access its features property (array of sports facilities).
        $.ajax({
            url: 'https://sportplaces.api.decathlon.com/api/v1/places',
            method: 'GET',
            dataType: 'json',
            data: {
                sports: id,
                // origin: '-79.383302,43.653752', // T.O. Downtown
                origin: `${app.userLongitude}, ${app.userLatitude}`,
                radius: '20',
                limit: 3
            }
        })
        .then((facilitiesSuccessfulResponse) => {
            app.facilities = facilitiesSuccessfulResponse.data.features;
                console.log(app.facilities);
                //empty the page before we print more results
                $('.main__ul-sports-location').empty();
                app.reverseLocationPromises = [];

                for(let facility of app.facilities) {
                    // sportsFacility.geometry.coordinates is either going to be an array that contains either 1) lat, lng as elements OR an array or 2) [lat, lng] arrays.
                    // For 1) The lat, lng are assigned directly to the variables, else for 2) It stores the lat, lng of the first array that appears.
                    let latitude = typeof facility.geometry.coordinates[1] === "number" ? facility.geometry.coordinates[1] : facility.geometry.coordinates[0][1];
                    let longitude = typeof facility.geometry.coordinates[0] === "number" ? facility.geometry.coordinates[0] : facility.geometry.coordinates[0][0];
                    // Pushes the promises of the reverse geolocation lookups for MapQuest API in the same order as the Decathlon sports places API.
                    app.reverseLocationPromises.push(app.getFacilitiesMissingAddresses(latitude, longitude));
                }
                //call the print resutls function
                app.printFacilitiesResultsonPage();
            // app.getFacilitiesMissingAddresses(43.653752, -79.383302); ***
            console.log(app.reverseLocationPromises);
        })
        .fail(() => {
            // Do something to handle error. Display message on page to let user know no facilities were returned
            console.log('no facilities');
        });

    }


//function that gets the coordinates of the location - to be passed inside of an event listener
app.getLocation = () => {
    navigator.geolocation.getCurrentPosition(
        //If the user opts to share their locations and a place is returned:
        function(place){ 
            app.userLatitude = (place.coords.latitude);
            app.userLongitude = (place.coords.longitude);
        },
        //If the user blockes their current location:
        function() {
            $('.main__ul-city-btn').toggleClass('ul-city-btn--active')
            .on('click', 'button', function(){
                        app.userLatitude = $(this).data('lat');
                        app.userLongitude = $(this).data('long');
                        console.log(app.userLatitude);
                    });
            
        }
    )
}


//function to display info on page
app.printFacilitiesResultsonPage = () => {
    $.when(...app.reverseLocationPromises)
        .then(function(...missingAddressesResponse) {
        console.log(missingAddressesResponse);

        //Maps only the address property of the reverseLocationResponse array to a new array.
        app.facilitiesMissingAddresses = missingAddressesResponse.map( address => address[0].results[0].locations[0] );

        console.log(app.facilitiesMissingAddresses);
        
        //save city and street address so that we can print them on to the page!
        // app.facilityMissingStreet = app.facilitiesMissingAddresses.street;
        // app.facilityMissingCity = app.facilitiesMissingAddresses.adminArea5;

        // temporary loop for testing
        app.facilitiesMissingAddresses.forEach((location) => {
            console.log(location.street);
            console.log(location.adminArea5);
        });

        for (let i = 0; i < app.facilities.length; i++) {
            app.facilityName = app.facilities[i].properties.name;
            app.facilityAddress = app.facilities[i].properties.address_components;
        
            //print each on page! 
            //!!!!!! ERROR HANDLING if address and contact fields are null - get only ones with address? 
            $('.main__ul-sports-location').append(
    
                `<li>
                    <div class="main__div-address">
                        <h2>${app.facilityName}</h2>
                        <address>${app.facilityAddress.address !== null ? app.facilityAddress.address : app.facilitiesMissingAddresses[i].street}</address>
                        <address>${app.facilityAddress.city !== null ? app.facilityAddress.city : app.facilitiesMissingAddresses[i].adminArea5}</address>
                    </div>
                    <div class="main__div-map">
                        <img src="${app.facilitiesMissingAddresses[i].mapUrl.replace("marker-sm-50318A-1&scalebar=true&zoom=15", "marker-sm-ff6700-&scalebar=false&zoom=14")}" alt="a map">
                    </div>
                </li>`
            )
        }

        // console.log(app.facilityMissingStreet);
        // console.log(app.facilityMissingCity);
        })
        .fail(function(noAddresses) {

        });
}


//********initialize!****** 
app.init = () => {
    app.getLocation();
    app.getAllSports();
    console.log('ready!');
}






// ******* DOCUMENT READY ******* 
$(function() {
    app.init();
});