import bcryptjs from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { supabaseServiceClient } from '../config/supabase';

const getBootstrapConfig = () => ({
  enabled: process.env.BOOTSTRAP_ADMIN_ENABLED !== 'false',
  email: process.env.BOOTSTRAP_ADMIN_EMAIL || 'admin@bomberos.local',
  password: process.env.BOOTSTRAP_ADMIN_PASSWORD || 'Bomberos123!',
  name: process.env.BOOTSTRAP_ADMIN_NAME || 'Administrador General',
  area: process.env.BOOTSTRAP_ADMIN_AREA || 'Comision Directiva',
});

export const ensureBootstrapAdmin = async () => {
  const config = getBootstrapConfig();

  if (!config.enabled) {
    return;
  }

  const { count, error: countError } = await supabaseServiceClient
    .from('users')
    .select('id', { count: 'exact', head: true });

  if (countError) {
    throw countError;
  }

  if ((count || 0) > 0) {
    return;
  }

  const hashedPassword = await bcryptjs.hash(config.password, 10);
  const now = new Date().toISOString();

  const { error: insertError } = await supabaseServiceClient
    .from('users')
    .insert({
      id: uuidv4(),
      email: config.email,
      password_hash: hashedPassword,
      name: config.name,
      role: 'admin_general',
      area: config.area,
      is_active: true,
      created_at: now,
      updated_at: now,
    });

  if (insertError) {
    throw insertError;
  }

  console.log(`Bootstrap admin created: ${config.email}`);
};