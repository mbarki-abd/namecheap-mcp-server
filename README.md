# Namecheap MCP Server

A comprehensive Model Context Protocol (MCP) server for the Namecheap API, providing full access to domain management, DNS configuration, SSL certificates, and more. Designed for deployment on Google Cloud Run with SSE (Server-Sent Events) protocol support.

## Features

### Domain Management
- Check domain availability
- Register new domains
- Renew domains
- Get domain information
- List all domains
- Reactivate expired domains
- Manage domain contacts
- Transfer domains to Namecheap

### DNS Management
- Get/Set DNS host records
- Configure custom nameservers
- Set default Namecheap DNS
- Manage email forwarding
- Create/delete/update nameservers

### SSL Certificates
- List SSL certificates
- Get certificate information
- Activate SSL certificates
- Reissue certificates
- Renew certificates

### WhoisGuard
- Enable/disable WhoisGuard
- List WhoisGuard subscriptions

### Account Management
- Get pricing information
- Check account balances
- Manage address information

## Requirements

- Node.js 18 or higher
- Namecheap API credentials
- Google Cloud Platform account (for deployment)

## Getting Namecheap API Credentials

1. Log in to your Namecheap account
2. Go to Profile → Tools → Business & Dev Tools → API Access
3. Enable API access
4. Whitelist your server's IP address
5. Copy your API credentials:
   - API User
   - API Key
   - Username
   - Whitelisted IP

## Local Development

### Installation

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Start the server
npm start
```

### Environment Variables

Create a `.env` file (not included in the repository):

```env
NAMECHEAP_API_USER=your_api_user
NAMECHEAP_API_KEY=your_api_key
NAMECHEAP_USERNAME=your_username
NAMECHEAP_CLIENT_IP=your_whitelisted_ip
NAMECHEAP_SANDBOX=true  # Set to false for production
PORT=8080
```

### Testing Locally

```bash
# Health check
curl http://localhost:8080/health

# Test SSE connection
curl http://localhost:8080/sse
```

## Google Cloud Run Deployment

### Prerequisites

1. Install [Google Cloud SDK](https://cloud.google.com/sdk/docs/install)
2. Authenticate with Google Cloud:
   ```bash
   gcloud auth login
   gcloud config set project YOUR_PROJECT_ID
   ```

### Deployment Steps

1. **Set environment variables:**
   ```bash
   export NAMECHEAP_API_USER="your_api_user"
   export NAMECHEAP_USERNAME="your_username"
   export NAMECHEAP_CLIENT_IP="your_whitelisted_ip"
   export NAMECHEAP_API_KEY="your_api_key"
   export NAMECHEAP_SANDBOX="false"  # or "true" for sandbox
   export GCP_PROJECT_ID="your-gcp-project"
   export GCP_REGION="us-central1"
   ```

2. **Run deployment script:**
   ```bash
   chmod +x deploy.sh
   ./deploy.sh
   ```

### Manual Deployment

```bash
# Build and push Docker image
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/namecheap-mcp-server

# Create secret for API key
echo -n "your_api_key" | gcloud secrets create namecheap-api-key --data-file=-

# Deploy to Cloud Run
gcloud run deploy namecheap-mcp-server \
  --image gcr.io/YOUR_PROJECT_ID/namecheap-mcp-server \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated \
  --set-env-vars NAMECHEAP_API_USER=your_api_user,NAMECHEAP_USERNAME=your_username,NAMECHEAP_CLIENT_IP=your_ip,NAMECHEAP_SANDBOX=false \
  --set-secrets NAMECHEAP_API_KEY=namecheap-api-key:latest
