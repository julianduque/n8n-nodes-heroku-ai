#!/usr/bin/env node

import { readdir, mkdir, copyFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

async function ensureDir(dir) {
  try {
    await mkdir(dir, { recursive: true });
  } catch (error) {
    if (error.code !== 'EEXIST') {
      throw error;
    }
  }
}

async function findIconFiles(sourceDir) {
  const iconFiles = [];
  
  async function scanDir(dir, relativePath = '') {
    try {
      const entries = await readdir(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = join(dir, entry.name);
        const relativeFilePath = join(relativePath, entry.name);
        
        if (entry.isDirectory()) {
          await scanDir(fullPath, relativeFilePath);
        } else if (entry.isFile() && /\.(png|svg)$/i.test(entry.name)) {
          iconFiles.push({
            source: fullPath,
            relative: relativeFilePath
          });
        }
      }
    } catch (error) {
      // Directory doesn't exist, skip silently
      if (error.code !== 'ENOENT') {
        throw error;
      }
    }
  }
  
  await scanDir(sourceDir);
  return iconFiles;
}

async function copyIcons() {
  console.log('📁 Copying icon files...');
  
  // Copy icons from nodes directory
  const nodesSource = join(projectRoot, 'nodes');
  const nodesDestination = join(projectRoot, 'dist', 'nodes');
  const nodeIcons = await findIconFiles(nodesSource);
  
  for (const icon of nodeIcons) {
    const destPath = join(nodesDestination, icon.relative);
    const destDir = dirname(destPath);
    
    await ensureDir(destDir);
    await copyFile(icon.source, destPath);
    console.log(`✅ ${icon.relative}`);
  }
  
  // Copy icons from credentials directory
  const credentialsSource = join(projectRoot, 'credentials');
  const credentialsDestination = join(projectRoot, 'dist', 'credentials');
  const credentialIcons = await findIconFiles(credentialsSource);
  
  for (const icon of credentialIcons) {
    const destPath = join(credentialsDestination, icon.relative);
    const destDir = dirname(destPath);
    
    await ensureDir(destDir);
    await copyFile(icon.source, destPath);
    console.log(`✅ ${icon.relative}`);
  }
  
  const totalIcons = nodeIcons.length + credentialIcons.length;
  console.log(`🎉 Copied ${totalIcons} icon files successfully!`);
}

copyIcons().catch((error) => {
  console.error('❌ Error copying icons:', error);
  process.exit(1);
});