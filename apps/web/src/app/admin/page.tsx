import { redirect } from 'next/navigation';

/** Only the profile screen is implemented in this section so far. */
export default function AdminIndex() {
  redirect('/admin/profile');
}
