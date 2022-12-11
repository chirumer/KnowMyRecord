// verify if 'name' is an env var
export function verify_env_defined(name) {
  if (process.env[name] == undefined) {
    console.error(`Environment Variable [${name}] is required to be defined.`);
    process.exit(1);
  }
}