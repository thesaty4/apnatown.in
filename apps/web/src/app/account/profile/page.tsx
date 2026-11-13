import { redirect } from 'next/navigation';
import { getLocale } from 'next-intl/server';
import { Profile } from '../../../features/users/Profile';
import { readProfile, hydrateOwn } from '../../../features/users/server';
import { readSession } from '../../../shared/auth/server';
import { landing, safeReturnTo } from '../../../shared/auth/return-to';

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams;
  const session = await readSession();
  const profile = await readProfile();
  const locale = (await getLocale()) === 'hi' ? 'hi' : 'en';
  const onboarding = query.onboarding === '1';
  const returnTo = safeReturnTo(query.returnTo);
  if (
    onboarding &&
    profile.kind === 'ready' &&
    profile.data.displayName &&
    session.kind === 'ready'
  )
    redirect(landing(session.data, returnTo, locale));
  return (
    <Profile
      initial={await hydrateOwn('profile', profile)}
      owner={session.kind === 'ready' ? session.data.userId : undefined}
      onboarding={onboarding}
      returnTo={returnTo}
    />
  );
}
