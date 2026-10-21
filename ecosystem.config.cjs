// PM2 config for a VPS:  pm2 start ecosystem.config.cjs && pm2 save
module.exports = {
  apps: [{ name: 'alamwaj', cwd: './server', script: 'src/index.js', env: { NODE_ENV: 'production' } }],
};
