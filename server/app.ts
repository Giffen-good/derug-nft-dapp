#!/usr/bin/env node
import dotenv from 'dotenv'
dotenv.config();
import express from 'express';
import { Request, Response } from 'express';
import bodyParser from 'body-parser'
import { getHashlist } from "./lib/utils";
import path from 'path'
import {buildTransactions} from "./lib/transactions/buildTransactions";
import {Connection, PublicKey} from "@solana/web3.js";
import {RPC_URL, CLIENT_URL } from "./lib/Constants";
import cors from 'cors';

const options: cors.CorsOptions = {
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'X-Access-Token',
  ],
  credentials: true,
  methods: 'GET,HEAD,OPTIONS,PUT,PATCH,POST,DELETE',
  origin: CLIENT_URL,
  preflightContinue: false,
};

const app = express()
const port = process.env.PORT || 8080
const connection = new Connection(RPC_URL);

//Here we are configuring express to use body-parser as middle-ware.
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
global.__basedir = path.resolve(__dirname);
app.use(cors(options))


app.get('/', cors(options), (req: Request, res: Response) => {
  res.send('Congratulations on making it to this point. Please claim your reward: https://tinyurl.com/39hbjcyf')
})



app.post('/createMintAndBurnIX', cors(options),  async (req: Request, res: Response) => {
  console.log('/createMintAndBurnIX');
  const { key, nfts } = req.body;
  const userPublicKey = new PublicKey(key)
  const txs = await buildTransactions({
    connection,
    userPublicKey,
    nfts
  })
  res.status(200).json({txs})
})


app.get('/getMintList', async (req: Request, res: Response) => {
  console.log('/getMintList')
  const hashlist : string[] = getHashlist();
  res.status(200).json({hashlist})
})


app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
