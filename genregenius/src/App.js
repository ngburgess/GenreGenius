import React, { useState } from "react";
import axios from "axios";

function App() {
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [predictedGenre, setPredictedGenre] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handlePredict = async () => {
    if (!youtubeUrl) {
      setError("Please enter a YouTube URL.");
      return;
    }

    setLoading(true);
    setError("");
    setPredictedGenre("");

    try {
      const response = await axios.post("http://localhost:5000/predict", {
        url: youtubeUrl,
      });

      setPredictedGenre(response.data.pred_genre);
    } catch (err) {
      setError("Failed to predict genre. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ textAlign: "center", padding: "50px", fontFamily: "Arial" }}>
      <h1>GenreGenius.ai</h1>
      <p>Enter a YouTube URL to predict the song's genre:</p>

      <input
        type="text"
        value={youtubeUrl}
        onChange={(e) => setYoutubeUrl(e.target.value)}
        placeholder="Paste YouTube URL here..."
        style={{
          width: "60%",
          padding: "10px",
          fontSize: "16px",
          borderRadius: "5px",
          border: "1px solid #ccc",
          marginBottom: "10px",
        }}
      />

      <br />
      <button
        onClick={handlePredict}
        style={{
          padding: "10px 20px",
          fontSize: "16px",
          borderRadius: "5px",
          border: "none",
          backgroundColor: "#007bff",
          color: "white",
          cursor: "pointer",
        }}
        disabled={loading}
      >
        {loading ? "Predicting..." : "Predict Genre"}
      </button>

      {error && <p style={{ color: "red", marginTop: "10px" }}>{error}</p>}
      {predictedGenre && (
        <p style={{ fontSize: "20px", marginTop: "20px" }}>
          🎵 Predicted Genre: <strong>{predictedGenre}</strong>
        </p>
      )}
    </div>
  );
}

export default App;
