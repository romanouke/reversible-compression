import { useState, useRef, useCallback, useEffect } from 'react'
import { createWebSocket } from './api.js'

export function useWebSocket(jobId, onMessage, options = {}) {
  const { autoConnect = true, reconnect = true, reconnectInterval = 3000 } = options
  const [ws, setWs] = useState(null)
  const [connected, setConnected] = useState(false)
  const [error, setError] = useState(null)
  const reconnectTimeoutRef = useRef(null)

  const connect = useCallback(() => {
    if (!jobId) return

    const websocket = createWebSocket(
      jobId,
      (data) => {
        onMessage?.(data)
      },
      (event) => {
        setConnected(false)
        setWs(null)
        if (reconnect && !event.wasClean) {
          reconnectTimeoutRef.current = setTimeout(connect, reconnectInterval)
        }
      },
      (err) => {
        setError(err)
        if (onError) onError(err)
      }
    )

    websocket.onopen = () => {
      setConnected(true)
      setError(null)
    }

    setWs(websocket)
  }, [jobId, onMessage, reconnect, reconnectInterval, onError])

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
    }
    if (ws) {
      ws.close(1000, 'Client disconnect')
      setWs(null)
    }
    setConnected(false)
  }, [ws])

  const send = useCallback((data) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(data))
    }
  }, [ws])

  useEffect(() => {
    if (autoConnect && jobId) {
      connect()
    }
    return () => disconnect()
  }, [autoConnect, jobId, connect, disconnect])

  return { ws, connected, error, connect, disconnect, send }
}