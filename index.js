document.addEventListener('DOMContentLoaded', function() {

    // add event listener to form submission
    document.querySelector('#weather-search').addEventListener('submit', (event) => {
        event.preventDefault();
        //fetch_weather();
    })

    document.querySelector('#hourly').addEventListener('click', () => change_button(hourly));
    document.querySelector('#daily').addEventListener('click', () => change_button(daily));

    document.querySelector('#fahrenheit').addEventListener('click', () => change_units(fahrenheit));
    document.querySelector('#celsius').addEventListener('click', () => change_units(celsius));
    initMap();
});

function fetch_weather() {
    // by default, load hourly view
    document.getElementById('hourly').click();
    // check which units are currently being used and load appropriate units
    const tempUnit = document.getElementById('current_unit').dataset.unit;
    if (tempUnit === "fahrenheit"){ 
        document.getElementById('fahrenheit').click();
    } else {
        document.getElementById('celsius').click();
    }
    const lat = document.getElementById("lat").value;
    const lng = document.getElementById("lng").value;

    // openweather apikey
    const apiKey = '7db2b9448ce04bc598ceb4ba135d81cd'
    
    // one call api
    fetch(`https://api.openweathermap.org/data/2.5/onecall?lat=${lat}&lon=${lng}&appid=${apiKey}`)
    .then(response => response.json())
    .then(data => {
        // store json in hidden input to access via toggle buttons later
        const hourlyJSON = encodeURIComponent(JSON.stringify(data.hourly));
        const dailyJSON = encodeURIComponent(JSON.stringify(data.daily));
        document.getElementById("hourly-json").value = hourlyJSON;
        document.getElementById("daily-json").value = dailyJSON;
        current_view(data.current);
        forecast_view("hourly");

    });
}

// initialize google map and autocomplete feature
function initMap () {
    const googlekey = 'AIzaSyAGpoTzBEC4DlcwUMEqSmDde3D75u7dNSo'
    // initialize map and load Madison, WI by default
    const map = new google.maps.Map(document.getElementById('map'), {
        center: {lat: 43.0731, lng: -89.4012},
        zoom: 10
      });
    
    // initialize autocomplete form
    const input = document.getElementById("pac-input");
    const options = {
        types: ["(cities)"],
        componentRestrictions: { country: "us" },
        fields: ["name", "geometry"],

    };
    const autocomplete = new google.maps.places.Autocomplete(input, options);
    autocomplete.bindTo("bounds", map);
    const marker = new google.maps.Marker({
        map,
        anchorPoint: new google.maps.Point(0, -29),
    });

    autocomplete.addListener("place_changed", () => {
        document.getElementById('map').style.display = "block";
        marker.setVisible(false);
        const place = autocomplete.getPlace();

        // User entered invalid city
        if (!place.geometry || !place.geometry.location) {o
            window.alert("Please select a valid city");
            return;
        }

        // If place has geometry, present it on the map
        if (place.geometry.viewport) {
            map.fitBounds(place.geometry.viewport);
        } else {
            map.setCenter(place.geometry.location);
            map.setZoom(10);
        }
        marker.setPosition(place.geometry.location);
        marker.setVisible(true);

        //
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        document.getElementById("lat").value = `${lat}`;
        document.getElementById("lng").value = `${lng}`;
        fetch_weather();
        const geocoder = new google.maps.Geocoder();
        geocodeLatLng(geocoder, lat, lng);
    })
}

function geocodeLatLng(geocoder, latitude, longitude) {
    const latlng = {
        lat: latitude,
        lng: longitude,
    };
    geocoder
        .geocode({ location: latlng })
        .then((response) => {
            const results = response.results;
            for (i = 0; i < results.length; i++) {
                if (results[i].types[0] == "locality") {
                    document.getElementById("city").innerText = results[i].formatted_address;
                }
            }
        })
}

function change_button(forecast) {
    var buttons = document.querySelectorAll('.button');
    buttons.forEach(button => {
        button.className = "button";
    });
    forecast.className = "button button-clicked";
    var id = forecast.id;
    forecast_view(id);
}

function change_units(unit) {
//class temp_unit
    const unitSelectors = document.querySelectorAll('.unit_selector')
    unitSelectors.forEach(unitSelector => {
        unitSelector.style.fontWeight = "normal";
    });
    unit.style.fontWeight = "bold";
    const currentUnit = document.getElementById("current_unit")
    if (currentUnit.dataset.unit !== unit.id) {
        currentUnit.dataset.unit = unit.id;
        tempUnits = document.querySelectorAll(".temp_unit");
        if (unit.id == "fahrenheit") {
            tempUnits.forEach(tempUnit => {
                let temperature = tempUnit.innerHTML;
                temperature = temperature * 9 / 5 + 32;
                tempUnit.innerHTML = temperature.toFixed(0);
            })
        } else {
            tempUnits.forEach(tempUnit => {
                let temperature = tempUnit.innerHTML;
                temperature = (temperature - 32) * 5 / 9;
                tempUnit.innerHTML = temperature.toFixed(0);
            })
        }   
    }
}

