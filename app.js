async function checkAuth(){
  const { data } = await supabase.auth.getUser();

  if(!data.user){
    window.location.href = "index.html";
  }
}

async function logout(){
  await supabase.auth.signOut();
  window.location.href = "index.html";
}
