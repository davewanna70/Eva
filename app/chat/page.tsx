"use client"
import { useState, useEffect, useRef } from "react"
import { initializeApp, getApps, getApp } from "firebase/app"
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber, onAuthStateChanged, signOut, type ConfirmationResult } from "firebase/auth"
import { getFirestore, collection, addDoc, query, onSnapshot, serverTimestamp, updateDoc, doc } from "firebase/firestore"

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
const db = getFirestore(app)

type Chat = { name: string; msg: string; time: string; ring: 'new' | 'seen' | 'none'; type: 'none' | 'photo' | 'live'; src?: string; start?: number; phone?: string }
type Me = { type: 'none' | 'photo' | 'live'; src?: string; start?: number }
type Msg = { text?: string; time: string; audioUrl?: string; kind?: 'text' | 'voice'; status?: 'not_sent' | 'sent' | 'delivered' | 'read'; id?: string; sender?: string }
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

const fileToDataURL = (f: File) => new Promise<string>((res, rej) => {
  const r = new FileReader(); r.onload = () => res(String(r.result)); r.onerror = rej; r.readAsDataURL(f)
})

const normalizePhoneGlobal = (raw: string, fallbackCode: string = '+234') => {
  let p = (raw || "").replace(/[\s-]/g, "").trim()
  if (!p) return ""
  if (p.startsWith("+")) return p
  if (p.startsWith("00")) return "+" + p.slice(2)
  if (p.startsWith("0")) return fallbackCode + p.slice(1)
  if (/^\d+$/.test(p) && p.length >= 7) {
    if (fallbackCode === "+234" && p.length === 10) return "+234" + p
    return fallbackCode + p
  }
  return p
}

const normPhone = (p: string) => {
  if (!p) return ""
  let x = String(p).replace(/\D/g, "")
  if (x.startsWith("234") && x.length === 13) x = "0" + x.slice(3)
  return x
}

function SmallDroplet({ size = 13 }: { size?: number }) {
  return (
    <span style={{ display: 'inline-flex', verticalAlign: 'middle', marginLeft: 2, opacity: 0.9 }} title="Not sent - no internet">
      <svg width={size} height={size} viewBox="0 0 100 140" style={{ display: 'block' }}>
        <path d="M50,0 C70,40 100,90 100,115 C100,135 80,140 50,140 C20,140 0,135 0,115 C0,90 30,40 50,0 Z" fill="#8a8fb0" opacity="0.95" />
        <ellipse cx="38" cy="95" rx="10" ry="16" fill="#ffffff" opacity="0.35" transform="rotate(-15 38 95)" />
      </svg>
    </span>
  )
}

