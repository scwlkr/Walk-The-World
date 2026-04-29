import { useEffect, useState } from 'react';
import { getItemFallbackIcon, getItemImageSrc, type ItemImageCandidate } from '../game/itemImages';

type ItemArtworkProps = {
  item: ItemImageCandidate;
  className?: string;
};

export const ItemArtwork = ({ item, className }: ItemArtworkProps) => {
  const src = getItemImageSrc(item);
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const imageSrc = src && failedSrc !== src ? src : null;

  useEffect(() => {
    setFailedSrc(null);
  }, [src]);

  return (
    <div className={['item-art', className].filter(Boolean).join(' ')} aria-hidden="true">
      {imageSrc ? (
        <img
          src={imageSrc}
          alt=""
          loading="lazy"
          decoding="async"
          onError={() => setFailedSrc(imageSrc)}
        />
      ) : (
        <span>{getItemFallbackIcon(item)}</span>
      )}
    </div>
  );
};
