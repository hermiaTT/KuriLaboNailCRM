import { View } from 'react-native';

import { AppScreen } from '../../components/ui/AppScreen';
import { ImageCard } from '../../components/ui/ImageCard';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { collectionItems } from '../../data/placeholders';

export default function CollectionScreen() {
  return (
    <AppScreen>
      <SectionHeader eyebrow="Your archive" title="Nail collection" action="Newest" />
      <View>
        {collectionItems.map((item) => (
          <ImageCard
            key={item.id}
            imageUrl={item.imageUrl}
            subtitle={item.description}
            tags={item.tags}
            title={item.date}
            style={{ marginBottom: 18 }}
          />
        ))}
      </View>
    </AppScreen>
  );
}
