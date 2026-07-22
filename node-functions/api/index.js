// 最小化测试 - 看看 Cloud Function 能不能部署
// 路径: /node-functions/api/index.js

export default function onRequest(context) {
  return new Response(JSON.stringify({
    success: true,
    message: 'Hello from EdgeOne Cloud Function!',
    time: new Date().toISOString()
  }), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  });
}
