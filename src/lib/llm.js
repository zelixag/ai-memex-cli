import OpenAI from 'openai';
import { getLLMConfig } from './config.js';
import { MOCK_ANALYSIS, MOCK_PAGE_CONTENT, MOCK_QUERY_RESPONSE, MOCK_LINT_RESULT, MOCK_CONTEXT } from './llm-mock.js';

let _client = null;

// Mock mode: set MEMEX_MOCK=1 to use mock responses (for testing without API)
const IS_MOCK = process.env.MEMEX_MOCK === '1';

function getClient() {
  if (_client) return _client;
  const cfg = getLLMConfig();
  
  const options = { apiKey: cfg.apiKey };
  // Use configured baseUrl, or fall back to OPENAI_BASE_URL env var
  const baseUrl = cfg.baseUrl || process.env.OPENAI_BASE_URL || process.env.OPENAI_API_BASE || '';
  if (baseUrl) options.baseURL = baseUrl;
  
  _client = new OpenAI(options);
  return _client;
}

/**
 * Call the LLM with a system prompt and user message
 * Returns the full text response
 */
export async function llmCall(systemPrompt, userMessage, options = {}) {
  if (IS_MOCK) {
    // Return mock responses based on context
    if (userMessage.includes('Page to Write')) {
      const nameMatch = userMessage.match(/Name: ([^\n]+)/);
      const titleMatch = userMessage.match(/Title: ([^\n]+)/);
      return MOCK_PAGE_CONTENT(nameMatch?.[1] || 'unknown', titleMatch?.[1] || 'Unknown Page');
    }
    if (userMessage.includes('Question')) {
      const qMatch = userMessage.match(/## Question\n([^\n]+)/);
      return MOCK_QUERY_RESPONSE(qMatch?.[1] || 'unknown question');
    }
    if (userMessage.includes('Distill')) {
      return MOCK_CONTEXT('general');
    }
    return MOCK_CONTEXT('general');
  }

  const cfg = getLLMConfig();
  const client = getClient();
  
  const model = options.model || cfg.model;
  const temperature = options.temperature ?? 0.3;
  const maxTokens = options.maxTokens || 4096;

  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userMessage },
  ];

  if (options.history) {
    messages.splice(1, 0, ...options.history);
  }

  const response = await client.chat.completions.create({
    model,
    messages,
    temperature,
    max_tokens: maxTokens,
  });

  return response.choices[0].message.content;
}

/**
 * Stream LLM response, calling onChunk for each text chunk
 */
export async function llmStream(systemPrompt, userMessage, onChunk, options = {}) {
  if (IS_MOCK) {
    const qMatch = userMessage.match(/## Question\n([^\n]+)/);
    const mockResponse = MOCK_QUERY_RESPONSE(qMatch?.[1] || 'unknown question');
    // Simulate streaming
    for (const char of mockResponse) {
      onChunk(char);
    }
    return mockResponse;
  }

  const cfg = getLLMConfig();
  const client = getClient();
  
  const model = options.model || cfg.model;
  const temperature = options.temperature ?? 0.3;

  const stream = await client.chat.completions.create({
    model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage },
    ],
    temperature,
    stream: true,
  });

  let fullText = '';
  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta?.content || '';
    if (delta) {
      fullText += delta;
      onChunk(delta);
    }
  }
  return fullText;
}

/**
 * Extract structured JSON from LLM response
 */
export async function llmJSON(systemPrompt, userMessage, options = {}) {
  if (IS_MOCK) {
    if (userMessage.includes('Analyze this source')) return MOCK_ANALYSIS;
    if (userMessage.includes('health check') || userMessage.includes('Analyze this knowledge base')) return MOCK_LINT_RESULT;
    if (userMessage.includes('Extract best practices')) {
      return {
        title: 'Mock Best Practices',
        summary: 'Mock distillation result',
        bestPractices: [{ practice: 'Write tests', context: 'All code', rationale: 'Reliability' }],
        decisions: [],
        antiPatterns: [],
        pages: [{ name: 'best-practices/mock-practices', title: 'Mock Best Practices', summary: 'Mock', tags: ['best-practice'] }]
      };
    }
    return MOCK_ANALYSIS;
  }

  const response = await llmCall(
    systemPrompt + '\n\nYou MUST respond with valid JSON only. No markdown, no explanation.',
    userMessage,
    { ...options, temperature: 0.1 }
  );
  
  // Strip markdown code fences if present
  const cleaned = response.replace(/^```(?:json)?\n?/m, '').replace(/\n?```$/m, '').trim();
  
  try {
    return JSON.parse(cleaned);
  } catch (e) {
    // Try to extract JSON from the response
    const match = cleaned.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    if (match) {
      return JSON.parse(match[0]);
    }
    throw new Error(`LLM returned invalid JSON: ${cleaned.slice(0, 200)}`);
  }
}

/**
 * Estimate token count for a string (rough approximation: 1 token ≈ 4 chars)
 */
export function estimateTokens(text) {
  return Math.ceil(text.length / 4);
}
