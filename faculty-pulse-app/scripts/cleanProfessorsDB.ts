import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
import dotenv from 'dotenv';
dotenv.config();

const openai = new OpenAI({
    apiKey: process.env.GPT_KEY
});

interface ProfessorEntry {
    id: string;
    name: string;
    metrics: {
        quality: number;
        difficulty: number;
        wouldTakeAgain: number;
        sentiment: number;
        trust: number;
        tags: any[];
    };
    reviewCount: number;
}

async function normalizeName(name: string): Promise<string> {
    try {
        const response = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: [
                {
                    role: 'system',
                    content: `You are a name normalization expert. Your task is to:
1. Fix typos and spelling errors
2. Standardize format to: "Nombre Apellido1 Apellido2"
3. Remove extra spaces
4. Keep accents (á, é, í, ó, ú, ñ)
5. Use proper capitalization (Title Case)
6. Return ONLY the normalized name, nothing else`
                },
                {
                    role: 'user',
                    content: `Normalize this professor name: ${name}`
                }
            ],
            temperature: 0.1,
            max_tokens: 50
        });

        const normalized = response.choices[0]?.message?.content?.trim() || name;
        return normalized;
    } catch (error) {
        console.error(`Error normalizing "${name}":`, error);
        return name; // Return original if error
    }
}

async function cleanProfessorsDB() {
    console.log('🚀 Starting professor database cleanup with GPT...\n');

    // Read current database
    const dbPath = path.join(__dirname, '../public/professors-db.json');
    const professors: ProfessorEntry[] = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));

    console.log(`📚 Loaded ${professors.length} professors\n`);

    // Process in batches to avoid rate limits
    const batchSize = 10;
    const cleanedProfessors: ProfessorEntry[] = [];
    const nameMap = new Map<string, string>(); // original -> normalized

    for (let i = 0; i < professors.length; i += batchSize) {
        const batch = professors.slice(i, i + batchSize);

        console.log(`Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(professors.length / batchSize)}...`);

        const normalizedBatch = await Promise.all(
            batch.map(async (prof) => {
                const normalizedName = await normalizeName(prof.name);

                if (normalizedName !== prof.name) {
                    console.log(`  ✏️  "${prof.name}" → "${normalizedName}"`);
                    nameMap.set(prof.name, normalizedName);
                }

                return {
                    ...prof,
                    name: normalizedName,
                    id: normalizedName.replace(/\s+/g, '_')
                };
            })
        );

        cleanedProfessors.push(...normalizedBatch);

        // Small delay to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Remove duplicates (keep the one with more reviews)
    const uniqueProfessors = new Map<string, ProfessorEntry>();

    for (const prof of cleanedProfessors) {
        const existing = uniqueProfessors.get(prof.name);

        if (!existing || prof.reviewCount > existing.reviewCount) {
            uniqueProfessors.set(prof.name, prof);
        } else if (existing) {
            console.log(`  🔄 Merged duplicate: "${prof.name}" (${prof.reviewCount} reviews into ${existing.reviewCount})`);
        }
    }

    const finalProfessors = Array.from(uniqueProfessors.values());

    // Save cleaned database
    const backupPath = path.join(__dirname, '../public/professors-db.backup.json');
    fs.writeFileSync(backupPath, JSON.stringify(professors, null, 2));
    console.log(`\n💾 Backup saved to: professors-db.backup.json`);

    fs.writeFileSync(dbPath, JSON.stringify(finalProfessors, null, 2));
    console.log(`✅ Cleaned database saved: ${finalProfessors.length} professors`);

    // Statistics
    console.log(`\n📊 Statistics:`);
    console.log(`  Original: ${professors.length} professors`);
    console.log(`  Cleaned: ${finalProfessors.length} professors`);
    console.log(`  Normalized: ${nameMap.size} names`);
    console.log(`  Duplicates removed: ${professors.length - finalProfessors.length}`);
}

cleanProfessorsDB().catch(console.error);
