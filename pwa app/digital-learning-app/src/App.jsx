import React, { useState, useEffect, useRef } from 'react';
import { saveAs } from 'file-saver';
import { initializeApp } from "firebase/app";
import { 
    getFirestore, doc, collection, addDoc, onSnapshot, setDoc, getDoc, updateDoc, deleteDoc 
} from 'firebase/firestore';
import { supabase } from './supabaseClient';
import Auth from './Auth';

// --- Firebase Configuration ---
const firebaseConfig = {
  apiKey: "AIzaSyAGzmlhziHPgYgESRmhABjuoEOud4OiSo8", 
  authDomain: "pwartc.firebaseapp.com", 
  projectId: "pwartc", 
  storageBucket: "pwartc.appspot.com",
  messagingSenderId: "438767032334", 
  appId: "1:438767032334:web:a9afa6fda42a8b0a4b845f", 
  measurementId: "G-ZD5021SDSN"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// --- WebRTC Configuration ---
const servers = {
  iceServers: [
    { urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'] },
  ],
  iceCandidatePoolSize: 10,
};

// --- Main Application ---
function App() {
  const [page, setPage] = useState('home');
  const [roomId, setRoomId] = useState('');
  const [session, setSession] = useState(null);
  const [cloudSyncEnabled, setCloudSyncEnabled] = useState(false);
  const [offlineMode, setOfflineMode] = useState(false);

  useEffect(() => {
    // Check for network status
    const handleNetworkChange = () => {
      const isOffline = !navigator.onLine;
      setOfflineMode(isOffline);
      
      if (isOffline) {
        console.log("App is offline. Using cached data.");
      } else {
        console.log("App is online. Syncing data if needed.");
      }
    };

    // Set initial network status
    handleNetworkChange();

    // Add event listeners for network status changes
    window.addEventListener('online', handleNetworkChange);
    window.addEventListener('offline', handleNetworkChange);

    // Auto-login without requiring user input - disabled to allow manual entry
    /*
    const autoLogin = async () => {
      // Check if we have cached user data
      const cachedUser = localStorage.getItem('cachedUser');
      
      let mockSession;
      if (cachedUser) {
        mockSession = JSON.parse(cachedUser);
      } else {
        // Create a mock session with a fake user
        mockSession = {
          user: {
            id: 'auto-user-123',
            email: 'auto@example.com',
            user_metadata: { name: 'Auto User' }
          }
        };
        // Cache the user data
        localStorage.setItem('cachedUser', JSON.stringify(mockSession));
      }
      
      // Set the mock session directly
      setSession(mockSession);
      setCloudSyncEnabled(true);
      
      // Check if we were in a room before going offline
      const lastConnectionState = localStorage.getItem('lastConnectionState');
      if (lastConnectionState) {
        const { roomId, isConnected } = JSON.parse(lastConnectionState);
        if (roomId) {
          // If we were in a room, go back to it
          setRoomId(roomId);
          setPage('room');
        }
      }
    };
    
    // Run auto-login immediately
    autoLogin();
    */
    
    return () => {
      window.removeEventListener('online', handleNetworkChange);
      window.removeEventListener('offline', handleNetworkChange);
    };
  }, []);

  const goToRoom = (id = '') => {
    setRoomId(id);
    setPage('room');
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  // Direct entry function - no login required
  const handleDirectEntry = () => {
    // Create a guest session
    const guestSession = {
      user: {
        id: 'guest-' + Math.random().toString(36).substring(2, 10),
        email: 'guest@example.com',
        user_metadata: { name: 'Guest User' }
      }
    };
    
    // Cache the user data for persistence
    localStorage.setItem('cachedUser', JSON.stringify(guestSession));
    
    // Set the session directly
    setSession(guestSession);
    
    // Enable cloud sync
    setCloudSyncEnabled(true);
  };

    return (
    <div className="bg-gray-900 text-white min-h-screen font-sans">
        <Header session={session} onLogout={handleLogout} />
        <main className="container mx-auto px-4 py-8">
            {!session ? (
              <>
                <div className="text-center max-w-lg mx-auto">
                  <h2 className="text-4xl font-extrabold text-white mb-4">Offline First, Peer-to-Peer Learning</h2>
                  <p className="text-gray-400 mb-8">Start using EduMesh without any login required.</p>
                  
                  <button 
                    onClick={handleDirectEntry}
                    className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-md font-semibold hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg hover:shadow-blue-500/50 text-lg"
                  >
                    Enter Application
                  </button>
                </div>
              </>
            ) : (
              <>
                {page === 'home' && <HomePage goToRoom={goToRoom} />}
                {page === 'room' && (
                  <RoomPage 
                    initialRoomId={roomId} 
                    goHome={() => setPage('home')} 
                    cloudSync={cloudSyncEnabled}
                    userId={session.user.id}
                  />
                )}
              </>
            )}
        </main>
    </div>
  );
}

// --- Components ---

function PwaInstaller() {
    const [installPrompt, setInstallPrompt] = useState(null);
    
    useEffect(() => {
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            setInstallPrompt(e);
        });
    }, []);
    
    const handleInstallClick = () => {
        if (!installPrompt) return;
        
        installPrompt.prompt();
        installPrompt.userChoice.then((choiceResult) => {
            if (choiceResult.outcome === 'accepted') {
                console.log('User accepted the install prompt');
            }
            setInstallPrompt(null);
        });
    };
    
    if (!installPrompt) return null;
    
    return (
        <button 
            onClick={handleInstallClick}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center"
        >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Install App
        </button>
    );
}

function Header({ session, onLogout }) {
    return (
        <header className="bg-gray-800/80 backdrop-blur-sm sticky top-0 z-50 border-b border-blue-900/50">
            <nav className="container mx-auto px-4 py-4 flex justify-between items-center">
                <h1 className="text-2xl font-bold">Edu<span className="text-blue-500">Mesh</span> <span className="text-sm font-light text-gray-400">Winning Prototype</span></h1>
                <div className="flex items-center gap-4">
                    {session && (
                        <div className="flex items-center gap-3">
                            <span className="text-sm text-green-400">{session.user.email}</span>
                            <button 
                                onClick={onLogout}
                                className="bg-red-600 hover:bg-red-700 text-white text-sm px-3 py-1 rounded"
                            >
                                Logout
                            </button>
                        </div>
                    )}
                    <PwaInstaller />
                </div>
            </nav>
        </header>
    );
}

function HomePage({ goToRoom }) {
  const [joinId, setJoinId] = useState('');
  return (
    <div className="text-center max-w-lg mx-auto">
      <h2 className="text-4xl font-extrabold text-white mb-4">Offline First, Peer-to-Peer Learning</h2>
      <p className="text-gray-400 mb-8">Create a room to start a session or join an existing one using a Room ID.</p>
      
      <div className="bg-gray-800 p-8 rounded-lg border border-gray-700">
         <button onClick={() => goToRoom()} className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-md font-semibold hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg hover:shadow-blue-500/50 text-lg">
            Create New Room
        </button>
        <div className="my-6 flex items-center">
            <hr className="flex-grow border-gray-600" />
            <span className="px-4 text-gray-500">OR</span>
            <hr className="flex-grow border-gray-600" />
        </div>
        <div className="flex flex-col sm:flex-row gap-4">
            <input 
                type="text"
                placeholder="Enter Room ID to join"
                value={joinId}
                onChange={(e) => setJoinId(e.target.value)}
                className="flex-grow bg-gray-700 border border-gray-600 rounded-md px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
            <button onClick={() => joinId && goToRoom(joinId)} disabled={!joinId} className="bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-3 rounded-md font-semibold hover:from-green-600 hover:to-green-700 disabled:from-gray-500 disabled:to-gray-600 transition-all shadow-lg hover:shadow-green-500/50">
                Join Room
            </button>
        </div>
      </div>
    </div>
  );
}

function VideoStream({ stream, muted = false }) {
    const videoRef = useRef(null);
    useEffect(() => {
        if (videoRef.current && stream) {
            videoRef.current.srcObject = stream;
        }
    }, [stream]);

    return (
        <div className="bg-black rounded-lg overflow-hidden h-40 shadow-lg ring-1 ring-white/10">
            <video ref={videoRef} autoPlay playsInline muted={muted} className="w-full h-full object-cover" />
        </div>
    );
}

function RoomPage({ initialRoomId, goHome, cloudSync, userId }) {
    const pc = useRef(null);
    const dataChannel = useRef(null);
    const [status, setStatus] = useState('Initializing...');
    const [currentRoomId, setCurrentRoomId] = useState('');
    const [isConnected, setIsConnected] = useState(false);
    
    const [localStream, setLocalStream] = useState(null);
    const [remoteStream, setRemoteStream] = useState(null);
    const [sharedNotes, setSharedNotes] = useState('');
    const [receivedFiles, setReceivedFiles] = useState([]);
    const [displayedContent, setDisplayedContent] = useState(null);

    const fileChunks = useRef([]);
    
    useEffect(() => {
        pc.current = new RTCPeerConnection(servers);
        const peerConnection = pc.current;
        let roomRef;
        const unsubscribes = [];

        const setupMedia = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                setLocalStream(stream);
                
                // Check if peerConnection is still valid before adding tracks
                if (peerConnection.signalingState !== 'closed') {
                    stream.getTracks().forEach(track => {
                        try {
                            peerConnection.addTrack(track, stream);
                        } catch (trackErr) {
                            console.error("Error adding track:", trackErr);
                        }
                    });
                } else {
                    console.warn("Cannot add tracks - peer connection is closed");
                }
                return true;
            } catch (err) {
                console.error("Error accessing media devices.", err);
                setStatus("Error: Could not access camera or microphone. Continuing with chat only.");
                // Continue with data channel only if media fails
                return false;
            }
        };

        peerConnection.ontrack = (event) => {
            setRemoteStream(event.streams[0]);
        };

        // Handle connection state changes
        peerConnection.onconnectionstatechange = () => {
            console.log("Connection state:", peerConnection.connectionState);
            if (peerConnection.connectionState === 'connected') {
                setIsConnected(true);
                setStatus('Connection successful! Ready to collaborate.');
            } else if (peerConnection.connectionState === 'disconnected' || 
                      peerConnection.connectionState === 'failed' ||
                      peerConnection.connectionState === 'closed') {
                setIsConnected(false);
                setStatus(`Connection ${peerConnection.connectionState}. Try refreshing.`);
            }
        };

        const setupDataChannelEvents = (channel) => {
             channel.onmessage = (event) => {
                 try {
                     const data = JSON.parse(event.data);
                     if (data.type === 'notes') {
                         setSharedNotes(data.content);
                     } else if (data.type === 'file') {
                         const { done, value } = data;
                         if (done) {
                             const receivedBlob = new Blob(fileChunks.current, { type: value.type });
                             const newFile = { name: value.name, blob: receivedBlob };
                             setReceivedFiles(prev => [...prev, newFile]);
                             setDisplayedContent(newFile);
                             fileChunks.current = [];
                         } else {
                             fileChunks.current.push(new Uint8Array(value));
                         }
                     }
                 } catch (error) { console.error("Failed to parse data channel message:", error); }
             };
             channel.onopen = () => { 
                setIsConnected(true); 
                setStatus('Connection successful! Ready to collaborate.'); 
                
                // Save connection state to localStorage for offline detection
                localStorage.setItem('lastConnectionState', JSON.stringify({
                    roomId: currentRoomId,
                    timestamp: Date.now(),
                    isConnected: true
                }));
             };
             channel.onclose = () => { 
                setIsConnected(false); 
                setStatus('Connection closed by peer.'); 
                
                // Update localStorage with disconnected state
                localStorage.setItem('lastConnectionState', JSON.stringify({
                    roomId: currentRoomId,
                    timestamp: Date.now(),
                    isConnected: false
                }));
             };
             channel.onerror = (error) => { 
                console.error("Data channel error:", error); 
                setStatus("Connection error."); 
             };
        };

        peerConnection.ondatachannel = (event) => {
            dataChannel.current = event.channel;
            setupDataChannelEvents(dataChannel.current);
        };
        
        const init = async () => {
            const mediaSuccess = await setupMedia();

            if (initialRoomId) { // JOINER
                setStatus(`Joining room: ${initialRoomId}...`);
                roomRef = doc(db, 'rooms', initialRoomId);
                setCurrentRoomId(initialRoomId);

                const calleeCandidatesCollection = collection(roomRef, 'calleeCandidates');
                peerConnection.onicecandidate = (event) => event.candidate && addDoc(calleeCandidatesCollection, event.candidate.toJSON());

                const unsubscribe = onSnapshot(roomRef, async (snapshot) => {
                    if (snapshot.exists() && snapshot.data()?.offer && !peerConnection.currentRemoteDescription) {
                        setStatus('Peer found. Sending answer...');
                        await peerConnection.setRemoteDescription(new RTCSessionDescription(snapshot.data().offer));
                        const answerDescription = await peerConnection.createAnswer();
                        await peerConnection.setLocalDescription(answerDescription);
                        await updateDoc(roomRef, { answer: { sdp: answerDescription.sdp, type: answerDescription.type } });
                        
                        const unsubCaller = onSnapshot(collection(roomRef, 'callerCandidates'), (snap) => snap.docChanges().forEach((change) => change.type === 'added' && peerConnection.addIceCandidate(new RTCIceCandidate(change.doc.data()))));
                        unsubscribes.push(unsubCaller);
                    } else if (!snapshot.exists()) {
                        setStatus(`Error: Room ${initialRoomId} not found.`);
                    }
                });
                unsubscribes.push(unsubscribe);

            } else { // CREATOR
                setStatus('Creating new room...');
                
                // Create data channel first to ensure it's available
                try {
                    if (peerConnection.signalingState !== 'closed') {
                        dataChannel.current = peerConnection.createDataChannel('mainChannel');
                        setupDataChannelEvents(dataChannel.current);
                    } else {
                        console.warn("Cannot create data channel - peer connection is closed");
                        setStatus("Initialization failed: Peer connection is closed. Please refresh the page.");
                        return;
                    }
                } catch (err) {
                    console.error("Error creating data channel:", err);
                    setStatus("Initialization failed: " + err.message);
                    return;
                }

                try {
                    // Create the room in Firestore
                    roomRef = await addDoc(collection(db, 'rooms'), {});
                    const roomId = roomRef.id;
                    setCurrentRoomId(roomId);
                    
                    const callerCandidatesCollection = collection(roomRef, 'callerCandidates');
                    peerConnection.onicecandidate = (event) => event.candidate && addDoc(callerCandidatesCollection, event.candidate.toJSON());
                    
                    const offerDescription = await peerConnection.createOffer();
                    await peerConnection.setLocalDescription(offerDescription);
                    await setDoc(roomRef, { offer: { sdp: offerDescription.sdp, type: offerDescription.type } });
                    setStatus(`Room created. Share the ID: ${roomId}`);

                    // Save room ID to localStorage for persistence
                    localStorage.setItem('lastRoomId', roomId);
                    
                    const unsubAnswer = onSnapshot(roomRef, (snapshot) => {
                        const data = snapshot.data();
                        if (!peerConnection.currentRemoteDescription && data?.answer) {
                            peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer));
                            setStatus('Connection offer accepted.');
                        }
                    });
                    unsubscribes.push(unsubAnswer);
                    
                    const unsubCallee = onSnapshot(collection(roomRef, 'calleeCandidates'), (snap) => snap.docChanges().forEach((change) => change.type === 'added' && peerConnection.addIceCandidate(new RTCIceCandidate(change.doc.data()))));
                    unsubscribes.push(unsubCallee);
                } catch (error) {
                    console.error("Error creating room:", error);
                    setStatus(`Error creating room: ${error.message}`);
                }
            }
        };

        init().catch(err => {
            console.error("Initialization failed:", err);
            setStatus(`Error: ${err.message}.`);
        });

        return () => { 
            if (pc.current && pc.current.signalingState !== 'closed') pc.current.close();
            unsubscribes.forEach(unsub => unsub());
            if (localStream) localStream.getTracks().forEach(track => track.stop());
            if (roomRef && !initialRoomId) deleteDoc(roomRef);
        };
    }, [initialRoomId]);
    
    const handleNotesChange = (e) => {
        const newNotes = e.target.value;
        setSharedNotes(newNotes);
        
        // Save notes to localStorage for offline persistence
        localStorage.setItem('cachedNotes', newNotes);
        
        if (dataChannel.current?.readyState === 'open') {
            dataChannel.current.send(JSON.stringify({ type: 'notes', content: newNotes }));
        }
    };
    
    // Function to handle file sharing with offline support
    const handleFileShare = (file) => {
        if (!file) return;
        
        // Store file in IndexedDB for offline access
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                // Save file to localStorage for offline access (small files only)
                const fileData = {
                    name: file.name,
                    type: file.type,
                    data: e.target.result,
                    timestamp: Date.now()
                };
                
                // Store in localStorage (with size limit check)
                if (e.target.result.length < 5000000) { // ~5MB limit
                    localStorage.setItem(`file_${file.name}`, JSON.stringify(fileData));
                }
                
                // Send via data channel if connected
                if (dataChannel.current?.readyState === 'open') {
                    // Send file in chunks
                    const chunkSize = 16384;
                    const arrayBuffer = e.target.result;
                    
                    for (let i = 0; i < arrayBuffer.byteLength; i += chunkSize) {
                        const chunk = arrayBuffer.slice(i, i + chunkSize);
                        dataChannel.current.send(JSON.stringify({
                            type: 'file',
                            done: false,
                            value: Array.from(new Uint8Array(chunk))
                        }));
                    }
                    
                    // Send completion message
                    dataChannel.current.send(JSON.stringify({
                        type: 'file',
                        done: true,
                        value: { name: file.name, type: file.type }
                    }));
                }
            } catch (error) {
                console.error("Error processing file:", error);
            }
        };
        reader.readAsArrayBuffer(file);
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <button onClick={goHome} className="bg-gray-700 text-white px-4 py-2 rounded-md hover:bg-gray-600">&larr; Back to Home</button>
                <div className={`px-4 py-2 rounded-full text-sm font-semibold ${isConnected ? 'bg-green-500/20 text-green-300' : 'bg-yellow-500/20 text-yellow-300'}`}>{isConnected ? 'Connected' : 'Connecting...'}</div>
            </div>
             <div className="bg-gray-800 p-4 sm:p-8 rounded-lg border border-gray-700">
                {currentRoomId && (<div className="mb-4"><label className="text-sm text-gray-400">Room ID</label><input type="text" readOnly value={currentRoomId} className="w-full bg-gray-700 p-2 rounded-md text-center text-lg tracking-widest" onClick={e => e.target.select()}/></div>)}
                <p className="text-sm italic text-gray-500 mb-6 text-center">{status}</p>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div><h3 className="font-bold mb-2 text-center text-gray-400">You</h3><VideoStream stream={localStream} muted={true} /></div>
                            <div><h3 className="font-bold mb-2 text-center text-gray-400">Peer</h3><VideoStream stream={remoteStream} /></div>
                        </div>
                        <LessonContentDisplay content={displayedContent} />
                    </div>
                    <div className="lg:col-span-1 space-y-6">
                       <SharedNotes notes={sharedNotes} onNotesChange={handleNotesChange} disabled={!isConnected} cloudSync={cloudSync} userId={userId} roomId={currentRoomId} />
                       <FileShareComponent dataChannel={dataChannel.current} isConnected={isConnected} receivedFiles={receivedFiles} setReceivedFiles={setReceivedFiles} setDisplayedContent={setDisplayedContent} cloudSync={cloudSync} userId={userId} roomId={currentRoomId}/>
                    </div>
                </div>
            </div>
        </div>
    );
}

