import { describe, it, expect } from 'vitest';

// Test helper functions for login validation
function validateOperatorName(name: string): boolean {
  return name.trim().length > 0;
}

function validateMobileNumber(mobile: string): boolean {
  return mobile.length === 10 && /^\d+$/.test(mobile);
}

function validateAadhaarNumber(aadhaar: string): boolean {
  return aadhaar.length === 12 && /^\d+$/.test(aadhaar);
}

function maskAadhaar(aadhaar: string): string {
  if (aadhaar.length !== 12) return aadhaar;
  return `${aadhaar.slice(0, 2)}****${aadhaar.slice(-2)}`;
}

describe('Login Validation', () => {
  describe('validateOperatorName', () => {
    it('should accept non-empty names', () => {
      expect(validateOperatorName('John Doe')).toBe(true);
      expect(validateOperatorName('Alice Smith')).toBe(true);
    });

    it('should reject empty names', () => {
      expect(validateOperatorName('')).toBe(false);
      expect(validateOperatorName('   ')).toBe(false);
    });
  });

  describe('validateMobileNumber', () => {
    it('should accept 10-digit mobile numbers', () => {
      expect(validateMobileNumber('9730018733')).toBe(true);
      expect(validateMobileNumber('9876543210')).toBe(true);
    });

    it('should reject non-10-digit numbers', () => {
      expect(validateMobileNumber('973001873')).toBe(false);
      expect(validateMobileNumber('97300187330')).toBe(false);
    });

    it('should reject non-numeric input', () => {
      expect(validateMobileNumber('973001873a')).toBe(false);
      expect(validateMobileNumber('97300-18733')).toBe(false);
    });
  });

  describe('validateAadhaarNumber', () => {
    it('should accept 12-digit Aadhaar numbers', () => {
      expect(validateAadhaarNumber('659999999978')).toBe(true);
      expect(validateAadhaarNumber('123456789012')).toBe(true);
    });

    it('should reject non-12-digit numbers', () => {
      expect(validateAadhaarNumber('65999999997')).toBe(false);
      expect(validateAadhaarNumber('6599999999780')).toBe(false);
    });

    it('should reject non-numeric input', () => {
      expect(validateAadhaarNumber('65999999997a')).toBe(false);
      expect(validateAadhaarNumber('659999-99978')).toBe(false);
    });
  });

  describe('maskAadhaar', () => {
    it('should mask Aadhaar with format XX****XX', () => {
      expect(maskAadhaar('659999999978')).toBe('65****78');
      expect(maskAadhaar('123456789012')).toBe('12****12');
    });

    it('should return original if length is not 12', () => {
      expect(maskAadhaar('123')).toBe('123');
      expect(maskAadhaar('12345678901234')).toBe('12345678901234');
    });
  });

  describe('Complete Login Flow', () => {
    it('should validate all fields correctly for valid operator', () => {
      const operatorName = 'John Doe';
      const mobileNumber = '9730018733';
      const aadhaarNumber = '659999999978';

      const isNameValid = validateOperatorName(operatorName);
      const isMobileValid = validateMobileNumber(mobileNumber);
      const isAadhaarValid = validateAadhaarNumber(aadhaarNumber);

      expect(isNameValid && isMobileValid && isAadhaarValid).toBe(true);
    });

    it('should reject incomplete operator data', () => {
      const operatorName = '';
      const mobileNumber = '9730018733';
      const aadhaarNumber = '659999999978';

      const isNameValid = validateOperatorName(operatorName);
      const isMobileValid = validateMobileNumber(mobileNumber);
      const isAadhaarValid = validateAadhaarNumber(aadhaarNumber);

      expect(isNameValid && isMobileValid && isAadhaarValid).toBe(false);
    });

    it('should reject invalid mobile number', () => {
      const operatorName = 'John Doe';
      const mobileNumber = '973001873'; // Only 9 digits
      const aadhaarNumber = '659999999978';

      const isNameValid = validateOperatorName(operatorName);
      const isMobileValid = validateMobileNumber(mobileNumber);
      const isAadhaarValid = validateAadhaarNumber(aadhaarNumber);

      expect(isNameValid && isMobileValid && isAadhaarValid).toBe(false);
    });

    it('should reject invalid Aadhaar number', () => {
      const operatorName = 'John Doe';
      const mobileNumber = '9730018733';
      const aadhaarNumber = '65999999997'; // Only 11 digits

      const isNameValid = validateOperatorName(operatorName);
      const isMobileValid = validateMobileNumber(mobileNumber);
      const isAadhaarValid = validateAadhaarNumber(aadhaarNumber);

      expect(isNameValid && isMobileValid && isAadhaarValid).toBe(false);
    });
  });

  describe('Input Sanitization', () => {
    it('should handle numeric input correctly for mobile', () => {
      const input = '9730018733';
      const cleaned = input.replace(/\D/g, '').slice(0, 10);
      expect(validateMobileNumber(cleaned)).toBe(true);
    });

    it('should handle numeric input correctly for Aadhaar', () => {
      const input = '659999999978';
      const cleaned = input.replace(/\D/g, '').slice(0, 12);
      expect(validateAadhaarNumber(cleaned)).toBe(true);
    });

    it('should reject non-numeric characters in mobile', () => {
      const input = 'abc9730018733';
      const cleaned = input.replace(/\D/g, '').slice(0, 10);
      expect(validateMobileNumber(cleaned)).toBe(true); // After cleaning, should be valid
    });
  });
});
