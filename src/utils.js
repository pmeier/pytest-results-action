module.exports = { checkAsyncGeneratorEmpty, prettyDuration, zip };

async function* prefixAsyncGenerator(prefix, gen) {
  yield prefix;
  for await (const item of gen) {
    yield item;
  }
}

async function checkAsyncGeneratorEmpty(gen) {
  const { done, value } = await gen.next();
  var isEmpty;
  var out_gen;
  if (done) {
    isEmpty = true;
    out_gen = gen;
  } else {
    isEmpty = false;
    out_gen = prefixAsyncGenerator(value, gen);
  }

  return { isEmpty: isEmpty, generator: out_gen };
}

function prettyDuration(seconds) {
  var seconds = Math.ceil(seconds);

  var minutes = Math.floor(seconds / 60);
  if (minutes == 0) {
    return `${seconds}s`;
  }
  seconds = seconds % 60;

  const hours = Math.floor(minutes / 60);
  if (hours == 0) {
    return `${minutes}m ${seconds}s`;
  }
  minutes = minutes % 60;

  return `${hours}h ${minutes}m ${seconds}s`;
}

function zip(a, b) {
  return a.map((obj, idx) => [obj, b[idx]]);
}
