import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Try loading from explicit path adjacent to scripts folder (which is root/scripts, so root/.env)
dotenv.config({ path: path.join(__dirname, '../.env') });

console.log('Environment Keys available:', Object.keys(process.env).filter(k => k.includes('KEY') || k.includes('GPT') || k.includes('OPENAI')));
