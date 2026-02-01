import React, { useState, useEffect, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Sphere, MeshDistortMaterial, Stars, Float, Text } from '@react-three/drei';
import { motion, AnimatePresence } from 'framer-motion';
import api, { getDiscoveryMesh, sendCollabInvite } from '@/lib/api';

/**
 * Global Discovery Mesh Component - 3D Edition
 * 
 * Displays top 5 skill-matched collaborators in a 3D revolving mesh.
 * Features:
 * - Real-time data from /api/discovery/mesh endpoint
 * - Skill-based Jaccard similarity matching (global, no college filter)
 * - 3D sphere visualization with Three.js/React Three Fiber
 * - Interactive hover tooltips with collaboration invite
 * - Floating particles and animated background
 * - WebGL rendering with proper context handling
 */
export default function DiscoveryMesh({ user }) {
  const [candidates, setCandidates] = useState([]);
  const [hoveredUser, setHoveredUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentUser, setCurrentUser] = useState(user);

  useEffect(() => {
    if (user) {
      setCurrentUser(user);
    }
  }, [user]);

  useEffect(() => {
    const fetchMesh = async () => {
      try {
        const token = localStorage.getItem('token') || localStorage.getItem('jwt_token');
        console.log('🔑 Token available:', !!token);
        
        const res = await getDiscoveryMesh();
        console.log('✅ Discovery mesh loaded:', res.data);
        console.log('📊 Total candidates:', res.data?.length || 0);
        
        // Filter out self and ensure we have valid data
        const validCandidates = (res.data || []).filter(u => 
          u && u.id && u.id !== currentUser?.id && u.id !== user?.id
        );
        setCandidates(validCandidates);
        
        if (validCandidates.length === 0) {
          console.warn('⚠️ No candidates returned from API');
        }
      } catch (err) {
        console.error('❌ Failed to load discovery mesh:', err);
        console.error('Response status:', err.response?.status);
        console.error('Response data:', err.response?.data);
        setError('Failed to load discovery mesh. Please try again.');
        setCandidates([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchMesh();
  }, []);

  const sendInvite = async (userId) => {
    try {
      // Get the authenticated user's ID from localStorage as backup
      const token = localStorage.getItem('token') || localStorage.getItem('jwt_token');
      let senderId = currentUser?.id;
      
      // If currentUser.id is not set, try to get it from the user prop
      if (!senderId && user?.id) {
        senderId = user.id;
      }
      
      console.log('📤 Sending invite:');
      console.log('   Current User ID:', currentUser?.id);
      console.log('   User Prop ID:', user?.id);
      console.log('   Final Sender ID:', senderId);
      console.log('   Target (Recipient) ID:', userId);
      console.log('   Are they different?:', senderId !== userId);
      
      if (!senderId) {
        alert('❌ Error: Could not determine your user ID. Please refresh the page.');
        return;
      }
      
      if (senderId === userId) {
        alert('❌ You cannot send an invite to yourself!');
        return;
      }
      
      const response = await sendCollabInvite(userId, senderId);
      
      console.log('✅ Invite sent successfully:', response.data);
      alert('✨ Collab invite sent! They will see it in their Inbox.');
      setHoveredUser(null);
    } catch (err) {
      console.error('❌ Error sending invite:', err);
      console.error('Error message:', err.message);
      console.error('Response status:', err.response?.status);
      console.error('Response data:', err.response?.data);
      alert(`Failed to send invite: ${err.response?.data?.error || err.message || 'Unknown error'}`);
    }
  };

  // 3D Sphere Component
  const FloatingUser = ({ user, index }) => {
    const angle = (index / Math.max(candidates.length, 1)) * Math.PI * 2;
    const x = Math.cos(angle) * 2.5;
    const z = Math.sin(angle) * 2.5;

    return (
      <Float speed={1.5} rotationIntensity={0.5} floatIntensity={2}>
        <mesh
          position={[x, Math.sin(index) * 0.5, z]}
          scale={0.6}
          onClick={() => setHoveredUser(user)}
          onPointerEnter={() => setHoveredUser(user)}
          onPointerLeave={() => setHoveredUser(null)}
        >
          <Sphere args={[1, 32, 32]}>
            <MeshDistortMaterial
              color="#00ffff"
              distort={0}
              speed={0}
              roughness={0.15}
              metalness={1}
            />
          </Sphere>
          <Text
            position={[0, 0, 1.1]}
            fontSize={0.4}
            color="#ffffff"
            fontWeight="bold"
            anchorX="center"
            anchorY="middle"
          >
            {user.fullName?.charAt(0)?.toUpperCase() || '?'}
          </Text>
        </mesh>
      </Float>
    );
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="h-[600px] w-full flex items-center justify-center bg-[#0a0a14] rounded-[40px] border border-white/5 overflow-hidden">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-full border-2 border-cyan-500 border-t-transparent animate-spin" />
          <p className="text-cyan-400 font-black italic tracking-widest text-sm">
            SCANNING GLOBAL HUB...
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="h-[600px] w-full flex items-center justify-center bg-[#0a0a14] rounded-[40px] border border-white/5 overflow-hidden">
        <div className="text-center">
          <p className="text-red-400 font-bold">{error}</p>
        </div>
      </div>
    );
  }

  // Empty state
  if (candidates.length === 0) {
    return (
      <div className="h-[600px] w-full flex items-center justify-center bg-[#0a0a14] rounded-[40px] border border-white/5 overflow-hidden">
        <div className="text-center">
          <div className="w-24 h-24 mx-auto mb-4 rounded-full border-2 border-cyan-500/20 flex items-center justify-center">
            <span className="text-4xl">🔍</span>
          </div>
          <p className="text-cyan-400 font-black text-lg">NO MATCHES YET</p>
          <p className="text-white/50 text-sm mt-2">Complete your profile and add skills to find collaborators</p>
        </div>
      </div>
    );
  }

  // 3D Mesh Rendering
  return (
    <div className="relative h-[600px] w-full rounded-[40px] border border-white/5 overflow-hidden bg-[#0a0a14]">
      {/* 3D Canvas */}
      <Canvas camera={{ position: [0, 0, 5], fov: 75 }}>
        <Stars />
        <ambientLight intensity={0.8} />
        <pointLight position={[10, 10, 10]} intensity={1.5} color="#00ffff" />
        <pointLight position={[-10, -10, 10]} intensity={1.2} color="#ff00ff" />
        <pointLight position={[0, 5, 10]} intensity={0.8} color="#00d9ff" />
        
        <Suspense fallback={null}>
          {/* Central User Sphere with Name - Pink/Magenta */}
          <Float speed={1} rotationIntensity={0.5} floatIntensity={1}>
            <mesh position={[0, 0, 0]} scale={1}>
              <Sphere args={[1, 64, 64]}>
                <MeshDistortMaterial
                  color="#ff00ff"
                  distort={0}
                  speed={0}
                  roughness={0.2}
                  metalness={1}
                />
              </Sphere>
            </mesh>
            {/* Current User Name in Center */}
            <Text
              position={[0, 0, 1.2]}
              fontSize={0.6}
              color="#ffffff"
              fontWeight="900"
              anchorX="center"
              anchorY="middle"
              letterSpacing={0.05}
            >
              YOU
            </Text>
          </Float>

          {/* Orbiting Users - Slower rotation */}
          {candidates.map((user, i) => (
            <FloatingUser key={user.id} user={user} index={i} />
          ))}
        </Suspense>
        
        {/* Much slower orbit speed - reduced from 2 to 0.5 */}
        <OrbitControls autoRotate autoRotateSpeed={0.5} enableZoom />
      </Canvas>

      {/* Hover Profile Card - Enhanced UI/UX */}
      <AnimatePresence>
        {hoveredUser && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.8 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="absolute bottom-12 left-1/2 transform -translate-x-1/2 p-6 bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460] backdrop-blur-2xl border border-cyan-400/40 rounded-3xl shadow-[0_25px_80px_rgba(0,255,255,0.2)] z-[100] w-80"
          >
            {/* Top accent line */}
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: 100 }}
              transition={{ delay: 0.15, duration: 0.5 }}
              className="h-1.5 bg-gradient-to-r from-cyan-400 to-magenta-500 rounded-full mx-auto mb-5"
            />

            {/* Profile info */}
            <div className="text-center space-y-2">
              <h4 className="text-white font-black text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-cyan-300 to-blue-300">
                {hoveredUser.fullName}
              </h4>

              <p className="text-cyan-300 text-xs font-bold uppercase tracking-widest opacity-80">
                {hoveredUser.collegeName || 'Unknown'} • {hoveredUser.yearOfStudy || 'N/A'} • {hoveredUser.department || 'N/A'}
              </p>
            </div>

            {/* Skills section */}
            <div className="mt-5 pt-4 border-t border-cyan-400/20">
              <p className="text-cyan-300 text-[10px] font-bold uppercase tracking-widest mb-3 opacity-70">📚 Top Skills</p>
              <div className="flex flex-wrap justify-center gap-2">
                {hoveredUser.skills && hoveredUser.skills.slice(0, 3).map((skill, idx) => (
                  <motion.span
                    key={skill}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + idx * 0.1, duration: 0.4 }}
                    className="px-3 py-1.5 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-400/50 rounded-full text-[10px] text-cyan-200 font-bold uppercase tracking-wider hover:border-cyan-300/80 transition-all"
                  >
                    {skill}
                  </motion.span>
                ))}
              </div>
            </div>

            {/* CTA Button */}
            <motion.button
              onClick={() => sendInvite(hoveredUser.id)}
              whileHover={{ scale: 1.08, boxShadow: '0 0 30px rgba(0, 255, 255, 0.6)' }}
              whileTap={{ scale: 0.92 }}
              className="w-full mt-6 py-3.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-black rounded-xl transition-all shadow-[0_0_25px_rgba(0,215,255,0.4)] hover:shadow-[0_0_40px_rgba(0,215,255,0.6)] uppercase tracking-widest"
            >
              ✨ Initialize Collaboration
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
