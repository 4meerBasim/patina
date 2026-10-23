import { describe, expect, it } from '@jest/globals';

import { contributionsVsMarket, moneyWeightedReturn, timeWeightedReturn } from '@/lib/returns';

const JAN = '2020-01-01T00:00:00.000Z';
const JUL = '2020-07-01T00:00:00.000Z';
const NEXT_JAN = '2021-01-01T00:00:00.000Z';
const ONE_YEAR_LATER = '2020-12-31T06:00:00.000Z';

describe('timeWeightedReturn', () => {
  it('returns the period return for one holding carried across a price change', () => {
    expect(
      timeWeightedReturn(
        [
          { date: JAN, value: 1000 },
          { date: JUL, value: 1100 },
        ],
        [],
      ),
    ).toBeCloseTo(0.1, 10);
  });

  it('chain-links two period returns rather than dividing the last mark by the first', () => {
    const twr = timeWeightedReturn(
      [
        { date: JAN, value: 100 },
        { date: JUL, value: 220 },
        { date: NEXT_JAN, value: 275 },
      ],
      [{ date: JUL, amount: 100 }],
    );

    expect(twr).toBeCloseTo(1.2 * 1.25 - 1, 10);
    expect(twr).toBeCloseTo(0.5, 10);
    expect(twr).not.toBeCloseTo(275 / 100 - 1, 2);
  });

  it('compounds two consecutive gains instead of adding them', () => {
    const twr = timeWeightedReturn(
      [
        { date: JAN, value: 100 },
        { date: JUL, value: 120 },
        { date: NEXT_JAN, value: 150 },
      ],
      [],
    );

    expect(twr).toBeCloseTo(1.2 * 1.25 - 1, 10);
    expect(twr).not.toBeCloseTo(0.2 + 0.25, 3);
  });

  it('weights a mid-period contribution by the part of the period it was invested', () => {
    const twr = timeWeightedReturn(
      [
        { date: JAN, value: 1000 },
        { date: JUL, value: 2100 },
      ],
      [{ date: '2020-01-15T00:00:00.000Z', amount: 1000 }],
    );

    // Modified Dietz: the contribution was at work for 168 of the period's 182 days.
    expect(twr).toBeCloseTo(100 / (1000 + (1000 * 168) / 182), 10);
    expect(twr).toBeCloseTo(0.052, 10);
    expect(twr).not.toBeCloseTo(2100 / 1000 - 1, 2);
    expect(twr).toBeLessThan(0.1);
  });

  it('charges the full period to a contribution dated at the period end', () => {
    const twr = timeWeightedReturn(
      [
        { date: JAN, value: 1000 },
        { date: JUL, value: 2100 },
      ],
      [{ date: JUL, amount: 1000 }],
    );

    expect(twr).toBeCloseTo(0.1, 10);
  });

  it('weights a mid-period withdrawal by the part of the period it was absent', () => {
    const twr = timeWeightedReturn(
      [
        { date: JAN, value: 1000 },
        { date: JUL, value: 700 },
      ],
      [{ date: '2020-03-01T00:00:00.000Z', amount: -400 }],
    );

    // The 400 left after 60 of the period's 182 days, so it earned for none of the rest.
    expect(twr).toBeCloseTo(100 / (1000 - (400 * 122) / 182), 10);
    expect(twr).toBeGreaterThan(0.1);
  });

  it('returns a negative figure when the portfolio loses value', () => {
    expect(
      timeWeightedReturn(
        [
          { date: JAN, value: 1000 },
          { date: JUL, value: 800 },
        ],
        [],
      ),
    ).toBeCloseTo(-0.2, 10);
  });

  it('returns a finite period return for two marks sharing the same date', () => {
    const twr = timeWeightedReturn(
      [
        { date: JAN, value: 100 },
        { date: JAN, value: 110 },
      ],
      [],
    );

    expect(Number.isFinite(twr)).toBe(true);
    expect(twr).toBeCloseTo(0.1, 10);
  });

  it('skips a leading period that starts from a zero value', () => {
    const twr = timeWeightedReturn(
      [
        { date: JAN, value: 0 },
        { date: JUL, value: 100 },
      ],
      [{ date: JUL, amount: 100 }],
    );

    expect(Number.isFinite(twr)).toBe(true);
    expect(twr).toBe(0);
  });

  it('drops a zero mark that a later non-zero mark proves was a missing valuation', () => {
    const twr = timeWeightedReturn(
      [
        { date: JAN, value: 100 },
        { date: JUL, value: 0 },
        { date: NEXT_JAN, value: 50 },
      ],
      [],
    );

    expect(Number.isNaN(twr)).toBe(false);
    expect(Number.isFinite(twr)).toBe(true);
    expect(twr).toBeCloseTo(-0.5, 10);
  });

  it('reports the real gain when a missing quote zeroes a day in the middle', () => {
    const twr = timeWeightedReturn(
      [
        { date: JAN, value: 100000 },
        { date: JUL, value: 0 },
        { date: NEXT_JAN, value: 120000 },
      ],
      [],
    );

    expect(twr).toBeCloseTo(0.2, 10);
  });

  it('still reports a total loss when the series ends at zero', () => {
    expect(
      timeWeightedReturn(
        [
          { date: JAN, value: 100 },
          { date: JUL, value: 0 },
        ],
        [],
      ),
    ).toBeCloseTo(-1, 10);
  });

  it('still reports a total loss when a wipeout is followed by fresh money', () => {
    const twr = timeWeightedReturn(
      [
        { date: JAN, value: 100 },
        { date: JUL, value: 0 },
        { date: NEXT_JAN, value: 50 },
      ],
      [{ date: NEXT_JAN, amount: 50 }],
    );

    expect(twr).toBeCloseTo(-1, 10);
  });

  it('returns zero when there are fewer than two valuation marks', () => {
    expect(timeWeightedReturn([], [])).toBe(0);
    expect(timeWeightedReturn([{ date: JAN, value: 1000 }], [])).toBe(0);
    expect(timeWeightedReturn([{ date: JAN, value: 1000 }], [{ date: JUL, amount: 500 }])).toBe(0);
  });

  it('produces the same answer for unsorted valuation marks as for sorted ones', () => {
    const marks = [
      { date: JAN, value: 100 },
      { date: JUL, value: 220 },
      { date: NEXT_JAN, value: 275 },
    ];
    const flows = [{ date: JUL, amount: 100 }];

    expect(timeWeightedReturn([marks[2], marks[0], marks[1]], flows)).toBeCloseTo(
      timeWeightedReturn(marks, flows),
      10,
    );
    expect(timeWeightedReturn([marks[2], marks[0], marks[1]], flows)).toBeCloseTo(0.5, 10);
  });

  it('returns a finite figure when a withdrawal empties the account and the final mark is zero', () => {
    const twr = timeWeightedReturn(
      [
        { date: JAN, value: 1000 },
        { date: JUL, value: 1100 },
        { date: NEXT_JAN, value: 0 },
      ],
      [{ date: '2020-12-31T00:00:00.000Z', amount: -1100 }],
    );

    expect(Number.isFinite(twr)).toBe(true);
    expect(Number.isNaN(twr)).toBe(false);
    expect(twr).toBeCloseTo(0.1, 10);
  });
});

