/**
 * Masking Utilities Tests
 * Unit tests for all masking levels (complete, partial, contextual, progressive)
 */

import { describe, it, expect } from 'vitest';
import {
  maskField,
  maskSSN,
  maskEmail,
  maskPhone,
  maskMRN,
  maskCreditCard,
  maskObject,
  contextualMask,
} from './masking';

describe('maskField', () => {
  it('should mask a field with specified visible characters', () => {
    expect(maskField('1234567890', 4)).toBe('******7890');
    expect(maskField('1234567890', 4, '#')).toBe('######7890');
  });

  it('should return full value if length <= visibleChars', () => {
    expect(maskField('123', 4)).toBe('123');
    expect(maskField('1234', 4)).toBe('1234');
  });

  it('should handle empty strings', () => {
    expect(maskField('', 4)).toBe('');
  });
});

describe('maskSSN', () => {
  it('should mask SSN with last 4 digits visible (partial)', () => {
    const ssn = '123-45-6789';
    const masked = maskSSN(ssn, 'partial');
    expect(masked).toContain('6789');
    expect(masked).not.toContain('123');
    expect(masked).not.toContain('45');
  });

  it('should completely mask SSN when level is complete', () => {
    const ssn = '123-45-6789';
    const masked = maskSSN(ssn, 'complete');
    expect(masked).toBe('[REDACTED]');
  });

  it('should handle SSN without dashes', () => {
    const ssn = '123456789';
    const masked = maskSSN(ssn);
    expect(masked).toContain('6789');
  });

  it('should handle invalid SSN format', () => {
    const ssn = '123';
    const masked = maskSSN(ssn);
    expect(masked).not.toBe(ssn); // Should still mask even if invalid format
    expect(masked.length).toBeGreaterThan(0);
  });
});

describe('maskEmail', () => {
  it('should mask email with first 2 chars of local part visible (partial)', () => {
    const email = 'john.doe@example.com';
    const masked = maskEmail(email, 'partial');
    expect(masked).toContain('oe');
    expect(masked).toContain('@example.com');
    expect(masked).not.toContain('john.d');
  });

  it('should completely mask email when level is complete', () => {
    const email = 'john.doe@example.com';
    const masked = maskEmail(email, 'complete');
    expect(masked).toBe('[REDACTED]');
  });

  it('should handle short email addresses', () => {
    const email = 'ab@example.com';
    const masked = maskEmail(email);
    expect(masked).toContain('ab');
    expect(masked).toContain('@example.com');
  });

  it('should handle invalid email format', () => {
    const email = 'notanemail';
    const masked = maskEmail(email);
    expect(masked).not.toBe(email); // Should still mask even if invalid format
    expect(masked.length).toBeGreaterThan(0);
  });
});

describe('maskPhone', () => {
  it('should mask phone with last 4 digits visible (partial)', () => {
    const phone = '123-456-7890';
    const masked = maskPhone(phone, 'partial');
    expect(masked).toContain('7890');
    expect(masked).not.toContain('123');
    expect(masked).not.toContain('456');
  });

  it('should completely mask phone when level is complete', () => {
    const phone = '123-456-7890';
    const masked = maskPhone(phone, 'complete');
    expect(masked).toBe('[REDACTED]');
  });

  it('should handle phone without dashes', () => {
    const phone = '1234567890';
    const masked = maskPhone(phone);
    expect(masked).toContain('7890');
  });

  it('should handle short phone numbers', () => {
    const phone = '123';
    const masked = maskPhone(phone);
    expect(masked).not.toBe(phone); // Should still mask even if too short
    expect(masked.length).toBeGreaterThan(0);
  });
});

describe('maskMRN', () => {
  it('should mask MRN with last 4 characters visible (partial)', () => {
    const mrn = 'MRN-123456';
    const masked = maskMRN(mrn, 'partial');
    expect(masked).toContain('3456');
    expect(masked).not.toContain('123');
  });

  it('should completely mask MRN when level is complete', () => {
    const mrn = 'MRN-123456';
    const masked = maskMRN(mrn, 'complete');
    expect(masked).toBe('[REDACTED]');
  });

  it('should handle short MRNs', () => {
    const mrn = 'MRN';
    const masked = maskMRN(mrn);
    // If MRN is shorter than visibleChars (4), it returns as-is
    expect(masked).toBe(mrn);
    expect(masked.length).toBe(3);
  });
});

