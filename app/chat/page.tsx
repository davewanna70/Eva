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

type Chat = { name: string; msg: string; time: string; ring: 'new' | 'seen' | 'none'; type: 'none' | 'photo' | 'live'; src?: string; start?: number; phone?: string }
type Me = { type: 'none' | 'photo' | 'live'; src?: string; start?: number }
type Msg = { text?: string; time: string; audioUrl?: string; kind?: 'text' | 'voice' }
type Contact = { name: string; phone: string; blocked?: boolean }

const STICKERS = [{ name: 'Aki', src: 'stickers/aki.mp4', e: '😎' }, { name: 'Pawpaw', src: 'stickers/pawpaw.mp4', e: '🐶' }, { name: 'Fire', src: 'stickers/fire.mp4', e: '🔥' }]
const COUNTRIES = [
  { name: 'Nigeria', code: '+234', flag: '🇳🇬' }, { name: 'Benin', code: '+229', flag: '🇧🇯' },
  { name: 'Ghana', code: '+233', flag: '🇬🇭' }, { name: 'United States', code: '+1', flag: '🇺🇸' },
  { name: 'United Kingdom', code: '+44', flag: '🇬🇧' }, { name: 'Canada', code: '+1', flag: '🇨🇦' },
  { name: 'South Africa', code: '+27', flag: '🇿🇦' }, { name: 'Kenya', code: '+254', flag: '🇰🇪' },
  { name: 'India', code: '+91', flag: '🇮🇳' }, { name: 'France', code: '+33', flag: '🇫🇷' },
]
const EMOJI_CATS: Record<string, string[]> = {
  Faces: ['😂','❤️','😍','🔥','😭','😎','🥰','😅','👏','😉','💯','😁','🤣','😘','😊'],
  Hands: ['👍','🙏','👏','✌️','🤞','👌','🤲','🖐️','👋','💪','🫶'],
  Animals: ['🐶','🐱','🦁','🐯','🐵','🐷','🐥','🦋','🐢','🦄','🐝','🦊'],
}
const P = 'M50,0 C70,40 100,90 100,140 C100,180 80,210 50,210 C20,210 0,180 0,140 C0,90 30,40 50,0 Z'
const T = 'translate(5,10.5) scale(.9)'
let uidCounter = 0

// FIX: Convert file to DataURL so it stays after close / minimize / reload. Blob URL does not stay.
const fileToDataURL = (f: File) => new Promise<string>((res, rej) => {
  const r = new FileReader(); r.onload = () => res(String(r.result)); r.onerror = rej; r.readAsDataURL(f)
})

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

