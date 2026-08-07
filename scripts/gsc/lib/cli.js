function parseIsoDate(value, name) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) {
    throw new Error(`${name} must use YYYY-MM-DD.`);
  }
  const parsed = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) {
    throw new Error(`${name} is not a valid calendar date.`);
  }
  return value;
}

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === '--start' || token === '--end') {
      const value = argv[i + 1];
      if (!value || value.startsWith('--')) throw new Error(`${token} requires a value.`);
      args[token.slice(2)] = value;
      i += 1;
    } else {
      throw new Error(`Unknown argument: ${token}`);
    }
  }
  if (!args.start || !args.end) throw new Error('Both --start and --end are required.');
  const start = parseIsoDate(args.start, '--start');
  const end = parseIsoDate(args.end, '--end');
  if (start > end) throw new Error('--start must be on or before --end.');
  return { start, end };
}

function enumerateDates(start, end) {
  const dates = [];
  let cursor = new Date(`${start}T00:00:00Z`);
  const last = new Date(`${end}T00:00:00Z`);
  while (cursor <= last) {
    dates.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return dates;
}

module.exports = { parseArgs, enumerateDates, parseIsoDate };
