const bcrypt = require('bcryptjs');

async function generate(){
  const password = 'admin123456'; // Change si besoin
  const hash = await bcrypt.hash(password, 10);
  console.log('Password:', password);
  console.log('Hash:', hash);
}
generate();