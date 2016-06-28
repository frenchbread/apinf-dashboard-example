const params = {
  index: 'api-umbrella-logs-v1-2016-06',
  type: 'log',
  size: 10,
  query: {
    match_all: {}
  }
};

Meteor.call('syncElasticSearchData')
