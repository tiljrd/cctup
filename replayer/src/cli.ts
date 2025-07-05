#!/usr/bin/env node
import { loadReplayerConfig, loadReplayDocument, Replayer } from './index.js';

async function main() {
  try {
    // TODO: Add proper CLI argument parsing
    const configPath = process.argv[2] || './replayer.config.yaml';
    const replayPath = process.argv[3] || './replay.yaml';
    
    console.log('Loading configuration from:', configPath);
    console.log('Loading replay document from:', replayPath);
    
    const config = loadReplayerConfig(configPath);
    const replayDoc = loadReplayDocument(replayPath);
    
    const replayer = new Replayer(config);
    await replayer.replay(replayDoc);
    
    console.log('✅ Replay completed successfully');
  } catch (error) {
    console.error('❌ Replay failed:', error);
    process.exit(1);
  }
}

main(); 