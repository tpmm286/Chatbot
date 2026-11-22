// Minimal MCP server (stdio, newline-delimited JSON-RPC) used by the tests.
let buf = '';
process.stdin.on('data', function (c) {
  buf += c.toString('utf8');
  let i;
  while ((i = buf.indexOf('\n')) >= 0) {
    const line = buf.slice(0, i).trim(); buf = buf.slice(i + 1);
    if (!line) continue;
    const m = JSON.parse(line);
    if (m.id === undefined) continue;
    let result;
    if (m.method === 'initialize') result = { protocolVersion: '2024-11-05', capabilities: { tools: {} }, serverInfo: { name: 'fake', version: '1' } };
    else if (m.method === 'tools/list') result = { tools: [{ name: 'echo', description: 'Echo text', inputSchema: { type: 'object', properties: { text: { type: 'string' } }, required: ['text'] } }] };
    else if (m.method === 'tools/call') result = { content: [{ type: 'text', text: 'echo:' + m.params.arguments.text }] };
    else result = {};
    process.stdout.write(JSON.stringify({ jsonrpc: '2.0', id: m.id, result: result }) + '\n');
  }
});
