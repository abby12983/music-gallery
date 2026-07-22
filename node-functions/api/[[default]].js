// 未来音乐坊·各校教学风采共享平台 - EdgeOne Cloud Functions API
// 部署位置: /node-functions/api/[[default]].js

import express from 'express';
import COS from 'cos-nodejs-sdk-v5';

const app = express();

// ===== 配置 =====
const COS_BUCKET = process.env.COS_BUCKET || 'music-gallery-uploads';
const COS_REGION = process.env.COS_REGION || 'ap-guangzhou';
const ALLOWED_ORIGINS = '*';

// ===== 中间件 =====
app.use(express.json({ limit: '1mb' }));

// CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', ALLOWED_ORIGINS);
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

// ===== 工具函数 =====
function newId() {
  return 'sub_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
}

function safeFileName(name) {
  // 保留扩展名，清理特殊字符，避免路径注入
  const ext = (name.match(/\.[^.]+$/) || [''])[0];
  const base = name.replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9\u4e00-\u9fa5_-]/g, '_');
  return (base || 'file') + ext;
}

function cosUrl(key) {
  return `https://${COS_BUCKET}.cos.${COS_REGION}.myqcloud.com/${encodeURI(key).replace(/%2F/g, '/')}`;
}

async function readAllSubmissions() {
  const listStr = await globalThis.gallery_kv.get('submissions:list');
  if (!listStr) return [];
  let ids;
  try {
    ids = JSON.parse(listStr);
  } catch (e) {
    return [];
  }
  if (!Array.isArray(ids)) return [];

  const submissions = [];
  // 串行读取，避免大并发触发 KV 限流
  for (const id of ids) {
    const data = await globalThis.gallery_kv.get(`submission:${id}`);
    if (data) {
      try {
        submissions.push(JSON.parse(data));
      } catch (e) {
        // 跳过损坏记录
      }
    }
  }
  return submissions;
}

async function getCosClient() {
  // 每次新建 client，确保获取最新环境变量
  return new COS({
    SecretId: process.env.COS_SECRET_ID,
    SecretKey: process.env.COS_SECRET_KEY,
    Protocol: 'https:',
  });
}

// ===== 路由 =====

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    status: 'ok',
    time: new Date().toISOString(),
    bucket: COS_BUCKET,
    region: COS_REGION,
  });
});

// 获取上传预签名 URL（前端直传 COS）
// POST /api/upload-url  body: { fileName, contentType, kind: 'photo'|'video' }
app.post('/api/upload-url', async (req, res) => {
  try {
    const { fileName, contentType, kind } = req.body || {};
    if (!fileName) {
      return res.status(400).json({ success: false, message: '缺少 fileName' });
    }

    // 限制文件类型
    const allowed = {
      photo: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif'],
      video: ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm'],
    };
    const kindKey = kind === 'video' ? 'video' : 'photo';
    if (contentType && allowed[kindKey].indexOf(contentType) === -1 && !contentType.startsWith(kindKey === 'photo' ? 'image/' : 'video/')) {
      return res.status(400).json({ success: false, message: '不支持的文件类型: ' + contentType });
    }

    // 生成对象 key: photos/2026-07-22/random_filename.jpg
    const date = new Date().toISOString().slice(0, 10);
    const safeName = safeFileName(fileName);
    const key = `${kindKey === 'video' ? 'videos' : 'photos'}/${date}/${Date.now()}_${Math.random().toString(36).slice(2, 8)}_${safeName}`;

    const cos = await getCosClient();

    // 获取预签名上传 URL，有效期 30 分钟
    const urlRes = await cos.getObjectUrl({
      Bucket: COS_BUCKET,
      Region: COS_REGION,
      Key: key,
      Method: 'PUT',
      Expires: 1800,
      Sign: true,
    });

    res.json({
      success: true,
      uploadUrl: urlRes.Url,
      key,
      publicUrl: cosUrl(key),
    });
  } catch (e) {
    console.error('upload-url error:', e);
    res.status(500).json({ success: false, message: e.message || '生成上传链接失败' });
  }
});

