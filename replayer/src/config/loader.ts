import { readFileSync } from 'fs';
import { parse } from 'yaml';
import { config } from 'dotenv';
import type { ReplayerConfig, ReplayDocument } from '../types/config.js';

config();

export function loadReplayerConfig(configPath: string = './replayer.config.yaml'): ReplayerConfig {
  const configContent = readFileSync(configPath, 'utf8');
  const rawConfig = parse(configContent) as ReplayerConfig;
  
  return {
    ...rawConfig,
    networks: Object.fromEntries(
      Object.entries(rawConfig.networks).map(([name, network]) => [
        name,
        {
          ...network,
          rpcUrl: substituteEnvVars(network.rpcUrl)
        }
      ])
    )
  };
}

export function loadReplayDocument(replayPath: string): ReplayDocument {
  const replayContent = readFileSync(replayPath, 'utf8');
  return parse(replayContent) as ReplayDocument;
}

function substituteEnvVars(value: string): string {
  return value.replace(/\$\{([^}]+)\}/g, (match, envVar) => {
    const envValue = process.env[envVar];
    if (!envValue) {
      throw new Error(`Environment variable ${envVar} is not set`);
    }
    return envValue;
  });
}
