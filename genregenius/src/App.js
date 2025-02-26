import React, { useState } from "react";
import axios from "axios";
import { Bar } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from "chart.js";

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

function App() {
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [predictedGenre, setPredictedGenre] = useState("");
  const [genreProbs, setGenreProbs] = useState(null);
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
    setGenreProbs(null);

    try {
      const response = await axios.post("http://localhost:5000/predict", {
        url: youtubeUrl,
      });

      console.log("Genre probabilities:", response.data.genre_probabilities);

      // Extract genre probabilities
      const genreProbabilities = response.data.genre_probabilities;
      const genres = Object.keys(genreProbabilities);
      const probabilities = Object.values(genreProbabilities);

      // Set the predicted genre (highest probability is already first)
      setPredictedGenre(genres[0]);
      setGenreProbs({ genres, probabilities });

    } catch (err) {
      console.error("Error:", err.response ? err.response.data : err.message);
      setError("Failed to predict genre. Please use official YouTube audio.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ textAlign: "center", padding: "50px", fontFamily: "Rajdhani" }}>
      <h1 style={{"font-size":"50px"}}>GenreGenius</h1>
      <p>AI-Powered Music Genre Pedictor</p>

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
          fontFamily: "Rajdhani"
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
          fontFamily: "Rajdhani"
        }}
        disabled={loading}
      >
        {loading ? "Predicting..." : "Predict Genre"}
      </button>

      {error && <p style={{ color: "red", marginTop: "10px" }}>{error}</p>}

      {/* Display predicted genre */}
      {predictedGenre && (
        <p style={{ fontSize: "24px", marginTop: "20px" }}>
          Predicted Genre: <b>{predictedGenre}</b>
        </p>
      )}

      {/* Display the bar chart */}
      {genreProbs && (
        <div style={{ width: "60%", margin: "30px auto" }}>
          <Bar
            data={{
              labels: genreProbs.genres,
              datasets: [
                {
                  label: "Probability",
                  data: genreProbs.probabilities,
                  backgroundColor: "rgba(54, 162, 235, 0.6)",
                  borderColor: "rgba(54, 162, 235, 1)",
                  borderWidth: 1,
                },
              ],
            }}
            options={{
              indexAxis: "y", // Horizontal bar chart
              scales: {
                x: { beginAtZero: true,
                  display: false,
                 },
                y: {
                  grid: {
                    display: false,
                  },
                  ticks: {
                    font: {
                      family: "Rajdhani",
                    },
                  },
                },
              },
              plugins: {
                legend: {
                  labels: {
                    font: {
                      family: "Rajdhani",
                    },
                  },
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
