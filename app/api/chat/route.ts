import { openai } from "@ai-sdk/openai"
import { streamText } from "ai"
import { NextResponse } from "next/server"

export const maxDuration = 30

// Helper for structured logging
const logError = (error: any, context: string) => {
  console.error(
    JSON.stringify({
      level: "error",
      timestamp: new Date().toISOString(),
      context,
      message: error.message,
      stack: error.stack,
      details: error.cause,
    }),
  )
}

export async function POST(req: Request) {
  try {
    const { messages, data } = await req.json()

    const systemPrompts: Record<string, string> = {
      research:
        "You are a helpful AI research assistant. Your responses should be detailed, well-sourced, and comprehensive.",
      compute:
        "You are a helpful AI computation assistant. Your responses should be technical, accurate, and focused on solving complex problems.",
      create:
        "You are a helpful AI creative assistant. Your responses should be imaginative, inspiring, and help users generate new ideas and content.",
    }

    const responseStyle = data?.responseStyle || "detailed"
    const systemPrompt = systemPrompts[responseStyle] || systemPrompts.detailed

    const result = await streamText({
      model: openai("gpt-4o"),
      system: systemPrompt,
      messages,
    })

    // The toDataStreamResponse helper function is a great way to stream the AI response.
    // It also handles errors during streaming and sends them as part of the response.
    return result.toDataStreamResponse()
  } catch (error: any) {
    // This catch block handles errors that occur *before* the stream begins,
    // such as issues with the request body or initial connection to the AI provider.
    logError(error, "API_ROUTE_ERROR")
    return NextResponse.json(
      {
        error: "An unexpected error occurred. Please try again later.",
        details: error.message,
      },
      { status: 500 },
    )
  }
}
