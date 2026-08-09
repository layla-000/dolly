
(() => {
  const client = window.DollySupabase;
  const BUCKET = "dolly-images";

  function throwIf(error){
    if(error) throw error;
  }

  async function getUser(){
    const { data, error } = await client.auth.getUser();
    throwIf(error);
    return data.user;
  }

  function dataUrlToBlob(dataUrl){
    const [head, body] = dataUrl.split(",");
    const mime = (head.match(/data:(.*?);base64/) || [])[1] || "image/jpeg";
    const bin = atob(body);
    const bytes = new Uint8Array(bin.length);
    for(let i=0;i<bin.length;i++) bytes[i] = bin.charCodeAt(i);
    return new Blob([bytes], {type:mime});
  }

  async function compressImageDataUrl(dataUrl, maxSide=1200, quality=.74){
    if(!dataUrl) return null;
    const sourceBlob = dataUrlToBlob(dataUrl);
    const bitmap = await createImageBitmap(sourceBlob);
    const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close?.();
    return await new Promise(resolve => canvas.toBlob(resolve, "image/webp", quality));
  }

  const SIGNED_URL_SECONDS = 60 * 60 * 12; // 12 hours
  const signedUrlPromises = new Map();

  function signedCacheKey(path){
    return `dolly:signed:${path}`;
  }

  function readSignedCache(path){
    try{
      const raw = localStorage.getItem(signedCacheKey(path));
      if(!raw) return "";
      const cached = JSON.parse(raw);
      // Leave a 5 minute safety margin before expiry.
      if(!cached?.url || !cached?.expiresAt || cached.expiresAt < Date.now() + 300000){
        localStorage.removeItem(signedCacheKey(path));
        return "";
      }
      return cached.url;
    }catch{
      return "";
    }
  }

  function writeSignedCache(path,url){
    try{
      localStorage.setItem(signedCacheKey(path), JSON.stringify({
        url,
        expiresAt: Date.now() + SIGNED_URL_SECONDS * 1000
      }));
    }catch{}
  }

  async function signedUrl(path){
    if(!path) return "";
    const cached = readSignedCache(path);
    if(cached) return cached;
    if(signedUrlPromises.has(path)) return signedUrlPromises.get(path);

    const promise = (async()=>{
      const { data, error } = await client.storage.from(BUCKET).createSignedUrl(path, SIGNED_URL_SECONDS);
      if(error){
        console.warn("Signed URL error", error);
        return "";
      }
      const url = data?.signedUrl || "";
      if(url) writeSignedCache(path,url);
      return url;
    })().finally(()=>signedUrlPromises.delete(path));

    signedUrlPromises.set(path,promise);
    return promise;
  }

  async function getImageMap(){
    const { data: rows, error } = await client
      .from("images")
      .select("id,entity_type,entity_id,storage_path,is_primary,sort_order")
      .eq("is_primary", true);
    throwIf(error);

    // Do NOT create signed URLs here. Returning only storage paths means
    // the main collection data can render immediately.
    return new Map((rows || []).map(row => [
      `${row.entity_type}:${row.entity_id}`,
      row
    ]));
  }

  async function getTagMaps(){
    const [
      {data:tags,error:tagErr},
      {data:dollLinks,error:dlErr},
      {data:itemLinks,error:ilErr},
      {data:wishLinks,error:wlErr}
    ] = await Promise.all([
      client.from("tags").select("id,name"),
      client.from("doll_tags").select("doll_id,tag_id"),
      client.from("item_tags").select("item_id,tag_id"),
      client.from("wishlist_tags").select("wishlist_id,tag_id")
    ]);
    throwIf(tagErr); throwIf(dlErr); throwIf(ilErr); throwIf(wlErr);

    const tagName = new Map((tags || []).map(t => [t.id, t.name]));
    const build = (links, key) => {
      const m = new Map();
      (links || []).forEach(link => {
        const id = link[key];
        if(!m.has(id)) m.set(id, []);
        const name = tagName.get(link.tag_id);
        if(name) m.get(id).push(name);
      });
      return m;
    };
    return {
      dolls: build(dollLinks, "doll_id"),
      items: build(itemLinks, "item_id"),
      wishes: build(wishLinks, "wishlist_id")
    };
  }

  async function loadAll(){
    const [
      {data:dolls,error:dollErr},
      {data:items,error:itemErr},
      {data:wishes,error:wishErr},
      imageMap,
      tagMaps
    ] = await Promise.all([
      client.from("dolls").select("*").order("created_at",{ascending:false}),
      client.from("items").select("*").order("created_at",{ascending:false}),
      client.from("wishlist").select("*").order("created_at",{ascending:false}),
      getImageMap(),
      getTagMaps()
    ]);
    throwIf(dollErr); throwIf(itemErr); throwIf(wishErr);

    return {
      dolls:(dolls || []).map(d => ({
        id:d.id,
        category:d.category,
        maker:d.maker || "",
        name:d.name,
        body:d.body || "",
        size:d.size || "",
        skin:d.skin_color || "",
        makeup:d.makeup || "",
        price:Number(d.purchase_price || 0),
        memoTitle:d.memo_title || "",
        memo:d.memo || "",
        tags:tagMaps.dolls.get(d.id) || [],
        imageData:"",
        storagePath:imageMap.get(`doll:${d.id}`)?.storage_path || "",
        emoji:"🧸"
      })),
      items:(items || []).map(i => ({
        id:i.id,
        category:i.category,
        name:i.name,
        status:i.status,
        wearingDollId:i.wearing_doll_id || "",
        size:i.size || "",
        storage:i.storage_location || "",
        maker:i.maker || "",
        shop:i.shop || "",
        price:Number(i.purchase_price || 0),
        memo:i.memo || "",
        tags:tagMaps.items.get(i.id) || [],
        imageData:"",
        storagePath:imageMap.get(`item:${i.id}`)?.storage_path || "",
        emoji:"👗"
      })),
      wishes:(wishes || []).map(w => ({
        id:w.id,
        name:w.name,
        category:w.category,
        price:Number(w.price || 0),
        priority:w.priority || "보통",
        purchaseStatus:w.purchase_status || "못삼",
        seller:w.seller || "",
        saleUrl:w.sale_url || "",
        deadline:w.reservation_deadline || "",
        purchaseDate:w.purchase_date || "",
        memo:w.memo || "",
        tags:tagMaps.wishes.get(w.id) || []
      }))
    };
  }

  async function saveTags(entityType, entityId, names){
    const user = await getUser();
    const clean = [...new Set((names || []).map(x=>x.trim()).filter(Boolean))];

    const defs = {
      doll:{table:"doll_tags", idCol:"doll_id"},
      item:{table:"item_tags", idCol:"item_id"},
      wishlist:{table:"wishlist_tags", idCol:"wishlist_id"}
    };
    const def = defs[entityType];
    if(!def) throw new Error("Unknown tag entity type");

    const { error: deleteErr } = await client.from(def.table).delete().eq(def.idCol, entityId);
    throwIf(deleteErr);
    if(!clean.length) return;

    const rows = clean.map(name => ({owner_id:user.id,name}));
    const { data:tags, error: tagErr } = await client
      .from("tags")
      .upsert(rows, {onConflict:"owner_id,name", ignoreDuplicates:false})
      .select("id,name");
    throwIf(tagErr);

    const links = (tags || []).map(t => ({[def.idCol]:entityId, tag_id:t.id}));
    const { error: linkErr } = await client.from(def.table).insert(links);
    throwIf(linkErr);
  }

  async function savePrimaryImage(entityType, entityId, dataUrl){
    if(!dataUrl || dataUrl.startsWith("https://")) return;
    const user = await getUser();
    const blob = await compressImageDataUrl(dataUrl);
    if(!blob) return;

    const folder = entityType === "doll" ? "dolls" : "items";
    const path = `${user.id}/${folder}/${entityId}/primary.webp`;

    const { error: uploadErr } = await client.storage.from(BUCKET).upload(path, blob, {
      contentType:"image/webp",
      cacheControl:"3600",
      upsert:true
    });
    throwIf(uploadErr);

    const { data:existing, error:findErr } = await client
      .from("images")
      .select("id")
      .eq("entity_type", entityType)
      .eq("entity_id", entityId)
      .eq("is_primary", true)
      .maybeSingle();
    throwIf(findErr);

    if(existing?.id){
      const {error} = await client.from("images")
        .update({storage_path:path, sort_order:0})
        .eq("id",existing.id);
      throwIf(error);
    } else {
      const {error} = await client.from("images").insert({
        owner_id:user.id,
        entity_type:entityType,
        entity_id:entityId,
        storage_path:path,
        is_primary:true,
        sort_order:0
      });
      throwIf(error);
    }
  }

  async function saveDoll(payload){
    const user = await getUser();
    const row = {
      owner_id:user.id,
      category:payload.category,
      maker:payload.maker || null,
      name:payload.name,
      body:payload.body || null,
      size:payload.size || null,
      skin_color:payload.skin || null,
      makeup:payload.makeup || null,
      purchase_price:Number(payload.price || 0),
      memo_title:payload.memoTitle || null,
      memo:payload.memo || null,
      updated_at:new Date().toISOString()
    };

    let id = payload.id;
    if(id){
      const {error} = await client.from("dolls").update(row).eq("id",id);
      throwIf(error);
    } else {
      const {data,error} = await client.from("dolls").insert(row).select("id").single();
      throwIf(error); id = data.id;
    }

    await saveTags("doll", id, payload.tags);
    await savePrimaryImage("doll", id, payload.imageData);
    return id;
  }

  async function saveItem(payload){
    const user = await getUser();
    const row = {
      owner_id:user.id,
      category:payload.category,
      name:payload.name,
      status:payload.status || "보관중",
      wearing_doll_id:payload.status === "착용중" && payload.wearingDollId ? payload.wearingDollId : null,
      size:payload.size || null,
      storage_location:payload.storage || null,
      maker:payload.maker || null,
      shop:payload.shop || null,
      purchase_price:Number(payload.price || 0),
      memo:payload.memo || null,
      updated_at:new Date().toISOString()
    };

    let id = payload.id;
    if(id){
      const {error} = await client.from("items").update(row).eq("id",id);
      throwIf(error);
    } else {
      const {data,error} = await client.from("items").insert(row).select("id").single();
      throwIf(error); id = data.id;
    }

    await saveTags("item", id, payload.tags);
    await savePrimaryImage("item", id, payload.imageData);
    return id;
  }

  async function saveWish(payload){
    const user = await getUser();
    const row = {
      owner_id:user.id,
      name:payload.name,
      category:payload.category,
      price:Number(payload.price || 0),
      priority:payload.priority || "보통",
      purchase_status:payload.purchaseStatus || "못삼",
      seller:payload.seller || null,
      sale_url:payload.saleUrl || null,
      reservation_deadline:payload.deadline || null,
      purchase_date:payload.purchaseDate || null,
      memo:payload.memo || null,
      updated_at:new Date().toISOString()
    };

    let id = payload.id;
    if(id){
      const {error} = await client.from("wishlist").update(row).eq("id",id);
      throwIf(error);
    } else {
      const {data,error} = await client.from("wishlist").insert(row).select("id").single();
      throwIf(error); id = data.id;
    }

    await saveTags("wishlist", id, payload.tags);
    return id;
  }

  async function deleteImages(entityType,id){
    const {data:rows,error} = await client
      .from("images").select("id,storage_path")
      .eq("entity_type",entityType).eq("entity_id",id);
    throwIf(error);
    const paths = (rows || []).map(r=>r.storage_path).filter(Boolean);
    if(paths.length){
      const {error:storageErr} = await client.storage.from(BUCKET).remove(paths);
      throwIf(storageErr);
    }
    const {error:deleteErr} = await client.from("images")
      .delete().eq("entity_type",entityType).eq("entity_id",id);
    throwIf(deleteErr);
  }

  async function deleteDoll(id){
    await deleteImages("doll",id);
    const {error} = await client.from("dolls").delete().eq("id",id);
    throwIf(error);
  }

  async function deleteItem(id){
    await deleteImages("item",id);
    const {error} = await client.from("items").delete().eq("id",id);
    throwIf(error);
  }

  async function deleteWish(id){
    const {error} = await client.from("wishlist").delete().eq("id",id);
    throwIf(error);
  }

  window.DollyBackend = {
    client, getUser, loadAll, saveDoll, saveItem, saveWish,
    deleteDoll, deleteItem, deleteWish, getSignedImageUrl:signedUrl
  };
})();
