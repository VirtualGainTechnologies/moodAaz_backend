const os = require("os");

/**
 * CPU CORE ALLOCATION STRATEGY
 * - 1 core reserved for cron jobs
 * - 30% of remaining cores for workers
 * - Rest allocated to API servers
 */

// configuration
const TOTAL_CORES = os.cpus().length;
const CRON_CORES = 1;
const AVAILABLE_CORES = Math.max(1, TOTAL_CORES - CRON_CORES);
const WORKER_CORES = Math.max(1, Math.floor(AVAILABLE_CORES * 0.3));
const API_CORES = Math.max(1, AVAILABLE_CORES - WORKER_CORES);

console.info(`
================ CPU ALLOCATION ================
Total Cores   : ${TOTAL_CORES}
API Cores     : ${API_CORES}
Worker Cores  : ${WORKER_CORES}
Cron Cores    : ${CRON_CORES}
================================================
`);

module.exports = {
  apps: [
    // API Servers Process
    {
      name: "moodaaz-api",
      script: "./server.js",
      instances: API_CORES,
      exec_mode: "cluster",
      node_args: "--max-old-space-size=4096 --expose-gc",

      out_file: "/dev/null",
      error_file: "/dev/null",
      merge_logs: true,

      env_production: {
        NODE_ENV: "PRODUCTION",
        PORT: 9000,
      },
      env_development: {
        NODE_ENV: "DEVELOPMENT",
        PORT: 9000,
      },
    },

    // Worker Process
    // {
    //   name: "moodaaz-worker",
    //   script: "./workers.js",
    //   instances: WORKER_CORES,
    //   exec_mode: "fork",
    //   node_args: "--max-old-space-size=4096 --expose-gc",

    //   out_file: "/dev/null",
    //   error_file: "/dev/null",
    //   merge_logs: true,

    //   env_production: { NODE_ENV: "PRODUCTION" },
    //   env_development: { NODE_ENV: "DEVELOPMENT" },
    // },

    // Cron Jobs process
    // {
    //   name: "moodaaz-cron",
    //   script: "./cron.js",
    //   instances: CRON_CORES,
    //   exec_mode: "fork",
    //   node_args: "--max-old-space-size=4096 --expose-gc",

    //   out_file: "/dev/null",
    //   error_file: "/dev/null",
    //   merge_logs: true,

    //   env_production: { NODE_ENV: "PRODUCTION" },
    //   env_development: { NODE_ENV: "DEVELOPMENT" },
    // },
  ],
};
