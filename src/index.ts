import express from 'express';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { NamecheapClient } from './namecheap-client.js';
import { z } from 'zod';

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 8080;
const API_USER = process.env.NAMECHEAP_API_USER;
const API_KEY = process.env.NAMECHEAP_API_KEY;
const USERNAME = process.env.NAMECHEAP_USERNAME;
const CLIENT_IP = process.env.NAMECHEAP_CLIENT_IP;
const SANDBOX = process.env.NAMECHEAP_SANDBOX === 'true';

if (!API_USER || !API_KEY || !USERNAME || !CLIENT_IP) {
  console.error('ERROR: Required environment variables:');
  console.error('  - NAMECHEAP_API_USER');
  console.error('  - NAMECHEAP_API_KEY');
  console.error('  - NAMECHEAP_USERNAME');
  console.error('  - NAMECHEAP_CLIENT_IP');
  process.exit(1);
}

const namecheapClient = new NamecheapClient({
  apiUser: API_USER,
  apiKey: API_KEY,
  userName: USERNAME,
  clientIp: CLIENT_IP,
  sandbox: SANDBOX,
});

app.get('/health', (_req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    sandbox: SANDBOX
  });
});

// Store transports by session ID
const transports: Record<string, SSEServerTransport> = {};

// Create MCP server with all tools registered
function createMCPServer() {
  const server = new McpServer(
    {
      name: 'namecheap-mcp-server',
      version: '1.0.0',
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // ==================== DOMAIN TOOLS ====================

  server.tool(
    'namecheap_check_domain',
    'Check availability of one or more domains',
    {
      domains: z.array(z.string()).describe('Array of domain names to check'),
    },
    async (args) => {
      const result = await namecheapClient.checkDomain(args.domains);
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  server.tool(
    'namecheap_get_domain_info',
    'Get detailed information about a domain',
    {
      domainName: z.string().describe('Domain name (e.g., example.com)'),
    },
    async (args) => {
      const result = await namecheapClient.getDomainInfo(args.domainName);
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  server.tool(
    'namecheap_list_domains',
    'List all domains in the account',
    {
      listType: z.string().optional().describe('Filter type: ALL, EXPIRING, EXPIRED'),
      searchTerm: z.string().optional().describe('Search term to filter domains'),
      page: z.number().optional().describe('Page number (default: 1)'),
      pageSize: z.number().optional().describe('Results per page (default: 20)'),
      sortBy: z.string().optional().describe('Sort field'),
    },
    async (args) => {
      const result = await namecheapClient.listDomains(args);
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  server.tool(
    'namecheap_register_domain',
    'Register a new domain',
    {
      domainName: z.string().describe('Domain name to register'),
      years: z.number().describe('Number of years to register'),
      registrantFirstName: z.string().describe('Registrant first name'),
      registrantLastName: z.string().describe('Registrant last name'),
      registrantAddress1: z.string().describe('Registrant address'),
      registrantCity: z.string().describe('Registrant city'),
      registrantStateProvince: z.string().describe('Registrant state/province'),
      registrantPostalCode: z.string().describe('Registrant postal code'),
      registrantCountry: z.string().describe('Registrant country (2-letter code)'),
      registrantPhone: z.string().describe('Registrant phone number'),
      registrantEmailAddress: z.string().describe('Registrant email address'),
      nameservers: z.array(z.string()).optional().describe('Custom nameservers'),
      addFreeWhoisguard: z.boolean().optional().describe('Add free WhoisGuard if available'),
      wgEnabled: z.boolean().optional().describe('Enable WhoisGuard'),
    },
    async (args) => {
      const result = await namecheapClient.registerDomain(args);
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  server.tool(
    'namecheap_renew_domain',
    'Renew an existing domain',
    {
      domainName: z.string().describe('Domain name to renew'),
      years: z.number().describe('Number of years to renew'),
    },
    async (args) => {
      const result = await namecheapClient.renewDomain(args.domainName, args.years);
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  server.tool(
    'namecheap_reactivate_domain',
    'Reactivate an expired domain',
    {
      domainName: z.string().describe('Domain name to reactivate'),
    },
    async (args) => {
      const result = await namecheapClient.reactivateDomain(args.domainName);
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  server.tool(
    'namecheap_get_contacts',
    'Get contact information for a domain',
    {
      domainName: z.string().describe('Domain name'),
    },
    async (args) => {
      const result = await namecheapClient.getContacts(args.domainName);
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  server.tool(
    'namecheap_set_contacts',
    'Update contact information for a domain',
    {
      domainName: z.string().describe('Domain name'),
      contacts: z.any().describe('Contact information object'),
    },
    async (args) => {
      const result = await namecheapClient.setContacts(args.domainName, args.contacts);
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  // ==================== DNS TOOLS ====================

  server.tool(
    'namecheap_get_dns_hosts',
    'Get DNS host records for a domain',
    {
      sld: z.string().describe('Second-level domain (e.g., "example" from example.com)'),
      tld: z.string().describe('Top-level domain (e.g., "com" from example.com)'),
    },
    async (args) => {
      const result = await namecheapClient.getHosts(args.sld, args.tld);
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  server.tool(
    'namecheap_set_dns_hosts',
    'Set DNS host records for a domain',
    {
      sld: z.string().describe('Second-level domain'),
      tld: z.string().describe('Top-level domain'),
      hosts: z.array(z.object({
        hostName: z.string(),
        recordType: z.string(),
        address: z.string(),
        mxPref: z.number().optional(),
        ttl: z.number().optional(),
      })).describe('Array of host records'),
    },
    async (args) => {
      const result = await namecheapClient.setHosts(args.sld, args.tld, args.hosts);
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  server.tool(
    'namecheap_get_email_forwarding',
    'Get email forwarding configuration',
    {
      domainName: z.string().describe('Domain name'),
    },
    async (args) => {
      const result = await namecheapClient.getEmailForwarding(args.domainName);
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  server.tool(
    'namecheap_set_email_forwarding',
    'Set email forwarding rules',
    {
      domainName: z.string().describe('Domain name'),
      mailboxes: z.array(z.object({
        mailbox: z.string(),
        forwardTo: z.string(),
      })).describe('Email forwarding rules'),
    },
    async (args) => {
      const result = await namecheapClient.setEmailForwarding(args.domainName, args.mailboxes);
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  server.tool(
    'namecheap_set_custom_dns',
    'Set custom nameservers for a domain',
    {
      sld: z.string().describe('Second-level domain'),
      tld: z.string().describe('Top-level domain'),
      nameservers: z.array(z.string()).describe('Array of nameserver hostnames'),
    },
    async (args) => {
      const result = await namecheapClient.setCustomDNS(args.sld, args.tld, args.nameservers);
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  server.tool(
    'namecheap_set_default_dns',
    'Set domain to use Namecheap default DNS',
    {
      sld: z.string().describe('Second-level domain'),
      tld: z.string().describe('Top-level domain'),
    },
    async (args) => {
      const result = await namecheapClient.setDefaultDNS(args.sld, args.tld);
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  server.tool(
    'namecheap_get_dns_list',
    'Get list of DNS servers for a domain',
    {
      sld: z.string().describe('Second-level domain'),
      tld: z.string().describe('Top-level domain'),
    },
    async (args) => {
      const result = await namecheapClient.getDNSList(args.sld, args.tld);
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  // ==================== SSL CERTIFICATE TOOLS ====================

  server.tool(
    'namecheap_list_ssl_certificates',
    'List all SSL certificates',
    {
      listType: z.string().optional().describe('Filter type: ALL, Processing, EmailSent, etc.'),
      searchTerm: z.string().optional().describe('Search term'),
      page: z.number().optional().describe('Page number'),
      pageSize: z.number().optional().describe('Results per page'),
      sortBy: z.string().optional().describe('Sort field'),
    },
    async (args) => {
      const result = await namecheapClient.getSSLList(args);
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  server.tool(
    'namecheap_get_ssl_info',
    'Get information about an SSL certificate',
    {
      certificateId: z.number().describe('Certificate ID'),
    },
    async (args) => {
      const result = await namecheapClient.getSSLInfo(args.certificateId);
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  server.tool(
    'namecheap_activate_ssl',
    'Activate an SSL certificate',
    {
      certificateId: z.number().describe('Certificate ID'),
      csr: z.string().describe('Certificate Signing Request'),
      adminEmailAddress: z.string().describe('Admin email address'),
      webServerType: z.string().describe('Web server type (e.g., nginx, apache)'),
      approverEmail: z.string().optional().describe('Approver email address'),
    },
    async (args) => {
      const result = await namecheapClient.activateSSL(args);
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  server.tool(
    'namecheap_reissue_ssl',
    'Reissue an SSL certificate',
    {
      certificateId: z.number().describe('Certificate ID'),
      csr: z.string().describe('Certificate Signing Request'),
      webServerType: z.string().describe('Web server type'),
      approverEmail: z.string().optional().describe('Approver email address'),
    },
    async (args) => {
      const result = await namecheapClient.reissueSSL(args);
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  server.tool(
    'namecheap_renew_ssl',
    'Renew an SSL certificate',
    {
      certificateId: z.number().describe('Certificate ID'),
      years: z.number().describe('Number of years'),
      sslType: z.string().describe('SSL certificate type'),
    },
    async (args) => {
      const result = await namecheapClient.renewSSL(args.certificateId, args.years, args.sslType);
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  // ==================== WHOISGUARD TOOLS ====================

  server.tool(
    'namecheap_enable_whoisguard',
    'Enable WhoisGuard for a domain',
    {
      whoisguardId: z.number().describe('WhoisGuard ID'),
      forwardedToEmail: z.string().describe('Email address to forward to'),
    },
    async (args) => {
      const result = await namecheapClient.enableWhoisguard(args.whoisguardId, args.forwardedToEmail);
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  server.tool(
    'namecheap_disable_whoisguard',
    'Disable WhoisGuard for a domain',
    {
      whoisguardId: z.number().describe('WhoisGuard ID'),
    },
    async (args) => {
      const result = await namecheapClient.disableWhoisguard(args.whoisguardId);
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  server.tool(
    'namecheap_list_whoisguard',
    'List all WhoisGuard subscriptions',
    {
      listType: z.string().optional().describe('Filter type: ALL, FREE, PAID'),
      page: z.number().optional().describe('Page number'),
      pageSize: z.number().optional().describe('Results per page'),
    },
    async (args) => {
      const result = await namecheapClient.getWhoisguardList(args);
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  // ==================== NAMESERVER TOOLS ====================

  server.tool(
    'namecheap_create_nameserver',
    'Create a nameserver for a domain',
    {
      sld: z.string().describe('Second-level domain'),
      tld: z.string().describe('Top-level domain'),
      nameserver: z.string().describe('Nameserver hostname'),
      ip: z.string().describe('IP address'),
    },
    async (args) => {
      const result = await namecheapClient.createNameserver(args.sld, args.tld, args.nameserver, args.ip);
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  server.tool(
    'namecheap_delete_nameserver',
    'Delete a nameserver',
    {
      sld: z.string().describe('Second-level domain'),
      tld: z.string().describe('Top-level domain'),
      nameserver: z.string().describe('Nameserver hostname'),
    },
    async (args) => {
      const result = await namecheapClient.deleteNameserver(args.sld, args.tld, args.nameserver);
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  server.tool(
    'namecheap_get_nameserver_info',
    'Get nameserver information',
    {
      sld: z.string().describe('Second-level domain'),
      tld: z.string().describe('Top-level domain'),
      nameserver: z.string().describe('Nameserver hostname'),
    },
    async (args) => {
      const result = await namecheapClient.getNameserverInfo(args.sld, args.tld, args.nameserver);
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  server.tool(
    'namecheap_update_nameserver',
    'Update nameserver IP address',
    {
      sld: z.string().describe('Second-level domain'),
      tld: z.string().describe('Top-level domain'),
      nameserver: z.string().describe('Nameserver hostname'),
      oldIP: z.string().describe('Current IP address'),
      newIP: z.string().describe('New IP address'),
    },
    async (args) => {
      const result = await namecheapClient.updateNameserver(args.sld, args.tld, args.nameserver, args.oldIP, args.newIP);
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  // ==================== DOMAIN TRANSFER TOOLS ====================

  server.tool(
    'namecheap_transfer_domain',
    'Transfer a domain to Namecheap',
    {
      domainName: z.string().describe('Domain name to transfer'),
      eppCode: z.string().describe('EPP/Auth code from current registrar'),
      years: z.number().optional().describe('Number of years (default: 1)'),
      registrantFirstName: z.string().describe('Registrant first name'),
      registrantLastName: z.string().describe('Registrant last name'),
      registrantAddress1: z.string().describe('Registrant address'),
      registrantCity: z.string().describe('Registrant city'),
      registrantStateProvince: z.string().describe('Registrant state/province'),
      registrantPostalCode: z.string().describe('Registrant postal code'),
      registrantCountry: z.string().describe('Registrant country (2-letter code)'),
      registrantPhone: z.string().describe('Registrant phone number'),
      registrantEmailAddress: z.string().describe('Registrant email address'),
    },
    async (args) => {
      const result = await namecheapClient.transferDomain(args);
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  server.tool(
    'namecheap_get_transfer_status',
    'Get transfer status for a domain',
    {
      domainName: z.string().describe('Domain name'),
    },
    async (args) => {
      const result = await namecheapClient.getTransferStatus(args.domainName);
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  server.tool(
    'namecheap_list_transfers',
    'List all domain transfers',
    {
      listType: z.string().optional().describe('Filter type: ALL, INPROGRESS, COMPLETED, etc.'),
      searchTerm: z.string().optional().describe('Search term'),
      page: z.number().optional().describe('Page number'),
      pageSize: z.number().optional().describe('Results per page'),
    },
    async (args) => {
      const result = await namecheapClient.getTransferList(args);
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  // ==================== USER TOOLS ====================

  server.tool(
    'namecheap_get_pricing',
    'Get pricing information for products',
    {
      productType: z.string().describe('Product type (e.g., DOMAIN, SSL)'),
      productCategory: z.string().optional().describe('Product category'),
    },
    async (args) => {
      const result = await namecheapClient.getPricing(args.productType, args.productCategory);
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  server.tool(
    'namecheap_get_balances',
    'Get account balance information',
    {},
    async () => {
      const result = await namecheapClient.getBalances();
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  server.tool(
    'namecheap_get_address_info',
    'Get address information from account',
    {
      addressId: z.number().optional().describe('Address ID (optional)'),
    },
    async (args) => {
      const result = await namecheapClient.getAddressInfo(args.addressId);
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  return server;
}

// SSE endpoint for establishing the stream
app.get('/sse', async (_req, res) => {
  console.log('Received GET request to /sse (establishing SSE stream)');

  try {
    const transport = new SSEServerTransport('/message', res);
    const sessionId = transport.sessionId;
    transports[sessionId] = transport;
    console.log(`Created SSE transport with session ID: ${sessionId}`);

    transport.onclose = () => {
      console.log(`SSE transport closed for session ${sessionId}`);
      delete transports[sessionId];
    };

    const server = createMCPServer();
    await server.connect(transport);

    console.log(`Established SSE stream with session ID: ${sessionId}`);
  } catch (error) {
    console.error('Error establishing SSE stream:', error);
    if (!res.headersSent) {
      res.status(500).send('Error establishing SSE stream');
    }
  }
});

// Message endpoint for receiving client JSON-RPC requests
app.post('/message', async (req, res) => {
  console.log('Received POST request to /message');

  const sessionId = req.query.sessionId as string;

  if (!sessionId) {
    console.error('No session ID provided in request URL');
    res.status(400).send('Missing sessionId parameter');
    return;
  }

  const transport = transports[sessionId];

  if (!transport) {
    console.error(`No active transport found for session ID: ${sessionId}`);
    res.status(404).send('Session not found');
    return;
  }

  try {
    await transport.handlePostMessage(req, res, req.body);
  } catch (error) {
    console.error('Error handling request:', error);
    if (!res.headersSent) {
      res.status(500).send('Error handling request');
    }
  }
});

app.listen(PORT, () => {
  console.log(`Namecheap MCP Server running on port ${PORT}`);
  console.log(`Environment: ${SANDBOX ? 'SANDBOX' : 'PRODUCTION'}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`SSE endpoint: http://localhost:${PORT}/sse`);
});

// Handle server shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down server...');
  for (const sessionId in transports) {
    try {
      console.log(`Closing transport for session ${sessionId}`);
      await transports[sessionId].close();
      delete transports[sessionId];
    } catch (error) {
      console.error(`Error closing transport for session ${sessionId}:`, error);
    }
  }
  console.log('Server shutdown complete');
  process.exit(0);
});
