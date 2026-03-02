// =============================
// 1) COLE A URL PÚBLICA DO SEU JSON AQUI
// =============================
const JSON_URL = "https://qdvywfdfalzgjjxigsfv.supabase.co/storage/v1/object/public/public-data/funcionarios.json";

// Cache local (pra editar)
let funcionarios = [];

const $ = (id) => document.getElementById(id);

const grid = $("grid");
const empty = $("empty");
const statusEl = $("status");
const kpiTotal = $("kpiTotal");
const kpiAtivos = $("kpiAtivos");

const searchEl = $("search");
const btnReload = $("btnReload");
const btnAdmin = $("btnAdmin");

const admin = $("admin");
const btnCloseAdmin = $("btnCloseAdmin");
const jsonBox = $("jsonBox");
const adminMsg = $("adminMsg");

const fId = $("fId");
const fNome = $("fNome");
const fCargo = $("fCargo");
const fSetor = $("fSetor");
const fFoto = $("fFoto");
const fAtivo = $("fAtivo");

const btnAdd = $("btnAdd");
const btnClear = $("btnClear");
const btnRemove = $("btnRemove");
const btnDownload = $("btnDownload");
const btnApplyJson = $("btnApplyJson");

function safeText(s){
  return String(s ?? "").trim();
}

function setStatus(msg){
  statusEl.textContent = msg;
}

function render(list){
  grid.innerHTML = "";
  empty.style.display = list.length ? "none" : "block";

  kpiTotal.textContent = String(funcionarios.length);
  kpiAtivos.textContent = String(funcionarios.filter(f => f.ativo !== false).length);

  for(const f of list){
    const card = document.createElement("div");
    card.className = "card";
    card.title = "Clique para carregar no formulário do Admin";

    const avatar = document.createElement("div");
    avatar.className = "avatar";
    if (f.foto){
      const img = document.createElement("img");
      img.src = f.foto;
      img.alt = f.nome || "Foto";
      img.onerror = () => { avatar.textContent = "👤"; };
      avatar.appendChild(img);
    } else {
      avatar.textContent = "👤";
    }

    const body = document.createElement("div");
    const h4 = document.createElement("h4");
    h4.textContent = f.nome || "(Sem nome)";
    const meta = document.createElement("div");
    meta.className = "meta";
    meta.textContent = `${f.cargo || "—"} • ${f.setor || "—"}`;
    const pill = document.createElement("div");
    pill.className = "pill" + (f.ativo === false ? " off" : "");
    pill.textContent = (f.ativo === false ? "Inativo" : "Ativo");

    body.appendChild(h4);
    body.appendChild(meta);
    body.appendChild(pill);

    card.appendChild(avatar);
    card.appendChild(body);

    card.addEventListener("click", () => {
      openAdmin();
      fillForm(f);
    });

    grid.appendChild(card);
  }
}

function filterList(){
  const q = safeText(searchEl.value).toLowerCase();
  if(!q) return funcionarios;

  return funcionarios.filter(f => {
    const hay = `${f.id||""} ${f.nome||""} ${f.cargo||""} ${f.setor||""}`.toLowerCase();
    return hay.includes(q);
  });
}

function syncUI(){
  render(filterList());
  jsonBox.value = JSON.stringify(funcionarios, null, 2);
}

async function loadFromStorage(){
  setStatus("Carregando do Storage...");
  adminMsg.textContent = "";

  try{
    const res = await fetch(JSON_URL, { cache: "no-store" });
    if(!res.ok){
      throw new Error(`HTTP ${res.status} ao buscar JSON. Verifique se o bucket é público e a URL está correta.`);
    }
    const data = await res.json();
    if(!Array.isArray(data)) throw new Error("O JSON precisa ser uma lista/array.");

    // normaliza
    funcionarios = data.map(x => ({
      id: safeText(x.id),
      nome: safeText(x.nome),
      cargo: safeText(x.cargo),
      setor: safeText(x.setor),
      foto: safeText(x.foto),
      ativo: x.ativo !== false
    }));

    setStatus(`OK • ${funcionarios.length} carregados`);
    syncUI();
  } catch (err){
    console.error(err);
    setStatus("Falha ao carregar. Veja o console.");
    empty.style.display = "block";
    empty.textContent = "Não consegui carregar o JSON. Confira a URL, o bucket público e o nome do arquivo.";
  }
}

