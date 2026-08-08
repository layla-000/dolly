const state = { dolls: [], items: [], wishes: [] };

const titles = {dashboard:"Dashboard", dolls:"Dolls", items:"Items", wishlist:"Wishlist", search:"Search"};

function showView(name){
  document.querySelectorAll(".view").forEach(v=>v.classList.remove("active"));
  document.querySelector(`#view-${name}`)?.classList.add("active");
  document.querySelectorAll(".nav-item").forEach(n=>n.classList.toggle("active", n.dataset.view===name));
  document.getElementById("pageTitle").textContent = titles[name] || "Dolly Box";
  document.getElementById("sidebar")?.classList.remove("open");
  window.scrollTo({top:0, behavior:"smooth"});
}

function cardTemplate(item, type="doll"){
  const meta = type==="doll" ? `${item.category} · ${item.maker} · ${item.size}` : [item.category,item.size].filter(Boolean).join(" · ");
  return `
    <article class="collection-card"
      data-id="${item.id}"
      data-type="${type}"
      data-category="${item.category || ""}"
      data-maker="${item.maker || ""}"
      data-size="${item.size || ""}"
      data-status="${item.status || ""}"
      data-doll="${item.wearingDollId || ""}"
      data-tags="${(item.tags || []).join("|")}"
      data-search="${[item.name,meta,item.memo || "",...(item.tags||[])].join(" ").toLowerCase()}">
      <div class="card-image">
        ${item.imageData ? `<img class="uploaded-photo" src="${item.imageData}" alt="${item.name}">` : `<span class="placeholder-art">${item.emoji || "🧸"}</span>`}
        <span class="card-badge">${type==="doll" ? item.category : item.status}</span>
      </div>
      <div class="card-body">
        <h3>${item.name}</h3>
        <div class="card-meta">${meta}</div>
        <div class="card-tags">${(item.tags||[]).map(t=>`<span>#${t}</span>`).join("")}</div>
        <button class="card-delete" data-delete-id="${item.id}" data-delete-type="${type}" title="삭제" aria-label="${item.name} 삭제">⌫</button>
      </div>
    </article>`;
}

function render(){
  document.getElementById("dollGrid").innerHTML = state.dolls.map(x=>cardTemplate(x,"doll")).join("");
  document.getElementById("itemGrid").innerHTML = state.items.map(x=>cardTemplate(x,"item")).join("");
  document.getElementById("recentGrid").innerHTML = state.dolls.slice(0,5).map(x=>cardTemplate(x,"doll")).join("");
  document.getElementById("wishlistList").innerHTML = state.wishes.map(w=>`
    <article class="wish-row" data-wish-id="${w.id}">
      <div class="priority ${w.priority==="가져야해"?"hot":""}">${w.priority==="가져야해"?"🔥 가져야해":w.priority}</div>
      <div><h3>${w.name}</h3><p>${w.category} · <span class="purchase-status-badge">${w.purchaseStatus || "못삼"}</span></p></div>
      <div class="wish-price">${formatPrice(w.price)}</div>
      <div class="deadline">${w.deadline ? `예약 마감 ${w.deadline}` : "마감 없음"}</div>
      <button class="link-button" data-wish-link="${w.id}">판매 페이지 ↗</button>
    </article>`).join("");

  const dollCounts = Object.fromEntries(["구관","육일","솜깅"].map(k=>[k,state.dolls.filter(d=>d.category===k).length]));
  const itemCategories = ["의상","안구","가발","신발","악세사리","도구","기타"];
  const itemCounts = Object.fromEntries(itemCategories.map(k=>[k,state.items.filter(i=>i.category===k).length]));

  const statCards = document.querySelectorAll(".stats-grid .stat-card");
  if(statCards[0]){
    statCards[0].querySelector(".stat-head b").textContent = state.dolls.length;
    const rows = statCards[0].querySelectorAll(".stat-row strong");
    [dollCounts["구관"],dollCounts["육일"],dollCounts["솜깅"]].forEach((v,i)=>{ if(rows[i]) rows[i].textContent=v; });
  }
  if(statCards[1]){
    statCards[1].querySelector(".stat-head b").textContent = state.items.length;
    const rows = statCards[1].querySelectorAll(".stat-row strong");
    [itemCounts["의상"],itemCounts["가발"],itemCounts["안구"]].forEach((v,i)=>{ if(rows[i]) rows[i].textContent=v; });
  }
  const wishNum = document.querySelector(".wish-stat");
  if(wishNum) wishNum.innerHTML = `${state.wishes.length} <small>items</small>`;
  const hot = document.querySelector(".accent-card p:not(.eyebrow) strong");
  if(hot) hot.textContent = state.wishes.filter(w=>w.priority==="가져야해").length;
}

document.querySelectorAll("[data-view]").forEach(btn=>btn.addEventListener("click",()=>showView(btn.dataset.view)));
document.querySelectorAll("[data-view-jump]").forEach(btn=>btn.addEventListener("click",()=>{
  showView(btn.dataset.viewJump);
  if(btn.dataset.viewJump==="search"){
    const q=document.getElementById("dashboardSearch")?.value.trim() || "";
    if(q) document.getElementById("searchKeyword").value=q;
    runAdvancedSearch();
  }
}));

document.getElementById("menuButton")?.addEventListener("click",()=>document.getElementById("sidebar")?.classList.toggle("open"));
document.getElementById("sidebarScrim")?.addEventListener("click",()=>document.getElementById("sidebar")?.classList.remove("open"));

document.addEventListener("click",(e)=>{
  if(window.innerWidth<=820 && !e.target.closest(".sidebar") && !e.target.closest("#menuButton")){
    document.getElementById("sidebar").classList.remove("open");
  }
});


document.getElementById("dashboardSearch")?.addEventListener("keydown",(e)=>{
  if(e.key==="Enter"){
    const q = e.currentTarget.value.trim();
    showView("search");
    const target = document.getElementById("searchKeyword");
    if(target) target.value = q;
    runAdvancedSearch();
  }
});

const modal = document.getElementById("demoModal");
const modalTitle = document.getElementById("modalTitle");
const modalText = document.getElementById("modalText");
const modalEmoji = document.getElementById("modalEmoji");

const modalData = {
  doll:["🧸","인형 등록 폼","다음 단계에서 카테고리, 메이커, 이름, 바디, 사이즈, 스킨색, 메이크업, 이미지, 메모와 태그 입력 폼을 연결해요."],
  item:["👗","아이템 등록 폼","다음 단계에서 카테고리, 상태, 착용 인형, 사이즈, 보관 장소, 구매 정보, 이미지, 메모와 태그 입력 폼을 연결해요."],
  wish:["⭐","위시리스트 등록 폼","다음 단계에서 이름, 카테고리, 가격, 우선순위, 구매 상태, 판매처, 링크, 날짜, 메모와 태그 입력 폼을 연결해요."]
};
document.querySelectorAll("[data-demo-modal]").forEach(btn=>btn.addEventListener("click",()=>{
  const kind = btn.dataset.demoModal;
  if(kind === "doll"){
    openDollForm();
    return;
  }
  if(kind === "item"){
    openItemForm();
    return;
  }
  if(kind === "wish"){
    openWishForm();
    return;
  }
  const d = modalData[kind];
  modalEmoji.textContent=d[0]; modalTitle.textContent=d[1]; modalText.textContent=d[2];
  modal.hidden=false;
}));
["modalClose","modalOkay"].forEach(id=>document.getElementById(id).addEventListener("click",()=>modal.hidden=true));
modal.addEventListener("click",(e)=>{if(e.target===modal) modal.hidden=true});





const dollFormModal = document.getElementById("dollFormModal");
const dollForm = document.getElementById("dollForm");
const dollImageInput = document.getElementById("dollImageInput");
const dollImagePreview = document.getElementById("dollImagePreview");
let selectedDollImageData = "";
let editingDollId = null;
let currentDetailDollId = null;

function openDollForm(doll=null){
  dollForm.reset();
  editingDollId = doll?.id || null;
  selectedDollImageData = doll?.imageData || "";

  document.querySelector("#dollFormModal h2").textContent = editingDollId ? "인형 수정" : "인형 등록";

  if(doll){
    document.getElementById("dollCategory").value = doll.category || "";
    document.getElementById("dollMaker").value = doll.maker || "";
    document.getElementById("dollName").value = doll.name || "";
    document.getElementById("dollBody").value = doll.body || "";
    document.getElementById("dollSize").value = doll.size || "";
    document.getElementById("dollSkin").value = doll.skin || "";
    document.getElementById("dollMakeup").value = doll.makeup || "";
    document.getElementById("dollPrice").value = doll.price ?? "";
    document.getElementById("dollTags").value = (doll.tags || []).join(", ");
    document.getElementById("dollMemoTitle").value = doll.memoTitle || "";
    document.getElementById("dollMemo").value = doll.memo || "";
  }

  dollImagePreview.innerHTML = selectedDollImageData
    ? `<img src="${selectedDollImageData}" alt="인형 이미지 미리보기">`
    : `<div><span>🧸</span><small>대표 이미지를 선택해 주세요</small></div>`;

  dollFormModal.hidden = false;
}

function closeDollForm(){
  dollFormModal.hidden = true;
}

document.getElementById("dollFormClose").addEventListener("click", closeDollForm);
document.getElementById("dollFormCancel").addEventListener("click", closeDollForm);
dollFormModal.addEventListener("click",(e)=>{ if(e.target===dollFormModal) closeDollForm(); });

dollImageInput.addEventListener("change",()=>{
  const file = dollImageInput.files?.[0];
  if(!file){
    selectedDollImageData = "";
    return;
  }
  if(!file.type.startsWith("image/")){
    alert("이미지 파일을 선택해 주세요.");
    dollImageInput.value = "";
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    selectedDollImageData = String(reader.result || "");
    dollImagePreview.innerHTML = `<img src="${selectedDollImageData}" alt="인형 이미지 미리보기">`;
  };
  reader.readAsDataURL(file);
});

dollForm.addEventListener("submit", async (e)=>{
  e.preventDefault();
  const name = document.getElementById("dollName").value.trim();
  const category = document.getElementById("dollCategory").value;
  if(!name || !category){ alert("카테고리와 이름은 필수예요."); return; }

  const payload = {
    id: editingDollId || null,
    name, category,
    maker: document.getElementById("dollMaker").value.trim(),
    body: document.getElementById("dollBody").value.trim(),
    size: document.getElementById("dollSize").value,
    skin: document.getElementById("dollSkin").value.trim(),
    makeup: document.getElementById("dollMakeup").value.trim(),
    price: Number(document.getElementById("dollPrice").value || 0),
    tags: document.getElementById("dollTags").value.split(",").map(x=>x.trim()).filter(Boolean),
    memoTitle: document.getElementById("dollMemoTitle").value.trim(),
    memo: document.getElementById("dollMemo").value.trim(),
    imageData: selectedDollImageData
  };

  try{
    const savedId = await DollyBackend.saveDoll(payload);
    await reloadFromBackend();
    closeDollForm();
    showView("dolls");
    if(editingDollId) openDollDetail(savedId);
  }catch(err){
    console.error(err);
    alert(`인형 저장에 실패했어요.
${err.message || err}`);
  }
});




const wishFormModal = document.getElementById("wishFormModal");
const wishDetailModal = document.getElementById("wishDetailModal");
const wishForm = document.getElementById("wishForm");
let editingWishId = null;
let currentDetailWishId = null;

function openWishForm(wish=null){
  wishForm.reset();
  editingWishId = wish?.id || null;
  document.querySelector("#wishFormModal h2").textContent = editingWishId ? "위시리스트 수정" : "위시리스트 등록";

  if(wish){
    document.getElementById("wishName").value = wish.name || "";
    document.getElementById("wishCategory").value = wish.category || "";
    document.getElementById("wishPrice").value = wish.price ?? "";
    document.getElementById("wishPriority").value = wish.priority || "보통";
    document.getElementById("wishPurchaseStatus").value = wish.purchaseStatus || "못삼";
    document.getElementById("wishSeller").value = wish.seller || "";
    document.getElementById("wishUrl").value = wish.saleUrl || "";
    document.getElementById("wishDeadline").value = wish.deadline || "";
    document.getElementById("wishPurchaseDate").value = wish.purchaseDate || "";
    document.getElementById("wishTags").value = (wish.tags || []).join(", ");
    document.getElementById("wishMemo").value = wish.memo || "";
  } else {
    document.getElementById("wishPriority").value = "보통";
    document.getElementById("wishPurchaseStatus").value = "못삼";
  }

  wishFormModal.hidden = false;
}

function closeWishForm(){
  wishFormModal.hidden = true;
}

document.getElementById("wishFormClose").addEventListener("click", closeWishForm);
document.getElementById("wishFormCancel").addEventListener("click", closeWishForm);
wishFormModal.addEventListener("click",(e)=>{ if(e.target===wishFormModal) closeWishForm(); });

wishForm.addEventListener("submit", async (e)=>{
  e.preventDefault();
  const name = document.getElementById("wishName").value.trim();
  const category = document.getElementById("wishCategory").value;
  if(!name || !category){ alert("이름과 카테고리는 필수예요."); return; }

  const payload = {
    id: editingWishId || null,
    name, category,
    price: Number(document.getElementById("wishPrice").value || 0),
    priority: document.getElementById("wishPriority").value,
    purchaseStatus: document.getElementById("wishPurchaseStatus").value,
    seller: document.getElementById("wishSeller").value.trim(),
    saleUrl: document.getElementById("wishUrl").value.trim(),
    deadline: document.getElementById("wishDeadline").value,
    purchaseDate: document.getElementById("wishPurchaseDate").value,
    tags: document.getElementById("wishTags").value.split(",").map(x=>x.trim()).filter(Boolean),
    memo: document.getElementById("wishMemo").value.trim()
  };

  try{
    const savedId = await DollyBackend.saveWish(payload);
    await reloadFromBackend();
    closeWishForm();
    showView("wishlist");
    if(editingWishId) openWishDetail(savedId);
  }catch(err){
    console.error(err);
    alert(`위시리스트 저장에 실패했어요.
${err.message || err}`);
  }
});

function openWishDetail(id){
  const wish = state.wishes.find(x=>x.id===id);
  if(!wish) return;
  currentDetailWishId = id;

  document.getElementById("wishDetailName").textContent = wish.name || "이름 없음";
  document.getElementById("wishDetailSummary").textContent =
    [wish.category,wish.priority,wish.purchaseStatus].filter(Boolean).join(" · ");
  document.getElementById("wishDetailPrice").textContent = formatPrice(wish.price);
  document.getElementById("wishDetailSeller").textContent = wish.seller || "—";
  document.getElementById("wishDetailDeadline").textContent = wish.deadline || "—";
  document.getElementById("wishDetailPurchaseDate").textContent = wish.purchaseDate || "—";
  document.getElementById("wishDetailUrl").textContent = wish.saleUrl || "—";
  document.getElementById("wishDetailMemo").textContent = wish.memo || "메모 없음";

  const tags = document.getElementById("wishDetailTags");
  tags.innerHTML = (wish.tags || []).length
    ? wish.tags.map(t=>`<span>#${t}</span>`).join("")
    : `<span>#태그없음</span>`;

  document.getElementById("wishConvertPanel").hidden = wish.purchaseStatus !== "구매!";
  wishDetailModal.hidden = false;
}

