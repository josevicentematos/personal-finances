import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

export type Language = 'en' | 'es'

const translations = {
  en: {
    // App title
    appTitle: 'Bitácora',
    appTitleFull: 'Bitácora',

    // Navigation
    navSummary: 'Summary',
    navTransactions: 'Transactions',
    navAccounts: 'Accounts',
    navCategories: 'Categories',
    navRecurring: 'Recurring',
    navProducts: 'Products',
    navSettings: 'Settings',
    logout: 'Logout',

    // Login
    enterPassword: 'Enter your password to continue',
    password: 'Password',
    masterPassword: 'Master password',
    invalidPassword: 'Invalid password',
    signingIn: 'Signing in...',
    signIn: 'Sign In',

    // Common
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    confirm: 'Confirm',
    loading: 'Loading...',
    dismiss: 'Dismiss',
    name: 'Name',
    amount: 'Amount',
    actions: 'Actions',
    color: 'Color',

    // Accounts page
    accounts: 'Accounts',
    mainAccountsBalance: 'Main Accounts Balance',
    accountName: 'Account name',
    initialBalance: 'Initial balance',
    addAccount: 'Add Account',
    noAccountsYet: 'No accounts yet',
    addFirstAccount: 'Add your first account to get started',
    main: 'Main',
    showInSummary: 'Summary',
    balance: 'Balance',
    deleteAccount: 'Delete Account',
    deleteAccountConfirm: 'Are you sure you want to delete this account? This action cannot be undone.',
    editAccount: 'Edit Account',
    renameAccountConfirm: 'Are you sure you want to rename this account to',

    // Categories page
    categories: 'Categories',
    categoryName: 'Category name',
    addCategory: 'Add Category',
    noCategoriesYet: 'No categories yet',
    addFirstCategory: 'Add your first category to organize transactions',
    categoryTotalExpenses: 'Total Expenses',
    categoryTotalIncome: 'Total Income',
    deleteCategory: 'Delete Category',
    deleteCategoryConfirm: 'Are you sure you want to delete this category?',
    deleteCategoryWarning: 'This category has transactions associated with it. Deleting it may cause issues. Are you sure?',
    editCategory: 'Edit Category',
    renameCategoryConfirm: 'Are you sure you want to rename this category to',
    renameCategoryWarning: 'This category has transactions associated with it. Are you sure you want to rename it to',

    // Recurring payments page
    recurringPayments: 'Recurring Payments',
    paymentName: 'Payment name',
    addPayment: 'Add Payment',
    noRecurringPayments: 'No recurring payments',
    addRecurringExpenses: 'Add your recurring expenses to track them',
    paid: 'Paid',
    realMoneyCalculation: 'Real Money Calculation',
    mainAccountsBalanceLabel: 'Main Accounts Balance:',
    unpaidRecurringPayments: 'Unpaid Recurring Payments:',
    realMoney: 'Real Money:',
    noMainAccounts: 'No main accounts',
    deleteRecurringPayment: 'Delete Recurring Payment',
    deleteRecurringPaymentConfirm: 'Are you sure you want to delete this recurring payment?',

    // Settings page
    settings: 'Settings',
    dollarRateTitle: 'Dollar Rate (UYU/USD)',
    lastUpdated: 'Last updated:',
    newRate: 'New Rate',
    saving: 'Saving...',
    saved: 'Saved!',
    saveRate: 'Save Rate',
    language: 'Language',
    languageLabel: 'App Language',
    english: 'English',
    spanish: 'Spanish',
    theme: 'Theme',
    themeLabel: 'App Theme',
    themeLight: 'Light',
    themeDark: 'Dark',
    themeSystem: 'System',

    // Summary page
    summary: 'Summary',
    accountBalances: 'Account Balances',
    totalBalance: 'Total Balance',
    realBalance: 'Real Balance',
    expensesFor: 'Expenses for',
    noExpensesThisMonth: 'No expenses this month',
    totalExpenses: 'Total Expenses',
    recentTransactions: 'Recent Transactions',

    // Transactions page
    transactions: 'Transactions',
    addTransaction: 'Add Transaction',
    allMonths: 'All months',
    allAccounts: 'All accounts',
    allCategories: 'All categories',
    clearFilters: 'Clear filters',
    noTransactionsYet: 'No transactions yet',
    addFirstTransaction: 'Add your first transaction to start tracking',
    noMatchingTransactions: 'No matching transactions',
    adjustFilters: 'Try adjusting your filters',
    date: 'Date',
    description: 'Description',
    category: 'Category',
    account: 'Account',
    expense: 'Expense',
    income: 'Income',
    liquid: 'Liquid',
    rate: 'Rate',
    deleteTransaction: 'Delete Transaction',
    deleteTransactionConfirm: 'Are you sure you want to delete this transaction? The account balance will be adjusted.',

    // Transaction form
    newTransaction: 'New Transaction',
    editTransaction: 'Edit Transaction',
    dollarRate: 'Dollar Rate',
    usdEquivalent: 'USD',
    expenseAmount: 'Expense',
    incomeAmount: 'Income',
    liquidAvailable: 'Liquid (immediately available)',
    savingDots: 'Saving...',
    saveTransaction: 'Save Transaction',
    recurringPayment: 'Recurring Payment',
    selectRecurringPayment: 'Select a recurring payment (optional)',

    // Products page
    products: 'Products',
    productName: 'Product name',
    productUnit: 'Unit (optional)',
    productUnitPlaceholder: 'kg / L / box…',
    addProduct: 'Add Product',
    noProductsYet: 'No products yet',
    addFirstProduct: 'Add products to track what you buy',
    deleteProduct: 'Delete Product',
    deleteProductConfirm: 'Are you sure you want to delete this product?',
    deleteProductWarning: 'This product is linked to existing transactions and cannot be deleted.',
    editProduct: 'Edit Product',
    monthlyUsage: 'Monthly Usage',
    timesPurchased: 'Times Purchased',
    totalQuantity: 'Total Quantity',
    unit: 'Unit',
    quantity: 'Quantity',
    noUsageThisMonth: 'No products recorded this month',
    addProducts: 'Add Products (optional)',
    addProductLine: 'Add product',
    removeProductLine: 'Remove',
    selectProduct: 'Select a product',

    // Error boundary
    somethingWentWrong: 'Something went wrong',
    unexpectedError: 'An unexpected error occurred',
    reloadPage: 'Reload Page',
  },
  es: {
    // App title
    appTitle: 'Bitácora',
    appTitleFull: 'Bitácora',

    // Navigation
    navSummary: 'Resumen',
    navTransactions: 'Movimientos',
    navAccounts: 'Cuentas',
    navCategories: 'Categorias',
    navRecurring: 'Recurrentes',
    navProducts: 'Productos',
    navSettings: 'Ajustes',
    logout: 'Salir',

    // Login
    enterPassword: 'Ingresa tu contrasena para continuar',
    password: 'Contrasena',
    masterPassword: 'Contrasena maestra',
    invalidPassword: 'Contrasena invalida',
    signingIn: 'Iniciando sesion...',
    signIn: 'Iniciar Sesion',

    // Common
    save: 'Guardar',
    cancel: 'Cancelar',
    delete: 'Eliminar',
    edit: 'Editar',
    confirm: 'Confirmar',
    loading: 'Cargando...',
    dismiss: 'Cerrar',
    name: 'Nombre',
    amount: 'Monto',
    actions: 'Acciones',
    color: 'Color',

    // Accounts page
    accounts: 'Cuentas',
    mainAccountsBalance: 'Saldo Cuentas Principales',
    accountName: 'Nombre de cuenta',
    initialBalance: 'Saldo inicial',
    addAccount: 'Agregar Cuenta',
    noAccountsYet: 'Sin cuentas aun',
    addFirstAccount: 'Agrega tu primera cuenta para comenzar',
    main: 'Principal',
    showInSummary: 'Resumen',
    balance: 'Saldo',
    deleteAccount: 'Eliminar Cuenta',
    deleteAccountConfirm: 'Estas seguro que deseas eliminar esta cuenta? Esta accion no se puede deshacer.',
    editAccount: 'Editar Cuenta',
    renameAccountConfirm: 'Estas seguro que deseas renombrar esta cuenta a',

    // Categories page
    categories: 'Categorias',
    categoryName: 'Nombre de categoria',
    addCategory: 'Agregar Categoria',
    noCategoriesYet: 'Sin categorias aun',
    addFirstCategory: 'Agrega tu primera categoria para organizar movimientos',
    categoryTotalExpenses: 'Total Gastos',
    categoryTotalIncome: 'Total Ingresos',
    deleteCategory: 'Eliminar Categoria',
    deleteCategoryConfirm: 'Estas seguro que deseas eliminar esta categoria?',
    deleteCategoryWarning: 'Esta categoria tiene movimientos asociados. Eliminarla podria causar problemas. Estas seguro?',
    editCategory: 'Editar Categoria',
    renameCategoryConfirm: 'Estas seguro que deseas renombrar esta categoria a',
    renameCategoryWarning: 'Esta categoria tiene movimientos asociados. Estas seguro que deseas renombrarla a',

    // Recurring payments page
    recurringPayments: 'Pagos Recurrentes',
    paymentName: 'Nombre del pago',
    addPayment: 'Agregar Pago',
    noRecurringPayments: 'Sin pagos recurrentes',
    addRecurringExpenses: 'Agrega tus gastos recurrentes para seguirlos',
    paid: 'Pagado',
    realMoneyCalculation: 'Calculo de Dinero Real',
    mainAccountsBalanceLabel: 'Saldo Cuentas Principales:',
    unpaidRecurringPayments: 'Pagos Recurrentes Pendientes:',
    realMoney: 'Dinero Real:',
    noMainAccounts: 'Sin cuentas principales',
    deleteRecurringPayment: 'Eliminar Pago Recurrente',
    deleteRecurringPaymentConfirm: 'Estas seguro que deseas eliminar este pago recurrente?',

    // Settings page
    settings: 'Ajustes',
    dollarRateTitle: 'Tipo de Cambio (UYU/USD)',
    lastUpdated: 'Ultima actualizacion:',
    newRate: 'Nuevo Tipo',
    saving: 'Guardando...',
    saved: 'Guardado!',
    saveRate: 'Guardar Tipo',
    language: 'Idioma',
    languageLabel: 'Idioma de la App',
    english: 'Ingles',
    spanish: 'Espanol',
    theme: 'Tema',
    themeLabel: 'Tema de la App',
    themeLight: 'Claro',
    themeDark: 'Oscuro',
    themeSystem: 'Sistema',

    // Summary page
    summary: 'Resumen',
    accountBalances: 'Saldos de Cuentas',
    totalBalance: 'Saldo Total',
    realBalance: 'Saldo Real',
    expensesFor: 'Gastos de',
    noExpensesThisMonth: 'Sin gastos este mes',
    totalExpenses: 'Total Gastos',
    recentTransactions: 'Movimientos Recientes',

    // Transactions page
    transactions: 'Movimientos',
    addTransaction: 'Agregar Movimiento',
    allMonths: 'Todos los meses',
    allAccounts: 'Todas las cuentas',
    allCategories: 'Todas las categorias',
    clearFilters: 'Limpiar filtros',
    noTransactionsYet: 'Sin movimientos aun',
    addFirstTransaction: 'Agrega tu primer movimiento para comenzar a seguir',
    noMatchingTransactions: 'Sin movimientos coincidentes',
    adjustFilters: 'Intenta ajustar los filtros',
    date: 'Fecha',
    description: 'Descripcion',
    category: 'Categoria',
    account: 'Cuenta',
    expense: 'Gasto',
    income: 'Ingreso',
    liquid: 'Liquido',
    rate: 'Tipo',
    deleteTransaction: 'Eliminar Movimiento',
    deleteTransactionConfirm: 'Estas seguro que deseas eliminar este movimiento? El saldo de la cuenta sera ajustado.',

    // Transaction form
    newTransaction: 'Nuevo Movimiento',
    editTransaction: 'Editar Movimiento',
    dollarRate: 'Tipo de Cambio',
    usdEquivalent: 'USD',
    expenseAmount: 'Gasto',
    incomeAmount: 'Ingreso',
    liquidAvailable: 'Liquido (disponible inmediatamente)',
    savingDots: 'Guardando...',
    saveTransaction: 'Guardar Movimiento',
    recurringPayment: 'Pago Recurrente',
    selectRecurringPayment: 'Seleccionar un pago recurrente (opcional)',

    // Products page
    products: 'Productos',
    productName: 'Nombre del producto',
    productUnit: 'Unidad (opcional)',
    productUnitPlaceholder: 'kg / L / caja…',
    addProduct: 'Agregar Producto',
    noProductsYet: 'Sin productos aun',
    addFirstProduct: 'Agrega productos para seguir lo que compras',
    deleteProduct: 'Eliminar Producto',
    deleteProductConfirm: 'Estas seguro que deseas eliminar este producto?',
    deleteProductWarning: 'Este producto esta vinculado a movimientos existentes y no puede eliminarse.',
    editProduct: 'Editar Producto',
    monthlyUsage: 'Uso Mensual',
    timesPurchased: 'Veces Comprado',
    totalQuantity: 'Cantidad Total',
    unit: 'Unidad',
    quantity: 'Cantidad',
    noUsageThisMonth: 'Sin productos registrados este mes',
    addProducts: 'Agregar Productos (opcional)',
    addProductLine: 'Agregar producto',
    removeProductLine: 'Quitar',
    selectProduct: 'Seleccionar un producto',

    // Error boundary
    somethingWentWrong: 'Algo salio mal',
    unexpectedError: 'Ocurrio un error inesperado',
    reloadPage: 'Recargar Pagina',
  },
} as const

type TranslationKey = keyof typeof translations.en

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: TranslationKey) => string
}

const LanguageContext = createContext<LanguageContextType | null>(null)

const LANGUAGE_STORAGE_KEY = 'bitacora-language'

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY)
    if (stored === 'en' || stored === 'es') {
      return stored
    }
    return 'es' // Default to Spanish
  })

  useEffect(() => {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, language)
  }, [language])

  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
  }

  const t = (key: TranslationKey): string => {
    return translations[language][key] || key
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useTranslation() {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useTranslation must be used within a LanguageProvider')
  }
  return context
}
