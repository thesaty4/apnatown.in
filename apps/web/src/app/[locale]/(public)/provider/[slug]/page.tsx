import { BusinessProfilePage } from '../../../../../features/businesses/public-profile/BusinessProfilePage';
import { businessProfileMetadata } from '../../../../../features/businesses/public-profile/read';

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: Props) {
  return businessProfileMetadata('provider', (await params).slug);
}

export default async function ProviderPage({ params, searchParams }: Props) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  return (
    <BusinessProfilePage
      kind="provider"
      slug={slug}
      search={new URLSearchParams(
        Object.entries(query).flatMap(([key, value]) =>
          value === undefined
            ? []
            : Array.isArray(value)
              ? value.map((item) => [key, item] as [string, string])
              : [[key, value] as [string, string]],
        ),
      ).toString()}
    />
  );
}
