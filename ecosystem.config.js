module.exports = {
  apps: [
    {
      name: "pmeBack",
      script: "./dist/server.js",
      watch: false,
      env: {
        NODE_ENV: "production",
        PORT: 8000,
        DATABASE_URL: process.env.DATABASE_URL
      }
    }
  ]
};
