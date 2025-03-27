// Fix for the catch block in the fetch operation
try {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(apiPayload),
    signal: controller.signal
  });
  
  clearTimeout(timeoutId);
  console.timeEnd('api-call-duration');
  // Rest of the successful response handling...
} catch (fetchError) {
  clearTimeout(timeoutId);
  
  if (fetchAborted) {
    console.error('⏱️ API ERROR: Fetch aborted due to timeout');
    throw new Error('Request timed out. Please try again.');
  } else {
    console.error('🌐 API ERROR: Fetch operation failed', fetchError);
    throw fetchError; // Re-throw to be caught by the outer try-catch
  }
}

// Function to add message to chat (missing from the provided code)
function addMessageToChat(role, content) {
  console.log(`Adding ${role} message: ${content.substring(0, 50)}${content.length > 50 ? '...' : ''}`);
  
  if (!chatMessages) {
    console.error('Cannot add message - chatMessages element not found');
    return null;
  }
  
  const messageElement = document.createElement('div');
  messageElement.classList.add('message', role);
  messageElement.textContent = content;
  chatMessages.appendChild(messageElement);
  
  // Scroll to the new message
  chatMessages.scrollTop = chatMessages.scrollHeight;
  
  return messageElement;
}

// DOM element initialization (to be placed at the beginning of script.js)
// These lines should be added at the top of the script outside any function
document.addEventListener('DOMContentLoaded', () => {
  // Cache DOM elements
  window.chatMessages = document.getElementById('chat-messages');
  window.userInput = document.getElementById('user-input');
  window.citationsContainer = document.getElementById('citations-container');
  window.relatedQuestionsContainer = document.getElementById('related-questions-container');
  
  console.log('DOM elements initialized:', {
    chatMessages: !!window.chatMessages,
    userInput: !!window.userInput,
    citationsContainer: !!window.citationsContainer,
    relatedQuestionsContainer: !!window.relatedQuestionsContainer
  });
});
