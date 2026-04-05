/**
 * Downtime activity labels — aligned to spec IDs.
 * Spec: hitman_downtime.activities[].id
 */
import type { DowntimeActivityType } from '../../../shared/schema';

export const DOWNTIME_LABELS: Record<DowntimeActivityType, string> = {
  SURVEILLANCE:     'Surveillance Job',    // spec: surveillance
  CLEANUP:          'Cleanup Job',         // spec: cleanup
  SIDE_MERCENARY:   'Mercenary Contract',  // spec: side_mercenary
  TRAINING:         'Training & Calibration', // spec: training
  INFORMANT_NETWORK:'Informant Network',   // spec: informant_network
  SAFEHOUSE:        'Safehouse Upgrade',   // spec: safehouse
};