describe('moneyWeightedReturn', () => {
  it('solves a ten percent annual gain as a ten percent internal rate of return', () => {
    const mwr = moneyWeightedReturn([{ date: JAN, amount: 1000 }], {
      date: ONE_YEAR_LATER,
      value: 1100,
    });

    expect(mwr?.annualised).toBe(true);
    expect(mwr?.rate).toBeCloseTo(0.1, 6);
  });

  it('solves a ten percent annual loss as a negative internal rate of return', () => {
    const mwr = moneyWeightedReturn([{ date: JAN, amount: 1000 }], {
      date: ONE_YEAR_LATER,
      value: 900,
    });

    expect(mwr?.annualised).toBe(true);
    expect(mwr?.rate).toBeCloseTo(-0.1, 6);
  });

  it('exceeds the time-weighted return when a large contribution lands before a gain', () => {
    const valuations = [
      { date: JAN, value: 1000 },
      { date: JUL, value: 10000 },
      { date: NEXT_JAN, value: 15000 },
    ];
    const flows = [
      { date: JAN, amount: 1000 },
      { date: JUL, amount: 9000 },
    ];

    const twr = timeWeightedReturn(valuations, [{ date: JUL, amount: 9000 }]);
    const mwr = moneyWeightedReturn(flows, { date: NEXT_JAN, value: 15000 });

    expect(twr).toBeCloseTo(0.5, 10);
    expect(mwr?.annualised).toBe(true);
    expect(mwr?.rate).toBeCloseTo(1.0562, 3);
    expect(mwr?.rate as number).toBeGreaterThan(twr);
  });

  it('falls below the time-weighted return when a large contribution lands before a loss', () => {
    const valuations = [
      { date: JAN, value: 1000 },
      { date: JUL, value: 10000 },
      { date: NEXT_JAN, value: 5000 },
    ];
    const flows = [
      { date: JAN, amount: 1000 },
      { date: JUL, amount: 9000 },
    ];

    const twr = timeWeightedReturn(valuations, [{ date: JUL, amount: 9000 }]);
    const mwr = moneyWeightedReturn(flows, { date: NEXT_JAN, value: 5000 });

    expect(twr).toBeCloseTo(-0.5, 10);
    expect(mwr?.annualised).toBe(true);
    expect(mwr?.rate).toBeCloseTo(-0.722, 3);
    expect(mwr?.rate as number).toBeLessThan(twr);
  });

  it('returns null when every cash flow has the same sign', () => {
    expect(
      moneyWeightedReturn(
        [
          { date: JAN, amount: -500 },
          { date: JUL, amount: -300 },
        ],
        { date: NEXT_JAN, value: 200 },
      ),
    ).toBeNull();
  });

  it('returns null for an empty flow list', () => {
    expect(moneyWeightedReturn([], { date: NEXT_JAN, value: 1000 })).toBeNull();
  });

  it('returns null when the portfolio is a total loss and the final value is zero', () => {
    expect(
      moneyWeightedReturn([{ date: JAN, amount: 1000 }], { date: NEXT_JAN, value: 0 }),
    ).toBeNull();
  });

  it('reports a period return rather than a rate for a window of hours', () => {
    const mwr = moneyWeightedReturn([{ date: JAN, amount: 100 }], {
      date: '2020-01-01T01:00:00.000Z',
      value: 200,
    });

    expect(mwr?.annualised).toBe(false);
    expect(mwr?.rate).toBeCloseTo(1, 10);
  });

  it('reports no rate for a total loss', () => {
    expect(moneyWeightedReturn([{ date: JAN, amount: 1000 }], { date: NEXT_JAN, value: 0 })).toBeNull();
  });

  it('reports a period return rather than a four-figure rate for a gain over a month', () => {
    const mwr = moneyWeightedReturn([{ date: JAN, amount: 1000 }], {
      date: '2020-01-26T00:00:00.000Z',
      value: 1250,
    });

    expect(mwr?.annualised).toBe(false);
    expect(mwr?.rate).toBeCloseTo(0.25, 10);
  });

  it('annualises once the window reaches a month', () => {
    const mwr = moneyWeightedReturn([{ date: JAN, amount: 1000 }], {
      date: '2020-02-01T00:00:00.000Z',
      value: 1010,
    });

    expect(mwr?.annualised).toBe(true);
  });

  it('counts money taken out in a short-window period return', () => {
    const mwr = moneyWeightedReturn(
      [
        { date: JAN, amount: 1000 },
        { date: '2020-01-10T00:00:00.000Z', amount: -50 },
      ],
      { date: '2020-01-20T00:00:00.000Z', value: 1000 },
    );

    expect(mwr?.annualised).toBe(false);
    expect(mwr?.rate).toBeCloseTo(0.05, 10);
  });

  it('reports a period return for a zero-length period', () => {
    const mwr = moneyWeightedReturn([{ date: JAN, amount: 1000 }], { date: JAN, value: 1100 });

    expect(mwr?.annualised).toBe(false);
    expect(mwr?.rate).toBeCloseTo(0.1, 10);
  });

  it('reports no rate when the end value rounds to nothing', () => {
    expect(
      moneyWeightedReturn([{ date: JAN, amount: 1000 }], {
        date: ONE_YEAR_LATER,
        value: 0.000001,
      }),
    ).toBeNull();
  });

  it('returns a finite rate, never NaN, when a solution does exist', () => {
    const mwr = moneyWeightedReturn([{ date: JAN, amount: 1000 }], {
      date: ONE_YEAR_LATER,
      value: 1100,
    });
    expect(mwr).not.toBeNull();
    expect(Number.isFinite(mwr?.rate as number)).toBe(true);
  });

  it('solves a multi-contribution schedule to a rate that zeroes the net present value', () => {
    const mwr = moneyWeightedReturn(
      [
        { date: JAN, amount: 1000 },
        { date: JUL, amount: 1000 },
      ],
      { date: NEXT_JAN, value: 2200 },
    );

    expect(mwr).not.toBeNull();
    const rate = mwr?.rate as number;
    const years = (to: string): number =>
      (Date.parse(to) - Date.parse(JAN)) / (365.25 * 24 * 60 * 60 * 1000);
    const npv =
      -1000 -
      1000 / (1 + rate) ** years(JUL) +
      2200 / (1 + rate) ** years(NEXT_JAN);

    expect(npv).toBeCloseTo(0, 5);
    expect(rate).toBeGreaterThan(0.1);
    expect(rate).toBeLessThan(0.2);
  });
});

