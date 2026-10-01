(() => {
  'use strict';

  const GEOCODE_URL = 'https://geocoding-api.open-meteo.com/v1/search';
  const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';
  const LAST_CITY_KEY = 'skycast-last-city';

  const form = document.getElementById('search-form');
  const cityInput = document.getElementById('city-input');
  const searchError = document.getElementById('search-error');
  const locateBtn = document.getElementById('locate-btn');
  const statusEl = document.getElementById('status');
  const resultEl = document.getElementById('result');
  const emptyStateEl = document.getElementById('empty-state');

  const placeNameEl = document.getElementById('place-name');
  const updatedAtEl = document.getElementById('updated-at');
  const currentIconEl = document.getElementById('current-icon');
  const currentTempEl = document.getElementById('current-temp');
  const currentDescEl = document.getElementById('current-desc');
  const feelsLikeEl = document.getElementById('feels-like');
  const humidityEl = document.getElementById('humidity');
  const windEl = document.getElementById('wind');
  const todayRangeEl = document.getElementById('today-range');
  const forecastList = document.getElementById('forecast');
  const forecastTemplate = document.getElementById('forecast-item-template');

  /* ------------------------------------------------------------
     Weather code -> description and icon
     WMO codes used by Open-Meteo: https://open-meteo.com/en/docs
     ------------------------------------------------------------ */
  const WEATHER_CODES = {
    0: ['Clear sky', '☀️'],
    1: ['Mainly clear', '🌤️'],
    2: ['Partly cloudy', '⛅'],
    3: ['Overcast', '☁️'],
    45: ['Fog', '🌫️'],
    48: ['Depositing rime fog', '🌫️'],
    51: ['Light drizzle', '🌦️'],
    53: ['Moderate drizzle', '🌦️'],
    55: ['Dense drizzle', '🌧️'],
    56: ['Freezing drizzle', '🌧️'],
    57: ['Dense freezing drizzle', '🌧️'],
    61: ['Slight rain', '🌦️'],
    63: ['Moderate rain', '🌧️'],
    65: ['Heavy rain', '🌧️'],
    66: ['Freezing rain', '🌧️'],
    67: ['Heavy freezing rain', '🌧️'],
    71: ['Slight snow', '🌨️'],
    73: ['Moderate snow', '🌨️'],
    75: ['Heavy snow', '❄️'],
    77: ['Snow grains', '❄️'],
    80: ['Slight rain showers', '🌦️'],
    81: ['Moderate rain showers', '🌧️'],
    82: ['Violent rain showers', '⛈️'],
    85: ['Slight snow showers', '🌨️'],
    86: ['Heavy snow showers', '❄️'],
    95: ['Thunderstorm', '⛈️'],
    96: ['Thunderstorm with hail', '⛈️'],
    99: ['Severe thunderstorm with hail', '⛈️']
  };
  const describeCode = (code) => WEATHER_CODES[code] || ['Unknown', '🌡️'];

  /* ------------------------------------------------------------
     UI helpers
     ------------------------------------------------------------ */
  const showStatus = (text, isError) => {
    statusEl.hidden = !text;
    statusEl.textContent = text;
    statusEl.classList.toggle('fail', Boolean(isError));
  };

  const setLoading = (isLoading) => {
    form.querySelector('button[type="submit"]').disabled = isLoading;
    locateBtn.disabled = isLoading;
    if (isLoading) {
      showStatus('Fetching weather...', false);
      resultEl.hidden = true;
      emptyStateEl.hidden = true;
    }
  };

  const dayLabel = (isoDate, index) => {
    if (index === 0) return 'Today';
    const date = new Date(isoDate + 'T00:00:00');
    return date.toLocaleDateString(undefined, { weekday: 'short' });
  };

  /* ------------------------------------------------------------
     Rendering
     ------------------------------------------------------------ */
  const renderWeather = (placeName, data) => {
    const current = data.current;
    const daily = data.daily;
    const [desc, icon] = describeCode(current.weather_code);

    placeNameEl.textContent = placeName;
    updatedAtEl.textContent = 'Updated ' + new Date(current.time).toLocaleString(undefined, {
      hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short'
    });
    currentIconEl.textContent = icon;
    currentTempEl.textContent = Math.round(current.temperature_2m) + '°C';
    currentDescEl.textContent = desc;
    feelsLikeEl.textContent = Math.round(current.apparent_temperature) + '°C';
    humidityEl.textContent = Math.round(current.relative_humidity_2m) + '%';
    windEl.textContent = Math.round(current.wind_speed_10m) + ' km/h';

    if (daily && daily.temperature_2m_max && daily.temperature_2m_max.length) {
      todayRangeEl.textContent = Math.round(daily.temperature_2m_max[0]) + '° / ' + Math.round(daily.temperature_2m_min[0]) + '°';
    }

    forecastList.innerHTML = '';
    if (daily && daily.time) {
      // Show the 5 days after today.
      const start = 1;
      const end = Math.min(start + 5, daily.time.length);
      for (let i = start; i < end; i++) {
        const [fDesc, fIcon] = describeCode(daily.weather_code[i]);
        const node = forecastTemplate.content.firstElementChild.cloneNode(true);
        node.querySelector('.f-day').textContent = dayLabel(daily.time[i], i);
        node.querySelector('.f-icon').textContent = fIcon;
        node.querySelector('.f-desc').textContent = fDesc;
        node.querySelector('.f-max').textContent = Math.round(daily.temperature_2m_max[i]) + '°';
        node.querySelector('.f-min').textContent = Math.round(daily.temperature_2m_min[i]) + '°';
        forecastList.appendChild(node);
      }
    }

    resultEl.hidden = false;
    emptyStateEl.hidden = true;
    showStatus('', false);
  };

  /* ------------------------------------------------------------
     API calls
     ------------------------------------------------------------ */
  const fetchForecast = async (latitude, longitude) => {
    const url = new URL(FORECAST_URL);
    url.searchParams.set('latitude', latitude);
    url.searchParams.set('longitude', longitude);
    url.searchParams.set('current', 'temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m');
    url.searchParams.set('daily', 'weather_code,temperature_2m_max,temperature_2m_min');
    url.searchParams.set('timezone', 'auto');
    url.searchParams.set('forecast_days', '7');

    const response = await fetch(url);
    if (!response.ok) throw new Error('Weather service returned an error.');
    return response.json();
  };

  const geocodeCity = async (name) => {
    const url = new URL(GEOCODE_URL);
    url.searchParams.set('name', name);
    url.searchParams.set('count', '1');
    url.searchParams.set('language', 'en');
    url.searchParams.set('format', 'json');

    const response = await fetch(url);
    if (!response.ok) throw new Error('City lookup failed.');
    const data = await response.json();
    if (!data.results || !data.results.length) return null;
    return data.results[0];
  };

  const loadForCity = async (name) => {
    setLoading(true);
    try {
      const place = await geocodeCity(name);
      if (!place) {
        showStatus('', false);
        searchError.textContent = 'No city found with that name. Check the spelling and try again.';
        return;
      }
      searchError.textContent = '';
      const data = await fetchForecast(place.latitude, place.longitude);
      const label = [place.name, place.admin1, place.country].filter(Boolean).join(', ');
      renderWeather(label, data);
      try { localStorage.setItem(LAST_CITY_KEY, place.name); } catch (e) { /* storage unavailable */ }
    } catch (err) {
      showStatus('Could not load weather right now. Check your connection and try again.', true);
    } finally {
      setLoading(false);
    }
  };

  const loadForCoords = async (latitude, longitude, label) => {
    setLoading(true);
    try {
      const data = await fetchForecast(latitude, longitude);
      renderWeather(label, data);
    } catch (err) {
      showStatus('Could not load weather right now. Check your connection and try again.', true);
    } finally {
      setLoading(false);
    }
  };

  /* ------------------------------------------------------------
     Events
     ------------------------------------------------------------ */
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const name = cityInput.value.trim();
    if (!name) {
      searchError.textContent = 'Type a city name to search.';
      return;
    }
    searchError.textContent = '';
    loadForCity(name);
  });

  cityInput.addEventListener('input', () => { if (searchError.textContent) searchError.textContent = ''; });

  locateBtn.addEventListener('click', () => {
    if (!('geolocation' in navigator)) {
      searchError.textContent = 'Your browser does not support location access.';
      return;
    }
    searchError.textContent = '';
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        loadForCoords(latitude, longitude, 'Your location');
      },
      () => {
        setLoading(false);
        searchError.textContent = 'Location access was denied. Search for a city instead.';
      },
      { timeout: 10000 }
    );
  });

  /* ------------------------------------------------------------
     Init: reload the last searched city, if any
     ------------------------------------------------------------ */
  let lastCity = null;
  try { lastCity = localStorage.getItem(LAST_CITY_KEY); } catch (e) { /* storage unavailable */ }
  if (lastCity) {
    cityInput.value = lastCity;
    loadForCity(lastCity);
  }

  const year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();
})();
