import { importSave } from '../game/save';
import type { GameState } from '../game/types';
import { getSupabaseClient } from './authClient';

type CloudSaveRow = {
  save_version: number;
  save_payload: GameState;
  updated_at: string;
};

export type CloudSaveSnapshot = {
  state: GameState;
  saveVersion: number;
  updatedAt: number;
};

const requireSupabaseClient = () => {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase account sync is not configured.');
  return client;
};

const parseUpdatedAt = (updatedAt: string): number => {
  const parsed = Date.parse(updatedAt);
  return Number.isFinite(parsed) ? parsed : Date.now();
};

const gameSaveTable = () => requireSupabaseClient().schema('walk_the_world').from('game_saves');

export const loadCloudSave = async (userId: string): Promise<CloudSaveSnapshot | null> => {
  const { data, error } = await gameSaveTable()
    .select('save_version, save_payload, updated_at')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;

  const row = data as CloudSaveRow;
  return {
    state: importSave(JSON.stringify(row.save_payload)),
    saveVersion: row.save_version,
    updatedAt: parseUpdatedAt(row.updated_at)
  };
};

export const uploadCloudSave = async (userId: string, state: GameState): Promise<CloudSaveSnapshot> => {
  const updatedAt = state.lastSavedAt || Date.now();
  const { data, error } = await gameSaveTable()
    .upsert(
      {
        user_id: userId,
        save_version: state.saveVersion,
        save_payload: state,
        updated_at: new Date(updatedAt).toISOString()
      },
      { onConflict: 'user_id' }
    )
    .select('save_version, save_payload, updated_at')
    .single();

  if (error) throw new Error(error.message);

  const row = data as CloudSaveRow;
  return {
    state: importSave(JSON.stringify(row.save_payload)),
    saveVersion: row.save_version,
    updatedAt: parseUpdatedAt(row.updated_at)
  };
};
