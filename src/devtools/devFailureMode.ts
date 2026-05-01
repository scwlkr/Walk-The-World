export type DevFailureMode = {
  latencyMs: 0 | 250 | 1000 | 5000;
  nextPurchaseFails: boolean;
  nextWalletRefreshFails: boolean;
  nextInventoryRefreshFails: boolean;
  duplicateNextPurchase: boolean;
};
let mode: DevFailureMode = { latencyMs: 0, nextPurchaseFails: false, nextWalletRefreshFails: false, nextInventoryRefreshFails: false, duplicateNextPurchase: false };
export const getFailureMode = (): DevFailureMode => mode;
export const setFailureMode = (next: Partial<DevFailureMode>): DevFailureMode => (mode = { ...mode, ...next });
export const clearFailureMode = (): DevFailureMode => (mode = { latencyMs: 0, nextPurchaseFails: false, nextWalletRefreshFails: false, nextInventoryRefreshFails: false, duplicateNextPurchase: false });
