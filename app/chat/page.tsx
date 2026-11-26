"use client"
import { useState, useEffect, useRef } from "react"
import { initializeApp, getApps, getApp } from "firebase/app"
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber, onAuthStateChanged, signOut, type ConfirmationResult } from "firebase/auth"

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}
const app = getApps().length ? getApp() : initializeApp(firebaseConfig)
const auth = getAuth(app)

// --- Types ---
type Chat = { name: string; msg: string; time: string; ring: 'new' | 'seen' | 'none'; type: 'none' | 'photo' | 'live'; src?: string; start?: number; phone?: string }
type Me = { type: 'none' | 'photo' | 'live'; src?: string; start?: number }
type Msg = { text?: string; time: string; audioUrl?: string; kind?: 'text' | 'voice' }
type Contact = { name: string; phone: string; blocked?: boolean }

const STICKERS = [{ name: 'Aki', src: 'stickers/aki.mp4', e: '😎' }, { name: 'Pawpaw', src: 'stickers/pawpaw.mp4', e: '🐶' }]

const COUNTRIES = [
  { name: 'Nigeria', code: '+234', flag: '🇳🇬' },
  { name: 'Benin', code: '+229', flag: '🇧🇯' },
  { name: 'Ghana', code: '+233', flag: '🇬🇭' },
  { name: 'United States', code: '+1', flag: '🇺🇸' },
  { name: 'United Kingdom', code: '+44', flag: '🇬🇧' },
  { name: 'Canada', code: '+1', flag: '🇨🇦' },
  { name: 'South Africa', code: '+27', flag: '🇿🇦' },
  { name: 'Kenya', code: '+254', flag: '🇰🇪' },
  { name: 'India', code: '+91', flag: '🇮🇳' },
  { name: 'France', code: '+33', flag: '🇫🇷' },
  { name: 'Germany', code: '+49', flag: '🇩🇪' },
]

const EMOJI_CATS: Record<string, string[]> = {
  Faces: ['😂','❤️','😍','🔥','😭','😎','🥰','😅','👏','😉','💯','😁','🤣','😘','😊'],
  Hands: ['👍','🙏','👏','✌️','🤞','👌','🤲','🖐️','👋','💪','🫶'],
  Animals: ['🐶','🐱','🦁','🐯','🐵','🐷','🐥','🦋','🐢','🦄','🐝','🦊'],
}

const P = 'M50,0 C70,40 100,90 100,140 C100,180 80,210 50,210 C20,210 0,180 0,140 C0,90 30,40 50,0 Z'
const T = 'translate(5,10.5) scale(.9)'
let uidCounter = 0

function Droplet({ o, w = 46, onClick, muted = true }: { o: any; w?: number; onClick?: (e: any) => void; muted?: boolean }) {
  const idRef = useRef(0)
  if (idRef.current === 0) { uidCounter += 1; idRef.current = uidCounter }
  const n = idRef.current
  const ring = o.ring === 'new' ? 'ring-unwatched' : o.ring === 'seen' ? 'ring-watched' : ''
  const type = o.type || 'none'; const src = o.src; const start = o.start || 0
  const videoRef = useRef<HTMLVideoElement>(null)
  useEffect(() => {
    const v = videoRef.current; if (!v || type !== 'live' || !src) return
    let raf = 0
    const go = () => {
      if (!v.isConnected) return
      const end = Math.min(start + 7, v.duration || start + 7)
      if (v.currentTime >= end - 0.04 || v.currentTime < start - 0.1) v.currentTime = start
      if (v.paused && v.isConnected) v.play().catch(() => {})
      raf = requestAnimationFrame(go)
    }
    const onMeta = () => { v.currentTime = start }
    v.addEventListener('loadedmetadata', onMeta); raf = requestAnimationFrame(go)
    return () => { cancelAnimationFrame(raf); v.removeEventListener('loadedmetadata', onMeta) }
  }, [src, type, start])
  useEffect(() => { const v = videoRef.current; if (v) v.muted = muted }, [muted])
  return (
    <span style={{ display: 'block', width: w }} onClick={onClick}>
      <svg className="drop" viewBox="-6 -4 112 218" style={{ width: '100%', display: 'block', overflow: 'visible' }}>
        <defs>
          <linearGradient id={`rg${n}`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#ff2f4d" /><stop offset="1" stopColor="#8a2be2" /></linearGradient>
          <radialGradient id={`gl${n}`} cx=".4" cy=".6" r=".7"><stop offset="0" stopColor="#6aa0ff" stopOpacity=".06" /><stop offset=".75" stopColor="#143070" stopOpacity=".10" /><stop offset="1" stopColor="#9fd0ff" stopOpacity=".40" /></radialGradient>
          <clipPath id={`c${n}`}><path d={P} /></clipPath>
        </defs>
        {ring && <path d={P} fill="none" strokeWidth={o.ring === 'new' ? 4.5 : 3} stroke={o.ring === 'new' ? `url(#rg${n})` : '#7a5560'} opacity={o.ring === 'seen' ? .55 : 1} />}
        <g transform={T}>
          <g clipPath={`url(#c${n})`}>
            {type === 'photo' && src && <image href={src} x={0} y={0} width={100} height={210} preserveAspectRatio="xMidYMid slice" />}
            {type === 'live' && src && (<foreignObject x="0" y="0" width="100" height="210"><video ref={videoRef} muted={muted} playsInline autoPlay src={src} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} /></foreignObject>)}
            {type === 'none' && <rect x="0" y="0" width={100} height={210} fill="#1a1f4a" />}
          </g>
          <path d={P} fill={`url(#gl${n})`} stroke="rgba(255,255,255,.55)" strokeWidth="1.4" />
        </g>
      </svg>
    </span>
  )
}

