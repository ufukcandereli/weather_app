const API_KEY = '71736d755b0378fa7819fdd4984fc76b';
const API_URL = 'https://api.openweathermap.org/data/2.5/weather';

// DOM Elements
const weatherForm = document.getElementById('weather-form');
const loadingElement = document.getElementById('loading');
const errorElement = document.getElementById('error');
const weatherInfoElement = document.getElementById('weather-info');

// Weather Info Elements
const cityNameElement = document.getElementById('city-name');
const dateElement = document.getElementById('date');
const temperatureElement = document.getElementById('temperature');
const weatherIconElement = document.getElementById('weather-icon');
const feelsLikeElement = document.getElementById('feels-like');
const windElement = document.getElementById('wind');
const humidityElement = document.getElementById('humidity');

let cities = [];
let districts = [];

const citySelect = document.getElementById('city-select');
const districtSelect = document.getElementById('district-select');

let cityChoices, districtChoices;

async function loadCitiesAndDistricts() {
    const citiesRes = await fetch('cities.json');
    cities = await citiesRes.json();
    const districtsRes = await fetch('districts.json');
    districts = await districtsRes.json();
    populateCityDropdown();
    if (cityChoices) cityChoices.destroy();
    if (districtChoices) districtChoices.destroy();
    cityChoices = new Choices(citySelect, {
        searchEnabled: true,
        itemSelectText: '',
        shouldSort: false
    });
    districtChoices = new Choices(districtSelect, {
        searchEnabled: true,
        itemSelectText: '',
        shouldSort: false
    });
}

function populateCityDropdown() {
    citySelect.innerHTML = '<option value="">İl seçiniz</option>';
    cities
        .slice()
        .sort((a, b) => a.name.localeCompare(b.name, 'tr'))
        .forEach(city => {
            const option = document.createElement('option');
            option.value = city.id;
            option.textContent = city.name;
            citySelect.appendChild(option);
        });
    districtSelect.innerHTML = '<option value="">İlçe seçiniz</option>';
    if (districtChoices) districtChoices.setChoices([], 'value', 'label', true);
}

function populateDistrictDropdown() {
    districtSelect.innerHTML = '<option value="">İlçe seçiniz</option>';
    const selectedCityId = citySelect.value;
    if (!selectedCityId) {
        if (districtChoices) districtChoices.setChoices([], 'value', 'label', true);
        return;
    }
    const districtOptions = districts
        .filter(d => d.il_id === selectedCityId)
        .slice()
        .sort((a, b) => a.name.localeCompare(b.name, 'tr'))
        .map(district => ({ value: district.name, label: district.name }));
    if (districtChoices) districtChoices.setChoices(districtOptions, 'value', 'label', true);
    else {
        districtOptions.forEach(opt => {
            const option = document.createElement('option');
            option.value = opt.value;
            option.textContent = opt.label;
            districtSelect.appendChild(option);
        });
    }
}

window.addEventListener('DOMContentLoaded', loadCitiesAndDistricts);
citySelect.addEventListener('change', populateDistrictDropdown);

// Event Listeners
weatherForm.addEventListener('submit', handleSubmit);

// Functions
async function handleSubmit(e) {
    e.preventDefault();
    const cityId = citySelect.value;
    const district = districtSelect.value;
    if (!cityId || !district) return;
    showLoading();
    hideError();
    hideWeatherInfo();
    try {
        const weatherData = await fetchWeatherData(district);
        updateWeatherUI(weatherData);
        updateBackground(weatherData.weather[0].main);
    } catch (error) {
        showError();
    } finally {
        hideLoading();
    }
}

async function fetchWeatherData(district) {
    const response = await fetch(`${API_URL}?q=${encodeURIComponent(district)},tr&appid=${API_KEY}&units=metric&lang=tr`);
    if (!response.ok) {
        throw new Error('City not found');
    }
    return await response.json();
}