function closeWishDetail(){
  wishDetailModal.hidden = true;
  currentDetailWishId = null;
}

document.getElementById("wishDetailClose").addEventListener("click", closeWishDetail);
document.getElementById("wishDetailCloseButton").addEventListener("click", closeWishDetail);
wishDetailModal.addEventListener("click",(e)=>{ if(e.target===wishDetailModal) closeWishDetail(); });

document.getElementById("wishDetailEdit").addEventListener("click",()=>{
  const wish = state.wishes.find(x=>x.id===currentDetailWishId);
  if(!wish) return;
  wishDetailModal.hidden = true;
  openWishForm(wish);
});

document.getElementById("wishDetailDelete").addEventListener("click", async ()=>{
  const wish = state.wishes.find(x=>x.id===currentDetailWishId);
  if(!wish) return;
  if(!confirm(`"${wish.name}"을(를) 위시리스트에서 삭제할까요?`)) return;
  try{
    await DollyBackend.deleteWish(wish.id);
    closeWishDetail();
    await reloadFromBackend();
  }catch(err){
    console.error(err);
    alert(`삭제에 실패했어요.
${err.message || err}`);
  }
});

document.addEventListener("click",(e)=>{
  const linkBtn = e.target.closest("[data-wish-link]");
  if(linkBtn){
    e.stopPropagation();
    const wish = state.wishes.find(x=>x.id===linkBtn.dataset.wishLink);
    if(!wish) return;
    if(wish.saleUrl){
      window.open(wish.saleUrl,"_blank","noopener");
    } else {
      alert("등록된 판매 링크가 없어요.");
    }
    return;
  }

  const row = e.target.closest("[data-wish-id]");
  if(row) openWishDetail(row.dataset.wishId);
});

