// load environment variables from .env file
import dotenv from 'dotenv';
dotenv.config()

// verify the required environment variables are configured
import { verify_env_defined, random_uint32, random_16bytes_hex, 
        create_directory_if_not_exist, calculate_checksum } from './helpers.mjs'
const required_env_variables = ['PORT', 'NODE_ENV', 'TOKEN_SECRET', 'BLOCKCHAIN_PROVIDER_URL'];
required_env_variables.forEach(env_var => {
  verify_env_defined(env_var);
});

// create 
create_directory_if_not_exist('temp/uploads');
create_directory_if_not_exist('blobs');


import { fileURLToPath } from 'url';
import { dirname } from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

import path from 'path'
import fs from 'fs'
import express from 'express';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';
import http from 'http';
import url from 'url';
import formidableMiddleware from 'express-formidable';


import { recoverTypedSignature } from '@metamask/eth-sig-util';

import { wallet_address_from_token } from './user_identification.mjs'
import { get_user, add_user, get_username, change_authorization_status,
          get_patient_with_aadhaar } from './users.mjs'
import { authorize, patient_route, hospital_route, admin_route } from './user_identification.mjs'
import { get_unverified_users } from './users.mjs'
import { nonces } from './user_identification.mjs';
import { get_blob_info, blob_access, add_unverified_blob } from './blob.mjs';
import { randomUUID } from 'crypto'
import { WebSocketServer } from 'ws';
import { contract_addresses, contract_abis } from './contract_infos.mjs';

import {} from './contract_listeners.mjs';



const app = express();
const server = http.createServer(app);


// express middleware
app.set('view engine', 'pug');
app.use(cookieParser());
app.use('/scripts', express.static(path.join(__dirname, 'scripts')))
app.use('/assets', express.static(path.join(__dirname, 'assets')))
app.use('/scripts', express.static(path.join(__dirname, 'node_modules/@metamask/onboarding/dist')));
app.use(formidableMiddleware({
  uploadDir: path.join(__dirname, 'temp/uploads')
}));

// js modules
app.use('/node_modules/ethers', express.static(__dirname + '/node_modules/ethers/dist'));

const user_verification_sockets = new Set();

const user_verification_ws_server = new WebSocketServer({ noServer: true, path: '/verify_new_users' });
user_verification_ws_server.on('connection', socket => {

  user_verification_sockets.add(socket);

  socket.on('message', message => {
    const { type, data } = JSON.parse(message);

    if (type == 'user_verification_response') {

      const { wallet_address, new_authorization_status } = data;
      change_authorization_status(wallet_address, new_authorization_status);

      const { request_no } = data;
      socket.send(JSON.stringify({ type: 'response_received', data: { request_no } }));
    }
  });

  socket.on('close', () => {
    user_verification_sockets.delete(socket);
  });

  const unverified_users = get_unverified_users();
  unverified_users.forEach(user => {

    const send_data = {
      type: 'user_verification_request',
      data: user
    }

    socket.send(JSON.stringify(send_data));
  });
});

