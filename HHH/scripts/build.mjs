// vinext's immediate process.exit(0) races native handle cleanup on Windows.
// Let Node finish the event loop naturally; preserve nonzero exit codes.
if (process.platform === 'win32') {
  const exit = process.exit.bind(process);
  process.exit = (code = 0) => {
    if (Number(code) !== 0) return exit(code);
    process.exitCode = 0;
  };
}
process.argv = [process.argv[0], 'vinext', 'build', ...process.argv.slice(2)];
await import('../node_modules/vinext/dist/cli.js');
