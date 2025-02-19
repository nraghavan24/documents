import OpenAI from 'openai';

class AIService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: import.meta.env.VITE_OPENAI_API_KEY,
      dangerouslyAllowBrowser: true,
    });
  }

  async generateContent(prompt) {
    try {
      console.log('Generating content for prompt:', prompt);
      
      const response = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are a professional writing assistant. Your task is to help improve and enhance text while maintaining its core message. Provide responses in HTML format using appropriate paragraph tags."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1000,
      });

      console.log('OpenAI response:', response);

      if (response.choices && response.choices.length > 0) {
        const content = response.choices[0].message.content;
        return content;
      }

      throw new Error('No content generated');
    } catch (error) {
      console.error('Error generating content:', error);
      throw error;
    }
  }

  async generateSuggestions(text) {
    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are a professional writing assistant. Provide 3 alternative versions of the given text, each improving it in a different way. Format the response as HTML with each suggestion in a separate paragraph tag."
          },
          {
            role: "user",
            content: text
          }
        ],
        temperature: 0.7,
        max_tokens: 1000,
      });

      if (response.choices && response.choices.length > 0) {
        return response.choices[0].message.content;
      }

      throw new Error('No suggestions generated');
    } catch (error) {
      console.error('Error generating suggestions:', error);
      throw error;
    }
  }

  async analyzeText(text) {
    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "Analyze the given text and provide insights about its style, tone, and potential improvements. Format the response as HTML with appropriate paragraph tags."
          },
          {
            role: "user",
            content: text
          }
        ],
        temperature: 0.7,
        max_tokens: 1000,
      });

      if (response.choices && response.choices.length > 0) {
        return response.choices[0].message.content;
      }

      throw new Error('No analysis generated');
    } catch (error) {
      console.error('Error analyzing text:', error);
      throw error;
    }
  }
}

const aiService = new AIService();
export { aiService };
