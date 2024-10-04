document.getElementById("button2")?.addEventListener("click", () => {
    window.location.href = "andra.html";
});

document.getElementById("backa")?.addEventListener("click", () => {
    window.location.href = "första.html";
});

const button = document.getElementById("button1");
const cityInput = document.getElementById("Cityinput");
const weatherContainer = document.getElementById("weather");
const weatherInfoContainer = document.getElementById("Weatherinfo");
const lista = document.getElementById('Lista');
const favoriteBtn = document.getElementById("favoriteBtn");
let favoriter = JSON.parse(localStorage.getItem('favoriter')) || [];



function addFavorite(event) {
    event.preventDefault();

    const city = cityInput.value.trim();

    if (city && !favoriter.includes(city)) {
        favoriter.push(city);
        localStorage.setItem('favoriter', JSON.stringify(favoriter));
        renderFavorites();
    }
    cityInput.value = '';
}

function renderFavorites() {
    lista.innerHTML = '';
    favoriter.forEach((city, index) => {
        const li = document.createElement('li');
        li.textContent = city;
        li.classList.add('favorite-city');

        li.addEventListener('click', () => {
            cityInput.value = city;
            button.click();
        });

        const removeBtn = document.createElement('button');
        removeBtn.textContent = 'Ta bort';
        removeBtn.setAttribute('data-index', index);
        removeBtn.addEventListener('click', removeFavorite);

        li.appendChild(removeBtn);
        lista.appendChild(li);
    });
}


function removeFavorite(event) {
    const index = event.target.getAttribute('data-index');
    favoriter.splice(index, 1);
    localStorage.setItem('favoriter', JSON.stringify(favoriter));
    renderFavorites();
}

weatherInfoContainer.addEventListener('submit', addFavorite);
window.addEventListener('load', () => {
    renderFavorites();
});

favoriteBtn.addEventListener("click", (event) => {
    event.preventDefault();

    const city = cityInput.value.trim();
    addFavorite(event);
});

//getCityCoordinates("Stockholm");

button.addEventListener("click", async event => {
    event.preventDefault();

    const city = cityInput.value.trim();
    if (city !== "") {
        localStorage.setItem("city", city);
        try {
            await getCityCoordinates(city);
        } catch (error) {
            console.error(error);
            displayError("Kunde inte hämta data, vänligen ange rätt uppgifter");
        }
    } else {
        displayError("Var vänlig och ange rätt stad");
    }
});

function fetchWithTimeout(url, timeout = 1000) {
    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error('Timeout efter 5 sekunder')), timeout);

        fetch(url).then(response => {
            clearTimeout(timer);
            resolve(response);
        }).catch(err => {
            clearTimeout(timer);
            reject(err);
        });
    });
}

async function getCityCoordinates(city) {
    const geocodingApiUrl = `https://nominatim.openstreetmap.org/search?q=${city}&format=json`;
    const response = await fetch(geocodingApiUrl);
    if (!response.ok) {
        throw new Error("Något gick fel, kunde inte hämta uppgifter");
    }
    const data = await response.json();
    if (data.length === 0) {
        displayError("Hittade ingen data för den angivna staden");
        return;
    }

    const latitude = data[0].lat;
    const longitude = data[0].lon;
    const weatherData = await getWeatherData(latitude, longitude);
    displayWeatherInfo(weatherData, city);
}