export default function ChatPage() {
  // Auth - Login / Sign Up
  const [myPhone, setMyPhone] = useState('')
  const [myName, setMyName] = useState('')
  const [isVerified, setIsVerified] = useState(false)
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login')
  const [phoneInput, setPhoneInput] = useState('')
  const [otpInput, setOtpInput] = useState('')
  const [codeSent, setCodeSent] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [sending, setSending] = useState(false)
  const [selectedCountry, setSelectedCountry] = useState(COUNTRIES[0])
  const [showCountryPicker, setShowCountryPicker] = useState(false)
  const [countrySearch, setCountrySearch] = useState('')
  const [signupName, setSignupName] = useState('')

  // App state
  const [me, setMe] = useState<Me>({ type: 'none' })
  const [chats, setChats] = useState<Chat[]>([])
  const [tab, setTab] = useState<'chat' | 'check' | 'call'>('chat')
  const [overlay, setOverlay] = useState<string | null>(null)
  const [openChat, setOpenChat] = useState<Chat | null>(null)
  const [openSelf, setOpenSelf] = useState(false)
  // FRESH - No auto message. Empty for every user.
  const [selfMsgs, setSelfMsgs] = useState<Msg[]>([])
  const [selfInput, setSelfInput] = useState('')
  const [chatInput, setChatInput] = useState('')
  const [chatMsgs, setChatMsgs] = useState<Record<string, Msg[]>>({})
  const [showEmoji, setShowEmoji] = useState(false)
  const [emojiCat, setEmojiCat] = useState<keyof typeof EMOJI_CATS>('Faces')
  const [emojiSearch, setEmojiSearch] = useState('')
  const [showAttach, setShowAttach] = useState(false)
  const [isRecordingVoice, setIsRecordingVoice] = useState(false)
  const voiceRecorderRef = useRef<MediaRecorder | null>(null)
  const voiceChunksRef = useRef<Blob[]>([])
  const [toast, setToast] = useState('')
  const [trimUrl, setTrimUrl] = useState(''); const [trimDur, setTrimDur] = useState(0); const [trimStart, setTrimStart] = useState(0)
  const [fullView, setFullView] = useState<any | null>(null)
  const [fullMuted, setFullMuted] = useState(true)
  const [showPlusMenu, setShowPlusMenu] = useState(false)
  const [recording, setRecording] = useState(false)
  const [recordUrl, setRecordUrl] = useState('')
  const galleryRef = useRef<HTMLInputElement>(null); const photoRef = useRef<HTMLInputElement>(null)
  const attachRef = useRef<HTMLInputElement>(null); const docRef = useRef<HTMLInputElement>(null)
  const fullVideoRef = useRef<HTMLVideoElement>(null)
  const msgsEndRef = useRef<HTMLDivElement>(null)
  const [searching, setSearching] = useState(false)
  const [searchText, setSearchText] = useState('')
  const [searchFilter, setSearchFilter] = useState<'all' | 'unread' | 'photo' | 'live'>('all')
  const searchInputRef = useRef<HTMLInputElement>(null)
  const confirmationRef = useRef<ConfirmationResult | null>(null)
  const recaptchaRef = useRef<RecaptchaVerifier | null>(null)
  const recaptchaDivRef = useRef<HTMLDivElement>(null)
  const recaptchaReady = useRef(false)

  // --- NEW: Select Contact / Contacts ---
  const [showSelectContact, setShowSelectContact] = useState(false)
  const [contacts, setContacts] = useState<Contact[]>([])
  const [contactSearch, setContactSearch] = useState('')
  const [showContactMenu, setShowContactMenu] = useState(false)
  const [showContactSettings, setShowContactSettings] = useState(false)
  const [showInvite, setShowInvite] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
  const [showBlocked, setShowBlocked] = useState(false)
  const [evaContactsOn, setEvaContactsOn] = useState(true)
  const [showNewContact, setShowNewContact] = useState(false)
  const [newName, setNewName] = useState('')
  const [newPhone, setNewPhone] = useState('')
  const [showGroup, setShowGroup] = useState(false)
  const [groupName, setGroupName] = useState('')
  const [showQR, setShowQR] = useState(false)
  const [qrTab, setQrTab] = useState<'my' | 'scan'>('my')
  const [scanInput, setScanInput] = useState('')
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)

  const showToast = (t: string) => { setToast(t); setTimeout(() => setToast(''), 2200) }
  const close = () => { setOverlay(null); setShowPlusMenu(false) }
  const setLive = (src: string, start: number) => { setMe({ type: 'live', src, start }); close(); setTab('chat'); setFullView(null); showToast('Live sticker set ✔') }
  const nowTime = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  const formatPhone = (raw: string) => {
    let p = raw.replace(/\D/g, '')
    if (p.startsWith('0')) p = p.slice(1)
    return selectedCountry.code + p
  }
  const filteredCountries = COUNTRIES.filter(c => c.name.toLowerCase().includes(countrySearch.toLowerCase()) || c.code.includes(countrySearch))

  // Contacts are saved PER USER - so logout does NOT delete them
  const contactsKey = myPhone ? `eva-contacts-${myPhone}` : 'eva-contacts'
  const chatsKey = myPhone ? `eva-chat-msgs-${myPhone}` : 'eva-chat-msgs'

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user && user.phoneNumber) {
        setMyPhone(user.phoneNumber)
        setIsVerified(true)
        localStorage.setItem('eva-my-phone', user.phoneNumber)
        localStorage.setItem('eva-phone-verified', 'true')
      }
    })
    return () => unsub()
  }, [])

  useEffect(() => {
    if (recaptchaReady.current) return
    if (!recaptchaDivRef.current) return
    try { recaptchaRef.current = new RecaptchaVerifier(auth, recaptchaDivRef.current, { size: 'invisible' }); recaptchaReady.current = true } catch {}
  }, [isVerified])

  // Load per-user data
  useEffect(() => {
    const saved = localStorage.getItem('eva-my-phone')
    const verified = localStorage.getItem('eva-phone-verified')
    if (saved && verified === 'true') { setMyPhone(saved); setIsVerified(true) }
    try {
      const s = localStorage.getItem('eva-self-msgs'); if (s) setSelfMsgs(JSON.parse(s))
      const m = localStorage.getItem('eva-me-droplet'); if (m) setMe(JSON.parse(m))
      const evaOn = localStorage.getItem('eva-contacts-enabled'); if (evaOn !== null) setEvaContactsOn(evaOn === 'true')
    } catch {}
  }, [])
  useEffect(() => {
    if (!myPhone) return
    try {
      const c = localStorage.getItem(`eva-contacts-${myPhone}`); if (c) setContacts(JSON.parse(c))
      else setContacts([])
      const cm = localStorage.getItem(`eva-chat-msgs-${myPhone}`); if (cm) setChatMsgs(JSON.parse(cm))
      const ch = localStorage.getItem(`eva-chats-${myPhone}`); if (ch) setChats(JSON.parse(ch))
    } catch {}
  }, [myPhone])

  useEffect(() => { try { localStorage.setItem('eva-self-msgs', JSON.stringify(selfMsgs)) } catch {} }, [selfMsgs])
  useEffect(() => { if (myPhone) { try { localStorage.setItem(`eva-chat-msgs-${myPhone}`, JSON.stringify(chatMsgs)) } catch {} } }, [chatMsgs, myPhone])
  useEffect(() => { if (myPhone) { try { localStorage.setItem(`eva-contacts-${myPhone}`, JSON.stringify(contacts)) } catch {} } }, [contacts, myPhone])
  useEffect(() => { if (myPhone) { try { localStorage.setItem(`eva-chats-${myPhone}`, JSON.stringify(chats)) } catch {} } }, [chats, myPhone])
  useEffect(() => { try { localStorage.setItem('eva-me-droplet', JSON.stringify(me)) } catch {} }, [me])
  useEffect(() => { try { localStorage.setItem('eva-contacts-enabled', String(evaContactsOn)) } catch {} }, [evaContactsOn])
  useEffect(() => { msgsEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [selfMsgs, chatMsgs, openChat, openSelf])

  const sendCode = async () => {
    if (authMode === 'signup' && !signupName.trim()) return showToast('Enter your name for Sign Up')
    const formatted = formatPhone(phoneInput)
    const digitsOnly = phoneInput.replace(/\D/g, '')
    if (digitsOnly.length < 7) return showToast('Enter a valid number')
    setSending(true)
    try {
      if (!recaptchaRef.current) {
        if (!recaptchaDivRef.current) throw new Error('reCAPTCHA not ready, reload page')
        recaptchaRef.current = new RecaptchaVerifier(auth, recaptchaDivRef.current, { size: 'invisible' })
      }
      const confirmation = await signInWithPhoneNumber(auth, formatted, recaptchaRef.current)
      confirmationRef.current = confirmation
      setMyPhone(formatted)
      setCodeSent(true)
      showToast('Code sent by Firebase ✔')
    } catch (e: any) {
      if (e.code === 'auth/invalid-phone-number') showToast('Invalid number for that country')
      else if (e.code === 'auth/too-many-requests') showToast('Too many tries. Wait 1 min')
      else if (e.code === 'auth/quota-exceeded') showToast('Daily SMS limit reached')
      else showToast(e.message || 'Could not send code')
    } finally { setSending(false) }
  }

  const verifyCode = async () => {
    if (otpInput.trim().length < 4) return showToast('Enter the code')
    if (!confirmationRef.current) return showToast('Send code first')
    setVerifying(true)
    try {
      const result = await confirmationRef.current.confirm(otpInput.trim())
      const phone = result.user.phoneNumber || myPhone
      localStorage.setItem('eva-my-phone', phone)
      localStorage.setItem('eva-phone-verified', 'true')
      localStorage.setItem('eva-user-id', result.user.uid)
      if (authMode === 'signup') localStorage.setItem(`eva-name-${phone}`, signupName.trim())
      setMyPhone(phone)
      setMyName(authMode === 'signup' ? signupName.trim() : (localStorage.getItem(`eva-name-${phone}`) || ''))
      setIsVerified(true)
      setCodeSent(false); setOtpInput('')
      showToast(authMode === 'signup' ? 'Account created ✔ Welcome to EVA Chat' : 'Number verified ✔ Welcome back to EVA Chat')
    } catch (e: any) {
      if (e.code === 'auth/invalid-verification-code') showToast('Wrong code, try again')
      else if (e.code === 'auth/code-expired') showToast('Code expired, resend code')
      else showToast('Wrong code')
    } finally { setVerifying(false) }
  }

  const doLogout = async () => {
    try { await signOut(auth) } catch {}
    // Real logout - data stays saved per-phone, only session clears
    localStorage.removeItem('eva-my-phone')
    localStorage.removeItem('eva-phone-verified')
    setIsVerified(false); setMyPhone(''); setMyName('')
    setCodeSent(false); setOtpInput(''); setPhoneInput('')
    setShowLogoutConfirm(false); setShowContactMenu(false); setShowSelectContact(false)
    setOpenChat(null); setOpenSelf(false)
    recaptchaReady.current = false; recaptchaRef.current = null
    showToast('Logged out ✔')
  }
    // --- Chat helpers ---
  const sendSelf = () => { const t = selfInput.trim(); if (!t) return; setSelfMsgs(p => [...p, { text: t, time: nowTime(), kind: 'text' }]); setSelfInput(''); setShowEmoji(false); setShowAttach(false) }
  const sendChat = () => {
    const t = chatInput.trim(); if (!t || !openChat) return
    setChatMsgs(p => ({ ...p, [openChat.name]: [...(p[openChat.name] || []), { text: t, time: nowTime(), kind: 'text' }] }))
    setChats(p => p.map(c => c.name === openChat.name ? { ...c, msg: t, time: nowTime() } : c))
    setChatInput(''); setShowEmoji(false); setShowAttach(false)
  }
  const addEmoji = (e: string, isSelf: boolean) => { if (isSelf) setSelfInput(p => p + e); else setChatInput(p => p + e) }
  const toggleVoice = async (isSelf: boolean) => {
    if (isRecordingVoice) { voiceRecorderRef.current?.stop(); setIsRecordingVoice(false); return }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mr = new MediaRecorder(stream); voiceChunksRef.current = []
      mr.ondataavailable = ev => voiceChunksRef.current.push(ev.data)
      mr.onstop = () => {
        const url = URL.createObjectURL(new Blob(voiceChunksRef.current, { type: mr.mimeType }))
        const msg: Msg = { time: nowTime(), audioUrl: url, kind: 'voice' }
        if (isSelf) setSelfMsgs(p => [...p, msg])
        else if (openChat) setChatMsgs(p => ({ ...p, [openChat.name]: [...(p[openChat.name] || []), msg] }))
        stream.getTracks().forEach(t => t.stop()); showToast('Voice note sent 🎤')
      }
      mr.start(); voiceRecorderRef.current = mr; setIsRecordingVoice(true)
    } catch { showToast('Mic not allowed') }
  }
  const handleGallery = (e: any) => {
    const f = e.target.files?.[0]; if (!f) return
    const url = URL.createObjectURL(f); const t = document.createElement('video'); t.src = url; t.preload = 'metadata'
    t.onloadedmetadata = () => { if (t.duration <= 7.05) setLive(url, 0); else { setTrimUrl(url); setTrimDur(t.duration); setTrimStart(0); setOverlay('trim'); setFullView(null) } }
    e.target.value = ''; setShowAttach(false)
  }
  const handlePhoto = (e: any) => {
    const f = e.target.files?.[0]; if (!f) return
    const url = URL.createObjectURL(f); setMe({ type: 'photo', src: url }); e.target.value = ''
    if (fullView && fullView.isMe) setFullView({ ...fullView, type: 'photo', src: url })
    showToast('Photo set ✔'); setShowAttach(false)
  }
  const handleAttach = (e: any) => { const f = e.target.files?.[0]; if (!f) return; showToast('File attached: ' + f.name); e.target.value = ''; setShowAttach(false) }
  const startRecord = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: true })
      const chunks: Blob[] = []; const mr = new MediaRecorder(stream)
      mr.ondataavailable = e => chunks.push(e.data)
      mr.onstop = () => { const url = URL.createObjectURL(new Blob(chunks, { type: mr.mimeType })); setRecordUrl(url); stream.getTracks().forEach(t => t.stop()) }
      mr.start(); setRecording(true); setTimeout(() => { mr.stop(); setRecording(false) }, 7000); setOverlay('record')
    } catch { showToast('Camera not allowed') }
  }

  // --- Contacts helpers ---
  const blockedContacts = contacts.filter(c => c.blocked)
  const visibleContacts = contacts.filter(c => !c.blocked)
  const filteredContacts = visibleContacts.filter(c => {
    const q = contactSearch.trim().toLowerCase(); if (!q) return true
    return c.name.toLowerCase().includes(q) || c.phone.includes(q)
  })
  const saveNewContact = () => {
    if (!newName.trim()) return showToast('Enter name')
    if (newPhone.replace(/\D/g, '').length < 7) return showToast('Enter valid number')
    const phone = newPhone.startsWith('+') ? newPhone : formatPhone(newPhone)
    if (contacts.some(c => c.phone === phone)) return showToast('Contact already exists')
    setContacts(p => [...p, { name: newName.trim(), phone }])
    setNewName(''); setNewPhone(''); setShowNewContact(false)
    showToast('Contact saved on EVA ✔')
  }
  const openContactChat = (c: Contact) => {
    setShowSelectContact(false); setContactSearch('')
    const existing = chats.find(x => x.phone === c.phone)
    if (existing) { setOpenChat(existing); return }
    const nc: Chat = { name: c.name, msg: '', time: nowTime(), ring: 'none', type: 'none', phone: c.phone }
    setChats(p => [nc, ...p]); setOpenChat(nc)
  }
  const createGroup = () => {
    if (!groupName.trim()) return showToast('Enter group name')
    const nc: Chat = { name: groupName.trim(), msg: '', time: nowTime(), ring: 'none', type: 'none', phone: 'group' }
    setChats(p => [nc, ...p]); setGroupName(''); setShowGroup(false); setShowSelectContact(false); setOpenChat(nc)
    showToast('Group created ✔')
  }
  const addFromQR = () => {
    const raw = scanInput.trim(); if (!raw) return showToast('Paste / scan a code')
    const phone = raw.replace('EVA:', '').trim()
    if (contacts.some(c => c.phone === phone)) return showToast('Already a contact')
    setContacts(p => [...p, { name: phone, phone }]); setScanInput(''); setShowQR(false); showToast('Added from QR ✔')
  }
  const toggleBlock = (phone: string) => setContacts(p => p.map(c => c.phone === phone ? { ...c, blocked: !c.blocked } : c))

  const isMeFull = fullView && fullView.isMe
  const q = searchText.trim().toLowerCase()
  const filteredChats = chats.filter(c => {
    if (searchFilter === 'unread' && c.ring !== 'new') return false
    if (searchFilter === 'photo' && c.type !== 'photo') return false
    if (searchFilter === 'live' && c.type !== 'live') return false
    if (!q) return true
    return c.name.toLowerCase().includes(q) || c.msg.toLowerCase().includes(q)
  })
  const showYouRow = !searching || !q || 'you'.includes(q)
  const selfLast = selfMsgs[selfMsgs.length - 1]
  const currentChatMsgs = openChat ? (chatMsgs[openChat.name] || []) : []
  const filteredEmojis = EMOJI_CATS[emojiCat].filter(e => !emojiSearch || e.includes(emojiSearch))
  const openFull = (obj: any) => { setFullView(obj); setFullMuted(true); setShowPlusMenu(false); setOverlay(null) }
  const closeFull = () => { setFullView(null); setFullMuted(true); setShowPlusMenu(false) }
  const closeSearch = () => { setSearching(false); setSearchText(''); setSearchFilter('all') }

  const ChatBar = ({ value, onChange, onSend, isSelf }: { value: string; onChange: (v: string) => void; onSend: () => void; isSelf: boolean }) => (
    <div style={{ background: '#0b0e24', padding: '8px 10px', paddingBottom: 'calc(env(safe-area-inset-bottom) + 12px)' }}>
      {showEmoji && (
        <div style={{ background: '#1a1f4a', borderRadius: 16, padding: 10, marginBottom: 8 }}>
          <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 6 }}>
            {Object.keys(EMOJI_CATS).map(cat => <button key={cat} onClick={() => setEmojiCat(cat as any)} style={{ background: emojiCat === cat ? '#ff2f6d' : '#2a2f5c', border: 0, color: '#fff', borderRadius: 16, padding: '6px 12px', fontSize: 12 }}>{cat}</button>)}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8,1fr)', gap: 4, maxHeight: 160, overflowY: 'auto' }}>
            {filteredEmojis.map(em => <button key={em} onClick={() => addEmoji(em, isSelf)} style={{ background: 'none', border: 0, fontSize: 26, padding: 4 }}>{em}</button>)}
          </div>
        </div>
      )}
      {showAttach && (
        <div style={{ background: '#1a1f4a', borderRadius: 16, padding: 12, marginBottom: 8 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => galleryRef.current?.click()} style={{ flex: 1, background: '#0e1230', border: 0, color: '#fff', borderRadius: 12, padding: 12, fontSize: 13 }}>🖼️<br/>Gallery</button>
            <button onClick={() => { setShowAttach(false); startRecord() }} style={{ flex: 1, background: '#0e1230', border: 0, color: '#fff', borderRadius: 12, padding: 12, fontSize: 13 }}>📷<br/>Camera</button>
            <button onClick={() => docRef.current?.click()} style={{ flex: 1, background: '#0e1230', border: 0, color: '#fff', borderRadius: 12, padding: 12, fontSize: 13 }}>📄<br/>Document</button>
          </div>
        </div>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button onClick={() => { setShowEmoji(!showEmoji); setShowAttach(false) }} style={{ background: 'none', border: 0, fontSize: 26, flexShrink: 0 }}>😊</button>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', background: '#171c46', borderRadius: 26, paddingRight: 4 }}>
          <input placeholder={isSelf ? 'Message yourself...' : 'Message...'} value={value} onChange={e => onChange(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') onSend() }} style={{ flex: 1, minWidth: 0, background: 'transparent', border: 0, outline: 'none', color: '#fff', fontSize: 15, padding: '12px 14px' }} />
          <button onClick={() => { setShowAttach(!showAttach); setShowEmoji(false) }} style={{ background: 'none', border: 0, padding: 0 }}><Droplet o={{ ...me, ring: 'none' }} w={24} /></button>
        </div>
        {value.trim() ? <button onClick={onSend} style={{ width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(90deg,#ff2f6d,#8a2be2)', border: 0, color: '#fff', fontSize: 20 }}>➤</button>
        : <button onClick={() => toggleVoice(isSelf)} style={{ width: 44, height: 44, borderRadius: '50%', background: isRecordingVoice ? '#ff2f6d' : '#00c853', border: 0, fontSize: 20 }}>🎤</button>}
      </div>
    </div>
  )
  const renderMsgs = (msgs: Msg[]) => (<>{msgs.map((m, i) => (<div key={i} className="b out">{m.kind === 'voice' && m.audioUrl ? <audio controls src={m.audioUrl} style={{ width: '100%' }} /> : m.text}<small>{m.time} ✓✓</small></div>))}<div ref={msgsEndRef} /></>)

  // ===== LOGIN / SIGNUP SCREEN =====
  if (!isVerified) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', background: '#050520', color: '#fff', fontFamily: 'system-ui,Arial', padding: 20, justifyContent: 'center' }}>
        <div ref={recaptchaDivRef} />
        <div style={{ textAlign: 'center', marginBottom: 18 }}><div style={{ fontSize: 48 }}>💬</div><h2 style={{ marginTop: 8 }}>{authMode === 'login' ? 'Log in to EVA' : 'Sign up for EVA'}</h2><p style={{ color: '#8a8fb0', fontSize: 13, marginTop: 4 }}>{authMode === 'login' ? 'Welcome back' : 'Create your EVA account'}</p></div>
        {/* Tabs: Login | Sign Up */}
        <div style={{ display: 'flex', background: '#171c46', borderRadius: 14, padding: 4, marginBottom: 16 }}>
          <button onClick={() => { setAuthMode('login'); setCodeSent(false) }} style={{ flex: 1, background: authMode === 'login' ? 'linear-gradient(90deg,#ff2f6d,#8a2be2)' : 'transparent', border: 0, color: '#fff', padding: 10, borderRadius: 10, fontWeight: 700 }}>Log In</button>
          <button onClick={() => { setAuthMode('signup'); setCodeSent(false) }} style={{ flex: 1, background: authMode === 'signup' ? 'linear-gradient(90deg,#ff2f6d,#8a2be2)' : 'transparent', border: 0, color: '#fff', padding: 10, borderRadius: 10, fontWeight: 700 }}>Sign Up</button>
        </div>
        {!codeSent ? (
          <>
            {authMode === 'signup' && (<><label style={{ fontSize: 13, color: '#8a8fb0' }}>Your name</label><input value={signupName} onChange={e => setSignupName(e.target.value)} placeholder="e.g. Dave" style={{ marginTop: 8, marginBottom: 14, width: '100%', background: '#171c46', border: 0, outline: 'none', color: '#fff', fontSize: 16, padding: 14, borderRadius: 14 }} /></>)}
            <label style={{ fontSize: 13, color: '#8a8fb0' }}>Your phone number</label>
            <div style={{ display: 'flex', marginTop: 8, background: '#171c46', borderRadius: 14, alignItems: 'center', overflow: 'hidden' }}>
              <button onClick={() => setShowCountryPicker(!showCountryPicker)} style={{ display: 'flex', gap: 4, background: 'transparent', border: 0, color: '#fff', padding: '14px 10px 14px 14px', fontSize: 16, whiteSpace: 'nowrap', borderRight: '1px solid rgba(255,255,255,0.1)' }}><span>{selectedCountry.flag}</span><span>{selectedCountry.code}</span><span style={{ fontSize: 10, opacity: 0.6 }}>▼</span></button>
              <input value={phoneInput} onChange={e => setPhoneInput(e.target.value.replace(/[^0-9]/g, ''))} placeholder="803 123 4567" inputMode="tel" style={{ flex: 1, background: 'transparent', border: 0, outline: 'none', color: '#fff', fontSize: 16, padding: '12px 8px', minWidth: 0 }} />
            </div>
            {showCountryPicker && (
              <div style={{ marginTop: 8, background: '#1a1f4a', borderRadius: 14, maxHeight: 280, overflowY: 'auto' }}>
                <input value={countrySearch} onChange={e => setCountrySearch(e.target.value)} placeholder="Search country" style={{ background: '#0e1230', border: 0, outline: 'none', color: '#fff', padding: '12px 14px', fontSize: 14, width: '100%' }} />
                {filteredCountries.map(c => <button key={c.name + c.code} onClick={() => { setSelectedCountry(c); setShowCountryPicker(false); setCountrySearch('') }} style={{ display: 'flex', justifyContent: 'space-between', width: '100%', background: 'transparent', border: 0, color: '#fff', padding: '12px 14px', fontSize: 15 }}><span>{c.flag} {c.name}</span><span style={{ color: '#8a8fb0' }}>{c.code}</span></button>)}
              </div>
            )}
            <button onClick={sendCode} disabled={sending} style={{ marginTop: 16, background: 'linear-gradient(90deg,#ff2f6d,#8a2be2)', border: 0, color: '#fff', padding: 15, borderRadius: 14, fontSize: 16, fontWeight: 700, opacity: sending ? 0.6 : 1 }}>{sending ? 'Sending...' : authMode === 'login' ? 'Log In - Send Code' : 'Sign Up - Send Code'}</button>
            <button onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')} style={{ marginTop: 12, background: 'none', border: 0, color: '#8a8fb0', padding: 10, fontSize: 14 }}>{authMode === 'login' ? "Don't have an EVA account? Sign up" : 'Already have an EVA account? Log in'}</button>
          </>
        ) : (
          <>
            <p style={{ textAlign: 'center', color: '#8a8fb0', fontSize: 14 }}>We sent a code to<br/><b style={{ color: '#fff' }}>{myPhone}</b></p>
            <input value={otpInput} onChange={e => setOtpInput(e.target.value.replace(/[^0-9]/g, ''))} placeholder="Enter 6-digit code" inputMode="numeric" maxLength={6} style={{ marginTop: 16, background: '#171c46', border: 0, outline: 'none', color: '#fff', fontSize: 20, padding: 16, borderRadius: 14, textAlign: 'center', letterSpacing: 6, width: '100%' }} />
            <button onClick={verifyCode} disabled={verifying} style={{ marginTop: 16, background: 'linear-gradient(90deg,#ff2f6d,#8a2be2)', border: 0, color: '#fff', padding: 15, borderRadius: 14, fontSize: 16, fontWeight: 700 }}>{verifying ? 'Verifying...' : authMode === 'login' ? 'Log In' : 'Create Account'}</button>
            <button onClick={() => { setCodeSent(false); setOtpInput('') }} style={{ marginTop: 10, background: 'none', border: 0, color: '#8a8fb0', padding: 10 }}>Change number</button>
          </>
        )}
        {toast && <div id="toast">{toast}</div>}
      </div>
    )
  }

  // ===== SELECT CONTACT SCREEN =====
  if (showSelectContact) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', background: '#050520', color: '#fff', fontFamily: 'system-ui,Arial', overflow: 'hidden' }}>
        <style>{`#toast{position:fixed;left:50%;bottom:90px;transform:translateX(-50%);background:#ff2f6d;padding:10px 16px;border-radius:20px;font-size:14px;z-index:20} .big{display:block;width:100%;background:#171c46;border:0;color:#fff;padding:14px;border-radius:12px;font-size:16px;margin-bottom:10px;text-align:left} .pri{background:linear-gradient(90deg,#ff2f6d,#8a2be2)}`}</style>
        <header style={{ padding: '14px 16px 10px', background: '#080b1c', position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><button onClick={() => setShowSelectContact(false)} style={{ background: 'none', border: 0, color: '#fff', fontSize: 22 }}>←</button><div><div style={{ fontSize: 19, fontWeight: 700 }}>Select contact</div><div style={{ fontSize: 12, color: '#8a8fb0' }}>{contacts.length} EVA contacts</div></div></div>
            <button onClick={() => setShowContactMenu(!showContactMenu)} style={{ background: 'none', border: 0, color: '#fff', fontSize: 22 }}>⋮</button>
          </div>
          {showContactMenu && (
            <div style={{ position: 'absolute', right: 12, top: 58, background: '#0e1230', border: '1px solid #23284f', borderRadius: 14, width: 210, padding: 8, zIndex: 20, boxShadow: '0 10px 30px rgba(0,0,0,.5)' }}>
              <button className="big" style={{ marginBottom: 6 }} onClick={() => { setShowContactMenu(false); setShowContactSettings(true) }}>Contact settings</button>
              <button className="big" style={{ marginBottom: 6 }} onClick={() => { setShowContactMenu(false); setShowInvite(true) }}>Invite</button>
              <button className="big" style={{ marginBottom: 6 }} onClick={() => { setShowContactMenu(false); setShowHelp(true) }}>Help</button>
              <button className="big" style={{ marginBottom: 0, color: '#ff6b7a' }} onClick={() => { setShowContactMenu(false); setShowLogoutConfirm(true) }}>Log out</button>
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#1a1f4a', borderRadius: 22, padding: '11px 14px', marginTop: 12 }}><span>🔍</span><input value={contactSearch} onChange={e => setContactSearch(e.target.value)} placeholder="Search EVA contacts" style={{ flex: 1, background: 'transparent', border: 0, outline: 'none', color: '#fff', fontSize: 15 }} /></div>
        </header>
        <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px' }}>
            <button onClick={() => setShowGroup(true)} style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 12, background: 'transparent', border: 0, color: '#fff', textAlign: 'left', padding: 0 }}><span style={{ width: 46, height: 46, borderRadius: '50%', background: '#171c46', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>👥</span><b>Group</b></button>
            <button onClick={() => setShowNewContact(true)} style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 12, background: 'transparent', border: 0, color: '#fff', textAlign: 'left', padding: 0 }}><span style={{ width: 46, height: 46, borderRadius: '50%', background: '#171c46', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>👤</span><b>New contact</b></button>
            <button onClick={() => setShowQR(true)} title="EVA QR Code" style={{ width: 46, height: 46, borderRadius: '50%', background: 'linear-gradient(90deg,#ff2f6d,#8a2be2)', border: 0, color: '#fff', fontSize: 20 }}>▦</button>
          </div>
          <div style={{ padding: '6px 16px', fontSize: 12, color: '#8a8fb0' }}>EVA contacts on EVA</div>
          <div style={{ display: 'flex', gap: 14, alignItems: 'center', padding: '10px 16px', cursor: 'pointer' }} onClick={() => setOpenSelf(true)}>
            <Droplet o={{ ...me, ring: 'none' }} w={46} /><div style={{ flex: 1 }}><div style={{ fontWeight: 600 }}>You</div><div style={{ fontSize: 13, color: '#8a8fb0' }}>Message yourself • {myPhone}</div></div><span style={{ fontSize: 12, color: '#8a8fb0' }}>You</span>
          </div>
          {filteredContacts.map((c, i) => (
            <div key={i} style={{ display: 'flex', gap: 14, alignItems: 'center', padding: '10px 16px' }}>
              <div onClick={() => openContactChat(c)} style={{ display: 'flex', gap: 14, alignItems: 'center', flex: 1, cursor: 'pointer' }}><Droplet o={{ name: c.name, ring: 'none', type: 'none' }} w={46} /><div><div style={{ fontWeight: 600 }}>{c.name}</div><div style={{ fontSize: 13, color: '#8a8fb0' }}>{c.phone}</div></div></div>
              <button onClick={() => toggleBlock(c.phone)} style={{ background: 'none', border: 0, color: '#8a8fb0', fontSize: 18 }}>🚫</button>
            </div>
          ))}
          {filteredContacts.length === 0 && <div style={{ textAlign: 'center', color: '#8a8fb0', padding: '30px 20px', fontSize: 14 }}>{contacts.length === 0 ? 'No EVA contacts yet. Tap New contact to add one.' : 'No match found'}</div>}
        </div>
        {showContactSettings && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', zIndex: 30, display: 'flex', alignItems: 'flex-end' }} onClick={() => setShowContactSettings(false)}>
            <div style={{ background: '#0e1230', width: '100%', borderRadius: '20px 20px 0 0', padding: 18, maxHeight: '80vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
              <h3>Contact settings</h3>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#171c46', borderRadius: 12, padding: 14, marginTop: 12 }}>
                <div><b>EVA contacts</b><div style={{ fontSize: 12, color: '#8a8fb0' }}>Save contacts to your EVA account</div></div>
                <button onClick={() => setEvaContactsOn(!evaContactsOn)} style={{ width: 50, height: 28, borderRadius: 20, background: evaContactsOn ? '#00c853' : '#2a2f5c', border: 0, position: 'relative' }}><span style={{ position: 'absolute', top: 3, left: evaContactsOn ? 24 : 3, width: 22, height: 22, borderRadius: '50%', background: '#fff', display: 'block' }} /></button>
              </div>
              <button className="big" style={{ marginTop: 12 }} onClick={() => { setShowContactSettings(false); setShowBlocked(true) }}>Blocked accounts • {blockedContacts.length}</button>
              <button className="big" onClick={() => setShowContactSettings(false)}>Close</button>
            </div>
          </div>
        )}
        {showBlocked && (
          <div style={{ position: 'fixed', inset: 0, background: '#050520', zIndex: 31, display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', padding: 14 }}><button onClick={() => setShowBlocked(false)} style={{ background: 'none', border: 0, color: '#fff', fontSize: 22 }}>←</button><b>Blocked accounts • {blockedContacts.length}</b></div>
            <div style={{ flex: 1, overflowY: 'auto' }}>{blockedContacts.length === 0 && <div style={{ textAlign: 'center', color: '#8a8fb0', padding: 30 }}>0 blocked accounts</div>}{blockedContacts.map((c, i) => <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px' }}><div><b>{c.name}</b><div style={{ fontSize: 13, color: '#8a8fb0' }}>{c.phone}</div></div><button onClick={() => toggleBlock(c.phone)} style={{ background: '#171c46', border: 0, color: '#fff', borderRadius: 10, padding: '8px 12px' }}>Unblock</button></div>)}</div>
          </div>
        )}
        {showInvite && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', zIndex: 30, display: 'flex', alignItems: 'flex-end' }} onClick={() => setShowInvite(false)}>
            <div style={{ background: '#0e1230', width: '100%', borderRadius: '20px 20px 0 0', padding: 18 }} onClick={e => e.stopPropagation()}><h3>Invite</h3><p style={{ color: '#8a8fb0', fontSize: 14, marginTop: 8 }}>Invite people to EVA. Share your link: <b style={{ color: '#fff' }}>eva.chat/{myPhone}</b></p><button className="big pri" onClick={() => { navigator.clipboard?.writeText(`Join me on EVA Chat: eva.chat/${myPhone}`); showToast('Invite link copied ✔') }}>Copy Invite Link</button><button className="big" onClick={() => setShowInvite(false)}>Close</button></div>
          </div>
        )}
        {showHelp && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', zIndex: 30, display: 'flex', alignItems: 'flex-end' }} onClick={() => setShowHelp(false)}>
            <div style={{ background: '#0e1230', width: '100%', borderRadius: '20px 20px 0 0', padding: 18 }} onClick={e => e.stopPropagation()}><h3>Help</h3><p style={{ color: '#8a8fb0', fontSize: 14, marginTop: 8 }}>Help content coming soon. We will decide what to put here.</p><button className="big" onClick={() => setShowHelp(false)}>Close</button></div>
          </div>
        )}
        {showNewContact && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', zIndex: 32, display: 'flex', alignItems: 'flex-end' }} onClick={() => setShowNewContact(false)}>
            <div style={{ background: '#0e1230', width: '100%', borderRadius: '20px 20px 0 0', padding: 18 }} onClick={e => e.stopPropagation()}><h3>New contact</h3><label style={{ fontSize: 13, color: '#8a8fb0' }}>Name</label><input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Contact name" style={{ width: '100%', background: '#171c46', border: 0, outline: 'none', color: '#fff', padding: 14, borderRadius: 12, margin: '8px 0 12px' }} /><label style={{ fontSize: 13, color: '#8a8fb0' }}>Phone number</label><input value={newPhone} onChange={e => setNewPhone(e.target.value)} placeholder="+234..." inputMode="tel" style={{ width: '100%', background: '#171c46', border: 0, outline: 'none', color: '#fff', padding: 14, borderRadius: 12, margin: '8px 0 12px' }} /><button className="big pri" onClick={saveNewContact}>Save on EVA ✔</button><button className="big" onClick={() => setShowNewContact(false)}>Cancel</button></div>
          </div>
        )}
        {showGroup && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', zIndex: 32, display: 'flex', alignItems: 'flex-end' }} onClick={() => setShowGroup(false)}>
            <div style={{ background: '#0e1230', width: '100%', borderRadius: '20px 20px 0 0', padding: 18 }} onClick={e => e.stopPropagation()}><h3>Group</h3><input value={groupName} onChange={e => setGroupName(e.target.value)} placeholder="Group name" style={{ width: '100%', background: '#171c46', border: 0, outline: 'none', color: '#fff', padding: 14, borderRadius: 12, margin: '8px 0 12px' }} /><button className="big pri" onClick={createGroup}>Create Group ✔</button><button className="big" onClick={() => setShowGroup(false)}>Cancel</button></div>
          </div>
        )}
        {showQR && (
          <div style={{ position: 'fixed', inset: 0, background: '#050520', zIndex: 33, display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', padding: 14 }}><button onClick={() => setShowQR(false)} style={{ background: 'none', border: 0, color: '#fff', fontSize: 22 }}>←</button><b>EVA QR Code</b></div>
            <div style={{ display: 'flex', background: '#171c46', borderRadius: 14, padding: 4, margin: '0 16px' }}>
              <button onClick={() => setQrTab('my')} style={{ flex: 1, background: qrTab === 'my' ? 'linear-gradient(90deg,#ff2f6d,#8a2be2)' : 'transparent', border: 0, color: '#fff', padding: 10, borderRadius: 10, fontWeight: 700 }}>My Code</button>
              <button onClick={() => setQrTab('scan')} style={{ flex: 1, background: qrTab === 'scan' ? 'linear-gradient(90deg,#ff2f6d,#8a2be2)' : 'transparent', border: 0, color: '#fff', padding: 10, borderRadius: 10, fontWeight: 700 }}>Scan Code</button>
            </div>
            {qrTab === 'my' ? (
              <div style={{ textAlign: 'center', padding: 20 }}><div style={{ background: '#fff', borderRadius: 16, padding: 16, display: 'inline-block' }}><img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent('EVA:' + myPhone)}`} alt="My EVA QR" style={{ width: 200, height: 200 }} /></div><div style={{ marginTop: 12, fontWeight: 700 }}>{myName || 'You'}</div><div style={{ color: '#8a8fb0' }}>{myPhone}</div><p style={{ color: '#8a8fb0', fontSize: 13, marginTop: 8 }}>Let someone scan this to add you on EVA</p></div>
            ) : (
              <div style={{ padding: 20, textAlign: 'center' }}><div style={{ fontSize: 48 }}>📷</div><p style={{ color: '#8a8fb0', fontSize: 14, marginTop: 8 }}>Point camera at an EVA QR code.<br/>For now paste the scanned code below:</p><input value={scanInput} onChange={e => setScanInput(e.target.value)} placeholder="EVA:+234..." style={{ width: '100%', background: '#171c46', border: 0, outline: 'none', color: '#fff', padding: 14, borderRadius: 12, marginTop: 14 }} /><button className="big pri" style={{ marginTop: 12 }} onClick={addFromQR}>Add from QR ✔</button></div>
            )}
          </div>
        )}
        {showLogoutConfirm && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', zIndex: 34, display: 'flex', alignItems: 'flex-end' }} onClick={() => setShowLogoutConfirm(false)}>
            <div style={{ background: '#0e1230', width: '100%', borderRadius: '20px 20px 0 0', padding: 18 }} onClick={e => e.stopPropagation()}><h3>Log out of EVA?</h3><p style={{ color: '#8a8fb0', fontSize: 14, marginTop: 8 }}>Your contacts and chats are saved. You can log in again with any number.</p><button className="big" style={{ marginTop: 12, background: '#ff2f4d' }} onClick={doLogout}>Log Out</button><button className="big" onClick={() => setShowLogoutConfirm(false)}>Cancel</button></div>
          </div>
        )}
        {toast && <div id="toast">{toast}</div>}
      </div>
    )
  }

  // ===== MAIN CHAT SCREEN =====
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', background: '#050520', color: '#fff', fontFamily: 'system-ui,Arial', overflow: 'hidden' }}>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent}
        #screen{flex:1;overflow-y:auto;padding-bottom:10px;min-height:0}
        #nav{display:flex;background:#0b0e24;border-top:1px solid #1b1f3d;padding-bottom:env(safe-area-inset-bottom)}
        #nav button{flex:1;background:none;border:0;color:#8a8fb0;padding:10px 0;font-size:14px}
        #nav button span{display:block;font-size:22px}
        #nav button.on{color:#ff3b6b}
        .drop{display:block;overflow:visible;background:none}
        .row{display:flex;align-items:center;gap:14px;padding:10px 18px}
        .row .info{flex:1;min-width:0;cursor:pointer}
        .row .name{font-weight:600;font-size:16px}
        .row .sub{font-size:13px;color:#8a8fb0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .row .time{font-size:12px;color:#8a8fb0}
        .section{padding:10px 18px 4px;font-size:13px;color:#8a8fb0}
        #overlay{position:fixed;inset:0;background:rgba(0,0,0,.55);display:flex;justify-content:center;align-items:flex-start;padding-top:70px;z-index:10}
        #overlay.sheet{align-items:flex-end;padding-top:0}
        .sheetbox{background:#0e1230;width:100%;border-radius:20px 20px 0 0;padding:18px;max-height:88vh;overflow-y:auto}
        .sheetbox h3{margin-bottom:12px}
        .big{display:block;width:100%;background:#171c46;border:0;color:#fff;padding:14px;border-radius:12px;font-size:16px;margin-bottom:10px;text-align:left}
        .pri{background:linear-gradient(90deg,#ff2f6d,#8a2be2)}
        .vid{width:100%;max-height:300px;border-radius:12px;background:#000;margin-bottom:10px}
        .range{width:100%;margin:8px 0}
        .small{font-size:13px;color:#8a8fb0;margin-bottom:8px}
        .grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
        .grid button{background:#171c46;border:0;color:#fff;border-radius:12px;padding:12px 4px;font-size:13px}
        .grid button b{display:block;font-size:30px}
        #toast{position:fixed;left:50%;bottom:90px;transform:translateX(-50%);background:#ff2f6d;padding:10px 16px;border-radius:20px;font-size:14px;z-index:20}
        .chathead{display:flex;align-items:center;gap:12px;padding:8px 14px;background:#0b0e24;flex-shrink:0}
        .chathead .back{background:none;border:0;color:#fff;font-size:24px}
        .msgs{flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:8px;min-height:0}
        .b{max-width:78%;padding:8px 12px;border-radius:14px;font-size:15px}
        .b small{display:block;text-align:right;font-size:11px;opacity:.7;margin-top:2px}
        .in{background:#1a1f4a;align-self:flex-start}
        .out{background:#6a2a8f;align-self:flex-end}
        .fullAction{width:56px;height:56px;border-radius:50%;background:#171c46;border:0;color:#fff;font-size:24px;display:flex;align-items:center;justify-content:center;cursor:pointer}
        .fullAction.plus{background:linear-gradient(90deg,#ff2f6d,#8a2be2);color:#fff;font-weight:700}
        .sideBtn{background:#171c46;border:1px solid #2a2f5c;color:#fff;border-radius:20px;padding:7px 11px;font-size:12px;cursor:pointer;white-space:nowrap}
        .waSearchBar{display:flex;align-items:center;gap:10px;background:#1a1f4a;border-radius:22px;padding:11px 14px;color:#8a8fb0;font-size:15px;cursor:text}
      `}</style>
      {!openChat && !openSelf && !searching && (
        <header style={{ padding: '14px 16px 10px', background: '#080b1c' }}>
          <div style={{ fontSize: 22, fontWeight: 700, textAlign: 'right' }}>EVA Chat</div>
          <div style={{ fontSize: 12, color: '#8a8fb0', textAlign: 'right', marginTop: 2 }}>{myPhone} • Verified ✔</div>
          <div className="waSearchBar" style={{ marginTop: 12 }} onClick={() => setSearching(true)}><span>🔍</span><span>Search</span></div>
        </header>
      )}
      {!openChat && !openSelf && searching && (
        <header style={{ padding: '12px 12px 10px', background: '#080b1c' }}>
          <div style={{ display: 'flex', alignItems: 'center', background: '#1a1f4a', borderRadius: 22, padding: '6px' }}>
            <button onClick={closeSearch} style={{ background: 'none', border: 0, color: '#fff', fontSize: 22, padding: '6px 8px' }}>←</button>
            <input ref={searchInputRef} value={searchText} onChange={e => setSearchText(e.target.value)} placeholder="Search" style={{ flex: 1, background: 'none', border: 0, outline: 'none', color: '#fff', fontSize: 15 }} />
          </div>
        </header>
      )}
      <main id="screen" style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        {openSelf ? (
          <>
            <div className="chathead"><button className="back" onClick={() => setOpenSelf(false)}>←</button><Droplet o={{ ...me, ring: 'none' }} w={36} onClick={() => openFull({ ...me, name: 'You', isMe: true })} /><div><b>You</b><div style={{ fontSize: 12, color: '#8a8fb0' }}>Message yourself • {myPhone}</div></div></div>
            <div className="msgs">{selfMsgs.length === 0 && <div style={{ textAlign: 'center', color: '#8a8fb0', fontSize: 13, paddingTop: 20 }}>No messages yet. This is your space.</div>}{renderMsgs(selfMsgs)}</div>
            <ChatBar value={selfInput} onChange={setSelfInput} onSend={sendSelf} isSelf={true} />
          </>
        ) : openChat ? (
          <>
            <div className="chathead"><button className="back" onClick={() => setOpenChat(null)}>←</button><Droplet o={{ ...openChat, ring: 'none' }} w={36} /><div><b>{openChat.name}</b><div style={{ fontSize: 12, color: '#8a8fb0' }}>{openChat.phone || ''}</div></div></div>
            <div className="msgs">
              {currentChatMsgs.length === 0 && <div style={{ textAlign: 'center', color: '#8a8fb0', fontSize: 13, paddingTop: 20 }}>No messages yet. Say hi 👋</div>}
              {renderMsgs(currentChatMsgs)}
            </div>
            <ChatBar value={chatInput} onChange={setChatInput} onSend={sendChat} isSelf={false} />
          </>
        ) : tab === 'chat' ? (
          <>
            {showYouRow && (
              <div className="row">
                <Droplet o={{ ...me, ring: 'none' }} w={46} onClick={(e) => { e.stopPropagation(); openFull({ ...me, name: 'You', isMe: true }) }} />
                <div className="info" onClick={() => { closeSearch(); setOpenSelf(true) }}><div className="name">You</div><div className="sub">{selfLast ? (selfLast.text || '🎤 Voice note') : 'Message yourself'}</div></div>
                <div className="time">{selfLast ? selfLast.time : 'You'}</div>
              </div>
            )}
            {filteredChats.map((c, i) => (
              <div key={i} className="row">
                <Droplet o={c} w={46} onClick={(e) => { e.stopPropagation(); openFull({ ...c, isMe: false }) }} />
                <div className="info" onClick={() => { closeSearch(); setOpenChat(c) }}><div className="name">{c.name}</div><div className="sub">{c.msg}</div></div>
                <div className="time">{c.time}</div>
              </div>
            ))}
            {filteredChats.length === 0 && <div style={{ textAlign: 'center', padding: '40px 20px', color: '#8a8fb0' }}><div style={{ fontSize: 40 }}>💬</div><b style={{ color: '#fff' }}>No chats yet</b></div>}
          </>
        ) : tab === 'check' ? (
          <><div className="section">Recent Checks</div>{chats.filter(c => c.ring !== 'none').map((c, i) => (<div key={i} className="row"><Droplet o={c} w={46} /><div className="info"><div className="name">{c.name}</div><div className="sub">Viewed</div></div></div>))}</>
        ) : (
          <><div className="section">Recent Calls</div>{chats.map((c, i) => (<div key={i} className="row"><Droplet o={{ ...c, ring: 'none' }} w={46} /><div className="info"><div className="name">{c.name}</div><div className="sub">↗ Today, 9:20</div></div><div className="time">📞</div></div>))}</>
        )}
      </main>
      {!openChat && !openSelf && (
        <nav id="nav">
          <button className={tab === 'chat' ? 'on' : ''} onClick={() => { setTab('chat'); closeSearch() }}><span>💬</span>Chat</button>
          <button className={tab === 'check' ? 'on' : ''} onClick={() => { setTab('check'); closeSearch() }}><span>✔</span>Check</button>
          <button className={tab === 'call' ? 'on' : ''} onClick={() => { setTab('call'); closeSearch() }}><span>📞</span>Call</button>
          <button onClick={() => setShowSelectContact(true)}><span style={{ fontSize: 26, lineHeight: 1 }}>＋</span>＋</button>
        </nav>
      )}
      {fullView && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.65)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={closeFull}>
          <div style={{ width: 340, maxWidth: '100%', height: 410, maxHeight: '88dvh', background: '#0e1230', border: '1px solid #23284f', borderRadius: 22, position: 'relative', textAlign: 'center', overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
            <div style={{ position: 'absolute', top: 10, left: 0, right: 0, fontWeight: 700, fontSize: 15, zIndex: 3 }}>{fullView.name}</div>
            <div style={{ position: 'absolute', left: 10, top: 46, display: 'flex', flexDirection: 'column', gap: 8, zIndex: 3 }}>
              <button className="sideBtn" onClick={(e) => { e.stopPropagation(); photoRef.current?.click() }}>🖼️ Add photo</button>
              <button className="sideBtn" onClick={(e) => { e.stopPropagation(); setMe({ type: 'none' }); if (isMeFull) setFullView({ ...fullView, type: 'none', src: undefined }); showToast('Photo removed') }}>🗑️ Remove</button>
            </div>
            <div style={{ position: 'absolute', right: 10, top: 46, zIndex: 3 }}><button className="sideBtn" onClick={(e) => { e.stopPropagation(); setFullMuted(!fullMuted) }}>{fullMuted ? '🔇 Mute' : '🔊 Sound'}</button></div>
            <div style={{ position: 'absolute', inset: 0, top: -24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ width: 180 }}><Droplet o={{ ...fullView, ring: 'none' }} w={180} muted={fullMuted} /></div></div>
            {fullView.type === 'live' && fullView.src && <video ref={fullVideoRef} src={fullView.src} muted={fullMuted} playsInline autoPlay style={{ display: 'none' }} />}
            <div style={{ position: 'absolute', left: 12, right: 12, bottom: 10, zIndex: 3 }}><div style={{ display: 'flex', justifyContent: 'space-between', maxWidth: 320, margin: '0 auto' }}>
              <button className="fullAction" onClick={() => { closeFull(); if (fullView.name === 'You') setOpenSelf(true); else setOpenChat(fullView as Chat) }}>💬</button>
              <button className="fullAction" onClick={() => showToast('Voice call ' + fullView.name)}>📞</button>
              <button className="fullAction plus" onClick={() => setShowPlusMenu(!showPlusMenu)}>+</button>
              <button className="fullAction" onClick={() => showToast('Video call ' + fullView.name)}>🎥</button>
            </div></div>
          </div>
        </div>
      )}
      {overlay === 'upload' && (<div id="overlay" className="sheet" onClick={(e) => { if (e.target === e.currentTarget) close() }}><div className="sheetbox"><h3>Upload</h3><button className="big" onClick={() => { close(); galleryRef.current?.click() }}>🖼️ Gallery</button><button className="big" onClick={() => setOverlay('stickers')}>✨ Live Stickers</button></div></div>)}
      {overlay === 'stickers' && (<div id="overlay" className="sheet" onClick={(e) => { if (e.target === e.currentTarget) close() }}><div className="sheetbox"><h3>Live Stickers</h3><div className="grid">{STICKERS.map((s, i) => <button key={i} onClick={() => setLive(s.src, 0)}><b>{s.e}</b>{s.name}</button>)}</div></div></div>)}
      {overlay === 'trim' && (<div id="overlay" className="sheet" onClick={(e) => { if (e.target === e.currentTarget) close() }}><div className="sheetbox"><h3>Trim to 7 seconds</h3><video className="vid" muted playsInline autoPlay src={trimUrl} /><input className="range" type="range" min="0" max={Math.max(0, trimDur - 7)} step="0.1" value={trimStart} onChange={e => setTrimStart(+e.target.value)} /><button className="big pri" onClick={() => setLive(trimUrl, trimStart)}>Upload</button></div></div>)}
      {overlay === 'record' && (<div id="overlay" className="sheet" onClick={(e) => { if (e.target === e.currentTarget) close() }}><div className="sheetbox"><h3>Record (max 7 sec)</h3><p className="small">{recording ? 'Recording… 7 sec' : recordUrl ? 'Done (7 sec)' : 'Recording...'}</p>{recordUrl && <video className="vid" muted playsInline autoPlay loop src={recordUrl} />}{recordUrl && <button className="big pri" onClick={() => setLive(recordUrl, 0)}>Upload</button>}<button className="big" onClick={close}>Cancel</button></div></div>)}
      <input ref={galleryRef} type="file" accept="video/*" hidden onChange={handleGallery} />
      <input ref={photoRef} type="file" accept="image/*" hidden onChange={handlePhoto} />
      <input ref={attachRef} type="file" hidden onChange={handleAttach} />
      <input ref={docRef} type="file" hidden onChange={handleAttach} />
      {toast && <div id="toast">{toast}</div>}
    </div>
  )
}
