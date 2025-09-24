import { Handler, HandlerEvent, HandlerContext } from "@netlify/functions";
import { GoogleGenerativeAI } from "@google/generative-ai";
import * as knowledgeBase from '../../knowledge_base.json';

const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  // 1. Valida que la petición sea correcta (POST)
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    // 2. Obtén la API Key de las variables de entorno de Netlify (¡Más seguro!)
    const API_KEY = process.env.GEMINI_API_KEY;
    if (!API_KEY) {
      throw new Error("La API Key de Gemini no está configurada.");
    }

    // 3. Obtén el prompt del usuario del cuerpo de la petición
    const userPrompt = JSON.parse(event.body || '{}').prompt;
    if (!userPrompt) {
      return { statusCode: 400, body: 'Falta el prompt en la petición.' };
    }

    // 4. Prepara el contexto y el prompt final para la IA
    const contextText = JSON.stringify(knowledgeBase);
    const finalPrompt = `
      Contexto: Eres un asistente experto en el sistema de diseño de Angular.
      Usa SÓLO los componentes y propiedades descritos en el siguiente JSON de contexto:
      ${contextText}

      Petición: Usando el contexto anterior, genera el código HTML y TypeScript para un componente de Angular que cumpla con la siguiente petición: "${userPrompt}"
      
      Respuesta:
    `;
    
    // 5. Llama a la IA y procesa la respuesta
    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const result = await model.generateContent(finalPrompt);
    const response = await result.response;
    const code = response.text();

    // 6. Devuelve el código generado
    return {
      statusCode: 200,
      body: JSON.stringify({ code: code }),
    };

  } catch (error) {
    console.error(error);
    return { statusCode: 500, body: 'Ha ocurrido un error en el servidor.' };
  }
};

// export { handler };