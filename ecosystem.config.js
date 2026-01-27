module.exports = {
  apps: [
    {
      name: 'web3-jobs-platform',
      script: 'npm',
      args: 'start',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
    },
    {
      name: 'web3-jobs-scheduler',
      script: 'npm',
      args: 'run schedule',
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
}
