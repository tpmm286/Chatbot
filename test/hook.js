// PreToolUse hook: exit code 2 blocks the tool call (stderr is shown to the model).
let s = '';
process.stdin.on('data', function (c) { s += c; });
process.stdin.on('end', function () {
  const p = JSON.parse(s);
  if (p.tool_input && /blockme/.test(p.tool_input.command || '')) { process.stderr.write('policy: blockme is forbidden'); process.exit(2); }
});