function prefillDollFromWish(wish){
  openDollForm();
  document.getElementById("dollName").value = wish.name || "";
  document.getElementById("dollMaker").value = wish.seller || "";
  document.getElementById("dollPrice").value = wish.price || "";
  document.getElementById("dollTags").value = (wish.tags || []).join(", ");

  if(wish.category === "본체" || wish.category === "헤드"){
    document.getElementById("dollCategory").value = "구관";
  }
}

function mapWishCategoryToItem(category){
  if(["의상","안구","가발","신발"].includes(category)) return category;
  return "기타";
}

function prefillItemFromWish(wish){
  openItemForm();
  document.getElementById("itemName").value = wish.name || "";
  document.getElementById("itemCategory").value = mapWishCategoryToItem(wish.category);
  document.getElementById("itemStatus").value = "보관중";
  document.getElementById("itemMaker").value = wish.seller || "";
  document.getElementById("itemShop").value = wish.seller || "";
  document.getElementById("itemPrice").value = wish.price || "";
  document.getElementById("itemTags").value = (wish.tags || []).join(", ");
  syncItemStatusDollField();
}

document.getElementById("convertToDoll").addEventListener("click",()=>{
  const wish = state.wishes.find(x=>x.id===currentDetailWishId);
  if(!wish) return;
  wishDetailModal.hidden = true;
  prefillDollFromWish(wish);
});

