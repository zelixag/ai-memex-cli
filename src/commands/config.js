import chalk from 'chalk';
import inquirer from 'inquirer';

import { printBanner, printSuccess, printError, printInfo, printTable, printDivider } from '../lib/ui.js';
import { globalConfig, getLLMConfig } from '../lib/config.js';

const CONFIG_KEYS = {
  'llm.provider': { description: 'LLM provider (openai | anthropic | ollama)', default: 'openai' },
  'llm.model': { description: 'LLM model name', default: 'gpt-4.1-mini' },
  'llm.apiKey': { description: 'API key for LLM provider', default: '(from env OPENAI_API_KEY)', secret: true },
  'llm.baseUrl': { description: 'Custom API base URL (for OpenAI-compatible APIs)', default: '' },
  'defaultKb': { description: 'Default knowledge base name', default: '' },
};

export async function configCommand(action, key, value) {
  action = action || 'list';

  switch (action) {
    case 'list':
      await listConfig();
      break;
    case 'get':
      await getConfig(key);
      break;
    case 'set':
      await setConfig(key, value);
      break;
    case 'setup':
      await interactiveSetup();
      break;
    default:
      printError(`Unknown action: ${action}. Use: list | get | set | setup`);
      process.exit(1);
  }
}

async function listConfig() {
  printBanner('memex config', 'Configuration settings');

  const llmConfig = getLLMConfig();

  printDivider();
  console.log(chalk.bold('  LLM Settings'));
  console.log(`  provider:  ${chalk.cyan(llmConfig.provider)}`);
  console.log(`  model:     ${chalk.cyan(llmConfig.model)}`);
  console.log(`  apiKey:    ${llmConfig.apiKey ? chalk.green('(set)') : chalk.red('(not set)')}`);
  console.log(`  baseUrl:   ${llmConfig.baseUrl || chalk.gray('(default)')}`);
  printDivider();
  console.log(chalk.bold('  Knowledge Bases'));
  console.log(`  default:   ${chalk.cyan(globalConfig.get('defaultKb') || chalk.gray('(none)'))}`);
  printDivider();

  console.log('');
  printInfo('Use `memex config setup` for interactive configuration');
  printInfo('Use `memex config set <key> <value>` to set a specific value');
  console.log('');
  console.log('  Environment variables also work:');
  console.log('    OPENAI_API_KEY     — API key');
  console.log('    OPENAI_BASE_URL    — Custom base URL');
  console.log('    MEMEX_MODEL        — Model name');
}

async function getConfig(key) {
  if (!key) {
    printError('Please provide a key: memex config get <key>');
    process.exit(1);
  }

  const parts = key.split('.');
  let value = globalConfig.store;
  for (const part of parts) {
    value = value?.[part];
  }

  if (value === undefined) {
    printInfo(`${key}: (not set)`);
  } else {
    const meta = CONFIG_KEYS[key];
    if (meta?.secret && value) {
      console.log(`${key}: ${chalk.green('(set, hidden)')}`);
    } else {
      console.log(`${key}: ${chalk.cyan(String(value))}`);
    }
  }
}

async function setConfig(key, value) {
  if (!key) {
    printError('Please provide a key: memex config set <key> <value>');
    process.exit(1);
  }

  if (value === undefined) {
    // Interactive prompt for value
    const { inputValue } = await inquirer.prompt([{
      type: CONFIG_KEYS[key]?.secret ? 'password' : 'input',
      name: 'inputValue',
      message: `Set ${key}:`,
    }]);
    value = inputValue;
  }

  // Set nested key
  const parts = key.split('.');
  if (parts.length === 2) {
    const [section, subKey] = parts;
    const current = globalConfig.get(section) || {};
    current[subKey] = value;
    globalConfig.set(section, current);
  } else {
    globalConfig.set(key, value);
  }

  printSuccess(`Set ${key} = ${CONFIG_KEYS[key]?.secret ? '(hidden)' : value}`);
}

async function interactiveSetup() {
  printBanner('memex config setup', 'Interactive configuration');

  const current = getLLMConfig();

  const answers = await inquirer.prompt([
    {
      type: 'list',
      name: 'provider',
      message: 'LLM provider:',
      choices: [
        { value: 'openai', name: 'OpenAI (GPT-4, GPT-4o)' },
        { value: 'openai-compatible', name: 'OpenAI-compatible (Ollama, Together, etc.)' },
        { value: 'anthropic', name: 'Anthropic (Claude) — via OpenAI-compatible proxy' },
      ],
      default: current.provider,
    },
    {
      type: 'input',
      name: 'model',
      message: 'Model name:',
      default: current.model || 'gpt-4.1-mini',
    },
    {
      type: 'password',
      name: 'apiKey',
      message: 'API key (leave blank to use OPENAI_API_KEY env var):',
      default: '',
    },
    {
      type: 'input',
      name: 'baseUrl',
      message: 'Custom API base URL (leave blank for default):',
      default: current.baseUrl || '',
      when: (ans) => ans.provider === 'openai-compatible',
    },
  ]);

  const llmConfig = {
    provider: answers.provider,
    model: answers.model,
    apiKey: answers.apiKey || '',
    baseUrl: answers.baseUrl || '',
  };

  globalConfig.set('llm', llmConfig);
  printSuccess('Configuration saved!');
  printInfo('Run `memex config list` to verify settings.');
}
