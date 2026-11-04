const Vieclam24hAdapter = require('./vieclam24h');

const adapters = {
  vieclam24h: new Vieclam24hAdapter()
};

async function fetchAllJobs(options = {}) {
  const selectedSources = options.sources || ['vieclam24h'];
  const allJobs = [];

  for (const src of selectedSources) {
    if (adapters[src]) {
      const jobs = await adapters[src].fetchJobs(options);
      allJobs.push(...jobs);
    }
  }

  return allJobs;
}

module.exports = {
  adapters,
  fetchAllJobs
};
