let allOCs = [];
let currentFeaturedOcId = null;
let allItems = [];
let allScenes = [];
let playlist = [
  { title: "เบอร์สอง", artist: "PUN", url: "https://youtu.be/5qap5a0419A", isFavorite: true }
];
let currentSongIndex = 0;
let currentOCCategory = 'all';
let currentItemCategory = 'all';
let currentGalleryCharId = null;
let currentActiveTab = 'ocs';
let ytPlayer = null;

//=== YOUTUBE PLAYER ENGINE (Autoplay Next Song) ===
function extractYouTubeId(url) {
  if (!url) return "";
  let vId = "";
  if (url.includes('youtu.be/')) {
    vId = url.split('youtu.be/')[1].split('?')[0];
  } else if (url.includes('watch?v=')) {
    vId = url.split('watch?v=')[1].split('&')[0];
  }
  return vId;
}

function onYouTubeIframeAPIReady() {
  const defaultVideoId = extractYouTubeId(playlist[0]?.url) || '5qap5a0419A';
  ytPlayer = new YT.Player('yt-player-placeholder', {
    height: '100%',
    width: '100%',
    videoId: defaultVideoId,
    playerVars: { 'autoplay': 0, 'controls': 1, 'enablejsapi': 1 },
    events: { 'onStateChange': onPlayerStateChange }
  });
}

function onPlayerStateChange(event) {
  if (event.data === YT.PlayerState.ENDED) {
    nextSong();
  }
}

function playSong(index) {
  if (playlist.length === 0) return;
  currentSongIndex = index;
  const song = playlist[currentSongIndex];
  document.querySelector('#current-song-name').innerText = song.title;
  document.querySelector('#current-artist-name').innerText = song.artist ? `(${song.artist})` : '';
  const vId = extractYouTubeId(song.url);
  const box = document.querySelector('#yt-player-box');
  if (box) {
    box.innerHTML = `<iframe width="100%" height="130" src="https://www.youtube.com/embed/${vId}?autoplay=1" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen style="border-radius:8px;"></iframe>`;
  }
  document.querySelector('#btn-play-pause').innerText = "หยุด";
}

function togglePlayPause() {
  const btn = document.querySelector('#btn-play-pause');
  const box = document.querySelector('#yt-player-box');
  const iframe = box ? box.querySelector('iframe') : null;
  if (!iframe) return;
  const src = iframe.src;
  if (src.includes('autoplay=1')) {
    iframe.src = src.replace('autoplay=1', 'autoplay=0');
    if (btn) btn.innerText = "เล่น";
  } else {
    iframe.src = src.replace('autoplay=0', 'autoplay=1');
    if (btn) btn.innerText = "หยุด";
  }
}

function nextSong() {
  if (playlist.length === 0) return;
  currentSongIndex = (currentSongIndex + 1) % playlist.length;
  playSong(currentSongIndex);
}

function prevSong() {
  if (playlist.length === 0) return;
  currentSongIndex = (currentSongIndex - 1 + playlist.length) % playlist.length;
  playSong(currentSongIndex);
}

//=== HELPER: IMAGE UPLOAD ===
function handleImageUpload(input, targetSelector) {
  if (input.files && input.files[0]) {
    const reader = new FileReader();
    reader.onload = function(e) {
      document.querySelector(targetSelector).value = e.target.result;
      const preview = document.querySelector(targetSelector + '-preview');
      if (preview) { preview.src = e.target.result; preview.style.display = 'block'; }
    };
    reader.readAsDataURL(input.files[0]);
  }
}

//=== NAVIGATION SYSTEM ===
function switchTab(tabName) {
  currentActiveTab = tabName;
  const tabs = ['ocs', 'gallery-hub', 'playlist', 'items', 'blog'];
  tabs.forEach(t => {
    const el = document.querySelector(`#tab-${t}`);
    if (el) el.style.display = (t === tabName) ? 'block' : 'none';
    const btn = document.querySelector(`#btn-${t}`);
    if (btn) {
      if (t === tabName) btn.classList.add('active');
      else btn.classList.remove('active');
    }
  });

  if (tabName === 'ocs') loadOCs();
  if (tabName === 'gallery-hub') renderGalleryHubSelector();
  if (tabName === 'playlist') renderPlaylist();
  if (tabName === 'items') loadItems();
  if (tabName === 'blog') { loadOCSelectForLore(); loadBlogFeed(); }
}

//=== THEME MANAGER ===
function changeTheme(themeName) {
  document.documentElement.setAttribute('data-theme', themeName);
  localStorage.setItem('selected_theme', themeName);
}

function loadTheme() {
  const savedTheme = localStorage.getItem('selected_theme') || 'dark';
  document.documentElement.setAttribute('data-theme', savedTheme);
}

