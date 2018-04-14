var fixed = 10;
var tidy, removed, stable, collected;
var show = true;
var removeRandom = function(collected){
  var r = Math.floor(Math.random() * collected.length);
  collected.splice(r, 1);
  return collected;
};
var shuffle = function(shuffled){
  var j, x, i;
  for(i = shuffled.length-1; i > 0; i--){
    j = Math.floor(Math.random() * (i + 1));
    x = shuffled[i];
    shuffled[i] = shuffled[j];
    shuffled[j] = x;
  }
  var test = [];
  for(var i in shuffled)
    test.push(shuffled[i])
  return test;
};
var state = function(){
  if(show){
    console.log('Stable: \t' +stable);
    console.log('Collected: \t' +collected);
    console.log('Tidy: \t\t' +tidy);
  }
};
var compare = function(x, y){ return x === y ? 1 : 0; }
var fixedCompare = function(stable, collected){
  var a = 0; var b = 0;
  for(var x in stable){
    for(var y in collected){
      if(stable[x] === collected[y]){
        a += compare(stable[x], collected[y]);
        b += 1;
      }
    }
  }
  return a === b;
};
var structure = function(stable, collected){
  var tidy = [];
  for(var x in stable){
    for(var y in collected){
      if(stable[x] === collected[y]){
        tidy[x] = collected[y];
      }
    }
  }
  return tidy.filter(function(x){
    return (x !== (undefined || null || ''));
  });
};
module.exports['Generated mock data with fixed size.'] = {
  setUp: function(callback){
    var genRandom = function(fixed, max){
      return Array.apply(null, Array(fixed)).map(function(x){
        return Math.round(Math.random() * max);
      });
    };
    var genRandom2 = function(fixed){
      var a = [];
      while(a.length < fixed){
        var r = Math.floor(Math.random()*fixed) + 1;
        if(a.indexOf(r) > -1) continue;
        a[a.length] = r;
      }
      return a;
    };
    this.stable = genRandom2(fixed);
    this.collected = shuffle(this.stable);
    callback();
  },
  tearDown: function(callback){
    stable = this.stable; collected = this.collected;
    state();
    callback();
  },
  test: function(test) {
    test.deepEqual(true, this.stable.length === this.collected.length, 'Sizes match');
    test.deepEqual(false, this.stable === this.collected, 'Not diffrent instances');
    test.done();
  }
};
module.exports['Shuffle, same values in stable are in collected'] = {
  setUp: function(callback){
    this.collected = shuffle(collected);
    callback();
  },
  tearDown: function(callback){
    collected = this.collected;
    state();
    callback();
  },
  test: function(test) {
    test.deepEqual(fixedCompare(stable, collected), true, 'Shuffled values are same as generated values');
    test.done();
  }
};
module.exports['Tidy collected'] = {
  setUp: function(callback){
    this.tidy = structure(stable, collected);
    callback();
  },
  tearDown: function(callback){
    tidy = this.tidy;
    state();
    callback();
  },
  test: function(test) {
    test.deepEqual(fixedCompare(stable, tidy),true, 'Structure function makes it tidy');
    test.done();
  }
};
module.exports['Remove random element from collected'] = {
  setUp: function(callback){
    this.collected = removeRandom(collected);
    this.tidy = structure(stable, collected);
    callback();
  },
  tearDown: function(callback){
    tidy = this.tidy;
    state();
    callback();
  },
  test: function(test) {
    test.deepEqual(fixedCompare(stable, this.tidy), true, 'Structure function makes it tidy');
    test.done();
  }
};
module.exports['Remove random amount of elements from collected'] = {
  setUp: function(callback){
    for(var i = 0; i < Math.floor(Math.random() * fixed);i++){
      this.collected = removeRandom(collected);
    }
    this.tidy = structure(stable, collected);
    callback();
  },
  tearDown: function(callback){
    tidy = this.tidy;
    state();
    callback();
  },
  test: function(test) {
    test.deepEqual(fixedCompare(stable, this.tidy), true, 'Structure function makes it tidy');
    test.done();
  }
};
module.exports['UP DOWN DOWN UP Problem'] = {
  setUp: function(callback){
    this.stable = [1,2,3,4,5];
    this.collected = [5,4,3,2,1];
    this.tidy = structure(this.stable, this.collected);
    callback();
  },
  tearDown: function(callback){
    stable = this.stable;
    collected = this.collected;
    tidy = this.tidy;
    state();
    callback();
  },
  test: function(test) {
    test.deepEqual(fixedCompare(this.stable, this.tidy), true, 'Down up is same as up Down.');
    test.done();
  }
};