describe('contributionsVsMarket', () => {
  it('splits the change into the flow sum and the residual market movement', () => {
    const { contributions, market } = contributionsVsMarket(1000, 1500, [
      { date: JAN, amount: 300 },
      { date: JUL, amount: -100 },
    ]);

    expect(contributions).toBe(200);
    expect(market).toBe(300);
    expect(contributions + market).toBe(1500 - 1000);
  });

  it('attributes the whole change to the market when there are no flows', () => {
    expect(contributionsVsMarket(1000, 1200, [])).toEqual({ contributions: 0, market: 200 });
  });

  it('reports a negative market component when flows exceed the change in value', () => {
    const { contributions, market } = contributionsVsMarket(1000, 1100, [
      { date: JAN, amount: 500 },
    ]);

    expect(contributions).toBe(500);
    expect(market).toBe(-400);
    expect(contributions + market).toBe(100);
  });

  it('reports a negative contribution total when withdrawals outweigh deposits', () => {
    const { contributions, market } = contributionsVsMarket(5000, 4000, [
      { date: JAN, amount: 500 },
      { date: JUL, amount: -2000 },
    ]);

    expect(contributions).toBe(-1500);
    expect(market).toBe(500);
    expect(contributions + market).toBe(4000 - 5000);
  });
});
