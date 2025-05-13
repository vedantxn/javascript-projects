// OpenWeatherMap API configuration
const API_KEY = '38b9019a01e3b6aef9c6df27fdcc3085'; 
const BASE_URL = 'https://api.openweathermap.org/data/2.5';

document.addEventListener('DOMContentLoaded', () => {
    // Initialize the app
    initTimeBasedTheme();
    updateTimeAndDate();
    
    // Set interval to update time and theme every minute
    setInterval(() => {
        updateTimeAndDate();
        updateThemeBasedOnTime();
    }, 60000); // Update every minute
    
    // Set up search functionality
    setupSearchFunctionality();
    
    // Load default city weather (New York)
    getWeatherData('New York');
});

/**
 * Initialize the time-based theme
 */
function initTimeBasedTheme() {
    updateThemeBasedOnTime();
    
    // Add animation classes to weather icons
    animateWeatherIcons();
}

/**
 * Update the current time and date display
 */
function updateTimeAndDate() {
    const now = new Date();
    
    // Update time
    const timeElement = document.getElementById('current-time');
    timeElement.textContent = now.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
    });
    
    // Update date
    const dateElement = document.getElementById('current-date');
    dateElement.textContent = now.toLocaleDateString('en-US', { 
        weekday: 'long', 
        month: 'long', 
        day: 'numeric' 
    });
}

/**
 * Update the theme based on the current time
 */
function updateThemeBasedOnTime() {
    const hour = new Date().getHours();
    const body = document.body;
    
    // Remove all theme classes
    body.classList.remove('morning', 'afternoon', 'evening', 'night');
    
    // Add appropriate theme class based on time
    if (hour >= 5 && hour < 11) {
        // Morning: 5 AM – 11 AM
        body.classList.add('morning');
    } else if (hour >= 11 && hour < 17) {
        // Afternoon: 11 AM – 5 PM
        body.classList.add('afternoon');
    } else if (hour >= 17 && hour < 20) {
        // Evening: 5 PM – 8 PM
        body.classList.add('evening');
    } else {
        // Night: 8 PM – 5 AM
        body.classList.add('night');
    }
}

/**
 * Add animation to weather icons
 */
function animateWeatherIcons() {
    // This function is now handled by updateWeatherIcon
    // which sets the appropriate weather icon class based on API data
}

/**
 * Set up the search functionality
 */
function setupSearchFunctionality() {
    const searchInput = document.getElementById('city-search');
    const searchButton = document.getElementById('search-button');
    
    // Search button click event
    searchButton.addEventListener('click', () => {
        const city = searchInput.value.trim();
        if (city) {
            getWeatherData(city);
        }
    });
    
    // Enter key press event
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const city = searchInput.value.trim();
            if (city) {
                getWeatherData(city);
            }
        }
    });
}

/**
 * Fetch weather data from OpenWeatherMap API
 * @param {string} city - The city name to get weather for
 */
async function getWeatherData(city) {
    try {
        // Show loading state
        document.getElementById('location-name').textContent = 'Loading...';
        
        // Fetch current weather data
        const currentWeatherResponse = await fetch(
            `${BASE_URL}/weather?q=${city}&units=metric&appid=${API_KEY}`
        );
        
        if (!currentWeatherResponse.ok) {
            throw new Error('City not found');
        }
        
        const currentWeatherData = await currentWeatherResponse.json();
        
        // Fetch 5-day forecast data
        const forecastResponse = await fetch(
            `${BASE_URL}/forecast?q=${city}&units=metric&appid=${API_KEY}`
        );
        
        if (!forecastResponse.ok) {
            throw new Error('Forecast data not available');
        }
        
        const forecastData = await forecastResponse.json();
        
        // Update UI with fetched data
        updateCurrentWeather(currentWeatherData);
        updateForecast(forecastData);
        
    } catch (error) {
        console.error('Error fetching weather data:', error);
        document.getElementById('location-name').textContent = 'City not found';
        document.getElementById('weather-condition').textContent = 'Error: ' + error.message;
    }
}

/**
 * Update the current weather display
 * @param {Object} data - Current weather data from API
 */
