import { useEffect, useState } from 'react';

import { NailSetGallery } from '../../components/NailSetGallery';
import { PageHeading } from '../../components/UI';
import { api } from '../../lib/api';
import type { NailSet } from '../../types';

export function ClientInspirationPage() {
  const [items, setItems] = useState<NailSet[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<NailSet[]>('/api/v1/inspiration')
      .then(setItems)
      .catch(() => setError('Unable to load inspiration right now.'));
  }, []);

  async function toggleFavorite(item: NailSet) {
    const method = item.favorited ? 'DELETE' : 'POST';
    try {
      const updated = await api<NailSet>(`/api/v1/inspiration/${item.id}/favorite`, { method });
      setItems((current) => current.map((candidate) => candidate.id === updated.id ? updated : candidate));
    } catch {
      setError('Unable to update your saved inspiration.');
    }
  }

  return (
    <div className="client-page inspiration-page">
      <PageHeading eyebrow="FIND YOUR NEXT LOOK" title="Inspiration" />
      <div className="client-inspiration-intro"><span>✿</span><p>Browse full nail sets and save the ones you want to remember.</p></div>
      {error && <div className="form-notice">{error}</div>}
      <NailSetGallery items={items} onFavorite={(item) => void toggleFavorite(item)} />
    </div>
  );
}
