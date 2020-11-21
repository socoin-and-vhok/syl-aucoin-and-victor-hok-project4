//PSEUDO CODE 
//Event listener on the button get value of that button (sport)
// Pass the value in the getSportsInfo ajax call
// That call returns the sports id for the chosen sport(aka this)
// Pass the id into the get locations call, get locations, print location onto page. 


//TO DO List - in no particular order
/**
 * Error Handling:
 * -Selected sport but not facility
 * - Message in the event that there are no facilities being returned (highly unlikely, though)
 */

//General formating and styling of results + page
//  Show active button
//  Pick colours and font!
//  Maybe have the results in a grid on desktop, and in a single column on mobile?

//Remove console logs and tidy up

//STRETCH Goal - 
// On click of map, a maps directions page pops up?


const app = {};
//variable to store user's location (geolocation)
app.userLongitude;
app.userLatitude;

//Empty array to contain all the sports - for potential search/autocomplete
// app.sportsArray = [];

//Variables for later :)
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
    //Call the function to get the facilities for the chosen sport
    //The function takes a single location paramter (a string composed of the longitude and the latitude)
    app.userLongLat = `${app.userLongitude},${app.userLatitude}`;
    app.getFacilities(app.sportId, app.userLongLat);

    console.log(app.userLongLat);
});



//*****FUNCTIONS *********/

//Function to get a array of all the sports and their matching IDs
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
    // finds the id in the array using the slug
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
            radius: '20',
            limit: 3
        }
    })
    .then((facilitiesSuccessfulResponse) => {
        app.facilities = facilitiesSuccessfulResponse.data.features;
            console.log(app.facilities);
            //empty the page before we print more results
            $('.main__ul-sports-location').empty();
            //check if there are facilities
            //If there aren't any - print a message letting the user know.
            if (app.facilities.length <= 0) {
                $('.main__ul-sports-location').append(`<p>We're sorry, no facilities were found within a 20km radius for the selected sport.</p>`)
            } else {
            //declare a variable to store our array or returned promises
            app.reverseLocationPromises = [];
            //Get coordinates for each facility so that we can use those coordinates to get missing addresses
            for(let facility of app.facilities) {
                // sportsFacility.geometry.coordinates is either going to be an array that contains either 1) lat, lng as elements OR an array or 2) [lat, lng] arrays.
                // For 1) The lat, lng are assigned directly to the variables, else for 2) It stores the lat, lng of the first array that appears.
                let latitude = typeof facility.geometry.coordinates[1] === "number" ? facility.geometry.coordinates[1] : facility.geometry.coordinates[0][1];
                let longitude = typeof facility.geometry.coordinates[0] === "number" ? facility.geometry.coordinates[0] : facility.geometry.coordinates[0][0];
                // Pushes the promises of the reverse geolocation lookups for MapQuest API in the same order as the Decathlon sports places API.
                app.reverseLocationPromises.push(app.getFacilitiesMissingAddresses(latitude, longitude));
            }
            //call the print results function
            app.printFacilitiesResultsonPage();
            }
        console.log(app.reverseLocationPromises);
    })
    .fail((facilitiesFail) => {
        $('.main__ul-sports-location').append(`<p>Oops! It seems that we've encountered an error retreiving your results. ${facilitiesFail.status} ${facilitiesFail.statusText}</p>`)
    });
}

//Function to get addresses for app.getFacilities results that do not have addresses. This issue was pretty common given that many sports facilities such as soccer fields and tennis courts are outdoors and often do not have addresses.
//We pass the coordinates into the mapquest API to get an address, and a mini map to display on the page
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


//Function that gets the coordinates of the user's location - with their permission - to be passed inside of the get facilities function
app.getLocation = () => {
    navigator.geolocation.getCurrentPosition(
        //If the user opts to share their locations and a place is returned:
        function(place){ 
            app.userLatitude = (place.coords.latitude);
            app.userLongitude = (place.coords.longitude);
        },
        //If the user blockes their current location:
        //FORM Event listener to be used to get the users location, if they opt out of sharing live geolocation
        //Purpose - Get the coordinates from a predetermined list of cities. We are using the center of the city/downtown for our coordinates
        function() {
            //Hide the sports selection buttons
            $('.main__ul-sports-btn').hide();

            $('.main__form')
                
                .toggleClass('form--active')
                .on('submit', function(e){
                    e.preventDefault();
                    app.userLongLat = $('input[name=city]:checked').val();
                    app.sportId = app.getSportId($('input[name=sport]:checked').val());
                    console.log(app.sportId);
                    console.log(app.userLongLat);

                    app.getFacilities(app.sportId, app.userLongLat);
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
                        <img src="${app.facilitiesMissingAddresses[i].mapUrl.replace("marker-sm-50318A-1&scalebar=true&zoom=15", "marker-sm-ff6700-&   scalebar=false&zoom=14")}" alt="a map">
                    </div>
                </li>`
            )
        }
    })
    .fail(function(noAddresses) {
        //Do something? 
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