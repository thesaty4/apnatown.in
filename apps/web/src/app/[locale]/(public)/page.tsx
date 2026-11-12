import { Entry } from '../../../features/auth/Entry';
import { LocationBar } from '../../../features/geo/LocationBar';
import { HomeCategoryTiles } from '../../../features/catalog/HomeCategoryTiles';
import { currentLocale } from '../../../features/support/metadata';

// S-CUST-01: the optional location bar (client island) and ISR category tiles.
// Catalog Home sections (`HomeSections`) render Search's public section
// projection and are composed when that slice exists. No fake data.
export default async function EntryPage() {
  return (
    <>
      <LocationBar />
      <div className="mb-stack-gap grid min-w-0 gap-stack-gap">
        <HomeCategoryTiles locale={await currentLocale()} />
      </div>
      <Entry />
    </>
  );
}
