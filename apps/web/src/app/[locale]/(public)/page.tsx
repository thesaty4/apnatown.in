import { SystemShell } from '../../../shared/ui/SystemShell';

// C00 bootstrap only: no Home composition, catalogue data or fake health-driven UI.
export default function Bootstrap() {
  return <SystemShell kind="empty" />;
}
