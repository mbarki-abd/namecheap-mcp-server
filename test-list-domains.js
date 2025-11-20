import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';

const SERVER_URL = 'https://namecheap-mcp-server-48476833996.us-central1.run.app';

async function testListDomains() {
  console.log('🧪 Testing namecheap_list_domains...\n');
  console.log(`Server URL: ${SERVER_URL}`);
  console.log('=' .repeat(60));

  try {
    // Connect to MCP Server
    console.log('\n📡 Connecting to MCP Server via SSE...');
    const transport = new SSEClientTransport(new URL(`${SERVER_URL}/sse`));
    const client = new Client(
      {
        name: 'namecheap-domain-test',
        version: '1.0.0',
      },
      {
        capabilities: {},
      }
    );

    await client.connect(transport);
    console.log('✅ Successfully connected to MCP server');

    // Test: List all domains
    console.log('\n📋 Calling namecheap_list_domains...');
    console.log('Arguments: { listType: "ALL", page: 1, pageSize: 20 }');

    const result = await client.callTool({
      name: 'namecheap_list_domains',
      arguments: {
        listType: 'ALL',
        page: 1,
        pageSize: 20
      }
    });

    console.log('\n📊 Result:');
    console.log('='.repeat(60));

    if (result.isError) {
      console.log('❌ Error:', result.content[0].text);
    } else {
      console.log('✅ Success!');
      const responseText = result.content[0].text;
      const parsedResponse = JSON.parse(responseText);
      console.log(JSON.stringify(parsedResponse, null, 2));
    }

    // Close connection
    await client.close();
    console.log('\n✅ Connection closed successfully');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

// Run the test
testListDomains().catch(console.error);
