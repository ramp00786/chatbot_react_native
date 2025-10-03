# MausamGPT Weather API Specification

## Overview
This document outlines the API specification for the MausamGPT weather application. The API should provide comprehensive weather data for mobile weather cards based on geolocation coordinates.

## Base Information
- **API Version**: 1.0
- **Content-Type**: `application/json`
- **Authentication**: API Key (if required)
- **Rate Limiting**: 1000 requests per hour per API key

## Endpoint

### Get Weather Data
```
POST /api/weather
Content-Type: application/json
Authorization: Bearer YOUR_API_KEY (optional)
```

### Request Body
```json
{
  "lat": 19.0760,
  "lng": 72.8777
}
```

#### Request Parameters
| Parameter | Type | Required | Description | Example |
|-----------|------|----------|-------------|---------|
| `lat` | number | Yes | Latitude coordinate (-90 to 90) | 19.0760 |
| `lng` | number | Yes | Longitude coordinate (-180 to 180) | 72.8777 |

## Response Format

### Success Response (200 OK)
```json
{
  "success": true,
  "location": {
    "city": "Mumbai",
    "state": "Maharashtra", 
    "country": "India",
    "lat": 19.0760,
    "lng": 72.8777,
    "timezone": "Asia/Kolkata",
    "localTime": "2025-01-03T14:30:00+05:30"
  },
  "current": {
    "temperature": 28,
    "temperatureUnit": "°C",
    "condition": "Partly Cloudy",
    "conditionIcon": "partly-cloudy-day",
    "humidity": 75,
    "windSpeed": 12,
    "windUnit": "km/h",
    "windDirection": "SW",
    "pressure": 1013,
    "pressureUnit": "hPa",
    "visibility": 10,
    "visibilityUnit": "km",
    "uvIndex": 6,
    "uvDescription": "High",
    "feelsLike": 32,
    "dewPoint": 22,
    "airQuality": {
      "aqi": 95,
      "level": "Moderate",
      "pm25": 45,
      "pm10": 68,
      "co": 0.8,
      "no2": 25,
      "so2": 8,
      "o3": 75
    },
    "sunrise": "06:45",
    "sunset": "18:30",
    "lastUpdated": "2025-01-03T14:00:00+05:30"
  },
  "hourly": [
    {
      "time": "2025-01-03T15:00:00+05:30",
      "hour": "3 PM",
      "temperature": 29,
      "condition": "Sunny",
      "conditionIcon": "sunny",
      "humidity": 70,
      "windSpeed": 15,
      "windDirection": "SW",
      "precipitationChance": 10,
      "precipitationAmount": 0,
      "uvIndex": 7,
      "feelsLike": 33
    }
    // ... 24 hours total
  ],
  "daily": [
    {
      "date": "2025-01-03",
      "dayName": "Today",
      "dayShort": "Fri",
      "temperatureMax": 32,
      "temperatureMin": 22,
      "condition": "Partly Cloudy",
      "conditionIcon": "partly-cloudy-day",
      "humidity": 75,
      "windSpeed": 15,
      "windDirection": "SW", 
      "precipitationChance": 20,
      "precipitationAmount": 0,
      "uvIndex": 7,
      "uvDescription": "High",
      "sunrise": "06:45",
      "sunset": "18:30",
      "moonPhase": "Waxing Crescent",
      "moonPhaseIcon": "moon-waxing-crescent"
    }
    // ... 7 days total
  ],
  "alerts": [
    {
      "id": "alert_001",
      "type": "warning",
      "title": "Heat Wave Warning",
      "description": "High temperatures expected. Stay hydrated and avoid outdoor activities during peak hours.",
      "severity": "moderate",
      "startTime": "2025-01-03T10:00:00+05:30",
      "endTime": "2025-01-03T18:00:00+05:30",
      "areas": ["Mumbai", "Thane", "Navi Mumbai"]
    }
  ],
  "metadata": {
    "source": "MausamGPT Weather API",
    "version": "1.0",
    "lastUpdated": "2025-01-03T14:00:00+05:30",
    "units": "metric",
    "language": "en",
    "requestId": "req_123456789"
  }
}
```

## Data Usage by App Components

### 1. Today Weather Card
**Uses**: `current` object
- Temperature, condition, humidity
- Wind speed, pressure, UV index
- Sunrise/sunset times
- Air quality data

### 2. Next 24 Hours Card  
**Uses**: `hourly` array (first 6-8 items)
- Hour-by-hour temperature
- Weather conditions and icons
- Precipitation chances
- Wind information

### 3. 7-Day Forecast Card
**Uses**: `daily` array
- Daily high/low temperatures  
- Weather conditions for each day
- Precipitation chances
- Day names and dates

