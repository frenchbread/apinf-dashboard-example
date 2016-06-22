import { Meteor } from 'meteor/meteor';

import ElasticSearch from 'elasticsearch';
import _ from 'lodash';
import moment from 'moment';

import config from '/config';

Meteor.methods({
  getElasticSearchData (params) {

    const host = config.host;

    const esClient = new ElasticSearch.Client({ host });

    let opts = {
      index: params.index,
      type: params.type,
      size: params.size,
      body: {
        query: params.query
      }
    };

    if (params.fields && params.fields.length != 0) {
      opts.body.fields = params.fields;
    }

    const start = new Date().getTime();

    return esClient.search(opts).then((res) => {

      console.log((new Date().getTime() - start) / 1000 );

      return res;
    });
  }
})
