import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';
import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    // Check if user is admin
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single();

    if (roleError || !roleData) {
      throw new Error('Only admins can create customer accounts');
    }

    const { customerId, email, password, fullName } = await req.json();

    if (!customerId || !email || !password) {
      throw new Error('Customer ID, email, and password are required');
    }

    // Create the auth user
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName || email
      }
    });

    if (createError) {
      throw createError;
    }

    // Update the profile with customer_id
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({ customer_id: customerId })
      .eq('id', newUser.user.id);

    if (profileError) {
      throw profileError;
    }

    // Assign customer role
    const { error: roleInsertError } = await supabaseAdmin
      .from('user_roles')
      .insert({
        user_id: newUser.user.id,
        role: 'customer'
      });

    if (roleInsertError) {
      throw roleInsertError;
    }

    // Update customer email
    const { error: customerError } = await supabaseAdmin
      .from('customers')
      .update({ email })
      .eq('id', customerId);

    if (customerError) {
      throw customerError;
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        userId: newUser.user.id,
        message: 'Customer account created successfully'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error creating customer account:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    );
  }
});
