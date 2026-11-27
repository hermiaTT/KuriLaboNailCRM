import { useEffect, useId, useMemo, useState } from 'react';

import { t } from '../lib/i18n';
import { Icon } from './Icons';
import { PaperCard } from './UI';

type ExistingReference = {
  id: string;
  url: string;
};

type ReferencePhotoPickerProps = {
  files: File[];
  onChange: (files: File[]) => void;
  existingImages?: ExistingReference[];
  maxImages?: number;
  disabled?: boolean;
  allowUpload?: boolean;
};

export function ReferencePhotoPicker({
  files,
  onChange,
  existingImages = [],
  maxImages = 6,
  disabled = false,
  allowUpload = true,
}: ReferencePhotoPickerProps) {
  const inputId = useId();
  const [activeImage, setActiveImage] = useState<number | null>(null);
  const remaining = Math.max(0, maxImages - existingImages.length);
  const previews = useMemo(
    () => files.map((file) => ({ file, url: URL.createObjectURL(file) })),
    [files],
  );

  useEffect(() => () => previews.forEach((preview) => URL.revokeObjectURL(preview.url)), [previews]);

  function addFiles(selected: FileList | null) {
    if (!selected) return;
    onChange([...files, ...Array.from(selected)].slice(0, remaining));
  }

  const availableToSelect = Math.max(0, remaining - files.length);
  const full = availableToSelect === 0;

  return <div className="reference-photo-picker">
    {(existingImages.length > 0 || previews.length > 0) && <div className="reference-photo-grid">
      {existingImages.map((image, index) => <div className="reference-photo existing" key={image.id}>
        <button className="reference-photo-open" type="button" onClick={() => setActiveImage(index)} aria-label={t('Open reference photo')}><img src={image.url} alt={t('Reference photo')} /></button>
      </div>)}
      {previews.map((preview) => <div className="reference-photo selected" key={`${preview.file.name}-${preview.file.lastModified}`}>
        <img src={preview.url} alt={t('Selected reference photo')} />
        <button type="button" onClick={() => onChange(files.filter((file) => file !== preview.file))} aria-label={t('Remove photo')}>×</button>
      </div>)}
    </div>}

    {allowUpload && !full && <label className={`reference-photo-trigger${disabled ? ' disabled' : ''}`} htmlFor={inputId}>
      <span className="reference-photo-icon"><Icon name="image" /></span>
      <span><strong>{t('Upload photos')}</strong><small>{t('Reference photos · up to {count}', { count: availableToSelect })}</small></span>
      <input
        id={inputId}
        type="file"
        accept="image/*"
        multiple
        disabled={disabled}
        onChange={(event) => {
          addFiles(event.currentTarget.files);
          event.currentTarget.value = '';
        }}
      />
    </label>}
    {allowUpload && full && <p className="reference-photo-limit">{t('Maximum 6 reference photos')}</p>}
    {activeImage !== null && existingImages[activeImage] && <div className="modal-backdrop reference-viewer-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setActiveImage(null); }}>
      <PaperCard className="reference-viewer">
        <button className="modal-close" type="button" onClick={() => setActiveImage(null)} aria-label={t('Close')}>×</button>
        <div className="reference-viewer-stage">
          {existingImages.length > 1 && <button className="viewer-arrow previous" type="button" onClick={() => setActiveImage((activeImage - 1 + existingImages.length) % existingImages.length)} aria-label={t('Previous photo')}>‹</button>}
          <img src={existingImages[activeImage].url} alt={t('Reference photo {count}', { count: activeImage + 1 })} />
          {existingImages.length > 1 && <button className="viewer-arrow next" type="button" onClick={() => setActiveImage((activeImage + 1) % existingImages.length)} aria-label={t('Next photo')}>›</button>}
        </div>
        <p className="reference-viewer-count">{t('REFERENCE PHOTOS')} · {activeImage + 1}/{existingImages.length}</p>
      </PaperCard>
    </div>}
  </div>;
}