function openAdmin(){
  admin.setAttribute("aria-hidden", "false");
}
function closeAdmin(){
  admin.setAttribute("aria-hidden", "true");
}

function fillForm(f){
  fId.value = f.id || "";
  fNome.value = f.nome || "";
  fCargo.value = f.cargo || "";
  fSetor.value = f.setor || "";
  fFoto.value = f.foto || "";
  fAtivo.checked = (f.ativo !== false);
}

function clearForm(){
  fId.value = "";
  fNome.value = "";
  fCargo.value = "";
  fSetor.value = "";
  fFoto.value = "";
  fAtivo.checked = true;
}

function upsertFromForm(){
  const id = safeText(fId.value);
  if(!id){
    adminMsg.textContent = "Informe um ID (ex: F010).";
    return;
  }

  const payload = {
    id,
    nome: safeText(fNome.value),
    cargo: safeText(fCargo.value),
    setor: safeText(fSetor.value),
    foto: safeText(fFoto.value),
    ativo: !!fAtivo.checked
  };

  const idx = funcionarios.findIndex(x => x.id === id);
  if(idx >= 0){
    funcionarios[idx] = payload;
    adminMsg.textContent = `Atualizado: ${id}`;
  } else {
    funcionarios.push(payload);
    adminMsg.textContent = `Adicionado: ${id}`;
  }

  // ordena por nome pra ficar bonitinho
  funcionarios.sort((a,b) => (a.nome || "").localeCompare((b.nome||""), "pt-BR"));

  syncUI();
}

function removeById(){
  const id = safeText(fId.value);
  if(!id){
    adminMsg.textContent = "Para remover, informe o ID no campo ID.";
    return;
  }
  const before = funcionarios.length;
  funcionarios = funcionarios.filter(x => x.id !== id);
  const after = funcionarios.length;

  if(after === before){
    adminMsg.textContent = `Não achei o ID ${id} na lista.`;
  } else {
    adminMsg.textContent = `Removido: ${id}`;
  }
  syncUI();
}

function downloadJson(){
  const content = JSON.stringify(funcionarios, null, 2);
  const blob = new Blob([content], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "funcionarios.json";
  document.body.appendChild(a);
  a.click();
  a.remove();

  URL.revokeObjectURL(url);
  adminMsg.textContent = "JSON baixado. Agora substitua no Storage.";
}

function applyJsonBox(){
  try{
    const data = JSON.parse(jsonBox.value);
    if(!Array.isArray(data)) throw new Error("O JSON precisa ser um array.");

    funcionarios = data.map(x => ({
      id: safeText(x.id),
      nome: safeText(x.nome),
      cargo: safeText(x.cargo),
      setor: safeText(x.setor),
      foto: safeText(x.foto),
      ativo: x.ativo !== false
    })).filter(x => x.id);

    funcionarios.sort((a,b) => (a.nome || "").localeCompare((b.nome||""), "pt-BR"));
    adminMsg.textContent = "JSON aplicado na lista (ainda precisa subir no Storage).";
    syncUI();
  } catch (e){
    adminMsg.textContent = `Erro no JSON: ${e.message}`;
  }
}

// Eventos
searchEl.addEventListener("input", () => render(filterList()));
btnReload.addEventListener("click", loadFromStorage);
btnAdmin.addEventListener("click", openAdmin);
btnCloseAdmin.addEventListener("click", closeAdmin);

btnAdd.addEventListener("click", upsertFromForm);
btnClear.addEventListener("click", () => { clearForm(); adminMsg.textContent = ""; });
btnRemove.addEventListener("click", removeById);
btnDownload.addEventListener("click", downloadJson);
btnApplyJson.addEventListener("click", applyJsonBox);

// Carrega ao abrir
loadFromStorage();
