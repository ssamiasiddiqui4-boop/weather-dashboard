# SkyCast — Weather Dashboard

Auspify Technologies Frontend Developer Internship, Task 4.

A weather dashboard built with plain HTML5, CSS3 and JavaScript. It fetches real-time weather from the free [Open-Meteo](https://open-meteo.com/) API — no API key or sign-up required, so it works as-is on GitHub Pages.

## Features

- Search any city by name
- "My location" button using the browser's Geolocation API
- Current conditions: temperature, feels-like, humidity, wind speed, and a weather icon/description
- 5-day forecast with daily high/low and conditions
- Loading state while data is fetched, and clear error messages (city not found, network failure, location denied)
- The last searched city is remembered with Local Storage and reloaded automatically next time
- Same premium dark glass theme as the rest of the portfolio

## Project structure

```
Task4_Weather_Dashboard/
├── index.html
├── css/style.css
├── js/script.js
└── README.md
```

## How it works

1. **Geocoding:** the city name is sent to Open-Meteo's geocoding API, which returns matching places with latitude/longitude.
2. **Forecast:** those coordinates are sent to Open-Meteo's forecast API, which returns current conditions and a daily forecast.
3. Both calls use the Fetch API with `async`/`await`, and JSON responses are parsed and mapped onto the page.
4. Weather codes (a numeric code like `61` for "slight rain") are mapped to a plain-language description and an icon in `WEATHER_CODES` in `js/script.js`.

## Run locally

Open `index.html` in a browser, or use the Live Server extension in VS Code. An internet connection is needed for the weather data.

## Deploy

Push the folder to GitHub, then enable GitHub Pages (Settings, Pages, branch `main`, folder `/root`).
