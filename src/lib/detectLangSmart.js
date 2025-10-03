// Smart language detection function
export const detectLangSmart = async (text) => {
  try {
    // Simple language detection based on characters and common words
    const hindiRegex = /[\u0900-\u097F]/;
    const englishWords = ['the', 'and', 'is', 'in', 'to', 'of', 'a', 'that', 'it', 'with', 'for', 'as', 'was', 'on', 'are', 'you', 'your', 'weather', 'today', 'tomorrow'];
    const hindiWords = ['और', 'का', 'की', 'के', 'में', 'है', 'को', 'से', 'पर', 'यह', 'वह', 'मौसम', 'आज', 'कल'];
    const hinglishWords = ['kya', 'hai', 'mausam', 'aaj', 'kal', 'weather', 'me', 'aur', 'ka', 'ki', 'ke', 'se'];
    
    const lowerText = text.toLowerCase();
    
    // Check for Devanagari script
    if (hindiRegex.test(text)) {
      return 'hindi';
    }
    
    // Check for English words
    const englishWordCount = englishWords.filter(word => 
      lowerText.includes(word.toLowerCase())
    ).length;
    
    // Check for Hindi words in Roman script (Hinglish)
    const hinglishWordCount = hinglishWords.filter(word => 
      lowerText.includes(word.toLowerCase())
    ).length;
    
    // Check for actual Hindi words
    const hindiWordCount = hindiWords.filter(word => 
      text.includes(word)
    ).length;
    
    if (hindiWordCount > 0) {
      return 'hindi';
    } else if (hinglishWordCount > englishWordCount) {
      return 'translit-hindi';
    } else {
      return 'english';
    }
  } catch (error) {
    console.error('Language detection error:', error);
    return 'english'; // Default fallback
  }
};