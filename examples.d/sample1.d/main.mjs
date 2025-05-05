import { bind, of } from "../../io.mjs";

import {
  createGetterUsingUniqueId,
  createGetterWithCache,
  createKeyValStore,
  getter2nonNullOrReject,
  kvstore2getter,
} from "../../fetchc.mjs";

/**
 * @import { IO } from "../../io.mjs"
 */

/**
 * @import { GetResultByQuery } from "../../fetchc.mjs"
 */

/**
 * @typedef {object} SimpleQuery
 * @property {string} shipId
 * @property {string} containerId
 */

/**
 * @typedef {number[]} BucketIdList
 */

/** @type Map<string, number[]> */
const cache = new Map([
  ["cafef00d-2025-05-01", [333, 634]],
  ["cafef00d-2025-05-02", [599, 3776]],
  ["cafef00d-2025-05-03", [42, 42195]],

  ["dafef00d-2025-05-01", [330, 630]],
  ["dafef00d-2025-05-02", [590, 3770]],
  ["dafef00d-2025-05-03", [40, 42190]],
]);

/** @type Map<string, number[]> */
const dummySlowStore = new Map([
  ["cafef00d-2025-05-01", [333, 634]],
  ["cafef00d-2025-05-02", [599, 3776]],
  ["cafef00d-2025-05-03", [42, 42195]],
  ["cafef00d-2025-05-04", [41, 42194]],

  ["dafef00d-2025-05-01", [330, 630]],
  ["dafef00d-2025-05-02", [590, 3770]],
  ["dafef00d-2025-05-03", [40, 42190]],
  ["dafef00d-2025-05-04", [39, 42189]],
]);

/** @type GetResultByQuery<SimpleQuery, BucketIdList?> */
const dummyCache = kvstore2getter(
  (key) => {
    return () => Promise.resolve(cache.get(key) || null);
  },
  (query) => {
    return () => {
      /** @type string */
      const shipId = query.shipId;

      /** @type string */
      const containerId = query.containerId;

      return Promise.resolve(`${shipId}-${containerId}`);
    };
  },
  (value) => {
    return () => Promise.resolve(value);
  },
);

/** @type GetResultByQuery<SimpleQuery, BucketIdList?> */
const dummySlowDb = kvstore2getter(
  (key) => {
    return () =>
      new Promise((resolve) =>
        setTimeout(
          function () {
            resolve(undefined);
          },
          1000,
        )
      )
        .then((_) => {
          /** @type BucketIdList? */
          const lst = dummySlowStore.get(key) ?? null;

          return Promise.resolve(lst);
        });
  },
  (query) => {
    return () => {
      /** @type string */
      const shipId = query.shipId;

      /** @type string */
      const containerId = query.containerId;

      return Promise.resolve(`${shipId}-${containerId}`);
    };
  },
  (value) => {
    return () => Promise.resolve(value);
  },
);

/** @type GetResultByQuery<SimpleQuery, BucketIdList> */
const dummyDb = createGetterWithCache(
  dummyCache,
  getter2nonNullOrReject(dummySlowDb),
);

/** @type string */
const cid0 = "2025-05-03";

/** @type string */
const cid1 = "2025-05-04";

/** @type string */
const cid = cid0;
//const cid=cid1

/** @type IO<SimpleQuery> */
const isampleQuery = of(Object.freeze({
  shipId: "cafef00d",
  containerId: cid,
}));

/** @type IO<BucketIdList> */
const ilist = bind(isampleQuery, dummyDb);

/** @type function(BucketIdList): IO<Void> */
const list2stdout = (list) => {
  return () => {
    console.info(list);
    return Promise.resolve();
  };
};

/** @type IO<Void> */
const main = bind(ilist, list2stdout);

main()
  .catch(console.error);