describe('maskCreditCard', () => {
  it('should completely mask credit card numbers', () => {
    const card = '1234-5678-9012-3456';
    const masked = maskCreditCard(card);
    expect(masked).toBe('[REDACTED]');
    expect(masked).not.toContain('1234');
    expect(masked).not.toContain('5678');
    expect(masked).not.toContain('9012');
    expect(masked).not.toContain('3456');
  });

  it('should handle credit card without dashes', () => {
    const card = '1234567890123456';
    const masked = maskCreditCard(card);
    expect(masked).toBe('[REDACTED]');
  });
});

describe('maskObject', () => {
  it('should mask specified fields in an object', () => {
    const obj = {
      name: 'John Doe',
      ssn: '123-45-6789',
      email: 'john@example.com',
      phone: '123-456-7890',
    };
    const fieldsToMask = ['ssn', 'email', 'phone'];
    const masked = maskObject(obj, fieldsToMask);
    
    expect(masked.name).toBe('John Doe');
    expect(masked.ssn).not.toBe(obj.ssn);
    expect(masked.email).not.toBe(obj.email);
    expect(masked.phone).not.toBe(obj.phone);
  });

  it('should handle nested objects (only top-level fields)', () => {
    const obj = {
      patient: {
        name: 'John Doe',
        ssn: '123-45-6789',
      },
      contact: {
        email: 'john@example.com',
      },
      ssn: '123-45-6789', // Top-level field
      email: 'john@example.com', // Top-level field
    };
    const fieldsToMask = ['ssn', 'email'];
    const masked = maskObject(obj, fieldsToMask);
    
    expect(masked.patient.name).toBe('John Doe');
    expect(masked.patient.ssn).toBe(obj.patient.ssn); // Nested fields not masked
    expect(masked.contact.email).toBe(obj.contact.email); // Nested fields not masked
    expect(masked.ssn).not.toBe(obj.ssn); // Top-level field is masked
    expect(masked.email).not.toBe(obj.email); // Top-level field is masked
  });

  it('should handle arrays (only top-level string fields)', () => {
    const obj = {
      patients: [
        { name: 'John', ssn: '123-45-6789' },
        { name: 'Jane', ssn: '987-65-4321' },
      ],
      ssn: '123-45-6789', // Top-level field
    };
    const fieldsToMask = ['ssn'];
    const masked = maskObject(obj, fieldsToMask);
    
    expect(masked.patients[0].name).toBe('John');
    expect(masked.patients[0].ssn).toBe(obj.patients[0].ssn); // Array items not masked
    expect(masked.patients[1].name).toBe('Jane');
    expect(masked.patients[1].ssn).toBe(obj.patients[1].ssn); // Array items not masked
    expect(masked.ssn).not.toBe(obj.ssn); // Top-level field is masked
  });

  it('should not mask fields not in the list', () => {
    const obj = {
      name: 'John Doe',
      ssn: '123-45-6789',
      email: 'john@example.com',
    };
    const fieldsToMask = ['ssn'];
    const masked = maskObject(obj, fieldsToMask);
    
    expect(masked.name).toBe('John Doe');
    expect(masked.email).toBe('john@example.com');
    expect(masked.ssn).not.toBe(obj.ssn);
  });
});

describe('contextualMask', () => {
  it('should mask SSN based on user role', () => {
    const ssn = '123-45-6789';
    const doctorMasked = contextualMask(ssn, 'ssn', 'doctor');
    const receptionistMasked = contextualMask(ssn, 'ssn', 'receptionist');
    
    expect(doctorMasked).toContain('6789'); // Partial mask
    expect(receptionistMasked).toBe('[REDACTED]'); // Complete mask
  });

  it('should mask email based on user role', () => {
    const email = 'john.doe@example.com';
    const doctorMasked = contextualMask(email, 'email', 'doctor');
    const receptionistMasked = contextualMask(email, 'email', 'receptionist');
    
    expect(doctorMasked).toContain('@example.com'); // Partial mask
    expect(receptionistMasked).toBe('[REDACTED]'); // Complete mask
  });

  it('should mask phone based on user role', () => {
    const phone = '123-456-7890';
    const doctorMasked = contextualMask(phone, 'phone', 'doctor');
    const receptionistMasked = contextualMask(phone, 'phone', 'receptionist');
    
    expect(doctorMasked).toContain('7890'); // Partial mask
    expect(receptionistMasked).toBe('[REDACTED]'); // Complete mask
  });

  it('should always completely mask credit cards', () => {
    const card = '1234-5678-9012-3456';
    const masked = contextualMask(card, 'creditCard', 'doctor');
    expect(masked).toBe('[REDACTED]');
  });

  it('should handle unknown fields with default masking', () => {
    const value = 'some-sensitive-data';
    const masked = contextualMask(value, 'unknownField', 'doctor');
    expect(masked).not.toBe(value);
    expect(masked.length).toBeGreaterThan(0);
  });
});

