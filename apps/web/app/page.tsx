import { SearchShell } from '@/components/search-shell';
import { searchPlaces } from '@/lib/place-repository';

export default async function HomePage({ searchParams }: { searchParams?: { q?: string } }) {
  const query = searchParams?.q ?? '';
  const result = await searchPlaces(query);

  return <SearchShell initialQuery={result.query} initialResults={result.items} resultsSource={result.source} />;
}
