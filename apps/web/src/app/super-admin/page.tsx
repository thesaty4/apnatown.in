import { redirect } from 'next/navigation';

/** The overview screen is not implemented yet. */
export default function SuperAdminIndex() {
  redirect('/super-admin/admins');
}
