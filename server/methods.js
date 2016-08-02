import { Meteor } from 'meteor/meteor';

import { esClient } from '/server/elasticsearch';

import async from 'async';

import _ from 'lodash';

Meteor.methods({
  getElasticSearchData (opts) {

    const start = new Date().getTime();

    return esClient.search(opts).then((res) => {

      console.log((new Date().getTime() - start) / 1000 );

      return res;
    });
  },
  getAggr () {

    return esClient.search({
      "index": "api-umbrella-logs-v1-2016-08",
      "size": 100,
      "aggs" : {
        "request_per_day" : {
            "stats" : {
                "field" : "request_ip"
            }
        }
    }
    }).then((res) => {
      return res;
    });
  }
});
