# Why it exists:
# This Dockerfile configures a container image for our Python FastAPI backend.
# By containerizing the app, we ensure it runs identically in local dev and production on AWS EC2.

# 1. Use the official lightweight Python 3.11 image as the base.
# Slim version reduces image size, minimizing download time and surface vulnerabilities.
FROM python:3.11-slim

# 2. Set environment variables.
# PYTHONDONTWRITEBYTECODE prevents Python from writing .pyc files to disk.
# PYTHONUNBUFFERED ensures console logs are printed in real-time (not buffered).
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# 3. Set the working directory inside the container.
WORKDIR /backend

# 4. Install system dependencies required for database connections.
# build-essential and libpq-dev are needed to compile psycopg2-binary on some architectures.
# We clean up apt cache in the same layer to keep the image slim.
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# 5. Copy requirements.txt to the working directory.
# Copying dependencies first leverages Docker's layer caching to speed up subsequent builds.
COPY requirements.txt .

# 6. Install Python package dependencies.
# --no-cache-dir avoids caching wheels, keeping the final container small.
RUN pip install --no-cache-dir -r requirements.txt

# 7. Copy the rest of the backend codebase into the container working directory.
COPY . .

# 8. Expose port 8000.
# Tells Docker that the container listens on port 8000 at runtime.
EXPOSE 8000

# 9. Define the default startup command.
# Runs the production-grade Uvicorn server, binding it to 0.0.0.0 (all interfaces) on port 8000.
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
