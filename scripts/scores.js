#!/usr/bin/env node
// Prints what the Standings tab will show, using the page's own scoring code.
// Usage: node scripts/scores.js [fri|sat|sun|mon]   (no argument = every round)
// Exits 1 if something looks wrong (a player half entered, an ignored press, ...).

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const src = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1])
  .find(s => s.includes('SCORES & STANDINGS'));
const ctx = {};
vm.createContext(ctx);
vm.runInContext(`${src}\nthis.api = { ROUNDS, PLAYERS, FORMATS, playingHandicaps, allowanceHandicap };`, ctx);
const { ROUNDS, PLAYERS, FORMATS, playingHandicaps } = ctx.api;

const only = process.argv[2];
const problems = [];
const isScore = v => Number.isInteger(v) && v > 0;
const money = v => (v > 0 ? `+$${v}` : v < 0 ? `-$${-v}` : '$0');
const outcome = (b, sides) => !b.result ? 'not decided'
  : !b.result.winner ? 'push'
  : `${sides[b.result.winner]} win ${b.result.text}`;
const holes = b => (b.start === b.end ? `hole ${b.start}` : `holes ${b.start}–${b.end}`);

for (const round of ROUNDS) {
  if (only && round.id !== only) continue;
  console.log(`\n=== ${round.day} · ${round.course} (${round.id}, ${round.format}) ===`);
  const ph = playingHandicaps(round);
  const pad = s => String(s).padStart(3);
  console.log(`hole     ${[...round.holes.keys()].map(i => pad(i + 1)).join('')}   out  in  tot`);
  console.log(`par      ${round.holes.map(h => pad(h.par)).join('')}`);
  for (const p of PLAYERS) {
    const sc = round.scores[p];
    const n = sc.filter(isScore).length;
    const tot = (a, b) => (sc.slice(a, b).every(isScore) ? sc.slice(a, b).reduce((x, y) => x + y, 0) : '–');
    console.log(`${p.padEnd(8)} ${sc.map(v => pad(isScore(v) ? v : '_')).join('')}   ${pad(tot(0, 9))} ${pad(tot(9, 18))} ${pad(tot(0, 18))}   (strokes ${ph[p]})`);
    if (n > 0 && n < 18) problems.push(`${round.day}: ${p} has ${n} of 18 holes entered`);
  }

  const res = FORMATS[round.format].results(round);
  if (round.format === 'sixes') {
    for (const m of res.matches) {
      const sides = m.teams ? { A: m.teams.A.join(' & '), B: m.teams.B.join(' & ') } : {};
      console.log(`${m.key} (${holes(m)}): ${outcome(m, sides)}`);
    }
    for (const pr of res.presses) {
      const sides = { A: pr.teams.A.join(' & '), B: pr.teams.B.join(' & ') };
      console.log(`${pr.label} (${holes(pr)}, pressed by ${sides[pr.pressedBy]}): ${outcome(pr, sides)}`);
    }
  }
  if (round.format === 'nassau') {
    if (!res.ready) {
      console.log(`Teams: not set yet (${res.resolved.reason})`);
      const entered = PLAYERS.some(p => round.scores[p].some(isScore));
      if (entered) problems.push(`${round.day}: scores entered but teams aren't set (${res.resolved.reason}) — finish ${res.resolved.src?.day ?? 'the earlier round'} or set teams by hand`);
    }
    else {
      const sides = { A: res.teams.A.join(' & '), B: res.teams.B.join(' & ') };
      console.log(`Teams: A = ${sides.A}, B = ${sides.B} (${res.resolved.source})`);
      for (const b of res.bets) console.log(`${b.label} (${holes(b)}): ${outcome(b, sides)}`);
    }
  }
  if (round.format === 'stableford') {
    console.log('Points: ' + res.rows.map(r => `${r.rank ?? '-'}. ${r.player} ${r.total ?? '–'}`).join(' · '));
  }
  if (round.format === 'stroke') {
    console.log('Net: ' + res.rows.map(r => `${r.rank ?? '-'}. ${r.player} ${r.total ?? '–'}`).join(' · '));
  }
  for (const e of res.invalidPresses || []) problems.push(`${round.day}: press ignored — ${e}`);
  console.log(res.complete
    ? 'Money: ' + PLAYERS.map(p => `${p} ${money(res.money[p])}`).join(' · ')
    : 'Money: TBD (round not complete)');
}

if (problems.length) {
  console.log('\nPROBLEMS:\n' + problems.map(p => `- ${p}`).join('\n'));
  process.exit(1);
}
console.log('\nOK');
