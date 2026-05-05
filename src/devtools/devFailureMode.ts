export type DevFailureMode = {
  latencyMs: 0 | 250 | 1000 | 5000;
  nextPurchaseFails: boolean;
  nextWalletRefreshFails: boolean;
  nextInventoryRefreshFails: boolean;
  duplicateNextPurchase: boolean;
};

export const DEFAULT_DEV_FAILURE_MODE: DevFailureMode = {
  latencyMs: 0,
  nextPurchaseFails: false,
  nextWalletRefreshFails: false,
  nextInventoryRefreshFails: false,
  duplicateNextPurchase: false
};

let mode: DevFailureMode = { ...DEFAULT_DEV_FAILURE_MODE };
export const getFailureMode = (): DevFailureMode => mode;
export const setFailureMode = (next: Partial<DevFailureMode>): DevFailureMode => (mode = { ...mode, ...next });
export const clearFailureMode = (): DevFailureMode => (mode = { ...DEFAULT_DEV_FAILURE_MODE });
