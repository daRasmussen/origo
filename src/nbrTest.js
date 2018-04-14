function nbr(antal, max){
  return Math.ceil(antal / max) >= 0 ? Math.ceil(antal / max) : 0;
};
module.exports['Nbr test 0'] = {
  setUp: function(callback) {
    this.nr = nbr(0, 20);
    callback();
  },
  test: function(test) {
    test.deepEqual(true, this.nr === 0);
    test.done();
  }
};
module.exports['Nbr test 20'] = {
  setUp: function(callback) {
    this.nr = nbr(20, 20);
    callback();
  },
  test: function(test) {
    test.deepEqual(true, this.nr === 1);
    test.done();
  }
};
module.exports['Nbr test 40'] = {
  setUp: function(callback) {
    this.nr = nbr(40, 20);
    callback();
  },
  test: function(test) {
    test.deepEqual(true, this.nr === 2);
    test.done();
  }
};
