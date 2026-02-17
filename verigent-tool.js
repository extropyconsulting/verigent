
### 2. verigent - tool.js(core implementation)

    ```javascript
// verigent-tool.js
// Runs inside OpenClaw / ClawHub agent runtime

const axios = require('axios');

const API_BASE = process.env.VERIGENT_API_URL || 'https://verigent.link/api/v1';
const AGENT_ID = process.env.AGENT_ID; // set by the agent runtime

// Helper: make authenticated, paid request
async function callVerigent(endpoint, method = 'GET', data = null) {
  const headers = {
    'X-Agent-ID': AGENT_ID,
    'Content-Type': 'application/json',
    // x402 payment header is handled by the agent's x402 middleware
    // ClawHub agents should already inject X-PAYMENT automatically
  };

  try {
    const res = await axios({
      method,
      url: `${ API_BASE }${ endpoint } `,
      headers,
      data,
      timeout: 10000,
    });
    return res.data;
  } catch (err) {
    if (err.response?.status === 402) {
      throw new Error('Payment required — check x402 wallet balance');
    }
    if (err.response?.status === 401) {
      throw new Error('Authentication failed — invalid or missing Agent ID');
    }
    throw new Error(`Verigent API error: ${ err.message } `);
  }
}

// ─── Public tools exposed to the agent ────────────────────────────────

module.exports = {
  // 1. High-level reputation check
  async check_reputation(agentId) {
    if (!agentId) throw new Error('agentId is required');
    return callVerigent(`/ check / ${ encodeURIComponent(agentId) } `);
  },

  // 2. Detailed trust score breakdown
  async get_trust_score(agentId) {
    if (!agentId) throw new Error('agentId is required');
    return callVerigent(`/ score / ${ encodeURIComponent(agentId) } `);
  },

  // 3. Report successful interaction
  async report_handshake(success, targetAgentId, metadata = '') {
    if (!targetAgentId) throw new Error('targetAgentId is required');
    return callVerigent('/report', 'POST', {
      type: 'handshake',
      reporterAgentId: AGENT_ID,
      targetAgentId,
      success: !!success,
      metadata: JSON.stringify(metadata),
    });
  },

  // 4. Report violation / slash
  async report_slash(severity, targetAgentId, metadata = '') {
    if (!targetAgentId) throw new Error('targetAgentId is required');
    if (typeof severity !== 'number' || severity < 1 || severity > 10) {
      throw new Error('Severity must be 1–10');
    }
    return callVerigent('/report', 'POST', {
      type: 'slash',
      reporterAgentId: AGENT_ID,
      targetAgentId,
      severity,
      metadata: JSON.stringify(metadata),
    });
  },
};