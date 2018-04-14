function max(nbr, step){
  return nbr * step;
};
function min(nbr, step){
  return max(nbr, step) - step;
}
module.exports['Calc max min value'] = {
  setUp: function(callback) {
    var step = 20;
    var nbr = 1;
    this.mx = max(nbr, step);
    this.mn = min(nbr, step);
    callback();
  },
  test: function(test) {
    test.deepEqual(true, this.mn === 0);
    test.deepEqual(true, this.mx === 20);
    test.done();
  }
};
module.exports['Calc max min value 2'] = {
  setUp: function(callback) {
    var step = 20;
    var nbr = 2;
    this.mx = max(nbr, step);
    this.mn = min(nbr, step);
    callback();
  },
  test: function(test) {
    test.deepEqual(true, this.mn === 20);
    test.deepEqual(true, this.mx === 40);
    test.done();
  }
};
module.exports['Calc max min value 3'] = {
  setUp: function(callback) {
    var step = 20;
    var nbr = 3;
    this.mx = max(nbr, step);
    this.mn = min(nbr, step);
    callback();
  },
  test: function(test) {
    test.deepEqual(true, this.mn === 40);
    test.deepEqual(true, this.mx === 60);
    test.done();
  }
};
module.exports['Calc max min value 4'] = {
  setUp: function(callback) {
    var step = 20;
    var nbr = 4;
    this.mx = max(nbr, step);
    this.mn = min(nbr, step);
    callback();
  },
  test: function(test) {
    test.deepEqual(true, this.mn === 60);
    test.deepEqual(true, this.mx === 80);
    test.done();
  }
};
module.exports['Calc max min value 5'] = {
  setUp: function(callback) {
    var step = 20;
    var nbr = 5;
    this.mx = max(nbr, step);
    this.mn = min(nbr, step);
    callback();
  },
  test: function(test) {
    test.deepEqual(true, this.mn === 80);
    test.deepEqual(true, this.mx === 100);
    test.done();
  }
};
