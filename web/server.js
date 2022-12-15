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

import { wallet_address_from_token, get_user, add_user, authorize } from './user_identification.mjs'
import { nonces } from './user_identification.mjs';
import { randomUUID } from 'crypto';
import { runInNewContext } from 'vm';

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

  const wallet_address = wallet_address_from_token(req.cookies.access_token);

  if (wallet_address == undefined) {
    res.render('wallet_selection');
    return;
  }

  const user = get_user(wallet_address);
  if (user == undefined) {
    res.render('registration', { username: 'Unregistered User', wallet_address });
    return;
  }
  else if (!user.authorized) {
    const { authorization_req_id } = user;
    res.render('registration-requested', { authorization_req_id, username: user.name })
    return;
  }

  if (user.user_type == 'patient') {
    res.render('patient_dashboard', { username: user.name });
  }
  else if (user.user_type == 'hospital') {
    res.render('hospital_dashboard', { username: user.name });
  }
  else if (user.user_type == 'admin') {
    res.render('admin_dashboard', { username: user.name });
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

// logging out page
app.get('/logout', authorize, (req, res) => {
  res.render('logout');
});

// clearing web token
app.post('/logout', authorize, (req, res) => {
  res.clearCookie("access_token").status(200).end();
});

// register a new user
app.post('/register', authorize, (req, res) => {
  if (get_user(req.wallet_address)) {
    req.status(400).json({ failure_reason: 'user is already registered.' });
    return;
  }

  const { user_type } = req.body;

  const new_user = {
    authorized: false,
    authorization_req_id: randomUUID(),
  };
  if (user_type == 'patient') {
    const { aadhaar, name } = req.body;
    new_user.aadhaar = aadhaar;
    new_user.name = name;
  }
  else if (user_type == 'hospital') {
     // fill in
  }
  add_user(req.wallet_address, new_user);

  res.status(200).end();
});

// authorize user
app.post('/authorize', (req, res) => {
  const { wallet_address, signature } = req.body;

  if (!nonces.get(wallet_address) || Date.now() >= nonces.get(wallet_address).expiration) {
    res.status(400).json({ failure_reason: 'nonce timeout' })
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

  if (recovered_address != wallet_address) {
    res.status(400).json({ failure_reason: 'Could Not Verify Signature' });
    return;
  }

  const jwt_token = jwt.sign({ wallet_address }, process.env.TOKEN_SECRET);
  return res.cookie(
    'access_token',
    jwt_token, 
    { httpOnly: true, secure: process.env.NODE_ENV !== 'DEVELOPMENT' }
  ).status(200).end();
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