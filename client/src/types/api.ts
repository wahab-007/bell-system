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

export interface Bell {
  _id: string;
  label: string;
  block: Block | string;
  deviceId: string;
  deviceSecret?: string;
  online: boolean;
}

export interface Schedule {
  _id: string;
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

export type EventLogType = 'bell_trigger' | 'emergency' | 'device_online' | 'device_offline' | 'error';

export interface EventLog {
  _id: string;
  organisation: string;
  bell?: string;
  type: EventLogType;
  payload?: Record<string, unknown>;
  timestamp: string;
}
