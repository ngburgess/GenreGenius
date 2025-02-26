import numpy as np
import pandas as pd

from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score

import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import Dataset, DataLoader

import os
import yt_dlp
import librosa
from pydub import AudioSegment

from concurrent.futures import ThreadPoolExecutor

from flask import Flask, request, jsonify, Response
from flask_cors import CORS

import json

app = Flask(__name__)
CORS(app)
app.json.sort_keys = False

df = pd.read_csv("data/features_30_sec.csv")
df["label"] = df["label"].str.capitalize().replace("Hiphop", "Hip-hop")
df.drop("length", axis=1, inplace=True)
df = df[df["label"] != "Disco"]
df = df[df["label"] != "Reggae"]

features = df.iloc[:, 1:58]
scaler = StandardScaler()
X = scaler.fit_transform(features)

target = df["label"]
label_encoder = LabelEncoder()
y = label_encoder.fit_transform(target)

class GenreClassifier(nn.Module):
    def __init__(self, input_features, output_features):
        super(GenreClassifier, self).__init__()
        self.fc1 = nn.Linear(input_features, 128)
        self.fc2 = nn.Linear(128, 64)
        self.fc3 = nn.Linear(64, output_features)
        self.relu = nn.ReLU()

    def forward(self, x):
        x = self.relu(self.fc1(x))
        x = self.relu(self.fc2(x))
        x = self.fc3(x)
        return x

device = "cuda" if torch.cuda.is_available() else "cpu"

num_features = features.shape[1]
num_classes = len(label_encoder.classes_)
model = GenreClassifier(num_features, num_classes).to(device)
model.load_state_dict(torch.load("model.pth", map_location=torch.device("cpu"), weights_only=True))

def extract_segment_features(y, sr=22050):
    seg_features = []
    
    chroma_stft = librosa.feature.chroma_stft(y=y, sr=sr)
    rms = librosa.feature.rms(y=y)
    spectral_centroid = librosa.feature.spectral_centroid(y=y, sr=sr)
    spectral_bandwidth = librosa.feature.spectral_bandwidth(y=y, sr=sr)
    rolloff = librosa.feature.spectral_rolloff(y=y, sr=sr)
    zero_crossing_rate = librosa.feature.zero_crossing_rate(y=y)
    harmony = librosa.effects.harmonic(y=y)
    perceptr = librosa.effects.percussive(y=y)
    tempo, beats = librosa.beat.beat_track(y=y, sr=sr)
    mfccs = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=20)
    
    seg_features.append(np.mean(chroma_stft))
    seg_features.append(np.var(chroma_stft))
    seg_features.append(np.mean(rms))
    seg_features.append(np.var(rms))
    seg_features.append(np.mean(spectral_centroid))
    seg_features.append(np.var(spectral_centroid))
    seg_features.append(np.mean(spectral_bandwidth))
    seg_features.append(np.var(spectral_bandwidth))
    seg_features.append(np.mean(rolloff))
    seg_features.append(np.var(rolloff))
    seg_features.append(np.mean(zero_crossing_rate))
    seg_features.append(np.var(zero_crossing_rate))
    seg_features.append(np.mean(harmony))
    seg_features.append(np.var(harmony))
    seg_features.append(np.mean(perceptr))
    seg_features.append(np.var(perceptr))
    seg_features.extend(tempo)

    for mfcc in mfccs:
        seg_features.append(np.mean(mfcc))
        seg_features.append(np.var(mfcc))

    return seg_features

def extract_full_features(filename):
    y, sr = librosa.load(filename, sr=22050)

    segment_length = 30 * sr
    segments = librosa.util.frame(y, frame_length=segment_length, hop_length=segment_length).T

    with ThreadPoolExecutor() as executor:
        full_features = list(executor.map(extract_segment_features, segments))
    
    return np.mean(full_features, axis=0).reshape(1, -1)

def convert_to_wav(url):
    ydl_opts = {
        "outtmpl": "temp_file.%(ext)s"
    }
    
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        ydl.download([url])
    
    temp_file = "temp_file.webm"
    wav_file = AudioSegment.from_file(temp_file)
    wav_file.export(out_f="output_file.wav", format="wav")
    output_file = "output_file.wav"
    os.remove(temp_file)

    return output_file

@app.route("/predict", methods=["GET"])
def predict():
    url = request.args.get("url")
    if not url:
        return jsonify({"error": "Missing YouTube URL"}), 400

    def generate():
        try:
            yield "event: progress\ndata: Converting to WAV...\n\n"
            song_file = convert_to_wav(url)

            yield "event: progress\ndata: Extracting audio features...\n\n"
            extracted_features = extract_full_features(song_file)
            features_df = pd.DataFrame(extracted_features, columns=features.columns)
            scaled_features = scaler.transform(features_df)
            features_tensor = torch.tensor(scaled_features, dtype=torch.float32).to(device)
            os.remove(song_file)

            yield "event: progress\ndata: Predicting genre...\n\n"
            model.eval()
            with torch.no_grad():
                outputs = model(features_tensor)
                probabilities = torch.nn.functional.softmax(outputs, dim=1)

                genre_probabilities = {
                    label_encoder.inverse_transform([idx])[0]: probability.item() * 100
                    for idx, probability in enumerate(probabilities[0])
                }
                sorted_genre_probabilities = dict(sorted(genre_probabilities.items(), key=lambda x: x[1], reverse=True))

                yield f"event: result\ndata: {json.dumps({'genre_probabilities': sorted_genre_probabilities})}\n\n"

        except Exception as e:
            yield f"event: error\ndata: {str(e)}\n\n"

    return Response(generate(), content_type="text/event-stream")

if __name__ == "__main__":
    app.run(debug=True)