// FIX KEYBOARD: ChatBar is OUTSIDE ChatPage now. Before it was inside, every letter closed the input and keyboard. Now the input stays open, you can type 100 words.
function ChatBar({ value, onChange, onSend, isSelf, me, showEmoji, setShowEmoji, showAttach, setShowAttach, emojiCat, setEmojiCat, filteredEmojis, addEmoji, galleryRef, docRef, startRecord, toggleVoice, isRecordingVoice }: any) {
  return (
    <div style={{ background: '#0b0e24', padding: '8px 10px', paddingBottom: 'calc(env(safe-area-inset-bottom) + 12px)' }}>
      {showEmoji && (
        <div style={{ background: '#1a1f4a', borderRadius: 16, padding: 10, marginBottom: 8 }}>
          <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 6 }}>
            {Object.keys(EMOJI_CATS).map(cat => <button key={cat} onClick={() => setEmojiCat(cat as any)} style={{ background: emojiCat === cat ? '#ff2f6d' : '#2a2f5c', border: 0, color: '#fff', borderRadius: 16, padding: '6px 12px', fontSize: 12 }}>{cat}</button>)}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8,1fr)', gap: 4, maxHeight: 160, overflowY: 'auto' }}>
            {filteredEmojis.map((em: string) => <button key={em} onClick={() => addEmoji(em, isSelf)} style={{ background: 'none', border: 0, fontSize: 26, padding: 4 }}>{em}</button>)}
          </div>
        </div>
      )}
      {showAttach && (
        <div style={{ background: '#1a1f4a', borderRadius: 16, padding: 12, marginBottom: 8 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => galleryRef.current?.click()} style={{ flex: 1, background: '#0e1230', border: 0, color: '#fff', borderRadius: 12, padding: 12, fontSize: 13 }}>🖼️<br />Gallery</button>
            <button onClick={() => { setShowAttach(false); startRecord() }} style={{ flex: 1, background: '#0e1230', border: 0, color: '#fff', borderRadius: 12, padding: 12, fontSize: 13 }}>📷<br />Camera</button>
            <button onClick={() => docRef.current?.click()} style={{ flex: 1, background: '#0e1230', border: 0, color: '#fff', borderRadius: 12, padding: 12, fontSize: 13 }}>📄<br />Document</button>
          </div>
        </div>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button onClick={() => { setShowEmoji(!showEmoji); setShowAttach(false) }} style={{ background: 'none', border: 0, fontSize: 26, flexShrink: 0 }}>😊</button>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', background: '#171c46', borderRadius: 26, paddingRight: 4 }}>
          <input placeholder={isSelf ? 'Message yourself...' : 'Message...'} value={value} onChange={e => onChange(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') onSend() }} autoComplete="off" enterKeyHint="send" style={{ flex: 1, minWidth: 0, background: 'transparent', border: 0, outline: 'none', color: '#fff', fontSize: 15, padding: '12px 14px' }} />
          <button onClick={() => { setShowAttach(!showAttach); setShowEmoji(false) }} style={{ background: 'none', border: 0, padding: 0 }}><Droplet o={{ ...me, ring: 'none' }} w={24} /></button>
        </div>
        {value.trim() ? <button onClick={onSend} style={{ width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(90deg,#ff2f6d,#8a2be2)', border: 0, color: '#fff', fontSize: 20 }}>➤</button>
          : <button onClick={() => toggleVoice(isSelf)} style={{ width: 44, height: 44, borderRadius: '50%', background: isRecordingVoice ? '#ff2f6d' : '#00c853', border: 0, fontSize: 20 }}>🎤</button>}
      </div>
    </div>
  )
}

export default function ChatPage() {
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
  const [me, setMe] = useState<Me>({ type: 'none' })
  const [chats, setChats] = useState<Chat[]>([])
  const [tab, setTab] = useState<'chat' | 'check' | 'call'>('chat')
  const [overlay, setOverlay] = useState<string | null>(null)
  const [openChat, setOpenChat] = useState<Chat | null>(null)
  const [openSelf, setOpenSelf] = useState(false)
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
  const [searchText, setSearchText] = useState('')
  const searchInputRef = useRef<HTMLInputElement>(null)
  const confirmationRef = useRef<ConfirmationResult | null>(null)
  const recaptchaRef = useRef<RecaptchaVerifier | null>(null)
  const recaptchaDivRef = useRef<HTMLDivElement>(null)
  const recaptchaReady = useRef(false)
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
  const formatPhone = (raw: string) => { let p = raw.replace(/\D/g, ''); if (p.startsWith('0')) p = p.slice(1); return selectedCountry.code + p }
  const filteredCountries = COUNTRIES.filter(c => c.name.toLowerCase().includes(countrySearch.toLowerCase()) || c.code.includes(countrySearch))

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user && user.phoneNumber) { setMyPhone(user.phoneNumber); setIsVerified(true); localStorage.setItem('eva-my-phone', user.phoneNumber); localStorage.setItem('eva-phone-verified', 'true') }
    })
    return () => unsub()
  }, [])
  useEffect(() => {
    if (recaptchaReady.current) return
    if (!recaptchaDivRef.current) return
    try { recaptchaRef.current = new RecaptchaVerifier(auth, recaptchaDivRef.current, { size: 'invisible' }); recaptchaReady.current = true } catch {}
  }, [isVerified])

  useEffect(() => {
    const saved = localStorage.getItem('eva-my-phone')
    const verified = localStorage.getItem('eva-phone-verified')
    if (saved && verified === 'true') { setMyPhone(saved); setIsVerified(true); const nm = localStorage.getItem(`eva-name-${saved}`); if (nm) setMyName(nm) }
    try {
      const evaOn = localStorage.getItem('eva-contacts-enabled'); if (evaOn !== null) setEvaContactsOn(evaOn === 'true')
    } catch {}
  }, [])
  useEffect(() => {
    if (!myPhone) return
    try {
      const c = localStorage.getItem(`eva-contacts-${myPhone}`); if (c) setContacts((JSON.parse(c) as Contact[]).filter(x => x.phone !== myPhone)); else setContacts([])
      const cm = localStorage.getItem(`eva-chat-msgs-${myPhone}`); if (cm) setChatMsgs(JSON.parse(cm))
      const ch = localStorage.getItem(`eva-chats-${myPhone}`); if (ch) setChats(JSON.parse(ch))
      const s = localStorage.getItem(`eva-self-msgs-${myPhone}`); if (s) setSelfMsgs(JSON.parse(s)); else setSelfMsgs([])
      const m = localStorage.getItem(`eva-me-droplet-${myPhone}`); if (m) setMe(JSON.parse(m)); else setMe({ type: 'none' })
    } catch {}
  }, [myPhone])
  useEffect(() => { if (!myPhone) return; try { localStorage.setItem(`eva-self-msgs-${myPhone}`, JSON.stringify(selfMsgs)) } catch {} }, [selfMsgs, myPhone])
  useEffect(() => { if (myPhone) { try { localStorage.setItem(`eva-chat-msgs-${myPhone}`, JSON.stringify(chatMsgs)) } catch {} } }, [chatMsgs, myPhone])
  useEffect(() => { if (myPhone) { try { localStorage.setItem(`eva-contacts-${myPhone}`, JSON.stringify(contacts)) } catch {} } }, [contacts, myPhone])
  useEffect(() => { if (myPhone) { try { localStorage.setItem(`eva-chats-${myPhone}`, JSON.stringify(chats)) } catch {} } }, [chats, myPhone])
  useEffect(() => { if (!myPhone) return; try { localStorage.setItem(`eva-me-droplet-${myPhone}`, JSON.stringify(me)) } catch {} }, [me, myPhone])
  useEffect(() => { try { localStorage.setItem('eva-contacts-enabled', String(evaContactsOn)) } catch {} }, [evaContactsOn])
  // FIX KEYBOARD: scroll only when new message comes, not when you are typing
  useEffect(() => { msgsEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [selfMsgs, chatMsgs])

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
      confirmationRef.current = confirmation; setMyPhone(formatted); setCodeSent(true); showToast('Code sent by Firebase ✔')
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
      localStorage.setItem('eva-my-phone', phone); localStorage.setItem('eva-phone-verified', 'true'); localStorage.setItem('eva-user-id', result.user.uid)
      if (authMode === 'signup') localStorage.setItem(`eva-name-${phone}`, signupName.trim())
      setMyPhone(phone); setMyName(authMode === 'signup' ? signupName.trim() : (localStorage.getItem(`eva-name-${phone}`) || ''))
      setIsVerified(true); setCodeSent(false); setOtpInput('')
      showToast(authMode === 'signup' ? 'Account created ✔ Welcome to EVA Chat' : 'Number verified ✔ Welcome back to EVA Chat')
    } catch (e: any) {
      if (e.code === 'auth/invalid-verification-code') showToast('Wrong code, try again')
      else if (e.code === 'auth/code-expired') showToast('Code expired, resend code')
      else showToast('Wrong code')
    } finally { setVerifying(false) }
  }
  const doLogout = async () => {
    try { await signOut(auth) } catch {}
    localStorage.removeItem('eva-my-phone'); localStorage.removeItem('eva-phone-verified')
    setIsVerified(false); setMyPhone(''); setMyName(''); setCodeSent(false); setOtpInput(''); setPhoneInput('')
    setShowLogoutConfirm(false); setShowContactMenu(false); setShowSelectContact(false); setOpenChat(null); setOpenSelf(false); setSelfMsgs([]); setMe({ type: 'none' })
    recaptchaReady.current = false; recaptchaRef.current = null; showToast('Logged out ✔')
  }
  // FIX ME DUPLICATE: If the number is your own, update your name, do not create a contact
  const saveNewContact = () => {
    if (!newName.trim()) return showToast('Enter name')
    if (newPhone.replace(/\D/g, '').length < 7) return showToast('Enter valid number')
    const phone = newPhone.startsWith('+') ? newPhone : formatPhone(newPhone)
    if (phone === myPhone) {
      setMyName(newName.trim()); localStorage.setItem(`eva-name-${myPhone}`, newName.trim())
      setNewName(''); setNewPhone(''); setShowNewContact(false)
      showToast('Your name updated to ' + newName.trim() + ' ✔'); return
    }
    if (contacts.some(c => c.phone === phone)) return showToast('Contact already exists')
    setContacts(p => [...p, { name: newName.trim(), phone }])
    setNewName(''); setNewPhone(''); setShowNewContact(false); showToast('Contact saved on EVA ✔')
  }

  // FIX: Your own number never shows in the contacts list
  const visibleContacts = contacts.filter(c => !c.blocked && c.phone !== myPhone)
  const filteredContacts = visibleContacts.filter(c => c.name.toLowerCase().includes(contactSearch.toLowerCase()) || c.phone.includes(contactSearch))
  const visibleChats = chats.filter(c => c.name.toLowerCase().includes(searchText.toLowerCase()))
  const filteredEmojis = EMOJI_CATS[emojiCat].filter(e => !emojiSearch || e.includes(emojiSearch))

  const sendSelf = () => {
    if (!selfInput.trim()) return
    setSelfMsgs(p => [...p, { text: selfInput.trim(), time: nowTime(), kind: 'text' }]); setSelfInput(''); setShowEmoji(false)
  }
  const sendChat = () => {
    if (!chatInput.trim() || !openChat) return
    const key = openChat.phone || openChat.name
    setChatMsgs(p => ({ ...p, [key]: [...(p[key] || []), { text: chatInput.trim(), time: nowTime(), kind: 'text' }] }))
    setChats(p => p.map(c => c.phone === openChat.phone ? { ...c, msg: chatInput.trim(), time: nowTime() } : c))
    setChatInput(''); setShowEmoji(false)
  }
  const addEmoji = (em: string, isSelf: boolean) => { if (isSelf) setSelfInput(p => p + em); else setChatInput(p => p + em) }
  const toggleVoice = async (isSelf: boolean) => {
    if (isRecordingVoice) {
      voiceRecorderRef.current?.stop(); setIsRecordingVoice(false); return
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const rec = new MediaRecorder(stream); voiceChunksRef.current = []
      rec.ondataavailable = e => { if (e.data.size > 0) voiceChunksRef.current.push(e.data) }
      rec.onstop = async () => {
        const blob = new Blob(voiceChunksRef.current, { type: 'audio/webm' })
        const url = await fileToDataURL(new File([blob], 'voice.webm', { type: 'audio/webm' }))
        const msg: Msg = { audioUrl: url, time: nowTime(), kind: 'voice' }
        if (isSelf) setSelfMsgs(p => [...p, msg])
        else if (openChat) { const key = openChat.phone || openChat.name; setChatMsgs(p => ({ ...p, [key]: [...(p[key] || []), msg] })) }
        stream.getTracks().forEach(t => t.stop())
      }
      rec.start(); voiceRecorderRef.current = rec; setIsRecordingVoice(true); showToast('Recording voice... tap mic again to stop')
    } catch { showToast('Mic not allowed') }
  }

  // FIX PICTURE STAY: All uploads use DataURL, not blob URL
  const handlePhoto = async (e: any) => {
    const f = e.target.files?.[0]; if (!f) return
    const url = await fileToDataURL(f)
    setMe({ type: 'photo', src: url }); setFullView(null); setShowPlusMenu(false); showToast('Photo set ✔')
    e.target.value = ''
  }
  const handleGallery = async (e: any) => {
    const f = e.target.files?.[0]; if (!f) return
    const url = await fileToDataURL(f)
    if (f.type.startsWith('image/')) { setMe({ type: 'photo', src: url }); setShowPlusMenu(false); showToast('Photo set ✔'); e.target.value = ''; return }
    // Video: get duration, then open trim so user selects where 7 secs will start
    const v = document.createElement('video'); v.preload = 'metadata'; v.src = url
    v.onloadedmetadata = () => {
      setTrimUrl(url); setTrimDur(v.duration); setTrimStart(0); setOverlay('trim'); setShowPlusMenu(false)
    }
    e.target.value = ''
  }
  const confirmTrim = () => {
    // 7 secs loop: Droplet will always play from trimStart to trimStart+7
    setLive(trimUrl, trimStart); setOverlay(null); setTrimUrl('')
  }
  const startRecord = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      const rec = new MediaRecorder(stream, { mimeType: 'video/webm' }); const chunks: Blob[] = []
      rec.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data) }
      rec.onstop = async () => {
        const blob = new Blob(chunks, { type: 'video/webm' })
        const url = await fileToDataURL(new File([blob], 'rec.webm', { type: 'video/webm' }))
        setRecordUrl(url); setTrimUrl(url); setTrimDur(7); setTrimStart(0); setOverlay('trim'); setRecording(false)
        stream.getTracks().forEach(t => t.stop())
      }
      rec.start(); setRecording(true); showToast('Recording 7 secs...')
      setTimeout(() => { if (rec.state !== 'inactive') rec.stop() }, 7000)
    } catch { showToast('Camera not allowed') }
  }

  // ---------- LOGIN / SIGNUP SCREEN ----------
  if (!isVerified) return (
    <div style={{ minHeight: '100dvh', background: '#0b0e24', color: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 20, paddingTop: 60 }}>
      <div ref={recaptchaDivRef} id="recaptcha-container" />
      <div style={{ fontSize: 40, fontWeight: 900 }}>EVA <span style={{ color: '#ff2f6d' }}>Chat</span></div>
      <div style={{ color: '#aab', marginTop: 6, marginBottom: 24 }}>Welcome to EVA Chat</div>
      <div style={{ display: 'flex', background: '#171c46', borderRadius: 20, padding: 4, width: '100%', maxWidth: 380 }}>
        <button onClick={() => { setAuthMode('login'); setCodeSent(false) }} style={{ flex: 1, padding: 10, borderRadius: 16, border: 0, background: authMode === 'login' ? '#ff2f6d' : 'transparent', color: '#fff', fontWeight: 700 }}>Log In</button>
        <button onClick={() => { setAuthMode('signup'); setCodeSent(false) }} style={{ flex: 1, padding: 10, borderRadius: 16, border: 0, background: authMode === 'signup' ? '#ff2f6d' : 'transparent', color: '#fff', fontWeight: 700 }}>Sign Up</button>
      </div>
      <div style={{ width: '100%', maxWidth: 380, marginTop: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {authMode === 'signup' && <input placeholder="Your name" value={signupName} onChange={e => setSignupName(e.target.value)} style={{ background: '#171c46', border: 0, borderRadius: 14, padding: 14, color: '#fff', outline: 'none' }} />}
        <button onClick={() => setShowCountryPicker(true)} style={{ background: '#171c46', border: 0, borderRadius: 14, padding: 14, color: '#fff', textAlign: 'left' }}>{selectedCountry.flag} {selectedCountry.name} {selectedCountry.code} ▾</button>
        <input placeholder="Phone number" value={phoneInput} onChange={e => setPhoneInput(e.target.value)} inputMode="tel" style={{ background: '#171c46', border: 0, borderRadius: 14, padding: 14, color: '#fff', outline: 'none' }} />
        {!codeSent ? <button onClick={sendCode} disabled={sending} style={{ background: 'linear-gradient(90deg,#ff2f6d,#8a2be2)', border: 0, borderRadius: 14, padding: 14, color: '#fff', fontWeight: 800 }}>{sending ? 'Sending...' : 'Send Code'}</button>
          : <>
            <input placeholder="Enter 6-digit code" value={otpInput} onChange={e => setOtpInput(e.target.value)} inputMode="numeric" style={{ background: '#171c46', border: 0, borderRadius: 14, padding: 14, color: '#fff', outline: 'none', letterSpacing: 4 }} />
            <button onClick={verifyCode} disabled={verifying} style={{ background: 'linear-gradient(90deg,#ff2f6d,#8a2be2)', border: 0, borderRadius: 14, padding: 14, color: '#fff', fontWeight: 800 }}>{verifying ? 'Verifying...' : 'Verify Code'}</button>
            <button onClick={() => { setCodeSent(false); setOtpInput('') }} style={{ background: 'transparent', border: 0, color: '#aab' }}>Change number</button>
          </>}
      </div>
      {showCountryPicker && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.7)', display: 'flex', alignItems: 'flex-end', zIndex: 50 }}>
          <div style={{ background: '#12163a', width: '100%', maxHeight: '80vh', borderRadius: '20px 20px 0 0', padding: 16 }}>
            <input placeholder="Search country" value={countrySearch} onChange={e => setCountrySearch(e.target.value)} style={{ width: '100%', background: '#171c46', border: 0, borderRadius: 12, padding: 12, color: '#fff', outline: 'none', boxSizing: 'border-box' }} />
            <div style={{ overflowY: 'auto', maxHeight: '60vh', marginTop: 10 }}>
              {filteredCountries.map(c => <div key={c.name + c.code} onClick={() => { setSelectedCountry(c); setShowCountryPicker(false); setCountrySearch('') }} style={{ padding: '12px 8px', borderBottom: '1px solid #222' }}>{c.flag} {c.name} {c.code}</div>)}
            </div>
            <button onClick={() => setShowCountryPicker(false)} style={{ width: '100%', marginTop: 10, padding: 12, borderRadius: 12, border: 0, background: '#333', color: '#fff' }}>Close</button>
          </div>
        </div>
      )}
      {toast && <div style={{ position: 'fixed', bottom: 20, background: '#fff', color: '#000', padding: '10px 16px', borderRadius: 20, fontSize: 13 }}>{toast}</div>}
    </div>
  )

  // ---------- SELECT CONTACT SCREEN ----------
  if (showSelectContact) return (
    <div style={{ minHeight: '100dvh', background: '#0b0e24', color: '#fff', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px' }}>
        <button onClick={() => setShowSelectContact(false)} style={{ background: 'none', border: 0, color: '#fff', fontSize: 22 }}>←</button>
        <div><div style={{ fontSize: 18, fontWeight: 800 }}>Select contact</div><div style={{ fontSize: 12, color: '#aab' }}>{visibleContacts.length} EVA contacts</div></div>
        <div style={{ marginLeft: 'auto', position: 'relative' }}>
          <button onClick={() => setShowContactMenu(!showContactMenu)} style={{ background: 'none', border: 0, color: '#fff', fontSize: 22 }}>⋮</button>
          {showContactMenu && (
            <div style={{ position: 'absolute', right: 0, top: 30, background: '#1a1f4a', borderRadius: 12, width: 190, overflow: 'hidden', zIndex: 20 }}>
              <button onClick={() => { setShowContactMenu(false); setShowContactSettings(true) }} style={{ display: 'block', width: '100%', textAlign: 'left', background: 'none', border: 0, color: '#fff', padding: 12 }}>Contact settings</button>
              <button onClick={() => { setShowContactMenu(false); setShowInvite(true) }} style={{ display: 'block', width: '100%', textAlign: 'left', background: 'none', border: 0, color: '#fff', padding: 12 }}>Invite a friend</button>
              <button onClick={() => { setShowContactMenu(false); setShowHelp(true) }} style={{ display: 'block', width: '100%', textAlign: 'left', background: 'none', border: 0, color: '#fff', padding: 12 }}>Help</button>
              <button onClick={() => { setShowContactMenu(false); setShowBlocked(true) }} style={{ display: 'block', width: '100%', textAlign: 'left', background: 'none', border: 0, color: '#fff', padding: 12 }}>Blocked contacts</button>
              <button onClick={() => { setShowContactMenu(false); setShowLogoutConfirm(true) }} style={{ display: 'block', width: '100%', textAlign: 'left', background: 'none', border: 0, color: '#ff5b7a', padding: 12 }}>Log out</button>
            </div>
          )}
        </div>
      </div>
      <div style={{ padding: '0 16px 12px' }}>
        <input placeholder="Search EVA contacts" value={contactSearch} onChange={e => setContactSearch(e.target.value)} style={{ width: '100%', background: '#171c46', border: 0, borderRadius: 22, padding: '12px 16px', color: '#fff', outline: 'none', boxSizing: 'border-box' }} />
      </div>
      <div style={{ display: 'flex', gap: 10, padding: '0 16px 12px' }}>
        <button onClick={() => setShowGroup(true)} style={{ flex: 1, background: '#171c46', border: 0, color: '#fff', borderRadius: 14, padding: 12 }}>👥<br />Group</button>
        <button onClick={() => setShowNewContact(true)} style={{ flex: 1, background: '#171c46', border: 0, color: '#fff', borderRadius: 14, padding: 12 }}>👤+<br />New contact</button>
        <button onClick={() => setShowQR(true)} style={{ flex: 1, background: '#171c46', border: 0, color: '#fff', borderRadius: 14, padding: 12 }}>🔲<br />QR</button>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px 20px' }}>
        <div onClick={() => { setShowSelectContact(false); setOpenSelf(true) }} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid #1a1f4a' }}>
          <Droplet o={{ ...me, ring: 'none' }} w={48} />
          <div><div style={{ fontWeight: 700 }}>{myName || 'You'} <span style={{ color: '#aab', fontWeight: 400 }}>(You)</span></div><div style={{ color: '#aab', fontSize: 12 }}>Message yourself • {myPhone}</div></div>
        </div>
        {filteredContacts.map(c => (
          <div key={c.phone} onClick={() => {
            const existing = chats.find(x => x.phone === c.phone)
            if (existing) setOpenChat(existing)
            else { const n: Chat = { name: c.name, msg: 'Tap to chat', time: nowTime(), ring: 'none', type: 'none', phone: c.phone }; setChats(p => [n, ...p]); setOpenChat(n) }
            setShowSelectContact(false)
          }} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid #1a1f4a' }}>
            <Droplet o={{ type: 'none', ring: 'none' }} w={48} />
            <div><div style={{ fontWeight: 700 }}>{c.name}</div><div style={{ color: '#aab', fontSize: 12 }}>{c.phone}</div></div>
          </div>
        ))}
        {filteredContacts.length === 0 && visibleContacts.length === 0 && <div style={{ textAlign: 'center', color: '#8a8fb0', padding: '30px 20px', fontSize: 14 }}>{contactSearch.trim() ? 'No match found' : 'No EVA contacts yet. Tap New contact to add one.'}</div>}
        {filteredContacts.length === 0 && visibleContacts.length > 0 && contactSearch.trim() && <div style={{ textAlign: 'center', color: '#8a8fb0', padding: '30px 20px', fontSize: 14 }}>No match found</div>}
      </div>

      {showNewContact && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.7)', display: 'flex', alignItems: 'flex-end', zIndex: 60 }}>
          <div style={{ background: '#12163a', width: '100%', borderRadius: '20px 20px 0 0', padding: 16 }}>
            <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 12 }}>New contact</div>
            <input placeholder="Name" value={newName} onChange={e => setNewName(e.target.value)} style={{ width: '100%', background: '#171c46', border: 0, borderRadius: 12, padding: 12, color: '#fff', outline: 'none', boxSizing: 'border-box', marginBottom: 10 }} />
            <input placeholder="Phone number" value={newPhone} onChange={e => setNewPhone(e.target.value)} inputMode="tel" style={{ width: '100%', background: '#171c46', border: 0, borderRadius: 12, padding: 12, color: '#fff', outline: 'none', boxSizing: 'border-box' }} />
            <button onClick={saveNewContact} style={{ width: '100%', marginTop: 12, padding: 14, borderRadius: 12, border: 0, background: 'linear-gradient(90deg,#ff2f6d,#8a2be2)', color: '#fff', fontWeight: 800 }}>Save on EVA</button>
            <button onClick={() => setShowNewContact(false)} style={{ width: '100%', marginTop: 8, padding: 12, borderRadius: 12, border: 0, background: '#333', color: '#fff' }}>Cancel</button>
          </div>
        </div>
      )}
      {showGroup && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.7)', display: 'flex', alignItems: 'flex-end', zIndex: 60 }}>
          <div style={{ background: '#12163a', width: '100%', borderRadius: '20px 20px 0 0', padding: 16 }}>
            <div style={{ fontWeight: 800, marginBottom: 12 }}>New group</div>
            <input placeholder="Group name" value={groupName} onChange={e => setGroupName(e.target.value)} style={{ width: '100%', background: '#171c46', border: 0, borderRadius: 12, padding: 12, color: '#fff', outline: 'none', boxSizing: 'border-box' }} />
            <button onClick={() => { if (!groupName.trim()) return showToast('Enter group name'); const g: Chat = { name: groupName.trim(), msg: 'Group created', time: nowTime(), ring: 'none', type: 'none', phone: 'group-' + Date.now() }; setChats(p => [g, ...p]); setGroupName(''); setShowGroup(false); setShowSelectContact(false); setOpenChat(g) }} style={{ width: '100%', marginTop: 12, padding: 14, borderRadius: 12, border: 0, background: 'linear-gradient(90deg,#ff2f6d,#8a2be2)', color: '#fff', fontWeight: 800 }}>Create group</button>
            <button onClick={() => setShowGroup(false)} style={{ width: '100%', marginTop: 8, padding: 12, borderRadius: 12, border: 0, background: '#333', color: '#fff' }}>Cancel</button>
          </div>
        </div>
      )}
      {showQR && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.7)', display: 'flex', alignItems: 'flex-end', zIndex: 60 }}>
          <div style={{ background: '#12163a', width: '100%', borderRadius: '20px 20px 0 0', padding: 16, textAlign: 'center' }}>
            <div style={{ fontWeight: 800 }}>QR - {qrTab === 'my' ? 'My QR' : 'Scan'}</div>
            <div style={{ display: 'flex', gap: 8, margin: '12px 0' }}>
              <button onClick={() => setQrTab('my')} style={{ flex: 1, padding: 10, borderRadius: 10, border: 0, background: qrTab === 'my' ? '#ff2f6d' : '#333', color: '#fff' }}>My QR</button>
              <button onClick={() => setQrTab('scan')} style={{ flex: 1, padding: 10, borderRadius: 10, border: 0, background: qrTab === 'scan' ? '#ff2f6d' : '#333', color: '#fff' }}>Scan</button>
            </div>
            {qrTab === 'my' ? <div style={{ background: '#fff', color: '#000', borderRadius: 12, padding: 20, fontSize: 13 }}>Your number:<br /><b>{myPhone}</b><br /><br />Show this to your friend to add you</div>
              : <><input placeholder="Paste friend number" value={scanInput} onChange={e => setScanInput(e.target.value)} style={{ width: '100%', background: '#171c46', border: 0, borderRadius: 12, padding: 12, color: '#fff', outline: 'none', boxSizing: 'border-box' }} />
                <button onClick={() => { if (scanInput.trim().length < 7) return showToast('Enter valid number'); setNewPhone(scanInput.trim()); setScanInput(''); setShowQR(false); setShowNewContact(true) }} style={{ width: '100%', marginTop: 10, padding: 12, borderRadius: 12, border: 0, background: '#ff2f6d', color: '#fff', fontWeight: 700 }}>Add this number</button></>}
            <button onClick={() => setShowQR(false)} style={{ width: '100%', marginTop: 10, padding: 12, borderRadius: 12, border: 0, background: '#333', color: '#fff' }}>Close</button>
          </div>
        </div>
      )}
      {showContactSettings && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.7)', display: 'flex', alignItems: 'flex-end', zIndex: 60 }}>
          <div style={{ background: '#12163a', width: '100%', borderRadius: '20px 20px 0 0', padding: 16 }}>
            <div style={{ fontWeight: 800, marginBottom: 12 }}>Contact settings</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0' }}><span>EVA contacts</span><button onClick={() => setEvaContactsOn(!evaContactsOn)} style={{ width: 52, height: 28, borderRadius: 20, border: 0, background: evaContactsOn ? '#00c853' : '#555', color: '#fff' }}>{evaContactsOn ? 'ON' : 'OFF'}</button></div>
            <button onClick={() => setShowContactSettings(false)} style={{ width: '100%', marginTop: 10, padding: 12, borderRadius: 12, border: 0, background: '#333', color: '#fff' }}>Close</button>
          </div>
        </div>
      )}
      {showInvite && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.7)', display: 'flex', alignItems: 'flex-end', zIndex: 60 }}>
          <div style={{ background: '#12163a', width: '100%', borderRadius: '20px 20px 0 0', padding: 16, textAlign: 'center' }}>
            <div style={{ fontWeight: 800 }}>Invite a friend</div><div style={{ color: '#aab', fontSize: 13, marginTop: 8 }}>Share EVA Chat with your friends</div>
            <button onClick={() => { navigator.clipboard?.writeText('Join me on EVA Chat! My number: ' + myPhone); showToast('Invite copied ✔') }} style={{ width: '100%', marginTop: 12, padding: 12, borderRadius: 12, border: 0, background: '#ff2f6d', color: '#fff' }}>Copy invite link</button>
            <button onClick={() => setShowInvite(false)} style={{ width: '100%', marginTop: 8, padding: 12, borderRadius: 12, border: 0, background: '#333', color: '#fff' }}>Close</button>
          </div>
        </div>
      )}
      {showHelp && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.7)', display: 'flex', alignItems: 'flex-end', zIndex: 60 }}>
          <div style={{ background: '#12163a', width: '100%', borderRadius: '20px 20px 0 0', padding: 16 }}>
            <div style={{ fontWeight: 800 }}>Help</div><div style={{ color: '#aab', fontSize: 13, marginTop: 8, lineHeight: 1.6 }}>1. Tap New contact to add person<br />2. Tap your droplet to set photo / live video<br />3. Live video must be 7 secs, it will loop<br />4. Message yourself to save notes</div>
            <button onClick={() => setShowHelp(false)} style={{ width: '100%', marginTop: 12, padding: 12, borderRadius: 12, border: 0, background: '#333', color: '#fff' }}>Close</button>
          </div>
        </div>
      )}
      {showBlocked && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.7)', display: 'flex', alignItems: 'flex-end', zIndex: 60 }}>
          <div style={{ background: '#12163a', width: '100%', borderRadius: '20px 20px 0 0', padding: 16, maxHeight: '70vh', overflowY: 'auto' }}>
            <div style={{ fontWeight: 800, marginBottom: 10 }}>Blocked contacts</div>
            {contacts.filter(c => c.blocked).length === 0 && <div style={{ color: '#aab', fontSize: 13 }}>No blocked contacts</div>}
            {contacts.filter(c => c.blocked).map(c => <div key={c.phone} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0' }}><span>{c.name} • {c.phone}</span><button onClick={() => setContacts(p => p.map(x => x.phone === c.phone ? { ...x, blocked: false } : x))} style={{ background: '#00c853', border: 0, color: '#fff', borderRadius: 8, padding: '6px 10px' }}>Unblock</button></div>)}
            <button onClick={() => setShowBlocked(false)} style={{ width: '100%', marginTop: 10, padding: 12, borderRadius: 12, border: 0, background: '#333', color: '#fff' }}>Close</button>
          </div>
        </div>
      )}
      {showLogoutConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 70, padding: 20 }}>
          <div style={{ background: '#12163a', width: '100%', maxWidth: 340, borderRadius: 16, padding: 20, textAlign: 'center' }}>
            <div style={{ fontWeight: 800, fontSize: 17 }}>Log out?</div><div style={{ color: '#aab', fontSize: 13, marginTop: 8 }}>Your contacts and chats will stay on this phone.</div>
            <button onClick={doLogout} style={{ width: '100%', marginTop: 16, padding: 12, borderRadius: 12, border: 0, background: '#ff2f4d', color: '#fff', fontWeight: 700 }}>Log out</button>
            <button onClick={() => setShowLogoutConfirm(false)} style={{ width: '100%', marginTop: 8, padding: 12, borderRadius: 12, border: 0, background: '#333', color: '#fff' }}>Cancel</button>
          </div>
        </div>
      )}
      {toast && <div style={{ position: 'fixed', bottom: 20, left: '50%', transform: 'translateX(-50%)', background: '#fff', color: '#000', padding: '10px 16px', borderRadius: 20, fontSize: 13, zIndex: 80 }}>{toast}</div>}
    </div>
  )
      // ---------- SELF CHAT ----------
  if (openSelf) return (
    <div style={{ minHeight: '100dvh', background: '#0b0e24', color: '#fff', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', background: '#0e1230' }}>
        <button onClick={() => setOpenSelf(false)} style={{ background: 'none', border: 0, color: '#fff', fontSize: 22 }}>←</button>
        <div onClick={() => setFullView({ ...me, name: myName || 'You', isMe: true })}><Droplet o={{ ...me, ring: 'none' }} w={42} /></div>
        <div><div style={{ fontWeight: 800 }}>{myName || 'You'} (You)</div><div style={{ fontSize: 12, color: '#00c853' }}>Message yourself • {myPhone}</div></div>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: 14 }}>
        {selfMsgs.length === 0 && <div style={{ textAlign: 'center', color: '#8a8fb0', marginTop: 40, fontSize: 13 }}>No messages yet.<br />Send yourself notes, photos, voice.</div>}
        {selfMsgs.map((m, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
            <div style={{ background: '#ff2f6d', borderRadius: '16px 16px 4px 16px', padding: '12px 16px', maxWidth: '85%', minWidth: 90 }}>
              {m.kind === 'voice' && m.audioUrl ? <audio controls src={m.audioUrl} style={{ width: 220 }} /> : <span style={{ fontSize: 17, lineHeight: 1.4 }}>{m.text}</span>}
              <div style={{ fontSize: 11, color: '#fff', textAlign: 'right', marginTop: 6 }}>{m.time} <span style={{ color: '#b3e5fc' }}>✓✓</span></div>
            </div>
          </div>
        ))}
        <div ref={msgsEndRef} />
      </div>
      <ChatBar value={selfInput} onChange={setSelfInput} onSend={sendSelf} isSelf={true} me={me} showEmoji={showEmoji} setShowEmoji={setShowEmoji} showAttach={showAttach} setShowAttach={setShowAttach} emojiCat={emojiCat} setEmojiCat={setEmojiCat} filteredEmojis={filteredEmojis} addEmoji={addEmoji} galleryRef={galleryRef} docRef={docRef} startRecord={startRecord} toggleVoice={toggleVoice} isRecordingVoice={isRecordingVoice} />
      <input ref={galleryRef} type="file" accept="image/*,video/*" hidden onChange={handleGallery} />
      <input ref={docRef} type="file" hidden onChange={() => showToast('Document sent ✔')} />
      {toast && <div style={{ position: 'fixed', bottom: 90, left: '50%', transform: 'translateX(-50%)', background: '#fff', color: '#000', padding: '10px 16px', borderRadius: 20, fontSize: 13, zIndex: 80 }}>{toast}</div>}
    </div>
  )

  // ---------- OPEN CHAT ----------
  if (openChat) return (
    <div style={{ minHeight: '100dvh', background: '#0b0e24', color: '#fff', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', background: '#0e1230' }}>
        <button onClick={() => setOpenChat(null)} style={{ background: 'none', border: 0, color: '#fff', fontSize: 22 }}>←</button>
        <div onClick={() => setFullView(openChat)}><Droplet o={openChat} w={42} /></div>
        <div style={{ flex: 1 }}><div style={{ fontWeight: 800 }}>{openChat.name}</div><div style={{ fontSize: 12, color: '#aab' }}>{openChat.phone || 'EVA'}</div></div>
        <button style={{ background: 'none', border: 0, fontSize: 22 }}>📞</button>
        <button style={{ background: 'none', border: 0, fontSize: 22 }}>📹</button>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: 14 }}>
        {(chatMsgs[openChat.phone || openChat.name] || []).length === 0 && <div style={{ textAlign: 'center', color: '#8a8fb0', marginTop: 40, fontSize: 13 }}>Say hi to {openChat.name} 👋</div>}
        {(chatMsgs[openChat.phone || openChat.name] || []).map((m, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
            <div style={{ background: '#ff2f6d', borderRadius: '16px 16px 4px 16px', padding: '12px 16px', maxWidth: '85%', minWidth: 90 }}>
              {m.kind === 'voice' && m.audioUrl ? <audio controls src={m.audioUrl} style={{ width: 220 }} /> : <span style={{ fontSize: 17, lineHeight: 1.4 }}>{m.text}</span>}
              <div style={{ fontSize: 11, color: '#fff', textAlign: 'right', marginTop: 6 }}>{m.time} <span style={{ color: '#b3e5fc' }}>✓✓</span></div>
            </div>
          </div>
        ))}
        <div ref={msgsEndRef} />
      </div>
      <ChatBar value={chatInput} onChange={setChatInput} onSend={sendChat} isSelf={false} me={me} showEmoji={showEmoji} setShowEmoji={setShowEmoji} showAttach={showAttach} setShowAttach={setShowAttach} emojiCat={emojiCat} setEmojiCat={setEmojiCat} filteredEmojis={filteredEmojis} addEmoji={addEmoji} galleryRef={galleryRef} docRef={docRef} startRecord={startRecord} toggleVoice={toggleVoice} isRecordingVoice={isRecordingVoice} />
      <input ref={galleryRef} type="file" accept="image/*,video/*" hidden onChange={handleGallery} />
      <input ref={docRef} type="file" hidden onChange={() => showToast('Document sent ✔')} />
      {toast && <div style={{ position: 'fixed', bottom: 90, left: '50%', transform: 'translateX(-50%)', background: '#fff', color: '#000', padding: '10px 16px', borderRadius: 20, fontSize: 13, zIndex: 80 }}>{toast}</div>}
    </div>
  )

  // ---------- MAIN SCREEN ----------
  return (
    <div style={{ minHeight: '100dvh', background: '#0b0e24', color: '#fff', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '14px 16px 6px' }}>
        <div style={{ fontSize: 20, fontWeight: 900 }}>EVA <span style={{ color: '#ff2f6d' }}>Chat</span></div>
      </div>
      <div style={{ padding: '0 16px 10px' }}>
        <input ref={searchInputRef} placeholder="Search" value={searchText} onChange={e => setSearchText(e.target.value)} style={{ width: '100%', background: '#171c46', border: 0, borderRadius: 20, padding: '12px 14px', color: '#fff', outline: 'none', boxSizing: 'border-box' }} />
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px 90px' }}>
        {tab === 'chat' && (
          <>
            <div onClick={() => setOpenSelf(true)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid #1a1f4a' }}>
              <Droplet o={{ ...me, ring: 'none' }} w={52} />
              <div style={{ flex: 1 }}><div style={{ fontWeight: 800 }}>{myName || 'You'} (You)</div><div style={{ color: '#aab', fontSize: 13 }}>{selfMsgs.length ? <span><span style={{ color: '#4fc3f7' }}>✓✓ </span>{selfMsgs[selfMsgs.length - 1].text || 'Voice message'}</span> : 'Message yourself'}</div></div>
              <span style={{ color: '#aab', fontSize: 12 }}>{selfMsgs.length ? selfMsgs[selfMsgs.length - 1].time : ''}</span>
            </div>
            {visibleChats.map(c => (
              <div key={c.phone || c.name} onClick={() => setOpenChat(c)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid #1a1f4a' }}>
                <div onClick={e => { e.stopPropagation(); setFullView(c) }}><Droplet o={c} w={52} /></div>
                <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontWeight: 800 }}>{c.name}</div><div style={{ color: '#aab', fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}><span style={{ color: '#4fc3f7' }}>✓✓ </span>{c.msg}</div></div>
                <span style={{ color: '#aab', fontSize: 12 }}>{c.time}</span>
              </div>
            ))}
          </>
        )}
        {tab === 'check' && (
          <div>
            {chats.filter(c => c.ring !== 'none').map(c => (
              <div key={c.phone || c.name} onClick={() => setFullView(c)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid #1a1f4a' }}>
                <Droplet o={c} w={52} /><div><div style={{ fontWeight: 800 }}>{c.name}</div><div style={{ color: '#aab', fontSize: 12 }}>{c.ring === 'new' ? 'New Check' : 'Seen'}</div></div>
              </div>
            ))}
            {chats.filter(c => c.ring !== 'none').length === 0 && <div style={{ textAlign: 'center', color: '#8a8fb0', marginTop: 40, fontSize: 13 }}>No Checks yet.</div>}
          </div>
        )}
        {tab === 'call' && <div style={{ textAlign: 'center', color: '#8a8fb0', marginTop: 40, fontSize: 13 }}>No calls yet.<br />Tap a chat then tap 📞</div>}
      </div>
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#0e1230', display: 'flex', padding: '10px 16px calc(env(safe-area-inset-bottom) + 10px)', borderTop: '1px solid #1a1f4a' }}>
        <button onClick={() => setTab('chat')} style={{ flex: 1, background: 'none', border: 0, color: tab === 'chat' ? '#ff2f6d' : '#aab' }}>💬<br />Chat</button>
        <button onClick={() => setTab('check')} style={{ flex: 1, background: 'none', border: 0, color: tab === 'check' ? '#ff2f6d' : '#aab' }}>👁️<br />Check</button>
        <button onClick={() => setTab('call')} style={{ flex: 1, background: 'none', border: 0, color: tab === 'call' ? '#ff2f6d' : '#aab' }}>📞<br />Call</button>
        <button onClick={() => setShowSelectContact(true)} style={{ flex: 1, background: 'none', border: 0, color: '#ff2f6d', fontSize: 22, fontWeight: 900 }}>＋</button>
      </div>
      {fullView && (
        <div style={{ position: 'fixed', inset: 0, background: '#0b0e24', zIndex: 50, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px' }}>
            <button onClick={() => { setFullView(null); setShowPlusMenu(false); setFullMuted(true) }} style={{ background: 'none', border: 0, color: '#fff', fontSize: 22 }}>←</button>
            <div style={{ fontWeight: 800 }}>{fullView.name || 'Profile'}</div>
            <button onClick={() => setShowPlusMenu(!showPlusMenu)} style={{ marginLeft: 'auto', background: '#ff2f6d', border: 0, color: '#fff', width: 38, height: 38, borderRadius: '50%', fontSize: 22, fontWeight: 900 }}>＋</button>
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: 20 }} onClick={() => fullView.type === 'live' && setFullMuted(!fullMuted)}>
            <Droplet o={fullView} w={220} muted={fullMuted} />
            <div style={{ fontWeight: 800, fontSize: 20 }}>{fullView.name || myName || 'You'}</div>
            <div style={{ color: '#aab', fontSize: 13 }}>{fullView.phone || myPhone}</div>
            <div style={{ color: '#aab', fontSize: 12, textAlign: 'center' }}>{fullView.type === 'live' ? 'Tap droplet to unmute / mute • Loops 7 secs' : fullView.type === 'photo' ? 'Photo profile' : 'No profile yet - tap + to set one'}</div>
            {fullView.type === 'live' && <div style={{ background: '#171c46', padding: '8px 14px', borderRadius: 20, fontSize: 12 }}>{fullMuted ? '🔇 Muted - tap to unmute' : '🔊 Sound on - tap to mute'}</div>}
          </div>
          {showPlusMenu && (
            <div style={{ position: 'absolute', top: 60, right: 16, background: '#1a1f4a', borderRadius: 14, width: 220, overflow: 'hidden', zIndex: 60, boxShadow: '0 10px 30px rgba(0,0,0,.5)' }}>
              <button onClick={() => { setShowPlusMenu(false); galleryRef.current?.click() }} style={{ display: 'block', width: '100%', textAlign: 'left', background: 'none', border: 0, color: '#fff', padding: 13 }}>🖼️ Upload from Gallery<br /><span style={{ color: '#aab', fontSize: 11 }}>Video must be 7 secs - you will trim it</span></button>
              <button onClick={() => { setShowPlusMenu(false); photoRef.current?.click() }} style={{ display: 'block', width: '100%', textAlign: 'left', background: 'none', border: 0, color: '#fff', padding: 13 }}>📸 Add Photo</button>
              <button onClick={() => { setShowPlusMenu(false); startRecord() }} style={{ display: 'block', width: '100%', textAlign: 'left', background: 'none', border: 0, color: '#fff', padding: 13 }}>📷 Record directly<br /><span style={{ color: '#aab', fontSize: 11 }}>Auto record 7 secs</span></button>
              <button onClick={() => { setShowPlusMenu(false); setOverlay('stickers') }} style={{ display: 'block', width: '100%', textAlign: 'left', background: 'none', border: 0, color: '#fff', padding: 13 }}>✨ Live Stickers<br /><span style={{ color: '#aab', fontSize: 11 }}>Aki, Pawpaw, Fire...</span></button>
              <button onClick={() => { setShowPlusMenu(false); setMe({ type: 'none' }); setFullView(null); showToast('Profile removed ✔') }} style={{ display: 'block', width: '100%', textAlign: 'left', background: 'none', border: 0, color: '#ff5b7a', padding: 13 }}>🗑️ Remove profile</button>
            </div>
          )}
          <input ref={galleryRef} type="file" accept="image/*,video/*" hidden onChange={handleGallery} />
          <input ref={photoRef} type="file" accept="image/*" hidden onChange={handlePhoto} />
        </div>
      )}
      {overlay === 'trim' && trimUrl && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.85)', zIndex: 80, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ fontWeight: 800, marginBottom: 10 }}>Trim - Choose where 7 secs start</div>
          <video src={trimUrl} autoPlay muted loop playsInline onTimeUpdate={e => { const v = e.currentTarget; if (v.currentTime >= trimStart + 7) v.currentTime = trimStart }} style={{ width: '100%', maxWidth: 320, borderRadius: 16, background: '#000' }} />
          <div style={{ color: '#aab', fontSize: 12, marginTop: 10 }}>Video length: {trimDur.toFixed(1)}s • Showing: {trimStart.toFixed(1)}s to {(Math.min(trimStart + 7, trimDur)).toFixed(1)}s • Loops</div>
          <input type="range" min={0} max={Math.max(0, trimDur - 7)} step={0.1} value={trimStart} onChange={e => setTrimStart(Number(e.target.value))} style={{ width: '100%', maxWidth: 320, marginTop: 14 }} />
          <div style={{ display: 'flex', gap: 10, marginTop: 16, width: '100%', maxWidth: 320 }}>
            <button onClick={confirmTrim} style={{ flex: 1, padding: 12, borderRadius: 12, border: 0, background: '#ff2f6d', color: '#fff', fontWeight: 800 }}>Use this 7 secs ✔</button>
            <button onClick={() => { setOverlay(null); setTrimUrl('') }} style={{ flex: 1, padding: 12, borderRadius: 12, border: 0, background: '#333', color: '#fff' }}>Cancel</button>
          </div>
        </div>
      )}
      {overlay === 'stickers' && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.8)', zIndex: 80, display: 'flex', alignItems: 'flex-end' }}>
          <div style={{ background: '#12163a', width: '100%', borderRadius: '20px 20px 0 0', padding: 16 }}>
            <div style={{ fontWeight: 800, marginBottom: 12 }}>Live Stickers - Tap one, it will be set as your profile</div>
            <div style={{ display: 'flex', gap: 12 }}>
              {STICKERS.map(s => <button key={s.name} onClick={() => setLive(s.src, 0)} style={{ flex: 1, background: '#171c46', border: 0, color: '#fff', borderRadius: 14, padding: 14 }}>{s.e}<br />{s.name}</button>)}
            </div>
            <button onClick={() => setOverlay(null)} style={{ width: '100%', marginTop: 12, padding: 12, borderRadius: 12, border: 0, background: '#333', color: '#fff' }}>Close</button>
          </div>
        </div>
      )}
      {recording && <div style={{ position: 'fixed', top: 16, left: '50%', transform: 'translateX(-50%)', background: '#ff2f4d', color: '#fff', padding: '8px 14px', borderRadius: 20, fontSize: 13, zIndex: 90 }}>● Recording... {recordUrl ? '' : '7 secs'}</div>}
      {showLogoutConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 70, padding: 20 }}>
          <div style={{ background: '#12163a', width: '100%', maxWidth: 340, borderRadius: 16, padding: 20, textAlign: 'center' }}>
            <div style={{ fontWeight: 800, fontSize: 17 }}>Log out?</div><div style={{ color: '#aab', fontSize: 13, marginTop: 8 }}>Your contacts and chats will stay on this phone.</div>
            <button onClick={doLogout} style={{ width: '100%', marginTop: 16, padding: 12, borderRadius: 12, border: 0, background: '#ff2f4d', color: '#fff', fontWeight: 700 }}>Log out</button>
            <button onClick={() => setShowLogoutConfirm(false)} style={{ width: '100%', marginTop: 8, padding: 12, borderRadius: 12, border: 0, background: '#333', color: '#fff' }}>Cancel</button>
          </div>
        </div>
      )}
      {toast && <div style={{ position: 'fixed', bottom: 90, left: '50%', transform: 'translateX(-50%)', background: '#fff', color: '#000', padding: '10px 16px', borderRadius: 20, fontSize: 13, zIndex: 90 }}>{toast}</div>}
      <style jsx global>{`
        * { -webkit-tap-highlight-color: transparent; box-sizing: border-box; }
        body { margin: 0; background: #0b0e24; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
        .drop { filter: drop-shadow(0 6px 18px rgba(0,0,0,.45)); }
      `}</style>
    </div>
  )
}
