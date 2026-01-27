import { useEffect, useRef } from 'react'
import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'

export default function usePodWs({ podId, onMessage }) {
    const clientRef = useRef(null)

    useEffect(() => {
        if (!podId) return

        const client = new Client({
            webSocketFactory: () => new SockJS('http://localhost:8080/ws-studcollab', null, {
                transports: ['websocket']
            }),
            reconnectDelay: 5000,
            onConnect: () => {
                client.subscribe(`/topic/pod.${podId}.chat`, (msg) => {
                    try {
                        const payload = JSON.parse(msg.body)
                        onMessage && onMessage(payload)
                    } catch (e) {
                        console.error('Invalid WS message', e)
                    }
                })
            },
            onStompError: (frame) => {
                console.error('STOMP error:', frame)
            }
        })

        client.activate()
        clientRef.current = client

        return () => {
            try { client.deactivate() } catch (e) { /* ignore */ }
        }
    }, [podId, onMessage])

    const send = (payload) => {
        if (!clientRef.current || !clientRef.current.connected) return
        clientRef.current.publish({ destination: `/app/pod.${podId}.chat`, body: JSON.stringify(payload) })
    }

    return { send }
}
