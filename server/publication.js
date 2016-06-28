import { Meteor } from 'meteor/meteor';

Meteor.publish('Analytics', function () {
  return Analytics.find({}, {
    fields: {
      '_source.response_time': 1,
      '_source.response_status': 1,
      '_source.request_at': 1,
      '_source.request_ip': 1,
      '_source.request_path': 1
    },
    limit: 10000
  });
})
