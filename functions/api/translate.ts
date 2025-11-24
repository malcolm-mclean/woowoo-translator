import { PagesFunction, Response } from "@cloudflare/workers-types";

interface Env {
  OPENAI_API_KEY: string;
}

interface ChatGptRequest {
  input: string;
  max_output_tokens: number;
  max_tool_calls: number;
  model: string;
  store: boolean;
}

interface ChatGptResponse extends Record<string, unknown> {
  output: {
    type: string;
    content: {
      type: string;
      text: string;
    }[];
  }[];
}

const MAX_TEXT_LENGTH = 2000;

/** This MUST stay named `onRequestPost` per Cloudflare docs */
export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const { request, env } = context;
    const body = (await request.json()) as {
      text: string;
    };

    if (!body.text) {
      return new Response(
        JSON.stringify({
          error: "Missing required fields: text, targetLanguage",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (body.text.length > MAX_TEXT_LENGTH) {
      return new Response(
        JSON.stringify({
          error: `Text too long. Max ${MAX_TEXT_LENGTH} characters.`,
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const chatGptRequest: ChatGptRequest = {
      input: `${body.text}`,
      max_output_tokens: 2000,
      max_tool_calls: 1,
      model: "gpt-4o",
      store: false,
    };

    const chatgptResponse = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.OPENAI_API_KEY ?? "OPENAI_API_KEY"}`,
      },
      body: JSON.stringify(chatGptRequest),
    });

    if (!chatgptResponse.ok) {
      console.error("OpenAI API error:", await chatgptResponse.text());
      return new Response(
        JSON.stringify({ error: "Translation service error" }),
        { status: 502, headers: { "Content-Type": "application/json" } }
      );
    }

    const data = (await chatgptResponse.json()) as ChatGptResponse;

    return new Response(
      JSON.stringify({
        translation:
          data.output[0]?.content[0]?.text ?? "Gosh, it didn't translate!",
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

/** This MUST stay named `onRequestOptions` per Cloudflare docs */
export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
};
