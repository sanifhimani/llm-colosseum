import cron from 'node-cron';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

let jobs = [];

function buildCron(timeStr, days) {
  const [hour, minute] = timeStr.split(':');
  return `${minute} ${hour} * * ${days}`;
}

export function startScheduler(dataDir, triggerBattle) {
  stopScheduler();

  const schedulePath = resolve(dataDir, 'schedule.json');
  if (!existsSync(schedulePath)) {
    console.log('[scheduler] no schedule.json found, skipping');
    return;
  }

  const schedule = JSON.parse(readFileSync(schedulePath, 'utf-8'));

  if (!schedule.enabled) {
    console.log('[scheduler] scheduling disabled');
    return;
  }

  const tz = schedule.timezone;
  const weekdayCron = buildCron(schedule.weekday, '1-5');
  const weekendCron = buildCron(schedule.weekend, '0,6');

  jobs.push(cron.schedule(weekdayCron, () => {
    console.log('[scheduler] weekday cron fired');
    triggerBattle();
  }, { timezone: tz }));
  console.log(`[scheduler] weekday: ${weekdayCron} (${tz})`);

  jobs.push(cron.schedule(weekendCron, () => {
    console.log('[scheduler] weekend cron fired');
    triggerBattle();
  }, { timezone: tz }));
  console.log(`[scheduler] weekend: ${weekendCron} (${tz})`);

  console.log('[scheduler] started');
}

export function stopScheduler() {
  if (jobs.length === 0) return;
  for (const job of jobs) {
    job.stop();
  }
  jobs = [];
  console.log('[scheduler] stopped');
}
