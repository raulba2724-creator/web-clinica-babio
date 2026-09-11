import test from 'node:test';
import assert from 'node:assert/strict';
import { publicationTime, isVisible, effectiveDate, dueSchedules } from './publication-schedule.mjs';
test('Madrid winter, summer, explicit offset and invalid dates', () => {
  assert.equal(publicationTime('2026-09-21T09:30'), Date.parse('2026-09-21T07:30Z'));
  assert.equal(publicationTime('2026-12-21T09:30'), Date.parse('2026-12-21T08:30Z'));
  assert.equal(publicationTime('2026-10-25T02:30+01:00'), Date.parse('2026-10-25T01:30Z'));
  for (const date of ['2026-02-30T10:00', '2026-03-29T02:30', '2026-10-25T02:30', 'bad', '2026-09-21']) assert.throws(() => publicationTime(date));
});
test('future posts remain hidden, exact deadline releases, drafts stay hidden', () => {
  const p = {published:true, publish_at:'2026-09-21T09:30'};
  const deadline = publicationTime(p.publish_at);
  assert.equal(isVisible(p, deadline-1), false);
  assert.equal(isVisible(p, deadline), true);
  assert.equal(isVisible({...p,published:false}, deadline+1), false);
  assert.equal(isVisible({published:true,date:'2026-01-01'}), true);
  assert.equal(effectiveDate({...p,date:'2026-09-01'}), '2026-09-21');
});
test('scheduler catches missed deadlines without duplicate deploys; respects rescheduling', () => {
  const p = {slug:'example',published:true,publish_at:'2026-09-21T09:30'};
  const now = Date.parse('2026-09-23T10:00Z');
  assert.deepEqual(dueSchedules([p],{},now), {example:p.publish_at});
  assert.deepEqual(dueSchedules([p],{example:p.publish_at},now), {});
  assert.deepEqual(dueSchedules([{...p,publish_at:'2026-10-01T10:00'}],{},now), {});
  assert.deepEqual(dueSchedules([{...p,published:false}],{},now), {});
});
