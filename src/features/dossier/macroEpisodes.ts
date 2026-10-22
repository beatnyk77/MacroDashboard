/**
 * Shared library of documented macro episodes used to annotate dossier charts.
 * Entries are dated public events only. What each series did around an episode is
 * computed from data at render time (dossierStats.episodeOutcome), never written here.
 */

export interface MacroEpisode {
    date: string;
    label: string;
    note: string;
}

export const MACRO_EPISODES = {
    nixonShock: {
        date: '1971-08-15',
        label: 'Nixon closes the gold window',
        note: 'The US suspends dollar convertibility into gold, ending the Bretton Woods peg.',
    },
    oilEmbargo: {
        date: '1973-10-17',
        label: 'OPEC oil embargo',
        note: 'Arab OPEC members embargo oil exports to the US, quadrupling crude prices within months.',
    },
    volckerShock: {
        date: '1979-10-06',
        label: 'Volcker shock',
        note: 'The Fed switches to targeting reserves, letting the funds rate rise toward 20%.',
    },
    goldPeak1980: {
        date: '1980-01-21',
        label: 'Gold peaks at $850',
        note: 'London gold fixes at $850/oz amid double-digit inflation and the Soviet invasion of Afghanistan.',
    },
    blackMonday: {
        date: '1987-10-19',
        label: 'Black Monday',
        note: 'The Dow falls 22.6% in a single session; the Fed pledges liquidity the next morning.',
    },
    ltcm: {
        date: '1998-09-23',
        label: 'LTCM rescue',
        note: 'The New York Fed brokers a private recapitalisation of Long-Term Capital Management.',
    },
    euroLaunch: {
        date: '1999-01-01',
        label: 'Euro launches',
        note: 'The euro becomes the unit of account for eleven member states, creating a second reserve currency candidate.',
    },
    dotcomPeak: {
        date: '2000-03-10',
        label: 'Nasdaq peaks',
        note: 'The Nasdaq Composite tops out above 5,000 before falling roughly 78% by October 2002.',
    },
    bnpFreeze: {
        date: '2007-08-09',
        label: 'BNP Paribas freezes funds',
        note: 'BNP suspends redemptions on three funds exposed to US subprime, the first open interbank funding shock of the GFC.',
    },
    lehman: {
        date: '2008-09-15',
        label: 'Lehman Brothers fails',
        note: 'Lehman files for bankruptcy; money markets seize and the Fed balance sheet more than doubles by year-end.',
    },
    qe1: {
        date: '2008-11-25',
        label: 'QE1 announced',
        note: 'The Fed announces purchases of agency debt and MBS, the start of large-scale asset purchases.',
    },
    goldPeak2011: {
        date: '2011-09-06',
        label: 'Gold nominal high',
        note: 'Gold reaches a then-record near $1,900/oz after the US credit-rating downgrade.',
    },
    taperTantrum: {
        date: '2013-05-22',
        label: 'Taper tantrum',
        note: 'Bernanke signals QE purchases could slow; 10-year yields rise about 100bp over the summer.',
    },
    qe3End: {
        date: '2014-10-29',
        label: 'QE3 ends',
        note: 'The FOMC concludes net asset purchases; the balance sheet plateaus near $4.5T.',
    },
    liftoff2015: {
        date: '2015-12-16',
        label: 'First hike since 2006',
        note: 'The Fed raises the funds target range to 0.25–0.50%, ending seven years at the zero bound.',
    },
    qt2017: {
        date: '2017-10-01',
        label: 'QT begins',
        note: 'The Fed starts passive balance-sheet runoff for the first time since the GFC.',
    },
    repoSpike2019: {
        date: '2019-09-17',
        label: 'Repo market spike',
        note: 'Overnight repo rates jump toward 10% as reserves run short; the Fed restarts repo operations.',
    },
    covidQe: {
        date: '2020-03-15',
        label: 'Covid emergency easing',
        note: 'The Fed cuts to zero and announces $700B of asset purchases, made open-ended on March 23.',
    },
    hikingCycle2022: {
        date: '2022-03-16',
        label: '2022 hiking cycle begins',
        note: 'The first of eleven hikes that lift the funds target range to 5.25–5.50% by July 2023.',
    },
    russiaReserves: {
        date: '2022-02-28',
        label: 'Russian reserves frozen',
        note: 'G7 sanctions immobilise roughly half of the Bank of Russia’s reserves, reviving reserve-diversification demand.',
    },
    qt2022: {
        date: '2022-06-01',
        label: 'QT2 begins',
        note: 'The Fed begins its second balance-sheet runoff, capped at $95B a month from September.',
    },
    rrpPeak: {
        date: '2022-12-30',
        label: 'Reverse repo peaks',
        note: 'Overnight RRP usage tops $2.5T as money funds park excess cash at the Fed.',
    },
    svb: {
        date: '2023-03-10',
        label: 'SVB fails',
        note: 'Silicon Valley Bank is closed; the Fed launches the Bank Term Funding Program two days later.',
    },
    debtCeiling2023: {
        date: '2023-06-03',
        label: 'Debt ceiling suspended',
        note: 'The Fiscal Responsibility Act suspends the limit; the Treasury rebuilds its cash balance rapidly.',
    },
    debtCeiling2021: {
        date: '2021-08-01',
        label: 'Debt limit reinstated',
        note: 'The limit returns; the Treasury draws its cash balance down until the limit is raised in October and again in December.',
    },
    cuts2024: {
        date: '2024-09-18',
        label: 'Easing cycle begins',
        note: 'The Fed cuts by 50bp, its first rate reduction since March 2020.',
    },
} satisfies Record<string, MacroEpisode>;

export type EpisodeKey = keyof typeof MACRO_EPISODES;
