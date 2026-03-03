import type { Employee, NibRateVersion, PayrollLine } from '@/lib/types'

export function bankersRound(value: number, decimals = 2): number {
  const factor = Math.pow(10, decimals)
  const n = value * factor
  const floor = Math.floor(n)
  const diff = n - floor

  if (diff > 0.5) {
    return (floor + 1) / factor
  }
  if (diff < 0.5) {
    return floor / factor
  }

  // Exactly .5: round to even
  if (floor % 2 === 0) {
    return floor / factor
  }
  return (floor + 1) / factor
}

export function calculateNib(gross: number, rate: NibRateVersion | null): {
  insurableWage: number
  employeeNib: number
  employerNib: number
} {
  if (!rate || gross <= 0) {
    return { insurableWage: 0, employeeNib: 0, employerNib: 0 }
  }

  const insurableWage = Math.min(gross, rate.insurable_ceiling)
  const employeeNib = bankersRound(insurableWage * rate.employee_rate_percent)
  const employerNib = bankersRound(insurableWage * rate.employer_rate_percent)

  return { insurableWage, employeeNib, employerNib }
}

export function calculateGrossForEmployee(
  employee: Employee,
  periodHours: number | null
): number {
  if (employee.pay_type === 'hourly') {
    const rate = employee.hourly_rate ?? 0
    const hours = periodHours ?? 0
    return bankersRound(rate * hours)
  }

  // Default to salaried logic
  if (employee.base_salary_monthly != null) {
    return bankersRound(employee.base_salary_monthly)
  }

  // Fallback to legacy salary field if present
  if (employee.salary != null) {
    return bankersRound(employee.salary)
  }

  return 0
}

export function calculateNetPay(
  gross: number,
  employeeNib: number,
  otherDeductions: number
): number {
  const net = gross - employeeNib - (otherDeductions || 0)
  return bankersRound(net)
}

export function buildPayrollLineTotals(line: PayrollLine): {
  gross: number
  employeeNib: number
  employerNib: number
  net: number
} {
  return {
    gross: bankersRound(line.gross),
    employeeNib: bankersRound(line.employee_nib),
    employerNib: bankersRound(line.employer_nib),
    net: bankersRound(line.net_pay),
  }
}

