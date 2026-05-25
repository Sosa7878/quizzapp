const bcrypt = require('bcrypt');
const pool = require('./db');
setTimeout(async () => {
  try {
    const hash = await bcrypt.hash('sosa123', 10);
    await pool.query('UPDATE users SET password = $1 WHERE id = 1', [hash]);
    console.log('Password reset for admin id=1');
    const r = await pool.query('SELECT id,name,email,username,role FROM users WHERE id = 1');
    console.log(JSON.stringify(r.rows[0]));
    await pool.query('UPDATE users SET password = $1 WHERE id = 23', [hash]);
    console.log('Password reset for user id=23');
  } catch(e) { console.log('Error:', e.message); }
  process.exit();
}, 3000);
