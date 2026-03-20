/**
 * Custom hook for managing loan data and operations.
 * 
 * @deprecated Use @/app/loans/hooks/useLoans instead for better separation of concerns.
 * This file is kept for backward compatibility.
 */
export {
  useLoans,
  calculateLoanDetails,
  type UseLoansReturn,
  type LoanFormData,
  type LoanSortOption
} from '../loans/hooks/useLoans';
