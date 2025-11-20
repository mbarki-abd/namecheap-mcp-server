#!/bin/bash

# Namecheap MCP Server - Google Cloud Run Deployment Script

set -e

echo "=== Namecheap MCP Server Deployment ==="

# Check if required environment variables are set
if [ -z "$NAMECHEAP_API_USER" ]; then
  echo "Error: NAMECHEAP_API_USER environment variable is not set"
  exit 1
fi

if [ -z "$NAMECHEAP_USERNAME" ]; then
  echo "Error: NAMECHEAP_USERNAME environment variable is not set"
  exit 1
fi

if [ -z "$NAMECHEAP_CLIENT_IP" ]; then
  echo "Error: NAMECHEAP_CLIENT_IP environment variable is not set"
  exit 1
fi

if [ -z "$NAMECHEAP_API_KEY" ]; then
  echo "Error: NAMECHEAP_API_KEY environment variable is not set"
  exit 1
fi

# Set default values
PROJECT_ID=${GCP_PROJECT_ID:-$(gcloud config get-value project)}
REGION=${GCP_REGION:-us-central1}
SERVICE_NAME="namecheap-mcp-server"
NAMECHEAP_SANDBOX=${NAMECHEAP_SANDBOX:-false}

echo "Project ID: $PROJECT_ID"
echo "Region: $REGION"
echo "Service Name: $SERVICE_NAME"
echo "Sandbox Mode: $NAMECHEAP_SANDBOX"

# Enable required APIs
echo "Enabling required Google Cloud APIs..."
gcloud services enable cloudbuild.googleapis.com --project=$PROJECT_ID
gcloud services enable run.googleapis.com --project=$PROJECT_ID
gcloud services enable secretmanager.googleapis.com --project=$PROJECT_ID

# Create or update the API key secret
echo "Creating/updating Namecheap API key secret..."
echo -n "$NAMECHEAP_API_KEY" | gcloud secrets create namecheap-api-key \
  --data-file=- \
  --project=$PROJECT_ID 2>/dev/null || \
echo -n "$NAMECHEAP_API_KEY" | gcloud secrets versions add namecheap-api-key \
  --data-file=- \
  --project=$PROJECT_ID

# Build and deploy using Cloud Build
echo "Building and deploying to Cloud Run..."
gcloud builds submit \
  --config=cloudbuild.yaml \
  --project=$PROJECT_ID \
  --substitutions=_NAMECHEAP_API_USER="$NAMECHEAP_API_USER",_NAMECHEAP_USERNAME="$NAMECHEAP_USERNAME",_NAMECHEAP_CLIENT_IP="$NAMECHEAP_CLIENT_IP",_NAMECHEAP_SANDBOX="$NAMECHEAP_SANDBOX"

# Get the service URL
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME \
  --region=$REGION \
  --project=$PROJECT_ID \
  --format='value(status.url)')

echo ""
echo "=== Deployment Complete ==="
echo "Service URL: $SERVICE_URL"
echo "Health Check: $SERVICE_URL/health"
echo "SSE Endpoint: $SERVICE_URL/sse"
echo ""
echo "To test the deployment:"
echo "curl $SERVICE_URL/health"