document.getElementById("convertToItem").addEventListener("click",()=>{
  const wish = state.wishes.find(x=>x.id===currentDetailWishId);
  if(!wish) return;
  wishDetailModal.hidden = true;
  prefillItemFromWish(wish);
});


const itemFormModal = document.getElementById("itemFormModal");
const itemDetailModal = document.getElementById("itemDetailModal");
const itemForm = document.getElementById("itemForm");
const itemImageInput = document.getElementById("itemImageInput");
const itemImagePreview = document.getElementById("itemImagePreview");
let selectedItemImageData = "";
let editingItemId = null;
let currentDetailItemId = null;

function refreshDollSelect(selected=""){
  const select = document.getElementById("itemWearingDoll");
  select.innerHTML = `<option value="">지정 안 함</option>` +
    state.dolls.map(d=>`<option value="${d.id}">${d.name} · ${d.size || "미지정"}</option>`).join("");
  select.value = selected || "";
}

function syncItemStatusDollField(){
  const status = document.getElementById("itemStatus").value;
  const dollSelect = document.getElementById("itemWearingDoll");
  dollSelect.disabled = status !== "착용중";
  if(status !== "착용중") dollSelect.value = "";
}

function openItemForm(item=null){
  itemForm.reset();
  editingItemId = item?.id || null;
  selectedItemImageData = item?.imageData || "";
  document.querySelector("#itemFormModal h2").textContent = editingItemId ? "아이템 수정" : "아이템 등록";

  refreshDollSelect(item?.wearingDollId || "");

  if(item){
    document.getElementById("itemCategory").value = item.category || "";
    document.getElementById("itemStatus").value = item.status || "보관중";
    document.getElementById("itemName").value = item.name || "";
    document.getElementById("itemWearingDoll").value = item.wearingDollId || "";
    document.getElementById("itemSize").value = item.size || "";
    document.getElementById("itemStorage").value = item.storage || "";
    document.getElementById("itemMaker").value = item.maker || "";
    document.getElementById("itemShop").value = item.shop || "";
    document.getElementById("itemPrice").value = item.price ?? "";
    document.getElementById("itemTags").value = (item.tags || []).join(", ");
    document.getElementById("itemMemo").value = item.memo || "";
  } else {
    document.getElementById("itemStatus").value = "보관중";
  }

  syncItemStatusDollField();

  itemImagePreview.innerHTML = selectedItemImageData
    ? `<img src="${selectedItemImageData}" alt="아이템 이미지 미리보기">`
    : `<div><span>👗</span><small>대표 이미지를 선택해 주세요</small></div>`;

  itemFormModal.hidden = false;
}

