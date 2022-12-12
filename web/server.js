// load environment variables from .env file
import dotenv from 'dotenv';
dotenv.config()

// verify the required environment variables are configured
import { verify_env_defined, random_uint32 } from './helpers.mjs'
const required_env_variables = ['PORT', 'NODE_ENV', 'TOKEN_SECRET'];
required_env_variables.forEach(env_var => {
  verify_env_defined(env_var);
});


import { fileURLToPath } from 'url';
import { dirname } from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

import path from 'path'
import express from 'express';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';

import { recoverTypedSignature } from '@metamask/eth-sig-util';

import { user_from_token, get_user } from './user_identification.mjs'
import { nonces } from './user_identification.mjs';

const app = express();


// express middleware
app.set('view engine', 'pug');
app.use(cookieParser());
app.use(express.json());
app.use('/scripts', express.static(path.join(__dirname, 'scripts')))
app.use('/assets', express.static(path.join(__dirname, 'assets')))
app.use('/scripts', express.static(path.join(__dirname, 'node_modules/@metamask/onboarding/dist')));


// home route
app.get('/', (req, res) => {
  const wallet_address = user_from_token(req.cookies.access_token);
  if (wallet_address === null) {
    res.render('wallet_selection');
    return;
  }

  const user = get_user(wallet_address);
  if (user.type == 'patient') {
    res.render('patient_dashboard', { username: user.name });
  }
  else if (user.type == 'hospital') {
    res.render('hospital_dashboard', { username: user.name });
  }
});

// external wallet connection
app.get('/connect/external_wallet', (req, res) => {
  res.render('external_wallet');
});

// authorize page
app.get('/authorize', (req, res) => {
  res.render('authorize');
});

// authorize user
app.post('/authorize', (req, res) => {
  const { wallet_address, signature } = req.body;

  if (!nonces.get(wallet_address) || Date.now() >= nonces.get(wallet_address).expiration) {
    res.status(400).json({ success: false, reason: 'nonce timeout' })
    return;
  }

  const nonce = nonces.get(wallet_address).nonce;

  const msg_params = [
    {
      type: 'string',
      name: 'Message',
      value: 'Signing This Message Will Allow G-KnowMe To Verify Your Identity',
    },
    {
      type: 'uint32',
      name: 'Nonce',
      value: nonce,
    },
  ];

  const recovered_address = recoverTypedSignature({
    data: msg_params,
    signature: signature,
    version: 'V1'
  });

  console.log(recovered_address, wallet_address);

  res.json({ success: true });
});

// generate nonce for external wallet verification
app.get('/nonce', (req, res) => {
  const wallet_address = req.query.wallet_address;

  const nonce = random_uint32()
  
  nonces.set(
    wallet_address,
    {
      nonce,
      expiration: Date.now() + (60 * 1000)
    }
  )

  res.json({ nonce });
});


// start server
const PORT = process.env.PORT;
app.listen(PORT, () => {
  console.log(`Listening On ${PORT}`)
});