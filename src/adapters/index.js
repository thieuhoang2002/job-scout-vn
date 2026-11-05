const Vieclam24hAdapter = require('./vieclam24h');
const ItviecAdapter = require('./itviec');
const CareervietAdapter = require('./careerviet');
const LinkedinAdapter = require('./linkedin');
const { FacebookAdapter, ThreadsAdapter } = require('./social');

const adapters = {
  vieclam24h: new Vieclam24hAdapter(),
  itviec: new ItviecAdapter(),
  careerviet: new CareervietAdapter(),
  linkedin: new LinkedinAdapter(),
  facebook: new FacebookAdapter(),
  threads: new ThreadsAdapter()
};

async function fetchAllJobs(options = {}) {
  const selectedSources = options.sources || ['vieclam24h', 'itviec', 'careerviet', 'linkedin', 'facebook', 'threads'];
  const allJobs = [];

  for (const src of selectedSources) {
    if (adapters[src]) {
      try {
        const jobs = await adapters[src].fetchJobs(options);
        allJobs.push(...jobs);
      } catch (err) {
        console.error(`Lỗi cào từ nguồn ${src}:`, err.message);
      }
    }
  }

  return allJobs;
}

module.exports = {
  adapters,
  fetchAllJobs
};
