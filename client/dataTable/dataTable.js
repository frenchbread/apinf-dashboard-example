Template.dataTable.onCreated(function () {

  const instance = this;

  instance.rowCount = new ReactiveVar(10);
  instance.pageNumber = new ReactiveVar(1);

  // instance.autorun(() => {
  //
  // })

});

Template.dataTable.events({
  'click #next': function (event, instance) {

    let oldPageNumber = instance.pageNumber.get()

    instance.pageNumber.set(oldPageNumber+1);
  },
  'click #prev': function (event, instance) {

    let oldPageNumber = instance.pageNumber.get();

    if (oldPageNumber > 1) {
      instance.pageNumber.set(oldPageNumber-1);
    }
  }
})

Template.dataTable.helpers({
  tableDataSet () {

    const instance = Template.instance();

    const rowCount = instance.rowCount.get();
    const pageNumber = instance.pageNumber.get();

    const arrStart = rowCount * pageNumber;
    const arrEnd = arrStart + rowCount;

    return Template.currentData().tableDataSet.slice(arrStart, arrEnd);
  },
  showNextButton () {

    const instance = Template.instance();

    const rowCount = instance.rowCount.get();
    const pageNumber = instance.pageNumber.get();

    const dataSetLength = Template.currentData().tableDataSet.length;

    return pageNumber < (dataSetLength / rowCount - 1);
  }
})
