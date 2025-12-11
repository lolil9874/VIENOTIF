import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://ddxjaxvrgeihkgmrnmqp.supabase.co";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

const supabase = createClient(supabaseUrl, supabaseKey);

async function testAuth() {
  const testEmail = `test-${Date.now()}@example.com`;
  const testPassword = "testpassword123";

  console.log("🧪 Testing authentication flow...");
  console.log("Test email:", testEmail);

  // Test 1: Sign Up
  console.log("\n1. Testing signUp...");
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email: testEmail,
    password: testPassword,
  });

  if (signUpError) {
    console.error("❌ SignUp error:", signUpError);
    return;
  }

  console.log("✅ SignUp successful");
  console.log("User ID:", signUpData.user?.id);
  console.log("Email confirmed:", signUpData.user?.email_confirmed_at);
  console.log("Session:", signUpData.session ? "Yes" : "No");

  // Test 2: Check session
  console.log("\n2. Checking session...");
  const { data: { session } } = await supabase.auth.getSession();
  console.log("Session exists:", session ? "Yes" : "No");

  // Test 3: Sign In
  if (!session) {
    console.log("\n3. Attempting signIn...");
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword,
    });

    if (signInError) {
      console.error("❌ SignIn error:", signInError);
    } else {
      console.log("✅ SignIn successful");
      console.log("Session:", signInData.session ? "Yes" : "No");
    }
  }

  // Test 4: Get user
  console.log("\n4. Getting current user...");
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError) {
    console.error("❌ Get user error:", userError);
  } else {
    console.log("✅ User:", user?.email);
  }
}

testAuth().catch(console.error);