//=== BACKUP & RESTORE JSON ===
function exportDataJSON() {
  const backupData = {
    ocs: allOCs,
    items: allItems,
    scenes: allScenes,
    playlist: playlist,
    profile: {
      name: localStorage.getItem('blog_profile_name'),
      img: localStorage.getItem('blog_profile_img'),
      bio: localStorage.getItem('blog_profile_bio'),
      frame: localStorage.getItem('blog_profile_frame')
    }
  };
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupData, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", `oc_sanctuary_backup_${new Date().toISOString().slice(0,10)}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

function importDataJSON(event) {
  const fileReader = new FileReader();
  if (event.target.files[0]) {
    fileReader.readAsText(event.target.files[0], "UTF-8");
    fileReader.onload = function (e) {
      try {
        const parsed = JSON.parse(e.target.result);
        if (parsed.ocs) { allOCs = parsed.ocs; localStorage.setItem('custom_ocs', JSON.stringify(allOCs)); }
        if (parsed.items) { allItems = parsed.items; localStorage.setItem('custom_items', JSON.stringify(allItems)); }
        if (parsed.scenes) { allScenes = parsed.scenes; localStorage.setItem('custom_scenes', JSON.stringify(allScenes)); }
        if (parsed.playlist) { playlist = parsed.playlist; localStorage.setItem('custom_playlist', JSON.stringify(playlist)); }
        if (parsed.profile) {
          if (parsed.profile.name) localStorage.setItem('blog_profile_name', parsed.profile.name);
          if (parsed.profile.img) localStorage.setItem('blog_profile_img', parsed.profile.img);
          if (parsed.profile.bio) localStorage.setItem('blog_profile_bio', parsed.profile.bio);
          if (parsed.profile.frame) localStorage.setItem('blog_profile_frame', parsed.profile.frame);
        }
        alert('กู้คืนข้อมูลสำเร็จเรียบร้อย!');
        switchTab(currentActiveTab);
        loadProfile();
      } catch (err) {
        alert('ไฟล์ข้อมูลไม่ถูกต้องหรือเกิดข้อผิดพลาด!');
      }
    };
  }
}

//=== PLAYLIST MANAGER ===
function renderPlaylist() {
  const container = document.querySelector('#playlist-container');
  if (!container) return;
  const searchQuery = document.querySelector('#search-playlist') ? document.querySelector('#search-playlist').value.toLowerCase() : '';
  const onlyFavorite = document.querySelector('#filter-favorite-songs') ? document.querySelector('#filter-favorite-songs').checked : false;

  let filteredPlaylist = playlist.map((song, originalIndex) => ({ ...song, originalIndex }))
    .filter(song => {
      const matchText = (song.title + (song.artist || '')).toLowerCase();
      const matchQuery = matchText.includes(searchQuery);
      const matchFav = onlyFavorite ? song.isFavorite : true;
      return matchQuery && matchFav;
    });

  container.innerHTML = filteredPlaylist.length === 0 ? '<p style="color:var(--text-sub);">ไม่พบเพลงในเพลย์ลิสต์</p>' : '';
  filteredPlaylist.forEach(song => {
    const idx = song.originalIndex;
    const artistText = song.artist ? `<span style="color:var(--text-sub); font-size:0.85rem;">(${song.artist})</span>` : '';
    const starColor = song.isFavorite ? '#eab308' : '#6b7280';
    const vId = extractYouTubeId(song.url);
    const thumb = vId ? `<img src="https://img.youtube.com/vi/${vId}/hqdefault.jpg" style="width:60px;height:45px;object-fit:cover;border-radius:6px;margin-right:8px;" alt="thumb">` : '';
    container.innerHTML += `
    <div class="playlist-item">
      <div style="display:flex; align-items:center; gap:8px;">
        ${thumb}
        <span style="cursor:pointer; font-size:1.1rem; color:${starColor};" onclick="toggleFavoriteSong(${idx})" title="กดเพื่อสลับเพลงโปรด">★</span>
        <span><b>${song.title}</b> ${artistText}</span>
      </div>
      <div style="display: flex; gap:5px;">
        <button class="btn-submit" style="padding: 4px 10px; font-size:0.8rem;" onclick="playSong(${idx})">▶ ฟังเพลงนี้</button>
        <button class="btn-edit" style="padding: 4px 10px; font-size:0.8rem;" onclick="openSongModal(${idx})">แก้ไข</button>
        <button class="btn-del" style="padding: 4px 10px; font-size:0.8rem;" onclick="removeSong(${idx})">ลบ</button>
      </div>
    </div>`;
  });
}

function toggleFavoriteSong(idx) {
  if (playlist[idx]) {
    playlist[idx].isFavorite = !playlist[idx].isFavorite;
    localStorage.setItem('custom_playlist', JSON.stringify(playlist));
    renderPlaylist();
  }
}

const playlistFormEl = document.querySelector('#playlist-form');
if (playlistFormEl) {
  playlistFormEl.addEventListener('submit', (e) => {
    e.preventDefault();
    const title = document.querySelector('#pl-title').value.trim();
    const artist = document.querySelector('#pl-artist').value.trim();
    const url = document.querySelector('#pl-url').value.trim();
    playlist.push({ title, artist, url, isFavorite: false });
    localStorage.setItem('custom_playlist', JSON.stringify(playlist));
    e.target.reset();
    renderPlaylist();
  });
}

function loadPlaylist() {
  const saved = localStorage.getItem('custom_playlist');
  if (saved) { try { playlist = JSON.parse(saved); } catch (e) {} }
}

function removeSong(idx) {
  playlist.splice(idx, 1);
  localStorage.setItem('custom_playlist', JSON.stringify(playlist));
  renderPlaylist();
}

function openSongModal(idx) {
  const song = playlist[idx];
  if (!song) return;
  document.querySelector('#edit-song-index').value = idx;
  document.querySelector('#edit-song-title').value = song.title;
  document.querySelector('#edit-song-artist').value = song.artist || '';
  document.querySelector('#edit-song-url').value = song.url;
  document.querySelector('#modal-song').style.display = 'flex';
}

function closeSongModal() { document.querySelector('#modal-song').style.display = 'none'; }

function saveSongEdit() {
  const idx = document.querySelector('#edit-song-index').value;
  const title = document.querySelector('#edit-song-title').value.trim();
  const artist = document.querySelector('#edit-song-artist').value.trim();
  const url = document.querySelector('#edit-song-url').value.trim();
  if (playlist[idx]) {
    playlist[idx].title = title;
    playlist[idx].artist = artist;
    playlist[idx].url = url;
    localStorage.setItem('custom_playlist', JSON.stringify(playlist));
    renderPlaylist();
    closeSongModal();
  }
}

//=== PROFILE MANAGER ===
function loadProfile() {
  const savedName = localStorage.getItem('blog_profile_name') || '';
  const savedImg = localStorage.getItem('blog_profile_img') || 'https://picsum.photos/200';
  const savedBio = localStorage.getItem('blog_profile_bio') || 'คลังบันทึกตัวละครและเรื่องราวคอมมู';
  const savedFrame = localStorage.getItem('blog_profile_frame') || 'circle';

  document.querySelector('#profile-name').innerText = savedName;
  document.querySelector('#profile-bio').innerText = savedBio;
  const imgEl = document.querySelector('#profile-img');
  if (imgEl) {
    imgEl.src = savedImg;
    imgEl.className = `profile-avatar-style ${savedFrame === 'square' ? 'square-frame' : 'circle-frame'}`;
  }
}

function openProfileModal() {
  document.querySelector('#edit-profile-name').value = document.querySelector('#profile-name').innerText;
  document.querySelector('#edit-profile-img').value = document.querySelector('#profile-img').src;
  document.querySelector('#edit-profile-bio').value = document.querySelector('#profile-bio').innerText;
  document.querySelector('#modal-profile').style.display = 'flex';
}

function closeProfileModal() { document.querySelector('#modal-profile').style.display = 'none'; }

function saveProfile() {
  const name = document.querySelector('#edit-profile-name').value.trim();
  const img = document.querySelector('#edit-profile-img').value.trim();
  const bio = document.querySelector('#edit-profile-bio').value.trim();
  let frame = 'circle';
  const selectedRadio = document.querySelector('input[name="profile-frame"]:checked');
  if (selectedRadio) frame = selectedRadio.value;

  localStorage.setItem('blog_profile_name', name);
  localStorage.setItem('blog_profile_img', img);
  localStorage.setItem('blog_profile_bio', bio);
  localStorage.setItem('blog_profile_frame', frame);
  loadProfile();
  closeProfileModal();
}

//=== CHARACTER MANAGER ===
async function randomizeFeaturedOC() {
  if (!allOCs || allOCs.length === 0) {
    const n = document.querySelector('#feat-name');
    if (n) n.innerText = 'ยังไม่มีตัวละคร';
    return;
  }
  const c = allOCs[Math.floor(Math.random() * allOCs.length)];
  currentFeaturedOcId = c._id || c.charId;
  const img = document.querySelector('#feat-img');
  const name = document.querySelector('#feat-name');
  const role = document.querySelector('#feat-role');
  const quote = document.querySelector('#feat-quote');
  if (img) img.src = c.avatarUrl || 'https://via.placeholder.com/150';
  if (name) name.innerText = c.name || 'ไม่ระบุชื่อ';
  if (role) role.innerText = c.role || 'OC';
  if (quote) {
    const q = c.featuredQuote || (c.personality ? `"${c.personality.substring(0, 35)}..."` : '"..."');
    quote.innerText = q;
  }
}

function loadOCs() {
  const saved = localStorage.getItem('custom_ocs');
  if (saved) {
    try { allOCs = JSON.parse(saved); } catch(e) {}
  } else {
    allOCs = [
      { _id: "oc1", charId: "oc-01", name: "เซเลสเทีย", nickname: "เซล", role: "นักเวทย์แห่งแสง", category: "นักศึกษา", age: "19", height: "165", weight: "48", bloodType: "A", avatarUrl: "https://picsum.photos/200?random=1", personalInfo: "ชอบกินเค้กช็อกโกแลต", personality: "ร่าเริง เป็นกันเอง", background: "เด็กสาวผู้มีพลังเวทย์โบราณ" }
    ];
  }
  renderOCs(allOCs);
  renderGalleryWidget(allOCs);
  if (allOCs.length > 0) randomizeFeaturedOC();
}

function handleOCSubmit(e) {
  e.preventDefault();
  const newOc = {
    _id: 'oc_' + Date.now(),
    charId: document.querySelector('#oc-id').value.trim(),
    name: document.querySelector('#oc-name').value.trim(),
    nickname: document.querySelector('#oc-nickname').value.trim(),
    role: document.querySelector('#oc-role').value.trim(),
    category: document.querySelector('#oc-category').value,
    age: document.querySelector('#oc-age').value.trim(),
    height: document.querySelector('#oc-height').value.trim(),
    weight: document.querySelector('#oc-weight').value.trim(),
    bloodType: document.querySelector('#oc-blood').value.trim(),
    avatarUrl: document.querySelector('#oc-avatar').value.trim(),
    musicUrl: document.querySelector('#oc-music').value.trim(),
    personalInfo: document.querySelector('#oc-personal').value.trim(),
    personality: document.querySelector('#oc-personality').value.trim(),
    background: document.querySelector('#oc-background').value.trim()
  };
  allOCs.push(newOc);
  localStorage.setItem('custom_ocs', JSON.stringify(allOCs));
  e.target.reset();
  loadOCs();
  randomizeFeaturedOC();
  switchTab('ocs');
}

function renderOCs(data) {
  const container = document.querySelector('#oc-container');
  if (!container) return;
  let filtered = data;
  if (currentOCCategory !== 'all') {
    filtered = data.filter(c => (c.category || 'ตัวละครหลัก') === currentOCCategory);
  }

  container.innerHTML = filtered.length === 0 ? '<p style="color:var(--text-sub); grid-column: 1/-1;">ไม่พบตัวละครในหมวดหมู่นี้</p>' : '';
  filtered.forEach(c => {
    container.innerHTML += `
    <div class="oc-card">
      <div>
        <img src="${c.avatarUrl}" alt="avatar">
        <h3>${c.name}</h3>
        <span class="badge">ID: ${c.charId}</span>
        <p style="margin-top:6px;"><b>หมวด: </b> <span style="color:var(--accent-color);">${c.category || 'ตัวละครหลัก'}</span></p>
        <p><b>สังกัด:</b> ${c.role || '-'}</p>
        <p><b>อายุ:</b> ${c.age || '-'} | <b>สูง: </b> ${c.height || '-'}</p>
        <p><b>กรุ๊ปเลือด:</b> ${c.bloodType || '-'}</p>
      </div>
      <div class="card-actions">
        <button class="btn-view" onclick="openViewModal('${c._id}')">ดู</button>
        <button class="btn-edit" onclick="openOCModal('${c._id}')">แก้</button>
        <button class="btn-del" onclick="delOC('${c._id}')">ลบ</button>
        <button class="btn-gallery" onclick="openOCGalleryModal('${c.charId}')">อัลบั้มรูปภาพ</button>
      </div>
    </div>`;
  });
}

function filterOCCategory(cat) {
  currentOCCategory = cat;
  document.querySelectorAll('#oc-category-filters .filter-btn').forEach(btn => btn.classList.remove('active'));
  if (event && event.target) event.target.classList.add('active');
  renderOCs(allOCs);
}

function openViewModal(id) {
  const c = allOCs.find(item => item._id === id);
  if (!c) return;
  document.querySelector('#view-oc-img').src = c.avatarUrl;
  document.querySelector('#view-oc-name').innerText = c.name + (c.nickname ? ` (${c.nickname})` : '');
  document.querySelector('#view-oc-id').innerText = `ID: ${c.charId}`;
  document.querySelector('#view-oc-role').innerText = c.role || '-';
  document.querySelector('#view-oc-cat').innerText = c.category || 'ตัวละครหลัก';
  document.querySelector('#view-oc-stats').innerText = `อายุ: ${c.age || '-'} ปี | สูง: ${c.height || '-'} ซม. | น้ำหนัก: ${c.weight || '-'} กก. | กรุ๊ปเลือด: ${c.bloodType || '-'}`;
  document.querySelector('#view-oc-personal').innerText = c.personalInfo || '-';
  document.querySelector('#view-oc-personality').innerText = c.personality || '-';
  document.querySelector('#view-oc-bg').innerText = c.background || '-';

  const musicWrap = document.querySelector('#view-oc-music-wrap');
  if (c.musicUrl) {
    musicWrap.innerHTML = `<p><b>เพลงประจำตัว OC:</b></p><button class="btn-submit" onclick="playlist.push({title:'${c.name} Theme', url: '${c.musicUrl}', isFavorite:false}); playSong(playlist.length-1);">ฟังเพลงนี้ในเว็บ</button>`;
  } else {
    musicWrap.innerHTML = '';
  }
  document.querySelector('#modal-view-oc').style.display = 'flex';
}

function closeViewModal() { document.querySelector('#modal-view-oc').style.display = 'none'; }

function filterOCs() {
  const q = document.querySelector('#search-oc').value.toLowerCase();
  renderOCs(allOCs.filter(c => c.name.toLowerCase().includes(q) || c.charId.toLowerCase().includes(q)));
}

function openOCModal(id) {
  const oc = allOCs.find(c => c._id === id);
  if (!oc) return;
  document.querySelector('#edit-oc-mongo-id').value = oc._id;
  document.querySelector('#edit-oc-name').value = oc.name;
  document.querySelector('#edit-oc-nickname').value = oc.nickname || '';
  document.querySelector('#edit-oc-role').value = oc.role || '';
  document.querySelector('#edit-oc-category').value = oc.category || 'ตัวละครหลัก';
  document.querySelector('#edit-oc-age').value = oc.age || '';
  document.querySelector('#edit-oc-height').value = oc.height || '';
  document.querySelector('#edit-oc-weight').value = oc.weight || '';
  document.querySelector('#edit-oc-blood').value = oc.bloodType || '';
  document.querySelector('#edit-oc-avatar').value = oc.avatarUrl;
  const prev = document.querySelector('#edit-oc-avatar-preview');
  if (prev) { prev.src = oc.avatarUrl || ''; prev.style.display = oc.avatarUrl ? 'block' : 'none'; }
  document.querySelector('#edit-oc-music').value = oc.musicUrl || '';
  document.querySelector('#edit-oc-personal').value = oc.personalInfo || '';
  document.querySelector('#edit-oc-personality').value = oc.personality || '';
  document.querySelector('#edit-oc-background').value = oc.background || '';
  document.querySelector('#modal-oc').style.display = 'flex';
}

function closeOCModal() { document.querySelector('#modal-oc').style.display = 'none'; }

function saveOCEdit() {
  const id = document.querySelector('#edit-oc-mongo-id').value;
  const idx = allOCs.findIndex(c => c._id === id);
  if (idx !== -1) {
    allOCs[idx].name = document.querySelector('#edit-oc-name').value;
    allOCs[idx].nickname = document.querySelector('#edit-oc-nickname').value;
    allOCs[idx].role = document.querySelector('#edit-oc-role').value;
    allOCs[idx].category = document.querySelector('#edit-oc-category').value;
    allOCs[idx].age = document.querySelector('#edit-oc-age').value;
    allOCs[idx].height = document.querySelector('#edit-oc-height').value;
    allOCs[idx].weight = document.querySelector('#edit-oc-weight').value;
    allOCs[idx].bloodType = document.querySelector('#edit-oc-blood').value;
    allOCs[idx].avatarUrl = document.querySelector('#edit-oc-avatar').value;
    allOCs[idx].musicUrl = document.querySelector('#edit-oc-music').value;
    allOCs[idx].personalInfo = document.querySelector('#edit-oc-personal').value;
    allOCs[idx].personality = document.querySelector('#edit-oc-personality').value;
    allOCs[idx].background = document.querySelector('#edit-oc-background').value;
    localStorage.setItem('custom_ocs', JSON.stringify(allOCs));
  }
  closeOCModal();
  loadOCs();
}

function delOC(id) {
  if (!confirm('ลบใบสมัครนี้?')) return;
  allOCs = allOCs.filter(c => c._id !== id);
  localStorage.setItem('custom_ocs', JSON.stringify(allOCs));
  loadOCs();
}

//=== ITEM / WEAPON MANAGER ===
function handleItemSubmit(e) {
  e.preventDefault();
  const name = document.querySelector('#item-name').value.trim();
  const owner = document.querySelector('#item-owner').value.trim();
  const category = document.querySelector('#item-category').value;
  const imgUrl = document.querySelector('#item-img').value.trim() || 'https://picsum.photos/200';
  const desc = document.querySelector('#item-desc').value.trim();
  const atk = document.querySelector('#item-atk').value;
  const def = document.querySelector('#item-def').value;
  const spd = document.querySelector('#item-spd').value;
 
  const newItem = { name, owner, category, imgUrl, desc, atk, def, spd, favorite: false, rarity: 'common' };
  allItems.push(newItem);
  localStorage.setItem('custom_items', JSON.stringify(allItems));
  
  e.target.reset();
  document.querySelector('#atk-val').innerText = '50';
  document.querySelector('#def-val').innerText = '50';
  document.querySelector('#spd-val').innerText = '50';
  loadItems();
  switchTab('items');
}

function loadItems() {
  const saved = localStorage.getItem('custom_items');
  if (saved) { try { allItems = JSON.parse(saved); } catch(err) {} }
  renderItems(allItems);
}

function renderItems(data) {
  const container = document.querySelector('#item-container');
  if (!container) return;
  let filtered = data;
  if (currentItemCategory === 'pinned') {
    filtered = data.filter(i => i.favorite);
  } else if (currentItemCategory !== 'all') {
    filtered = data.filter(i => i.category === currentItemCategory);
  }

  container.innerHTML = filtered.length === 0 ? '<p style="color:var(--text-sub); grid-column: 1/-1;">ยังไม่มีไอเทมในคลังนี้</p>' : '';
  filtered.forEach((item, index) => {
    const realIdx = allItems.indexOf(item);
    const starColor = item.favorite ? '#eab308' : '#6b7280';
    container.innerHTML += `
    <div class="oc-card">
      <div>
        <img src="${item.imgUrl}" alt="item">
        <h3>${item.name} <span style="cursor:pointer; color:${starColor};" onclick="toggleItemFavorite(${realIdx})" title="ปักหมุด">&#9733;</span></h3>
        <span class="badge">เจ้าของ: ${item.owner}</span>
        <p style="margin-top:6px;"><b>หมวด: </b> <span style="color:var(--accent-color);">${item.category}</span> · <b>ความหายาก: </b>${item.rarity || 'common'}</p>
        <p><b>ATK:</b> ${item.atk} | <b>DEF:</b> ${item.def} | <b>SPD:</b> ${item.spd}</p>
        <p style="font-size:0.78rem; color:var(--text-sub); margin-top:4px; white-space:pre-wrap;">${item.desc}</p>
      </div>
      <div class="card-actions" style="margin-top:10px; display:flex; gap:6px;">
        <button class="btn-edit" style="flex:1;" onclick="openItemEditModal(${realIdx})">แก้ไข</button>
        <button class="btn-del" style="flex:1;" onclick="delItem(${realIdx})">ลบ</button>
      </div>
    </div>`;
  });
  const countEl = document.querySelector('#item-count');
  if (countEl) countEl.textContent = `จำนวนไอเทม: ${allItems.length} · ปักหมุด: ${allItems.filter(i=>i.favorite).length}`;
}

function filterItemCategory(cat) {
  currentItemCategory = cat;
  document.querySelectorAll('#item-category-filters .filter-btn').forEach(btn => btn.classList.remove('active'));
  if (event && event.target) event.target.classList.add('active');
  renderItems(allItems);
}

function filterItems() {
  const q = document.querySelector('#search-item').value.toLowerCase();
  renderItems(allItems.filter(i => i.name.toLowerCase().includes(q) || i.owner.toLowerCase().includes(q)));
}

function toggleItemFavorite(idx) {
  if (allItems[idx]) {
    allItems[idx].favorite = !allItems[idx].favorite;
    localStorage.setItem('custom_items', JSON.stringify(allItems));
    renderItems(allItems);
  }
}
function openItemEditModal(idx) {
  const item = allItems[idx];
  if (!item) return;
  document.querySelector('#edit-item-idx').value = idx;
  document.querySelector('#edit-item-name').value = item.name || '';
  document.querySelector('#edit-item-owner').value = item.owner || '';
  document.querySelector('#edit-item-category').value = item.category || '';
  document.querySelector('#edit-item-img').value = item.imgUrl || '';
  document.querySelector('#edit-item-desc').value = item.desc || '';
  document.querySelector('#edit-item-atk').value = item.atk || 50;
  document.querySelector('#edit-item-atk-num').value = item.atk || 50;
  document.querySelector('#edit-atk-val').innerText = item.atk || 50;
  document.querySelector('#edit-item-def').value = item.def || 50;
  document.querySelector('#edit-item-def-num').value = item.def || 50;
  document.querySelector('#edit-def-val').innerText = item.def || 50;
  document.querySelector('#edit-item-spd').value = item.spd || 50;
  document.querySelector('#edit-item-spd-num').value = item.spd || 50;
  document.querySelector('#edit-spd-val').innerText = item.spd || 50;
  const prev = document.querySelector('#edit-item-img-preview');
  if (prev) { prev.src = item.imgUrl || ''; prev.style.display = item.imgUrl ? 'block' : 'none'; }
  document.querySelector('#modal-item-edit').style.display = 'flex';
}
function closeItemEditModal() { document.querySelector('#modal-item-edit').style.display = 'none'; }
function saveItemEdit() {
  const idx = parseInt(document.querySelector('#edit-item-idx').value);
  if (!allItems[idx]) return;
  allItems[idx].name = document.querySelector('#edit-item-name').value.trim();
  allItems[idx].owner = document.querySelector('#edit-item-owner').value.trim();
  allItems[idx].category = document.querySelector('#edit-item-category').value.trim();
  allItems[idx].imgUrl = document.querySelector('#edit-item-img').value.trim() || allItems[idx].imgUrl;
  allItems[idx].desc = document.querySelector('#edit-item-desc').value.trim();
  allItems[idx].atk = document.querySelector('#edit-item-atk').value;
  allItems[idx].def = document.querySelector('#edit-item-def').value;
  allItems[idx].spd = document.querySelector('#edit-item-spd').value;
  localStorage.setItem('custom_items', JSON.stringify(allItems));
  closeItemEditModal();
  renderItems(allItems);
}
function delItem(index) {
  if (!confirm('ลบไอเทมชิ้นนี้ออกจากคลัง?')) return;
  allItems.splice(index, 1);
  localStorage.setItem('custom_items', JSON.stringify(allItems));
  renderItems(allItems);
}

//=== OC GALLERY / IG FEED ===
async function openOCGalleryModal(charId) {
  currentGalleryCharId = charId;
  const oc = allOCs.find(c => c.charId === charId);
  document.querySelector('#gal-char-id').value = charId;
  document.querySelector('#gal-oc-img').src = oc ? oc.avatarUrl : '';
  document.querySelector('#gal-oc-name').innerText = oc ? oc.name : charId;
  loadOCGalleryImages(charId);
  document.querySelector('#modal-oc-gallery').style.display = 'flex';
}

function closeOCGalleryModal() { document.querySelector('#modal-oc-gallery').style.display = 'none'; }

let galFilter = 'all';

async function loadOCGalleryImages(charId) {
  const storageKey = `ig_gallery_${charId}`;
  let galleryData = [];
  const saved = localStorage.getItem(storageKey);
  if (saved) { try { galleryData = JSON.parse(saved); } catch(e){} }
  
  const container = document.querySelector('#ig-feed-container');
  if (!container) return;
  const filtered = galFilter === 'liked' ? galleryData.filter(x => x.liked) : galleryData;
  const countEl = document.querySelector('#gal-count');
  if (countEl) countEl.textContent = `ทั้งหมด ${galleryData.length} รูป · ถูกใจ ${galleryData.filter(x=>x.liked).length}`;
  container.innerHTML = filtered.length === 0 ? '<p style="color:var(--text-sub); grid-column:1/-1;">ยังไม่มีภาพ</p>' : '';
  filtered.forEach((item, index) => {
    const realIndex = galleryData.indexOf(item);
    const card = document.createElement('div');
    card.className = 'ig-post-card';
    const img = document.createElement('img');
    img.src = item.imageUrl;
    img.alt = item.caption || '';
    const overlay = document.createElement('div');
    overlay.className = 'ig-hover-overlay';
    overlay.innerHTML = `
      <div style="display:flex; gap:10px; align-items:center; justify-content:center;">
        <button title="ถูกใจ" onclick="event.stopPropagation(); toggleGalLike('${charId}', ${realIndex})" style="background:rgba(0,0,0,0.5);border:none;color:#fff;font-size:1.2rem;cursor:pointer;padding:6px 10px;border-radius:8px;">${item.liked ? '♥' : '♡'}</button>
        <button title="ดาวน์โหลด" onclick="event.stopPropagation(); downloadGalImage('${item.imageUrl}')" style="background:rgba(0,0,0,0.5);border:none;color:#fff;font-size:1.2rem;cursor:pointer;padding:6px 10px;border-radius:8px;">⬇</button>
        <button title="ลบ" onclick="event.stopPropagation(); delGalleryImage('${charId}', ${realIndex})" style="background:rgba(0,0,0,0.5);border:none;color:#fff;font-size:1.2rem;cursor:pointer;padding:6px 10px;border-radius:8px;">🗑</button>
      </div>
      ${item.caption ? `<div style="position:absolute; bottom:6px; left:6px; right:6px; color:#fff; font-size:0.75rem; text-shadow:0 1px 3px rgba(0,0,0,0.8); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${item.caption}</div>` : ''}`;
    card.appendChild(img);
    card.appendChild(overlay);
    card.addEventListener('click', () => openGalLightbox(charId, realIndex));
    container.appendChild(card);
  });
}

function setGalFilter(f) { galFilter = f; if (currentGalleryCharId) loadOCGalleryImages(currentGalleryCharId); }

function toggleGalLike(charId, index) {
  const storageKey = `ig_gallery_${charId}`;
  let galleryData = [];
  const saved = localStorage.getItem(storageKey);
  if (saved) { try { galleryData = JSON.parse(saved); } catch(e){} }
  if (!galleryData[index]) return;
  galleryData[index].liked = !galleryData[index].liked;
  localStorage.setItem(storageKey, JSON.stringify(galleryData));
  loadOCGalleryImages(charId);
}

function saveGalCaption(charId, index) {
  const ta = document.querySelector('#gal-lightbox-caption');
  if (!ta) return;
  const storageKey = `ig_gallery_${charId}`;
  let galleryData = [];
  const saved = localStorage.getItem(storageKey);
  if (saved) { try { galleryData = JSON.parse(saved); } catch(e){} }
  if (!galleryData[index]) return;
  galleryData[index].caption = ta.value.trim();
  localStorage.setItem(storageKey, JSON.stringify(galleryData));
  loadOCGalleryImages(charId);
  const modal = document.querySelector('#gal-lightbox-caption')?.closest('.modal');
  if (modal) modal.remove();
}

function downloadGalImage(url) {
  const a = document.createElement('a');
  a.href = url;
  a.download = 'gallery-image';
  a.target = '_blank';
  document.body.appendChild(a);
  a.click();
  a.remove();
}

function openGalLightbox(charId, index) {
  const storageKey = `ig_gallery_${charId}`;
  let galleryData = [];
  const saved = localStorage.getItem(storageKey);
  if (saved) { try { galleryData = JSON.parse(saved); } catch(e){} }
  const item = galleryData[index];
  if (!item) return;
  const oc = (allOCs || []).find(c => (c.charId || c._id) === charId) || {};
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.style.display = 'flex';
  modal.innerHTML = `
    <div class="modal-content" style="max-width:900px; padding:0; overflow:hidden;">
      <div style="display:flex; flex-wrap:wrap;">
        <div style="flex:1 1 60%; min-width:280px; background:#000; display:flex; align-items:center; justify-content:center;">
          <img src="${item.imageUrl}" style="width:100%; max-height:80vh; object-fit:contain;">
        </div>
        <div style="flex:1 1 40%; min-width:260px; padding:16px; display:flex; flex-direction:column; gap:10px;">
          <div style="display:flex; gap:10px; align-items:center; border-bottom:1px solid var(--border-color); padding-bottom:10px;">
            <img src="${oc.avatarUrl || ''}" style="width:36px;height:36px;border-radius:50%;object-fit:cover;border:2px solid var(--accent-color);">
            <strong>${oc.name || charId}</strong>
            <button onclick="this.closest('.modal').remove()" style="margin-left:auto;" class="btn-cancel">✕</button>
          </div>
          <p style="color:var(--text-main); flex:1; overflow-y:auto;">
            <textarea id="gal-lightbox-caption" style="width:100%; min-height:60px; background:var(--bg-input); border:1px solid var(--border-color); border-radius:8px; padding:8px; color:var(--text-main); resize:vertical;">${item.caption || ''}</textarea>
            <button onclick="saveGalCaption('${charId}', ${index})" class="btn-submit" style="margin-top:6px; width:100%;">บันทึกแคปชั่น</button>
          </p>
          <div style="display:flex; gap:8px;">
            <button id="gal-like-btn" onclick="toggleGalLike('${charId}', ${index}); var d=JSON.parse(localStorage.getItem('ig_gallery_${charId}')); document.getElementById('gal-like-btn').textContent = d[${index}].liked?'♥ ถูกใจแล้ว':'♡ ถูกใจ';" class="btn-submit" style="flex:1;">${item.liked ? '♥ ถูกใจแล้ว' : '♡ ถูกใจ'}</button>
            <button onclick="downloadGalImage('${item.imageUrl}')" class="btn-submit" style="flex:1;">⬇ ดาวน์โหลด</button>
            <button onclick="delGalleryImage('${charId}', ${index}); this.closest('.modal').remove();" class="btn-del" style="flex:1;">🗑 ลบ</button>
          </div>
        </div>
      </div>
    </div>`;
  modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });
  document.body.appendChild(modal);
}

