# Namecheap IP Whitelisting Guide

## Current Status

✅ **MCP Server is running and healthy**
✅ **All 33 tools are available**
⚠️ **IP whitelisting needed for API calls**

## Cloud Run IP Address

Your Cloud Run service is currently using IP: **34.96.44.115**

This IP needs to be whitelisted in your Namecheap account for API calls to work.

## Quick Fix: Whitelist Cloud Run IP

### Step 1: Add IP to Namecheap
1. Go to https://ap.www.namecheap.com/settings/tools/apiaccess/
2. Add IP address: **34.96.44.115**
3. Save the changes

### Step 2: Test Again
```bash
node test-mcp-client.js
```

## ⚠️ Important Considerations

### Problem: Cloud Run IPs Can Change
Google Cloud Run doesn't guarantee static IPs. The service may use different IPs for outbound requests:
- Current IP: **34.96.44.115**
- Region: us-central1
- IPs can rotate

### Solutions

#### Option 1: Whitelist IP Range (Temporary)
Whitelist the entire us-central1 region IP range:
- This is less secure but simpler
- Check Google Cloud's IP ranges: https://www.gstatic.com/ipranges/cloud.json

#### Option 2: Static IP with Cloud NAT (Recommended for Production)

This is the **permanent solution** that ensures a consistent IP address.

##### Step-by-Step Setup:

**1. Create a static IP address:**
```bash
gcloud compute addresses create namecheap-mcp-nat-ip \
  --region=us-central1 \
  --project=mcp-servers-477922
```

**2. Get the static IP:**
```bash
gcloud compute addresses describe namecheap-mcp-nat-ip \
  --region=us-central1 \
  --project=mcp-servers-477922 \
  --format="get(address)"
```

**3. Create a VPC network (if you don't have one):**
```bash
gcloud compute networks create namecheap-vpc \
  --subnet-mode=custom \
  --project=mcp-servers-477922
```

**4. Create a subnet:**
```bash
gcloud compute networks subnets create namecheap-subnet \
  --network=namecheap-vpc \
  --region=us-central1 \
  --range=10.8.0.0/28 \
  --project=mcp-servers-477922
```

**5. Create a Cloud Router:**
```bash
gcloud compute routers create namecheap-router \
  --network=namecheap-vpc \
  --region=us-central1 \
  --project=mcp-servers-477922
```

**6. Create Cloud NAT:**
```bash
gcloud compute routers nats create namecheap-nat \
  --router=namecheap-router \
  --region=us-central1 \
  --nat-external-ip-pool=namecheap-mcp-nat-ip \
  --nat-all-subnet-ip-ranges \
  --project=mcp-servers-477922
```

**7. Create a Serverless VPC Connector:**
```bash
gcloud compute networks vpc-access connectors create namecheap-connector \
  --network=namecheap-vpc \
  --region=us-central1 \
  --range=10.8.0.0/28 \
  --project=mcp-servers-477922
```

**8. Update Cloud Run service to use VPC connector:**
```bash
gcloud run services update namecheap-mcp-server \
  --vpc-connector=namecheap-connector \
  --vpc-egress=all-traffic \
  --region=us-central1 \
  --project=mcp-servers-477922
```

**9. Get your new static IP and whitelist it:**
```bash
gcloud compute addresses describe namecheap-mcp-nat-ip \
  --region=us-central1 \
  --project=mcp-servers-477922 \
  --format="get(address)"
```

**10. Update the environment variable:**
```bash
# Use the IP from step 9
gcloud run services update namecheap-mcp-server \
  --set-env-vars NAMECHEAP_CLIENT_IP=YOUR_STATIC_IP \
  --region=us-central1 \
  --project=mcp-servers-477922
```

**11. Whitelist the static IP in Namecheap**

#### Option 3: Use Sandbox Mode for Testing
If you just want to test functionality without dealing with production API:

```bash
gcloud run services update namecheap-mcp-server \
  --set-env-vars NAMECHEAP_SANDBOX=true \
  --region=us-central1 \
  --project=mcp-servers-477922
```

Sandbox mode uses different API endpoints and may have different IP requirements.

## Current Configuration

- **Configured IP**: 176.183.130.150 (your local IP)
- **Actual Cloud Run IP**: 34.96.44.115
- **Environment**: Production (sandbox: false)

## Cost Estimate for Cloud NAT

- **Static IP**: ~$4/month (reserved IP)
- **VPC Connector**: ~$8/month (minimum)
- **Cloud NAT**: ~$0.045/hour (~$33/month) + data processing

**Total: ~$45/month** for guaranteed static IP

## Recommended Immediate Actions

### For Testing (Quick):
1. Add `34.96.44.115` to Namecheap whitelist
2. Test your tools

### For Production (Permanent):
1. Set up Cloud NAT (follow steps above)
2. Whitelist the static IP
3. Update environment variable
4. Test and verify

## Monitoring IPs

To see which IP Cloud Run is using:
```bash
# Check recent logs
gcloud run services logs read namecheap-mcp-server \
  --region=us-central1 \
  --project=mcp-servers-477922 \
  --limit=50
```

## Testing After Whitelisting

Run the test client:
```bash
node test-mcp-client.js
```

Expected output:
- ✅ All tools listed (33 tools)
- ✅ Domain check returns actual availability data
- ✅ Balance check returns your account info

## Support

- **Namecheap API Docs**: https://www.namecheap.com/support/api/
- **Cloud NAT Docs**: https://cloud.google.com/nat/docs/overview
- **Cloud Run VPC**: https://cloud.google.com/run/docs/configuring/vpc-connectors