function closeItemForm(){
  itemFormModal.hidden = true;
}

document.getElementById("itemFormClose").addEventListener("click", closeItemForm);
document.getElementById("itemFormCancel").addEventListener("click", closeItemForm);
itemFormModal.addEventListener("click",(e)=>{ if(e.target===itemFormModal) closeItemForm(); });
document.getElementById("itemStatus").addEventListener("change", syncItemStatusDollField);

itemImageInput.addEventListener("change",()=>{
  const file = itemImageInput.files?.[0];
  if(!file){
    selectedItemImageData = "";
    return;
  }
  if(!file.type.startsWith("image/")){
    alert("이미지 파일을 선택해 주세요.");
    itemImageInput.value = "";
    return;
  }
  const reader = new FileReader();
  reader.onload = ()=>{
    selectedItemImageData = String(reader.result || "");
    itemImagePreview.innerHTML = `<img src="${selectedItemImageData}" alt="아이템 이미지 미리보기">`;
  };
  reader.readAsDataURL(file);
});

itemForm.addEventListener("submit", async (e)=>{
  e.preventDefault();
  const name = document.getElementById("itemName").value.trim();
  const category = document.getElementById("itemCategory").value;
  const status = document.getElementById("itemStatus").value;
  if(!name || !category){ alert("카테고리와 이름은 필수예요."); return; }

  const payload = {
    id: editingItemId || null,
    name, category, status,
    wearingDollId: status === "착용중" ? document.getElementById("itemWearingDoll").value : "",
    size: document.getElementById("itemSize").value.trim(),
    storage: document.getElementById("itemStorage").value.trim(),
    maker: document.getElementById("itemMaker").value.trim(),
    shop: document.getElementById("itemShop").value.trim(),
    price: Number(document.getElementById("itemPrice").value || 0),
    tags: document.getElementById("itemTags").value.split(",").map(x=>x.trim()).filter(Boolean),
    memo: document.getElementById("itemMemo").value.trim(),
    imageData: selectedItemImageData
  };

  try{
    const savedId = await DollyBackend.saveItem(payload);
    await reloadFromBackend();
    closeItemForm();
    showView("items");
    if(editingItemId) openItemDetail(savedId);
  }catch(err){
    console.error(err);
    alert(`아이템 저장에 실패했어요.
${err.message || err}`);
  }
});

function formatPrice(value){
  const n = Number(value || 0);
  return n ? `${n.toLocaleString("ko-KR")}원` : "—";
}

function openItemDetail(id){
  const item = state.items.find(x=>x.id===id);
  if(!item) return;
  currentDetailItemId = id;

  const main = document.getElementById("itemDetailMainImage");
  main.innerHTML = item.imageData
    ? `<img src="${item.imageData}" alt="${item.name}">`
    : `<span>${item.emoji || "👗"}</span>`;

  document.getElementById("itemDetailName").textContent = item.name || "이름 없음";
  document.getElementById("itemDetailSummary").textContent = [item.category,item.status,item.size].filter(Boolean).join(" · ");
  document.getElementById("itemDetailMaker").textContent = item.maker || "—";
  document.getElementById("itemDetailStorage").textContent = item.storage || "—";
  document.getElementById("itemDetailShop").textContent = item.shop || "—";
  document.getElementById("itemDetailPrice").textContent = formatPrice(item.price);

  const doll = state.dolls.find(d=>d.id===item.wearingDollId);
  const dollLink = document.getElementById("itemDetailDoll");
  dollLink.textContent = doll ? `${doll.name} →` : "지정 안 함";
  dollLink.dataset.dollId = doll?.id || "";
  dollLink.disabled = !doll;
  document.getElementById("itemDetailMemo").textContent = item.memo || "메모 없음";

  const tags = document.getElementById("itemDetailTags");
  tags.innerHTML = (item.tags || []).length
    ? item.tags.map(t=>`<span>#${t}</span>`).join("")
    : `<span>#태그없음</span>`;

  itemDetailModal.hidden = false;
}

function closeItemDetail(){
  itemDetailModal.hidden = true;
  currentDetailItemId = null;
}

document.getElementById("itemDetailClose").addEventListener("click", closeItemDetail);
document.getElementById("itemDetailCloseButton").addEventListener("click", closeItemDetail);
itemDetailModal.addEventListener("click",(e)=>{ if(e.target===itemDetailModal) closeItemDetail(); });

document.getElementById("itemDetailEdit").addEventListener("click",()=>{
  const item = state.items.find(x=>x.id===currentDetailItemId);
  if(!item) return;
  itemDetailModal.hidden = true;
  openItemForm(item);
});

