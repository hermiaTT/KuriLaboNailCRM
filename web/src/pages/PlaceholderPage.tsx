import { PageHeading, PaperCard } from '../components/UI';

export function PlaceholderPage({ type }: { type: 'schedule' | 'inspiration' }) {
  const schedule = type === 'schedule';
  return <div className="page"><PageHeading eyebrow={schedule ? 'AVAILABILITY' : 'VISUAL LIBRARY'} title={schedule ? 'Studio schedule' : 'Inspiration'} /><PaperCard className="coming-card"><span>{schedule ? '◷' : '✿'}</span><h2>{schedule ? 'Calendar view is next' : 'Photo library is next'}</h2><p>The page shell is ready. The next slice will connect {schedule ? 'availability blocks and the booking calendar' : 'uploads, collections and saved inspiration'} to the Spring Boot API.</p></PaperCard></div>;
}
