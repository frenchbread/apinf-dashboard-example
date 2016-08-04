import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import _ from 'lodash';
import config from '/config';

import d3 from 'd3';
// import nvd3 from 'nvd3';

Template.dashboard.onCreated(function(){

  const instance = this;

  instance.cols = new ReactiveVar();
  instance.rows = new ReactiveVar();

  instance.dataSet = new ReactiveVar();

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

      console.log(data);

      let dataSet = [];
      for (let i = 1; i < data.hits_over_time.cols.length; i++) {

        let obj = {
          "key": '',
          "values": []
        };

        obj.key = data.hits_over_time.cols[i].label;

        for (let day = 0; day < data.hits_over_time.rows.length; day++) {

          obj.values.push([data.hits_over_time.rows[day].c[0].f, data.hits_over_time.rows[day].c[i].v]);
        }
        dataSet.push(obj)
      }

      console.log(dataSet);
      instance.dataSet.set(dataSet);

      instance.cols.set(cols);
      instance.rows.set(rows);
    })
    .catch((err) => {
      console.error(err);
    })
});

Template.dashboard.onRendered(function(){
  const instance = this;

  instance.autorun(() => {

    const data = instance.dataSet.get();

    if (data) {

      nv.addGraph(function() {

        var chart = nv.models.lineChart()
        .options({
          duration: 300,
          useInteractiveGuideline: true
        });
        // chart sub-models (ie. xAxis, yAxis, etc) when accessed directly, return themselves, not the parent chart, so need to chain separately
        chart.xAxis
        .axisLabel("Time (s)")
        .tickFormat(d3.format(',.1f'))
        .staggerLabels(true);

        chart.yAxis
        .axisLabel('Voltage (v)')
        .tickFormat(function(d) {
          if (d == null) {
            return 'N/A';
          }
          return d3.format(',.2f')(d);
        });

        d3.select('#chart')
        .datum(data)
        .call(chart);

        nv.utils.windowResize(chart.update);
        
        return chart;
      });
    }
  });
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
