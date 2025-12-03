/**
 * TPO-SYS Tests
 */

const TPOSystem = require('../src/index');

describe('TPOSystem', () => {
  test('should initialize correctly', () => {
    const system = new TPOSystem();
    system.initialize();
    
    const status = system.getStatus();
    expect(status.initialized).toBe(true);
    expect(status.version).toBe('1.0.0');
  });
});
