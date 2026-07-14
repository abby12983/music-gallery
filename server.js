const express = require('express');
const https = require('https');
const http = require('http');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// API端点：外部网关为主（内部服务名在CloudRun容器内不可达）
const ENDPOINTS = [
  { host: 'workbuddy-env-d0gfzrd624dd349dc.service.tcloudbase.com', port: 443, proto: 'https', basePath: '/gallery-api/api', desc: 'CloudBase API' },
];
let activeEndpoint = null;

// 统一代理函数：流式转发（不缓冲整个body到内存）
function streamProxy(req, res, endpointIndex) {
  if (endpointIndex >= ENDPOINTS.length) {
    console.error('[proxy] All endpoints failed');
    res.status(502).json({ error: 'API暂时不可用，请稍后重试' });
    return;
  }

  const ep = ENDPOINTS[endpointIndex];
  // 处理多重 /api 前缀
  let apiPath = req.url.replace(/^(\/api)+/, '');
  const targetPath = ep.basePath + apiPath;
  const transport = ep.proto === 'https' ? https : http;

  // 根据请求方法设置不同超时：POST上传给5分钟，GET/其他30秒
  const isUpload = req.method === 'POST' && (
    apiPath.includes('upload') || apiPath.includes('chunk') || apiPath.includes('save')
  );
  const TIMEOUT = isUpload ? 300000 : 30000;

  console.log(`[proxy] ${req.method} ${req.url} -> ${ep.desc}${targetPath} (timeout:${TIMEOUT}ms)`);

  const options = {
    hostname: ep.host,
    port: ep.port,
    path: targetPath,
    method: req.method,
    headers: { ...req.headers },
    rejectUnauthorized: false,
    timeout: TIMEOUT,
  };
  // 重写headers
  delete options.headers.host;
  // content-length保持原始值，因为是流式转发

  try {
    const proxyReq = transport.request(options, (proxyRes) => {
      // 写入响应头
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
      if (proxyRes.headers['content-type']) {
        res.setHeader('Content-Type', proxyRes.headers['content-type']);
      }
      res.status(proxyRes.statusCode);
      // 流式pipe响应体——不缓冲！
      proxyRes.pipe(res);
    });

    proxyReq.on('error', (err) => {
      console.log(`[proxy] ${ep.desc} error: ${err.message}, trying next...`);
      if (!res.headersSent) {
        streamProxy(req, res, endpointIndex + 1);
      }
    });

    proxyReq.on('timeout', () => {
      console.log(`[proxy] ${ep.desc} timeout after ${TIMEOUT}ms`);
      proxyReq.destroy();
      if (!res.headersSent) {
        streamProxy(req, res, endpointIndex + 1);
      }
    });

    // 流式pipe请求体——不缓冲到内存！
    req.pipe(proxyReq);

  } catch(err) {
    console.log(`[proxy] exception: ${err.message}`);
    if (!res.headersSent) {
      streamProxy(req, res, endpointIndex + 1);
    }
  }
}

// CORS preflight — 所有路径
app.options('*', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Max-Age', '86400');
  res.status(204).end();
});

// API proxy — 流式转发
app.use('/api', (req, res) => {
  streamProxy(req, res, 0);
});

// 静态文件
app.use(express.static(path.join(__dirname, 'public')));

// SPA fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Gallery server running on port ${PORT}`);
});
