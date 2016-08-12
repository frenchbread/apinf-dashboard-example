import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import _ from 'lodash';
import config from '/config';

import d3 from 'd3';
import nvd3 from 'nvd3';

Template.dashboard.onCreated(function(){

  const instance = this;

  instance.dataSet = new ReactiveVar();

  instance.getAnalyticsDrilldown = async function () {

    return await new Promise((resolve, reject) => {
      Meteor.call('getAnalyticsDrilldown', (err, res) => {
        if (err) reject(err);
        resolve(res);
      });
    });
  }

  instance.parseDataForNvd3 = function (data) {

    let dataSet = [];

    for (let i = 1; i < data.hits_over_time.cols.length; i++) {

      let obj = {
        "key": '',
        "values": []
      };

      obj.key = data.hits_over_time.cols[i].label;

      for (let day = 0; day < data.hits_over_time.rows.length; day++) {

        obj.values.push([data.hits_over_time.rows[day].c[0].v, data.hits_over_time.rows[day].c[i].v]);
      }
      dataSet.push(obj)
    }

    return dataSet;
  }

  instance.getAnalyticsDrilldown()
    .then(data => instance.parseDataForNvd3(data))
    .then(dataSet => instance.dataSet.set(dataSet))
    .catch((err) => {
      console.error(err);
    });
});

Template.dashboard.onRendered(function(){
  const instance = this;

  instance.autorun(() => {

    const data = instance.dataSet.get();

    if (data) {

      nv.addGraph(function() {
        var chart = nv.models.stackedAreaChart()
        .margin({right: 100})
        .height(600)
        .x(function(d) { return d[0] })   //We can modify the data accessor functions...
        .y(function(d) { return d[1] })   //...in case your data is formatted differently.
        .useInteractiveGuideline(true)    //Tooltips which show all data points. Very nice!
        .rightAlignYAxis(true)      //Let's move the y-axis to the right side.
        .showControls(true)       //Allow user to choose 'Stacked', 'Stream', 'Expanded' mode.
        .clipEdge(true);

        //Format x-axis labels with custom function.
        chart.xAxis
          .tickFormat(function(d) {
          return d3.time.format('%x')(new Date(d))
        });

        chart.yAxis
          .tickFormat(d3.format(',.2f'));

        d3.select('#chart')
          .datum(data)
          .call(chart);

        nv.utils.windowResize(chart.update);

        return chart;
      });
    }
  });
});
