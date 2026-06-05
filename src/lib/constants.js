// User roles
export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  OUTLET_MANAGER: 'outlet_manager',
  CASHIER: 'cashier',
};

// Role display names
export const ROLE_LABELS = {
  [ROLES.SUPER_ADMIN]: 'Super Admin',
  [ROLES.OUTLET_MANAGER]: 'Manager Outlet',
  [ROLES.CASHIER]: 'Kasir',
};

// Order statuses
export const ORDER_STATUS = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
};

export const ORDER_STATUS_LABELS = {
  [ORDER_STATUS.PENDING]: 'Menunggu',
  [ORDER_STATUS.COMPLETED]: 'Selesai',
  [ORDER_STATUS.CANCELLED]: 'Dibatalkan',
};

export const ORDER_STATUS_COLORS = {
  [ORDER_STATUS.PENDING]: 'var(--color-warning)',
  [ORDER_STATUS.COMPLETED]: 'var(--color-success)',
  [ORDER_STATUS.CANCELLED]: 'var(--color-danger)',
};

// Payment methods
export const PAYMENT_METHODS = {
  CASH: 'cash',
  QRIS: 'qris',
};

export const PAYMENT_METHOD_LABELS = {
  [PAYMENT_METHODS.CASH]: 'Cash',
  [PAYMENT_METHODS.QRIS]: 'QRIS',
};

// Tax rate (PPN 11%)
export const TAX_RATE = 0.11;

// Navigation items
export const NAV_ITEMS = [
  {
    href: '/pos',
    label: 'Kasir',
    icon: 'receipt',
    roles: [ROLES.OUTLET_MANAGER, ROLES.CASHIER],
  },
  {
    href: '/menu',
    label: 'Menu',
    icon: 'menu_book',
    roles: [ROLES.OUTLET_MANAGER],
  },
  {
    href: '/admin/categories',
    label: 'Kelola Kategori',
    icon: 'category',
    roles: [ROLES.SUPER_ADMIN],
  },
  {
    href: '/orders',
    label: 'Riwayat Order',
    icon: 'history',
    roles: [ROLES.OUTLET_MANAGER, ROLES.CASHIER],
  },
  {
    href: '/reports',
    label: 'Laporan',
    icon: 'analytics',
    roles: [ROLES.OUTLET_MANAGER],
  },
  {
    href: '/admin/outlets',
    label: 'Kelola Outlet',
    icon: 'store',
    roles: [ROLES.SUPER_ADMIN],
  },
  {
    href: '/admin/users',
    label: 'Kelola User',
    icon: 'group',
    roles: [ROLES.SUPER_ADMIN],
  },
  {
    href: '/admin/overview',
    label: 'Overview',
    icon: 'dashboard',
    roles: [ROLES.SUPER_ADMIN],
  },
];
