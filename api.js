import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config.js';

const { createClient } = supabase;
export const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * API call with exponential backoff retry mechanism.
 * @param {string} apiUrl - The URL of the API endpoint.
 * @param {object} payload - The payload to send with the request.
 * @param {number} retries - The maximum number of retries.
 * @param {number} delay - The initial delay in milliseconds.
 * @returns {Promise<object>} - The JSON response from the API.
 */
async function callApiWithRetry(apiUrl, payload, retries = 3, delay = 1000) {
    for (let i = 0; i < retries; i++) {
        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (!response.ok) {
                // If the server is busy (429), wait and retry.
                if (response.status === 429) {
                    await new Promise(res => setTimeout(res, delay * (i + 1)));
                    continue;
                }
                // For other errors, throw an exception.
                throw new Error(`API Error (${response.status}): ${await response.text()}`);
            }
            return response.json();
        } catch (error) {
            // If this is the last retry, re-throw the error.
            if (i === retries - 1) throw error;
            // Wait before the next retry.
            await new Promise(res => setTimeout(res, delay * (i + 1)));
        }
    }
}

/**
 * Generates a character image using the Imagen 3 API.
 * @param {string} prompt - The user's text prompt for the character.
 * @param {string} universe - The universe the character belongs to.
 * @returns {Promise<string>} - A base64 encoded image data URL.
 */
export async function generateCharacterImage(prompt, universe) {
    const apiKey = ""; // The environment will inject the key.
    let stylePrompt = "";
    switch (universe) {
        case "감성의_숲": stylePrompt = "modern animation style, warm and vibrant colors, gentle and friendly appearance"; break;
        case "악몽의_저택": stylePrompt = "dark fantasy horror art, eerie and twisted, gothic elements"; break;
        case "사이버_펑크": stylePrompt = "cyberpunk mechanic style, neon lights, intricate details, robotic and futuristic"; break;
        case "판타지_왕국": stylePrompt = "western fantasy illustration style, classic fantasy elements, epic and majestic"; break;
        case "수정_동굴": stylePrompt = "mystical crystal style, glowing and translucent, ethereal and magical"; break;
        default: stylePrompt = "high-quality anime style"; break;
    }
    
    const fullPrompt = `Generate a full-body image of a creature. The user's core concept is: "${prompt}". This creature belongs to the '${universe.replace(/_/g, ' ')}' universe. Apply the following artistic style to the creature: "${stylePrompt}". The final image must be on a clean, white background, showing the entire creature from head to toe.`;
    
    const payload = { instances: [{ prompt: fullPrompt }], parameters: { "sampleCount": 1 } };
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=${apiKey}`;
    const result = await callApiWithRetry(apiUrl, payload);
    if (result.predictions?.[0]?.bytesBase64Encoded) {
        return `data:image/png;base64,${result.predictions[0].bytesBase64Encoded}`;
    }
    throw new Error("Image data was not returned from the API.");
}

/**
 * Generates character data (stats, moves, etc.) using the Gemini API with a JSON schema.
 * @param {string} prompt - The user's text prompt.
 * @param {string} universe - The character's universe.
 * @param {string} rarity - The character's predetermined rarity.
 * @param {object} bstRange - The min/max range for the Base Stat Total.
 * @param {string} skillListForPrompt - A formatted string of all master skills.
 * @param {string} abilityListForPrompt - A formatted string of all master abilities.
 * @returns {Promise<object>} - The generated character data as a JSON object.
 */
export async function generateCharacterData(prompt, universe, rarity, bstRange, skillListForPrompt, abilityListForPrompt) {
    const apiKey = ""; // The environment will inject the key.
    
    const basePrompt = `
**절대 규칙:**
1.  **등급:** "${rarity}"
2.  **총 능력치 (BST):** 반드시 ${bstRange.min}과 ${bstRange.max} 사이의 값으로 생성해야 합니다.
3.  **기술 선택:** 아래 '마스터 스킬 리스트'에서 주어진 크리처 컨셉에 가장 어울리는 기술 ID 4개를 선택해야 합니다.
4.  **특성 선택:** 아래 '마스터 특성 리스트'에서 일반 특성(ability)과 숨겨진 특성(hiddenAbility)에 해당하는 ID를 각각 1개씩 선택해야 합니다.

**생성 지침:**
1.  **능력치 (Stats):** 주어진 BST 범위 내에서 능력치를 분배해주세요. 체력(HP)은 다른 스탯보다 4~6배 높게 설정하여 배틀이 길게 이어지도록 해주세요.
2.  **타입 (Types):** 캐릭터의 설명에 가장 어울리는 타입을 2개 부여해주세요. 타입은 (${Object.keys(typeTranslations).join(', ')}) 중에서만 선택해야 합니다.
3.  **기술 및 특성 이름/설명:** 당신이 선택한 4개의 기술 ID와 2개의 특성 ID에 대해, 크리처의 컨셉에 맞는 창의적이고 멋진 '이름(name)'을 새로 만들어주세요.

**마스터 스킬 리스트:**
${skillListForPrompt}

**마스터 특성 리스트:**
${abilityListForPrompt}

**중요:** 모든 결과물(name, classification, pokedexEntry, moves.name, ability.name 등)은 반드시 한국어로 작성해주세요.

**사용자 컨셉:** "${prompt}". 이 크리처는 '${universe.replace(/_/g, ' ')}' 세계관의 존재입니다.

JSON 스키마에 맞춰 답변해주세요.
`;
    const schema = {
        type: "OBJECT",
        properties: {
            name: { type: "STRING" },
            classification: { type: "STRING" },
            types: { type: "ARRAY", items: { type: "STRING" } },
            ability: { type: "OBJECT", properties: { id: { type: "STRING" }, name: { type: "STRING" } } },
            hiddenAbility: { type: "OBJECT", properties: { id: { type: "STRING" }, name: { type: "STRING" } } },
            height: { type: "NUMBER" },
            weight: { type: "NUMBER" },
            pokedexEntry: { type: "STRING" },
            stats: { type: "OBJECT", properties: { hp: { type: "INTEGER" }, attack: { type: "INTEGER" }, defense: { type: "INTEGER" }, sp_atk: { type: "INTEGER" }, sp_def: { type: "INTEGER" }, speed: { type: "INTEGER" } } },
            moves: { type: "ARRAY", items: { type: "OBJECT", properties: { moveId: { type: "STRING" }, name: { type: "STRING" }, description: { type: "STRING" }, type: { type: "STRING" } } } }
        },
        required: ["name", "classification", "types", "ability", "hiddenAbility", "pokedexEntry", "stats", "moves"]
    };
    const payload = { contents: [{ parts: [{ text: basePrompt }] }], generationConfig: { responseMimeType: "application/json", responseSchema: schema } };
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;
    const result = await callApiWithRetry(apiUrl, payload);
    if (result.candidates?.[0]?.content.parts[0].text) {
        return JSON.parse(result.candidates[0].content.parts[0].text);
    }
    throw new Error("Character data generation failed.");
}

