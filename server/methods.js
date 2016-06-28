import { Meteor } from 'meteor/meteor';

import { esClient } from '/server/elasticsearch';

import async from 'async';

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

    let syncComplete = false;
    let fromItem = 0;
    let size = 10000;

    console.log('Sync started.');

    while (syncComplete === false) {

      const params = {
        index: 'api-umbrella-logs-v1-2016-06',
        type: 'log',
        from: fromItem,
        size: size,
        query: {
          match_all: {}
        }
      };

      const items = await esClient.search(params).then((res) => {

        return res.hits.hits;
      }, (err) => {

        throw new Meteor.error(err);
      });

      if (items.length > 0) {

        _.forEach(items, (item) => {

          // console.log('inserting')

          const itemExists = Analytics.findOne({ _id: item._id });

          if (!itemExists) {
            try {
              Analytics.insert(item);
            } catch (err) {
              console.log(err);
            }
            // console.log('Ok!');
          } else {
            // console.log('Passed!');
          }
          // console.log(item);
        });

        console.log('10k done! -----------------------');

        fromItem += size;
      } else {
        syncComplete = true;
      }
    }

    console.log('Sync complete.');
  },
  getAggr () {


    esClient.search({
      index: 'api-umbrella-logs-v1-2016-06',
      type: 'log',
      "size" : 0,
      "aggs": {
        "response_time": {
          "date_histogram": {
            "field": "response_time",
            "interval": "month",
            "format": "yyyy-MM-dd",
            "min_doc_count" : 0,
            "extended_bounds" : {
              "min" : "2014-01-01",
              "max" : "2014-12-31"
            }
          }
        }
      }
    }).then((res) => {
      console.log(res);
    })
})
