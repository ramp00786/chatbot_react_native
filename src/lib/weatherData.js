// Static weather data for the app
export const staticWeatherData = {
  today: {
    date: "October 3, 2025",
    temperature: "32°C",
    minTemp: "26°C",
    maxTemp: "32°C",
    icon: "sunny",
    condition: "Sunny",
    humidity: "45%",
    windSpeed: "12 km/h",
    rainChance: "20%"
  },
  
  hourly: [
    { time: "Now", temp: "32°", icon: "sunny", condition: "Sunny" },
    { time: "3PM", temp: "30°", icon: "partly-cloudy", condition: "Partly Cloudy" },
    { time: "6PM", temp: "28°", icon: "rainy", condition: "Light Rain" },
    { time: "9PM", temp: "27°", icon: "cloudy-night", condition: "Cloudy" },
    { time: "12AM", temp: "26°", icon: "clear-night", condition: "Clear" },
    { time: "3AM", temp: "25°", icon: "clear-night", condition: "Clear" }
  ],
  
  weekly: [
    { day: "Today", icon: "sunny", high: "32°", low: "26°", condition: "Sunny" },
    { day: "Tue", icon: "partly-cloudy", high: "31°", low: "27°", condition: "Partly Cloudy" },
    { day: "Wed", icon: "rainy", high: "29°", low: "26°", condition: "Rainy" },
    { day: "Thu", icon: "cloudy", high: "28°", low: "25°", condition: "Cloudy" },
    { day: "Fri", icon: "sunny", high: "30°", low: "26°", condition: "Sunny" },
    { day: "Sat", icon: "partly-cloudy", high: "31°", low: "27°", condition: "Partly Cloudy" },
    { day: "Sun", icon: "sunny", high: "33°", low: "28°", condition: "Sunny" }
  ]
};

// Weather icon mapping for React Native
export const weatherIconMap = {
  "sunny": "sunny",
  "partly-cloudy": "partly-sunny",
  "cloudy": "cloudy",
  "rainy": "rainy",
  "cloudy-night": "cloudy-night",
  "clear-night": "moon"
};

// Get weather icon name for Ionicons
export const getWeatherIcon = (condition) => {
  return weatherIconMap[condition] || "sunny";
};