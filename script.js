// Event listener on the button get value of that button
// Pass the value in the getSportsInfo ajax call
// That call returns the sports id for the chosen sport(aka this)
// Pass the id into the get locations call, get locations, print location onto page. 

const sportsApp = {};




// ******* EVENT LISTENERS ******* 

// Button Event Listener: This event listener is applied to all the HTML sports activity buttons.
$('button').on('click', function() {
    // Upon clicking the button, retrieve its inline html value and assign to sportsValue
    const sportsValue = $(this).val();

    // Purpose: Sport's name --> Sport's ID number
    // AJAX request to retrieve the sport object using the sport's name (ie button value), access its id property, and assign the value to sportsId.
    $.ajax({
        url: `https://sports.api.decathlon.com/sports/${sportsValue}`,
        method: 'GET',
        dataType: 'json',
    }).then( (sportsActivitySuccessfulResponse) => {
        const sportsId = sportsActivitySuccessfulResponse.data.id;

        // Purpose: Sport's ID number --> Array of sport facilities
        // AJAX request to retrieve the sports places object using the sport id, access its features property (array of sports facilities).
        $.ajax({
            url: 'https://sportplaces.api.decathlon.com/api/v1/places',
            method: 'GET',
            dataType: 'json',
            data: {
                sports: `${sportsId}`,
                origin: '-79.383302,43.653752', // T.O. Downtown
                radius: '20',
                limit: 200
            }
        })
        .then((sportsFacilitiesSuccessfulResponse) => {
            const sportsFacilities = sportsFacilitiesSuccessfulResponse.data.features;
                console.log(sportsFacilities.filter( facility => facility.properties.address_components.city === 'Toronto'));
        })
        .fail(() => {
            // Do something to handle error.
        });
    })
    .fail(() => {
        // Do something to handle error.
    });


});























// ******* DOCUMENT READY ******* 
$(function() {

});