async function getWeatherData(latitude, longitude) {
    const apiUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,wind_direction_10m&hourly=temperature_2m,relative_humidity_2m&daily=temperature_2m_max,temperature_2m_min&past_days=5`;
    const response = await fetch(apiUrl);
    if (!response.ok) {
        throw new Error("Något gick fel, kunde inte hämta uppgifter");
    }
    return await response.json();
}

function displayWeatherInfo(data, city) {

    const hourlyTemps = data.hourly.temperature_2m.slice(-120);

    const minTemps = [];
    const maxTemps = [];

    for (let i = 0; i < 5; i++) {
        const dayData = hourlyTemps.slice(i * 24, (i + 1) * 24);
        minTemps.push(Math.min(...dayData));
        maxTemps.push(Math.max(...dayData));
    };

    const averageTemp = (minTemp, maxTemp) => {
        return ((minTemp + maxTemp) / 2).toFixed(1);
    };

    const mondayAvgTemp = averageTemp(minTemps[0], maxTemps[0]);
    const tuesdayAvgTemp = averageTemp(minTemps[1], maxTemps[1]);
    const wednesdayAvgTemp = averageTemp(minTemps[2], maxTemps[2]);
    const thursdayAvgTemp = averageTemp(minTemps[3], maxTemps[3]);
    const fridayAvgTemp = averageTemp(minTemps[4], maxTemps[4]);

    const temp = data.current.temperature_2m;
    const windSpeed = data.current.wind_speed_10m;
    const humidity = data.current.relative_humidity_2m;
    const weatherCode = data.current.weather_code;

    document.getElementById("Temperature").textContent = `Temperatur: ${temp.toFixed(1)}°C`;
    document.getElementById("Vind").textContent = `Vindhastighet: ${windSpeed} m/s`;
    document.getElementById("Datum").textContent = `Datum: ${new Date().toLocaleDateString()}`;
    document.getElementById("Fuktighet").textContent = `Fuktighet: ${humidity}%`;
    document.getElementById("Emoji").textContent = getWeatherDescr(weatherCode);
    document.getElementById("city").textContent = city;
    document.getElementById("weather").style.display = "block";

    document.getElementById("Måndag").textContent = `Mån: ${maxTemps[0]}°C ${minTemps[0]}°C`;
    document.getElementById("Tisdag").textContent = `Tis: ${maxTemps[1]}°C ${minTemps[1]}°C`;
    document.getElementById("Onsdag").textContent = `Ons: ${maxTemps[2]}°C ${minTemps[2]}°C`;
    document.getElementById("Torsdag").textContent = `Tors: ${maxTemps[3]}°C ${minTemps[3]}°C`;
    document.getElementById("Fredag").textContent = `Fre: ${maxTemps[4]}°C ${minTemps[4]}°C`;

}

window.addEventListener('load', () => {
    renderFavorites();

    if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(position => {
            const latitude = position.coords.latitude;
            const longitude = position.coords.longitude;

            getWeatherData(latitude, longitude)
                .then(data => {
                    displayWeatherInfo(data, "Din plats");
                })
                .catch(error => {
                    console.error(error);
                    displayError("Kunde inte hämta väderdata för din plats");
                });
        }, error => {
            console.error(error);
            displayError("Kunde inte hämta din position. Vänligen ange en stad manuellt.");
        });
    } else {
        displayError("Geolocation stöds inte av din webbläsare.");
    }
});

const weatherCodeMap = {
    0: "Clear sky ☀️",
    1: "Mainly clear 🌤️",
    2: "Partly cloudy ⛅",
    3: "Overcast ☁️",
    45: "Foggy 🌫️",
    48: "Depositing rime fog 🌫️",
    51: "Light drizzle 🌧️",
    61: "Light rain 🌦️",
    63: "Moderate rain 🌧️",
    71: "Light snow ❄️",
    95: "Thunderstorm ⛈️"
};

const getWeatherDescr = (code) => {
    return weatherCodeMap[code] || "Unknown weather";
}

function displayError(message) {
    const errorElement = document.createElement("p");
    errorElement.textContent = message;
    const weatherContainer = document.getElementById("weather");
    weatherContainer.textContent = "";
    weatherContainer.style.display = "flex";
    weatherContainer.appendChild(errorElement);
}

const detailsBtn = document.getElementById("detailsBtn");
const detailsWrapper = document.getElementById("detailsWrapper");

detailsBtn.addEventListener("click", function () {
    detailsWrapper.style.display === "block" ? detailsWrapper.style.display = "none" : detailsWrapper.style.display = "block";
});