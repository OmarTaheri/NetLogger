import { computeBotScore, computeHumanScore } from './bot-detection.service.js';
import { checkBrowserAuthenticity, computeUniquenessScore } from './fingerprint-analysis.service.js';
import { detectVPN, checkLocationConsistency } from './geo-analysis.service.js';
import { computeRiskFlags, computePrivacyScore, computeDeviceTier } from './risk.service.js';
import { buildUserProfile } from './profile.service.js';

export function analyzeVisitor(visitor: Record<string, any>): Record<string, any> {
  const botScore = computeBotScore(visitor);
  const vpnDetected = detectVPN(visitor);
  const privacyScore = computePrivacyScore(visitor);
  const deviceTier = computeDeviceTier(visitor);
  const browserAuthenticity = checkBrowserAuthenticity(visitor);
  const uniquenessScore = computeUniquenessScore(visitor);
  const locationConsistency = checkLocationConsistency(visitor);
  const humanScore = computeHumanScore(visitor);
  const userProfile = buildUserProfile(visitor);
  const riskFlags = computeRiskFlags(visitor, botScore, vpnDetected);

  return {
    botScore,
    vpnDetected,
    privacyScore,
    deviceTier,
    browserAuthenticity,
    uniquenessScore,
    locationConsistency,
    humanScore,
    userProfile: JSON.stringify(userProfile),
    riskFlags: JSON.stringify(riskFlags),
  };
}
