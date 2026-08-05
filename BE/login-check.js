import { supabase } from './src/config/supabase.js';
import bcrypt from 'bcrypt';

async function run() {
  const usernames = ['tuan', 'superadmin', 'admin01', 'chef01', 'admintest'];
  const passwords = ['1234', '123456', 'admin', 'admin123', 'superadmin', 'tuan'];
  
  const { data: users, error } = await supabase
    .from('users')
    .select('username, password_hash')
    .in('username', usernames);
    
  if (error) {
    console.error("Error fetching users:", error);
    return;
  }
  
  for (const user of users) {
    for (const pwd of passwords) {
      const match = await bcrypt.compare(pwd, user.password_hash);
      if (match) {
        console.log(`FOUND CREDENTIALS: Username: ${user.username}, Password: ${pwd}`);
      }
    }
  }
}

run();