document.getElementById("itemDetailDoll").addEventListener("click",()=>{
  const dollId = document.getElementById("itemDetailDoll").dataset.dollId;
  if(!dollId) return;
  itemDetailModal.hidden = true;
  openDollDetail(dollId);
});

document.getElementById("itemDetailDelete").addEventListener("click", async ()=>{
  const item = state.items.find(x=>x.id===currentDetailItemId);
  if(!item) return;
  if(!confirm(`"${item.name}"을(를) 삭제할까요?`)) return;
  try{
    await DollyBackend.deleteItem(item.id);
    closeItemDetail();
    await reloadFromBackend();
  }catch(err){
    console.error(err);
    alert(`삭제에 실패했어요.
${err.message || err}`);
  }
});

document.addEventListener("click",(e)=>{
  const card = e.target.closest('.collection-card[data-type="item"]');
  if(!card || e.target.closest(".card-delete")) return;
  openItemDetail(card.dataset.id);
});


const dollDetailModal = document.getElementById("dollDetailModal");

function openDollDetail(id){
  const doll = state.dolls.find(x=>x.id===id);
  if(!doll) return;
  currentDetailDollId = id;

  const main = document.getElementById("detailMainImage");
  main.innerHTML = doll.imageData
    ? `<img src="${doll.imageData}" alt="${doll.name}">`
    : `<span>${doll.emoji || "🧸"}</span>`;

  document.getElementById("detailName").textContent = doll.name || "이름 없음";
  document.getElementById("detailSummary").textContent = [doll.category,doll.maker,doll.size].filter(Boolean).join(" · ");
  document.getElementById("detailMaker").textContent = doll.maker || "—";
  document.getElementById("detailBody").textContent = doll.body || "—";
  document.getElementById("detailSize").textContent = doll.size || "—";
  document.getElementById("detailSkin").textContent = doll.skin || "—";
  document.getElementById("detailMakeup").textContent = doll.makeup || "—";
  document.getElementById("detailPrice").textContent = formatPrice(doll.price);
  document.getElementById("detailMemoTitle").textContent = doll.memoTitle || "Memo";
  document.getElementById("detailMemo").textContent = doll.memo || "메모 없음";

  const tags = document.getElementById("detailTags");
  tags.innerHTML = (doll.tags || []).length
    ? doll.tags.map(t=>`<span>#${t}</span>`).join("")
    : `<span>#태그없음</span>`;

  const wearingHost = document.getElementById("dollWearingList");
  const wearing = state.items.filter(i=>i.status==="착용중" && i.wearingDollId===doll.id);
  if(wearing.length){
    wearingHost.className = "wearing-list";
    wearingHost.innerHTML = wearing.map(i=>`
      <div class="wearing-item" data-open-item="${i.id}">
        <div><strong>${i.name}</strong><br><span>${[i.category,i.size].filter(Boolean).join(" · ")}</span></div>
        <span>보기 →</span>
      </div>`).join("");
  } else {
    wearingHost.className = "detail-empty";
    wearingHost.textContent = "현재 착용 중인 아이템이 없어요.";
  }

  dollDetailModal.hidden = false;
}

function closeDollDetail(){
  dollDetailModal.hidden = true;
  currentDetailDollId = null;
}

document.getElementById("dollDetailClose").addEventListener("click", closeDollDetail);
document.getElementById("detailCloseButton").addEventListener("click", closeDollDetail);
dollDetailModal.addEventListener("click",(e)=>{ if(e.target===dollDetailModal) closeDollDetail(); });

document.getElementById("detailEdit").addEventListener("click",()=>{
  const doll = state.dolls.find(x=>x.id===currentDetailDollId);
  if(!doll) return;
  dollDetailModal.hidden = true;
  openDollForm(doll);
});

document.getElementById("detailDelete").addEventListener("click", async ()=>{
  const doll = state.dolls.find(x=>x.id===currentDetailDollId);
  if(!doll) return;
  if(!confirm(`"${doll.name}"을(를) 삭제할까요?`)) return;
  try{
    await DollyBackend.deleteDoll(doll.id);
    closeDollDetail();
    await reloadFromBackend();
  }catch(err){
    console.error(err);
    alert(`삭제에 실패했어요.
${err.message || err}`);
  }
});

document.addEventListener("click",(e)=>{
  const card = e.target.closest('.collection-card[data-type="doll"]');
  if(!card || e.target.closest(".card-delete")) return;
  openDollDetail(card.dataset.id);
});


document.addEventListener("click",(e)=>{
  const row = e.target.closest("[data-open-item]");
  if(!row) return;
  dollDetailModal.hidden = true;
  openItemDetail(row.dataset.openItem);
});



function uniqueSorted(values){
  return [...new Set(values.filter(Boolean))].sort((a,b)=>String(a).localeCompare(String(b),"ko"));
}

function refillSelect(select, values, firstLabel){
  if(!select) return;
  const current = select.value;
  select.innerHTML = `<option value="">${firstLabel}</option>` +
    uniqueSorted(values).map(v=>`<option value="${String(v).replace(/"/g,"&quot;")}">${v}</option>`).join("");
  if([...select.options].some(o=>o.value===current)) select.value=current;
}

