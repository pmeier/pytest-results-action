async function* prefixAsyncGenerator<T>(prefix: T, gen: AsyncGenerator<T>): AsyncGenerator<T> {
  yield prefix;
  for await (const item of gen) {
    yield item;
  }
}

interface GeneratorCheckResult<T> {
  isEmpty: boolean;
  generator: AsyncGenerator<T>;
}

export async function checkAsyncGeneratorEmpty<T>(gen: AsyncGenerator<T>): Promise<GeneratorCheckResult<T>> {
  const { done, value } = await gen.next();
  let isEmpty: boolean;
  let out_gen: AsyncGenerator<T>;
  
  if (done) {
    isEmpty = true;
    out_gen = gen;
  } else {
    isEmpty = false;
    out_gen = prefixAsyncGenerator(value, gen);
  }

  return { isEmpty, generator: out_gen };
}

export function prettyDuration(seconds: number): string {
  seconds = Math.ceil(seconds);

  let minutes = Math.floor(seconds / 60);
  if (minutes === 0) {
    return `${seconds}s`;
  }
  seconds = seconds % 60;

  const hours = Math.floor(minutes / 60);
  if (hours === 0) {
    return `${minutes}m ${seconds}s`;
  }
  minutes = minutes % 60;

  return `${hours}h ${minutes}m ${seconds}s`;
}

export function zip<T, U>(a: T[], b: U[]): [T, U][] {
  return a.map((obj, idx) => [obj, b[idx]]);
} 