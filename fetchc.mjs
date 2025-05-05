import { bind, lift } from "./io.mjs";

/**
 * @import { IO } from "./io.mjs"
 */

/**
 * @template Q
 * @template R
 * @typedef {function(Q): IO<R>} GetResultByQuery<Q, R>
 */

/**
 * Decorates the data source using the cache.
 * @template Q
 * @template R
 * @param {GetResultByQuery<Q,R?>} cache
 * @param {GetResultByQuery<Q,R>} source
 * @returns {GetResultByQuery<Q,R>}
 */
export function createGetterWithCache(
  cache,
  source,
) {
  return (query) => {
    /** @type IO<R?> */
    const ior = cache(query);

    return bind(
      ior,
      (ores) => {
        if (ores) return () => Promise.resolve(ores);
        return source(query);
      },
    );
  };
}

/**
 * @template K
 * @template V
 * @typedef {function(K): IO<V>} KeyValStore<K, V>
 */

/**
 * Creates a data source using the key/val store.
 * @template K
 * @template V
 * @template Q
 * @template R
 * @param {KeyValStore<K, V?>} kvstore
 * @param {function(Q): IO<K>} query2key
 * @param {function(V): IO<R>} value2result
 * @returns {GetResultByQuery<Q,R?>}
 */
export function kvstore2getter(kvstore, query2key, value2result) {
  return (query) => {
    /** @type IO<K> */
    const ikey = query2key(query);

    /** @type IO<V?> */
    const ivalo = bind(ikey, (key) => kvstore(key));

    /** @type IO<R?> */
    const ireso = bind(
      ivalo,
      (valo) => {
        if (!valo) return () => Promise.resolve(null);

        /** @type V */
        const val = valo;

        return value2result(val);
      },
    );

    return ireso;
  };
}

/**
 * @template Q
 * @param {Q} query
 * @returns {IO<string>}
 */
const query2jsonKey = (query) => () => Promise.resolve(JSON.stringify(query));

/**
 * @template R
 * @param {string} jval
 * @returns {IO<R>}
 */
const jsonValueToResult = (jval) => () => Promise.resolve(JSON.parse(jval));

/**
 * @typedef {function(Uint8Array): IO<Uint8Array?>} RawKeyValStore
 */

/**
 * Creates key/val store using the raw key/val store and decoder/encoder.
 * @template K
 * @template V
 * @param {RawKeyValStore} raw
 * @param {function(K): IO<Uint8Array>} key2bytes
 * @param {function(Uint8Array): IO<V>} bytes2val
 * @returns {KeyValStore<K, V?>}
 */
export function createKeyValStore(
  raw,
  key2bytes,
  bytes2val,
) {
  return (key) => {
    /** @type IO<Uint8Array> */
    const irk = key2bytes(key);

    /** @type IO<Uint8Array?> */
    const irvo = bind(irk, (key) => raw(key));

    return bind(
      irvo,
      (rvalo) => {
        if (!rvalo) return () => Promise.resolve(null);

        /* @type Uint8Array */
        const rval = rvalo;

        return bytes2val(rval);
      },
    );
  };
}

/**
 * Creates a new getter which checks a unique id and returns null when unmatch.
 * @template Q
 * @template R
 * @template I
 * @param {GetResultByQuery<Q, R?>} getter The original getter.
 * @param {function(Q): IO<I>} query2id
 * @param {function(R): IO<I>} result2id
 * @returns {GetResultByQuery<Q, R?>} The decorated getter.
 */
export function createGetterUsingUniqueId(
  getter,
  query2id,
  result2id,
) {
  return (query) => {
    /** @type IO<I> */
    const iqid = query2id(query);

    /** @type IO<R?> */
    const iro = getter(query);

    return bind(
      iro,
      (ro) => {
        if (!ro) return () => Promise.resolve(null);

        /** @type R */
        const rslt = ro;

        /** @type IO<I> */
        const irid = result2id(rslt);

        /** @type IO<boolean> */
        const isame = bind(
          iqid,
          (qid) =>
            bind(
              irid,
              lift((rid) => Promise.resolve(rid == qid)),
            ),
        );

        return bind(
          isame,
          lift((same) => Promise.resolve(same ? rslt : null)),
        );
      },
    );
  };
}

/**
 * Creates new getter which rejects null value.
 * @template Q
 * @template R
 * @param {GetResultByQuery<Q,R?>} getter The original getter.
 * @returns {GetResultByQuery<Q,R>}
 */
export function getter2nonNullOrReject(getter) {
  return (query) => {
    /** @type IO<R?> */
    const iro = getter(query);

    return bind(
      iro,
      (ro) => {
        if (!ro) return () => Promise.reject("not found");

        /** @type R */
        const r = ro;

        return () => Promise.resolve(r);
      },
    );
  };
}
