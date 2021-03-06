var geocoder;
var map;
var infowindow;
var details;
var autocomplete;

$(function() {
    $('#search-form').on('submit', function(e) {
        e.preventDefault();
        var data = $("#search-form :input").serializeArray();
        var input = data[0].value;
        codeAddress(input);
    });
});

function initMap(mapCenter) {
    geocoder = new google.maps.Geocoder();

    if (mapCenter === undefined) {
        mapCenter = new google.maps.LatLng(42.969,-81.268);
    }

    infowindow = new google.maps.InfoWindow();

    autocomplete = new google.maps.places.Autocomplete(
        (document.getElementById('autocomplete')),
        {types: ['geocode']}); 

    map = new google.maps.Map(document.getElementById('map'), {
        center: mapCenter,
        zoom: 15 
    });

    details = new google.maps.places.PlacesService(map);
}

function codeAddress(address) {
    $('#sidebar-list').empty();
    geocoder.geocode({'address': address}, function(results, status) {
        if (status == google.maps.GeocoderStatus.OK) {
            var inputLocation = results[0].geometry.location;
            initMap(inputLocation);
            searchForPizza(inputLocation);
        } else {
            alert("Geocode was not successful for the following reason: " + status);
        }
    });
}

function searchForPizza(searchLocation) {
    var request = {
        location: searchLocation,
        radius: '500',
        query: 'pizza',
    };

    service = new google.maps.places.PlacesService(map);
    service.textSearch(request, mapCallback); 
}


function mapCallback(results, status) {
    if (status === google.maps.places.PlacesServiceStatus.OK) {
        for (var i = 0; i < results.length; i++) {
            createMarker(results[i].place_id);
        }
    }
}


function createMarker(placeId) {
    details.getDetails({'placeId': placeId}, detailsCallback);
}

function detailsCallback(place, status) {
    if (place !== null) {
        var placeLoc = place.geometry.location;
        var marker = new google.maps.Marker({
            map: map,
            position: place.geometry.location
        });

        var ratingClass;
        var ratingMsg;
        if (place.rating === undefined) {
            ratingClass = 'none';
            ratingMsg = 'No Rating Available';
        } else {
            if (place.rating < 2.8) {
                ratingClass = 'low-rtg';
            } else if (place.rating < 3.8) {
                ratingClass = 'med-rtg';
            } else {
                ratingClass = 'high-rtg';
            }
            ratingMsg = convertDecimalToStarString(place.rating, ratingClass);
        }

        var openMessage;
        var openClass;
        if (place.opening_hours !== undefined) {
            openClass = place.opening_hours.open_now ? 'open-msg open-closed' : 'closed-msg open-closed';
            openMessage = place.opening_hours.open_now ? 'OPEN' : 'CLOSED';
        } else {
            openMessage = 'Hours Not Available';
        }

        var linkTag = (place.website !== undefined) ? '<a href="' + place.website + '">' : '';
        var linkTagEnd = place.website !== undefined ? '</a>' : '';

        var phoneNum = place.international_phone_number !== undefined ? 
            place.international_phone_number : 'No Phone Number';

        var content = '<div><strong>' + linkTag + place.name + linkTagEnd + '</strong></div>' +
            '<div>' + phoneNum + '</div>' +
            '<div>' + place.formatted_address + '</div>' +
            '<div class="' + ratingClass + '">' + ratingMsg  + '</span></div>' +
            '<div class="' + openClass + '">' + openMessage + '</div>';

        google.maps.event.addListener(marker, 'click', function() {
            infowindow.setContent(content);
            infowindow.open(map, this);
        });

        var info = {
            marker: marker,
            content: content
        };

        createSidebarMarker(info);
    }
}

function createSidebarMarker(info) {
    var ul = document.getElementById("sidebar-list");
    var li = document.createElement("li");
    li.innerHTML = info.content;
    ul.appendChild(li);

    google.maps.event.addDomListener(li, "click", function(){
        google.maps.event.trigger(info.marker, "click");
    });
}

function convertDecimalToStarString(rating, colorClass) {
    var str = '';
    var ratingStr = rating.toString();
    var substr = ratingStr.split('.');
    var decimal = substr[1];

    for(i = 0; i < substr[0]; i++) {
        str += '<i class="fa fa-star ' + colorClass + '"></i>';
    }

    if (decimal) {
        if(decimal <= 3) {
            str += '';
        } else if (decimal >= 4 && decimal < 8) {
            str += '<i class="fa fa-star-half-o ' + colorClass + '"></i>';
        } else {
            str += '<i class="fa fa-star ' + colorClass + '"></i>';
        }
    }

    var count = (str.match(/<\/i>/g)).length;
    for(j = count; j < 5; j++) {
        str += '<i class="fa fa-star-o ' + colorClass + '"></i>';
    }

    return str;
}
