"use client";

import { useState } from "react";

export default function Home() {
  const [personImage, setPersonImage] = useState<File | null>(null);
  const [garmentImage, setGarmentImage] = useState<File | null>(null);

  const [personPreview, setPersonPreview] = useState("");
  const [garmentPreview, setGarmentPreview] = useState("");

  const [resultImage, setResultImage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function handlePersonChange(file: File | null) {
    setPersonImage(file);
    setResultImage("");
    setError("");

    if (file) {
      setPersonPreview(URL.createObjectURL(file));
    } else {
      setPersonPreview("");
    }
  }

  function handleGarmentChange(file: File | null) {
    setGarmentImage(file);
    setResultImage("");
    setError("");

    if (file) {
      setGarmentPreview(URL.createObjectURL(file));
    } else {
      setGarmentPreview("");
    }
  }

  async function handleTryOn() {
    setError("");
    setResultImage("");

    if (!personImage || !garmentImage) {
      setError("Please upload both images before starting the try-on.");
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("personImage", personImage);
      formData.append("garmentImage", garmentImage);

      const response = await fetch("/api/tryon", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Something went wrong.");
      }

      setResultImage(data.imageUrl);
    } catch (err: any) {
      setError(err.message || "Failed to generate try-on image.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="vt-page">
      <div className="vt-shell">
        <header className="vt-header">
          <div>
            <div className="vt-eyebrow">AI Fashion Demo</div>
            <h1 className="vt-title">Virtual Try-On</h1>
            <p className="vt-subtitle">
              Upload a person photo and a clothing photo to generate a realistic
              online fitting preview.
            </p>
          </div>
        </header>

        <section className="vt-grid">
          <div className="vt-card">
            <h2 className="vt-card-title">Upload images</h2>

            <div className="vt-field">
              <label className="vt-label">Person photo</label>
              <input
                className="vt-input"
                type="file"
                accept="image/*"
                onChange={(e) =>
                  handlePersonChange(e.target.files?.[0] || null)
                }
              />
            </div>

            {personPreview && (
              <div className="vt-preview-block">
                <div className="vt-preview-title">Person preview</div>
                <img
                  src={personPreview}
                  alt="Person preview"
                  className="vt-preview-image"
                />
              </div>
            )}

            <div className="vt-field">
              <label className="vt-label">Clothing photo</label>
              <input
                className="vt-input"
                type="file"
                accept="image/*"
                onChange={(e) =>
                  handleGarmentChange(e.target.files?.[0] || null)
                }
              />
            </div>

            {garmentPreview && (
              <div className="vt-preview-block">
                <div className="vt-preview-title">Clothing preview</div>
                <img
                  src={garmentPreview}
                  alt="Clothing preview"
                  className="vt-preview-image"
                />
              </div>
            )}

            <button
              className="vt-button"
              onClick={handleTryOn}
              disabled={loading}
            >
              {loading ? "Generating..." : "Try On"}
            </button>

            {error && <div className="vt-error">{error}</div>}
          </div>

          <div className="vt-card">
            <h2 className="vt-card-title">Result</h2>

            {!resultImage && !loading && (
              <div className="vt-empty">
                Your generated try-on image will appear here.
              </div>
            )}

            {loading && (
              <div className="vt-loading">
                Generating your try-on preview. This may take a little time.
              </div>
            )}

            {resultImage && (
              <div className="vt-result-block">
                <img
                  src={resultImage}
                  alt="Generated try-on result"
                  className="vt-result-image"
                />
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}