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

    // esClient.search({
    //   size : 0,
    //   "aggregations": {
    //     "the_name": {
    //       "terms": {
    //         "field": "response_status",
    //         "order": {
    //           "rating_avg": "desc"
    //         }
    //       }
    //     }
    //   }
    // }).then((res) => {
    //   console.log(res);
    // })
  }
})