## Weather Condition Icons

The API should return standardized icon names that map to Ionicons:

| Condition | Icon Name | Ionicon |
|-----------|-----------|---------|
| Sunny/Clear Day | `sunny` | `sunny` |
| Clear Night | `clear-night` | `moon` |
| Partly Cloudy Day | `partly-cloudy-day` | `partly-sunny` |
| Partly Cloudy Night | `partly-cloudy-night` | `cloudy-night` |
| Cloudy/Overcast | `cloudy` | `cloudy` |
| Rainy | `rainy` | `rainy` |
| Heavy Rain | `heavy-rain` | `thunderstorm` |
| Thunderstorm | `thunderstorm` | `thunderstorm` |
| Snow | `snow` | `snow` |
| Fog/Mist | `fog` | `cloudy` |
| Windy | `windy` | `cloudy` |

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "error": {
    "code": "INVALID_COORDINATES",
    "message": "Invalid latitude or longitude provided",
    "details": "Latitude must be between -90 and 90, longitude between -180 and 180"
  },
  "requestId": "req_123456789"
}
```

### 404 Not Found
```json
{
  "success": false,
  "error": {
    "code": "LOCATION_NOT_FOUND", 
    "message": "Weather data not available for this location",
    "details": "No weather stations found near the specified coordinates"
  },
  "requestId": "req_123456789"
}
```

### 429 Too Many Requests
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "API rate limit exceeded",
    "details": "Maximum 1000 requests per hour allowed"
  },
  "requestId": "req_123456789"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "error": {
    "code": "INTERNAL_SERVER_ERROR",
    "message": "An internal server error occurred",
    "details": "Please try again later or contact support"
  },
  "requestId": "req_123456789"
}
```

## Implementation Guidelines

### 1. Data Sources
Recommended weather data providers:
- **OpenWeatherMap API** - Comprehensive weather data
- **WeatherAPI** - Real-time weather with historical data  
- **AccuWeather API** - Detailed forecasts and alerts
- **Dark Sky API** (deprecated but still referenced)

### 2. Caching Strategy
- Cache responses for 15-30 minutes to reduce API calls
- Use Redis or similar for fast data retrieval
- Implement cache invalidation for severe weather alerts

### 3. Performance Considerations
- Response time should be < 500ms
- Implement proper error handling for external API failures
- Use connection pooling for database operations
- Consider CDN for static weather icons

### 4. Security
- Validate input coordinates properly
- Implement rate limiting per API key
- Use HTTPS for all communications
- Sanitize all user inputs

### 5. Monitoring & Logging
- Log all API requests with timestamps
- Monitor response times and error rates
- Set up alerts for API failures
- Track usage patterns for optimization

## Development Environment Setup

### Required Environment Variables
```env
WEATHER_API_KEY=your_weather_provider_api_key
DATABASE_URL=your_database_connection_string
REDIS_URL=your_redis_connection_string
API_PORT=3000
NODE_ENV=development
```

### Dependencies (Node.js Example)
```json
{
  "dependencies": {
    "express": "^4.18.0",
    "axios": "^1.6.0", 
    "redis": "^4.6.0",
    "cors": "^2.8.5",
    "helmet": "^7.1.0",
    "express-rate-limit": "^7.1.0",
    "joi": "^17.11.0"
  }
}
```

## Testing

### Sample Test Cases
1. **Valid Coordinates**: Test with Mumbai coordinates (19.0760, 72.8777)
2. **Invalid Coordinates**: Test with out-of-range values
3. **Edge Cases**: Test with coordinates at poles and equator
4. **Rate Limiting**: Test API limits
5. **Error Handling**: Test with invalid API keys

### Example Test Request
```bash
curl -X POST https://your-api-domain.com/api/weather \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{
    "lat": 19.0760,
    "lng": 72.8777
  }'
```

## Deployment Checklist

- [ ] Environment variables configured
- [ ] Rate limiting implemented  
- [ ] HTTPS certificate installed
- [ ] Monitoring and logging setup
- [ ] Error handling tested
- [ ] API documentation published
- [ ] Load testing completed
- [ ] Backup and recovery plan ready

## Support & Maintenance

### API Versioning
- Use URL versioning: `/api/v1/weather`
- Maintain backward compatibility for at least 6 months
- Announce deprecation notices 3 months in advance

### Contact Information
- **Technical Support**: tech-support@mausamgpt.com
- **API Documentation**: https://api.mausamgpt.com/docs
- **Status Page**: https://status.mausamgpt.com

---

**Last Updated**: October 3, 2025  
**Version**: 1.0  
**Document Maintainer**: MausamGPT Development Team