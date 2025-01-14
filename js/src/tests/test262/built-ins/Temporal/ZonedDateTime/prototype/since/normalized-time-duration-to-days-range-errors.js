// |reftest| skip-if(!this.hasOwnProperty('Temporal')) -- Temporal is not enabled unconditionally
// Copyright (C) 2022 Igalia, S.L. All rights reserved.
// This code is governed by the BSD license found in the LICENSE file.
/*---
esid: sec-temporal.zoneddatetime.prototype.since
description: >
  Abstract operation NormalizedTimeDurationToDays can throw four different
  RangeErrors.
info: |
  NormalizedTimeDurationToDays ( norm, zonedRelativeTo, timeZoneRec [ , precalculatedPlainDateTime ] )
    22. If days < 0 and sign = 1, throw a RangeError exception.
    23. If days > 0 and sign = -1, throw a RangeError exception.
    ...
    25. If NormalizedTimeDurationSign(_norm_) = 1 and sign = -1, throw a RangeError exception.
    ...
    28. If dayLength ≥ 2⁵³, throw a RangeError exception.
features: [Temporal, BigInt]
includes: [temporalHelpers.js]
---*/

function timeZoneSubstituteValues(
  getPossibleInstantsFor,
  getOffsetNanosecondsFor
) {
  const tz = new Temporal.TimeZone("UTC");
  TemporalHelpers.substituteMethod(
    tz,
    "getPossibleInstantsFor",
    getPossibleInstantsFor
  );
  TemporalHelpers.substituteMethod(
    tz,
    "getOffsetNanosecondsFor",
    getOffsetNanosecondsFor
  );
  return tz;
}

const dayNs = 86_400_000_000_000;
const zeroZDT = new Temporal.ZonedDateTime(0n, "UTC");
const oneZDT = new Temporal.ZonedDateTime(1n, "UTC");
const epochInstant = new Temporal.Instant(0n);
const options = { largestUnit: "days" };

// Step 22: days < 0 and sign = 1
let start = new Temporal.ZonedDateTime(
  0n, // Sets DifferenceZonedDateTime _ns1_
  timeZoneSubstituteValues(
    [[epochInstant]], // Returned in step 16, setting _relativeResult_
    [
      // Behave normally in 2 calls made prior to NormalizedTimeDurationToDays
      TemporalHelpers.SUBSTITUTE_SKIP,
      TemporalHelpers.SUBSTITUTE_SKIP,
      dayNs - 1, // Returned in step 8, setting _startDateTime_
      -dayNs + 1, // Returned in step 9, setting _endDateTime_
    ]
  )
);
assert.throws(RangeError, () =>
  start.since(
    oneZDT, // Sets DifferenceZonedDateTime _ns2_
    options
  )
);

// Step 23: days > 0 and sign = -1
start = new Temporal.ZonedDateTime(
  1n, // Sets DifferenceZonedDateTime _ns1_
  timeZoneSubstituteValues(
    [[epochInstant]], // Returned in step 16, setting _relativeResult_
    [
      // Behave normally in 2 calls made prior to NormalizedTimeDurationToDays
      TemporalHelpers.SUBSTITUTE_SKIP,
      TemporalHelpers.SUBSTITUTE_SKIP,
      -dayNs + 1, // Returned in step 8, setting _startDateTime_
      dayNs - 1, // Returned in step 9, setting _endDateTime_
    ]
  )
);
assert.throws(RangeError, () =>
  start.since(
    zeroZDT, // Sets DifferenceZonedDateTime _ns2_
    options
  )
);

// Step 25: nanoseconds > 0 and sign = -1
start = new Temporal.ZonedDateTime(
  1n, // Sets DifferenceZonedDateTime _ns1_
  timeZoneSubstituteValues(
    [[new Temporal.Instant(-1n)]], // Returned in step 16, setting _relativeResult_
    [
      // Behave normally in 2 calls made prior to NormalizedTimeDurationToDays
      TemporalHelpers.SUBSTITUTE_SKIP,
      TemporalHelpers.SUBSTITUTE_SKIP,
      dayNs - 1, // Returned in step 8, setting _startDateTime_
      -dayNs + 1, // Returned in step 9, setting _endDateTime_
    ]
  )
);
assert.throws(RangeError, () =>
  start.since(
    zeroZDT, // Sets DifferenceZonedDateTime _ns2_
    options
  )
);

// Step 28: day length is an unsafe integer
start = new Temporal.ZonedDateTime(
  0n,
  timeZoneSubstituteValues(
    // Not called in step 16 because _days_ = 0
    // Returned in step 21.a, making _oneDayFarther_ 2^53 ns later than _relativeResult_
    [[new Temporal.Instant(2n ** 53n)]],
    []
  )
);
assert.throws(RangeError, () =>
  start.since(
    oneZDT,
    options
  ),
  "Should throw RangeError when time zone calculates an outrageous day length"
);

reportCompare(0, 0);
