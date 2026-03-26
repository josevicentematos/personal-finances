import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

export type Language = 'en' | 'es'

const translations = {
  en: {
    // App title
    appTitle: 'Finance',
    appTitleFull: 'Personal Finance',

    // Navigation
    navSummary: 'Summary',
    navTransactions: 'Transactions',
    navAccounts: 'Accounts',
    navCategories: 'Categories',
    navRecurring: 'Recurring',
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

    // Accounts page
    accounts: 'Accounts',
    mainAccountsBalance: 'Main Accounts Balance',
    accountName: 'Account name',
    initialBalance: 'Initial balance',
    addAccount: 'Add Account',
    noAccountsYet: 'No accounts yet',
    addFirstAccount: 'Add your first account to get started',
    main: 'Main',
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

    // Summary page
    summary: 'Summary',
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
    dollarRate: 'Dollar Rate',
    expenseAmount: 'Expense',
    incomeAmount: 'Income',
    liquidAvailable: 'Liquid (immediately available)',
    savingDots: 'Saving...',
    saveTransaction: 'Save Transaction',

    // Error boundary
    somethingWentWrong: 'Something went wrong',
    unexpectedError: 'An unexpected error occurred',
    reloadPage: 'Reload Page',
  },
  es: {
    // App title
    appTitle: 'Finanzas',
    appTitleFull: 'Finanzas Personales',

    // Navigation
    navSummary: 'Resumen',
    navTransactions: 'Movimientos',
    navAccounts: 'Cuentas',
    navCategories: 'Categorias',
    navRecurring: 'Recurrentes',
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

    // Accounts page
    accounts: 'Cuentas',
    mainAccountsBalance: 'Saldo Cuentas Principales',
    accountName: 'Nombre de cuenta',
    initialBalance: 'Saldo inicial',
    addAccount: 'Agregar Cuenta',
    noAccountsYet: 'Sin cuentas aun',
    addFirstAccount: 'Agrega tu primera cuenta para comenzar',
    main: 'Principal',
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

    // Summary page
    summary: 'Resumen',
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
    dollarRate: 'Tipo de Cambio',
    expenseAmount: 'Gasto',
    incomeAmount: 'Ingreso',
    liquidAvailable: 'Liquido (disponible inmediatamente)',
    savingDots: 'Guardando...',
    saveTransaction: 'Guardar Movimiento',

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

const LANGUAGE_STORAGE_KEY = 'finance-app-language'

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
