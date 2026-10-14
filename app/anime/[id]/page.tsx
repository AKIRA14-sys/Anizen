import AnimeDetailClient from './AnimeDetailClient';

interface PageProps {
  params: { id: string };
}

export default function AnimeDetailPage({ params }: PageProps) {
  return <AnimeDetailClient id={params.id} />;
}
