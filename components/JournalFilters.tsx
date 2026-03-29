'use client';

import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

interface PersonOption {
  id: string;
  name: string;
  surname: string | null;
  nickname: string | null;
}

interface JournalFiltersProps {
  people: PersonOption[];
  currentPerson?: string;
  currentSearch?: string;
}

export default function JournalFilters({ people, currentPerson, currentSearch }: JournalFiltersProps) {
  const t = useTranslations('journal');
  const router = useRouter();

  function buildUrl(params: Record<string, string | undefined>) {
    const url = new URL('/journal', window.location.origin);
    for (const [key, value] of Object.entries(params)) {
      if (value) url.searchParams.set(key, value);
    }
    return url.pathname + url.search;
  }

  return (
    <div className="flex gap-3 mb-6">
      <form
        className="flex-1"
        onSubmit={(e) => {
          e.preventDefault();
          const formData = new FormData(e.currentTarget);
          const q = formData.get('q') as string;
          router.push(buildUrl({ q: q || undefined, person: currentPerson }));
        }}
      >
        <input
          type="search"
          name="q"
          defaultValue={currentSearch ?? ''}
          placeholder={t('searchPlaceholder')}
          className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary text-sm"
        />
      </form>
      <select
        value={currentPerson ?? ''}
        onChange={(e) => {
          const person = e.target.value || undefined;
          router.push(buildUrl({ person, q: currentSearch }));
        }}
        className="px-3 py-2 bg-surface border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
      >
        <option value="">{t('allPeople')}</option>
        {people.map((person) => (
          <option key={person.id} value={person.id}>
            {person.nickname ?? person.name}
            {person.surname ? ` ${person.surname}` : ''}
          </option>
        ))}
      </select>
    </div>
  );
}
