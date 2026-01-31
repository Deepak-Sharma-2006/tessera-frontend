import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '@/lib/api.js';
import { Card } from './ui/card.jsx';
import { Button } from './ui/button.jsx';
import { Input } from './ui/input.jsx';
import { Textarea } from './ui/textarea.jsx';
import MultiSelect from './ui/MultiSelect.jsx';
import { SKILLS_LIBRARY, ROLES_LIBRARY, INTERESTS_LIBRARY } from '@/utils/constants.js';

// Main component
export default function LoginFlow({ onComplete, initialFlowState, user }) {
  const navigate = useNavigate();

  // ✅ Helper to extract college from email domain
  const deriveCollege = (email) => {
    if (!email) return 'IIT'; // Default fallback
    
    const domain = email.toLowerCase().split('@')[1] || '';
    
    // College mappings based on email domain
    const collegeMap = {
      'iit': 'IIT',
      'mit': 'MIT',
      'stanford': 'Stanford',
      'sinhgad': 'Sinhgad',
      'symbiosis': 'SYMBIOSIS',
      'manipal': 'Manipal',
      'vit': 'VIT',
      'bits': 'BITS Pilani'
    };
    
    // Check if domain contains any known college
    for (const [key, collegeName] of Object.entries(collegeMap)) {
      if (domain.includes(key)) {
        return collegeName;
      }
    }
    
    // If no match found, try to use the domain name itself
    const domainPrefix = domain.split('.')[0].toUpperCase();
    return domainPrefix || 'Unknown College';
  };

  // Sets the starting step based on whether the user was redirected from LinkedIn
  // Options: 'EMAIL', 'LOGIN', 'REGISTER', 'password', 'linkedin', 'step1', etc.
  const [currentStep, setCurrentStep] = useState(initialFlowState.step || 'EMAIL');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // ✅ LOCAL USER STATE: Track user info locally without waiting for parent re-render
  // This allows Step handlers to access userId immediately after login
  const [activeUser, setActiveUser] = useState(user);

  // ✅ SMART STATE: Derive college name from email if not in DB
  const [formData, setFormData] = useState({
    // Identity
    username: user?.username || '',
    fullName: user?.fullName || '',
    email: user?.email || '',

    // Academic - SMART FIX: If DB has no college, derive it from email
    collegeName: user?.collegeName || deriveCollege(user?.email),
    yearOfStudy: user?.yearOfStudy || '',
    department: user?.department || '',

    // Lists
    skills: user?.skills || [],
    interests: user?.interests || [],
    roles: user?.roles || [],
    rolesOpenTo: user?.rolesOpenTo || [],
    excitingTags: user?.excitingTags || [],

    // Text
    bio: user?.bio || '',
    description: user?.description || '',
    goals: user?.goals || '',

    // Links
    githubProfile: user?.githubProfile || '',
    portfolioUrl: user?.portfolioUrl || '',
    linkedInProfile: user?.linkedInProfile || '',
    linkedinUrl: user?.linkedinUrl || '',

    // Image - Explicitly ignore
    profilePicture: ''
  });

  // Pre-populates the form with data fetched after the LinkedIn redirect
  useEffect(() => {
    if (initialFlowState.data) {
      setFormData(prev => ({ ...prev, ...initialFlowState.data }));
    }
  }, [initialFlowState]);

  // Resume onboarding logic: If user is authenticated but profile incomplete, skip to the right step
  useEffect(() => {
    if (user) {
      // ✅ FINAL FIX: ONLY check if the user has a username.
      // If they have a username, they are "Complete enough" to enter the app.
      // DO NOT check for collegeName, year, or department here.
      if (!user.username) {
        // Pre-populate form with user data
        setFormData(prev => ({ ...prev, ...user }));
        // Skip straight to step1 (no email/password screens needed)
        setCurrentStep('step1');
      }
      // Else: Do nothing. Let them stay on the current screen or go to dashboard.
    }
  }, [user]);

  // ✅ DATA SYNC FIX: Watch for the 'user' object to load and sync formData
  useEffect(() => {
    if (user && user.email) {
      // Sync all profile data from database
      setFormData(prev => ({
        ...prev,
        email: user.email,
        username: user.username || prev.username,
        fullName: user.fullName || prev.fullName,
        // AUTO-DETECT COLLEGE:
        collegeName: user.collegeName || (user.email.includes('iit') ? 'IIT' : 'Unknown College'),

        // Ensure other fields are synced if they exist in DB
        yearOfStudy: user.yearOfStudy || prev.yearOfStudy,
        department: user.department || prev.department,
        bio: user.bio || prev.bio,
        
        // ✅ CRITICAL FIX: Sync skills, roles, interests from DB
        skills: user.skills && user.skills.length > 0 ? user.skills : prev.skills,
        rolesOpenTo: user.rolesOpenTo && user.rolesOpenTo.length > 0 ? user.rolesOpenTo : prev.rolesOpenTo,
        excitingTags: user.excitingTags && user.excitingTags.length > 0 ? user.excitingTags : prev.excitingTags,
        interests: user.interests && user.interests.length > 0 ? user.interests : prev.interests,
        
        // ✅ Sync other profile data
        goals: user.goals || prev.goals,
        githubUrl: user.githubUrl || prev.githubUrl,
        portfolioUrl: user.portfolioUrl || prev.portfolioUrl,
        profilePicUrl: user.profilePicUrl || prev.profilePicUrl,
        linkedinUrl: user.linkedinUrl || prev.linkedinUrl,
        linkedInProfile: user.linkedInProfile || prev.linkedInProfile
      }));
    }
  }, [user]); // Run whenever 'user' updates

  // ✅ AUTO-SAVE FIX: Sync React State to LocalStorage
  useEffect(() => {
    // Whenever 'user' changes (e.g., after login), save it to storage
    if (user && user.token) {
      console.log("💾 Saving User to Storage:", user); // Debug log
      localStorage.setItem('user', JSON.stringify(user));

      // ✅ FORCE SAVE: Save the token in dedicated jwt_token box (priority key)
      console.log("🔐 AUTO-SAVE TOKEN:", user.token);
      localStorage.setItem('jwt_token', user.token); // Priority token key
      localStorage.setItem('token', user.token);
    }
  }, [user]);

  const [emailValid, setEmailValid] = useState(false);
  const [password, setPassword] = useState('');

  // --- Options ---
  const yearOptions = ['1st Year', '2nd Year', '3rd Year', '4th Year', 'PG/Masters', 'PhD'];
  const departmentOptions = ['Computer Science', 'Information Technology', 'Electronics', 'Mechanical', 'Other'];

  // --- INPUT HANDLERS ---
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleEmailChange = (e) => {
    const email = e.target.value;
    setFormData(prev => ({ ...prev, email }));
    validateCollegeEmail(email);
  };

  const toggleArrayItem = (field, value) => {
    setFormData(prev => {
      const currentArray = prev[field] || [];
      return {
        ...prev,
        [field]: currentArray.includes(value) ? currentArray.filter(item => item !== value) : [...currentArray, value]
      };
    });
  };

  // --- BACKEND API CALLS ---
  const handleEmailSubmit = async () => {
    if (!emailValid) return;
    setIsLoading(true);
    setError('');
    try {
      // Call /api/auth/check-email to see if user exists
      const response = await api.post('/api/auth/check-email', { email: formData.email });
      const data = response.data;

      // Branch based on whether email exists
      if (data.exists) {
        setCurrentStep('LOGIN'); // Go to login password screen
      } else {
        setCurrentStep('REGISTER'); // Go to registration password screen
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async () => {
    setIsLoading(true);
    setError('');
    try {
      // Call /api/auth/register
      const response = await api.post('/api/auth/register', {
        email: formData.email,
        password: password
      });

      // Show success alert and reset to email step
      alert('Account created! Please log in.');
      setCurrentStep('EMAIL');
      setPassword('');
      setFormData(prev => ({ ...prev, email: '' }));
      setEmailValid(false);
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCollegeEmailSubmit = async () => {
    if (!emailValid) return;
    await handleEmailSubmit();
  };

  const handleLogin = async (password) => {
    setIsLoading(true);
    setError('');
    try {
      const response = await api.post('/api/auth/login', {
        email: formData.email,
        password: password
      });
      const data = response.data;

      // ✅ CRITICAL FIX: Save the FULL response data to localStorage immediately
      console.log("📥 Login Response:", data); // Debug log
      localStorage.setItem('user', JSON.stringify(data));
      if (data.token) {
        console.log("🔐 FORCE SAVING TOKEN:", data.token);
        localStorage.setItem('jwt_token', data.token); // Priority token key
        localStorage.setItem('token', data.token);
      }

      // ✅ FIX: Set local activeUser state immediately so Step 1 can access userId
      console.log("🔄 Setting activeUser to:", data);
      setActiveUser(data);

      // Save the complete user data with ALL profile fields
      const userData = {
        id: data.email,  // <-- Use email as ID
        email: data.email,
        fullName: data.fullName,
        userId: data.userId,  // Keep the backend ID as well
        profileCompleted: data.profileCompleted,
        // ✅ CRITICAL: Include all profile data from server response
        skills: data.skills || [],
        rolesOpenTo: data.rolesOpenTo || [],
        excitingTags: data.excitingTags || [],
        interests: data.interests || [],
        goals: data.goals || '',
        githubUrl: data.githubUrl || '',
        portfolioUrl: data.portfolioUrl || '',
        profilePicUrl: data.profilePicUrl || '',
        yearOfStudy: data.yearOfStudy || '',
        department: data.department || '',
        collegeName: data.collegeName || '',
        // Include all other fields from response
        ...data
      };

      setFormData(prev => ({ ...prev, ...userData }));

      // ✅ CRITICAL FIX: Check profileCompleted flag, not username
      if (data.profileCompleted === true) {
        // Existing user - go directly to campus
        console.log("✅ Profile already completed. Redirecting to /campus");
        onComplete(data);
        navigate('/campus');
      } else {
        // New user - go to onboarding (step1)
        console.log("📝 Profile incomplete. Starting setup wizard");
        setCurrentStep('step1');
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleProfilePictureUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError("File size must be less than 5MB");
      return;
    }

    if (!['image/jpeg', 'image/png', 'image/jpg'].includes(file.type)) {
      setError("Only JPG and PNG files are allowed");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData(prev => ({
        ...prev,
        profilePicture: file,
        profilePicUrl: reader.result
      }));
    };
    reader.readAsDataURL(file);
  };

  const isValidGitHubUrl = (url) => {
    if (!url) return false;
    try {
      const urlObj = new URL(url);
      return urlObj.hostname === 'github.com' && url.includes('github.com');
    } catch (e) {
      return false;
    }
  };

  const handleStep1Continue = async () => {
    console.log("🖱️ Step 1 'Next' Button Clicked! (Profile Endpoint)");

    // 1. GET DATA FROM FORMDATA
    const nameVal = formData.fullName?.trim() || '';
    const collegeVal = formData.collegeName || 'IIT';
    const yearVal = formData.yearOfStudy || '';
    const deptVal = formData.department || '';

    // 2. VALIDATE REQUIRED FIELDS
    if (!nameVal) {
      console.error("❌ Full name is empty");
      setError("Please enter your full name.");
      return;
    }

    if (!yearVal) {
      console.error("❌ Year of study is empty");
      setError("Please select your year of study.");
      return;
    }

    if (!deptVal) {
      console.error("❌ Department is empty");
      setError("Please select your department.");
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      console.log("🖱️ Using /users/{userId} endpoint");

      // Get userId from activeUser
      const userId = activeUser?.id || formData.userId;
      if (!userId) {
        setError("User ID not found. Please log in again.");
        setIsLoading(false);
        return;
      }

      // Update payload with all profile data
      const cleanPayload = {
        fullName: nameVal,
        collegeName: collegeVal,
        yearOfStudy: yearVal,
        department: deptVal,
        id: userId,
        email: activeUser?.email,
        username: activeUser?.username
      };

      console.log("📦 Sending Clean Payload to /users/" + userId + ":", cleanPayload);

      const res = await api.put(`/api/users/${userId}`, cleanPayload);

      console.log("✅ Update Success:", res.data);

      // Update Local State with response
      setFormData(prev => ({ ...prev, ...res.data }));

      console.log("✅ Form data updated. Moving to Step 2...");

      // Move to next step
      setCurrentStep('step2');
    } catch (err) {
      console.error("❌ Step 1 API Error:", err);
      console.error("Error response:", err.response?.data);

      // Detailed Error Message
      const msg = err.response?.data?.message || err.response?.data?.error || err.message || "Failed to save profile.";
      setError(`Error: ${msg}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStep2Continue = async () => {
    // ✅ FIX: Validate skills selection
    if (!formData.skills || formData.skills.length === 0) {
      setError("Please select at least one skill.");
      return;
    }

    // ✅ FIX: Use local activeUser state first, fallback to prop
    const currentUser = activeUser || user;
    if (!currentUser) {
      setError("Session invalid. Please log in again.");
      return;
    }

    const activeId = currentUser?.userId || currentUser?.id;
    if (!activeId) {
      setError("User ID not found. Please log in again.");
      return;
    }

    try {
      setIsLoading(true);
      setError('');

      console.log("📤 Step 2: Sending skills to /api/users/" + activeId);

      // ✅ FIX: Send SKILLS Payload to correct endpoint
      await api.put(`/api/users/${activeId}`, {
        userId: activeId,
        skills: formData.skills
      });

      console.log("✅ Step 2 saved successfully");

      // ✅ FIX: Move to Step 3 (Roles/Interests)
      setCurrentStep('step3');
    } catch (err) {
      console.error("Step 2 Failed:", err);
      setError("Failed to save skills. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();

    // ✅ FIX 1: Use local activeUser state first, fallback to prop
    const currentUser = activeUser || user;

    // ✅ FIX 2: Correct ID Check - Use 'userId' (what server sends) OR 'id' (fallback)
    if (!currentUser) {
      console.error("User session invalid - no user object found");
      setError("User session invalid. Please log in again.");
      return;
    }

    const activeId = currentUser?.userId || currentUser?.id;

    if (!activeId) {
      console.error("User ID missing in Step 4");
      setError("User session invalid. Please log in again.");
      return;
    }

    setIsLoading(true);
    setError('');
    try {
      console.log("📤 Step 4: Submitting final profile to /api/users/" + activeId);

      // ✅ FIX 3: Use ID in URL with /api prefix and save all fields
      const response = await api.put(`/api/users/${activeId}`, {
        username: formData.username,
        fullName: formData.fullName,
        skills: formData.skills,
        rolesOpenTo: formData.rolesOpenTo,
        excitingTags: formData.excitingTags,
        goals: formData.goals,
        githubUrl: formData.githubUrl,
        portfolioUrl: formData.portfolioUrl,
        profilePicUrl: formData.profilePicUrl,
        yearOfStudy: formData.yearOfStudy,
        department: formData.department,
        collegeName: formData.collegeName,
        ...formData
      });

      console.log("✅ Step 4 completed successfully");

      // ✅ FIX 4: Axios returns data in 'response.data', not 'response.json()'
      const updatedUser = response.data;

      // Update Local State & Finish
      const finalUser = { ...currentUser, ...updatedUser, profileCompleted: true };

      // Update local activeUser
      setActiveUser(finalUser);

      if (onComplete) {
        onComplete(finalUser);
      }
    } catch (err) {
      console.error("Profile update failed:", err);
      setError(err.response?.data?.error || "Failed to update profile.");
    } finally {
      setIsLoading(false);
    }
  };

  const goToDashboard = () => {
    console.log("🚀 Finalizing Profile...");

    // 1. Get current data
    const savedUser = localStorage.getItem('user');

    if (savedUser) {
      const userObj = JSON.parse(savedUser);

      // 2. STAMP IT: Manually set profile to true
      userObj.profileCompleted = true;

      // 3. Save it back to storage
      localStorage.setItem('user', JSON.stringify(userObj));

      // 4. Call onComplete to update parent state
      if (onComplete) {
        onComplete(userObj);
      }
    }

    // 5. Navigate to Campus using React Router
    navigate('/campus');
  };

  const validateCollegeEmail = (email) => {
    const collegePattern = /^[^\s@]+@[^\s@]+\.(edu|ac\.in|edu\.in)$/i;
    const isValid = collegePattern.test(email);
    setEmailValid(isValid);
    if (isValid) {
      const domain = email.split('@')[1];
      const collegeName = domain.split('.')[0].toUpperCase().replace(/[^A-Z]/g, ' ');
      setFormData(prev => ({ ...prev, email, collegeName }));
    } else {
      setFormData(prev => ({ ...prev, email }));
    }
  };

  // --- RENDER METHODS ---
  // EMAIL STEP: Show initial email input
  if (currentStep === 'EMAIL') {
    return (
      <div className="flow-login-signup min-h-screen bg-gradient-to-br from-primary/5 via-background to-purple-500/5 flex items-center justify-center p-4">
        <Card className="frame-login-start w-full max-w-md p-8">
          <div className="text-center mb-8">
            <div className="logo-looped w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-primary to-purple-600 rounded-2xl flex items-center justify-center"><span className="text-white text-2xl font-bold">L</span></div>
            <h1 className="title-welcome-msg text-3xl font-bold mb-2">Welcome to Looped 🚀</h1>
            <p className="text-muted-foreground">Connect, collaborate, and build amazing things together</p>
          </div>
          <div className="space-y-6">
            <div>
              <Input
                className="input-college-email"
                placeholder="Enter your college email (e.g. you@iitb.ac.in)"
                value={formData.email}
                onChange={handleEmailChange}
                onKeyDown={(e) => e.key === 'Enter' && emailValid && handleEmailSubmit()}
              />
              {formData.email && !emailValid && (<p className="text-destructive text-sm mt-1">Please enter a valid college email.</p>)}
              {emailValid && (<p className="text-green-600 text-sm mt-1">✓ Valid college email detected</p>)}
              {error && <p className="text-destructive text-sm mt-1">{error}</p>}
            </div>
            <Button className="btn-signin w-full" onClick={handleEmailSubmit} disabled={!emailValid || isLoading}>
              {isLoading ? 'Checking...' : 'Continue'}
            </Button>
            <p className="note-college-validation text-sm text-muted-foreground text-center">Only .edu or college domains allowed</p>
          </div>
        </Card>
      </div>
    );
  }

  // LOGIN STEP: Show password input for existing users
  if (currentStep === 'LOGIN') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-purple-500/5 flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-primary to-purple-600 rounded-2xl flex items-center justify-center"><span className="text-white text-2xl font-bold">L</span></div>
            <h2 className="text-2xl font-bold mb-2">Welcome Back</h2>
            <p className="text-muted-foreground">{formData.email}</p>
          </div>
          <div className="space-y-6">
            <div>
              <Input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && password && handleLogin(password)}
              />
              {error && <p className="text-destructive text-sm mt-1">{error}</p>}
            </div>
            <Button className="w-full" onClick={() => handleLogin(password)} disabled={!password || isLoading}>
              {isLoading ? 'Signing In...' : 'Sign In'}
            </Button>
            <Button variant="outline" className="w-full" onClick={() => {
              setPassword('');
              setError('');
              setCurrentStep('EMAIL');
            }} disabled={isLoading}>
              Back
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // REGISTER STEP: Show password creation for new users
  if (currentStep === 'REGISTER') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-purple-500/5 flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-primary to-purple-600 rounded-2xl flex items-center justify-center"><span className="text-white text-2xl font-bold">L</span></div>
            <h2 className="text-2xl font-bold mb-2">Create Account</h2>
            <p className="text-muted-foreground">{formData.email}</p>
          </div>
          <div className="space-y-6">
            <div>
              <Input
                type="password"
                placeholder="Create a password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && password && handleRegister()}
              />
              {error && <p className="text-destructive text-sm mt-1">{error}</p>}
            </div>
            <Button className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700" onClick={handleRegister} disabled={!password || isLoading}>
              {isLoading ? 'Registering...' : 'Register'}
            </Button>
            <Button variant="outline" className="w-full" onClick={() => {
              setPassword('');
              setError('');
              setCurrentStep('EMAIL');
            }} disabled={isLoading}>
              Back
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // LEGACY SUPPORT: Handle old 'login' and 'password' step names
  if (currentStep === 'login') {
    return (
      <div className="flow-login-signup min-h-screen bg-gradient-to-br from-primary/5 via-background to-purple-500/5 flex items-center justify-center p-4">
        <Card className="frame-login-start w-full max-w-md p-8">
          <div className="text-center mb-8">
            <div className="logo-looped w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-primary to-purple-600 rounded-2xl flex items-center justify-center"><span className="text-white text-2xl font-bold">L</span></div>
            <h1 className="title-welcome-msg text-3xl font-bold mb-2">Welcome to Looped 🚀</h1>
            <p className="text-muted-foreground">Connect, collaborate, and build amazing things together</p>
          </div>
          <div className="space-y-6">
            <div>
              <Input
                className="input-college-email"
                placeholder="Enter your college email (e.g. you@iitb.ac.in)"
                value={formData.email}
                onChange={handleEmailChange}
                onKeyDown={(e) => e.key === 'Enter' && emailValid && handleCollegeEmailSubmit()}
              />
              {formData.email && !emailValid && (<p className="text-destructive text-sm mt-1">Please enter a valid college email.</p>)}
              {emailValid && (<p className="text-green-600 text-sm mt-1">✓ Valid college email detected</p>)}
              {error && <p className="text-destructive text-sm mt-1">{error}</p>}
            </div>
            <Button className="btn-signin w-full" onClick={handleCollegeEmailSubmit} disabled={!emailValid || isLoading}>
              {isLoading ? 'Verifying...' : 'Sign In with College Email'}
            </Button>
            <p className="note-college-validation text-sm text-muted-foreground text-center">Only .edu or college domains allowed</p>
          </div>
        </Card>
      </div>
    );
  }

  if (currentStep === 'password') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-purple-500/5 flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-primary to-purple-600 rounded-2xl flex items-center justify-center"><span className="text-white text-2xl font-bold">L</span></div>
            <h2 className="text-2xl font-bold mb-2">Enter Your Password</h2>
            <p className="text-muted-foreground">{formData.email}</p>
          </div>
          <div className="space-y-6">
            <div>
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && password && handleLogin(password)}
              />
              {error && <p className="text-destructive text-sm mt-1">{error}</p>}
            </div>
            <Button className="w-full" onClick={() => handleLogin(password)} disabled={!password || isLoading}>
              {isLoading ? 'Signing In...' : 'Sign In'}
            </Button>
            <Button variant="outline" className="w-full" onClick={() => {
              setPassword('');
              setError('');
              setCurrentStep('login');
            }} disabled={isLoading}>
              Back
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (currentStep === 'linkedin') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
        <Card className="frame-linkedin-connect w-full max-w-md p-8 text-center">
          <div className="mb-8">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center"><span className="text-white text-2xl">⚡</span></div>
            <h2 className="title-linkedin-fetch text-2xl font-bold mb-2">Let's make it fast!</h2>
            <p className="text-subtext text-muted-foreground">We'll pull your name and profile pic from your LinkedIn account.</p>
          </div>
          <div className="space-y-4">
            {error && <p className="text-destructive text-sm">{error}</p>}
            <Button
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              onClick={() => {
                setError("LinkedIn integration will be available soon. Click 'Skip for now' to continue.");
              }}
            >
              <span className="mr-2">💼</span>
              Connect with LinkedIn
            </Button>
            <Button
              className="w-full"
              variant="outline"
              onClick={() => setCurrentStep('step1')}
              disabled={isLoading}
            >
              Skip for now
            </Button>
            <p className="text-sm text-muted-foreground">
              Your email: {formData.email}
            </p>
          </div>
        </Card>
      </div>
    );
  }

  // Multi-step profile form
  return (
    <form onSubmit={handleProfileSubmit}>
      {currentStep === 'step1' && (
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
          <Card className="frame-profile-builder-step1 w-full max-w-2xl p-8">
            <div className="mb-8"><h2 className="title-step1 text-2xl font-bold mb-2">Step 1: Basic Info</h2><div className="w-full bg-muted rounded-full h-2 mb-4"><div className="bg-primary h-2 rounded-full w-1/4"></div></div></div>
            <div className="space-y-6">
              <div><label className="block font-medium mb-2">Full Name</label><Input name="fullName" value={formData.fullName || ''} onChange={handleInputChange} placeholder="Enter your full name" /></div>
              <div><label className="block font-medium mb-2">College Name</label><Input name="collegeName" value={formData.collegeName || ''} disabled /><p className="text-sm text-muted-foreground mt-1">Detected from your email domain</p></div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="block font-medium mb-2">Year of Study</label><select name="yearOfStudy" value={formData.yearOfStudy || ""} onChange={handleInputChange} className="dropdown-year-of-study w-full p-3 border border-border rounded-lg"><option value="">Select year</option>{yearOptions.map(y => <option key={y} value={y}>{y}</option>)}</select></div>
                <div><label className="block font-medium mb-2">Department</label><select name="department" value={formData.department || ""} onChange={handleInputChange} className="dropdown-department w-full p-3 border border-border rounded-lg"><option value="">Select department</option>{departmentOptions.map(d => <option key={d} value={d}>{d}</option>)}</select></div>
              </div>
              <div>
                <label className="block font-medium mb-2">Profile Picture</label>
                <div className="upload-profile-pic border-2 border-dashed border-border rounded-lg p-6 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-xl overflow-hidden">
                    {formData.profilePicUrl ? (
                      <img src={formData.profilePicUrl} alt="Profile" className="rounded-full w-full h-full object-cover" />
                    ) : (
                      (formData.fullName || formData.email || "?").charAt(0).toUpperCase()
                    )}
                  </div>
                  <input 
                    type="file" 
                    accept="image/jpeg,image/png,image/jpg" 
                    onChange={handleProfilePictureUpload}
                    id="profilePicInput"
                    className="hidden"
                  />
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    onClick={() => document.getElementById('profilePicInput').click()}
                  >
                    📸 Upload Photo
                  </Button>
                  <p className="text-sm text-muted-foreground mt-2">JPG, PNG up to 5MB</p>
                  {formData.profilePicUrl && <p className="text-xs text-green-600 mt-2">✓ Photo selected</p>}
                </div>
              </div>
              <button
                type="button"
                onClick={handleStep1Continue}
                disabled={!formData.fullName || formData.fullName.trim() === '' || !formData.yearOfStudy || !formData.department}
                className={`w-full py-3 rounded-xl font-semibold transition-all duration-200 ${(!formData.fullName || formData.fullName.trim() === '' || !formData.yearOfStudy || !formData.department)
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-indigo-600 text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5'
                  }`}
              >
                Next →
              </button>
            </div>
          </Card>
        </div>
      )}
      {currentStep === 'step2' && (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-4xl p-8">
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-2">Step 2: Skills & Expertise</h2>
              <p className="text-sm text-muted-foreground mb-4">What tools do you bring to the synergy?</p>
              <div className="w-full bg-muted rounded-full h-2"><div className="bg-primary h-2 rounded-full w-1/4"></div></div>
            </div>
            <div className="space-y-6">
              <MultiSelect 
                options={SKILLS_LIBRARY}
                selected={formData.skills || []}
                onChange={(val) => setFormData({ ...formData, skills: val })}
                placeholder="Search Skills (e.g. React, Python, UI/UX)..."
              />
              <div className="flex gap-4">
                <Button 
                  type="button" 
                  variant="outline"
                  className="w-full" 
                  onClick={() => setCurrentStep('step1')}
                >
                  ← Back to Profile
                </Button>
                <Button 
                  type="button" 
                  className="w-full" 
                  onClick={handleStep2Continue} 
                  disabled={(formData.skills || []).length === 0}
                >
                  Next →
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
      {currentStep === 'step3' && (
        <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-3xl p-8">
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-2">Step 3: Roles & Interests</h2>
              <p className="text-sm text-muted-foreground mb-4">Tell us what excites you and what roles you're open to</p>
              <div className="w-full bg-muted rounded-full h-2"><div className="bg-primary h-2 rounded-full w-1/2"></div></div>
            </div>
            <div className="space-y-8">
              <div>
                <label className="block font-medium mb-3">Roles You're Open To</label>
                <MultiSelect 
                  options={ROLES_LIBRARY}
                  selected={formData.rolesOpenTo || []}
                  onChange={(val) => setFormData({ ...formData, rolesOpenTo: val })}
                  placeholder="Search roles (e.g., Frontend Developer, DevOps, Product Manager)..."
                />
              </div>

              {(formData.rolesOpenTo || []).length > 0 && (
                <>
                  <div>
                    <label className="block font-medium mb-3">Goals for This Semester</label>
                    <Textarea name="goals" value={formData.goals || ''} onChange={handleInputChange} placeholder="What do you want to build..." rows={4} />
                  </div>
                  <div>
                    <label className="block font-medium mb-3">What Excites You?</label>
                    <MultiSelect 
                      options={INTERESTS_LIBRARY}
                      selected={formData.excitingTags || []}
                      onChange={(val) => setFormData({ ...formData, excitingTags: val })}
                      placeholder="Search interests (e.g., AI x Health, Web3, Open Source)..."
                    />
                  </div>
                </>
              )}

              {(formData.rolesOpenTo || []).length === 0 && (
                <p className="text-sm text-center text-muted-foreground bg-muted/30 p-4 rounded-lg">Select at least one role to continue</p>
              )}

              <div className="flex gap-4">
                <Button 
                  type="button" 
                  variant="outline"
                  className="w-full" 
                  onClick={() => setCurrentStep('step2')}
                >
                  ← Back to Skills
                </Button>
                <Button 
                  type="button" 
                  className="w-full" 
                  onClick={() => setCurrentStep('step4')} 
                  disabled={(formData.rolesOpenTo || []).length === 0 || !(formData.goals || '').trim() || (formData.excitingTags || []).length === 0}
                >
                  Next →
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
      {currentStep === 'step4' && (
        <div className="min-h-screen bg-gradient-to-br from-cyan-50 to-blue-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl p-8">
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-2">Step 4: Final Touches</h2>
              <p className="text-sm text-muted-foreground mb-4">Complete your profile with links</p>
              <div className="w-full bg-muted rounded-full h-2 mb-4"><div className="bg-primary h-2 rounded-full w-full"></div></div>
            </div>
            <div className="space-y-6">
              <div>
                <label className="block font-medium mb-2">GitHub Profile <span className="text-red-500">*</span></label>
                <Input 
                  name="githubUrl" 
                  value={formData.githubUrl || ''} 
                  onChange={handleInputChange}
                  placeholder="https://github.com/yourusername" 
                  className={`border-2 ${formData.githubUrl && !isValidGitHubUrl(formData.githubUrl) ? 'border-red-500' : 'border-border'}`}
                />
                <p className="text-xs text-muted-foreground mt-1">Required to complete your profile</p>
                {formData.githubUrl && !isValidGitHubUrl(formData.githubUrl) && (
                  <p className="text-xs text-red-500 mt-1">⚠ Please enter a valid GitHub URL (e.g., https://github.com/username)</p>
                )}
                {formData.githubUrl && isValidGitHubUrl(formData.githubUrl) && (
                  <p className="text-xs text-green-600 mt-1">✓ Valid GitHub URL</p>
                )}
              </div>
              <div>
                <label className="block font-medium mb-2">Portfolio Website</label>
                <Input name="portfolioUrl" value={formData.portfolioUrl || ''} onChange={handleInputChange} placeholder="https://yourportfolio.com" />
              </div>
              <div className="flex gap-4">
                <Button 
                  type="button" 
                  variant="outline"
                  className="w-full" 
                  onClick={() => setCurrentStep('step3')}
                >
                  ← Back
                </Button>
                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700" 
                  disabled={isLoading || !formData.githubUrl || !isValidGitHubUrl(formData.githubUrl)}
                >
                  {isLoading ? 'Saving...' : '🚀 Complete Profile'}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
      {currentStep === 'success' && (
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 flex items-center justify-center p-4">
          <Card className="frame-profile-complete-success w-full max-w-lg p-8 text-center">
            <div className="mb-8"><div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-green-400 via-blue-500 to-purple-600 rounded-full flex items-center justify-center animate-pulse"><span className="text-white text-4xl">🎉</span></div><h2 className="title text-3xl font-bold mb-2">🎉 You're Looped In!</h2><p className="text-muted-foreground mb-4">Welcome to the Looped community! Your profile is complete.</p></div>
            <div className="mb-8"><div className="text-badge-earned bg-gradient-to-r from-yellow-100 to-orange-100 border border-yellow-200 rounded-lg p-4"><div className="text-2xl mb-2">⭐</div><p className="font-medium text-yellow-800">Badge Earned: Core Looped</p><p className="text-sm text-yellow-700">Successfully completed your profile setup</p></div></div>
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4 text-center text-sm">
                <div><div className="font-semibold text-lg text-blue-600">{(formData.skills || []).length}</div><div className="text-muted-foreground">Skills Added</div></div>
                <div><div className="font-semibold text-lg text-green-600">{(formData.rolesOpenTo || []).length}</div><div className="text-muted-foreground">Roles Open To</div></div>
                <div><div className="font-semibold text-lg text-purple-600">100%</div><div className="text-muted-foreground">Profile Complete</div></div>
              </div>
              <Button
                type="button"
                onClick={goToDashboard}
                className="btn-go-to-dashboard w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                🚀 Go to Dashboard
              </Button>
            </div>
          </Card>
        </div>
      )}
    </form>
  );
}