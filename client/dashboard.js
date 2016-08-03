import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import _ from 'lodash';
import config from '/config';

Template.dashboard.onCreated(function(){

  const instance = this;

  instance.cols = new ReactiveVar();
  instance.rows = new ReactiveVar();

  instance.getAnalyticsDrilldown = async function () {


    return await new Promise((resolve, reject) => {
      Meteor.call('getAnalyticsDrilldown', (err, res) => {
        if (err) reject(err);
        resolve(res);
      });
    });
  }

  instance.getAnalyticsDrilldown()
    .then((data) => {

      let cols = [];
      _.forEach(data.hits_over_time.cols, (col) => {
        cols.push(col.label);
      });
      let rows = [];
      _.forEach(data.hits_over_time.rows, (row) => {
        let cc = [];
        _.forEach(row.c, (c) => {
          cc.push(c.f);
        });
        rows.push(cc);
      });
      console.log(cols, rows);
      instance.cols.set(cols);
      instance.rows.set(rows);
    })
    .catch((err) => {
      console.error(err);
    })
});

Template.dashboard.helpers({
  cols () {
    const instance = Template.instance();
    return instance.cols.get();
  },
  rows () {
    const instance = Template.instance();
    return instance.rows.get();
  }
});
