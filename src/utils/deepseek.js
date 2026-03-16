// DeepSeek API 调用工具

const API_URL = 'https://api.deepseek.com/v1/chat/completions'

// 获取API密钥（优先从外部传入，其次从localStorage获取）
const getApiKey = (externalKey) => {
  return externalKey || localStorage.getItem('deepseek_api_key') || ''
}

/**
 * 设置API密钥并保存到localStorage
 * @param {string} key - API密钥
 */
export const setApiKey = (key) => {
  if (key) {
    localStorage.setItem('deepseek_api_key', key)
  }
}

/**
 * 获取保存的API密钥
 * @returns {string} 保存的密钥
 */
export const getSavedApiKey = () => {
  return localStorage.getItem('deepseek_api_key') || ''
}

/**
 * 调用DeepSeek大模型
 * @param {string} prompt - 用户提示
 * @param {string} model - 模型名称，默认deepseek-chat
 * @param {string} apiKey - API密钥（可选，不传则使用保存的密钥）
 * @returns {Promise<string>} 模型回复
 */
export const callDeepSeek = async (prompt, model = 'deepseek-chat', apiKey = '') => {
  const API_KEY = apiKey || getApiKey(apiKey)

  if (!API_KEY) {
    throw new Error('请先填写DeepSeek API密钥')
  }

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: model,
        messages: [
          {
            role: 'system',
            content: '你是一个专业的V2X车联网专家，擅长解答关于车联网通信、交通安全、智能驾驶等问题。'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2048
      })
    })

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('API密钥无效，请检查密钥是否正确')
      }
      throw new Error(`API请求失败: ${response.status}`)
    }

    const data = await response.json()
    return data.choices[0].message.content
  } catch (error) {
    console.error('DeepSeek API调用失败:', error)
    throw error
  }
}

/**
 * 流式调用DeepSeek大模型
 * @param {string} prompt - 用户提示
 * @param {function} onChunk - 流式响应回调
 * @param {string} model - 模型名称
 */
export const callDeepSeekStream = async (prompt, onChunk, model = 'deepseek-chat') => {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: model,
        messages: [
          {
            role: 'system',
            content: '你是一个专业的V2X车联网专家，擅长解答关于车联网通信、交通安全、智能驾驶等问题。'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2048,
        stream: true
      })
    })

    if (!response.ok) {
      throw new Error(`API请求失败: ${response.status}`)
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6)
          if (data === '[DONE]') return

          try {
            const json = JSON.parse(data)
            const content = json.choices[0]?.delta?.content
            if (content) {
              onChunk(content)
            }
          } catch (e) {
            // 忽略解析错误
          }
        }
      }
    }
  } catch (error) {
    console.error('DeepSeek API流式调用失败:', error)
    throw error
  }
}

export default {
  callDeepSeek,
  callDeepSeekStream
}
