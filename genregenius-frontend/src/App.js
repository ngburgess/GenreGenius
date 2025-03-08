import React, { useState } from "react";
import axios from "axios";
import { Bar } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from "chart.js";
//import './App.css';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

function App() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [predictedGenre, setPredictedGenre] = useState("");
  const [genreProbs, setGenreProbs] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
  };

  const handlePredict = async () => {
    if (!selectedFile) {
      setError("Please upload a WAV file.");
      return;
    }

    setLoading(true);
    setError("");
    setPredictedGenre("");
    setGenreProbs(null);

    const formData = new FormData();
    formData.append("song_file", selectedFile);

    try {
      const response = await axios.post("https://44.198.230.231:5000/predict", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      console.log("Genre probabilities:", response.data.genre_probabilities);

      const genreProbabilities = response.data.genre_probabilities;
      const genres = Object.keys(genreProbabilities);
      const probabilities = Object.values(genreProbabilities);

      setPredictedGenre(genres[0]);
      setGenreProbs({ genres, probabilities });

    } catch (err) {
      console.error("Error:", err.response ? err.response.data : err.message);
      setError("Failed to predict genre. Please upload a valid WAV file.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ textAlign: "center", padding: "0px", fontFamily: "Rajdhani" }}>
      <h1 style={{ fontSize: "50px" }}>GenreGenius</h1>
      <p>AI-Powered Music Genre Predictor</p>

      <input
        type="file"
        accept=".wav"
        onChange={handleFileChange}
        style={{
          width: "60%",
          padding: "10px",
          fontSize: "16px",
          borderRadius: "5px",
          border: "1px solid #ccc",
          marginBottom: "10px",
          fontFamily: "Rajdhani",
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
          backgroundColor: "#3498db",
          color: "white",
          cursor: "pointer",
          fontFamily: "Rajdhani",
        }}
        disabled={loading}
      >
        {loading ? "Predicting..." : "Predict Genre"}
      </button>

      {error && <p style={{ color: "red", marginTop: "10px" }}>{error}</p>}

      {predictedGenre && (
        <p style={{ fontSize: "24px", marginTop: "20px" }}>
          Predicted Genre: <b>{predictedGenre}</b>
        </p>
      )}

      {genreProbs && (
        <div style={{ width: "60%", margin: "auto" }}>
          <Bar
            data={{
              labels: genreProbs.genres,
              datasets: [
                {
                  label: "Probability",
                  data: genreProbs.probabilities,
                  backgroundColor: "rgba(52, 152, 219, 0.2)",
                  borderColor: "rgba(52, 152, 219)",
                  borderWidth: 1,
                },
              ],
            }}
            options={{
              indexAxis: "y",
              scales: {
                x: { beginAtZero: true, display: false },
                y: {
                  grid: { display: false },
                  ticks: {
                    font: { family: "Rajdhani" },
                  },
                },
              },
              plugins: {
                legend: {
                  labels: { font: { family: "Rajdhani" } },
                },
              },
            }}
          />
        </div>
      )}
    </div>
  );
}

export default App;
