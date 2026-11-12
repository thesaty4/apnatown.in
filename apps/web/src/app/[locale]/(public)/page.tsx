import { Entry } from '../../../features/auth/Entry';
import { LocationBar } from '../../../features/geo/LocationBar';

// C00 bootstrap plus the optional S-CUST-01 location bar (client island).
// No Home composition, catalogue data or fake health-driven UI.
export default function EntryPage() {
  return (
    <>
      <LocationBar />
      <Entry />
    </>
  );
}
