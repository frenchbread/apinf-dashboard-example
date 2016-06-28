import { Meteor } from 'meteor/meteor';

import { esClient } from '/server/elasticsearch';

import async from 'async';

import { Analytics } from '/both/collections/analytics';
import _ from 'lodash';

Meteor.methods({
  getElasticSearchData (params) {

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
  },
  async syncElasticSearchData () {

    const params = {
      index: 'api-umbrella-logs-v1-2016-06',
      type: 'log',
      size: 10,
      query: {
        match_all: {}
      }
    };

    const items = await esClient.search(params).then((res) => {

      return res.hits.hits;

    }, (err) => {

      console.log('err', err);
    });

    _.forEach(items, (item) => {
      Analytics.insert(item);
    });
  }
})
