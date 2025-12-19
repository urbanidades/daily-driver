/**
 * AI Service - OpenAI Integration for Description Improvement
 */

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

// Improvement mode prompts
const IMPROVEMENT_PROMPTS = {
  polish: `You are a professional editor. Improve this task description by fixing grammar, spelling, punctuation, and making it clearer and more professional. Keep the same meaning and length. Return ONLY the improved text, no explanations.`,
  
  concise: `You are an expert at concise writing. Make this task description shorter and punchier while keeping the essential information. Remove filler words and redundancy. Return ONLY the improved text, no explanations.`,
  
  detailed: `You are a project manager. Expand this task description with more specific details, context, and clarity. Add relevant considerations if appropriate. Return ONLY the improved text, no explanations.`,
  
  actionable: `You are a productivity expert. Convert this task description into clear, actionable steps or a checklist format. Make it easy to follow and complete. Return ONLY the improved text, no explanations.`
};

export const IMPROVEMENT_OPTIONS = [
  { key: 'polish', label: 'Polish', icon: 'edit', description: 'Fix grammar & clarity' },
  { key: 'concise', label: 'Concise', icon: 'compress', description: 'Make it shorter' },
  { key: 'detailed', label: 'Detailed', icon: 'expand', description: 'Add more context' },
  { key: 'actionable', label: 'Actionable', icon: 'checklist', description: 'Convert to steps' }
];

/**
 * Improve a description using OpenAI
 * @param {string} description - The original description text
 * @param {string} mode - One of: 'polish', 'concise', 'detailed', 'actionable'
 * @param {string} taskTitle - The task title for context
 * @returns {Promise<string>} - The improved description
 */
export async function improveDescription(description, mode, taskTitle = '') {
  if (!OPENAI_API_KEY || OPENAI_API_KEY === 'your_openai_api_key_here') {
    throw new Error('OpenAI API key not configured. Please add your key to .env file.');
  }

  if (!description || description.trim().length === 0) {
    throw new Error('Please add some text to the description first.');
  }

  const systemPrompt = IMPROVEMENT_PROMPTS[mode] || IMPROVEMENT_PROMPTS.polish;
  
  const userMessage = taskTitle 
    ? `Task: "${taskTitle}"\n\nDescription to improve:\n${description}`
    : description;

  try {
    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ],
        temperature: 0.7,
        max_tokens: 1000
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      if (response.status === 401) {
        throw new Error('Invalid API key. Please check your OpenAI API key in .env file.');
      } else if (response.status === 429) {
        throw new Error('Rate limit exceeded. Please try again in a moment.');
      } else if (response.status === 402) {
        throw new Error('Insufficient OpenAI credits. Please check your billing.');
      }
      throw new Error(errorData.error?.message || `API error: ${response.status}`);
    }

    const data = await response.json();
    const improvedText = data.choices?.[0]?.message?.content?.trim();
    
    if (!improvedText) {
      throw new Error('No response from AI. Please try again.');
    }

    return improvedText;
  } catch (error) {
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error('Network error. Please check your connection.');
    }
    throw error;
  }
}

// System prompt for AI prompting mode
const PROMPT_SYSTEM = `You are a helpful assistant for "Daily Driver", a daily task and project management app.
The user is writing task notes and may ask you questions or request content generation.

CRITICAL RULES:
- NEVER ask follow-up questions or request clarification
- NEVER say "let me know if you need more" or similar phrases
- NEVER end with questions like "would you like me to..." or "shall I..."
- Always provide complete, actionable responses
- Use clean markdown formatting when appropriate (headers, lists, bold)
- Keep responses focused and concise unless explicitly asked for detail
- If the request is unclear, make reasonable assumptions and proceed

Context: This is for personal/work task management. The user's current task title and content are provided for reference.`;

/**
 * Prompt the AI with a custom message
 * @param {string} prompt - The user's prompt/question
 * @param {string} taskTitle - The task title for context
 * @param {string} taskContent - The current task content for context
 * @returns {Promise<string>} - The AI response
 */
export async function promptAI(prompt, taskTitle = '', taskContent = '') {
  if (!OPENAI_API_KEY || OPENAI_API_KEY === 'your_openai_api_key_here') {
    throw new Error('OpenAI API key not configured. Please add your key to .env file.');
  }

  if (!prompt || prompt.trim().length === 0) {
    throw new Error('Please enter a prompt.');
  }

  let userMessage = prompt;
  if (taskTitle || taskContent) {
    userMessage = `Current Task: "${taskTitle || 'Untitled'}"\n\nExisting Content:\n${taskContent || '(empty)'}\n\n---\n\nUser Request:\n${prompt}`;
  }

  try {
    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: PROMPT_SYSTEM },
          { role: 'user', content: userMessage }
        ],
        temperature: 0.7,
        max_tokens: 2000
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      if (response.status === 401) {
        throw new Error('Invalid API key. Please check your OpenAI API key in .env file.');
      } else if (response.status === 429) {
        throw new Error('Rate limit exceeded. Please try again in a moment.');
      } else if (response.status === 402) {
        throw new Error('Insufficient OpenAI credits. Please check your billing.');
      }
      throw new Error(errorData.error?.message || `API error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content?.trim();
    
    if (!aiResponse) {
      throw new Error('No response from AI. Please try again.');
    }

    return aiResponse;
  } catch (error) {
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error('Network error. Please check your connection.');
    }
    throw error;
  }
}
