import { useCallback, useState } from "react"
import { RequestByEmployeeParams, PaginatedResponse, Transaction } from "../utils/types"
import { TransactionsByEmployeeResult } from "./types"
import { useCustomFetch } from "./useCustomFetch"

export function useTransactionsByEmployee(): TransactionsByEmployeeResult {
  const { fetchWithCache, loading } = useCustomFetch()
  const [transactionsByEmployee, setTransactionsByEmployee] = useState<PaginatedResponse<Transaction[]> | null>(null)

  const fetchById = useCallback(
    async (employeeId: string) => {
      const response = await fetchWithCache<PaginatedResponse<Transaction[]>, RequestByEmployeeParams>(
        "transactionsByEmployee",
        {
          employeeId,
          page: transactionsByEmployee === null ? 0 : transactionsByEmployee.nextPage,
        }
      )
      console.log("response (transactionsByEmployee)\n", response)

      setTransactionsByEmployee((previousResponse) => {
        if (response === null) {
          return previousResponse
        }
        if (previousResponse === null) {
          return response
        }

        return {
          data: [...previousResponse.data, ...response.data],
          nextPage: response.nextPage,
        }
      })
    },
    [fetchWithCache, transactionsByEmployee]
  )

  const invalidateData = useCallback(() => {
    setTransactionsByEmployee(null)
  }, [])

  return { data: transactionsByEmployee, loading, fetchById, invalidateData }
}