const ocGalleryFormEl = document.querySelector('#oc-gallery-form');
if (ocGalleryFormEl) {
  ocGalleryFormEl.addEventListener('submit', (e) => {
    e.preventDefault();
    const charId = document.querySelector('#gal-char-id').value;
    const imageUrl = document.querySelector('#gal-img-url').value.trim();
    const caption = document.querySelector('#gal-caption').value.trim();
    const storageKey = `ig_gallery_${charId}`;
    
    let galleryData = [];
    const saved = localStorage.getItem(storageKey);
    if (saved) { try { galleryData = JSON.parse(saved); } catch(e){} }
    
    galleryData.push({ imageUrl, caption, createdAt: new Date().toLocaleDateString('th-TH') });
    localStorage.setItem(storageKey, JSON.stringify(galleryData));
    
    document.querySelector('#gal-img-url').value = '';
    document.querySelector('#gal-caption').value = '';
    loadOCGalleryImages(charId);
  });
}

function delGalleryImage(charId, index) {
  if (!confirm('ลบรูปภาพนี้ออกจากอัลบั้ม?')) return;
  const storageKey = `ig_gallery_${charId}`;
  let galleryData = [];
  const saved = localStorage.getItem(storageKey);
  if (saved) { try { galleryData = JSON.parse(saved); } catch(e){} }
  galleryData.splice(index, 1);
  localStorage.setItem(storageKey, JSON.stringify(galleryData));
  loadOCGalleryImages(charId);
}

