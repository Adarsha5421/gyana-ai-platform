// // app/api/chat/route.ts
// import { NextResponse } from 'next/server';

// // Define a type for the parts of a multi-modal message
// type MessageContent =
//     | { type: 'text', text: string }
//     | { type: 'image_url', image_url: { url: string } };

// export async function POST(req: Request) {
//     try {
//         // Now we can receive both a message and an optional image
//         const { message, image } = await req.json();

//         if (!message) {
//             return NextResponse.json(
//                 { error: 'Message is required' },
//                 { status: 400 }
//             );
//         }

//         // --- Build the multi-modal message for the AI ---
//         const messages = [
//             {
//                 role: "system",
//                 content: "You are an expert AI tutor named Gyana. When a user uploads an image of a math problem or diagram, analyze it carefully. Guide them through the problem step-by-step. Do not give the direct answer. Ask leading questions to help them solve it themselves."
//             },
//             {
//                 role: "user",
//                 // The user's content can now have multiple parts: text and an image
//                 content: [
//                     { type: 'text', text: message } as MessageContent,
//                     // If an image was sent from the frontend, add it to the content
//                     ...(image ? [{ type: 'image_url', image_url: { url: image } } as MessageContent] : [])
//                 ]
//             }
//         ];

//         // --- Call the OpenRouter API with a Vision-capable model ---
//         const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
//             method: "POST",
//             headers: {
//                 "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
//                 "Content-Type": "application/json"
//             },
//             body: JSON.stringify({
//                 // "model": "google/gemini-pro-vision", // A powerful model that can understand images
//                 "model": "mistralai/mistral-7b-instruct:free",
//                 "max_tokens": 1000, // Adjust based on your needs
//                 "temperature": 0.7, // Adjust for creativity vs. accuracy



//                 "messages": messages
//             })
//         });

//         if (!response.ok) {
//             const errorText = await response.text();
//             console.error("OpenRouter API Error:", errorText);
//             return NextResponse.json(
//                 { error: `API call failed: ${errorText}` },
//                 { status: 500 }
//             );
//         }

//         const data = await response.json();
//         const aiReply = data.choices[0].message.content;

//         return NextResponse.json({ reply: aiReply });

//     } catch (error) {
//         console.error('Error in chat API:', error);
//         return NextResponse.json(
//             { error: 'Failed to get a response from the AI' },
//             { status: 500 }
//         );
//     }
// }

// app/api/chat/route.ts
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        // We still accept `image` from the frontend, but we will ignore it for now.
        const { message, image } = await req.json();

        if (!message && !image) {
            return NextResponse.json(
                { error: 'Message or image is required' },
                { status: 400 }
            );
        }

        // Since we are using a text-only model, we will only use the text part of the message.
        // The AI will not "see" the image.
        const prompt = message || "Please analyze the user's request."; // A fallback prompt if only an image is sent

        // --- Build the standard text-only message for the AI ---
        const messages = [
            {
                role: "system",
                content: "You are an expert AI tutor named Gyana. You are friendly, encouraging, and you help users understand concepts by explaining them simply and asking guiding questions. You do not give away direct answers."
            },
            {
                role: "user",
                // CRUCIAL CHANGE: We only send a simple string for the content, not an array.
                content: prompt
            }
        ];

        // --- Call the OpenRouter API with the free text-only model ---
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                "model": "mistralai/mistral-7b-instruct:free",
                "messages": messages
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("OpenRouter API Error:", errorText);
            return NextResponse.json(
                { error: `API call failed: ${errorText}` },
                { status: 500 }
            );
        }

        const data = await response.json();
        const aiReply = data.choices[0].message.content;

        return NextResponse.json({ reply: aiReply });

    } catch (error) {
        console.error('Error in chat API:', error);
        return NextResponse.json(
            { error: 'Failed to get a response from the AI' },
            { status: 500 }
        );
    }
}
