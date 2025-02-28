import React, { useState } from "react";
import { Bar } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from "chart.js";
import soundwaves from "./img/sound-wave-png-images-transparent-free-download-pngmartcom-sound-waves-png-1000_237.png";

const genreIcons = {
  "Blues": "🎹",
  "Classical": "🎻",
  "Country": "🪕",
  "Disco": "🪩",
  "Hip-hop": "🎧",
  "Jazz": "🎷",
  "Metal": "👨‍🎤",
  "Pop": "🎤",
  "Reggae": "🌴",
  "Rock": "🎸",
};

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

function App() {
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [predictedGenre, setPredictedGenre] = useState("");
  const [genreProbs, setGenreProbs] = useState(null);
  const [buttonText, setButtonText] = useState("Predict Genre");
  const [error, setError] = useState("");

  const handlePredict = () => {
    if (!youtubeUrl) {
      setError("Please enter a YouTube URL.");
      return;
    }
  
    setButtonText("Converting to WAV...");
    setError("");
    setPredictedGenre("");
    setGenreProbs(null);
  
    const eventSource = new EventSource(`https://44.206.109.137:5000/predict?url=${encodeURIComponent(youtubeUrl)}`);
  
    eventSource.addEventListener("progress", (event) => {
      setButtonText(event.data);
    });
  
    eventSource.addEventListener("result", (event) => {
      const data = JSON.parse(event.data);
      if (data.genre_probabilities) {
        const genreProbabilities = data.genre_probabilities;
        const genres = Object.keys(genreProbabilities);
        const probabilities = Object.values(genreProbabilities);
  
        setPredictedGenre(`${genres[0]} ${genreIcons[genres[0]] || ""}`);
        setGenreProbs({ genres, probabilities });
        setButtonText("Predict Genre");
      }
      eventSource.close();
    });
  
    eventSource.addEventListener("error", (event) => {
      console.error("Prediction error:", event.data);
      setError("Failed to predict genre. Please use official YouTube audio for best results.");
      setButtonText("Predict Genre");
      eventSource.close();
    });
  };

  return (
    <div style={{ padding: "0px", textAlign: "center", fontFamily: "Rajdhani" }}>
      <div 
        style={{ 
          position: "relative", 
          display: "inline-block" 
        }}
      >
        <div 
          style={{
            position: "absolute",
            top: 16,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundImage: `linear-gradient(to left, white, rgba(255, 255, 255, 0) 50%, rgba(255, 255, 255, 0) 50%, white), url(${soundwaves})`,
            backgroundSize: "150%",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            opacity: 0.2,
            filter: "grayscale(100%)",
            zIndex: -1,
          }}
        />
        {/* Title */}
        <h1 style={{ 
          fontSize: "64px", 
          marginBottom: "10px", 
          position: "relative",
          zIndex: 1,
        }}>
          GenreGenius
        </h1>
      </div>
  
      <p style={{ fontSize: "20px", marginBottom: "10px", marginTop: "0px" }}>
        AI-Powered Music Genre Predictor
      </p>
  
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
        disabled={buttonText !== "Predict Genre"}
      >
        {buttonText}
      </button>
  
      {error && <p style={{ color: "#c0392b", marginTop: "10px" }}>{error}</p>}
  
      {predictedGenre && (
        <p style={{ fontSize: "24px", marginTop: "24px" }}>
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
                  ticks: { font: { family: "Rajdhani" } },
                },
              },
              plugins: {
                legend: { labels: { font: { family: "Rajdhani" } } },
              },
            }}
          />
        </div>
      )}
    </div>
  );  
  
}

export default App;
