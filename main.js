const generateQuickNodeDataFetcher = (input) => {
    const { chain, network, dataset, filters } = input;
    const { start_block, end_block } = filters;
  
    let code = [];
    let comments = [];
  
    const baseUrl = 'https://api.quicknode.com/v0';
  
    // Helper functions
    const helperFunctions = `
  const https = require('https');
  const fs = require('fs').promises;
  const path = require('path');
  
  function httpsRequest(url, options, body) {
    return new Promise((resolve, reject) => {
      const req = https.request(url, options, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => resolve(JSON.parse(data)));
      });
      req.on('error', reject);
      if (body) req.write(body);
      req.end();
    });
  }
  
  async function getEndpoint(apiKey) {
    const options = {
      headers: { 'x-api-key': apiKey }
    };
    const response = await httpsRequest(\`${baseUrl}/endpoints\`, options);
    return response.data.find(e => e.chain === '${chain}' && e.network === '${network}');
  }
  
  async function fetchBlockData(rpcUrl, blockNumber) {
    const options = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    };
  
    const blockBody = JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'eth_getBlockByNumber',
      params: ['0x' + blockNumber.toString(16), true]
    });
  
    const blockData = await httpsRequest(rpcUrl, options, blockBody);
  
    const receiptPromises = blockData.result.transactions.map(tx => {
      const receiptBody = JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'eth_getTransactionReceipt',
        params: [tx.hash]
      });
      return httpsRequest(rpcUrl, options, receiptBody);
    });
  
    const receipts = await Promise.all(receiptPromises);
  
    const logsBody = JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'eth_getLogs',
      params: [{ fromBlock: '0x' + blockNumber.toString(16), toBlock: '0x' + blockNumber.toString(16) }]
    });
  
    const logs = await httpsRequest(rpcUrl, options, logsBody);
  
    const debugTraceBody = JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'debug_traceBlockByNumber',
      params: ['0x' + blockNumber.toString(16), { tracer: 'callTracer' }]
    });
  
    const debugTrace = await httpsRequest(rpcUrl, options, debugTraceBody);
  
    const traceBlockBody = JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'trace_block',
      params: ['0x' + blockNumber.toString(16)]
    });
  
    const traceBlock = await httpsRequest(rpcUrl, options, traceBlockBody);
    
    return {
      block: blockData.result,
      transactions: blockData.result.transactions,
      receipts: receipts.map(r => r.result),
      logs: logs.result,
      debugTrace: debugTrace.result,
      traceBlock: traceBlock.result
    };
  }
  
  async function saveBlockData(blockNumber, data) {
    const outputDir = 'quicknode_data';
    await fs.mkdir(outputDir, { recursive: true });
    const fileName = path.join(outputDir, \`block_\${blockNumber}.json\`);
    await fs.writeFile(fileName, JSON.stringify(data, null, 2));
    console.log(\`Data for block \${blockNumber} saved to \${fileName}\`);
  }
    `;
  
    code.push(helperFunctions);
    comments.push('// Helper functions for HTTP requests and data fetching');
  
    // Main function to fetch and save data
    const mainFunction = `
  async function main() {
    // https://dashboard.quicknode.com/api-keys
    const apiKey = 'YOUR_QUICKNODE_API_KEY';
    
    try {
      const endpoint = await getEndpoint(apiKey);
      if (!endpoint) {
        throw new Error('No suitable endpoint found');
      }
  
      for (let blockNumber = ${start_block}; blockNumber <= ${end_block}; blockNumber++) {
        console.log(\`Fetching data for block \${blockNumber}\`);
        const blockData = await fetchBlockData(endpoint.http_url, blockNumber);
        await saveBlockData(blockNumber, blockData);
      }
  
      console.log('All block data has been fetched and saved.');
    } catch (error) {
      console.error('Error:', error);
    }
  }
  
  main();
    `;
  
    code.push(mainFunction);
    comments.push('// Main function to fetch and save data');
  
    return {
      code: code.join('\n\n'),
      comments
    };
  };
  
  // Function to generate code snippets in different languages
  const generateSnippets = (code, language) => {
    switch (language) {
      case 'javascript':
        return code;
  
      case 'python':
        return `
  import aiohttp
  import asyncio
  import json
  import os
  
  ${code.replace(/const /g, '')
       .replace(/async function/g, 'async def')
       .replace(/function /g, 'def ')
       .replace(/\`/g, "'''")
       .replace(/\$\{/g, '{')
       .replace(/\}/g, '}')
       .replace(/console\.log/g, 'print')
       .replace(/require\('https'\)/g, "aiohttp")
       .replace(/require\('fs'\)\.promises/g, "aiofiles")
       .replace(/require\('path'\)/g, "os.path")
       .replace(/httpsRequest/g, 'https_request')
       .replace(/fetchBlockData/g, 'fetch_block_data')
       .replace(/getEndpoint/g, 'get_endpoint')
       .replace(/saveBlockData/g, 'save_block_data')
       .replace(/blockNumber/g, 'block_number')
       .replace(/endpoint\.http_url/g, 'endpoint["http_url"]')
       .replace(/fs\.mkdir/g, 'os.makedirs')
       .replace(/path\.join/g, 'os.path.join')
       .replace(/fs\.writeFile/g, 'async with aiofiles.open(file_name, mode="w") as f:\\n    await f.write(json.dumps(data, indent=2))')}
  
  async def https_request(url, options, body=None):
      async with aiohttp.ClientSession() as session:
          method = options.get('method', 'GET')
          headers = options.get('headers', {})
          async with session.request(method, url, headers=headers, json=json.loads(body) if body else None) as response:
              return await response.json()
  
  asyncio.run(main())
        `;
  
      default:
        return 'Unsupported language';
    }
  };
  
  // Example usage
  const input = {
    chain: "ethereum",
    network: "mainnet",
    dataset: "block_with_receipts",
    filters: {
      start_block: 1000000,
      end_block: 1000010
    }
  };
  
  const result = generateQuickNodeDataFetcher(input);
//   console.log(result.code);
//   console.log(result.comments);
  
  // Generate snippets for each language
  const languages = ['javascript', 'python'];
  const snippets = {};
  languages.forEach(lang => {
    snippets[lang] = generateSnippets(result.code, lang);
  });
  
  console.log(snippets['python']);