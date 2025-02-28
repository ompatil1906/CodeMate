const Groq = require('groq-sdk');

class GroqService {
    constructor() {
        this.groq = new Groq({
            apiKey: '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'
        });
    }

    async generateResponse(prompt) {
        try {
            const completion = await this.groq.chat.completions.create({
                model: "mixtral-8x7b-32768",
                messages: [{ role: "user", content: prompt }],
                temperature: 0.7,
                max_tokens: 2048,
            });
            return completion.choices[0].message.content;
        } catch (error) {
            console.error('Error generating response:', error);
            return "I encountered an error processing your request.";
        }
    }
}

module.exports = new GroqService();
