import { useEffect, useRef } from 'react'
import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'

export default function useCommentWs({ postId, onMessage }) {
    const clientRef = useRef(null)

    useEffect(() => {
        if (!postId) return

        const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

        const client = new Client({
            webSocketFactory: () => new SockJS(`${API_BASE_URL}/ws-studcollab`, null, {
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

    const send = ({ content, parentId, authorName, userId }) => {
        if (!clientRef.current || !clientRef.current.connected) return
        const payload = { content, parentId, authorName }
        const destination = `/app/post.${postId}.comment`
        const currentUserId = userId
        const normalizedUserId = userId != null ? String(userId) : ''
        console.log('[WS-SEND] Destination:', destination, 'userId Header:', currentUserId)
        clientRef.current.publish({
            destination,
            body: JSON.stringify(payload),
            headers: normalizedUserId ? { userId: normalizedUserId } : {}
        })
    }

    return { send }
}
