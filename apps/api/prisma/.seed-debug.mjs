import { seed } from './seed.mjs';
seed(process.env).catch((e) => { console.error('ERR', e.code, e.constraint, e.table, e.column, String(e.message).slice(0, 300)); process.exit(1); });
