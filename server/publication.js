import { Meteor } from 'meteor/meteor';
import moment from 'moment';

Meteor.publish('Analytics', function () {

  // const start = moment().subtract(1, 'day').valueOf();

  const logs = Analytics.find({
    // request_at: { $gte: start }
  }, {
      limit: 10000,
      sort: {
        request_at: -1
      }
    }
  );
  return logs;
})
