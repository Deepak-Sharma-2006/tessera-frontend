import { useEffect, useRef } from 'react'
import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'

export default function useCommentWs({ postId, onMessage }) {
    const clientRef = useRef(null)

    useEffect(() => {
        if (!postId) return

        const client = new Client({
            webSocketFactory: () => new SockJS('http://localhost:8080/ws-studcollab', null, {
                transports: ['websocket']
            }),
            reconnectDelay: 5000,
            onConnect: () => {
                client.subscribe(`/topic/post.${postId}.comments`, (msg) => {
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
            try { client.deactivate() } catch {
                // ignore
            }
        }
    }, [postId, onMessage])

    const send = ({ content, parentId, authorName }) => {
        if (!clientRef.current || !clientRef.current.connected) return
        const payload = { content, parentId, authorName }
        clientRef.current.publish({ destination: `/app/post.${postId}.comment`, body: JSON.stringify(payload) })
    }

    return { send }
}
