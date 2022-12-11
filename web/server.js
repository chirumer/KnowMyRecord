import express from 'express';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';
const app = express();

import { verify_env_defined, user_from_token } from './helpers.mjs'


// load environment variables from .env file
import dotenv from 'dotenv';
dotenv.config()

// verify the required environment variables are configured
const required_env_variables = ['PORT', 'NODE_ENV', 'TOKEN_SECRET'];
required_env_variables.forEach(env_var => {
  verify_env_defined(env_var);
});


app.set('view engine', 'pug');
app.use(cookieParser());


app.get('/', (req, res) => {
  res.render('welcome', {user:'chiru'});
});


const PORT = process.env.PORT;
app.listen(PORT, () => {
  console.log(`Listening On ${PORT}`)
});