//=== LORE & BLOG MANAGER ===
function loadOCSelectForLore() {
  const selectEl = document.querySelector('#lore-oc-select');
  if (!selectEl) return;
  selectEl.innerHTML = '<option value="">-- เลือกตัวละครที่เกี่ยวข้อง (ถ้ามี) --</option>';
  allOCs.forEach(c => {
    selectEl.innerHTML += `<option value="${c.name}">${c.name} (${c.charId})</option>`;
  });
}

function loadBlogFeed() {
  const saved = localStorage.getItem('custom_scenes');
  if (saved) { try { allScenes = JSON.parse(saved); } catch(e) {} }
  else {
    allScenes = [
      { title: "ร้านกาแฟข้ามมิติ", category: "สถานที่", imageUrl: "https://picsum.photos/600/300", desc: "ร้านกาแฟสไตล์มินิมอลอบอุ่น ให้ความรู้สึกผ่อนคลาย" }
    ];
  }
  renderBlogFeed(allScenes);
}

function renderBlogFeed(data) {
  const feed = document.querySelector('#blog-feed');
  if (!feed) return;
  feed.innerHTML = data.length === 0 ? '<p style="color:var(--text-sub);">ยังไม่มีบันทึก Lore ในระบบ</p>' : '';
  data.forEach((item, index) => {
    const realIdx = allScenes.indexOf(item);
    const starColor = item.favorite ? '#eab308' : '#6b7280';
    feed.innerHTML += `
    <div class="card-section" style="margin-bottom: 15px;">
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <h3 style="border-left:none; padding-left:0; color:var(--accent-color); margin:0;">${item.title} <small style="color:var(--text-sub); font-size:0.8rem;">[${item.category || 'ทั่วไป'}]</small> <span style="cursor:pointer; color:${starColor};" onclick="toggleLoreFavorite(${realIdx})" title="ปักหมุด">&#9733;</span></h3>
        <div style="display:flex; gap:6px;">
          <button class="btn-edit" style="padding:2px 8px; font-size:0.7rem;" onclick="editLore(${realIdx})">แก้ไข</button>
          <button class="btn-del" style="padding:2px 8px; font-size:0.7rem;" onclick="delLore(${realIdx})">ลบบันทึก</button>
        </div>
      </div>
      <p style="color:var(--text-main); font-size:0.9rem; white-space:pre-line; margin-top:8px;">${item.desc}</p>
      ${item.imageUrl ? `<img src="${item.imageUrl}" style="width:100%; max-height:250px; object-fit:cover; border-radius:8px; margin-top:8px;" onclick="openImageModal('${item.imageUrl}')">` : ''}
    </div>`;
  });
}

