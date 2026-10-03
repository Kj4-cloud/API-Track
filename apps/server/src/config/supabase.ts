import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load from current working directory or parent directories
dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), '../../.env') });
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.SUPABASE_URL || 'https://isxwonogwnnnyebsjhem.supabase.co';
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlzeHdvbm9nd25ubnllYnNqaGVtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA1MzAxOTcsImV4cCI6MjEwNjEwNjE5N30.47ZzbwWpvbx9N_PZUQm_VG7D_SMqpWfyrEj5bPhe3Pw';

export const supabase = createClient(supabaseUrl, supabaseKey);