function LessonContentDisplay({ content }) {
    const [contentUrl, setContentUrl] = useState('');

    useEffect(() => {
        if (content && content.blob && (content.blob.type.startsWith('image/') || content.blob.type.startsWith('video/'))) {
            const url = URL.createObjectURL(content.blob);
            setContentUrl(url);
            return () => URL.revokeObjectURL(url);
        }
        setContentUrl('');
    }, [content]);

    return (
        <div className="bg-gray-800 p-4 rounded-lg shadow-lg ring-1 ring-white/10">
            <h3 className="text-lg font-semibold mb-3 text-blue-400">Lesson Content</h3>
            <div className="bg-black rounded-lg aspect-video flex items-center justify-center p-4">
                {!content ? <p className="text-gray-500">No content selected.</p> :
                    content.blob.type.startsWith('image/') ? <img src={contentUrl} alt={content.name} className="max-w-full max-h-full object-contain" /> :
                    content.blob.type.startsWith('video/') ? <video src={contentUrl} controls className="max-w-full max-h-full"></video> :
                    <p className="text-gray-400 text-center">Cannot preview this file type.<br/>Download from the list below.</p>
                }
            </div>
        </div>
    );
}

function SharedNotes({ notes, onNotesChange, disabled, cloudSync, userId, roomId }) {
    const [lastSynced, setLastSynced] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    
    // Save notes to Supabase when they change
    useEffect(() => {
        if (cloudSync && roomId && userId && notes) {
            const saveNotesToCloud = async () => {
                try {
                    setIsSaving(true);
                    const { error } = await supabase
                        .from('notes')
                        .upsert(
                            { 
                                room_id: roomId,
                                user_id: userId,
                                content: notes,
                                updated_at: new Date().toISOString()
                            },
                            { onConflict: 'room_id' }
                        );
                        
                    if (error) {
                        console.error('Error saving notes to cloud:', error);
                    } else {
                        setLastSynced(new Date());
                    }
                } finally {
                    setIsSaving(false);
                }
            };
            
            // Debounce the save operation
            const timer = setTimeout(saveNotesToCloud, 1000);
            return () => clearTimeout(timer);
        }
    }, [notes, cloudSync, roomId, userId]);
    
    return (
        <div className="bg-gray-800 p-4 rounded-lg shadow-lg ring-1 ring-white/10">
            <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-semibold text-purple-400">
                    Shared Notes {cloudSync && <span className="text-xs text-green-400 ml-2">☁️ Cloud Sync</span>}
                </h3>
                {cloudSync && (
                    <div className="flex items-center text-xs text-gray-400">
                        {isSaving && <span className="mr-2">Saving...</span>}
                        {lastSynced && (
                            <span>Last synced: {lastSynced.toLocaleTimeString()}</span>
                        )}
                    </div>
                )}
            </div>
            <textarea
                value={notes}
                onChange={onNotesChange}
                disabled={disabled}
                placeholder={disabled ? "Waiting for connection..." : "Type your collaborative notes here..."}
                className="w-full h-64 bg-gray-700 border border-gray-600 rounded-md p-3 text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none disabled:bg-gray-900 resize-none"
            />
        </div>
    );
}

