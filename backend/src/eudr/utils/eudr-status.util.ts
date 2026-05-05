import { FarmStatus, ValidationStatus } from '../../../generated/prisma/enums';
import { EUDR_CUTOFF_DATE } from '../eudr.constants';

export type EudrApiStatus = 'COMPLIANT' | 'REVIEW_REQUIRED' | 'NON_COMPLIANT';

export function classifyValidationStatus(
  hectaresDeforested: number,
): ValidationStatus {
  if (hectaresDeforested === 0) {
    return ValidationStatus.COMPLIANT;
  }

  if (hectaresDeforested > 0 && hectaresDeforested < 1) {
    return ValidationStatus.NEEDS_REVIEW;
  }

  return ValidationStatus.NON_COMPLIANT;
}

export function calculateHectaresDeforested(values: number[]): number {
  const validValues = values.filter((value) => Number.isFinite(value));

  if (validValues.length === 0) {
    return 0;
  }

  return Number(Math.max(...validValues).toFixed(2));
}

export function toCutoffDate(): Date {
  return new Date(`${EUDR_CUTOFF_DATE}T00:00:00.000Z`);
}

export function toFarmStatus(status: ValidationStatus): FarmStatus {
  if (status === ValidationStatus.COMPLIANT) {
    return FarmStatus.APPROVED;
  }

  if (status === ValidationStatus.NON_COMPLIANT) {
    return FarmStatus.REJECTED;
  }

  return FarmStatus.PENDING;
}

export function toApiStatus(status: ValidationStatus): EudrApiStatus {
  if (status === ValidationStatus.COMPLIANT) {
    return 'COMPLIANT';
  }

  if (status === ValidationStatus.NON_COMPLIANT) {
    return 'NON_COMPLIANT';
  }

  return 'REVIEW_REQUIRED';
}
