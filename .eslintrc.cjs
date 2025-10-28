module.exports = {
  env: { es2022: true, node: true },
  extends: ["eslint:recommended"],
  ignorePatterns: ["node_modules/", "dist/", "logs/", "coverage/", "single-player/dashboard/src/**/*.ts"]
};
