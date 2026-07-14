import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';

export const GEMINI_MODELS = [
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', provider: 'google', desc: 'Recommended: Fastest, smart, and multimodal', maxTokens: 1048576 },
  { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', provider: 'google', desc: 'Legacy Flash: Extremely fast and lightweight', maxTokens: 1048576 },
  { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', provider: 'google', desc: 'Complex reasoning, coding & analysis', maxTokens: 2097152 },
];

export const OPENAI_MODELS = [
  { id: 'gpt-4o-mini', name: 'GPT-4o Mini', provider: 'openai', desc: 'Fast, cheap, and highly capable', maxTokens: 128000 },
  { id: 'gpt-4o', name: 'GPT-4o', provider: 'openai', desc: 'Flagship model: Extremely smart and fast', maxTokens: 128000 },
];

export const ALL_MODELS = [...GEMINI_MODELS, ...OPENAI_MODELS];

export const useAi = () => {
  const [geminiKey, setGeminiKeyState] = useState(() => localStorage.getItem('dev_hub_gemini_key') || '');
  const [openaiKey, setOpenaiKeyState] = useState(() => localStorage.getItem('dev_hub_openai_key') || '');
  const [loading, setLoading] = useState(false);

  const saveGeminiKey = (key) => {
    const cleanKey = key.trim();
    localStorage.setItem('dev_hub_gemini_key', cleanKey);
    setGeminiKeyState(cleanKey);
    if (cleanKey) {
      toast.success('Gemini API Key saved locally!');
    } else {
      toast.success('Gemini API Key cleared.');
    }
  };

  const saveOpenaiKey = (key) => {
    const cleanKey = key.trim();
    localStorage.setItem('dev_hub_openai_key', cleanKey);
    setOpenaiKeyState(cleanKey);
    if (cleanKey) {
      toast.success('OpenAI API Key saved locally!');
    } else {
      toast.success('OpenAI API Key cleared.');
    }
  };

  const isGeminiConfigured = !!geminiKey;
  const isOpenaiConfigured = !!openaiKey;

  const estimateTokens = (text) => {
    if (!text) return 0;
    // Simple heuristic: roughly 1 token per 4 characters for English code/text
    return Math.ceil(text.length / 4);
  };

  const callAi = async ({
    prompt,
    systemInstruction = '',
    modelId = 'gemini-2.5-flash',
    imageBase64 = null,
    imageMimeType = 'image/png'
  }) => {
    const model = ALL_MODELS.find(m => m.id === modelId) || GEMINI_MODELS[0];
    const isGoogle = model.provider === 'google';
    const apiKey = isGoogle ? geminiKey : openaiKey;

    if (!apiKey) {
      const providerName = isGoogle ? 'Gemini (Google)' : 'OpenAI';
      const msg = `Please configure your ${providerName} API Key first.`;
      toast.error(msg);
      throw new Error(msg);
    }

    setLoading(true);
    const startTime = Date.now();

    try {
      let responseText = '';
      let usage = { promptTokens: 0, completionTokens: 0, totalTokens: 0 };

      if (isGoogle) {
        // --- GOOGLE GEMINI API CALL ---
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model.id}:generateContent?key=${apiKey}`;
        
        const contentsParts = [];
        
        // Add image part if provided
        if (imageBase64) {
          contentsParts.push({
            inlineData: {
              mimeType: imageMimeType,
              data: imageBase64
            }
          });
        }
        
        // Add prompt text part
        contentsParts.push({
          text: prompt
        });

        const requestBody = {
          contents: [
            {
              parts: contentsParts
            }
          ],
          generationConfig: {
            temperature: 0.15,
            maxOutputTokens: 8192
          }
        };

        if (systemInstruction) {
          requestBody.systemInstruction = {
            parts: [{ text: systemInstruction }]
          };
        }

        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          const errMsg = errData?.error?.message || `HTTP error ${response.status}`;
          throw new Error(errMsg);
        }

        const data = await response.json();
        
        if (!data.candidates || data.candidates.length === 0 || !data.candidates[0].content) {
          throw new Error('No content returned from Gemini API. Check if your prompt violates safety filters.');
        }

        responseText = data.candidates[0].content.parts.map(p => p.text).join('\n');
        
        // Estimate tokens for Gemini since client-side usage statistics aren't always returned directly
        const promptTok = estimateTokens(prompt) + (imageBase64 ? 258 : 0) + estimateTokens(systemInstruction);
        const compTok = estimateTokens(responseText);
        usage = {
          promptTokens: promptTok,
          completionTokens: compTok,
          totalTokens: promptTok + compTok
        };
      } else {
        // --- OPENAI API CALL ---
        const url = 'https://api.openai.com/v1/chat/completions';
        
        const messages = [];
        if (systemInstruction) {
          messages.push({ role: 'system', content: systemInstruction });
        }

        if (imageBase64) {
          messages.push({
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              {
                type: 'image_url',
                image_url: {
                  url: `data:${imageMimeType};base64,${imageBase64}`
                }
              }
            ]
          });
        } else {
          messages.push({ role: 'user', content: prompt });
        }

        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model: model.id,
            messages,
            temperature: 0.15,
            max_tokens: 4096
          })
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          const errMsg = errData?.error?.message || `HTTP error ${response.status}`;
          throw new Error(errMsg);
        }

        const data = await response.json();
        responseText = data.choices[0].message.content;
        
        if (data.usage) {
          usage = {
            promptTokens: data.usage.prompt_tokens,
            completionTokens: data.usage.completion_tokens,
            totalTokens: data.usage.total_tokens
          };
        } else {
          const promptTok = estimateTokens(prompt) + (imageBase64 ? 300 : 0) + estimateTokens(systemInstruction);
          const compTok = estimateTokens(responseText);
          usage = {
            promptTokens: promptTok,
            completionTokens: compTok,
            totalTokens: promptTok + compTok
          };
        }
      }

      const latency = Date.now() - startTime;
      
      // Calculate a rough pricing estimate (cost per million tokens)
      // Gemini 2.5 Flash: $0.075/1M input, $0.30/1M output
      // GPT-4o Mini: $0.150/1M input, $0.60/1M output
      let price = 0;
      if (model.id.includes('flash') || model.id.includes('mini')) {
        price = (usage.promptTokens * 0.0000001) + (usage.completionTokens * 0.0000004);
      } else {
        // Pro models or full GPT-4o: $2.50/1M input, $10.00/1M output
        price = (usage.promptTokens * 0.0000025) + (usage.completionTokens * 0.00001);
      }

      return {
        text: responseText,
        usage,
        latency,
        cost: parseFloat(price.toFixed(6))
      };
    } catch (error) {
      console.error('AI Request Failure:', error);
      toast.error(`AI Request Failed: ${error.message}`);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    geminiKey,
    openaiKey,
    saveGeminiKey,
    saveOpenaiKey,
    isGeminiConfigured,
    isOpenaiConfigured,
    callAi,
    loading
  };
};