```

## Using the MCP Server

### Available Tools

#### Domain Operations
- `namecheap_check_domain` - Check if domains are available
- `namecheap_get_domain_info` - Get detailed domain information
- `namecheap_list_domains` - List all domains in account
- `namecheap_register_domain` - Register a new domain
- `namecheap_renew_domain` - Renew an existing domain
- `namecheap_reactivate_domain` - Reactivate an expired domain
- `namecheap_get_contacts` - Get domain contact information
- `namecheap_set_contacts` - Update domain contacts

#### DNS Operations
- `namecheap_get_dns_hosts` - Get DNS host records
- `namecheap_set_dns_hosts` - Set DNS host records
- `namecheap_get_email_forwarding` - Get email forwarding config
- `namecheap_set_email_forwarding` - Configure email forwarding
- `namecheap_set_custom_dns` - Set custom nameservers
- `namecheap_set_default_dns` - Use Namecheap default DNS
- `namecheap_get_dns_list` - List DNS servers

#### SSL Operations
- `namecheap_list_ssl_certificates` - List SSL certificates
- `namecheap_get_ssl_info` - Get SSL certificate details
- `namecheap_activate_ssl` - Activate an SSL certificate
- `namecheap_reissue_ssl` - Reissue a certificate
- `namecheap_renew_ssl` - Renew a certificate

#### WhoisGuard Operations
- `namecheap_enable_whoisguard` - Enable WhoisGuard protection
- `namecheap_disable_whoisguard` - Disable WhoisGuard
- `namecheap_list_whoisguard` - List WhoisGuard subscriptions

#### Nameserver Operations
- `namecheap_create_nameserver` - Create a nameserver
- `namecheap_delete_nameserver` - Delete a nameserver
- `namecheap_get_nameserver_info` - Get nameserver info
- `namecheap_update_nameserver` - Update nameserver IP

#### Transfer Operations
- `namecheap_transfer_domain` - Transfer domain to Namecheap
- `namecheap_get_transfer_status` - Check transfer status
- `namecheap_list_transfers` - List all transfers

#### Account Operations
- `namecheap_get_pricing` - Get product pricing
- `namecheap_get_balances` - Get account balances
- `namecheap_get_address_info` - Get address information

### Example Usage

```typescript
// Check domain availability
{
  "tool": "namecheap_check_domain",
  "arguments": {
    "domains": ["example.com", "mysite.net"]
  }
}

// Register a domain
{
  "tool": "namecheap_register_domain",
  "arguments": {
    "domainName": "example.com",
    "years": 1,
    "registrantFirstName": "John",
    "registrantLastName": "Doe",
    "registrantAddress1": "123 Main St",
    "registrantCity": "New York",
    "registrantStateProvince": "NY",
    "registrantPostalCode": "10001",
    "registrantCountry": "US",
    "registrantPhone": "+1.2125551234",
    "registrantEmailAddress": "john@example.com"
  }
}

// Set DNS records
{
  "tool": "namecheap_set_dns_hosts",
  "arguments": {
    "sld": "example",
    "tld": "com",
    "hosts": [
      {
        "hostName": "@",
        "recordType": "A",
        "address": "192.0.2.1",
        "ttl": 1800
      },
      {
        "hostName": "www",
        "recordType": "CNAME",
        "address": "example.com.",
        "ttl": 1800
      }
    ]
  }
}
```

## Architecture

- **Express Server**: HTTP server for SSE connections
- **MCP SDK**: Model Context Protocol implementation
- **SSE Transport**: Server-Sent Events for real-time communication
- **Namecheap Client**: Comprehensive API wrapper
- **XML Parser**: Handles Namecheap's XML responses

## Security Notes

- API keys are stored as Google Cloud Secrets
- Environment variables for non-sensitive configuration
- IP whitelisting required by Namecheap
- Use sandbox mode for testing

## Troubleshooting

### Common Issues

1. **API Authentication Errors**
   - Verify API credentials are correct
   - Ensure your IP is whitelisted in Namecheap
   - Check if API access is enabled in your account

2. **Connection Errors**
   - Verify network connectivity
   - Check if using correct endpoint (sandbox vs production)
   - Ensure firewall allows outbound connections

3. **Domain Operation Failures**
   - Verify domain format is correct
   - Check account balance for purchases
   - Ensure domain is eligible for the operation

## Development

### Project Structure

```
namecheap-mcp-server/
├── src/
│   ├── index.ts              # Main server and MCP setup
│   └── namecheap-client.ts   # Namecheap API client
├── Dockerfile                 # Container configuration
├── cloudbuild.yaml           # Google Cloud Build config
├── deploy.sh                 # Deployment script
├── package.json              # Dependencies
└── tsconfig.json             # TypeScript configuration
```

### Building

```bash
npm run build    # Build TypeScript
npm run dev      # Watch mode
npm run clean    # Clean build artifacts
```

## License

MIT

## Support

For issues related to:
- **This MCP server**: Open an issue on GitHub
- **Namecheap API**: Contact Namecheap support
- **MCP Protocol**: Visit [Model Context Protocol docs](https://modelcontextprotocol.io)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
