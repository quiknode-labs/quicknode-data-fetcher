# QuickNode Data Fetcher (Streams to RPC)

## Description

QuickNode Data Fetcher is a tool designed to fetch comprehensive blockchain data using QuickNode's RPC endpoints. This tool addresses vendor lock-in concerns by demonstrating how to retrieve data typically provided by QuickNode Streams using standard RPC calls.

## Features

- Fetches detailed block data including:
  - Block information
  - Transactions
  - Transaction receipts
  - Logs
  - Debug traces
  - Block traces
- Uses QuickNode's API to automatically find suitable endpoints
- Saves data for each block in separate JSON files
- Supports Ethereum and EVM-compatible chains
- Available in both JavaScript (Node.js) and Python implementations

## Prerequisites

- Node.js (v12 or later) for JavaScript implementation
- Python (v3.7 or later) for Python implementation
- A QuickNode API key

## Setup

1. Clone this repository:
   ```
   git clone https://github.com/quiknode-labs/quicknode-data-fetcher.git
   cd quicknode-data-fetcher
   ```

2. Install dependencies (for Python implementation):
   ```
   pip install aiohttp aiofiles
   ```

   Note: The JavaScript implementation uses only built-in modules and doesn't require additional dependencies.

## Usage

1. Configure the data fetching parameters:
   - Open `main.js`
   - Modify the `input` object to specify your desired chain, network, and block range:

     ```javascript
     const input = {
       chain: "ethereum",
       network: "mainnet",
       dataset: "block_with_receipts",
       filters: {
         start_block: 1000000,
         end_block: 1000010
       }
     };
     ```

2. Save the resulting data fetch code:

    For JavaScript:
    ```
    node main.js >> fetcher.js
    ```

3. Set up your QuickNode API key:
   - Open the `fetcher.js` or `fetcher.py` file
   - Replace `'YOUR_QUICKNODE_API_KEY'` with your actual QuickNode API key from https://dashboard.quicknode.com/api-keys

4. Run the fetcher:
   
   For JavaScript:
   ```
   node fetcher.js
   ```

   For Python:
   ```
   python fetcher.py
   ```

## Output

The tool will create a `quicknode_data` directory containing JSON files for each fetched block. Each file will include:

- Block data
- Transactions
- Transaction receipts
- Logs
- Debug traces
- Block traces

## Customization

You can modify the `fetchBlockData` function in the fetcher script to add or remove specific types of data you want to retrieve.

## Error Handling

The current implementation includes basic error handling. For production use, consider implementing more robust error handling and retry logic.

## Rate Limiting

Be aware of your QuickNode plan's rate limits. For large block ranges or frequent use, implement appropriate rate limiting to avoid exceeding these limits.

## Contributing

Contributions to improve the QuickNode Data Fetcher are welcome. Please feel free to submit issues or pull requests.

## Disclaimer

This tool is provided as-is, without any guarantees or warranty. Users are responsible for ensuring their use of the tool complies with QuickNode's terms of service and any applicable laws or regulations.