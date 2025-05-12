import { list, put } from '@vercel/blob';
import { readdir, readFile } from 'fs/promises';
import { join } from 'path';
import inquirer from 'inquirer';
import dotenv from 'dotenv';

dotenv.config();

async function listBlobFolders() {
    try {
        const { blobs } = await list();
        const folders = new Set();
        
        blobs.forEach(blob => {
            const path = blob.pathname.split('/')[0];
            if (path) folders.add(path);
        });

        console.log('Current folders in Vercel Blob:');
        console.log([...folders]);
        
        return folders.has('generated');
    } catch (error) {
        console.error('Error listing blob folders:', error);
        return false;
    }
}

async function listBackupFolders() {
    try {
        const backupDir = 'backups';
        const folders = await readdir(backupDir, { withFileTypes: true });
        const backupFolders = folders
            .filter(dirent => dirent.isDirectory())
            .map(dirent => dirent.name);
            
        return backupFolders;
    } catch (error) {
        console.error('Error listing backup folders:', error);
        return [];
    }
}

async function uploadBackupToBlob(selectedFolder) {
    try {
        const backupPath = join('backups', selectedFolder, 'generated');
        const directories = await readdir(backupPath, { withFileTypes: true });
        
        for (const dir of directories) {
            if (!dir.isDirectory()) continue;
            
            const dirPath = join(backupPath, dir.name);
            const files = await readdir(dirPath, { withFileTypes: true });
            
            for (const file of files) {
                if (!file.isFile()) continue;
                
                const filePath = join(dirPath, file.name);
                const fileContent = await readFile(filePath);
                const blobPath = `generated/${dir.name}/${file.name}`;

                console.log(`Uploading file: ${blobPath} to the vercel blob`);
                
                await put(blobPath, fileContent, {
                    access: 'public'
                });
                console.log(`Uploaded: ${blobPath}`);
            }
        }

        console.log('Backup restoration completed successfully!');
    } catch (error) {
        console.error('Error uploading backup to blob:', error);
    }
}

async function main() {
    const hasGeneratedFolder = await listBlobFolders();
    
    if (!hasGeneratedFolder) {
        console.log('No "generated" folder found in Vercel Blob. Cannot proceed with restore.');
        return;
    }

    const backupFolders = await listBackupFolders();
    
    if (backupFolders.length === 0) {
        console.log('No backup folders found.');
        return;
    }

    const { selectedFolder } = await inquirer.prompt([{
        type: 'list',
        name: 'selectedFolder',
        message: 'Select a backup folder to restore:',
        choices: backupFolders
    }]);

    await uploadBackupToBlob(selectedFolder);
}

main().catch(console.error);