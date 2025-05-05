/**
 * @template T
 * @typedef {function(): Promise<T>} IO<T>
 */

/**
 * @template T
 * @param {T} t
 * @returns {IO<T>}
 */
export function of(t) {
  return () => {
    return Promise.resolve(t);
  };
}

/**
 * @template T
 * @template U
 * @param {IO<T>} io
 * @param {function(T): IO<U>} mapper
 * @returns {IO<U>}
 */
export function bind(io, mapper) {
  return () => {
    return Promise.resolve()
      .then((_) => io())
      .then((t) => mapper(t)());
  };
}

/**
 * @template T
 * @template U
 * @param {function(T): Promise<U>} pure
 * @returns {function(T): IO<U>}
 */
export function lift(pure) {
  return (t) => {
    return () => {
      return pure(t);
    };
  };
}

/**
 * @template T
 * @param {Array<IO<T>>} ios
 * @returns {IO<T[]>}
 */
export function all(ios) {
  return () => {
    /** @type Array<Promise<T>> */
    const mapd = ios.map((i) => i());

    return Promise.all(mapd);
  };
}