function handleLoreSubmit(e) {
  e.preventDefault();
  const title = document.querySelector('#lore-title').value.trim();
  const category = document.querySelector('#lore-category').value.trim();
  const imageUrl = document.querySelector('#lore-img').value.trim();
  const desc = document.querySelector('#lore-desc').value.trim();
  const ocName = document.querySelector('#lore-oc-select').value;

  const payload = { title, category: ocName ? `${category || 'ทั่วไป'} (${ocName})` : (category || 'ทั่วไป'), imageUrl, desc, favorite: false, createdAt: new Date().toLocaleString('th-TH') };
  allScenes.push(payload);
  localStorage.setItem('custom_scenes', JSON.stringify(allScenes));
  e.target.reset();
  loadBlogFeed();
  switchTab('blog');
}

function toggleLoreFavorite(idx) {
  if (allScenes[idx]) {
    allScenes[idx].favorite = !allScenes[idx].favorite;
    localStorage.setItem('custom_scenes', JSON.stringify(allScenes));
    renderBlogFeed(allScenes);
  }
}
function editLore(idx) {
  const item = allScenes[idx];
  if (!item) return;
  document.querySelector('#edit-lore-idx').value = idx;
  document.querySelector('#edit-lore-title').value = item.title || '';
  document.querySelector('#edit-lore-category').value = (item.category || '').replace(/\s*\([^)]*\)\s*$/, '');
  document.querySelector('#edit-lore-img').value = item.imageUrl || '';
  document.querySelector('#edit-lore-desc').value = item.desc || '';
  const prev = document.querySelector('#edit-lore-img-preview');
  if (prev) { prev.src = item.imageUrl || ''; prev.style.display = item.imageUrl ? 'block' : 'none'; }
  document.querySelector('#modal-lore-edit').style.display = 'flex';
}
function closeLoreEditModal() { document.querySelector('#modal-lore-edit').style.display = 'none'; }
function saveLoreEdit() {
  const idx = parseInt(document.querySelector('#edit-lore-idx').value);
  if (!allScenes[idx]) return;
  allScenes[idx].title = document.querySelector('#edit-lore-title').value.trim() || allScenes[idx].title;
  const cat = document.querySelector('#edit-lore-category').value.trim();
  if (cat) allScenes[idx].category = cat;
  allScenes[idx].imageUrl = document.querySelector('#edit-lore-img').value.trim() || allScenes[idx].imageUrl;
  allScenes[idx].desc = document.querySelector('#edit-lore-desc').value.trim();
  localStorage.setItem('custom_scenes', JSON.stringify(allScenes));
  closeLoreEditModal();
  renderBlogFeed(allScenes);
}
function delLore(index) {
  if (!confirm('ลบบันทึก Lore นี้?')) return;
  allScenes.splice(index, 1);
  localStorage.setItem('custom_scenes', JSON.stringify(allScenes));
  renderBlogFeed(allScenes);
}

