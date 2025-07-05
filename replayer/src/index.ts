import { loadReplayerConfig, loadReplayDocument } from './config/loader.js';
import { Replayer } from './core/replayer.js';

async function main() {
  try {
    const config = loadReplayerConfig('./replayer.config.yaml');
    const replayDoc = loadReplayDocument('./replay.yaml');
    
    const replayer = new Replayer(config);
    await replayer.replay(replayDoc);
    
    console.log('Replay completed successfully');
  } catch (error) {
    console.error('Replay failed:', error);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
