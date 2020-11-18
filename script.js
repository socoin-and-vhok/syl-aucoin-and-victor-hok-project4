// Event listener on the button get value of that button
// Pass the value in the getSportsInfo ajax call
// That call returns the sports id for the chosen sport(aka this)
// Pass the id into the get locations call, get locations, print location onto page. 

const sportsApp = {};
//variable to store user's location (geolocation)
sportsApp.userLongitude;
sportsApp.userLatitude;


// ******* EVENT LISTENERS ******* 

// Button Event Listener: This event listener is applied to all the HTML sports activity buttons.
$('button').on('click', function() {
    // Upon clicking the button, retrieve its inline html value and assign to sportsValue
    sportsApp.sportsValue = $(this).val();

    // Purpose: Sport's name --> Sport's ID number
    // AJAX request to retrieve the sport object using the sport's name (ie button value), access its id property, and assign the value to sportsId.
    $.ajax({
        url: `https://sports.api.decathlon.com/sports/${sportsApp.sportsValue}`,
        method: 'GET',
        dataType: 'json',
    }).then( (sportsActivitySuccessfulResponse) => {
        sportsApp.sportsId = sportsActivitySuccessfulResponse.data.id;

        // Purpose: Sport's ID number --> Array of sport facilities
        // AJAX request to retrieve the sports places object using the sport id, access its features property (array of sports facilities).
        $.ajax({
            url: 'https://sportplaces.api.decathlon.com/api/v1/places',
            method: 'GET',
            dataType: 'json',
            data: {
                sports: `${sportsApp.sportsId}`,
                origin: '-79.383302,43.653752', // T.O. Downtown
                radius: '20',
                limit: 200
            }
        })
        .then((sportsFacilitiesSuccessfulResponse) => {
            sportsApp.sportsFacilities = sportsFacilitiesSuccessfulResponse.data.features;
                console.log(sportsApp.sportsFacilities.filter( facility => facility.properties.address_components.city === 'Toronto'));
                //empty the page before we print more results
                $('.main__ul-sports-location').empty();
                //call the print resutls function
                sportsApp.printFacilitiesResultsonPage();
        })
        .fail(() => {
            // Do something to handle error. Display message on page to let user know no facilities were returned
        });
    })
    .fail(() => {
        // Do something to handle error.
    });
});


//Event listener to be used to get the location from a static button
//function to get coordinates from user when they press a button for a corresponding city
$('#city').on('click', function() {
    sportsApp.staticCoordinatesLong = $(this).data('long');
    sportsApp.staticCoordinatesLat = $(this).data('lat');
})

//GEOLOCATION event listener
//create even listener on button to get location
$('button').on('click', function(){
    sportsApp.getLocation();
})




//*****FUNCTIONS *********/
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

        console.log(sportsApp.facilityName, sportsApp.facilityAddress, sportsApp.facilityContact);
    
        //print each on page! 
        //!!!!!! ERROR HANDLING if address and contact fields are null - get only ones with address? 
        $('.main__ul-sports-location').append(
            `<h2>${sportsApp.facilityName}</h2>
            <address>${sportsApp.facilityAddress.address}${sportsApp.facilityAddress.city}</address>
            <address>${sportsApp.facilityContact.phone}</address>`);
    }
}

//********initialize!****** 
sportsApp.init = () => {
    console.log('ready!');
}
























// ******* DOCUMENT READY ******* 
$(function() {
    sportsApp.init();
});