// function current_view() {
function current_view(data) {
    // make current-view visible
    document.querySelector(".current-view").style.display = "block";

    // convert temp to appropriate unit (stored in #current_unit.dataset)
    const tempUnit = document.getElementById('current_unit').dataset.unit;
    let temperature;
    if (tempUnit === "fahrenheit") {
        const f = (data.temp - 273.15) * 9/5 + 32;
        temperature = f.toFixed(0);
    } else {
        const c = data.temp - 273.15;
        temperature = c.toFixed(0);
    }
    // convert unix to weekday
    const milliseconds = new Date(data.dt * 1000);
    const date = new Date(milliseconds);
    const weekday = date.toLocaleString("en-US", {weekday: "long"});
    const icon = data.weather[0].icon;

    // parse data for relevant info
    const fields = {
        current_temp: temperature,
        humidity: data.humidity,
        wind: data.wind_speed.toFixed(0),
        current_conditions: data.weather[0].description,
        current_day: weekday,
    };

    // update icon
    document.getElementById("current_icon").src=`https://openweathermap.org/img/wn/${icon}@4x.png`
    // update rest of fields in current-view
    for (const field in fields) {
        document.getElementById(`${field}`).innerText = `${fields[field]}`
    }

}

function forecast_view(scale) {
    // make forecast-view visible
    document.querySelector("#forecast-view").style.display = "block";
    const encodedJSON = document.getElementById(`${scale}-json`).value;
    const data = JSON.parse(decodeURIComponent(encodedJSON));

    // get probability of precipitation and update current_view accordingly
    const encodedHourlyJSON = document.getElementById('hourly-json').value;
    const hourlyData = JSON.parse(decodeURIComponent(encodedHourlyJSON));
    const pop = hourlyData[0].pop;
    document.getElementById('precip').innerHTML = (pop * 100).toFixed(0);

    // Header, Icon, Max/MIN temp
     if (scale == "hourly") {
        var step = 3;
        var limit = 21;
    } else {
        step = 1;
        limit = 7;
    }
    // parse relevant info from data
    const header = [];
    const icon = [];
    const max = [];
    const min = [];
    for (let i=0; i <= limit; i += step ) {
        header.push(data[i].dt);
        icon.push(data[i].weather[0].icon);
        if (scale == "hourly") {
            max.push(data[i].temp);
        } else {
            max.push(data[i].temp.max);
            min.push(data[i].temp.min);
        }
    }
    /* iterate through header and reformat unix to relevant timestamp
    take note of header being passed as second parameter to forEach,
    this is necessary to bind 'this' to the array*/
    header.forEach(function(heading, index) {
        var date = new Date(heading * 1000);
        if (scale == "hourly") {
            this[index] = date.toLocaleString("en-US", {hour: "numeric"});
        } else {
            this[index] = date.toLocaleString("en-us", {weekday: "short"});
        }
    }, header);

    const array = [];
    array.push(max);
    if (scale == "daily") {
        array.push(min);
    }
    // query for element that is keeping state of which temperature unit is currently used
    const tempUnits = document.getElementById('current_unit').dataset.unit;
    array.forEach(item => {
        item.forEach(function(temp, index) {
            // if fahrenheit, convert kelvin to f
            if (tempUnits == "fahrenheit") {
                const f = (temp - 273.15) * 9/5 + 32;
                this[index] = f.toFixed(0);  
            } else {
            // convert kelvin to celsius
                const f = temp - 273;
                this[index] = f.toFixed(0);  
            }
              
        }, item);
    })
    populate_forecast(header, icon, max, min);
}

function populate_forecast(header, icon, max, min) {
    // clear out existing cards
    document.querySelector('.weather_view').innerHTML = ""
    for (var i = 0; i < 8; i++) {
        var item = document.createElement('div');
        item.className = "item";
        if (min.length) {
            item.innerHTML = `<h3>${header[i]}</h3>
                            <img src="http://openweathermap.org/img/wn/${icon[i]}@2x.png">
                            <div>
                                <span><strong><span class="temp_unit">${max[i]}</span></strong>&deg;</span>
                                <span><span class="temp_unit">${min[i]}</span>&deg;</span>
                            </div>`;
        } else {
            item.innerHTML = `<h3>${header[i]}</h3>
            <img src="http://openweathermap.org/img/wn/${icon[i]}@2x.png">
            <div>
                <span><strong><span class="temp_unit">${max[i]}</span></strong>&deg;</span>
            </div>`;
        }
        document.querySelector('.weather_view').append(item);
    }
}