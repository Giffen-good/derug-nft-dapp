#!/usr/bin/env node
import dotenv from 'dotenv'
dotenv.config();
import express, {NextFunction} from 'express';
import { Request, Response } from 'express';
import bodyParser from 'body-parser'
import { getHashlist } from "./lib/util";
import path from 'path'
import {buildTransactions} from "./lib/transactions/buildTransactions";
import {Connection, PublicKey} from "@solana/web3.js";
import {RPC_URL} from "./lib/Constants";

const app = express()
const port = process.env.PORT || 8080
const connection = new Connection(RPC_URL);

//Here we are configuring express to use body-parser as middle-ware.
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
global.__basedir = path.resolve(__dirname);

app.use(function(req: Request, res: Response, next: NextFunction) {
  res.header("Access-Control-Allow-Origin", process.env.FRONTEND_PATH); // update to match the domain you will make the request from
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.get('/', (req: Request, res: Response) => {
  res.send('FOMO or FUD!')
})



app.post('/createMintAndBurnIX', async (req: Request, res: Response) => {
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