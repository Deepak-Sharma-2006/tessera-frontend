import { useEffect, useRef } from 'react'
import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'

/**
 * Custom hook for real-time XP updates via WebSocket
 * Subscribes to user-specific XP updates and notifies the component
 *
 * @param {string} userId - The ID of the user to subscribe to
 * @param {Function} onXpUpdate - Callback function when XP update is received
 */
export default function useXpWs({ userId, onXpUpdate }) {
    const clientRef = useRef(null)

    useEffect(() => {
        if (!userId) {
            console.log('⚠️  [useXpWs] No userId provided, skipping WebSocket connection')
            return
        }

        console.log('🔌 [useXpWs] Connecting to WebSocket for userId:', userId)

        const client = new Client({
            webSocketFactory: () => new SockJS('http://localhost:8080/ws-studcollab', null, {
                transports: ['websocket']
            }),
            reconnectDelay: 5000,
            onConnect: () => {
                console.log('✅ [useXpWs] WebSocket connected! Subscribing to topics...')
                
                // Subscribe to user-specific XP updates
                client.subscribe(`/user/${userId}/topic/xp-updates`, (msg) => {
                    try {
                        console.log('📨 [useXpWs] Received XP update message:', msg.body)
                        const updatedUser = JSON.parse(msg.body)
                        console.log('📊 [useXpWs] Parsed user data:', updatedUser)
                        onXpUpdate && onXpUpdate(updatedUser)
                        console.log('✔️  [useXpWs] onXpUpdate callback executed')
                    } catch (e) {
                        console.error('❌ [useXpWs] Invalid XP WS message', e)
                    }
                })
                console.log('✅ [useXpWs] Subscribed to /user/' + userId + '/topic/xp-updates')

                // Also subscribe to global level-up notifications
                client.subscribe(`/topic/level-ups`, (msg) => {
                    try {
                        const notification = msg.body
                        console.log('🎉 [useXpWs] Level-up notification:', notification)
                    } catch (e) {
                        console.error('❌ [useXpWs] Invalid level-up notification', e)
                    }
                })
                console.log('✅ [useXpWs] Subscribed to /topic/level-ups')
            },
            onStompError: (frame) => {
                console.error('❌ [useXpWs] STOMP error in XP WebSocket:', frame)
            },
            onDisconnect: () => {
                console.log('⚠️  [useXpWs] WebSocket disconnected')
            }
        })

        clientRef.current = client
        console.log('🚀 [useXpWs] Activating STOMP client...')
        client.activate()

        return () => {
            console.log('🔌 [useXpWs] Cleaning up WebSocket connection')
            if (clientRef.current) {
                clientRef.current.deactivate()
            }
        }
    }, [userId, onXpUpdate])
}