function getWeatherSVG(main) {
    switch (main.toLowerCase()) {
        case 'clear':
            return `<svg viewBox="0 0 64 64" fill="none"><circle cx="32" cy="32" r="14" fill="#FFD93B"/><g stroke="#FFD93B" stroke-width="3"><line x1="32" y1="6" x2="32" y2="16"/><line x1="32" y1="48" x2="32" y2="58"/><line x1="6" y1="32" x2="16" y2="32"/><line x1="48" y1="32" x2="58" y2="32"/><line x1="14.93" y1="14.93" x2="21.21" y2="21.21"/><line x1="42.79" y1="42.79" x2="49.07" y2="49.07"/><line x1="14.93" y1="49.07" x2="21.21" y2="42.79"/><line x1="42.79" y1="21.21" x2="49.07" y2="14.93"/></g></svg>`;
        case 'clouds':
            return `<svg viewBox="0 0 64 64" fill="none"><ellipse cx="32" cy="40" rx="20" ry="12" fill="#B0BEC5"/><ellipse cx="44" cy="36" rx="12" ry="8" fill="#90A4AE"/></svg>`;
        case 'rain':
        case 'drizzle':
            return `<svg viewBox="0 0 64 64" fill="none"><ellipse cx="32" cy="36" rx="18" ry="10" fill="#90A4AE"/><ellipse cx="44" cy="32" rx="10" ry="6" fill="#B0BEC5"/><g stroke="#2196F3" stroke-width="3" stroke-linecap="round"><line x1="22" y1="48" x2="22" y2="56"/><line x1="32" y1="48" x2="32" y2="56"/><line x1="42" y1="48" x2="42" y2="56"/></g></svg>`;
        case 'snow':
            return `<svg viewBox="0 0 64 64" fill="none"><ellipse cx="32" cy="36" rx="18" ry="10" fill="#B0BEC5"/><ellipse cx="44" cy="32" rx="10" ry="6" fill="#90A4AE"/><g stroke="#90CAF9" stroke-width="3" stroke-linecap="round"><line x1="22" y1="48" x2="22" y2="56"/><line x1="32" y1="48" x2="32" y2="56"/><line x1="42" y1="48" x2="42" y2="56"/></g><g stroke="#90CAF9" stroke-width="2"><line x1="32" y1="52" x2="32" y2="56"/><line x1="30" y1="54" x2="34" y2="54"/></g></svg>`;
        case 'thunderstorm':
            return `<svg viewBox="0 0 64 64" fill="none"><ellipse cx="32" cy="36" rx="18" ry="10" fill="#90A4AE"/><ellipse cx="44" cy="32" rx="10" ry="6" fill="#B0BEC5"/><polygon points="28,48 36,48 32,56" fill="#FFD93B" stroke="#FFD93B" stroke-width="2"/></svg>`;
        case 'mist':
        case 'fog':
        case 'haze':
        case 'dust':
        case 'smoke':
        case 'sand':
        case 'ash':
        case 'squall':
        case 'tornado':
            return `<svg viewBox="0 0 64 64" fill="none"><ellipse cx="32" cy="40" rx="20" ry="12" fill="#B0BEC5"/><g stroke="#90A4AE" stroke-width="3" stroke-linecap="round"><line x1="16" y1="52" x2="48" y2="52"/><line x1="20" y1="58" x2="44" y2="58"/></g></svg>`;
        default:
            return `<svg viewBox="0 0 64 64" fill="none"><circle cx="32" cy="32" r="14" fill="#FFD93B"/></svg>`;
    }
}

function updateWeatherUI(data) {
    const { main, weather, wind, name } = data;
    
    // Update city name and date
    cityNameElement.textContent = name;
    dateElement.textContent = new Date().toLocaleDateString('tr-TR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    // Update temperature and weather icon
    temperatureElement.textContent = Math.round(main.temp);
    // OpenWeatherMap default icon
    const iconUrl = `https://openweathermap.org/img/wn/${weather[0].icon}@2x.png`;
    console.log('Weather icon URL:', iconUrl);
    // Set icon src and alt on the img element
    weatherIconElement.src = iconUrl;
    weatherIconElement.alt = weather[0].description;

    // Update weather details
    feelsLikeElement.textContent = `Hissedilen: ${Math.round(main.feels_like)}°C`;
    windElement.textContent = `Rüzgar: ${Math.round(wind.speed)} m/s`;
    humidityElement.textContent = `Nem: ${main.humidity}%`;

    showWeatherInfo();
}

function updateBackground(weatherCondition) {
    const body = document.body;
    let gradient;

    switch (weatherCondition.toLowerCase()) {
        case 'clear':
            gradient = 'linear-gradient(135deg, #00b4db, #0083b0)';
            break;
        case 'clouds':
            gradient = 'linear-gradient(135deg, #bdc3c7, #2c3e50)';
            break;
        case 'rain':
            gradient = 'linear-gradient(135deg, #373b44, #4286f4)';
            break;
        case 'snow':
            gradient = 'linear-gradient(135deg, #e6e9f0, #eef1f5)';
            break;
        case 'thunderstorm':
            gradient = 'linear-gradient(135deg, #2c3e50, #4ca1af)';
            break;
        default:
            gradient = 'linear-gradient(135deg, #00b4db, #0083b0)';
    }

    body.style.background = gradient;
}

// UI Helper Functions
function showLoading() {
    loadingElement.classList.remove('hidden');
}

function hideLoading() {
    loadingElement.classList.add('hidden');
}

function showError() {
    errorElement.classList.remove('hidden');
}

function hideError() {
    errorElement.classList.add('hidden');
}

function showWeatherInfo() {
    weatherInfoElement.classList.remove('hidden');
}

function hideWeatherInfo() {
    weatherInfoElement.classList.add('hidden');
}
