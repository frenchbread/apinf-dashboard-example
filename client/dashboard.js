import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';

Template.dashboard.onCreated(function(){
  const instance = this;

  Meteor.call('getAggr', (err, res) => {
    if (err) console.error(err);

    console.log(res);
  });
});