// 列出所有提交记录
// GET /api/submissions
app.get('/api/submissions', async (req, res) => {
  try {
    const submissions = await readAllSubmissions();
    // 按 createdAt 倒序
    submissions.sort((a, b) => {
      const da = a.createdAt || '';
      const db = b.createdAt || '';
      if (da > db) return -1;
      if (da < db) return 1;
      return 0;
    });
    res.json({ success: true, submissions, total: submissions.length });
  } catch (e) {
    console.error('list error:', e);
    res.status(500).json({ success: false, message: e.message });
  }
});

// 创建提交记录
// POST /api/submissions
// body: { schoolName, teacherName, category, activityDate, activityDesc, videoLink, photos: [], video: {...} }
app.post('/api/submissions', async (req, res) => {
  try {
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
      photos: Array.isArray(body.photos) ? body.photos.slice(0, 9).map(p => ({
        name: String(p.name || '').slice(0, 200),
        key: String(p.key || '').slice(0, 500),
        url: String(p.url || '').slice(0, 500),
      })) : [],
      video: body.video && typeof body.video === 'object' ? {
        name: String(body.video.name || '').slice(0, 200),
        key: String(body.video.key || '').slice(0, 500),
        url: String(body.video.url || '').slice(0, 500),
      } : null,
      createdAt: new Date().toISOString(),
    };

    // 写入 KV
    await globalThis.gallery_kv.put(`submission:${id}`, JSON.stringify(doc));

    // 更新索引
    const listStr = await globalThis.gallery_kv.get('submissions:list');
    const ids = listStr ? JSON.parse(listStr) : [];
    if (!Array.isArray(ids)) ids = [];
    ids.push(id);
    await globalThis.gallery_kv.put('submissions:list', JSON.stringify(ids));

    res.json({ success: true, data: doc });
  } catch (e) {
    console.error('create error:', e);
    res.status(500).json({ success: false, message: e.message });
  }
});

// 删除提交记录
// POST /api/admin/cleanup  body: { action: 'delete-one', id } 或 { action: 'delete-all' }
app.post('/api/admin/cleanup', async (req, res) => {
  try {
    const { action, id } = req.body || {};

    if (action === 'delete-one') {
      if (!id) return res.status(400).json({ success: false, message: '缺少 id' });
      const data = await globalThis.gallery_kv.get(`submission:${id}`);
      if (!data) return res.json({ success: true, message: '记录不存在', deleted: 0 });
      await globalThis.gallery_kv.delete(`submission:${id}`);
      // 从列表中移除
      const listStr = await globalThis.gallery_kv.get('submissions:list');
      const ids = listStr ? JSON.parse(listStr) : [];
      if (Array.isArray(ids)) {
        const newIds = ids.filter(x => x !== id);
        await globalThis.gallery_kv.put('submissions:list', JSON.stringify(newIds));
      }
      return res.json({ success: true, message: '已删除', deleted: 1 });
    }

    if (action === 'delete-all') {
      const listStr = await globalThis.gallery_kv.get('submissions:list');
      const ids = listStr ? JSON.parse(listStr) : [];
      if (!Array.isArray(ids) || ids.length === 0) {
        return res.json({ success: true, message: '没有数据', deleted: 0 });
      }
      for (const xid of ids) {
        await globalThis.gallery_kv.delete(`submission:${xid}`);
      }
      await globalThis.gallery_kv.delete('submissions:list');
      return res.json({ success: true, message: `已删除 ${ids.length} 条记录`, deleted: ids.length });
    }

    return res.status(400).json({ success: false, message: '未知 action' });
  } catch (e) {
    console.error('cleanup error:', e);
    res.status(500).json({ success: false, message: e.message });
  }
});

// 根路径返回说明
app.get('/', (req, res) => {
  res.json({ success: true, name: '未来音乐坊 API', version: '1.0' });
});

// 404
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Not Found: ' + req.path });
});

export default app;
