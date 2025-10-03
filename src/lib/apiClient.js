// Base URL for API - Direct connection to backend API server
const API_BASE_URL = 'http://10.21.1.14:7373'; // Backend API server URL



// Streaming API function that yields tokens one by one
export const postQueryStreaming = async function* (query) {
  try {
    // Format the request according to the working backend API specification
    const apiRequestBody = {
      "messages": [
        {
          "role": "user",
          "content": `${query}`
        }
      ],
      "stream": true
    };
    
    console.log('Making streaming API request to:', `${API_BASE_URL}/v1/chat/completions`);
    console.log('Streaming request body:', JSON.stringify(apiRequestBody, null, 2));
    
    const response = await fetch(`${API_BASE_URL}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(apiRequestBody)
    });
    
    console.log('Streaming response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    console.log('Response body type:', typeof response.body);
    console.log('Response body exists:', !!response.body);

    if (!response.ok) {
      const errorText = await response.text();
      console.log('Streaming API error response:', errorText);
      throw new Error(`API request failed with status ${response.status}: ${errorText}`);
    }

    // Handle streaming response (SSE format from backend)
    // React Native doesn't support response.body.getReader() properly
    // So we get the full text response and parse it manually
    const textResponse = await response.text();
    console.log('Parsing streaming response manually...');
    
    // Parse SSE format manually
    const lines = textResponse.split('\n');
    const requestId = Math.random().toString(36).substr(2, 9);
    
    for (const line of lines) {
      if (line.trim() && line.startsWith('data: ')) {
        const data = line.substring(6).trim();
        
        if (data === '[DONE]') {
          return;
        }
        
        try {
          const parsed = JSON.parse(data);
          const token = parsed.choices?.[0]?.delta?.content || '';
          
          if (token) {
            yield {
              token: token,
              requestId: requestId,
              timestamp: Date.now()
            };
          }
        } catch (parseError) {
          console.error('Error parsing streaming data line:', line, parseError);
        }
      }
    }
    
    return;

  } catch (error) {
    console.error('Streaming API Error:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    throw error;
  }
};

// Fallback non-streaming function (for backward compatibility or non-streaming scenarios)
export const postQuery = async (query) => {
  try {
    // Format the request according to the working backend API specification
    const apiRequestBody = {
      "messages": [
        {
          "role": "user",
          "content": `${query}`
        }
      ],
      "stream": false
    };
    
    console.log('Making non-streaming API request to:', `${API_BASE_URL}/v1/chat/completions`);
    console.log('Non-streaming request body:', JSON.stringify(apiRequestBody, null, 2));
    
    const response = await fetch(`${API_BASE_URL}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(apiRequestBody)
    });
    
    console.log('Non-streaming response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.log('Non-streaming API error response:', errorText);
      throw new Error(`API request failed with status ${response.status}: ${errorText}`);
    }

    const result = await response.json();
    return {
      message: result.choices?.[0]?.message?.content || 'No response received',
      response: result.choices?.[0]?.message?.content || 'No response received'
    };
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

// Helper function to collect all streaming tokens into a single response
export const postQueryComplete = async (query) => {
  let fullResponse = '';
  let requestId = '';
  
  try {
    for await (const chunk of postQueryStreaming(query)) {
      fullResponse += chunk.token;
      requestId = chunk.requestId;
    }
    
    return {
      response: fullResponse,
      message: fullResponse,
      requestId: requestId,
      isStreaming: true
    };
  } catch (error) {
    console.error('Complete API Error:', error);
    throw error;
  }
};