import type { GameState } from '../game/types';
import { formatCosmeticEffect, getEquippedCosmetics } from '../game/cosmetics';
import {
  getClickMiles,
  getCurrentLandmark,
  getCurrentWorldProgressPercent,
  getIdleMilesPerSecond,
  getNextLandmark,
  getOfflineCapSeconds,
  getWbPerMile
} from '../game/formulas';
import { formatInventoryEffect, getInventoryItemById } from '../game/inventory';
import { getCurrentWorldDefinition, getWorldProgress } from '../game/world';

type StatsPanelProps = { state: GameState };

export const StatsPanel = ({ state }: StatsPanelProps) => {
  const equippedEquipment = state.inventory.equippedEquipmentItemId
    ? getInventoryItemById(state.inventory.equippedEquipmentItemId)
    : undefined;
  const equippedCosmetics = getEquippedCosmetics(state);
  const currentWorld = getCurrentWorldDefinition(state);
  const currentWorldProgress = getWorldProgress(state);

  return (
    <section className="stats-panel">
      <ul>
        <li>Current world: {currentWorld.name}</li>
        <li>Current speed: {getIdleMilesPerSecond(state).toFixed(4)} mi/sec</li>
        <li>Click distance: {getClickMiles(state).toFixed(4)} mi</li>
        <li>WB per mile: {getWbPerMile(state).toFixed(2)}</li>
        <li>Total distance walked: {state.stats.totalDistanceWalked.toFixed(2)} mi</li>
        <li>Total WB earned: {Math.floor(state.totalWalkerBucksEarned).toLocaleString()}</li>
        <li>Current world loop percent: {getCurrentWorldProgressPercent(state).toFixed(2)}%</li>
        <li>Current world loops completed: {currentWorldProgress.loopsCompleted}</li>
        <li>Total Earth loops completed: {state.earthLoopsCompleted}</li>
        <li>Earth prestiges: {state.prestige.earthPrestigeCount}</li>
        <li>Permanent speed bonus: +{Math.round(state.prestige.permanentSpeedBonus * 100)}%</li>
        <li>Permanent WB bonus: +{Math.round(state.prestige.permanentWbBonus * 100)}%</li>
        <li>Current landmark: {getCurrentLandmark(state).name}</li>
        <li>Next landmark: {getNextLandmark(state).name}</li>
        <li>Offline cap: {Math.floor(getOfflineCapSeconds(state) / 60)} minutes</li>
        <li>Total clicks/taps: {state.stats.totalClicks}</li>
        <li>Random events claimed: {state.stats.randomEventsClaimed}</li>
        <li>Upgrades purchased: {state.stats.upgradesPurchased}</li>
        <li>Followers hired: {state.stats.followersHired}</li>
        <li>Items used: {state.stats.itemsUsed}</li>
        <li>Daily play days: {state.dailyPlay.daysPlayed}</li>
        <li>
          Equipped equipment:{' '}
          {equippedEquipment ? `${equippedEquipment.name} (${formatInventoryEffect(equippedEquipment)})` : 'none'}
        </li>
        <li>
          Active cosmetics:{' '}
          {equippedCosmetics.length > 0
            ? equippedCosmetics.map((cosmetic) => `${cosmetic.name} (${formatCosmeticEffect(cosmetic)})`).join(', ')
            : 'none'}
        </li>
      </ul>
    </section>
  );
};
