import ElasticSearch from 'elasticsearch';

import config from '/config';

const host = config.host;

export const esClient = new ElasticSearch.Client({ host });
