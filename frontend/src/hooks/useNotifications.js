import { useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export function useRealtimeNotifications() {
    
    // 1. Ask user for permission on load
    useEffect(() => {
        if ("Notification" in window && Notification.permission !== "granted") {
            Notification.requestPermission();
        }
    }, []);

    useEffect(() => {
        if (!supabase) return;

        // 2. Listener for Machine Errors
        const machineChannel = supabase
            .channel('machine-alerts')
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'machines' },
                (payload) => {
                    const newStatus = payload.new.status;
                    const oldStatus = payload.old.status;
                    const machineName = payload.new.name;

                    // If it just went into error, notify!
                    if (newStatus === 'error' && oldStatus !== 'error') {
                        sendNotification(
                            "🚨 Machine Error Detected!", 
                            `Machine ${machineName} has stopped and needs attention.`
                        );
                    }
                }
            )
            .subscribe();

        // 3. Listener for Low Inventory
        const inventoryChannel = supabase
            .channel('inventory-alerts')
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'material_inventory' },
                (payload) => {
                    const newStatus = payload.new.status;
                    const oldStatus = payload.old.status;
                    const itemName = payload.new.name;

                    // If it just dropped to critical or low, notify!
                    if ((newStatus === 'critical' || newStatus === 'low') && oldStatus === 'ok') {
                        sendNotification(
                            "⚠️ Material Running Low!", 
                            `Stock for ${itemName} needs attention immediately.`
                        );
                    }
                }
            )
            .subscribe();

        // Cleanup listeners when app closes
        return () => {
            supabase.removeChannel(machineChannel);
            supabase.removeChannel(inventoryChannel);
        };
    }, []);

    // Helper to trigger the browser popup
    function sendNotification(title, body) {
        if ("Notification" in window && Notification.permission === "granted") {
            new Notification(title, { 
                body,
                icon: '/favicon.ico'
            });
        }
    }

    return null;
}
