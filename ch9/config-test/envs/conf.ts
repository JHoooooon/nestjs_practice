import common from './common';
import local from './local';
import dev from './dev';
import prod from './prod';
import * as yaml from 'js-yaml';
import { readFileSync } from 'fs';

const phase = process.env.NODE_ENV;

let conf = {};
if (phase === 'local') {
  conf = local;
} else if (phase === 'dev') {
  conf = dev;
} else {
  conf = prod;
}

const yamlConfig: Record<string, any> = yaml.load(
  readFileSync(`${process.cwd()}/envs/config.yaml`, 'utf-8'),
);

export default (): Record<string, any> => ({
  ...common,
  ...conf,
  ...yamlConfig,
});
