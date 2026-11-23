import { useEffect, useState } from 'react';

import type { NailSet } from '../types';
import { EmptyState, PaperCard } from './UI';

type NailSetGalleryProps = {
  items: NailSet[];
  onFavorite?: (item: NailSet) => void;
  onManage?: (item: NailSet) => void;
  emptyMessage?: string;
};

export function NailSetGallery({ items, onFavorite, onManage, emptyMessage = 'No inspiration sets yet.' }: NailSetGalleryProps) {
  const [openItem, setOpenItem] = useState<NailSet | null>(null);
  const [activeImage, setActiveImage] = useState(0);

  useEffect(() => {
    setActiveImage(0);
  }, [openItem?.id]);

  useEffect(() => {
    if (openItem) {
      setOpenItem(items.find((item) => item.id === openItem.id) ?? null);
    }
  }, [items, openItem?.id]);

  if (items.length === 0) {
    return <PaperCard><EmptyState>{emptyMessage}</EmptyState></PaperCard>;
  }

  return (
    <>
      <div className="nail-set-grid">
        {items.map((item, index) => (
          <article className={`nail-set-card tone-${index % 3}`} key={item.id}>
            <button className="nail-set-open" onClick={() => setOpenItem(item)} aria-label={`Open ${item.title}`}>
              <img src={item.images[0]?.url} alt={item.title} loading="lazy" />
              {item.images.length > 1 && <span className="image-count">{item.images.length} photos</span>}
            </button>
            {item.images[0] && <a className="paw-download" href={`${item.images[0].url}?download=true`} download aria-label={`Download ${item.title}`}>🐾</a>}
            <div className="nail-set-copy">
              <div><h3>{item.title}</h3><span className="nail-set-actions">{onManage && <button className="manage-set-button" onClick={() => onManage(item)}>Manage</button>}{onFavorite && <button className={`favorite-button ${item.favorited ? 'saved' : ''}`} onClick={() => onFavorite(item)} aria-label={item.favorited ? 'Remove from saved inspiration' : 'Save inspiration'}>{item.favorited ? '♥' : '♡'}</button>}</span></div>
              {item.description && <p>{item.description}</p>}
            </div>
          </article>
        ))}
      </div>

      {openItem && <NailSetViewer item={openItem} activeImage={activeImage} setActiveImage={setActiveImage} onClose={() => setOpenItem(null)} onFavorite={onFavorite} />}
    </>
  );
}

export function NailSetViewer({
  item,
  activeImage,
  setActiveImage,
  onClose,
  onFavorite,
}: {
  item: NailSet;
  activeImage: number;
  setActiveImage: (index: number) => void;
  onClose: () => void;
  onFavorite?: (item: NailSet) => void;
}) {
  const image = item.images[activeImage] ?? item.images[0];
  function move(direction: number) {
    setActiveImage((activeImage + direction + item.images.length) % item.images.length);
  }

  return (
    <div className="modal-backdrop nail-viewer-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <PaperCard className="nail-viewer" >
        <button className="modal-close" onClick={onClose} aria-label="Close">×</button>
        <div className="nail-viewer-stage">
          {item.images.length > 1 && <button className="viewer-arrow previous" onClick={() => move(-1)} aria-label="Previous photo">‹</button>}
          <img src={image?.url} alt={`${item.title} photo ${activeImage + 1}`} />
          {image && <a className="paw-download viewer-download" href={`${image.url}?download=true`} download aria-label="Download this photo">🐾</a>}
          {item.images.length > 1 && <button className="viewer-arrow next" onClick={() => move(1)} aria-label="Next photo">›</button>}
        </div>
        <div className="nail-viewer-info">
          <div><p className="eyebrow">NAIL SET · {activeImage + 1}/{item.images.length}</p><h2>{item.title}</h2>{item.description && <p>{item.description}</p>}</div>
          {onFavorite && <button className={`favorite-button large ${item.favorited ? 'saved' : ''}`} onClick={() => onFavorite(item)}>{item.favorited ? '♥ Saved' : '♡ Save'}</button>}
        </div>
        {item.images.length > 1 && <div className="viewer-thumbnails">{item.images.map((thumbnail, index) => <button className={index === activeImage ? 'active' : ''} key={thumbnail.id} onClick={() => setActiveImage(index)}><img src={thumbnail.url} alt="" /></button>)}</div>}
      </PaperCard>
    </div>
  );
}
