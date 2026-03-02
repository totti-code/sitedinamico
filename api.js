async function listarFuncionarios(){
  const { data, error } = await supabase
    .from("funcionarios")
    .select("*")
    .order("nome");

  if(error){
    console.error(error);
    return;
  }

  const lista = document.getElementById("lista");
  lista.innerHTML = "";

  data.forEach(f => {
    lista.innerHTML += `
      <div class="card">
        <strong>${f.nome}</strong>
        <p>${f.cargo}</p>
      </div>
    `;
  });
}
