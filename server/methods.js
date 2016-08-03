import { Meteor } from 'meteor/meteor';
import { esClient } from '/server/elasticsearch';
import config from '/config';

Meteor.methods({
  getElasticSearchData (opts) {

    const start = new Date().getTime();

    return esClient.search(opts).then((res) => {

      console.log((new Date().getTime() - start) / 1000 );

      return res;
    });
  },
  async getAnalyticsDrilldown () {

    const url = `${config.apiUmbrella}/v1/analytics/drilldown?interval=day&start_at=2016-01-01&end_at=2016-08-03&prefix=0%2F`;

    return await new Promise((resolve, reject) => {

      Meteor.http.get(url, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'X-Admin-Auth-Token': config.token,
          'X-Api-Key': config.key
       }
      }, (err, res) => {
        if (err) reject(err);
        resolve(res.data);
      });
    });
  }
});
