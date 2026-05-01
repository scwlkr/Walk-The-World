export const FEET_PER_MILE = 5280;

export const milesFromFeet = (feet: number): number => feet / FEET_PER_MILE;

export const formatDistance = (miles: number): string => {
  const safeMiles = Math.max(0, miles);
  const feet = safeMiles * FEET_PER_MILE;

  if (safeMiles < 0.1) {
    return `${Math.round(feet).toLocaleString()} ft`;
  }

  if (safeMiles < 10) {
    return `${safeMiles.toFixed(2)} mi`;
  }

  return `${safeMiles.toLocaleString(undefined, { maximumFractionDigits: 1 })} mi`;
};

export const formatDistanceRate = (milesPerSecond: number): string => {
  const safeRate = Math.max(0, milesPerSecond);
  const feetPerSecond = safeRate * FEET_PER_MILE;

  if (safeRate < 0.1) {
    return `${feetPerSecond.toLocaleString(undefined, {
      maximumFractionDigits: feetPerSecond < 10 ? 1 : 0
    })} ft/s`;
  }

  return `${safeRate.toLocaleString(undefined, { maximumFractionDigits: 2 })} mi/s`;
};

export const formatDistanceProgress = (currentMiles: number, targetMiles: number): string =>
  `${formatDistance(currentMiles)} / ${formatDistance(targetMiles)}`;