let loreFilter = 'all';
function filterLore() {
  const q = (document.querySelector('#search-lore')?.value || '').toLowerCase();
  let filtered = allScenes.filter(s => (s.title||'').toLowerCase().includes(q) || (s.desc && s.desc.toLowerCase().includes(q)));
  if (loreFilter === 'liked') filtered = filtered.filter(s => s.favorite);
  renderBlogFeed(filtered);
}
function setLoreFilter(f) { loreFilter = f; filterLore(); }

function saveFeaturedQuote() {
  const q = document.querySelector('#feat-quote');
  if (!q) return;
  const text = q.innerText;
  if (currentFeaturedOcId) {
    const oc = allOCs.find(c => (c._id || c.charId) === currentFeaturedOcId);
    if (oc) { oc.featuredQuote = text; localStorage.setItem('custom_ocs', JSON.stringify(allOCs)); }
  }
  localStorage.setItem('featured_quote', text);
}
function renderGalleryWidget(data) {
  const gallery = document.querySelector('#quick-gallery');
  if (!gallery) return;
  gallery.innerHTML = '';
  data.forEach(c => {
    gallery.innerHTML += `<img src="${c.avatarUrl}" title="${c.name}" onclick="openImageModal('${c.avatarUrl}')">`;
  });
}

function openImageModal(imgUrl) {
  document.querySelector('#preview-full-img').src = imgUrl;
  document.querySelector('#modal-image-preview').style.display = 'flex';
}

function closeImageModal() { document.querySelector('#modal-image-preview').style.display = 'none'; }

function renderGalleryHubSelector() {
  const container = document.querySelector('#gallery-hub-selector');
  if (!container) return;
  container.innerHTML = allOCs.length === 0 ? '<p style="color:var(--text-sub);">ยังไม่มีตัวละครในระบบ</p>' : '';
  allOCs.forEach(c => {
    container.innerHTML += `
    <div class="gallery-hub-item" onclick="openOCGalleryModal('${c.charId}')">
      <img src="${c.avatarUrl}">
      <h4>${c.name}</h4>
      <small>${c.role || '-'}</small>
    </div>`;
  });
}

// INITIALIZE APP
window.addEventListener('DOMContentLoaded', async () => {
  loadTheme();
  loadPlaylist();
  loadProfile();
  await loadOCs();
  if (allOCs.length > 0) randomizeFeaturedOC();
  loadBlogFeed();
  loadItems();
  const savedQuote = localStorage.getItem('featured_quote');
  if (savedQuote) document.querySelector('#feat-quote').innerText = savedQuote;
});
