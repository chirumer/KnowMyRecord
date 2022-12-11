// load environment variables from .env file
require('dotenv').config()

// verify the required environment variables are configured
function verify_env_defined(name) {
  if (process.env[name] == undefined) {
    console.error(`Environment Variable [${name}] is required to be defined.`);
    process.exit(1);
  }
}
required_env_variables = ['PORT', 'NODE_ENV', 'TOKEN_SECRET']
required_env_variables.forEach(env_var => {
  verify_env_defined(env_var);
});

const express = require('express')
const app = express()

app.set('view engine', 'pug');

app.get('/', (req, res) => {
  res.render('welcome', { user: 'Chiru' });
});

const PORT = process.env.PORT
app.listen(PORT, () => {
  console.log(`Listening On ${PORT}`)
})