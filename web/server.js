// load environment variables from .env file
import dotenv from 'dotenv';
dotenv.config()

// verify the required environment variables are configured
import { verify_env_defined } from './helpers.mjs'
const required_env_variables = ['PORT', 'NODE_ENV', 'TOKEN_SECRET'];
required_env_variables.forEach(env_var => {
  verify_env_defined(env_var);
});


import express from 'express';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';
const app = express();


import { user_from_token, get_user } from './user_identification.mjs'


// express middleware
app.set('view engine', 'pug');
app.use(cookieParser());


// home route
app.get('/', (req, res) => {
  const wallet_address = user_from_token(req.cookies.access_token);
  if (wallet_address === null) {
    res.render('login');
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


// start server
const PORT = process.env.PORT;
app.listen(PORT, () => {
  console.log(`Listening On ${PORT}`)
});