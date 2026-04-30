const API = 'http://localhost:3000/api';
const state = {
  uploadedImageData: null,
  selectedCategory: 'وصفات ستي',
  currentUser: null
};

const $ = (id) => document.getElementById(id);

async function callApi(path, options = {}) {
  const response = await fetch(`${API}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'حدث خطأ غير متوقع');
  return data;
}

function setStatus(id, text) {
  $(id).textContent = text;
}

function renderLibrary(items) {
  const root = $('libraryList');
  root.innerHTML = '';
  items.forEach((item) => {
    const card = document.createElement('div');
    card.className = 'mini-card';
    card.innerHTML = `
      <img src="${item.cover}" alt="${item.title}">
      <h4>${item.title}</h4>
      <p class="muted">${item.description}</p>
      <div class="actions"><button class="btn btn-secondary use-library" data-title="${item.title}" data-prompt="${item.promptHint}">استخدام هذا الستايل</button></div>
    `;
    root.appendChild(card);
  });

  document.querySelectorAll('.use-library').forEach((btn) => {
    btn.onclick = () => {
      $('style').value = btn.dataset.title;
      $('prompt').value = btn.dataset.prompt;
      state.selectedCategory = btn.dataset.title;
      setStatus('generateStatus', `تم اختيار: ${btn.dataset.title}`);
      document.querySelectorAll('.chip').forEach((chip) => chip.classList.toggle('active', chip.dataset.category === btn.dataset.title));
    };
  });
}

function renderAds(items) {
  const root = $('adsList');
  root.innerHTML = '';
  items.forEach((item) => {
    const card = document.createElement('div');
    card.className = 'ad-item';
    card.innerHTML = `
      <div>
        <strong>${item.title}</strong>
        <div class="muted">${item.category}</div>
        <div class="muted">${item.description}</div>
      </div>
      <video controls poster="${item.poster}">
        <source src="${item.videoUrl}" type="video/mp4">
      </video>
    `;
    root.appendChild(card);
  });
}

function renderHistory(items) {
  const root = $('historyList');
  root.innerHTML = '';
  const list = items.slice(0, 6);
  if (!list.length) {
    root.innerHTML = '<div class="history-item">لا يوجد سجل بعد.</div>';
    return;
  }
  list.forEach((item) => {
    const card = document.createElement('div');
    card.className = 'history-item';
    card.innerHTML = `
      <img src="${item.imageUrl}" alt="${item.title}">
      <strong>${item.title || item.style}</strong>
      <div class="muted">${item.prompt}</div>
      <div class="muted">${item.createdAt}</div>
    `;
    root.appendChild(card);
  });
}

async function loadInitialData() {
  try {
    const [library, ads, history, about] = await Promise.all([
      callApi('/library'),
      callApi('/ads'),
      callApi('/history'),
      callApi('/about')
    ]);
    renderLibrary(library);
    renderAds(ads);
    renderHistory(history);
    $('aboutText').textContent = about.description;
    $('aboutValues').innerHTML = about.values.map((v) => `<span class="tag">${v}</span>`).join('');
  } catch (error) {
    console.error(error);
    setStatus('generateStatus', 'شغّلي الخادم الخلفي أولاً من مجلد backend حتى تعمل كل الوظائف.');
  }
}

$('fileInput').addEventListener('change', (event) => {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    state.uploadedImageData = reader.result;
    $('previewImage').src = reader.result;
    $('heroPreviewImage').src = reader.result;
    setStatus('generateStatus', 'تم تحميل الصورة بنجاح.');
  };
  reader.readAsDataURL(file);
});

$('imageUrl').addEventListener('input', (e) => {
  const value = e.target.value.trim();
  if (value) {
    $('previewImage').src = value;
    $('heroPreviewImage').src = value;
  }
});

document.querySelectorAll('.chip').forEach((chip) => {
  chip.addEventListener('click', () => {
    document.querySelectorAll('.chip').forEach((c) => c.classList.remove('active'));
    chip.classList.add('active');
    state.selectedCategory = chip.dataset.category;
    $('style').value = chip.dataset.category;
    if (chip.dataset.category === 'وصفات ستي') {
      $('prompt').value = 'وصفة ستي، جو بيت دافئ، إضاءة حنونة، تقديم نهائي جميل';
    } else if (chip.dataset.category === 'مطبخ فاخر') {
      $('prompt').value = 'مطبخ أبيض فاخر، تصوير قريب، إضاءة ناعمة، حركة بطيئة';
    } else {
      $('prompt').value = 'وصفة صحية، ألوان منعشة، مكونات خفيفة، تصوير نظيف';
    }
  });
});

$('generateBtn').addEventListener('click', async () => {
  try {
    setStatus('generateStatus', 'جاري إنشاء الفيديو...');
    const payload = {
      imageUrl: state.uploadedImageData || $('imageUrl').value.trim(),
      prompt: $('prompt').value.trim(),
      style: $('style').value,
      duration: $('duration').value,
      category: state.selectedCategory
    };
    const data = await callApi('/generate', { method: 'POST', body: JSON.stringify(payload) });
    $('previewVideo').src = data.videoUrl;
    $('heroPreviewVideo').src = data.videoUrl;
    $('previewVideo').poster = data.poster || payload.imageUrl;
    $('heroPreviewVideo').poster = data.poster || payload.imageUrl;
    $('previewVideo').load();
    $('heroPreviewVideo').load();
    setStatus('generateStatus', data.message);
    const history = await callApi('/history');
    renderHistory(history);
  } catch (error) {
    setStatus('generateStatus', error.message);
  }
});

$('loadLibraryBtn').addEventListener('click', loadInitialData);

$('loginBtn').addEventListener('click', async () => {
  try {
    const data = await callApi('/login', {
      method: 'POST',
      body: JSON.stringify({
        email: $('loginEmail').value.trim(),
        password: $('loginPassword').value
      })
    });
    state.currentUser = data.user;
    setStatus('authStatus', `مرحباً ${data.user.name} — خطتك الحالية: ${data.user.plan}`);
  } catch (error) {
    setStatus('authStatus', error.message);
  }
});

$('registerBtn').addEventListener('click', async () => {
  try {
    const data = await callApi('/register', {
      method: 'POST',
      body: JSON.stringify({
        name: $('registerName').value.trim(),
        email: $('registerEmail').value.trim(),
        password: $('registerPassword').value
      })
    });
    setStatus('authStatus', `${data.message} — يمكنك الآن تسجيل الدخول.`);
  } catch (error) {
    setStatus('authStatus', error.message);
  }
});

document.querySelectorAll('.subscribeBtn').forEach((btn) => {
  btn.addEventListener('click', async () => {
    try {
      const plan = btn.dataset.plan;
      const name = state.currentUser?.name || $('registerName').value.trim() || 'عميل جديد';
      const email = state.currentUser?.email || $('loginEmail').value.trim() || $('registerEmail').value.trim();
      const data = await callApi('/subscribe', {
        method: 'POST',
        body: JSON.stringify({ name, email, plan })
      });
      setStatus('paymentStatus', `${data.message} — سيتم فتح وسيلة الدفع الآن.`);
      window.open(data.paymentUrl, '_blank');
    } catch (error) {
      setStatus('paymentStatus', error.message);
    }
  });
});

loadInitialData();
