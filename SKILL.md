# Verigent — Agent Trust & Reputation Skill

**ID:** verigent  
**Name:** Verigent  
**Version:** 0.1.0  
**Author:** your-github-username-or-handle  
**Description:**  
Automatically checks counterparty agent reputation before risky actions (delegation, payments, data sharing).  
Uses Verigent API to get trust scores, risk levels, and recommendations.  
Pays $0.002 USDC per check via x402 protocol.  
Reports successful handshakes and detected violations back to the graph.

**Capabilities:**
- `check_reputation(agentId)` → returns score, risk, recommendation
- `get_trust_score(agentId)` → detailed breakdown
- `report_handshake(success, targetAgentId)` → logs outcome
- `report_slash(severity, targetAgentId)` → submits violation

**Dependencies:**
- x402 wallet configured (via Skyfire / Privy)
- Base Mainnet USDC balance

**Installation:**
```bash
npx clawhub@latest install verigent