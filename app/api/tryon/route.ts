import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.AI_GATEWAY_API_KEY,
  baseURL: "https://ai-gateway.vercel.sh/v1",
});

async function fileToDataUrl(file: File) {
  const buffer = Buffer.from(await file.arrayBuffer());
  const mimeType = file.type || "image/jpeg";
  return `data:${mimeType};base64,${buffer.toString("base64")}`;
}

export async function POST(req: NextRequest) {
  try {
    if (!process.env.AI_GATEWAY_API_KEY) {
      return NextResponse.json(
        { error: "Missing AI_GATEWAY_API_KEY in environment variables." },
        { status: 500 }
      );
    }

    const formData = await req.formData();
    const personImage = formData.get("personImage");
    const garmentImage = formData.get("garmentImage");

    if (!(personImage instanceof File) || !(garmentImage instanceof File)) {
      return NextResponse.json(
        { error: "Please upload both the person photo and the clothing photo." },
        { status: 400 }
      );
    }

    const personDataUrl = await fileToDataUrl(personImage);
    const garmentDataUrl = await fileToDataUrl(garmentImage);

    const prompt = `
Create one realistic virtual try-on image.

Image 1: a real person.
Image 2: a clothing item.

Task:
Edit image 1 so that the person is wearing the garment from image 2.

Rules:
- Keep the person's face unchanged
- Keep the person's identity unchanged
- Keep the person's body shape unchanged
- Keep the person's pose unchanged
- Keep the background unchanged
- Preserve the garment color, texture, pattern, and overall design as much as possible
- Make the clothing look naturally worn
- Return exactly one realistic e-commerce try-on image
- Do not add accessories
- Do not add extra garments
- Do not change the camera angle
`;

    const completion = await client.chat.completions.create({
      model: "google/gemini-2.5-flash-image-preview",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            {
              type: "image_url",
              image_url: {
                url: personDataUrl,
              },
            },
            {
              type: "image_url",
              image_url: {
                url: garmentDataUrl,
              },
            },
          ],
        },
      ],
      // @ts-expect-error - supported by Vercel AI Gateway
      modalities: ["text", "image"],
      stream: false,
    });

    const message = completion.choices?.[0]?.message as
      | {
          content?: string | null;
          images?: Array<{
            type?: string;
            image_url?: { url?: string };
          }>;
        }
      | undefined;

    const imageUrl = message?.images?.[0]?.image_url?.url;

    if (!imageUrl) {
      return NextResponse.json(
        {
          error: "No image was returned by the model.",
          raw: message ?? null,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ imageUrl });
  } catch (error: any) {
    console.error("TRY-ON ERROR:", error);

    return NextResponse.json(
      {
        error:
          error?.message ||
          error?.response?.data?.error?.message ||
          "Failed to generate try-on image.",
      },
      { status: 500 }
    );
  }
}