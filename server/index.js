import express from 'express';
import compression from 'compression';
import helmet from 'helmet';
import cors from 'cors';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { listMarkets, upsertMany } from './db.js';
import { fetchCensusMarkets } from './census.js';

const app=express(); const port=Number(process.env.PORT||3000); const root=path.dirname(path.dirname(fileURLToPath(import.meta.url)));
app.use(helmet({contentSecurityPolicy:false})); app.use(compression()); app.use(cors()); app.use(express.json({limit:'1mb'}));
app.get('/api/health',(_,res)=>res.json({ok:true,version:'2.0.0',time:new Date().toISOString()}));
app.get('/api/markets',(_,res)=>{const markets=listMarkets();res.json({markets,dataYear:Math.max(0,...markets.map(m=>m.dataYear||0))});});
app.post('/api/admin/refresh',async(req,res)=>{if(process.env.ADMIN_TOKEN && req.headers.authorization!==`Bearer ${process.env.ADMIN_TOKEN}`) return res.status(401).json({error:'Unauthorized'});try{const rows=await fetchCensusMarkets();upsertMany(rows);res.json({ok:true,updated:rows.length});}catch(error){res.status(502).json({error:error.message});}});
app.use(express.static(path.join(root,'dist'),{maxAge:'1h'}));
app.get('*',(req,res)=>res.sendFile(path.join(root,'dist','index.html')));
app.listen(port,async()=>{console.log(`Builder Intelligence listening on ${port}`);if(listMarkets().length===0){try{upsertMany(await fetchCensusMarkets());console.log('Initial Census cache created');}catch(e){console.error('Initial data refresh failed:',e.message);}}});
