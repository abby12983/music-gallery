// 未来音乐坊 API - EdgeOne Node Function (ESM)
// 路径: /node-functions/api/index.js

import express from 'express';
import COS from 'cos-nodejs-sdk-v5';

const app = express();
const COS_BUCKET = process.env.COS_BUCKET || 'music-gallery-uploads';
const COS_REGION = process.env.COS_REGION || 'ap-guangzhou';

// CORS 中间件
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();
  next();
});
app.use(express.json({ limit: '1mb' }));

function newId() {
  return 'sub_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
}

function safeFileName(name) {
  const ext = (name.match(/\.[^.]+$/) || [''])[0];
  const base = name.replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9\u4e00-\u9fa5_-]/g, '_');
  return (base || 'file') + ext;
}

function cosUrl(key) {
  return `https://${COS_BUCKET}.cos.${COS_REGION}.myqcloud.com/${encodeURI(key)}`;
}

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ success: true, status: 'ok', time: new Date().toISOString(), bucket: COS_BUCKET });
});

// 上传预签名 URL
app.post('/api/upload-url', async (req, res) => {
  try {
    const { fileName, contentType, kind } = req.body || {};
    if (!fileName) return res.status(400).json({ success: false, message: '缺少 fileName' });

    const kindKey = kind === 'video' ? 'video' : 'photo';
    const date = new Date().toISOString().slice(0, 10);
    const safeName = safeFileName(fileName);
    const key = `${kindKey === 'video' ? 'videos' : 'photos'}/${date}/${Date.now()}_${Math.random().toString(36).slice(2, 8)}_${safeName}`;

    const cos = new COS({
      SecretId: process.env.COS_SECRET_ID,
      SecretKey: process.env.COS_SECRET_KEY,
      Protocol: 'https:',
    });

    const urlRes = await cos.getObjectUrl({
      Bucket: COS_BUCKET,
      Region: COS_REGION,
      Key: key,
      Method: 'PUT',
      Expires: 1800,
      Sign: true,
    });

    res.json({ success: true, uploadUrl: urlRes.Url, key, publicUrl: cosUrl(key) });
  } catch (e) {
    console.error('upload-url error:', e);
    res.status(500).json({ success: false, message: e.message || '生成上传链接失败' });
  }
});

// 列出所有提交记录
app.get('/api/submissions', async (req, res) => {
  try {
    const kv = globalThis.gallery_kv;
    if (!kv) return res.json({ success: true, submissions: [], total: 0 });

    const listStr = await kv.get('submissions:list');
    if (!listStr) return res.json({ success: true, submissions: [], total: 0 });

    let ids;
    try { ids = JSON.parse(listStr); } catch (e) { ids = []; }
    if (!Array.isArray(ids)) ids = [];

    const submissions = [];
    for (const id of ids) {
      try {
        const data = await kv.get(`submission:${id}`);
        if (data) submissions.push(JSON.parse(data));
      } catch (e) {}
    }
    submissions.sort((a, b) => {
      const da = a.createdAt || ''; const db = b.createdAt || '';
      return da > db ? -1 : da < db ? 1 : 0;
    });
    res.json({ success: true, submissions, total: submissions.length });
  } catch (e) {
    console.error('list error:', e);
    res.status(500).json({ success: false, message: e.message });
  }
});

// 创建提交记录
app.post('/api/submissions', async (req, res) => {
  try {
    const kv = globalThis.gallery_kv;
    if (!kv) return res.status(500).json({ success: false, message: 'KV 存储未绑定' });

    const body = req.body || {};
    const id = newId();
    const doc = {
      id,
      schoolName: String(body.schoolName || '').slice(0, 200),
      teacherName: String(body.teacherName || '').slice(0, 100),
      category: String(body.category || '').slice(0, 50),
      activityDate: String(body.activityDate || '').slice(0, 30),
      activityDesc: String(body.activityDesc || '').slice(0, 1000),
      videoLink: String(body.videoLink || '').slice(0, 500),
      photos: Array.isArray(body.photos) ? body.photos.slice(0, 9) : [],
      video: body.video || null,
      createdAt: new Date().toISOString(),
    };

    await kv.put(`submission:${id}`, JSON.stringify(doc));
    const listStr = await kv.get('submissions:list');
    const ids = listStr ? JSON.parse(listStr) : [];
    if (!Array.isArray(ids)) ids = [];
    ids.push(id);
    await kv.put('submissions:list', JSON.stringify(ids));
    res.json({ success: true, data: doc });
  } catch (e) {
    console.error('create error:', e);
    res.status(500).json({ success: false, message: e.message });
  }
});

// 删除
app.post('/api/admin/cleanup', async (req, res) => {
  try {
    const kv = globalThis.gallery_kv;
    if (!kv) return res.json({ success: false, message: 'KV 未绑定' });

    const { action, id } = req.body || {};
    if (action === 'delete-one') {
      if (!id) return res.status(400).json({ success: false, message: '缺少 id' });
      await kv.delete(`submission:${id}`);
      const listStr = await kv.get('submissions:list');
      const ids = listStr ? JSON.parse(listStr) : [];
      if (Array.isArray(ids)) {
        await kv.put('submissions:list', JSON.stringify(ids.filter(x => x !== id)));
      }
      return res.json({ success: true, message: '已删除' });
    }
    if (action === 'delete-all') {
      const listStr = await kv.get('submissions:list');
      const ids = listStr ? JSON.parse(listStr) : [];
      if (Array.isArray(ids)) {
        for (const xid of ids) await kv.delete(`submission:${xid}`);
      }
      await kv.delete('submissions:list');
      return res.json({ success: true, message: `已删除 ${ids.length} 条记录` });
    }
    return res.status(400).json({ success: false, message: '未知 action' });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

export default app;
