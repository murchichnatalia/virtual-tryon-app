"use client";

import { useState } from "react";

export default function Home() {
  const [personImage, setPersonImage] = useState<File | null>(null);
  const [garmentImage, setGarmentImage] = useState<File | null>(null);
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleTryOn() {
    if (!personImage || !garmentImage) return;

    setLoading(true);

    const formData = new FormData();
    formData.append("personImage", personImage);
    formData.append("garmentImage", garmentImage);

    const res = await fetch("/api/tryon", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();

    if (data.imageUrl) {
      setResult(data.imageUrl);
    } else {
      alert(data.error);
    }

    setLoading(false);
  }

  return (
    <main style={{ padding: 20 }}>
      <h1>Virtual Try-On</h1>

      <input type="file" onChange={(e) => setPersonImage(e.target.files?.[0] || null)} />
      <input type="file" onChange={(e) => setGarmentImage(e.target.files?.[0] || null)} />

      <button onClick={handleTryOn}>
        {loading ? "Generating..." : "Try On"}
      </button>

      {result && (
        <div>
          <h2>Result:</h2>
          <img src={result} style={{ maxWidth: 400 }} />
        </div>
      )}
    </main>
  );
}