import { Meteor } from 'meteor/meteor';

Meteor.publish('Analytics', function () {
  return Analytics.find({}, {
    fields: {
      'response_time': 1,
      'response_status': 1,
      'request_at': 1,
      'request_ip': 1,
      'request_path': 1,
      'response_status': 1
    },
    limit: 50000
  });
})
