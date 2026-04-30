import type { CSSProperties } from 'react';
import type { EncounterSprite as EncounterSpriteDefinition } from '../game/encounterPresentation';

type EncounterSpriteProps = {
  sprite: EncounterSpriteDefinition;
  className?: string;
};

const tileSize = 16;
const tileMargin = 1;
const spriteScale = 3;
const sheetWidth = 918;
const sheetHeight = 203;

export const EncounterSprite = ({ sprite, className }: EncounterSpriteProps) => {
  const style: CSSProperties = {
    backgroundImage: `url("${sprite.sheet}")`,
    backgroundPosition: `-${sprite.col * (tileSize + tileMargin) * spriteScale}px -${sprite.row * (tileSize + tileMargin) * spriteScale}px`,
    backgroundSize: `${sheetWidth * spriteScale}px ${sheetHeight * spriteScale}px`
  };

  return (
    <span
      className={['encounter-sprite', className].filter(Boolean).join(' ')}
      role="img"
      aria-label={sprite.label}
      style={style}
    />
  );
};
