import { NextRequest, NextResponse } from "next/server";

async function fileToDataUrl(file: File) {
  const buffer = Buffer.from(await file.arrayBuffer());
  const mimeType = file.type || "image/jpeg";
  return `data:${mimeType};base64,${buffer.toString("base64")}`;
}

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.AI_GATEWAY_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "Missing AI_GATEWAY_API_KEY" },
        { status: 500 }
      );
    }

    const formData = await req.formData();

    const personImage = formData.get("personImage");
    const garmentImage = formData.get("garmentImage");

    if (!(personImage instanceof File) || !(garmentImage instanceof File)) {
      return NextResponse.json(
        { error: "Upload both images" },
        { status: 400 }
      );
    }

    const personDataUrl = await fileToDataUrl(personImage);
    const garmentDataUrl = await fileToDataUrl(garmentImage);

    const response = await fetch(
      "https://ai-gateway.vercel.sh/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-image",
          modalities: ["text", "image"],
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: `Put the clothing from the second image onto the person in the first image. Keep face, body, and background unchanged. Make it realistic.`,
                },
                {
                  type: "image_url",
                  image_url: { url: personDataUrl },
                },
                {
                  type: "image_url",
                  image_url: { url: garmentDataUrl },
                },
              ],
            },
          ],
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data?.error || "Gateway failed", raw: data },
        { status: 500 }
      );
    }

    const imageUrl =
      data?.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!imageUrl) {
      return NextResponse.json(
        { error: "No image returned", raw: data },
        { status: 500 }
      );
    }

    return NextResponse.json({ imageUrl });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Unknown error" },
      { status: 500 }
    );
  }
}