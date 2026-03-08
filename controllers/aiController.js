// aiController.js
const OpenAI = require('openai');
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const assistantResponseSchema = {
  name: "assistant_response",
  schema: {
    type: "object",
    properties: {
      reply: { type: "string" },
      actions: {
        type: "object",
        properties: {
          addToCart: {
            type: "array",
            items: {
              type: "object",
              properties: {
                productId: { type: "string" },
                quantity: { type: "integer", minimum: 1 },
              },
              required: ["productId", "quantity"],
              additionalProperties: false,
            },
          },
          suggestProducts: {
            type: "array",
            items: { type: "string" },
          },
        },
        required: [],
        additionalProperties: false,
      },
    },
    required: ["reply", "actions"],
    additionalProperties: false,
  },
};

async function runAssistant(message, products, history = []) {
  const slimProducts = (products || []).map(p => ({
    id: p.id || p._id,
    title: p.title,
    category: p.category,
    subCategory: p.subCategory || [],
    price: p.price,
    extra: !!p.extra,
  }));

  // turn RN messages into a simple chat transcript string
  const conversationText = (history || [])
    .map(m => `${m.from === 'user' ? 'User' : 'Assistant'}: ${m.text}`)
    .join('\n');

  const completion = await openai.chat.completions.create({
    model: "gpt-4.1-mini",
    response_format: {
      type: "json_schema",
      json_schema: assistantResponseSchema,
    },
    messages: [
      {
        role: "system",
        content: `
You are the AI shopping assistant for the RoomService app.

You receive:
- A short conversation history between user and assistant.
- The user's latest message.
- A product catalog.

You must:
1. Use conversation history to resolve references like "that", "three more", "add it again", etc.
   - If the last clearly discussed item was a specific product (e.g. "New York Style Cheesecake"),
     then "add three more" should add three more of THAT product.
2. If it's genuinely ambiguous which item they mean (multiple candidates), ask a clarifying question
   instead of guessing.
3. Reply concisely and casually.
4. Return structured actions:
   - "addToCart": list of { productId, quantity }
   - "suggestProducts": list of product IDs that might interest them

Only use productId values that appear in the provided products list.
`
      },
      {
        role: "user",
        content: `
Conversation so far:
${conversationText || '(no previous messages)'}

Now the user says: "${message}"

Product catalog (JSON):
${JSON.stringify(slimProducts)}
`
      }
    ],
  });

  const content = completion.choices[0].message.content;
  const parsed = typeof content === "string" ? JSON.parse(content) : content;

  return {
    reply: parsed.reply || "I’m not sure what to do with that yet.",
    actions: parsed.actions || { addToCart: [], suggestProducts: [] },
  };
}

module.exports = { runAssistant };
