#!/usr/bin/env node
import {createSampleMint} from "./createSampleMint";
import path from "path";
import dotenv from 'dotenv'
import fs from 'fs'
dotenv.config();
declare global {
    var __basedir: string;
}
global.__basedir = path.resolve(__dirname);

const main = async (): Promise<void> => {

    let i = 1;
    while (fs.existsSync(`./map/sample-nfts-${i}.json`)) i++;
    try {
        console.log('Minting Sample NFTs...')
        const mint = await createSampleMint();
        console.log('Sample NFTs successfully minted! Writing output to file...')
        fs.writeFileSync(`./map/sample-nfts-${i}.json`, JSON.stringify(mint, null, 4) )
        console.log(`Success! Sample NFT data can be found at map/sample-nfts-${i}.json `)
    }
    catch (e) {
        console.log(e);
        console.error('ERROR: Sample NFTs were not successfully minted')
    }
}








(async function() {
    await main();
})();