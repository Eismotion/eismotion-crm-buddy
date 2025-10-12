import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

// Utility to generate a random strong password
function generatePassword(length = 16) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()-_=+';
  const array = new Uint32Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, (x) => chars[x % chars.length]).join('');
}

Deno.serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !serviceRoleKey) {
    return new Response(JSON.stringify({ error: 'Missing server configuration' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  try {
    // 1) Check if an admin already exists
    const { data: existingAdmins, error: adminCheckError } = await supabase
      .from('user_roles')
      .select('id')
      .eq('role', 'admin')
      .limit(1);

    if (adminCheckError) throw adminCheckError;

    if (existingAdmins && existingAdmins.length > 0) {
      // Admin already exists – do nothing.
      return new Response(JSON.stringify({ message: 'Admin already exists' }), {
        status: 409,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // 2) Create bootstrap admin user
    const email = `admin+${crypto.randomUUID().slice(0, 8)}@example.com`;
    const password = generatePassword();

    const { data: created, error: createUserError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (createUserError) throw createUserError;
    const userId = created.user?.id;
    if (!userId) throw new Error('Failed to create admin user');

    // 3) Assign admin role
    const { error: roleError } = await supabase
      .from('user_roles')
      .insert({ user_id: userId, role: 'admin' });

    if (roleError) throw roleError;

    // 4) Return credentials once
    return new Response(JSON.stringify({ email, password }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  } catch (err) {
    console.error('bootstrap-admin error', err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
});