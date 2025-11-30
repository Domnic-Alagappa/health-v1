/**
 * Patient-related types
 */

export interface Patient {
  id: string;
  patientId: string;
  firstName: string;
  lastName: string;
  ssn?: string;
  dateOfBirth: string;
  email?: string;
  phone?: string;
  createdAt: string;
  createdBy: string;
}