function refreshFilterOptions(){
  refillSelect(document.getElementById("dollSizeFilter"), state.dolls.map(d=>d.size), "Size · All");
  refillSelect(document.getElementById("dollMakerFilter"), state.dolls.map(d=>d.maker), "Maker · All");
  refillSelect(document.getElementById("dollTagFilter"), state.dolls.flatMap(d=>d.tags || []), "Tag · All");

  refillSelect(document.getElementById("itemSizeFilter"), state.items.map(i=>i.size), "Size · All");
  const dollSelect = document.getElementById("itemDollFilter");
  if(dollSelect){
    const current=dollSelect.value;
    dollSelect.innerHTML = `<option value="">Doll · All</option>` +
      state.dolls.map(d=>`<option value="${d.id}">${d.name}</option>`).join("");
    if([...dollSelect.options].some(o=>o.value===current)) dollSelect.value=current;
  }

  const allCategories = [
    ...state.dolls.map(d=>d.category),
    ...state.items.map(i=>i.category)
  ];
  const allMakers = [...state.dolls.map(d=>d.maker), ...state.items.map(i=>i.maker)];
  const allSizes = [...state.dolls.map(d=>d.size), ...state.items.map(i=>i.size)];
  const allTags = [...state.dolls.flatMap(d=>d.tags||[]), ...state.items.flatMap(i=>i.tags||[])];

  refillSelect(document.getElementById("searchCategory"), allCategories, "All Categories");
  refillSelect(document.getElementById("searchMaker"), allMakers, "All Makers");
  refillSelect(document.getElementById("searchSize"), allSizes, "All Sizes");
  refillSelect(document.getElementById("searchTag"), allTags, "All Tags");
}

function applyDollFilters(){
  const q = (document.getElementById("dollTextFilter")?.value || "").trim().toLowerCase();
  const size = document.getElementById("dollSizeFilter")?.value || "";
  const maker = document.getElementById("dollMakerFilter")?.value || "";
  const tag = document.getElementById("dollTagFilter")?.value || "";
  const activeCategory = document.querySelector('#view-dolls .filter-row .chip.active')?.textContent.trim() || "All";

  document.querySelectorAll("#dollGrid .collection-card").forEach(card=>{
    const tags = (card.dataset.tags || "").split("|").filter(Boolean);
    const ok =
      (!q || card.dataset.search.includes(q)) &&
      (!size || card.dataset.size===size) &&
      (!maker || card.dataset.maker===maker) &&
      (!tag || tags.includes(tag)) &&
      (activeCategory==="All" || card.dataset.category===activeCategory);
    card.classList.toggle("filter-hidden", !ok);
  });
}

function applyItemFilters(){
  const q = (document.getElementById("itemTextFilter")?.value || "").trim().toLowerCase();
  const status = document.getElementById("itemStatusFilter")?.value || "";
  const size = document.getElementById("itemSizeFilter")?.value || "";
  const doll = document.getElementById("itemDollFilter")?.value || "";
  const activeCategory = document.querySelector('#view-items .filter-row .chip.active')?.textContent.trim() || "All";

  document.querySelectorAll("#itemGrid .collection-card").forEach(card=>{
    const ok =
      (!q || card.dataset.search.includes(q)) &&
      (!status || card.dataset.status===status) &&
      (!size || card.dataset.size===size) &&
      (!doll || card.dataset.doll===doll) &&
      (activeCategory==="All" || card.dataset.category===activeCategory);
    card.classList.toggle("filter-hidden", !ok);
  });
}

