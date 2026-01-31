import { useState } from 'react';
import KickUserDialog from './KickUserDialog.jsx';
import PromotionDialog from './PromotionDialog.jsx';

/**
 * ✅ STAGE 3 & 4: PodMemberList Component
 * 
 * Displays pod members with role badges and context menu (3-dots).
 * 
 * Features:
 * - Shows member roles: Owner, Admin, Member
 * - Context menu only appears if current user can kick/promote target
 * - Hierarchy enforcement: Owner > Admin > Member
 * - Kick action triggers KickUserDialog
 * - Promote/Demote actions trigger PromotionDialog
 * - Leave pod action available for current user
 */
export default function PodMemberList({ pod, currentUserId, currentUserRole, onPodUpdate, onLeavePod }) {
    const [contextMenu, setContextMenu] = useState({ open: false, member: null, x: 0, y: 0 });
    const [kickDialog, setKickDialog] = useState({ open: false, member: null });
    const [promotionDialog, setPromotionDialog] = useState({ open: false, member: null, action: null });

    // Determine role hierarchy
    const getRoleHierarchy = (userId) => {
        if (pod?.ownerId === userId) return 3; // Owner
        if (pod?.adminIds?.includes(userId)) return 2; // Admin
        if (pod?.memberIds?.includes(userId)) return 1; // Member
        return 0; // Not in pod
    };

    // Check if actor can kick target (hierarchy enforcement)
    const canKick = (targetUserId) => {
        if (targetUserId === currentUserId) return false; // Can't kick self

        const actorHierarchy = getRoleHierarchy(currentUserId);
        const targetHierarchy = getRoleHierarchy(targetUserId);

        return actorHierarchy > targetHierarchy;
    };

    // Get role label
    const getRoleLabel = (userId) => {
        if (pod?.ownerId === userId) return 'Owner';
        if (pod?.adminIds?.includes(userId)) return 'Admin';
        if (pod?.memberIds?.includes(userId)) return 'Member';
        return '';
    };

    // Handle context menu open
    const handleContextMenu = (e, member) => {
        e.preventDefault();
        e.stopPropagation();

        setContextMenu({
            open: true,
            member,
            x: e.clientX,
            y: e.clientY
        });
    };

    // Handle click outside to close context menu
    const handleClickOutside = () => {
        setContextMenu({ open: false, member: null, x: 0, y: 0 });
    };

    // Handle kick action
    const handleKickClick = (member) => {
        setKickDialog({ open: true, member });
        setContextMenu({ open: false, member: null, x: 0, y: 0 });
    };

    // ✅ STAGE 4: Handle promotion action
    const handlePromoteClick = (member) => {
        setPromotionDialog({ open: true, member, action: 'promote' });
        setContextMenu({ open: false, member: null, x: 0, y: 0 });
    };

    // ✅ STAGE 4: Handle demotion action
    const handleDemoteClick = (member) => {
        setPromotionDialog({ open: true, member, action: 'demote' });
        setContextMenu({ open: false, member: null, x: 0, y: 0 });
    };

    // Get all members (combining different role lists and getting names from pod.memberNames if available)
    const allMembers = [];
    const memberIds = new Set();

    // DEBUG: Log pod structure
    console.log('🔍 PodMemberList Debug:', {
        ownerId: pod?.ownerId,
        ownerName: pod?.ownerName,
        adminIds: pod?.adminIds,
        adminNames: pod?.adminNames,
        memberIds: pod?.memberIds,
        memberNames: pod?.memberNames,
        totalAdmins: pod?.adminIds?.length || 0,
        totalMembers: pod?.memberIds?.length || 0
    });

    // ✅ DEFENSIVE: Remove duplicates from memberIds and memberNames in case backend has issues
    const cleanedMemberIds = [];
    const cleanedMemberNames = [];
    const seenIds = new Set();

    if (Array.isArray(pod?.memberIds)) {
        pod.memberIds.forEach((id, idx) => {
            if (id && !seenIds.has(id)) {
                cleanedMemberIds.push(id);
                if (pod?.memberNames?.[idx]) {
                    cleanedMemberNames.push(pod.memberNames[idx]);
                }
                seenIds.add(id);
            }
        });
    }

    // Create a map of member ID to name from pod.memberNames and adminNames if available
    const memberNameMap = {};

    // Map member names (parallel list with memberIds)
    if (cleanedMemberNames && Array.isArray(cleanedMemberNames) && cleanedMemberNames.length > 0) {
        cleanedMemberNames.forEach((name, index) => {
            if (cleanedMemberIds && cleanedMemberIds[index] && name) {
                memberNameMap[cleanedMemberIds[index]] = name;
            }
        });
    }

    // Map admin names (parallel list with adminIds)
    if (pod?.adminNames && Array.isArray(pod.adminNames) && pod.adminNames.length > 0) {
        pod.adminNames.forEach((name, index) => {
            if (pod.adminIds && pod.adminIds[index] && name) {
                memberNameMap[pod.adminIds[index]] = name;
            }
        });
    }

    // Add owner with their stored name
    if (pod?.ownerId && !memberIds.has(pod.ownerId)) {
        const ownerDisplay = pod?.ownerName && pod.ownerName.trim() ? pod.ownerName : 'Pod Owner';
        allMembers.push({
            id: pod.ownerId,
            fullName: ownerDisplay,
            role: 'Owner'
        });
        memberIds.add(pod.ownerId);
    }

    // Add admins
    if (Array.isArray(pod?.adminIds)) {
        pod.adminIds.forEach((id, index) => {
            if (!memberIds.has(id)) {
                // Try to get name from memberNameMap first, then from adminNames array
                let displayName = memberNameMap[id];
                if (!displayName && pod?.adminNames && pod.adminNames[index]) {
                    displayName = pod.adminNames[index];
                }
                if (!displayName) {
                    displayName = `Admin (${id.substring(0, 6)})`;
                }

                allMembers.push({
                    id,
                    fullName: displayName,
                    role: 'Admin'
                });
                memberIds.add(id);
            }
        });
    }

    // Add regular members (using cleaned IDs)
    if (Array.isArray(cleanedMemberIds)) {
        cleanedMemberIds.forEach((id, index) => {
            if (!memberIds.has(id)) {
                // Try to get name from memberNameMap first, then from cleaned memberNames array
                let displayName = memberNameMap[id];
                if (!displayName && cleanedMemberNames && cleanedMemberNames[index]) {
                    displayName = cleanedMemberNames[index];
                }
                if (!displayName) {
                    displayName = id.substring(0, 8);
                }

                allMembers.push({
                    id,
                    fullName: displayName,
                    role: 'Member'
                });
                memberIds.add(id);
            }
        });
    }

    console.log('✅ All Members:', allMembers);

    return (
        <div onClick={handleClickOutside} className="p-4">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-slate-300">
                    Members ({allMembers.length})
                </h3>
            </div>

            {/* Members List */}
            <div className="space-y-2">
                {allMembers.map((member) => (
                    <div
                        key={member.id}
                        className="flex items-center justify-between p-3 bg-slate-700/40 rounded-lg hover:bg-slate-700/60 transition-colors"
                    >
                        {/* Member Info */}
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                            {/* Avatar */}
                            <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                                {member.fullName?.[0]?.toUpperCase() || '?'}
                            </div>

                            {/* Name and Role */}
                            <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-white truncate">
                                    {member.id === currentUserId ? 'You' : member.fullName}
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${member.role === 'Owner'
                                        ? 'bg-yellow-500/30 text-yellow-300 border border-yellow-500/50'
                                        : member.role === 'Admin'
                                            ? 'bg-purple-500/30 text-purple-300 border border-purple-500/50'
                                            : 'bg-slate-500/30 text-slate-300 border border-slate-500/50'
                                        }`}>
                                        {member.role}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Context Menu Button */}
                        {/* Show menu if: can kick OR is Owner (for promotion) */}
                        {member.id !== currentUserId && (canKick(member.id) || pod?.ownerId === currentUserId) && (
                            <button
                                onClick={(e) => handleContextMenu(e, member)}
                                className="ml-2 p-1 text-slate-400 hover:text-white hover:bg-slate-600 rounded transition-colors"
                                title="Options"
                            >
                                <svg
                                    width="20"
                                    height="20"
                                    fill="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <circle cx="12" cy="5" r="2" />
                                    <circle cx="12" cy="12" r="2" />
                                    <circle cx="12" cy="19" r="2" />
                                </svg>
                            </button>
                        )}
                    </div>
                ))}
            </div>

            {/* Context Menu Dropdown */}
            {contextMenu.open && contextMenu.member && (
                <div
                    className="fixed bg-slate-700 rounded-lg border border-slate-600 shadow-2xl py-1 z-40 min-w-[180px]"
                    style={{
                        top: `${contextMenu.y}px`,
                        left: `${contextMenu.x}px`
                    }}
                >
                    {/* Kick Option - Show if can kick */}
                    {canKick(contextMenu.member.id) && (
                        <button
                            onClick={() => handleKickClick(contextMenu.member)}
                            className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-500/20 transition-colors"
                        >
                            Kick from Pod
                        </button>
                    )}

                    {/* ✅ STAGE 4: Promotion Options - Show if Owner */}
                    {pod?.ownerId === currentUserId && contextMenu.member.id !== currentUserId && (
                        <>
                            {/* Make Admin - Show if target is Member */}
                            {contextMenu.member.role === 'Member' && (
                                <button
                                    onClick={() => handlePromoteClick(contextMenu.member)}
                                    className="w-full text-left px-4 py-2 text-sm text-green-400 hover:bg-green-500/20 transition-colors"
                                >
                                    Make Admin
                                </button>
                            )}

                            {/* Remove Admin - Show if target is Admin */}
                            {contextMenu.member.role === 'Admin' && (
                                <button
                                    onClick={() => handleDemoteClick(contextMenu.member)}
                                    className="w-full text-left px-4 py-2 text-sm text-yellow-400 hover:bg-yellow-500/20 transition-colors"
                                >
                                    Remove Admin
                                </button>
                            )}
                        </>
                    )}
                </div>
            )}

            {/* Kick Dialog */}
            <KickUserDialog
                isOpen={kickDialog.open}
                podId={pod?.id}
                targetUser={kickDialog.member}
                actorId={currentUserId}
                onClose={() => setKickDialog({ open: false, member: null })}
                onSuccess={() => {
                    // Refresh pod data
                    if (onPodUpdate) {
                        onPodUpdate();
                    }
                }}
            />

            {/* ✅ STAGE 4: Promotion Dialog */}
            <PromotionDialog
                isOpen={promotionDialog.open}
                podId={pod?.id}
                targetUser={promotionDialog.member}
                actorId={currentUserId}
                action={promotionDialog.action}
                onClose={() => setPromotionDialog({ open: false, member: null, action: null })}
                onSuccess={() => {
                    // Refresh pod data
                    if (onPodUpdate) {
                        onPodUpdate();
                    }
                }}
            />
        </div>
    );
}
