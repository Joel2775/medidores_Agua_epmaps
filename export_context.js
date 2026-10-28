const fs = require('fs');
const path = require('path');

const ROOT_DIR = __dirname;
const OUTPUT_FILE = 'contexto_proyecto.md';
const MAX_FILE_SIZE = 150 * 1024;
const IGNORED_DIRS = new Set([
  '.expo',
  '.git',
  '.vscode',
  '.claude',
  'android',
  'assets',
  'coverage',
  'dist',
  'ios',
  'node_modules',
  '.tamagui',
]);
const IGNORED_FILES = new Set([
  OUTPUT_FILE,
  'package-lock.json',
  'yarn.lock',
  'pnpm-lock.yaml',
  'bun.lock',
  'bun.lockb',
  '.DS_Store',
]);
const ALLOWED_EXTENSIONS = new Set([
  '.cjs',
  '.css',
  '.html',
  '.js',
  '.json',
  '.md',
  '.mjs',
  '.ps1',
  '.sh',
  '.ts',
  '.tsx',
  '.yaml',
  '.yml',
]);
const ALLOWED_DOTFILES = new Set(['.gitignore']);

function isEnvironmentFile(fileName) {
  return fileName === '.env' || fileName.startsWith('.env.');
}

function shouldIncludeFile(fileName) {
  if (IGNORED_FILES.has(fileName) || isEnvironmentFile(fileName)) {
    return false;
  }

  if (fileName.endsWith('.lock') || fileName.endsWith('.map')) {
    return false;
  }

  return ALLOWED_EXTENSIONS.has(path.extname(fileName)) || ALLOWED_DOTFILES.has(fileName);
}

function collectFiles(directory, files = []) {
  const entries = fs.readdirSync(directory, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      if (!IGNORED_DIRS.has(entry.name)) {
        collectFiles(fullPath, files);
      }
      continue;
    }

    if (!entry.isFile() || !shouldIncludeFile(entry.name)) {
      continue;
    }

    const stats = fs.statSync(fullPath);
    if (stats.size > MAX_FILE_SIZE) {
      console.warn(`Omitido por tamaño (${Math.round(stats.size / 1024)} KB): ${path.relative(ROOT_DIR, fullPath)}`);
      continue;
    }

    files.push(fullPath);
  }

  return files;
}

function getProjectSummary() {
  const packagePath = path.join(ROOT_DIR, 'package.json');
  if (!fs.existsSync(packagePath)) {
    return 'No se encontró package.json.';
  }

  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  const appConfigPath = path.join(ROOT_DIR, 'app.json');
  const appConfig = fs.existsSync(appConfigPath)
    ? JSON.parse(fs.readFileSync(appConfigPath, 'utf8'))
    : {};
  const projectName = appConfig.expo?.name ?? packageJson.name ?? 'No definido';
  const dependencies = packageJson.dependencies ?? {};
  const relevantPackages = [
    'expo',
    'react',
    'react-native',
    'expo-router',
    '@tanstack/react-query',
    'expo-sqlite',
    'zustand',
    'zod',
  ];
  const framework = relevantPackages
    .filter((name) => dependencies[name])
    .map((name) => `${name} ${dependencies[name]}`)
    .join(', ');
  const scripts = Object.entries(packageJson.scripts ?? {})
    .map(([name, command]) => `- \`npm run ${name}\`: \`${command}\``)
    .join('\n');

  return [
    `- Aplicación: ${projectName}`,
    `- Paquete npm: ${packageJson.name ?? 'No definido'}`,
    `- Versión: ${packageJson.version ?? 'No definida'}`,
    `- Framework: ${framework || 'No definido'}`,
    '',
    '### Comandos',
    scripts || 'No hay comandos definidos.',
    '',
    '### Exclusiones',
    'Se omiten `.env*`, dependencias, archivos de bloqueo, recursos binarios y carpetas generadas (`dist/`, `.expo/`, `android/`, `ios/`).',
    'Los valores de entorno se pueden consultar en `.env.example`; los archivos `.env` locales nunca se exportan.',
  ].join('\n');
}

function getCodeFence(content) {
  const longestFence = content.match(/`{3,}/g)?.reduce((longest, fence) =>
    Math.max(longest, fence.length), 2
  ) ?? 2;
  return '`'.repeat(longestFence + 1);
}

function buildContext() {
  const files = collectFiles(ROOT_DIR).sort((left, right) =>
    path.relative(ROOT_DIR, left).localeCompare(path.relative(ROOT_DIR, right))
  );
  const packageJson = JSON.parse(fs.readFileSync(path.join(ROOT_DIR, 'package.json'), 'utf8'));
  const appConfigPath = path.join(ROOT_DIR, 'app.json');
  const appConfig = fs.existsSync(appConfigPath)
    ? JSON.parse(fs.readFileSync(appConfigPath, 'utf8'))
    : {};
  const projectName = appConfig.expo?.name ?? packageJson.name ?? 'aplicación';
  const sections = [
    `# Contexto del proyecto: ${projectName}`,
    '',
    '## Resumen',
    '',
    getProjectSummary(),
    '',
    '## Archivos del proyecto',
  ];

  for (const filePath of files) {
    const relativePath = path.relative(ROOT_DIR, filePath);
    const content = fs.readFileSync(filePath, 'utf8').trimEnd();
    const fence = getCodeFence(content);
    sections.push('', `### \`${relativePath}\``, '', `${fence}text`, content, fence);
  }

  const outputPath = path.join(ROOT_DIR, OUTPUT_FILE);
  fs.writeFileSync(outputPath, `${sections.join('\n')}\n`, 'utf8');

  const outputSize = fs.statSync(outputPath).size;
  console.log(`Contexto generado: ${OUTPUT_FILE}`);
  console.log(`Archivos incluidos: ${files.length}`);
  console.log(`Tamaño: ${(outputSize / 1024).toFixed(1)} KB`);
}

try {
  buildContext();
} catch (error) {
  console.error('No se pudo generar el contexto del proyecto:', error.message);
  process.exitCode = 1;
}
