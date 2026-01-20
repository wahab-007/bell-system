export interface AuthUser {
  id: string;
  organisationId: string;
  role: 'owner' | 'admin' | 'viewer' | 'superadmin';
  email: string;
}

export interface Organisation {
  _id: string;
  name: string;
  timezone: string;
  contactEmail: string;
  contactPhone?: string;
}

export interface Block {
  _id: string;
  name: string;
  description?: string;
}

export interface Bulb {
  _id: string;
  block: Block | string;
  channel: number;
  label: string;
  state: boolean;
  lastToggledAt?: string;
}

export interface Bell {
  _id: string;
  label: string;
  block: Block | string;
  deviceId: string;
  deviceSecret?: string;
  online: boolean;
}

export interface BellEvent {
  _id: string;
  name: string;
  active: boolean;
  isDefault: boolean;
}

export interface BulbSchedule {
  _id: string;
  bulb: Bulb | string;
  block: string;
  channel: number;
  onTime: string;
  offTime: string;
  repeatPattern?: {
    daysOfWeek: number[];
  };
  active: boolean;
}

export interface Schedule {
  _id: string;
  event?: BellEvent | string;
  name: string;
  time: string;
  durationSec: number;
  bells: Bell[];
  type?: 'regular';
  active: boolean;
  repeatPattern?: {
    daysOfWeek: number[];
  };
}

export interface EmergencyState {
  _id: string;
  active: boolean;
  startedAt?: string;
}

export type EventLogType =
  | 'bell_trigger'
  | 'emergency'
  | 'device_online'
  | 'device_offline'
  | 'error'
  | 'bulb_on'
  | 'bulb_off'
  | 'bulb_toggle';

export interface EventLog {
  _id: string;
  organisation: string;
  bell?: Bell | string;
  type: EventLogType;
  payload?: Record<string, unknown>;
  timestamp: string;
}
