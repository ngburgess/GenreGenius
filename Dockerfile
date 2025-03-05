# Use an official Python runtime as a parent image
FROM python:3.11

# Install Rust and Cargo before installing Python dependencies
RUN apt-get update && apt-get install -y cargo

# Set the working directory in the container
WORKDIR /app

# Copy the current directory contents into the container at /app
COPY . /app

# Install any needed dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Expose port 5000 for Flask
EXPOSE 5000

# Command to run the app
CMD ["python", "app.py"]
