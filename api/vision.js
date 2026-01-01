/**
 * ============================================================
 * [V2.0 预留接口 - 当前版本(V1.0)未启用]
 * 
 * 功能: 千问视觉识别接口 (OCR/图像理解)
 * 状态: 已禁用，保留供V2.0使用
 * 禁用日期: 2025-12-18
 * ============================================================
 */

export default async function handler(req, res) {
  // V1.0: 直接返回501，表示功能未实现
  return res.status(501).json({ 
    error: 'Vision功能在V1.0版本中未启用',
    message: '此接口为V2.0预留功能'
  });
}

/*
// ============ V2.0 原始代码（已注释）============
export default async function handler(req, res) {
  // 设置 CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.QWEN_API_KEY;
  
  if (!apiKey) {
    return res.status(500).json({ error: 'API Key not configured' });
  }

  try {
    const { messages, model } = req.body;
    
    // 使用 qwen-vl-max 多模态模型
    const visionModel = model || 'qwen-vl-max';

    // 千问多模态API地址
    const response = await fetch(
      'https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: visionModel,
          input: { messages }
        })
      }
    );

    const data = await response.json();
    
    if (!response.ok) {
      console.error('DashScope Vision API error:', data);
      return res.status(response.status).json({ error: data });
    }

    // 提取多模态回复
    const text = data.output?.choices?.[0]?.message?.content?.[0]?.text 
              || data.output?.text 
              || '';
    
    return res.status(200).json({ text });

  } catch (error) {
    console.error('Qwen Vision API error:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}
*/
