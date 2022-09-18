module.exports = {
  apps: [
    {
      name: "chatchat",
      script: "./dist/index.js",
      env_production: {
        NODE_ENV: "production",
      },
      exec_mode: "cluster",
      instances: 1,
    },
  ],
};
