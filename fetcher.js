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
  const response = await httpsRequest(`https://api.quicknode.com/v0/endpoints`, options);
  return response.data.find(e => e.chain === 'ethereum' && e.network === 'mainnet');
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
  const fileName = path.join(outputDir, `block_${blockNumber}.json`);
  await fs.writeFile(fileName, JSON.stringify(data, null, 2));
  console.log(`Data for block ${blockNumber} saved to ${fileName}`);
}
  


async function main() {
  //https://dashboard.quicknode.com/api-keys
  const apiKey = 'YOUR_QUICKNODE_API_KEY';
  
  try {
    const endpoint = await getEndpoint(apiKey);
    if (!endpoint) {
      throw new Error('No suitable endpoint found');
    }

    for (let blockNumber = 1000000; blockNumber <= 1000010; blockNumber++) {
      console.log(`Fetching data for block ${blockNumber}`);
      const blockData = await fetchBlockData(endpoint.http_url, blockNumber);
      await saveBlockData(blockNumber, blockData);
    }

    console.log('All block data has been fetched and saved.');
  } catch (error) {
    console.error('Error:', error);
  }
}

main();
  