function FileShareComponent({ dataChannel, isConnected, receivedFiles, setReceivedFiles, setDisplayedContent, cloudSync, userId, roomId }) {
    const CHUNK_SIZE = 64 * 1024; // 64KB for faster transfers
    const [isUploading, setIsUploading] = useState(false);

    // Load files from Supabase when component mounts
    useEffect(() => {
        if (cloudSync && roomId && setReceivedFiles) {
            const loadFilesFromCloud = async () => {
                try {
                    const { data, error } = await supabase
                        .from('files')
                        .select('*')
                        .eq('room_id', roomId);
                    
                    if (error) {
                        console.error('Error loading files:', error);
                    } else if (data && data.length > 0) {
                        // Convert Supabase files to the format expected by the component
                        const formattedFiles = data.map(file => ({
                            name: file.name,
                            blob: new Blob([]), // Placeholder until we download the actual file
                            type: file.type,
                            id: file.id,
                            storage_path: file.storage_path
                        }));
                        setReceivedFiles(formattedFiles);
                    }
                } catch (err) {
                    console.error('Error fetching files:', err);
                }
            };
            
            loadFilesFromCloud();
        }
    }, [cloudSync, roomId, setReceivedFiles]);

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file || !isConnected) return;
        
        setIsUploading(true);
        const fileInfo = { name: file.name, type: file.type, size: file.size };
        const arrayBuffer = await file.arrayBuffer();
        
        try {
            // Send file chunks to peer
            for (let i = 0; i < arrayBuffer.byteLength; i += CHUNK_SIZE) {
                const chunk = arrayBuffer.slice(i, i + CHUNK_SIZE);
                if (dataChannel && dataChannel.readyState === 'open') {
                    dataChannel.send(JSON.stringify({ type: 'file', value: Array.from(new Uint8Array(chunk)) }));
                } else { 
                    console.log("Data channel not ready for sending chunks");
                    break; 
                }
            }
            if (dataChannel && dataChannel.readyState === 'open') {
                dataChannel.send(JSON.stringify({ type: 'file', done: true, value: fileInfo }));
            }
            
            // Upload to Supabase if cloud sync is enabled
            if (cloudSync && roomId && userId) {
                try {
                    const fileId = `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                    
                    // Upload the file to storage
                    const { data: storageData, error: storageError } = await supabase
                        .storage
                        .from('files')
                        .upload(`${roomId}/${fileId}`, file);
                        
                    if (storageError) {
                        console.error('Error uploading file to storage:', storageError);
                        return;
                    }
                    
                    // Save the file metadata to the database
                    const { error: dbError } = await supabase
                        .from('files')
                        .insert({
                            id: fileId,
                            name: file.name,
                            size: file.size,
                            type: file.type,
                            storage_path: `${roomId}/${fileId}`,
                            room_id: roomId,
                            user_id: userId,
                            created_at: new Date().toISOString()
                        });
                        
                    if (dbError) {
                        console.error('Error saving file metadata:', dbError);
                    }
                } catch (err) {
                    console.error('Error in file upload process:', err);
                }
            }
        } catch (error) { 
            console.error("Error sending file:", error); 
        } finally {
            setIsUploading(false);
        }
    };

    const handleDownload = async (file) => {
        // If the file has a storage path and cloud sync is enabled, try to download from Supabase
        if (file.storage_path && cloudSync) {
            try {
                const { data, error } = await supabase
                    .storage
                    .from('files')
                    .download(file.storage_path);
                    
                if (error) {
                    console.error('Error downloading file from Supabase:', error);
                    // Fall back to local blob if available
                    if (file.blob) {
                        saveAs(file.blob, file.name);
                    }
                    return;
                }
                
                saveAs(data, file.name);
            } catch (err) {
                console.error('Error in file download from Supabase:', err);
                // Fall back to local blob
                if (file.blob) {
                    saveAs(file.blob, file.name);
                }
            }
        } else if (file.blob) {
            // Use local blob if available
            saveAs(file.blob, file.name);
        }
    };

    return (
        <div className="bg-gray-800 p-4 rounded-lg shadow-lg ring-1 ring-white/10">
            <h3 className="text-lg font-semibold mb-3 text-green-400">
                Share & Received Files {cloudSync && <span className="text-xs text-green-400 ml-2">☁️ Cloud Storage</span>}
            </h3>
            <div className="p-4 border-2 border-dashed border-gray-600 rounded-lg text-center mb-6">
                 <input type="file" id="file-upload" className="hidden" onChange={handleFileChange} disabled={!isConnected || isUploading} />
                 <label htmlFor="file-upload" className={`cursor-pointer text-white px-6 py-3 rounded-md font-semibold transition-colors ${isConnected && !isUploading ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-600 cursor-not-allowed'}`}>
                    {isUploading ? 'Uploading...' : 'Share File'}
                 </label>
            </div>
            <div className="space-y-3">
                {receivedFiles.length === 0 ? <p className="text-gray-500">No files received yet.</p> :
                    receivedFiles.map((file, index) => (
                       <div key={index} className="bg-gray-700 p-3 rounded-md flex justify-between items-center">
                            <div className="flex items-center min-w-0 cursor-pointer" onClick={() => setDisplayedContent(file)}>
                                <span className="truncate">{file.name}</span>
                                {file.storage_path && <span className="ml-1 text-xs text-green-400">☁️</span>}
                            </div>
                            <button onClick={() => handleDownload(file)} className="bg-green-600 text-white px-4 py-1 rounded-md text-sm hover:bg-green-700 ml-4">Download</button>
                       </div>
                    ))
                }
            </div>
        </div>
    );
}

// Export the App component
export default App;