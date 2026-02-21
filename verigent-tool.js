// verigent-tool.js – Fixed & production-ready
const axios = require('axios');

const API_BASE = process.env.VERIGENT_API_URL || 'https://verigent.link/api/v1';
const AGENT_ID = process.env.AGENT_ID; // injected by ClawHub runtime

async function callVerigent(endpoint, method = 'GET', data = null) {
  const headers = {
    'X-Agent-ID': AGENT_ID,
    'Content-Type': 'application/json',
    // x402 payment is handled automatically by ClawHub agent runtime
  };

  try {
    const res = await axios({
      method,
      url: `${API_BASE}${endpoint}`,
      headers,
      data,
      timeout: 10000,
    });
    return res.data;
  } catch (err) {
    if (err.response?.status === 402) {
      throw new Error('Payment required – 100 free checks used. Top up x402 wallet (Skyfire/Privy).');
    }
    if (err.response?.status === 400) {
      throw new Error('Missing or invalid AgentID');
    }
    throw new Error(`Verigent API error: ${err.message}`);
  }
}

module.exports = {
  // Main tool agents will call most often
  async get_trust_score(agentId) {
    if (!agentId) throw new Error('agentId is required');
    return callVerigent(`/score/${encodeURIComponent(agentId)}`);
  },

  async check_reputation(agentId) {
    return this.get_trust_score(agentId); // alias for simplicity
  },

  // Report back to graph (builds your reputation flywheel)
  async report_handshake(success, targetAgentId, metadata = {}) {
    if (!targetAgentId) throw new Error('targetAgentId required');
    return callVerigent('/report', 'POST', {
      type: 'handshake',
      reporterAgentId: AGENT_ID,
      targetAgentId,
      success: !!success,
      metadata: JSON.stringify(metadata),
    });
  },

  async report_slash(severity, targetAgentId, metadata = {}) {
    if (!targetAgentId) throw new Error('targetAgentId required');
    if (typeof severity !== 'number' || severity < 1 || severity > 10) {
      throw new Error('Severity 1–10 only');
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
