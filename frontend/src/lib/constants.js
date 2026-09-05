/**
 * Canonical System Roles
 * Specification: 05-RBAC-ROLES-PERMISSIONS.md §2
 */
export const ROLES = {
  ADMIN: "Admin",
  HR_MANAGER: "HR Manager",
  HR_PAYROLL_MANAGER: "HR Payroll Manager",
  HR_PAYROLL_USER: "HR Payroll User",
  EMPLOYEE: "Employee",
};

/**
 * Role Groups for Route & Feature Authorization
 */
export const ROLE_GROUPS = {
  ALL_AUTHENTICATED: [
    ROLES.ADMIN,
    ROLES.HR_MANAGER,
    ROLES.HR_PAYROLL_MANAGER,
    ROLES.HR_PAYROLL_USER,
    ROLES.EMPLOYEE,
  ],
  HR_MANAGEMENT: [
    ROLES.ADMIN,
    ROLES.HR_MANAGER,
    ROLES.HR_PAYROLL_MANAGER,
    ROLES.HR_PAYROLL_USER,
  ],
  HR_WRITE_ROLES: [
    ROLES.ADMIN,
    ROLES.HR_MANAGER,
  ],
  PAYROLL_ALL: [
    ROLES.ADMIN,
    ROLES.HR_PAYROLL_MANAGER,
    ROLES.HR_PAYROLL_USER,
  ],
  PAYROLL_MANAGERS: [
    ROLES.ADMIN,
    ROLES.HR_PAYROLL_MANAGER,
  ],
  ADMIN_ONLY: [
    ROLES.ADMIN,
  ],
};

/**
 * Top Navigation Module Permissions
 * Maps each top-level navigation item to the roles permitted to view it
 */
export const NAV_PERMISSIONS = {
  DASHBOARD: ROLE_GROUPS.HR_MANAGEMENT,
  EMPLOYEES: ROLE_GROUPS.HR_MANAGEMENT,
  CONTRACTS: ROLE_GROUPS.HR_MANAGEMENT,
  SCHEDULES: ROLE_GROUPS.HR_MANAGEMENT,
  ATTENDANCE: ROLE_GROUPS.ALL_AUTHENTICATED,
  TIME_OFF: ROLE_GROUPS.ALL_AUTHENTICATED,
  PAYROLL: ROLE_GROUPS.PAYROLL_ALL,
  ADMIN: ROLE_GROUPS.ADMIN_ONLY,
  MY_PORTAL: [ROLES.EMPLOYEE],
};

/**
 * Status Enums
 */
export const EMPLOYEE_STATUS = {
  ACTIVE: "Active",
  INACTIVE: "Inactive",
  TERMINATED: "Terminated",
};

export const CONTRACT_STATUS = {
  DRAFT: "Draft",
  ACTIVE: "Active",
  EXPIRED: "Expired",
  CANCELLED: "Cancelled",
};

export const PAYRUN_STATUS = {
  DRAFT: "Draft",
  COMPUTED: "Computed",
  VALIDATED: "Validated",
  PAID: "Paid",
};

export const PAYSLIP_STATUS = {
  DRAFT: "Draft",
  COMPUTED: "Computed",
  VALIDATED: "Validated",
  PAID: "Paid",
  CANCELLED: "Cancelled",
};

export const TIME_OFF_STATUS = {
  DRAFT: "Draft",
  PENDING: "Pending Approval",
  APPROVED: "Approved",
  REFUSED: "Refused",
  CANCELLED: "Cancelled",
};

export const ATTENDANCE_STATUS = {
  PRESENT: "Present",
  LATE: "Late",
  ABSENT: "Absent",
  HALF_DAY: "Half Day",
  ON_LEAVE: "On Leave",
};
