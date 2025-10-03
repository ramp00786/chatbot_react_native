import * as Location from 'expo-location';

// Location cache to avoid repeated API calls
let cachedCityName = null;
let locationFetched = false;
let locationPromise = null; // To handle concurrent calls

// Get city name from coordinates using reverse geocoding
const getCityFromCoordinates = async (latitude, longitude) => {
  try {
    const reverseGeocode = await Location.reverseGeocodeAsync({
      latitude,
      longitude
    });
    
    if (reverseGeocode && reverseGeocode.length > 0) {
      const location = reverseGeocode[0];
      return location.city || location.district || location.region || 'your area';
    }
  } catch (error) {
    console.error('Error getting city name:', error);
  }
  return 'your area';
};

// Get user's current city with caching
const getCurrentCity = async () => {
  // Return cached city if already fetched
  if (locationFetched && cachedCityName) {
    console.log('Using cached city:', cachedCityName);
    return cachedCityName;
  }

  // If location is currently being fetched, wait for it
  if (locationPromise) {
    console.log('Waiting for ongoing location fetch...');
    return await locationPromise;
  }

  // Start fetching location
  console.log('Fetching location for the first time...');
  locationPromise = fetchLocationOnce();
  
  try {
    const cityName = await locationPromise;
    cachedCityName = cityName;
    locationFetched = true;
    locationPromise = null;
    console.log('Location cached successfully:', cityName);
    return cityName;
  } catch (error) {
    locationPromise = null;
    console.error('Error getting current city:', error);
    const fallbackCity = 'your area';
    cachedCityName = fallbackCity;
    locationFetched = true;
    return fallbackCity;
  }
};

// Helper function to fetch location only once
const fetchLocationOnce = async () => {
  try {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      return 'your area';
    }

    let location = await Location.getCurrentPositionAsync({
      timeout: 10000, // 10 second timeout
      maximumAge: 300000, // Use cached location if less than 5 minutes old
    });
    
    const cityName = await getCityFromCoordinates(
      location.coords.latitude,
      location.coords.longitude
    );
    
    return cityName;
  } catch (error) {
    console.error('Error in fetchLocationOnce:', error);
    return 'your area';
  }
};

// Base suggested questions with city placeholder
const baseSuggestedQuestions = [
  {
    id: 1,
    text: "Kal {city} mein barish hogi kya?",
    icon: "rainy-outline",
    category: "weather"
  },
  {
    id: 2,
    text: "{city} mein hawa ki disha kya hai?",
    icon: "leaf-outline",
    category: "weather"
  },
  {
    id: 3,
    text: "Aaj {city} ka temperature kya hai?",
    icon: "thermometer-outline",
    category: "temperature"
  },
  {
    id: 4,
    text: "Is week {city} mein mausam kaisa rahega?",
    icon: "calendar-outline",
    category: "forecast"
  },
  {
    id: 5,
    text: "Aaj {city} mein UV index kitna hai?",
    icon: "sunny-outline",
    category: "weather"
  },
  {
    id: 6,
    text: "{city} mein humidity level check karo",
    icon: "water-outline",
    category: "weather"
  },
  {
    id: 7,
    text: "Aaj {city} mein sunset kitne baje hoga? aur ye bhi batao ki kal sunrise kitne baje hoga?",
    icon: "sunny-outline",
    category: "weather"
  },
  {
    id: 8,
    text: "{city} mein air quality kaisi hai?",
    icon: "leaf-outline",
    category: "weather"
  }
];

// Function to replace city placeholder with actual city name
const replaceCityPlaceholder = (questions, cityName) => {
  return questions.map(question => ({
    ...question,
    text: question.text.replace('{city}', cityName)
  }));
};

// Export for external access
export let suggestedQuestions = [...baseSuggestedQuestions];

// Function to get random questions with city name (location-aware)
export const getRandomQuestions = async (count = 2) => {
  try {
    const cityName = await getCurrentCity();
    const questionsWithCity = replaceCityPlaceholder(baseSuggestedQuestions, cityName);
    const shuffled = questionsWithCity.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  } catch (error) {
    console.error('Error getting random questions:', error);
    // Fallback to questions without city
    const questionsWithCity = replaceCityPlaceholder(baseSuggestedQuestions, 'your area');
    const shuffled = questionsWithCity.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }
};

// Function to get questions by category with city name
export const getQuestionsByCategory = async (category) => {
  try {
    const cityName = await getCurrentCity();
    const questionsWithCity = replaceCityPlaceholder(baseSuggestedQuestions, cityName);
    return questionsWithCity.filter(q => q.category === category);
  } catch (error) {
    console.error('Error getting questions by category:', error);
    const questionsWithCity = replaceCityPlaceholder(baseSuggestedQuestions, 'your area');
    return questionsWithCity.filter(q => q.category === category);
  }
};

// Function to add new question (use {city} placeholder for location-aware questions)
export const addNewQuestion = (text, icon = "help-outline", category = "general") => {
  const newId = Math.max(...baseSuggestedQuestions.map(q => q.id)) + 1;
  const newQuestion = {
    id: newId,
    text,
    icon,
    category
  };
  baseSuggestedQuestions.push(newQuestion);
  return newQuestion;
};

// Function to update existing question
export const updateQuestion = (id, updates) => {
  const index = baseSuggestedQuestions.findIndex(q => q.id === id);
  if (index !== -1) {
    baseSuggestedQuestions[index] = { ...baseSuggestedQuestions[index], ...updates };
    return baseSuggestedQuestions[index];
  }
  return null;
};

// Function to remove question
export const removeQuestion = (id) => {
  const index = baseSuggestedQuestions.findIndex(q => q.id === id);
  if (index !== -1) {
    return baseSuggestedQuestions.splice(index, 1)[0];
  }
  return null;
};

// Function to get all questions with current city (for debugging/management)
export const getAllQuestionsWithCity = async () => {
  try {
    const cityName = await getCurrentCity();
    return replaceCityPlaceholder(baseSuggestedQuestions, cityName);
  } catch (error) {
    console.error('Error getting all questions with city:', error);
    return replaceCityPlaceholder(baseSuggestedQuestions, 'your area');
  }
};

// Function to manually refresh location cache (if needed)
export const refreshLocationCache = async () => {
  console.log('Manually refreshing location cache...');
  cachedCityName = null;
  locationFetched = false;
  locationPromise = null;
  return await getCurrentCity();
};

// Function to get cached city without fetching (returns null if not cached)
export const getCachedCity = () => {
  return locationFetched ? cachedCityName : null;
};