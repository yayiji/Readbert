#!/usr/bin/env node

/**
 * Dilbert Comics Transcription Pipeline
 * 
 * This script runs the complete transcription pipeline:
 * 1. First runs transcribe-comics-gemini.js (main transcription)
 * 2. Then runs transcribe-comics-gemini-retry.js (retry failed ones)
 * 
 * USAGE:
 *   node transcribe-pipeline.js [year]
 * 
 * EXAMPLES:
 *   node transcribe-pipeline.js           # Process all available years
 *   node transcribe-pipeline.js 2023      # Process only 2023 comics
 *   node transcribe-pipeline.js 1989      # Process only 1989 comics
 */

import { spawn } from 'child_process';
import path from 'path';

function runScript(scriptName, args = []) {
    return new Promise((resolve, reject) => {
        console.log(`\n${'='.repeat(60)}`);
        console.log(`🚀 Starting: ${scriptName} ${args.join(' ')}`);
        console.log(`${'='.repeat(60)}\n`);

        const child = spawn('node', [scriptName, ...args], {
            stdio: 'inherit',
            cwd: process.cwd()
        });

        child.on('close', (code) => {
            if (code === 0) {
                console.log(`\n${'='.repeat(60)}`);
                console.log(`✅ Completed: ${scriptName} (exit code: ${code})`);
                console.log(`${'='.repeat(60)}\n`);
                resolve(code);
            } else {
                console.log(`\n${'='.repeat(60)}`);
                console.log(`❌ Failed: ${scriptName} (exit code: ${code})`);
                console.log(`${'='.repeat(60)}\n`);
                reject(new Error(`Script ${scriptName} failed with exit code ${code}`));
            }
        });

        child.on('error', (error) => {
            console.error(`❌ Error running ${scriptName}:`, error);
            reject(error);
        });
    });
}

async function runPipeline() {
    const args = process.argv.slice(2);
    
    console.log('🎯 Dilbert Comics Transcription Pipeline Started');
    console.log(`📅 Arguments: ${args.length > 0 ? args.join(' ') : 'All years'}`);
    
    try {
        // Step 1: Run main transcription script
        await runScript('transcribe-comics-gemini.js', args);
        
        // Step 2: Run retry script for any failed transcriptions
        await runScript('transcribe-comics-gemini-retry.js', args);
        
        console.log('\n🎉 Pipeline completed successfully!');
        console.log('📋 Summary:');
        console.log('  ✅ Main transcription: COMPLETED');
        console.log('  ✅ Retry failed items: COMPLETED');
        
    } catch (error) {
        console.error('\n💥 Pipeline failed!');
        console.error('Error:', error.message);
        process.exit(1);
    }
}

// Handle script interruption
process.on('SIGINT', () => {
    console.log('\n\n⚠️  Pipeline interrupted by user');
    process.exit(1);
});

process.on('SIGTERM', () => {
    console.log('\n\n⚠️  Pipeline terminated');
    process.exit(1);
});

// Run the pipeline
runPipeline();