server.on('upgrade', (request, socket, head) => {
  const pathname = request.url;

  if (pathname == '/verify_new_users') {
    user_verification_ws_server.handleUpgrade(request, socket, head, socket => {
      user_verification_ws_server.emit('connection', socket, request);
    });
  }
  else {
    socket.destroy();
  }
});

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
  else if (user.authorization_status == 'pending') {
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

// get user wallet address
app.get('/wallet_address', authorize, (req, res) => {
  const wallet_address = req.wallet_address;
  res.json({ wallet_address });
});

// register a new user
app.post('/register', authorize, (req, res) => {
  if (get_user(req.wallet_address)) {
    req.status(400).json({ failure_reason: 'user is already registered.' });
    return;
  }

  const user_details = req.fields;

  const new_user = {
    authorization_status: 'pending',
    authorization_req_id: randomUUID(),
    ...user_details
  };
  add_user(req.wallet_address, new_user);

  user_verification_sockets.forEach(socket => {
    const send_data = {
      type: 'user_verification_request',
      data: new_user
    }

    socket.send(JSON.stringify(send_data));
  });

  res.status(200).end();
});

// authorize user
app.post('/authorize', (req, res) => {
  const { wallet_address, signature } = req.fields;

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

// admin -> verify new users
app.get('/verify_new_users', admin_route, (req, res) => {
  const username = get_username(req.wallet_address);
  res.render('verify_new_users', { username });
});

app.get('/upload_patient_record', hospital_route, (req, res) => {
  const username = get_username(req.wallet_address);
  res.render('upload_patient_record', { username });
});

app.post('/upload_patient_record', hospital_route, (req, res) => {

  const blob_uuid = random_16bytes_hex();

  const file = req.files.file;
  const { file_name } = req.fields;
  const owner = req.wallet_address;

  // async call
  add_unverified_blob({ blob_uuid, file, file_name, owner });

  res.json({ blob_uuid });
});

app.get('/new_patient_record_details', hospital_route, (req, res) => {

  const wallet_address = req.wallet_address;
  const username = get_username(req.wallet_address);

  const { blob_uuid } = req.query;
  const blob_info = get_blob_info(blob_uuid);

  if (blob_uuid == undefined) {
    res.status(404).render('error_page', { username, error_msg: `Badly formed url` });
    return;
  }
  if (blob_info == undefined) {
    res.status(404).render('error_page', { username, error_msg: `Blob ${blob_uuid} does not exist` });
    return;
  }
  else if (blob_info.owner != wallet_address) {
    res.status(404).render('error_page', { username, error_msg: `You do not own the Blob ${blob_uuid} `});
    return;
  }
  else if (Date.now() >= blob_info.expires_at) {
    res.status(404).render('error_page', { username, error_msg: `Blob ${blob_uuid} has timed out` })
    return;
  }

  const { file_name } = blob_info;
  res.render('new_patient_record', { username, wallet_address, blob_uuid, file_name })
});

app.get('/blob', authorize, (req, res) => {
  const wallet_address = req.wallet_address;
  const { blob_uuid } = req.query;

  const access_info = blob_access(wallet_address, blob_uuid);
  if (!access_info.can_access) {
    res.status(404).end();
      return;
  }

  const blob_info = get_blob_info(blob_uuid);
  res.attachment(blob_info.file_name).sendFile(path.join(__dirname, `blobs/${blob_info.blob_name}`)); 
});

app.get('/get_patient', (req, res) => {
  const { patient_aadhaar } = req.query;
  
  const wallet_address = get_patient_with_aadhaar(patient_aadhaar);

  if (wallet_address == null) {
    res.status(404).json({ error_reason: `No Patient With Aadhaar (${patient_aadhaar})` });
    return;
  }
  res.json({ wallet_address });
});

app.get('/contract_address', (req, res) => {
  const { contract } = req.query;

  const contract_address = contract_addresses[contract];
  if (contract_address == undefined) {
    res.status(404).end();
    return;
  }

  res.json({ contract_address });
});

app.get('/contract_abi', (req, res) => {
  const { contract } = req.query;

  const contract_abi = contract_abis[contract];
  if (contract_abi == undefined) {
    res.status(404).end();
    return;
  }

  res.json({ contract_abi });
});

app.get('/get_checksum', (req, res) => {
  const { blob_uuid } = req.query;
  const blob_info = get_blob_info(blob_uuid);

  if (!blob_exists(blob_info)) {
    res.status(404).json({ error_reason: `No Blob With blob_uuid (${blob_uuid})` });
    return;
  }

  const file_data = fs.readFileSync(path.join(__dirname, `blobs/${blob_info.blob_name}`));
  const checksum = calculate_checksum(file_data);

  res.json({ checksum });
});

app.get('/partials/confirmation_tracking', authorize, (req, res) => {
  res.render('../partials/confirmation_tracking');
});


// start server
const PORT = process.env.PORT;
server.listen(PORT, () => {
  console.log(`Listening On ${PORT}`)
});