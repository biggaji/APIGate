import path from 'node:path';
import { PATH_CONSTANTS } from '../constants/pathConstants.js';
import { GATEWAY_CONFIG_BIOLERPLATE } from '../constants/gatewayConfigurationBoilerplate.js';
import fs from 'node:fs';
import yaml from 'js-yaml';
import { logger } from '../utils/logger.js';

async function loadGatewayConfigurationSchema() {
  let gatewayConfigurationObject: any;

  try {
    const { rootDir, readFile, writeFile } = PATH_CONSTANTS;
    const GATE_CONFIG_FILE_PATH = path.resolve(rootDir, 'gate-config.yml');

    if (!fs.existsSync(GATE_CONFIG_FILE_PATH)) {
      // create a new one
      await writeFile('gate-config.yml', GATEWAY_CONFIG_BIOLERPLATE, { encoding: 'utf-8' });
      gatewayConfigurationObject = await yaml.load(GATEWAY_CONFIG_BIOLERPLATE);
    } else {
      const gateConfig = await readFile(GATE_CONFIG_FILE_PATH, 'utf-8');
      gatewayConfigurationObject = await yaml.load(gateConfig);
    }

    return gatewayConfigurationObject;
  } catch (error) {
    console.log(error);
    logger.error('Failed to fetch gate-config.yaml file');
    throw new Error('Fail to fetch gate-config file');
  }
}

const gatewayConfigObject = await loadGatewayConfigurationSchema();

export { gatewayConfigObject };
