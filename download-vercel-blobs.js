import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { list, del } from '@vercel/blob';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BACKUP_FOLDER = path.join(__dirname, 'backups');
const today = new Date().toISOString().split("T")[0] + "_" + new Date().toISOString().split("T")[1].split(".")[0];
const DESTINATION_FOLDER = path.join(BACKUP_FOLDER, today);

const blobs = await list();

if (!blobs.blobs || blobs.blobs.length === 0) {
  console.log('No blobs found.');
  process.exit(0);
}

async function downloadBlob(fileUrl, localPath) {
  try {
    const response = await fetch(fileUrl);
    if (!response.ok) {
      throw new Error(`Failed to download from ${fileUrl}`);
    }

    const fileStream = fs.createWriteStream(localPath);
    const buffer = await response.arrayBuffer();
    fileStream.write(Buffer.from(buffer));
    fileStream.end();
    
    await new Promise((resolve, reject) => {
      fileStream.on('finish', resolve);
      fileStream.on('error', reject);
    });
  } catch (error) {
    console.error(`❌ ${error.message}`);
    process.exit(0);
  }
}

const downloadPromises = blobs.blobs
  .filter(item => item.pathname.includes("generated"))
  .map(async item => {
    if (item.pathname.split("/")[1] === "") return null;
    const fileUrl = item.url
    const localPath = path.join(DESTINATION_FOLDER, item.pathname)

    fs.mkdirSync(path.dirname(localPath), { recursive: true })

    return downloadBlob(fileUrl, localPath)
  })

await Promise.all(downloadPromises)

console.log('✅ All blobs downloaded locally.')

const uniquefolders = [];

const files = blobs.blobs
  .filter(item => item.pathname.includes("generated"))
  .map(item => {
    if (item.pathname.split("/")[1] === "") return null;
    if (!uniquefolders.includes(item.pathname.split("/")[1])) uniquefolders.push(item.pathname.split("/")[1])

    return item.url;
  })
  .filter(Boolean)
  .sort((a, b) => b.localeCompare(a));

const foldersToDelete = uniquefolders.sort((a, b) => b.localeCompare(a)).slice(5);

if (foldersToDelete.length > 0) {
  const filesToDelete = files.filter(item => {
    return foldersToDelete.some(folder => item.includes(folder));
  });

  console.log('🗑️ Deleting old folders from Vercel Blob');
  const deletePromises = filesToDelete.map(async file => {
    try {
      del(file)
      console.log(`✅ Deleted file: ${file}`)
    } catch (error) {
      console.error(`❌ Failed to delete ${file}: ${error.message}`);
      process.exit(0);
    }
  });
  await Promise.all(deletePromises);
} else {
  console.log(`ℹ️  No files deleted since there are ${uniquefolders.length} folders in the vercel blob`)
}