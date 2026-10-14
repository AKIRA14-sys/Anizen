import WatchClient from './WatchClient';

interface PageProps {
  params: { id: string };
}

export default function WatchPage({ params }: PageProps) {
  return <WatchClient id={params.id} />;
}