function updateCurrentWeather(data) {
    // Update location name
    document.getElementById('location-name').textContent = `${data.name}, ${data.sys.country}`;
    
    // Update temperature
    const temperature = Math.round(data.main.temp);
    document.getElementById('temperature').textContent = `${temperature}°C`;
    
    // Update weather condition
    document.getElementById('weather-condition').textContent = data.weather[0].main;
    
    // Update weather details
    document.getElementById('humidity').textContent = `${data.main.humidity}%`;
    document.getElementById('wind-speed').textContent = `${Math.round(data.wind.speed * 3.6)} km/h`; // Convert m/s to km/h
    document.getElementById('feels-like').textContent = `${Math.round(data.main.feels_like)}°C`;
    
    // Update weather icon
    updateWeatherIcon(data.weather[0].id);
}

/**
 * Update the forecast section
 * @param {Object} data - Forecast data from API
 */
function updateForecast(data) {
    const forecastContainer = document.querySelector('.forecast-container');
    forecastContainer.innerHTML = ''; // Clear existing forecast items
    
    // Get one forecast per day (excluding today)
    const dailyForecasts = getDailyForecasts(data.list);
    
    // Create forecast items (limit to 4 days)
    dailyForecasts.slice(0, 4).forEach(forecast => {
        const date = new Date(forecast.dt * 1000);
        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
        const temp = Math.round(forecast.main.temp);
        const weatherId = forecast.weather[0].id;
        
        const forecastItem = document.createElement('div');
        forecastItem.className = 'forecast-item';
        forecastItem.innerHTML = `
            <span class="forecast-day">${dayName}</span>
            <div class="forecast-icon ${getWeatherIconClass(weatherId)}-small"></div>
            <span class="forecast-temp">${temp}°C</span>
        `;
        
        forecastContainer.appendChild(forecastItem);
    });
}

/**
 * Extract one forecast per day from the 3-hour forecast data
 * @param {Array} forecastList - List of forecasts from API
 * @returns {Array} - One forecast per day
 */
function getDailyForecasts(forecastList) {
    const dailyForecasts = [];
    const today = new Date().getDate();
    const processedDays = new Set();
    
    forecastList.forEach(forecast => {
        const forecastDate = new Date(forecast.dt * 1000);
        const forecastDay = forecastDate.getDate();
        
        // Skip today's forecasts
        if (forecastDay === today) {
            return;
        }
        
        // Only take one forecast per day (at noon)
        if (!processedDays.has(forecastDay) && forecastDate.getHours() >= 12 && forecastDate.getHours() <= 15) {
            processedDays.add(forecastDay);
            dailyForecasts.push(forecast);
        }
    });
    
    return dailyForecasts;
}

/**
 * Update the main weather icon based on weather condition ID
 * @param {number} weatherId - Weather condition ID from API
 */
function updateWeatherIcon(weatherId) {
    const weatherAnimation = document.getElementById('weather-animation');
    
    // Remove all existing weather classes
    weatherAnimation.className = '';
    
    // Add the appropriate weather class
    weatherAnimation.classList.add(getWeatherIconClass(weatherId));
}

/**
 * Get the CSS class for a weather icon based on weather condition ID
 * @param {number} weatherId - Weather condition ID from API
 * @returns {string} - CSS class name for the weather icon
 */
function getWeatherIconClass(weatherId) {
    // Weather condition codes: https://openweathermap.org/weather-conditions
    if (weatherId >= 200 && weatherId < 300) {
        return 'rainy'; // Thunderstorm
    } else if (weatherId >= 300 && weatherId < 600) {
        return 'rainy'; // Drizzle and Rain
    } else if (weatherId >= 600 && weatherId < 700) {
        return 'cloudy'; // Snow
    } else if (weatherId >= 700 && weatherId < 800) {
        return 'cloudy'; // Atmosphere (fog, mist, etc.)
    } else if (weatherId === 800) {
        return 'sunny'; // Clear sky
    } else if (weatherId > 800) {
        return 'partly-cloudy'; // Clouds
    }
    
    return 'sunny'; // Default
}