function resultCardTemplate(item,type){
  const meta = type==="doll"
    ? [item.category,item.maker,item.size].filter(Boolean).join(" · ")
    : [item.category,item.status,item.size].filter(Boolean).join(" · ");
  return `
    <article class="collection-card search-result-card" data-result-id="${item.id}" data-result-type="${type}">
      <div class="card-image">
        ${item.imageData ? `<img class="uploaded-photo" src="${item.imageData}" alt="${item.name}">` : `<span class="placeholder-art">${type==="doll"?"🧸":"👗"}</span>`}
        <span class="card-badge">${item.category || ""}</span>
        <span class="result-type-badge">${type==="doll"?"DOLL":"ITEM"}</span>
      </div>
      <div class="card-body">
        <h3>${item.name}</h3>
        <div class="card-meta">${meta}</div>
        <div class="card-tags">${(item.tags||[]).map(t=>`<span>#${t}</span>`).join("")}</div>
      </div>
    </article>`;
}

function runAdvancedSearch(){
  const includeDolls = document.getElementById("searchTargetDolls").checked;
  const includeItems = document.getElementById("searchTargetItems").checked;
  const category = document.getElementById("searchCategory").value;
  const maker = document.getElementById("searchMaker").value;
  const size = document.getElementById("searchSize").value;
  const tag = document.getElementById("searchTag").value;
  const status = document.getElementById("searchStatus").value;
  const keyword = document.getElementById("searchKeyword").value.trim().toLowerCase();

  const matches = (x,type)=>{
    const haystack = [
      x.name,x.maker,x.size,x.category,x.status,x.memo,
      ...(x.tags || [])
    ].filter(Boolean).join(" ").toLowerCase();

    return (
      (!category || x.category===category) &&
      (!maker || x.maker===maker) &&
      (!size || x.size===size) &&
      (!tag || (x.tags || []).includes(tag)) &&
      (!status || (type==="item" && x.status===status)) &&
      (!keyword || haystack.includes(keyword))
    );
  };

  const results = [
    ...(includeDolls ? state.dolls.filter(x=>matches(x,"doll")).map(x=>({type:"doll",item:x})) : []),
    ...(includeItems ? state.items.filter(x=>matches(x,"item")).map(x=>({type:"item",item:x})) : [])
  ];

  const host = document.getElementById("searchResults");
  host.innerHTML = results.length
    ? results.map(r=>resultCardTemplate(r.item,r.type)).join("")
    : `<div class="search-result-empty">조건에 맞는 결과가 없어요.</div>`;

  document.getElementById("searchResultCount").textContent = `${results.length} items`;
}

function resetAdvancedSearch(){
  document.getElementById("searchTargetDolls").checked = true;
  document.getElementById("searchTargetItems").checked = true;
  ["searchCategory","searchMaker","searchSize","searchTag","searchStatus","searchKeyword"].forEach(id=>{
    const el=document.getElementById(id); if(el) el.value="";
  });
  runAdvancedSearch();
}

["dollTextFilter","dollSizeFilter","dollMakerFilter","dollTagFilter"].forEach(id=>{
  document.getElementById(id)?.addEventListener("input", applyDollFilters);
  document.getElementById(id)?.addEventListener("change", applyDollFilters);
});
["itemTextFilter","itemStatusFilter","itemSizeFilter","itemDollFilter"].forEach(id=>{
  document.getElementById(id)?.addEventListener("input", applyItemFilters);
  document.getElementById(id)?.addEventListener("change", applyItemFilters);
});

document.querySelectorAll('#view-dolls .filter-row .chip').forEach(btn=>{
  btn.addEventListener("click",()=>{
    document.querySelectorAll('#view-dolls .filter-row .chip').forEach(x=>x.classList.remove("active"));
    btn.classList.add("active");
    applyDollFilters();
  });
});

document.querySelectorAll('#view-items .filter-row .chip').forEach(btn=>{
  btn.addEventListener("click",()=>{
    document.querySelectorAll('#view-items .filter-row .chip').forEach(x=>x.classList.remove("active"));
    btn.classList.add("active");
    applyItemFilters();
  });
});

document.getElementById("runAdvancedSearch")?.addEventListener("click", runAdvancedSearch);
document.getElementById("resetAdvancedSearch")?.addEventListener("click", resetAdvancedSearch);
["searchTargetDolls","searchTargetItems","searchCategory","searchMaker","searchSize","searchTag","searchStatus"].forEach(id=>{
  document.getElementById(id)?.addEventListener("change", runAdvancedSearch);
});
document.getElementById("searchKeyword")?.addEventListener("input", runAdvancedSearch);

document.addEventListener("click",(e)=>{
  const result = e.target.closest("[data-result-id]");
  if(!result) return;
  if(result.dataset.resultType==="doll") openDollDetail(result.dataset.resultId);
  else openItemDetail(result.dataset.resultId);
});

async function reloadFromBackend(){
  const data = await DollyBackend.loadAll();
  state.dolls = data.dolls;
  state.items = data.items;
  state.wishes = data.wishes;
  render();
  refreshFilterOptions();
  applyDollFilters();
  applyItemFilters();
  runAdvancedSearch();
}

async function showLoggedIn(user){
  document.getElementById("loginScreen").hidden = true;
  document.body.classList.remove("auth-loading");
  const avatar = document.getElementById("userAvatar");
  if(avatar) avatar.textContent = (user.email || "L").slice(0,1).toUpperCase();
  await reloadFromBackend();
}

function showLoggedOut(){
  document.getElementById("loginScreen").hidden = false;
  state.dolls = []; state.items = []; state.wishes = [];
  render();
}

document.getElementById("loginForm").addEventListener("submit", async (e)=>{
  e.preventDefault();
  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value;
  const errorBox = document.getElementById("loginError");
  errorBox.textContent = "";
  try{
    const {data,error} = await DollyBackend.client.auth.signInWithPassword({email,password});
    if(error) throw error;
    await showLoggedIn(data.user);
  }catch(err){
    console.error(err);
    errorBox.textContent = "로그인에 실패했어요. 이메일과 비밀번호를 확인해 주세요.";
  }
});

document.getElementById("logoutButton").addEventListener("click", async ()=>{
  await DollyBackend.client.auth.signOut();
  showLoggedOut();
});

async function boot(){
  document.body.classList.add("auth-loading");
  render();
  const {data:{session}} = await DollyBackend.client.auth.getSession();
  if(session?.user){
    try{ await showLoggedIn(session.user); }
    catch(err){
      console.error(err);
      alert(`Supabase 데이터를 불러오지 못했어요.\n${err.message || err}`);
      document.body.classList.remove("auth-loading");
    }
  } else {
    document.body.classList.remove("auth-loading");
    showLoggedOut();
  }
}

DollyBackend.client.auth.onAuthStateChange((event, session)=>{
  if(event === "SIGNED_OUT") showLoggedOut();
});

boot();

