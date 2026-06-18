import { useState, useEffect, useCallback, useRef } from 'react'

/**
 * Generic data-fetching hook.
 * Re-fetches whenever `deps` array changes.
 *
 * Usage:
 *   const { data, loading, error, refetch } = useFetch(() => tasksApi.list({ company }), [company])
 */
export function useFetch(fetcher, deps = []) {
  const [data, setData]     = useState(undefined)
  const [loading, setLoading] = useState(true)
  const [error, setError]   = useState(null)
  const abortRef = useRef(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetcher()
      setData(res)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  useEffect(() => { load() }, [load])

  return { data, loading, error, refetch: load }
}
