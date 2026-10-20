export const testPort = Number(process.env.PLAYWRIGHT_PORT || '3107');
if (!Number.isInteger(testPort) || testPort < 1 || testPort > 65535) {
  throw new Error('PLAYWRIGHT_PORT harus berupa port TCP yang valid.');
}
export const testOrigin = 'http://localhost:' + testPort;