function MsgStatus({ status }: { status?: string }) {
  if (status === 'not_sent') return <span><SmallDroplet size={13} /></span>
  if (status === 'sent') return <span style={{ color: '#aab' }}>✓</span>
  if (status === 'delivered') return <span style={{ color: '#aab' }}>✓✓</span>
  if (status === 'read') return <span style={{ color: '#4fc3f7' }}>✓✓</span>
  return <span style={{ color: '#aab' }}>✓</span>
}

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
  const [showNameSetup, setShowNameSetup] = useState(false)
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
  const [showNewChatByNumber, setShowNewChatByNumber] = useState(false)
  const [newChatNumber, setNewChatNumber] = useState('')
  const [showSaveContactFromChat, setShowSaveContactFromChat] = useState(false)
  const [saveNameInput, setSaveNameInput] = useState('')

  const showToast = (t: string) => { setToast(t); setTimeout(() => setToast(''), 2200) }
  const close = () => { setOverlay(null); setShowPlusMenu(false) }
  const setLive = (src: string, start: number) => { setMe({ type: 'live', src, start }); close(); setTab('chat'); setFullView(null); showToast('Live sticker set ✔') }
  const nowTime = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  // FIXED: no more double +234. +234803... stays +234803...
  const formatPhone = (raw: string) => { let p = String(raw || "").replace(/\D/g, ''); if (!p) return ""; if (p.startsWith('234') && p.length === 13) return '+' + p; if (p.startsWith('0')) p = p.slice(1); return selectedCountry.code + p }
  const filteredCountries = COUNTRIES.filter(c => c.name.toLowerCase().includes(countrySearch.toLowerCase()) || c.code.includes(countrySearch))
  const isSavedContact = (phone?: string) => { if (!phone) return false; return contacts.some(c => normPhone(c.phone) === normPhone(phone)) }

  // --- FIXED reCAPTCHA: clear old before creating new ---
  const getRecaptcha = () => {
    if (recaptchaRef.current) {
      try { recaptchaRef.current.clear() } catch {}
      recaptchaRef.current = null
      recaptchaReady.current = false
    }
    if (!recaptchaDivRef.current) throw new Error('reCAPTCHA not ready, reload page')
    try { recaptchaDivRef.current.innerHTML = '' } catch {}
    const v = new RecaptchaVerifier(auth, recaptchaDivRef.current, { size: 'invisible' })
    recaptchaRef.current = v
    recaptchaReady.current = true
    return v
  }

  useEffect(() => {
    const id = 'eva-hide-captcha'
    if (!document.getElementById(id)) {
      const el = document.createElement('style'); el.id = id
      el.textContent = '.grecaptcha-badge{visibility:hidden !important; opacity:0 !important; pointer-events:none !important; display:none !important;}'
      document.head.appendChild(el)
    }
  }, [])
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user && user.phoneNumber) { setMyPhone(user.phoneNumber); setIsVerified(true); localStorage.setItem('eva-my-phone', user.phoneNumber); localStorage.setItem('eva-phone-verified', 'true') }
      else { setIsVerified(false) }
    })
    return () => unsub()
  }, [])
  useEffect(() => {
    const saved = localStorage.getItem('eva-my-phone')
    const verified = localStorage.getItem('eva-phone-verified')
    if (saved && verified === 'true') { setMyPhone(saved); const nm = localStorage.getItem(`eva-name-${saved}`); if (nm) setMyName(nm) }
    try { const evaOn = localStorage.getItem('eva-contacts-enabled'); if (evaOn !== null) setEvaContactsOn(evaOn === 'true') } catch {}
  }, [])
  useEffect(() => {
    if (!myPhone) return
    try {
      const nm = localStorage.getItem(`eva-name-${myPhone}`); setMyName(nm || '')
      const c = localStorage.getItem(`eva-contacts-${myPhone}`); if (c) setContacts((JSON.parse(c) as Contact[]).filter(x => normPhone(x.phone) !== normPhone(myPhone))); else setContacts([])
      const cm = localStorage.getItem(`eva-chat-msgs-${myPhone}`); if (cm) setChatMsgs(JSON.parse(cm)); else setChatMsgs({})
      const ch = localStorage.getItem(`eva-chats-${myPhone}`); if (ch) setChats(JSON.parse(ch)); else setChats([])
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
  useEffect(() => { msgsEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [selfMsgs, chatMsgs])

  // FIXED: All keys are normPhone (080...)
  useEffect(() => {
    if (!myPhone || !isVerified) return
    const q = query(collection(db, "eva_messages"))
    const unsub = onSnapshot(q, (snap) => {
      const byKey: Record<string, Msg[]> = {}
      const chatMap: Record<string, Chat> = {}
      const selfList: Msg[] = []
      snap.forEach((docSnap) => {
        const d: any = docSnap.data()
        if (!d.sender || !d.receiver) return
        if (normPhone(d.sender) !== normPhone(myPhone) && normPhone(d.receiver) !== normPhone(myPhone)) return
        const timeStr = d.createdAt?.toDate ? d.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : nowTime()
        const msg: Msg = { text: d.text, time: timeStr, kind: 'text', status: d.status || 'sent', id: docSnap.id, sender: d.sender }
        if (normPhone(d.sender) === normPhone(myPhone) && normPhone(d.receiver) === normPhone(myPhone)) {
          selfList.push(msg)
          return
        }
        const other = normPhone(d.sender) === normPhone(myPhone) ? d.receiver : d.sender
        if (!other) return
        const otherKey = normPhone(other)
        if (!byKey[otherKey]) byKey[otherKey] = []
        byKey[otherKey].push(msg)
        const savedName = contacts.find(c => normPhone(c.phone) === normPhone(other))?.name || other
        chatMap[otherKey] = { name: savedName, msg: d.text || "", time: timeStr, ring: 'none', type: 'none', phone: other }
        if (normPhone(d.receiver) === normPhone(myPhone) && d.status === 'sent') {
          updateDoc(doc(db, "eva_messages", docSnap.id), { status: 'delivered' }).catch(() => {})
        }
      })
      if (selfList.length > 0) {
        setSelfMsgs(prev => {
          const seen = new Set(prev.map(p => p.id))
          const fresh = selfList.filter(m => m.id && !seen.has(m.id))
          if (fresh.length === 0) return prev
          return [...prev, ...fresh]
        })
      }
      setChatMsgs(prev => {
        const merged: Record<string, Msg[]> = {}
        Object.keys(prev).forEach(k => { merged[normPhone(k)] = prev[k] })
        Object.keys(byKey).forEach(k => {
          const localPending = (merged[k] || []).filter(m => m.status === 'not_sent' && !m.id)
          merged[k] = [...byKey[k], ...localPending]
        })
        return merged
      })
      setChats(prev => {
        const prevMap: Record<string, Chat> = {}
        prev.forEach(c => { if (c.phone) prevMap[normPhone(c.phone)] = c })
        Object.keys(chatMap).forEach(k => {
          const localName = contacts.find(c => normPhone(c.phone) === normPhone(k))?.name
          if (localName) chatMap[k].name = localName
          if (prevMap[k]) chatMap[k] = { ...prevMap[k], ...chatMap[k], name: localName || prevMap[k].name }
        })
        const all = { ...prevMap, ...chatMap }
        return Object.values(all)
      })
    }, (err) => {
      console.log("EVA Firestore error:", err.message)
      showToast("Firebase blocked: " + err.message)
    })
    return () => unsub()
  }, [myPhone, isVerified, contacts])

  useEffect(() => {
    if (!openChat?.phone || !myPhone) return
    const msgs = chatMsgs[normPhone(openChat.phone)] || chatMsgs[openChat.phone] || []
    msgs.forEach(m => {
      if (m.sender && normPhone(m.sender) !== normPhone(myPhone) && m.status !== 'read' && m.id) {
        updateDoc(doc(db, "eva_messages", m.id), { status: 'read' }).catch(() => {})
      }
    })
  }, [openChat, chatMsgs])

  useEffect(() => {
    const retry = async () => {
      if (!myPhone || !navigator.onLine) return
      if (!auth.currentUser) return
      const allMsgs = Object.entries(chatMsgs)
      for (const [other, list] of allMsgs) {
        for (const m of list) {
          if (m.status === 'not_sent' && m.sender === myPhone && m.text) {
            try {
              await addDoc(collection(db, "eva_messages"), { sender: myPhone, receiver: other, text: m.text, status: 'sent', createdAt: serverTimestamp() })
              setChatMsgs(prev => ({ ...prev, [other]: (prev[other] || []).filter(x => !(x.status === 'not_sent' && x.text === m.text)) }))
            } catch {}
          }
        }
      }
    }
    window.addEventListener('online', retry)
    const t = setInterval(retry, 5000)
    return () => { window.removeEventListener('online', retry); clearInterval(t) }
  }, [chatMsgs, myPhone])

  const sendCode = async () => {
    const formatted = formatPhone(phoneInput)
    const digitsOnly = phoneInput.replace(/\D/g, '')
    if (digitsOnly.length < 7) return showToast('Enter a valid number')
    if (sending) return
    setSending(true)
    try {
      const verifier = getRecaptcha()
      const confirmation = await signInWithPhoneNumber(auth, formatted, verifier)
      confirmationRef.current = confirmation; setMyPhone(formatted); setCodeSent(true); showToast('Code sent by Firebase ✔')
    } catch (e: any) {
      try { recaptchaRef.current?.clear() } catch {}
      recaptchaRef.current = null; recaptchaReady.current = false
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
      setMyPhone(phone)
      const existingName = localStorage.getItem(`eva-name-${phone}`) || ''
      setMyName(existingName)
      setCodeSent(false); setOtpInput('')
      if (authMode === 'signup' && !existingName) { setSignupName(''); setIsVerified(true); setShowNameSetup(true) }
      else { setIsVerified(true); setShowNameSetup(false); showToast(authMode === 'signup' ? 'Account created ✔ Welcome to EVA Chat' : 'Number verified ✔ Welcome back to EVA Chat') }
    } catch (e: any) {
      if (e.code === 'auth/invalid-verification-code') showToast('Wrong code, try again')
      else if (e.code === 'auth/code-expired') showToast('Code expired, resend code')
      else showToast('Wrong code')
    } finally { setVerifying(false) }
  }
  const saveSignupName = () => {
    if (!signupName.trim()) return showToast('Enter your name or tap Skip for now')
    const name = signupName.trim()
    localStorage.setItem(`eva-name-${myPhone}`, name); setMyName(name)
    setShowNameSetup(false); setSignupName(''); showToast('Welcome to EVA Chat, ' + name + ' ✔')
  }
  const skipSignupName = () => { setShowNameSetup(false); setSignupName(''); showToast('Welcome to EVA Chat ✔') }
  const doLogout = async () => {
    try { await signOut(auth) } catch {}
    try { recaptchaRef.current?.clear() } catch {}
    recaptchaRef.current = null; recaptchaReady.current = false
    localStorage.removeItem('eva-my-phone'); localStorage.removeItem('eva-phone-verified')
    setIsVerified(false); setMyPhone(''); setMyName(''); setCodeSent(false); setOtpInput(''); setPhoneInput('')
    setShowNameSetup(false); setSignupName('')
    setShowLogoutConfirm(false); setShowContactMenu(false); setShowSelectContact(false); setOpenChat(null); setOpenSelf(false)
    setChats([]); setChatMsgs({}); setContacts([]); setMe({ type: 'none' })
    setSelfInput(''); setChatInput(''); setSearchText(''); setContactSearch(''); setNewName(''); setNewPhone('')
    setFullView(null); setOverlay(null); setShowPlusMenu(false); setTab('chat')
    showToast('Logged out ✔')
  }
  const saveNewContact = () => {
    if (!newName.trim()) return showToast('Enter name')
    if (newPhone.replace(/\D/g, '').length < 7) return showToast('Enter valid number')
    const phone = newPhone.startsWith('+') ? newPhone : formatPhone(newPhone)
    if (normPhone(phone) === normPhone(myPhone)) { setMyName(newName.trim()); localStorage.setItem(`eva-name-${myPhone}`, newName.trim()); setNewName(''); setNewPhone(''); setShowNewContact(false); showToast('Your name updated to ' + newName.trim() + ' ✔'); return }
    if (contacts.some(c => normPhone(c.phone) === normPhone(phone))) return showToast('Contact already exists')
    setContacts(p => [...p, { name: newName.trim(), phone }]); setNewName(''); setNewPhone(''); setShowNewContact(false); showToast('Contact saved on EVA ✔')
  }
  const startChatByNumber = () => {
    const phone = normalizePhoneGlobal(newChatNumber, selectedCountry.code)
    if (!phone || phone.replace(/\D/g, '').length < 7) return showToast('Enter valid number like 080... or +234...')
    if (normPhone(phone) === normPhone(myPhone)) return showToast("That's your own number - use Message yourself")
    const saved = contacts.find(c => normPhone(c.phone) === normPhone(phone))
    const display = saved ? saved.name : phone
    const existing = chats.find(x => x.phone && normPhone(x.phone) === normPhone(phone))
    if (existing) setOpenChat({ ...existing, name: display })
    else { const n: Chat = { name: display, msg: 'Tap to chat', time: nowTime(), ring: 'none', type: 'none', phone }; setChats(p => [n, ...p]); setOpenChat(n) }
    setNewChatNumber(''); setShowNewChatByNumber(false); setShowSelectContact(false); showToast('Chat opened - you can save this number later ✔')
  }
  const saveChatAsContact = () => {
    if (!openChat?.phone) return
    if (!saveNameInput.trim()) return showToast('Enter a name to save')
    const phone = openChat.phone; const name = saveNameInput.trim()
    if (contacts.some(c => normPhone(c.phone) === normPhone(phone))) setContacts(p => p.map(c => normPhone(c.phone) === normPhone(phone) ? { ...c, name } : c))
    else setContacts(p => [...p, { name, phone }])
    setChats(p => p.map(c => c.phone && normPhone(c.phone) === normPhone(phone) ? { ...c, name } : c))
    setOpenChat(prev => prev ? { ...prev, name } : prev)
    setSaveNameInput(''); setShowSaveContactFromChat(false); showToast('Saved as ' + name + ' ✔')
  }
  const visibleContacts = contacts.filter(c => !c.blocked && normPhone(c.phone) !== normPhone(myPhone))
  const filteredContacts = visibleContacts.filter(c => c.name.toLowerCase().includes(contactSearch.toLowerCase()) || c.phone.includes(contactSearch))
  const visibleChats = chats.filter(c => c.name.toLowerCase().includes(searchText.toLowerCase()) || (c.phone || "").includes(searchText))
  const filteredEmojis = EMOJI_CATS[emojiCat].filter(e => !emojiSearch || e.includes(emojiSearch))
  const sendSelf = async () => {
    if (!selfInput.trim()) return
    if (!auth.currentUser) { showToast('Please login again - session expired'); setIsVerified(false); return }
    const text = selfInput.trim()
    setSelfMsgs(p => [...p, { text, time: nowTime(), kind: 'text', status: 'read', sender: myPhone }]); setSelfInput(''); setShowEmoji(false)
    try {
      await addDoc(collection(db, "eva_messages"), { sender: myPhone, receiver: myPhone, text, status: 'read', createdAt: serverTimestamp(), isSelf: true })
    } catch {}
  }
  const sendChat = async () => {
    if (!chatInput.trim() || !openChat) return
    if (!auth.currentUser) { showToast('Please login again - session expired'); setIsVerified(false); return }
    if (!openChat.phone || !normPhone(openChat.phone)) { showToast('No number for this chat - start new chat by number'); return }
    const text = chatInput.trim()
    const key = normPhone(openChat.phone || openChat.name)
    setChatInput(''); setShowEmoji(false)
    if (!navigator.onLine) {
      setChatMsgs(p => ({ ...p, [key]: [...(p[key] || []), { text, time: nowTime(), kind: 'text', status: 'not_sent', sender: myPhone }] }))
      setChats(p => p.map(c => c.phone && normPhone(c.phone) === normPhone(openChat.phone || '') ? { ...c, msg: text, time: nowTime() } : c))
      showToast('No internet - message saved, will send when network comes back 💧')
      return
    }
    setChatMsgs(p => ({ ...p, [key]: [...(p[key] || []), { text, time: nowTime(), kind: 'text', status: 'sent', sender: myPhone }] }))
    setChats(p => p.map(c => c.phone && normPhone(c.phone) === normPhone(openChat.phone || '') ? { ...c, msg: text, time: nowTime() } : c))
    try {
      if (openChat.phone && normPhone(openChat.phone) !== normPhone(myPhone)) {
        await addDoc(collection(db, "eva_messages"), { sender: myPhone, receiver: openChat.phone, text, status: 'sent', createdAt: serverTimestamp() })
      }
    } catch (e: any) {
      setChatMsgs(p => ({ ...p, [key]: (p[key] || []).map(m => m.text === text && m.status === 'sent' ? { ...m, status: 'not_sent' } : m) }))
      showToast('Send failed: ' + (e.message || 'check login / internet'))
    }
  }
  const addEmoji = (em: string, isSelf: boolean) => { if (isSelf) setSelfInput(p => p + em); else setChatInput(p => p + em) }
  const toggleVoice = async (isSelf: boolean) => {
    if (isRecordingVoice) { voiceRecorderRef.current?.stop(); setIsRecordingVoice(false); return }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const rec = new MediaRecorder(stream); voiceChunksRef.current = []
      rec.ondataavailable = e => { if (e.data.size > 0) voiceChunksRef.current.push(e.data) }
      rec.onstop = async () => {
        const blob = new Blob(voiceChunksRef.current, { type: 'audio/webm' })
        const url = await fileToDataURL(new File([blob], 'voice.webm', { type: 'audio/webm' }))
        const msg: Msg = { audioUrl: url, time: nowTime(), kind: 'voice', status: 'read', sender: myPhone }
        if (isSelf) setSelfMsgs(p => [...p, msg])
        else if (openChat) { const key = normPhone(openChat.phone || openChat.name); setChatMsgs(p => ({ ...p, [key]: [...(p[key] || []), msg] })) }
        stream.getTracks().forEach(t => t.stop())
      }
      rec.start(); voiceRecorderRef.current = rec; setIsRecordingVoice(true); showToast('Recording voice... tap mic again to stop')
    } catch { showToast('Mic not allowed') }
  }
  const handlePhoto = async (e: any) => {
    const f = e.target.files?.[0]; if (!f) return
    const url = await fileToDataURL(f)
    setMe({ type: 'photo', src: url }); setFullView(null); setShowPlusMenu(false); showToast('Photo set ✔'); e.target.value = ''
  }
  const handleGallery = async (e: any) => {
    const f = e.target.files?.[0]; if (!f) return
    const url = await fileToDataURL(f)
    if (f.type.startsWith('image/')) { setMe({ type: 'photo', src: url }); setShowPlusMenu(false); showToast('Photo set ✔'); e.target.value = ''; return }
    const v = document.createElement('video'); v.preload = 'metadata'; v.src = url
    v.onloadedmetadata = () => { setTrimUrl(url); setTrimDur(v.duration); setTrimStart(0); setOverlay('trim'); setShowPlusMenu(false) }
    e.target.value = ''
  }
  const confirmTrim = () => { setLive(trimUrl, trimStart); setOverlay(null); setTrimUrl('') }
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
    // PART 2 START - paste directly after Part 1, no blank file break

  if (!isVerified) {
    return (
      <div style={{ minHeight: '100vh', background: '#0b0e24', color: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 20, fontFamily: 'system-ui' }}>
        {/* FIXED: recaptcha div must exist BEFORE sendCode is tapped */}
        <div ref={recaptchaDivRef} id="recaptcha-container" style={{ position: 'absolute', visibility: 'hidden', width: 0, height: 0 }}></div>

        <div style={{ fontSize: 42, marginBottom: 6 }}>💧</div>
        <h1 style={{ fontSize: 28, margin: 0 }}>EVA Chat</h1>
        <p style={{ opacity: 0.7, fontSize: 13, marginTop: 6 }}>{authMode === 'login' ? 'Welcome back' : 'Create your account'}</p>

        <div style={{ display: 'flex', gap: 8, margin: '16px 0', background: '#171c46', borderRadius: 20, padding: 4 }}>
          <button onClick={() => { setAuthMode('login'); setCodeSent(false) }} style={{ background: authMode === 'login' ? '#ff2f6d' : 'transparent', border: 0, color: '#fff', borderRadius: 16, padding: '8px 20px', fontSize: 14 }}>Login</button>
          <button onClick={() => { setAuthMode('signup'); setCodeSent(false) }} style={{ background: authMode === 'signup' ? '#ff2f6d' : 'transparent', border: 0, color: '#fff', borderRadius: 16, padding: '8px 20px', fontSize: 14 }}>Sign Up</button>
        </div>

        {!codeSent ? (
          <div style={{ width: '100%', maxWidth: 340 }}>
            <button onClick={() => setShowCountryPicker(true)} style={{ width: '100%', background: '#171c46', border: 0, color: '#fff', borderRadius: 12, padding: 14, display: 'flex', justifyContent: 'space-between', fontSize: 15 }}>
              <span>{selectedCountry.flag} {selectedCountry.name} ({selectedCountry.code})</span><span>▼</span>
            </button>
            <input value={phoneInput} onChange={e => setPhoneInput(e.target.value)} placeholder="803 123 4567" inputMode="tel" autoComplete="tel" style={{ width: '100%', boxSizing: 'border-box', background: '#171c46', border: 0, outline: 'none', color: '#fff', borderRadius: 12, padding: 14, fontSize: 16, marginTop: 10 }} />
            <p style={{ fontSize: 11, opacity: 0.6 }}>Enter like 0803... or +234803... both work now</p>
            <button onClick={sendCode} disabled={sending} style={{ width: '100%', background: 'linear-gradient(90deg,#ff2f6d,#8a2be2)', border: 0, color: '#fff', borderRadius: 12, padding: 14, fontSize: 16, opacity: sending ? 0.6 : 1 }}>{sending ? 'Sending...' : 'Send Code'}</button>
          </div>
        ) : (
          <div style={{ width: '100%', maxWidth: 340 }}>
            <p style={{ fontSize: 14, opacity: 0.8 }}>Code sent to {formatPhone(phoneInput)}</p>
            <input value={otpInput} onChange={e => setOtpInput(e.target.value)} placeholder="Enter 6-digit code" inputMode="numeric" maxLength={6} style={{ width: '100%', boxSizing: 'border-box', background: '#171c46', border: 0, outline: 'none', color: '#fff', borderRadius: 12, padding: 14, fontSize: 18, letterSpacing: 4, textAlign: 'center' }} />
            <button onClick={verifyCode} disabled={verifying} style={{ width: '100%', background: 'linear-gradient(90deg,#ff2f6d,#8a2be2)', border: 0, color: '#fff', borderRadius: 12, padding: 14, fontSize: 16, marginTop: 10, opacity: verifying ? 0.6 : 1 }}>{verifying ? 'Verifying...' : 'Verify & Continue'}</button>
            <button onClick={() => { setCodeSent(false); setOtpInput('') }} style={{ width: '100%', background: 'transparent', border: 0, color: '#aab', padding: 12, fontSize: 13 }}>Change number / Resend</button>
          </div>
        )}

        {showCountryPicker && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'flex-end', zIndex: 50 }}>
            <div style={{ width: '100%', background: '#141a3d', borderRadius: '20px 20px 0 0', padding: 16, maxHeight: '70vh', overflowY: 'auto' }}>
              <input value={countrySearch} onChange={e => setCountrySearch(e.target.value)} placeholder="Search country..." style={{ width: '100%', boxSizing: 'border-box', background: '#0b0e24', border: 0, outline: 'none', color: '#fff', borderRadius: 10, padding: 12, marginBottom: 10 }} />
              {filteredCountries.map(c => (
                <button key={c.code + c.name} onClick={() => { setSelectedCountry(c); setShowCountryPicker(false); setCountrySearch('') }} style={{ width: '100%', background: 'transparent', border: 0, color: '#fff', padding: '12px 4px', textAlign: 'left', fontSize: 15, borderBottom: '1px solid #222' }}>{c.flag} {c.name} {c.code}</button>
              ))}
              <button onClick={() => setShowCountryPicker(false)} style={{ width: '100%', background: '#ff2f6d', border: 0, color: '#fff', borderRadius: 10, padding: 12, marginTop: 10 }}>Close</button>
            </div>
          </div>
        )}
        {toast && <div style={{ position: 'fixed', bottom: 20, background: '#fff', color: '#000', padding: '10px 16px', borderRadius: 20, fontSize: 13, zIndex: 99 }}>{toast}</div>}
      </div>
    )
  }

  // Name setup after signup
  if (showNameSetup) {
    return (
      <div style={{ minHeight: '100vh', background: '#0b0e24', color: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <div ref={recaptchaDivRef} style={{ display: 'none' }}></div>
        <h2 style={{ fontSize: 22 }}>What is your name?</h2>
        <input value={signupName} onChange={e => setSignupName(e.target.value)} placeholder="Your name" style={{ width: '100%', maxWidth: 320, background: '#171c46', border: 0, outline: 'none', color: '#fff', borderRadius: 12, padding: 14, fontSize: 16 }} />
        <button onClick={saveSignupName} style={{ width: '100%', maxWidth: 320, background: 'linear-gradient(90deg,#ff2f6d,#8a2be2)', border: 0, color: '#fff', borderRadius: 12, padding: 14, marginTop: 12, fontSize: 16 }}>Continue</button>
        <button onClick={skipSignupName} style={{ background: 'transparent', border: 0, color: '#aab', padding: 12 }}>Skip for now</button>
        {toast && <div style={{ position: 'fixed', bottom: 20, background: '#fff', color: '#000', padding: '10px 16px', borderRadius: 20, fontSize: 13 }}>{toast}</div>}
      </div>
    )
  }

  const currentMsgs = openChat ? (chatMsgs[normPhone(openChat.phone || '')] || []) : []
  const currentSelfMsgs = selfMsgs

  // FIXED: openChat guard - if no phone, show warning in header, sendChat already blocks
  const openChatHasPhone = !!openChat?.phone && !!normPhone(openChat.phone)

  return (
    <div style={{ minHeight: '100vh', background: '#0b0e24', color: '#fff', display: 'flex', flexDirection: 'column', fontFamily: 'system-ui', maxWidth: 520, margin: '0 auto', position: 'relative' }}>
      <div ref={recaptchaDivRef} style={{ display: 'none' }}></div>
      <input ref={galleryRef} type="file" accept="image/*,video/*" style={{ display: 'none' }} onChange={handleGallery} />
      <input ref={photoRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhoto} />
      <input ref={docRef} type="file" style={{ display: 'none' }} onChange={handleGallery} />

      {/* SELF CHAT VIEW */}
      {openSelf ? (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', background: '#0b0e24', borderBottom: '1px solid #1a1f4a' }}>
            <button onClick={() => setOpenSelf(false)} style={{ background: 'none', border: 0, color: '#fff', fontSize: 20 }}>←</button>
            <Droplet o={{ ...me, ring: 'none' }} w={32} />
            <div style={{ flex: 1 }}><div style={{ fontWeight: 600 }}>Message yourself</div><div style={{ fontSize: 12, opacity: 0.6 }}>{myPhone}</div></div>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {currentSelfMsgs.length === 0 && <p style={{ opacity: 0.5, textAlign: 'center', marginTop: 40 }}>Send yourself notes, photos, reminders 💧</p>}
            {currentSelfMsgs.map((m, i) => (
              <div key={m.id || i} style={{ alignSelf: 'flex-end', background: '#2a2f5c', borderRadius: '14px 14px 4px 14px', padding: '8px 12px', maxWidth: '80%' }}>
                <div>{m.text}</div>
                <div style={{ fontSize: 11, opacity: 0.6, textAlign: 'right' }}>{m.time} <MsgStatus status={m.status} /></div>
              </div>
            ))}
            <div ref={msgsEndRef} />
          </div>
          <ChatBar value={selfInput} onChange={setSelfInput} onSend={sendSelf} isSelf={true} me={me} showEmoji={showEmoji} setShowEmoji={setShowEmoji} showAttach={showAttach} setShowAttach={setShowAttach} emojiCat={emojiCat} setEmojiCat={setEmojiCat} filteredEmojis={filteredEmojis} addEmoji={addEmoji} galleryRef={galleryRef} docRef={docRef} startRecord={startRecord} toggleVoice={toggleVoice} isRecordingVoice={isRecordingVoice} />
        </div>
      ) : openChat ? (
        /* OPEN CHAT VIEW */
        <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', background: '#0b0e24', borderBottom: '1px solid #1a1f4a' }}>
            <button onClick={() => setOpenChat(null)} style={{ background: 'none', border: 0, color: '#fff', fontSize: 20 }}>←</button>
            <Droplet o={{ ...openChat, ring: 'none' }} w={32} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{openChat.name}</div>
              <div style={{ fontSize: 12, opacity: 0.6 }}>{openChatHasPhone ? openChat.phone : '⚠️ No number - tap + to start by number'}</div>
            </div>
            {!isSavedContact(openChat.phone) && openChatHasPhone && <button onClick={() => setShowSaveContactFromChat(true)} style={{ background: '#ff2f6d', border: 0, color: '#fff', borderRadius: 16, padding: '6px 12px', fontSize: 12 }}>Save</button>}
            <button onClick={() => setShowContactMenu(true)} style={{ background: 'none', border: 0, color: '#fff', fontSize: 20 }}>⋮</button>
          </div>
          {!openChatHasPhone && <div style={{ background: '#ff2f6d', padding: '8px 14px', fontSize: 13, textAlign: 'center' }}>This chat has no number, so messages cannot send. Use + New Chat by Number.</div>}
          <div style={{ flex: 1, overflowY: 'auto', padding: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {currentMsgs.length === 0 && <p style={{ opacity: 0.5, textAlign: 'center', marginTop: 40 }}>Say hi to {openChat.name} 👋</p>}
            {currentMsgs.map((m, i) => {
              const mine = m.sender ? normPhone(m.sender) === normPhone(myPhone) : true
              return (
                <div key={m.id || i} style={{ alignSelf: mine ? 'flex-end' : 'flex-start', background: mine ? '#2a2f5c' : '#171c46', borderRadius: mine ? '14px 14px 4px 14px' : '14px 14px 14px 4px', padding: '8px 12px', maxWidth: '80%' }}>
                  <div>{m.text}</div>
                  <div style={{ fontSize: 11, opacity: 0.6, textAlign: 'right' }}>{m.time} {mine && <MsgStatus status={m.status} />}</div>
                </div>
              )
            })}
            <div ref={msgsEndRef} />
          </div>
          <ChatBar value={chatInput} onChange={setChatInput} onSend={sendChat} isSelf={false} me={me} showEmoji={showEmoji} setShowEmoji={setShowEmoji} showAttach={showAttach} setShowAttach={setShowAttach} emojiCat={emojiCat} setEmojiCat={setEmojiCat} filteredEmojis={filteredEmojis} addEmoji={addEmoji} galleryRef={galleryRef} docRef={docRef} startRecord={startRecord} toggleVoice={toggleVoice} isRecordingVoice={isRecordingVoice} />
        </div>
      ) : (
        /* MAIN LIST */
        <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
          <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <button onClick={() => setShowPlusMenu(true)} style={{ background: 'none', border: 0, padding: 0 }}><Droplet o={{ ...me, ring: 'none' }} w={40} /></button>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 18 }}>EVA Chat 💧</div>
              <div style={{ fontSize: 12, opacity: 0.6 }}>{myName || 'You'} • {myPhone}</div>
            </div>
            <button onClick={() => setShowSelectContact(true)} style={{ background: '#171c46', border: 0, color: '#fff', borderRadius: '50%', width: 40, height: 40, fontSize: 20 }}>+</button>
            <button onClick={() => setShowLogoutConfirm(true)} style={{ background: 'none', border: 0, color: '#fff', fontSize: 18 }}>⋮</button>
          </div>

          <div style={{ padding: '0 16px 10px' }}>
            <input ref={searchInputRef} value={searchText} onChange={e => setSearchText(e.target.value)} placeholder="Search chats..." style={{ width: '100%', boxSizing: 'border-box', background: '#171c46', border: 0, outline: 'none', color: '#fff', borderRadius: 20, padding: '10px 14px' }} />
          </div>

          <div style={{ display: 'flex', gap: 8, padding: '0 16px 10px' }}>
            <button onClick={() => setOpenSelf(true)} style={{ flex: 1, background: '#171c46', border: 0, color: '#fff', borderRadius: 12, padding: 12, fontSize: 13 }}>💧 Message yourself</button>
            <button onClick={() => setShowNewChatByNumber(true)} style={{ flex: 1, background: '#171c46', border: 0, color: '#fff', borderRadius: 12, padding: 12, fontSize: 13 }}>📞 Chat by number</button>
          </div>

          <div style={{ display: 'flex', gap: 6, padding: '0 16px 10px' }}>
            {(['chat', 'check', 'call'] as const).map(t => <button key={t} onClick={() => setTab(t)} style={{ flex: 1, background: tab === t ? '#ff2f6d' : '#171c46', border: 0, color: '#fff', borderRadius: 16, padding: '8px 0', fontSize: 13, textTransform: 'capitalize' }}>{t === 'check' ? 'Check' : t}</button>)}
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '0 8px 80px' }}>
            {visibleChats.length === 0 && <p style={{ opacity: 0.5, textAlign: 'center', marginTop: 40 }}>No chats yet.<br />Tap + to start a chat.</p>}
            {visibleChats.map((c, i) => (
              <button key={(c.phone || c.name) + i} onClick={() => { if (!c.phone || !normPhone(c.phone)) { showToast('This chat has no number - use Chat by number'); return } setOpenChat(c) }} style={{ width: '100%', background: 'transparent', border: 0, color: '#fff', display: 'flex', alignItems: 'center', gap: 12, padding: '10px 8px', textAlign: 'left', borderBottom: '1px solid #141a3d' }}>
                <Droplet o={c} w={44} />
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: 'flex', justifyContent: 'space-between' }}><b style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.name}</b><span style={{ fontSize: 11, opacity: 0.6 }}>{c.time}</span></span>
                  <span style={{ display: 'block', fontSize: 13, opacity: 0.7, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.msg}</span>
                  <span style={{ fontSize: 11, opacity: 0.5 }}>{c.phone || ''}</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* PLUS MENU - droplet / sticker */}
      {showPlusMenu && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 40, display: 'flex', alignItems: 'flex-end' }}>
          <div style={{ width: '100%', background: '#141a3d', borderRadius: '20px 20px 0 0', padding: 16 }}>
            <p style={{ margin: '0 0 12px', fontWeight: 600 }}>Your droplet</p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => { photoRef.current?.click() }} style={{ flex: 1, background: '#0b0e24', border: 0, color: '#fff', borderRadius: 12, padding: 12 }}>🖼️ Photo</button>
              <button onClick={() => { setShowPlusMenu(false); galleryRef.current?.click() }} style={{ flex: 1, background: '#0b0e24', border: 0, color: '#fff', borderRadius: 12, padding: 12 }}>🎥 Live / Video</button>
              <button onClick={() => setShowPlusMenu(false)} style={{ flex: 1, background: '#ff2f6d', border: 0, color: '#fff', borderRadius: 12, padding: 12 }}>Close</button>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 12, overflowX: 'auto' }}>
              {STICKERS.map(s => <button key={s.name} onClick={() => { setLive(s.src, 0) }} style={{ background: '#0b0e24', border: 0, color: '#fff', borderRadius: 12, padding: '10px 14px', whiteSpace: 'nowrap' }}>{s.e} {s.name}</button>)}
            </div>
            <button onClick={() => { setShowPlusMenu(false); setShowQR(true) }} style={{ width: '100%', background: '#0b0e24', border: 0, color: '#fff', borderRadius: 12, padding: 12, marginTop: 12 }}>📷 My QR</button>
          </div>
        </div>
      )}

      {/* SELECT CONTACT / NEW CHAT */}
      {showSelectContact && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 40, display: 'flex', alignItems: 'flex-end' }}>
          <div style={{ width: '100%', background: '#141a3d', borderRadius: '20px 20px 0 0', padding: 16, maxHeight: '80vh', overflowY: 'auto' }}>
            <input value={contactSearch} onChange={e => setContactSearch(e.target.value)} placeholder="Search contacts..." style={{ width: '100%', boxSizing: 'border-box', background: '#0b0e24', border: 0, outline: 'none', color: '#fff', borderRadius: 10, padding: 12 }} />
            <button onClick={() => { setShowSelectContact(false); setShowNewChatByNumber(true) }} style={{ width: '100%', background: '#ff2f6d', border: 0, color: '#fff', borderRadius: 10, padding: 12, marginTop: 10 }}>📞 New chat by number</button>
            <button onClick={() => { setShowSelectContact(false); setShowNewContact(true) }} style={{ width: '100%', background: '#0b0e24', border: 0, color: '#fff', borderRadius: 10, padding: 12, marginTop: 8 }}>+ New Contact</button>
            <button onClick={() => { setShowSelectContact(false); setOpenSelf(true) }} style={{ width: '100%', background: '#0b0e24', border: 0, color: '#fff', borderRadius: 10, padding: 12, marginTop: 8 }}>💧 Message yourself</button>
            {filteredContacts.map(c => (
              <button key={c.phone} onClick={() => { const existing = chats.find(x => x.phone && normPhone(x.phone) === normPhone(c.phone)); if (existing) setOpenChat(existing); else { const n: Chat = { name: c.name, msg: 'Tap to chat', time: nowTime(), ring: 'none', type: 'none', phone: c.phone }; setChats(p => [n, ...p]); setOpenChat(n) } setShowSelectContact(false) }} style={{ width: '100%', background: 'transparent', border: 0, color: '#fff', padding: '12px 4px', textAlign: 'left', borderBottom: '1px solid #222' }}>{c.name} • {c.phone}</button>
            ))}
            <button onClick={() => setShowSelectContact(false)} style={{ width: '100%', background: '#222', border: 0, color: '#fff', borderRadius: 10, padding: 12, marginTop: 10 }}>Close</button>
          </div>
        </div>
      )}

      {/* NEW CHAT BY NUMBER */}
      {showNewChatByNumber && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ width: '100%', maxWidth: 360, background: '#141a3d', borderRadius: 16, padding: 16 }}>
            <h3 style={{ marginTop: 0 }}>Chat by number</h3>
            <input value={newChatNumber} onChange={e => setNewChatNumber(e.target.value)} placeholder="080... or +234..." inputMode="tel" style={{ width: '100%', boxSizing: 'border-box', background: '#0b0e24', border: 0, outline: 'none', color: '#fff', borderRadius: 10, padding: 12 }} />
            <button onClick={startChatByNumber} style={{ width: '100%', background: '#ff2f6d', border: 0, color: '#fff', borderRadius: 10, padding: 12, marginTop: 10 }}>Open Chat</button>
            <button onClick={() => setShowNewChatByNumber(false)} style={{ width: '100%', background: 'transparent', border: 0, color: '#aab', padding: 10 }}>Cancel</button>
          </div>
        </div>
      )}

      {/* NEW CONTACT */}
      {showNewContact && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ width: '100%', maxWidth: 360, background: '#141a3d', borderRadius: 16, padding: 16 }}>
            <h3 style={{ marginTop: 0 }}>New Contact</h3>
            <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Name" style={{ width: '100%', boxSizing: 'border-box', background: '#0b0e24', border: 0, outline: 'none', color: '#fff', borderRadius: 10, padding: 12, marginBottom: 8 }} />
            <input value={newPhone} onChange={e => setNewPhone(e.target.value)} placeholder="080... or +234..." inputMode="tel" style={{ width: '100%', boxSizing: 'border-box', background: '#0b0e24', border: 0, outline: 'none', color: '#fff', borderRadius: 10, padding: 12 }} />
            <button onClick={saveNewContact} style={{ width: '100%', background: '#ff2f6d', border: 0, color: '#fff', borderRadius: 10, padding: 12, marginTop: 10 }}>Save Contact</button>
            <button onClick={() => setShowNewContact(false)} style={{ width: '100%', background: 'transparent', border: 0, color: '#aab', padding: 10 }}>Cancel</button>
          </div>
        </div>
      )}

      {/* SAVE CHAT AS CONTACT */}
      {showSaveContactFromChat && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ width: '100%', maxWidth: 360, background: '#141a3d', borderRadius: 16, padding: 16 }}>
            <h3 style={{ marginTop: 0 }}>Save {openChat?.phone}</h3>
            <input value={saveNameInput} onChange={e => setSaveNameInput(e.target.value)} placeholder="Name" style={{ width: '100%', boxSizing: 'border-box', background: '#0b0e24', border: 0, outline: 'none', color: '#fff', borderRadius: 10, padding: 12 }} />
            <button onClick={saveChatAsContact} style={{ width: '100%', background: '#ff2f6d', border: 0, color: '#fff', borderRadius: 10, padding: 12, marginTop: 10 }}>Save</button>
            <button onClick={() => setShowSaveContactFromChat(false)} style={{ width: '100%', background: 'transparent', border: 0, color: '#aab', padding: 10 }}>Cancel</button>
          </div>
        </div>
      )}

      {/* CONTACT MENU / SETTINGS */}
      {showContactMenu && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 50, display: 'flex', alignItems: 'flex-end' }}>
          <div style={{ width: '100%', background: '#141a3d', borderRadius: '20px 20px 0 0', padding: 16 }}>
            <button onClick={() => { setShowContactMenu(false); setShowContactSettings(true) }} style={{ width: '100%', background: '#0b0e24', border: 0, color: '#fff', borderRadius: 10, padding: 12, marginBottom: 8 }}>Settings</button>
            <button onClick={() => { setShowContactMenu(false); setShowInvite(true) }} style={{ width: '100%', background: '#0b0e24', border: 0, color: '#fff', borderRadius: 10, padding: 12, marginBottom: 8 }}>Invite</button>
            <button onClick={() => { setShowContactMenu(false); setShowHelp(true) }} style={{ width: '100%', background: '#0b0e24', border: 0, color: '#fff', borderRadius: 10, padding: 12, marginBottom: 8 }}>Help</button>
            <button onClick={() => { setShowContactMenu(false); setShowBlocked(true) }} style={{ width: '100%', background: '#0b0e24', border: 0, color: '#fff', borderRadius: 10, padding: 12, marginBottom: 8 }}>Blocked</button>
            <button onClick={() => setShowContactMenu(false)} style={{ width: '100%', background: '#ff2f6d', border: 0, color: '#fff', borderRadius: 10, padding: 12 }}>Close</button>
          </div>
        </div>
      )}
      {showContactSettings && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ width: '100%', maxWidth: 360, background: '#141a3d', borderRadius: 16, padding: 16 }}>
            <h3 style={{ marginTop: 0 }}>Settings</h3>
            <p style={{ fontSize: 13, opacity: 0.7 }}>Name: {myName}<br />Phone: {myPhone}</p>
            <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, padding: '10px 0' }}>EVA Contacts <input type="checkbox" checked={evaContactsOn} onChange={e => setEvaContactsOn(e.target.checked)} /></label>
            <button onClick={() => setShowContactSettings(false)} style={{ width: '100%', background: '#ff2f6d', border: 0, color: '#fff', borderRadius: 10, padding: 12 }}>Close</button>
          </div>
        </div>
      )}
      {showInvite && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ width: '100%', maxWidth: 360, background: '#141a3d', borderRadius: 16, padding: 16, textAlign: 'center' }}>
            <h3>Invite to EVA Chat</h3><p style={{ fontSize: 13, opacity: 0.7 }}>Share EVA Chat with your friends. They just need your number to chat.</p>
            <button onClick={() => setShowInvite(false)} style={{ width: '100%', background: '#ff2f6d', border: 0, color: '#fff', borderRadius: 10, padding: 12 }}>Close</button>
          </div>
        </div>
      )}
      {showHelp && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ width: '100%', maxWidth: 360, background: '#141a3d', borderRadius: 16, padding: 16 }}>
            <h3 style={{ marginTop: 0 }}>Help</h3><p style={{ fontSize: 13, opacity: 0.8 }}>If messages show 💧, you have no internet or you are not logged in. Logout and login again with OTP.</p>
            <button onClick={() => setShowHelp(false)} style={{ width: '100%', background: '#ff2f6d', border: 0, color: '#fff', borderRadius: 10, padding: 12 }}>Close</button>
          </div>
        </div>
      )}
      {showBlocked && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ width: '100%', maxWidth: 360, background: '#141a3d', borderRadius: 16, padding: 16 }}>
            <h3 style={{ marginTop: 0 }}>Blocked</h3>
            {contacts.filter(c => c.blocked).length === 0 ? <p style={{ fontSize: 13, opacity: 0.7 }}>No blocked contacts</p> : contacts.filter(c => c.blocked).map(c => <div key={c.phone} style={{ padding: '8px 0', borderBottom: '1px solid #222' }}>{c.name} • {c.phone}</div>)}
            <button onClick={() => setShowBlocked(false)} style={{ width: '100%', background: '#ff2f6d', border: 0, color: '#fff', borderRadius: 10, padding: 12, marginTop: 10 }}>Close</button>
          </div>
        </div>
      )}
      {showGroup && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ width: '100%', maxWidth: 360, background: '#141a3d', borderRadius: 16, padding: 16 }}>
            <h3 style={{ marginTop: 0 }}>New Group (soon)</h3>
            <input value={groupName} onChange={e => setGroupName(e.target.value)} placeholder="Group name" style={{ width: '100%', boxSizing: 'border-box', background: '#0b0e24', border: 0, outline: 'none', color: '#fff', borderRadius: 10, padding: 12 }} />
            <button onClick={() => { setShowGroup(false); showToast('Groups coming soon') }} style={{ width: '100%', background: '#ff2f6d', border: 0, color: '#fff', borderRadius: 10, padding: 12, marginTop: 10 }}>Create</button>
            <button onClick={() => setShowGroup(false)} style={{ width: '100%', background: 'transparent', border: 0, color: '#aab', padding: 10 }}>Cancel</button>
          </div>
        </div>
      )}
      {showQR && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ width: '100%', maxWidth: 360, background: '#141a3d', borderRadius: 16, padding: 16, textAlign: 'center' }}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              <button onClick={() => setQrTab('my')} style={{ flex: 1, background: qrTab === 'my' ? '#ff2f6d' : '#0b0e24', border: 0, color: '#fff', borderRadius: 10, padding: 10 }}>My QR</button>
              <button onClick={() => setQrTab('scan')} style={{ flex: 1, background: qrTab === 'scan' ? '#ff2f6d' : '#0b0e24', border: 0, color: '#fff', borderRadius: 10, padding: 10 }}>Scan</button>
            </div>
            {qrTab === 'my' ? (<div><p style={{ fontSize: 13 }}>Share this number:</p><h2 style={{ margin: '8px 0' }}>{myPhone}</h2><p style={{ fontSize: 12, opacity: 0.6 }}>{myName}</p></div>) : (<div><input value={scanInput} onChange={e => setScanInput(e.target.value)} placeholder="Paste number 080... / +234..." style={{ width: '100%', boxSizing: 'border-box', background: '#0b0e24', border: 0, outline: 'none', color: '#fff', borderRadius: 10, padding: 12 }} /><button onClick={() => { setNewChatNumber(scanInput); setShowQR(false); setShowNewChatByNumber(true) }} style={{ width: '100%', background: '#ff2f6d', border: 0, color: '#fff', borderRadius: 10, padding: 12, marginTop: 10 }}>Open Chat</button></div>)}
            <button onClick={() => setShowQR(false)} style={{ width: '100%', background: 'transparent', border: 0, color: '#aab', padding: 10 }}>Close</button>
          </div>
        </div>
      )}

      {/* LOGOUT CONFIRM */}
      {showLogoutConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ width: '100%', maxWidth: 340, background: '#141a3d', borderRadius: 16, padding: 16, textAlign: 'center' }}>
            <h3 style={{ marginTop: 0 }}>Logout?</h3><p style={{ fontSize: 13, opacity: 0.7 }}>You will need OTP to login again.</p>
            <button onClick={doLogout} style={{ width: '100%', background: '#ff2f6d', border: 0, color: '#fff', borderRadius: 10, padding: 12 }}>Yes, Logout</button>
            <button onClick={() => setShowLogoutConfirm(false)} style={{ width: '100%', background: 'transparent', border: 0, color: '#aab', padding: 10 }}>Cancel</button>
          </div>
        </div>
      )}

      {/* TRIM OVERLAY */}
      {overlay === 'trim' && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 60, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <p>Pick your 7-second start</p>
          {trimUrl && <video src={trimUrl} controls style={{ width: '100%', maxWidth: 320, borderRadius: 12 }} />}
          <input type="range" min={0} max={Math.max(0, trimDur - 1)} step={0.1} value={trimStart} onChange={e => setTrimStart(Number(e.target.value))} style={{ width: '100%', maxWidth: 320, marginTop: 12 }} />
          <p style={{ fontSize: 13 }}>Start: {trimStart.toFixed(1)}s / {trimDur.toFixed(1)}s</p>
          <button onClick={confirmTrim} style={{ width: '100%', maxWidth: 320, background: '#ff2f6d', border: 0, color: '#fff', borderRadius: 10, padding: 12 }}>Use this clip ✔</button>
          <button onClick={() => setOverlay(null)} style={{ background: 'transparent', border: 0, color: '#aab', padding: 10 }}>Cancel</button>
        </div>
      )}

      {/* FULL VIEW */}
      {fullView && (
        <div style={{ position: 'fixed', inset: 0, background: '#000', zIndex: 70, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }} onClick={() => setFullView(null)}>
          {fullView.src && (fullView.type === 'live' ? <video ref={fullVideoRef} src={fullView.src} autoPlay muted={fullMuted} loop playsInline style={{ maxWidth: '100%', maxHeight: '80vh' }} /> : <img src={fullView.src} style={{ maxWidth: '100%', maxHeight: '80vh' }} />)}
          <button onClick={(e) => { e.stopPropagation(); setFullMuted(!fullMuted) }} style={{ background: '#ff2f6d', border: 0, color: '#fff', borderRadius: 10, padding: 10, marginTop: 12 }}>{fullMuted ? 'Unmute' : 'Mute'}</button>
        </div>
      )}
      {recording && <div style={{ position: 'fixed', top: 12, left: '50%', transform: 'translateX(-50%)', background: '#ff2f6d', color: '#fff', padding: '8px 16px', borderRadius: 20, fontSize: 13, zIndex: 99 }}>● Recording 7 secs...</div>}
      {toast && <div style={{ position: 'fixed', bottom: 20, left: '50%', transform: 'translateX(-50%)', background: '#fff', color: '#000', padding: '10px 16px', borderRadius: 20, fontSize: 13, zIndex: 99, maxWidth: '90%', textAlign: 'center' }}>{toast}</div>}
    </div>
  )
}
