import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';

import './main.html';

import _ from 'lodash';
import moment from 'moment';
import dc from 'dc';
import d3 from 'd3';
import crossfilter from 'crossfilter';

Template.dashboard.onCreated(function () {

  const instance = this;

  instance.esData = new ReactiveVar();
  instance.parsedData = new ReactiveVar();

  instance.dataTableElement = {};

  instance.tableDataSet = new ReactiveVar([]);

  instance.timeStart = new Date().getTime();

  console.log('Starting to fetch stuff..')

  const params = {
    index: 'api-umbrella-logs-v1-2016-06',
    type: 'log',
    size: 1000,
    query: {
      match_all: {}
    },
    fields: [
      'request_at',
      'response_status',
      'response_time',
      'request_ip_country',
      'request_ip',
      'request_path',
      // 'request_ip_location.lon',
      // 'request_ip_location.lat',
      // 'api_key'
    ]
  }

  Meteor.call('getElasticSearchData', params, (err, res) => {

    if (err) console.log('err: ', err);

    console.log('Got result!');
    console.log('Took ' + (new Date().getTime() - instance.timeStart) / 1000 + ' seconds.');

    instance.esData.set(res);
  });

  instance.parseChartData = function (chartData) {

    const items = chartData.hits.hits;

    const index = new crossfilter(items);

    const dateFormat = d3.time.format("%Y-%m-%d-%H");

    const timeStampDimension = index.dimension((d) => {

      let timeStamp = moment(d.fields.request_at[0]);

      timeStamp = timeStamp.format('YYYY-MM-DD-HH');

      d.fields.ymd = dateFormat.parse(timeStamp);

      return d.fields.ymd;
    });
    const timeStampGroup = timeStampDimension.group();

    const statusCodeDimension = index.dimension((d) => {

      const statusCode = d.fields.response_status[0];

      let statusCodeScope = '';

      // Init regEx for status codes
      const success = /^2[0-9][0-9]$/;
      const redirect = /^3[0-9][0-9]$/;
      const clientErr = /^4[0-9][0-9]$/;
      const serverErr = /^5[0-9][0-9]$/;

      if (success.test(statusCode)) {
        statusCodeScope = '2XX';
      } else if (redirect.test(statusCode)) {
        statusCodeScope = '3XX';
      } else if (clientErr.test(statusCode)) {
        statusCodeScope = '4XX';
      } else if (serverErr.test(statusCode)) {
        statusCodeScope = '5XX';
      }

      return statusCodeScope;
    });
    const statusCodeGroup = statusCodeDimension.group();

    const responseTimeDimension = index.dimension((d) => { return d.fields.response_time[0]/1000; });
    const responseTimeGroup = responseTimeDimension.group();

    const all = index.groupAll();

    dc.dataCount("#row-selection")
      .dimension(index)
      .group(all);

    const minDate = d3.min(items, function(d) { return d.fields.ymd; });
    const maxDate = d3.max(items, function(d) { return d.fields.ymd; });

    const timeScaleForLine = d3.time.scale().domain([minDate, maxDate]);
    const timeScaleForFocus = d3.time.scale().domain([minDate, maxDate]);

    return {
      timeStampDimension    : timeStampDimension,
      timeStampGroup        : timeStampGroup,
      statusCodeDimension   : statusCodeDimension,
      statusCodeGroup       : statusCodeGroup,
      responseTimeDimension : responseTimeDimension,
      responseTimeGroup     : responseTimeGroup,
      timeScaleForLine      : timeScaleForLine,
      timeScaleForFocus     : timeScaleForFocus,
    };
  }

  instance.renderCharts = function (parsedData) {

    const timeStampDimension    = parsedData.timeStampDimension;
    const timeStampGroup        = parsedData.timeStampGroup;
    const statusCodeDimension   = parsedData.statusCodeDimension;
    const statusCodeGroup       = parsedData.statusCodeGroup;
    const responseTimeDimension = parsedData.responseTimeDimension;
    const responseTimeGroup     = parsedData.responseTimeGroup;
    const timeScaleForLine      = parsedData.timeScaleForLine;
    const timeScaleForFocus     = parsedData.timeScaleForFocus;

    const line = dc.lineChart('#line-chart');
    const focus = dc.barChart('#focus-chart');
    const row = dc.rowChart('#row-chart');
    const line2 = dc.lineChart('#line2-chart');

    line
      .height(350)
      .renderArea(true)
      .transitionDuration(500)
      .margins({top: 5, right: 10, bottom: 25, left: 40})
      .x(timeScaleForLine)
      .dimension(timeStampDimension)
      .group(timeStampGroup)
      .rangeChart(focus)
      .brushOn(false)
      .renderHorizontalGridLines(true)
      .renderVerticalGridLines(true)
      .elasticY(true);

    focus
      .height(100)
      .dimension(timeStampDimension)
      .group(timeStampGroup)
      .centerBar(true)
      .gap(1)
      .margins({top: 5, right: 10, bottom: 25, left: 40})
      .x(timeScaleForFocus)
      .alwaysUseRounding(true)
      .elasticY(true)
      .yAxis().ticks(0);

    row
      .height(215)
      .dimension(statusCodeDimension)
      .group(statusCodeGroup)
      .elasticX(true)
      .xAxis().ticks(5);

    line2
      .height(215)
      .transitionDuration(500)
      .x(timeScaleForLine)
      .dimension(responseTimeDimension)
      .group(responseTimeGroup)
      .brushOn(false)
      .xAxis().ticks(4)
      // .elasticY(true);

    dc.renderAll();

    for (var i = 0; i < dc.chartRegistry.list().length; i++) {
      var chartI = dc.chartRegistry.list()[i];
      chartI.on("filtered", () => {

        const tableData = instance.getTableData(timeStampDimension);
        instance.tableDataSet.set(tableData);
      });
    }

    const tableData = instance.getTableData(timeStampDimension);
    instance.tableDataSet.set(tableData);
  }

  instance.getTableData = function (timeStampDimension) {

    let tableDataSet = [];

    _.forEach(timeStampDimension.top(Infinity), (e) => {

      let time,
          country,
          requestPath,
          requestIp,
          responseTime;

      // Error handling for empty fields
      try { time = moment(e.fields.request_at[0]).format("D/MM/YYYY HH:mm:ss"); }
      catch (e) { time = ''; }

      try { country = e.fields.request_ip_country[0] }
      catch (e) { country = ''; }

      try { requestPath = e.fields.request_path[0]; }
      catch (e) { requestPath = ''; }

      try { requestIp = e.fields.request_ip[0]; }
      catch (e) { requestIp = ''; }

      try { responseTime = e.fields.response_time[0]; }
      catch (e) { responseTime = ''; }

      tableDataSet.push({ time, country, requestPath, requestIp, responseTime });

    });

    return tableDataSet;
  }

});

Template.dashboard.onRendered(function () {

  const instance = this;

  const chartElemets = $('#line-chart, #focus-chart, #row-chart, #line2-chart');

  chartElemets.addClass('loader');

  instance.autorun(() => {

    const chartData = instance.esData.get();

    if (chartData) {

      console.log(chartData)

      const parsedData = instance.parseChartData(chartData);

      instance.renderCharts(parsedData);

      chartElemets.removeClass('loader');

    }
  });
});

Template.dashboard.helpers({
  tableDataSet () {
    const instance = Template.instance();
    return instance.tableDataSet.get();
  }
})
