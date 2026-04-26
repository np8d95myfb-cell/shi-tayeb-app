const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { readJson, writeJson } = require('./services/db');
const { generateVideo } = require('./services/aiProvider');

const app = express();
const PORT = process.env.PORT || 3000;
const dataDir = path.join(__dirname, 'data');
const files = {
  users: path.join(dataDir, 'users.json'),
  history: path.join(dataDir, 'history.json'),
  library: path.join(dataDir, 'library.json'),
  ads: path.join(dataDir, 'ads.json'),
  subscriptions: path.join(dataDir, 'subscriptions.json')
};

app.use(cors());
app.use(express.json({ limit: '15mb' }));

function paymentLinkForPlan(plan) {
  const custom = process.env.PAYPAL_PAYMENT_LINK;
  if (custom) return custom;
  const email = process.env.PAYPAL_RECEIVER_EMAIL || 'Loren.musa11@gmail.com';
  const subject = encodeURIComponent(`طلب اشتراك ${plan} - Shi Tayeb`);
  const body = encodeURIComponent(`مرحباً، أريد تفعيل خطة ${plan} في تطبيق Shi Tayeb.\nالبريد: `);
  return `mailto:${email}?subject=${subject}&body=${body}`;
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, app: 'Shi Tayeb', mode: 'local-full' });
});

app.get('/api/about', (_req, res) => {
  res.json({
    title: 'من نحن',
    description: 'شي طيب منصة تساعدك على صنع فيديو مثالي لوصفتك أو وصفة ستك أو أمك بكبسة زر. ارفعي صورة، اكتبي الفكرة، وخذي فيديو جاهز ومناسب للنشر أو الإعلان.',
    values: ['سهولة بدون تدريب', 'ستايلات جاهزة', 'فيديوهات إعلانية', 'نتيجة سريعة وواضحة']
  });
});

app.post('/api/register', (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'الرجاء تعبئة كل الحقول.' });
  const users = readJson(files.users, []);
  const exists = users.find((u) => u.email.toLowerCase() === String(email).toLowerCase());
  if (exists) return res.status(400).json({ error: 'هذا البريد مستخدم من قبل.' });
  const user = { id: Date.now(), name, email, password, plan: 'Free', createdAt: new Date().toISOString().slice(0,10) };
  users.unshift(user);
  writeJson(files.users, users);
  res.json({ message: 'تم إنشاء الحساب بنجاح.', user: { id: user.id, name: user.name, email: user.email, plan: user.plan } });
});

app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  const users = readJson(files.users, []);
  const user = users.find((u) => u.email.toLowerCase() === String(email).toLowerCase() && u.password === password);
  if (!user) return res.status(401).json({ error: 'البريد أو كلمة المرور غير صحيحة.' });
  res.json({ message: 'تم تسجيل الدخول.', user: { id: user.id, name: user.name, email: user.email, plan: user.plan } });
});

app.get('/api/library', (_req, res) => {
  res.json(readJson(files.library, []));
});

app.get('/api/ads', (_req, res) => {
  res.json(readJson(files.ads, []));
});

app.get('/api/history', (_req, res) => {
  res.json(readJson(files.history, []));
});

app.post('/api/generate', (req, res) => {
  const { imageUrl, prompt, style, duration, category } = req.body;
  if (!imageUrl || !prompt) return res.status(400).json({ error: 'الصورة والوصف مطلوبان.' });
  const result = generateVideo({ imageUrl, prompt, style, duration, category });
  const history = readJson(files.history, []);
  const item = {
    id: Date.now(),
    title: `${style || category || 'وصفة'} جديد`,
    prompt,
    style: style || 'عام',
    duration: duration || '10 ثواني',
    category: category || 'عام',
    imageUrl,
    videoUrl: result.videoUrl,
    createdAt: new Date().toLocaleString('ar-EG')
  };
  history.unshift(item);
  writeJson(files.history, history);
  res.json({ ...result, item });
});

app.post('/api/subscribe', (req, res) => {
  const { name, email, plan } = req.body;
  const chosenPlan = plan || 'Pro';
  const subscriptions = readJson(files.subscriptions, []);
  const entry = { id: Date.now(), name: name || 'عميل', email: email || '', plan: chosenPlan, createdAt: new Date().toISOString() };
  subscriptions.unshift(entry);
  writeJson(files.subscriptions, subscriptions);
  res.json({
    message: 'تم تجهيز طلب الاشتراك.',
    subscription: entry,
    paymentUrl: paymentLinkForPlan(chosenPlan),
    paymentMode: process.env.PAYPAL_PAYMENT_LINK ? 'paypal-link' : 'email-request'
  });
});

app.get('/api/config', (_req, res) => {
  res.json({
    appName: process.env.APP_NAME || 'Shi Tayeb',
    paypalReceiverEmail: process.env.PAYPAL_RECEIVER_EMAIL || 'Loren.musa11@gmail.com',
    hasDirectPaypalLink: Boolean(process.env.PAYPAL_PAYMENT_LINK)
  });
});

app.listen(PORT, () => {
  console.log(`Shi Tayeb full app backend running on http://localhost:${PORT}`);
});
