import { AppScreen } from '../../components/ui/AppScreen';
import { EmptyState } from '../../components/ui/EmptyState';
import { SectionHeader } from '../../components/ui/SectionHeader';

export default function AdminInspirationScreen() {
  return (
    <AppScreen>
      <SectionHeader eyebrow="Gallery" title="Inspiration management" />
      <EmptyState
        title="Gallery tools later"
        message="This placeholder keeps the admin route ready for upload, tags, and public/private controls."
      />
    </AppScreen>
  );
}
