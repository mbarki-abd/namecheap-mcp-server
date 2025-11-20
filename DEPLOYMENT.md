# Namecheap MCP Server - Deployment Summary

## 🚀 Deployment Information

**Service URL**: https://namecheap-mcp-server-48476833996.us-central1.run.app

**Health Check**: https://namecheap-mcp-server-48476833996.us-central1.run.app/health

**SSE Endpoint**: https://namecheap-mcp-server-48476833996.us-central1.run.app/sse

**GitHub Repository**: https://github.com/mbarki-abd/namecheap-mcp-server

## ✅ Deployment Status

- **Status**: ✅ Successfully Deployed
- **Region**: us-central1 (Iowa, USA)
- **Platform**: Google Cloud Run
- **Environment**: Production (sandbox: false)
- **Deployed**: November 20, 2025

## 🔧 Configuration

### Environment Variables
- `NAMECHEAP_API_USER`: anruy
- `NAMECHEAP_USERNAME`: anruy
- `NAMECHEAP_CLIENT_IP`: 176.183.130.150
- `NAMECHEAP_SANDBOX`: false
- `NAMECHEAP_API_KEY`: Stored in Google Secret Manager

### Google Cloud Resources
- **Project ID**: mcp-servers-477922
- **Service Name**: namecheap-mcp-server
- **Container Registry**: gcr.io/mcp-servers-477922/namecheap-mcp-server
- **Secret**: namecheap-api-key (in Secret Manager)

## 📋 Available Tools (33 total)

### Domain Management (8 tools)
- `namecheap_check_domain` - Check domain availability
- `namecheap_get_domain_info` - Get domain details
- `namecheap_list_domains` - List all domains
- `namecheap_register_domain` - Register new domain
- `namecheap_renew_domain` - Renew domain
- `namecheap_reactivate_domain` - Reactivate expired domain
- `namecheap_get_contacts` - Get contact info
- `namecheap_set_contacts` - Update contacts

### DNS Management (7 tools)
- `namecheap_get_dns_hosts` - Get DNS records
- `namecheap_set_dns_hosts` - Set DNS records
- `namecheap_get_email_forwarding` - Get email forwarding
- `namecheap_set_email_forwarding` - Set email forwarding
- `namecheap_set_custom_dns` - Set custom nameservers
- `namecheap_set_default_dns` - Use default DNS
- `namecheap_get_dns_list` - List DNS servers

### SSL Certificates (5 tools)
- `namecheap_list_ssl_certificates` - List certificates
- `namecheap_get_ssl_info` - Get certificate info
- `namecheap_activate_ssl` - Activate certificate
- `namecheap_reissue_ssl` - Reissue certificate
- `namecheap_renew_ssl` - Renew certificate

### WhoisGuard (3 tools)
- `namecheap_enable_whoisguard` - Enable protection
- `namecheap_disable_whoisguard` - Disable protection
- `namecheap_list_whoisguard` - List subscriptions

### Nameservers (4 tools)
- `namecheap_create_nameserver` - Create nameserver
- `namecheap_delete_nameserver` - Delete nameserver
- `namecheap_get_nameserver_info` - Get nameserver info
- `namecheap_update_nameserver` - Update nameserver IP

### Domain Transfers (3 tools)
- `namecheap_transfer_domain` - Transfer domain
- `namecheap_get_transfer_status` - Check transfer status
- `namecheap_list_transfers` - List transfers

### Account Operations (3 tools)
- `namecheap_get_pricing` - Get pricing
- `namecheap_get_balances` - Get account balance
- `namecheap_get_address_info` - Get address info

## ⚠️ Important Notes

### IP Whitelisting
The current configuration uses IP address **176.183.130.150** which is whitelisted in Namecheap.

**For Production Use**, you should:
1. Set up Cloud NAT with a static IP
2. Whitelist that static IP in Namecheap
3. Update the `NAMECHEAP_CLIENT_IP` environment variable

### Cloud Run IP Ranges
Google Cloud Run doesn't provide static IPs by default. The service will make requests from various IP addresses in the `us-central1` region.

To get consistent IP:
```bash
# Create a static IP
gcloud compute addresses create namecheap-mcp-static-ip --region=us-central1

# Set up Cloud NAT (requires VPC connector)
# See: https://cloud.google.com/run/docs/configuring/static-outbound-ip
```

## 🧪 Testing the Deployment

### Health Check
```bash
curl https://namecheap-mcp-server-48476833996.us-central1.run.app/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2025-11-20T22:50:49.659Z",
  "sandbox": false
}
```

### Test SSE Connection
```bash
curl https://namecheap-mcp-server-48476833996.us-central1.run.app/sse
```

### Check Domain Availability (via MCP client)
```json
{
  "tool": "namecheap_check_domain",
  "arguments": {
    "domains": ["example.com", "mysite.net"]
  }
}
```

## 🔄 Updating the Deployment

### Update Environment Variables
```bash
gcloud run services update namecheap-mcp-server \
  --region us-central1 \
  --set-env-vars NAMECHEAP_CLIENT_IP=new_ip_address \
  --project=mcp-servers-477922
```

### Redeploy with New Code
```bash
# Build new image
gcloud builds submit --tag gcr.io/mcp-servers-477922/namecheap-mcp-server

# Deploy new version
gcloud run deploy namecheap-mcp-server \
  --image gcr.io/mcp-servers-477922/namecheap-mcp-server:latest \
  --region us-central1 \
  --project=mcp-servers-477922
```

## 📊 Monitoring

### View Logs
```bash
gcloud run services logs read namecheap-mcp-server \
  --region us-central1 \
  --project=mcp-servers-477922
```

### View in Console
https://console.cloud.google.com/run/detail/us-central1/namecheap-mcp-server/metrics?project=mcp-servers-477922

## 🔐 Security

- API key stored securely in Google Secret Manager
- Service account has minimal required permissions
- HTTPS enforced by default on Cloud Run
- Environment variables for non-sensitive configuration

## 💰 Cost Estimation

Cloud Run pricing (as of 2025):
- First 2 million requests/month: Free
- CPU: $0.00002400/vCPU-second
- Memory: $0.00000250/GiB-second
- Requests: $0.40 per million

Expected monthly cost for typical usage: **$1-5/month**

## 📝 Next Steps

1. **Set up Cloud NAT** for static outbound IP (recommended for production)
2. **Configure custom domain** if needed
3. **Set up monitoring alerts** for errors and performance
4. **Enable Cloud Run CDN** if needed for global distribution
5. **Configure IAM** for access control if needed

## 🆘 Troubleshooting

### Service not responding
- Check service status: `gcloud run services describe namecheap-mcp-server --region us-central1`
- View logs: `gcloud run services logs read namecheap-mcp-server --region us-central1`

### API errors
- Verify IP is whitelisted in Namecheap
- Check environment variables are set correctly
- Verify secret is accessible

### Deployment fails
- Check Cloud Build logs in GCP Console
- Verify IAM permissions are correct
- Check Docker image builds locally

## 📞 Support

- **MCP Server Issues**: https://github.com/mbarki-abd/namecheap-mcp-server/issues
- **Namecheap API**: https://www.namecheap.com/support/api/
- **Google Cloud Run**: https://cloud.google.com/run/docs
