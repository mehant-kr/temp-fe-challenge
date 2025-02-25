import { Fragment, useCallback, useEffect, useMemo, useState } from "react"
import { InputSelect } from "./components/InputSelect"
import { Instructions } from "./components/Instructions"
import { Transactions } from "./components/Transactions"
import { useEmployees } from "./hooks/useEmployees"
import { usePaginatedTransactions } from "./hooks/usePaginatedTransactions"
import { useTransactionsByEmployee } from "./hooks/useTransactionsByEmployee"
import { EMPTY_EMPLOYEE } from "./utils/constants"
import { Employee } from "./utils/types"

export function App() {
  const { data: employees, ...employeeUtils } = useEmployees()
  const { data: paginatedTransactions, ...paginatedTransactionsUtils } = usePaginatedTransactions()
  const { data: transactionsByEmployee, ...transactionsByEmployeeUtils } = useTransactionsByEmployee()
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(false)
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false)

  const transactions = useMemo(
    () => paginatedTransactions?.data ?? transactionsByEmployee?.data ?? null,
    [paginatedTransactions, transactionsByEmployee]
  )

  const [employeeTransactions, setEmployeeTransactions] = useState<string | undefined>(undefined)

  const loadAllTransactions = useCallback(async () => {
    setIsLoadingTransactions(true)
    transactionsByEmployeeUtils.invalidateData()

    await paginatedTransactionsUtils.fetchAll()

    setIsLoadingTransactions(false)
  }, [paginatedTransactionsUtils, transactionsByEmployeeUtils])

  const loadTransactionsByEmployee = useCallback(
    async (employeeId: string) => {
      setIsLoadingTransactions(true)
      paginatedTransactionsUtils.invalidateData()
      await transactionsByEmployeeUtils.fetchById(employeeId)
      setIsLoadingTransactions(false)
    },
    [paginatedTransactionsUtils, transactionsByEmployeeUtils]
  )

  useEffect(() => {
    const loadEmployees = async () => {
      setIsLoadingEmployees(true)
      await employeeUtils.fetchAll()
      setIsLoadingEmployees(false)
    }

    if (employees === null && !employeeUtils.loading) {
      loadAllTransactions()
      loadEmployees()
    }
  }, [employeeUtils.loading, employees, loadAllTransactions, employeeUtils])

  const hasMoreTransactions = useMemo(() => {
    if (employeeTransactions) {
      return transactionsByEmployee?.nextPage !== null
    }
    return paginatedTransactions?.nextPage !== null
  }, [employeeTransactions, paginatedTransactions, transactionsByEmployee])

  return (
    <Fragment>
      <main className="MainContainer">
        <Instructions />

        <hr className="RampBreak--l" />

        <InputSelect<Employee>
          isLoading={isLoadingEmployees}
          defaultValue={EMPTY_EMPLOYEE}
          items={employees === null ? [] : [EMPTY_EMPLOYEE, ...employees]}
          label="Filter by employee"
          loadingLabel="Loading employees"
          parseItem={(item) => ({
            value: item.id,
            label: `${item.firstName} ${item.lastName}`,
          })}
          onChange={async (newValue) => {
            if (newValue === null) {
              return
            }
            if (newValue.firstName === "All") {
              setEmployeeTransactions(undefined)
              transactionsByEmployeeUtils.invalidateData()
              loadAllTransactions()
            } else {
              setEmployeeTransactions(newValue.id)
              transactionsByEmployeeUtils.invalidateData()
              await loadTransactionsByEmployee(newValue.id)
            }
          }}
        />

        <div className="RampBreak--l" />

        <div className="RampGrid">
          <Transactions transactions={transactions} />

          {transactions !== null && hasMoreTransactions &&(
            <button
              className="RampButton"
              disabled={paginatedTransactionsUtils.loading || transactionsByEmployeeUtils.loading}
              onClick={async () => {
                if (employeeTransactions) {
                  await loadTransactionsByEmployee(employeeTransactions)
                } else {
                  await loadAllTransactions()
                }
              }}
            >
              View More
            </button>
          )}
        </div>
      </main>
    </Fragment>
  )
}
