'use client'
import { useState, useEffect, useRef } from 'react'

type Msg = { text?: string; audioUrl?: string; time: string; kind: 'text' | 'voice' }
type Chat = { name: string; msg: string; time: string; ring: string; type: string; phone: string; src?: string; start?: number }
type Contact = { name: string; phone: string; blocked?: boolean }

const EMOJI_CATS: Record<string, string[]> = {
  Smile: ['😀','😁','😂','🤣','😊','😍','😘','😎','🤔','😴','😡','🥳','😭','🙏','👍','👎','👏','🙌','🔥','❤️','💔','✨','🎉','😇','🤗'],
  Animals: ['🐶','🐱','🐭','🐰','🦁','🐯','🐵','🐷','🐥','🦋','🐢','🐍','🦄','🐝','🦖','🐳'],
  Food: ['🍎','🍕','🍔','🍟','🍩','🍰','🍫','🍿','🍦','🍓','🍇','🥑','🍜','☕','🧃','🍺'],
  Sport: ['⚽','🏀','🏈','🎾','🏊','🚴','🏋️','🎮','🎲','🎯','🏆','🥇','🎸','🎤','🎧','📷'],
}
const STICKERS = [
  { name: 'Aki', e: '😂', src: '' },
  { name: 'Pawpaw', e: '😜', src: '' },
  { name: 'Fire', e: '🔥', src: '' },
]
const COUNTRIES = [
  { name: 'Nigeria', code: '+234', flag: '🇳🇬' },
  { name: 'Ghana', code: '+233', flag: '🇬🇭' },
  { name: 'United States', code: '+1', flag: '🇺🇸' },
  { name: 'United Kingdom', code: '+44', flag: '🇬🇧' },
  { name: 'South Africa', code: '+27', flag: '🇿🇦' },
  { name: 'Kenya', code: '+254', flag: '🇰🇪' },
  { name: 'Cameroon', code: '+237', flag: '🇨🇲' },
  { name: 'Benin', code: '+229', flag: '🇧🇯' },
  { name: 'Togo', code: '+228', flag: '🇹🇬' },
  { name: 'India', code: '+91', flag: '🇮🇳' },
]

function nowTime() {
  const d = new Date()
  let h = d.getHours(); const m = d.getMinutes().toString().padStart(2, '0')
  const ap = h >= 12 ? 'PM' : 'AM'; h = h % 12 || 12
  return `${h}:${m} ${ap}`
}
function formatPhone(p: string) { return p.startsWith('+') ? p : '+234' + p.replace(/^0+/, '') }
async function fileToDataURL(f: File | Blob): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader(); r.onload = () => res(r.result as string); r.onerror = rej; r.readAsDataURL(f)
  })
}

function Droplet({ o, w, muted }: { o: any; w: number; muted?: boolean }) {
  const size = w
  const bg = o.type === 'photo' && o.src ? `url(${o.src})` : o.type === 'live' && o.src ? '#000' : 'linear-gradient(160deg,#1a2a6c,#0b0e24)'
  return (
    <div className="drop" style={{ width: size, height: size * 1.28, borderRadius: '50% 50% 50% 50% / 62% 62% 38% 38%', background: bg, backgroundSize: 'cover', backgroundPosition: 'center', overflow: 'hidden', flexShrink: 0, position: 'relative', border: '2px solid rgba(255,255,255,.25)' }}>
      {o.type === 'live' && o.src && <video src={o.src} autoPlay muted={muted !== false} loop playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
      {o.type === 'none' && <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.4 }}>💧</div>}
      {o.type === 'photo' && !o.src && <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.4 }}>💧</div>}
    </div>
  )
}

function ChatBar(props: any) {
  const { value, onChange, onSend, isSelf, me, showEmoji, setShowEmoji, showAttach, setShowAttach, emojiCat, setEmojiCat, filteredEmojis, addEmoji, galleryRef, docRef, startRecord, toggleVoice, isRecordingVoice } = props
  return (
    <div style={{ background: '#0e1230', padding: '8px 10px calc(env(safe-area-inset-bottom) + 8px)', borderTop: '1px solid #1a1f4a' }}>
      {showEmoji && (
        <div style={{ background: '#171c46', borderRadius: 14, padding: 10, marginBottom: 8 }}>
          <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
            {Object.keys(EMOJI_CATS).map(c => <button key={c} onClick={() => setEmojiCat(c)} style={{ background: emojiCat === c ? '#ff2f6d' : '#222', border: 0, color: '#fff', borderRadius: 10, padding: '6px 10px', fontSize: 11 }}>{c}</button>)}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, maxHeight: 140, overflowY: 'auto' }}>
            {filteredEmojis.map((e: string, i: number) => <button key={i} onClick={() => addEmoji(e, isSelf)} style={{ background: 'none', border: 0, fontSize: 22 }}>{e}</button>)}
          </div>
        </div>
      )}
      {showAttach && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <button onClick={() => galleryRef.current?.click()} style={{ flex: 1, background: '#171c46', border: 0, color: '#fff', borderRadius: 12, padding: 10 }}>🖼️ Gallery</button>
          <button onClick={() => docRef.current?.click()} style={{ flex: 1, background: '#171c46', border: 0, color: '#fff', borderRadius: 12, padding: 10 }}>📄 Document</button>
          <button onClick={startRecord} style={{ flex: 1, background: '#171c46', border: 0, color: '#fff', borderRadius: 12, padding: 10 }}>📷 Record 7s</button>
        </div>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button onClick={() => setShowEmoji(!showEmoji)} style={{ background: 'none', border: 0, fontSize: 22 }}>😀</button>
        <button onClick={() => setShowAttach(!showAttach)} style={{ background: 'none', border: 0, fontSize: 22 }}>📎</button>
        <input value={value} onChange={e => onChange(e.target.value)} onKeyDown={e => e.key === 'Enter' && onSend()} placeholder={isSelf ? 'Message yourself...' : 'Message...'} style={{ flex: 1, background: '#171c46', border: 0, borderRadius: 20, padding: '10px 14px', color: '#fff', outline: 'none' }} />
        <button onClick={() => toggleVoice(isSelf)} style={{ background: isRecordingVoice ? '#ff2f4d' : 'none', border: 0, fontSize: 20, borderRadius: '50%', padding: 6 }}>🎤</button>
        <button onClick={onSend} style={{ background: '#ff2f6d', border: 0, color: '#fff', width: 38, height: 38, borderRadius: '50%', fontSize: 18 }}>➤</button>
      </div>
    </div>
  )
}

export default function ChatPage() {
  const [isVerified, setIsVerified] = useState(false)
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login')
  const [signupName, setSignupName] = useState('')
  const [phoneInput, setPhoneInput] = useState('')
  const [otpInput, setOtpInput] = useState('')
  const [codeSent, setCodeSent] = useState(false)
  const [sending, setSending] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [myPhone, setMyPhone] = useState('')
  const [myName, setMyName] = useState('')
  const [selectedCountry, setSelectedCountry] = useState(COUNTRIES[0])
  const [showCountryPicker, setShowCountryPicker] = useState(false)
  const [countrySearch, setCountrySearch] = useState('')
  const [me, setMe] = useState<any>({ type: 'none', ring: 'none' })
  const [chats, setChats] = useState<Chat[]>([])
  const [contacts, setContacts] = useState<Contact[]>([])
  const [openChat, setOpenChat] = useState<Chat | null>(null)
  const [openSelf, setOpenSelf] = useState(false)
  const [showSelectContact, setShowSelectContact] = useState(false)
  const [showContactMenu, setShowContactMenu] = useState(false)
  const [showNewContact, setShowNewContact] = useState(false)
  const [showGroup, setShowGroup] = useState(false)
  const [showQR, setShowQR] = useState(false)
  const [qrTab, setQrTab] = useState<'my' | 'scan'>('my')
  const [scanInput, setScanInput] = useState('')
  const [showContactSettings, setShowContactSettings] = useState(false)
  const [showInvite, setShowInvite] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
  const [showBlocked, setShowBlocked] = useState(false)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [evaContactsOn, setEvaContactsOn] = useState(true)
  const [newName, setNewName] = useState('')
  const [newPhone, setNewPhone] = useState('')
  const [groupName, setGroupName] = useState('')
  const [contactSearch, setContactSearch] = useState('')
  const [searchText, setSearchText] = useState('')
  const [searchFilter, setSearchFilter] = useState<'all' | 'unread' | 'photo' | 'live'>('all')
  const [tab, setTab] = useState<'chat' | 'check' | 'call'>('chat')
  const [selfMsgs, setSelfMsgs] = useState<Msg[]>([])
  const [chatMsgs, setChatMsgs] = useState<Record<string, Msg[]>>({})
  const [selfInput, setSelfInput] = useState('')
  const [chatInput, setChatInput] = useState('')
  const [showEmoji, setShowEmoji] = useState(false)
  const [showAttach, setShowAttach] = useState(false)
  const [emojiCat, setEmojiCat] = useState('Smile')
  const [emojiSearch, setEmojiSearch] = useState('')
  const [fullView, setFullView] = useState<any>(null)
  const [showPlusMenu, setShowPlusMenu] = useState(false)
  const [fullMuted, setFullMuted] = useState(true)
  const [overlay, setOverlay] = useState<string | null>(null)
  const [trimUrl, setTrimUrl] = useState('')
  const [trimDur, setTrimDur] = useState(0)
  const [trimStart, setTrimStart] = useState(0)
  const [recordUrl, setRecordUrl] = useState('')
  const [recording, setRecording] = useState(false)
  const [toast, setToast] = useState('')
  const [isRecordingVoice, setIsRecordingVoice] = useState(false)
  const galleryRef = useRef<HTMLInputElement>(null)
  const photoRef = useRef<HTMLInputElement>(null)
  const docRef = useRef<HTMLInputElement>(null)
  const msgsEndRef = useRef<HTMLDivElement>(null)
  const recaptchaDivRef = useRef<HTMLDivElement>(null)
  const voiceRecorderRef = useRef<MediaRecorder | null>(null)
  const voiceChunksRef = useRef<Blob[]>([])

  const showToast = (t: string) => { setToast(t); setTimeout(() => setToast(''), 2500) }
  const filteredCountries = COUNTRIES.filter(c => c.name.toLowerCase().includes(countrySearch.toLowerCase()))

  useEffect(() => {
    const savedPhone = localStorage.getItem('eva-phone')
    const savedVerified = localStorage.getItem('eva-verified')
    // Only auto-login if THIS user has logged in before on THIS device.
    // No hard-coded phone, no hard-coded name, no fake user.
    if (savedPhone && savedVerified === '1') {
      setMyPhone(savedPhone); setIsVerified(true)
      setMyName(localStorage.getItem(`eva-name-${savedPhone}`) || '')
      const savedMe = localStorage.getItem(`eva-me-${savedPhone}`)
      if (savedMe) { try { setMe(JSON.parse(savedMe)) } catch {} }
      const savedChats = localStorage.getItem(`eva-chats-${savedPhone}`)
      if (savedChats) { try { setChats(JSON.parse(savedChats)) } catch {} }
      const savedContacts = localStorage.getItem(`eva-contacts-${savedPhone}`)
      if (savedContacts) { try { setContacts(JSON.parse(savedContacts)) } catch {} }
      const savedSelf = localStorage.getItem(`eva-self-${savedPhone}`)
      if (savedSelf) { try { setSelfMsgs(JSON.parse(savedSelf)) } catch {} }
    } else {
      // New user: stay on login, all fields empty
      setIsVerified(false); setMyPhone(''); setMyName(''); setPhoneInput(''); setSignupName(''); setOtpInput(''); setCodeSent(false)
    }
  }, [])

  useEffect(() => { if (myPhone) localStorage.setItem(`eva-me-${myPhone}`, JSON.stringify(me)) }, [me, myPhone])
  useEffect(() => { if (myPhone) localStorage.setItem(`eva-chats-${myPhone}`, JSON.stringify(chats)) }, [chats, myPhone])
  useEffect(() => { if (myPhone) localStorage.setItem(`eva-contacts-${myPhone}`, JSON.stringify(contacts)) }, [contacts, myPhone])
  useEffect(() => { if (myPhone) localStorage.setItem(`eva-self-${myPhone}`, JSON.stringify(selfMsgs)) }, [selfMsgs, myPhone])
  useEffect(() => { msgsEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [selfMsgs, chatMsgs, openChat, openSelf])

  const sendCode = () => {
    if (phoneInput.replace(/\D/g, '').length < 7) return showToast('Enter valid number')
    setSending(true)
    setTimeout(() => { setSending(false); setCodeSent(true); showToast('Code sent - use 123456 for test') }, 800)
  }
  const verifyCode = () => {
    if (otpInput.trim() !== '123456') return showToast('Wrong code - use 123456 for test')
    setVerifying(true)
    const phone = phoneInput.startsWith('+') ? phoneInput : selectedCountry.code + phoneInput.replace(/^0+/, '')
    setTimeout(() => {
      setMyPhone(phone); setIsVerified(true); setVerifying(false)
      localStorage.setItem('eva-phone', phone); localStorage.setItem('eva-verified', '1')
      if (authMode === 'signup' && signupName.trim()) { setMyName(signupName.trim()); localStorage.setItem(`eva-name-${phone}`, signupName.trim()) }
      else { const n = localStorage.getItem(`eva-name-${phone}`); if (n) setMyName(n); else setMyName('') }
      showToast('Welcome')
    }, 800)
  }
  const doLogout = () => {
    localStorage.removeItem('eva-verified'); setIsVerified(false); setShowLogoutConfirm(false); setOpenChat(null); setOpenSelf(false); setShowSelectContact(false)
    setMyPhone(''); setMyName(''); setPhoneInput(''); setSignupName(''); setOtpInput(''); setCodeSent(false)
  }
  const setLive = (src: string, start: number) => {
    setMe({ type: 'live', src, start, ring: 'new' }); setOverlay(null); setShowPlusMenu(false); setFullView(null); showToast('Live profile set - 7 secs loop')
  }
  const filteredEmojis = EMOJI_CATS[emojiCat] || []
  const visibleContacts = contacts.filter(c => c.phone !== myPhone).filter(c => c.name.toLowerCase().includes(contactSearch.toLowerCase()))
  const visibleChats = chats.filter(c => c.phone !== myPhone).filter(c => {
    if (searchFilter === 'unread') return c.msg && c.msg !== 'Tap to chat'
    if (searchFilter === 'photo') return c.type === 'photo'
    if (searchFilter === 'live') return c.type === 'live'
    return true
  }).filter(c => c.name.toLowerCase().includes(searchText.toLowerCase()))

  const addEmoji = (e: string, isSelf: boolean) => {
    if (isSelf) setSelfInput(v => v + e)
    else setChatInput(v => v + e)
  }
  const sendSelf = () => {
    if (!selfInput.trim()) return
    setSelfMsgs(v => [...v, { text: selfInput, time: nowTime(), kind: 'text' }])
    setSelfInput('')
  }
  const sendChat = () => {
    if (!chatInput.trim() || !openChat) return
    const key = openChat.phone
    setChatMsgs(v => ({ ...v, [key]: [...(v[key] || []), { text: chatInput, time: nowTime(), kind: 'text' }] }))
    setChats(prev => prev.map(c => c.phone === key ? { ...c, msg: chatInput, time: nowTime() } : c))
    setChatInput('')
  }
  const toggleVoice = (isSelf: boolean) => {
    if (isRecordingVoice) {
      setIsRecordingVoice(false)
      showToast('Voice sent')
      if (isSelf) setSelfMsgs(v => [...v, { text: '🎤 Voice message', time: nowTime(), kind: 'text' }])
      return
    }
    setIsRecordingVoice(true)
    showToast('Recording voice... tap again to stop')
  }
  const startRecord = () => {
    setOverlay('record'); setShowAttach(false)
  }
  const handleGalleryFile = async (e: any) => {
    const f = e.target.files?.[0]; if (!f) return
    const url = await fileToDataURL(f)
    setMe({ type: 'photo', src: url, ring: 'new' })
    setShowPlusMenu(false); showToast('Photo profile set')
  }
  const handlePhotoProfile = async (e: any) => {
    const f = e.target.files?.[0]; if (!f) return
    const url = await fileToDataURL(f)
    setMe({ type: 'photo', src: url, ring: 'new' })
    setShowPlusMenu(false); showToast('Photo profile set')
  }
  const handleDocFile = async (e: any) => {
    const f = e.target.files?.[0]; if (!f) return
    showToast('Document: ' + f.name)
  }
  const addNewContact = () => {
    if (!newName.trim() || !newPhone.trim()) return showToast('Enter name and number')
    const phone = formatPhone(newPhone.trim())
    if (phone === myPhone) return showToast('That is your own number')
    if (contacts.some(c => c.phone === phone)) return showToast('Contact already exists')
    const nc = { name: newName.trim(), phone }
    setContacts(v => [...v, nc])
    setChats(v => [...v, { name: nc.name, msg: 'Tap to chat', time: nowTime(), ring: 'new', type: 'none', phone }])
    setNewName(''); setNewPhone(''); setShowNewContact(false); showToast('Contact added')
  }

  if (!isVerified) {
    return (
      <div style={{ minHeight: '100vh', background: '#0a0d26', color: '#fff', padding: 20, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
          <button onClick={() => setAuthMode('login')} style={{ flex: 1, background: authMode === 'login' ? '#ff2f6d' : '#171c46', border: 0, color: '#fff', borderRadius: 12, padding: 10 }}>Login</button>
          <button onClick={() => setAuthMode('signup')} style={{ flex: 1, background: authMode === 'signup' ? '#ff2f6d' : '#171c46', border: 0, color: '#fff', borderRadius: 12, padding: 10 }}>Sign Up</button>
        </div>
        {authMode === 'signup' && <input value={signupName} onChange={e => setSignupName(e.target.value)} placeholder="Your name" style={{ background: '#171c46', border: 0, borderRadius: 12, padding: 12, color: '#fff', marginBottom: 10, width: '100%' }} />}
        <button onClick={() => setShowCountryPicker(true)} style={{ background: '#171c46', border: 0, color: '#fff', borderRadius: 12, padding: 12, marginBottom: 10, width: '100%', textAlign: 'left' }}>{selectedCountry.flag} {selectedCountry.name} {selectedCountry.code} ▼</button>
        <input value={phoneInput} onChange={e => setPhoneInput(e.target.value)} placeholder="Phone number" inputMode="tel" style={{ background: '#171c46', border: 0, borderRadius: 12, padding: 12, color: '#fff', marginBottom: 10, width: '100%' }} />
        {!codeSent ? <button onClick={sendCode} style={{ background: '#ff2f6d', border: 0, color: '#fff', borderRadius: 12, padding: 12, width: '100%' }}>{sending ? 'Sending...' : 'Send Code'}</button> : <>
          <input value={otpInput} onChange={e => setOtpInput(e.target.value)} placeholder="Enter code - 123456" inputMode="numeric" style={{ background: '#171c46', border: 0, borderRadius: 12, padding: 12, color: '#fff', marginBottom: 10, width: '100%' }} />
          <button onClick={verifyCode} style={{ background: '#ff2f6d', border: 0, color: '#fff', borderRadius: 12, padding: 12, width: '100%' }}>{verifying ? 'Verifying...' : 'Verify & Enter'}</button>
        </>}
        {showCountryPicker && <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.7)', zIndex: 99, display: 'flex', alignItems: 'flex-end' }}><div style={{ background: '#0e1230', width: '100%', borderRadius: '20px 20px 0 0', padding: 16, maxHeight: '70vh', overflowY: 'auto' }}>
          <input value={countrySearch} onChange={e => setCountrySearch(e.target.value)} placeholder="Search country" style={{ background: '#171c46', border: 0, borderRadius: 10, padding: 10, color: '#fff', width: '100%', marginBottom: 10 }} />
          {filteredCountries.map(c => <div key={c.code} onClick={() => { setSelectedCountry(c); setShowCountryPicker(false) }} style={{ padding: 12, borderBottom: '1px solid #222' }}>{c.flag} {c.name} {c.code}</div>)}
          <button onClick={() => setShowCountryPicker(false)} style={{ background: '#222', border: 0, color: '#fff', borderRadius: 10, padding: 10, width: '100%', marginTop: 10 }}>Close</button>
        </div></div>}
        {toast && <div style={{ position: 'fixed', bottom: 20, left: '50%', transform: 'translateX(-50%)', background: '#fff', color: '#000', padding: '10px 16px', borderRadius: 20, zIndex: 999 }}>{toast}</div>}
        <div ref={recaptchaDivRef} />
      </div>
    )
  }

  if (openSelf) {
    return (
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#0a0d26', color: '#fff' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 12, background: '#0e1230', borderBottom: '1px solid #1a1f4a' }}>
          <button onClick={() => setOpenSelf(false)} style={{ background: 'none', border: 0, color: '#fff', fontSize: 20 }}>←</button>
          <Droplet o={me} w={36} />
          <div style={{ flex: 1 }}><div style={{ fontWeight: 700 }}>You (You)</div><div style={{ fontSize: 12, opacity: 0.6 }}>{myPhone}</div></div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: 14 }}>
          {selfMsgs.length === 0 && <div style={{ textAlign: 'center', opacity: 0.5, marginTop: 40 }}>Message yourself<br />Save notes, photos and voice here</div>}
          {selfMsgs.map((m, i) => <div key={i} style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}><div style={{ background: '#ff2f6d', padding: '8px 12px', borderRadius: 14, maxWidth: '80%' }}>{m.text}<div style={{ fontSize: 10, opacity: 0.7, textAlign: 'right' }}>{m.time}</div></div></div>)}
          <div ref={msgsEndRef} />
        </div>
        <ChatBar value={selfInput} onChange={setSelfInput} onSend={sendSelf} isSelf={true} me={me} showEmoji={showEmoji} setShowEmoji={setShowEmoji} showAttach={showAttach} setShowAttach={setShowAttach} emojiCat={emojiCat} setEmojiCat={setEmojiCat} filteredEmojis={filteredEmojis} addEmoji={addEmoji} galleryRef={galleryRef} docRef={docRef} startRecord={startRecord} toggleVoice={toggleVoice} isRecordingVoice={isRecordingVoice} />
      </div>
    )
  }

  if (openChat) {
    const msgs = chatMsgs[openChat.phone] || []
    return (
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#0a0d26', color: '#fff' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 12, background: '#0e1230', borderBottom: '1px solid #1a1f4a' }}>
          <button onClick={() => setOpenChat(null)} style={{ background: 'none', border: 0, color: '#fff', fontSize: 20 }}>←</button>
          <Droplet o={{ type: openChat.type, src: openChat.src }} w={36} />
          <div style={{ flex: 1 }}><div style={{ fontWeight: 700 }}>{openChat.name}</div><div style={{ fontSize: 12, opacity: 0.6 }}>{openChat.phone}</div></div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: 14 }}>
          {msgs.length === 0 && <div style={{ textAlign: 'center', opacity: 0.5, marginTop: 40 }}>No messages yet<br />Say hello to {openChat.name}</div>}
          {msgs.map((m, i) => <div key={i} style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}><div style={{ background: '#ff2f6d', padding: '8px 12px', borderRadius: 14, maxWidth: '80%' }}>{m.text}<div style={{ fontSize: 10, opacity: 0.7, textAlign: 'right' }}>{m.time}</div></div></div>)}
          <div ref={msgsEndRef} />
        </div>
        <ChatBar value={chatInput} onChange={setChatInput} onSend={sendChat} isSelf={false} me={me} showEmoji={showEmoji} setShowEmoji={setShowEmoji} showAttach={showAttach} setShowAttach={setShowAttach} emojiCat={emojiCat} setEmojiCat={setEmojiCat} filteredEmojis={filteredEmojis} addEmoji={addEmoji} galleryRef={galleryRef} docRef={docRef} startRecord={startRecord} toggleVoice={toggleVoice} isRecordingVoice={isRecordingVoice} />
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0a0d26', color: '#fff', paddingBottom: 90 }}>
      {/* CLEAN HEADER - NO TITLE, NO DROPLET */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px 8px', background: '#0e1230', position: 'sticky', top: 0, zIndex: 20 }}>
        <div style={{ flex: 1 }}><div style={{ fontSize: 14, opacity: 0.8 }}>{myName ? myName + ' • ' : ''}{myPhone}</div></div>
        <button onClick={() => setShowQR(true)} style={{ background: '#171c46', border: 0, color: '#fff', borderRadius: '50%', width: 38, height: 38 }}>📷</button>
        <button onClick={() => setShowContactMenu(true)} style={{ background: '#171c46', border: 0, color: '#fff', borderRadius: '50%', width: 38, height: 38 }}>⋮</button>
      </div>

      {/* SEARCH BAR - ALWAYS VISIBLE */}
      <div style={{ padding: '8px 16px', background: '#0e1230' }}>
        <input value={searchText} onChange={e => setSearchText(e.target.value)} placeholder="🔍 Search chats, contacts..." style={{ width: '100%', background: '#171c46', border: 0, borderRadius: 20, padding: '10px 14px', color: '#fff', outline: 'none' }} />
        <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
          {(['all', 'unread', 'photo', 'live'] as const).map(f => <button key={f} onClick={() => setSearchFilter(f)} style={{ background: searchFilter === f ? '#ff2f6d' : '#171c46', border: 0, color: '#fff', borderRadius: 12, padding: '6px 10px', fontSize: 11, textTransform: 'capitalize' }}>{f === 'all' ? 'All' : f}</button>)}
        </div>
      </div>

      {/* SINGLE TABS ROW - CHAT / CHECK / CALL ONLY HERE */}
      <div style={{ display: 'flex', gap: 8, padding: '10px 16px' }}>
        {(['chat', 'check', 'call'] as const).map(t => <button key={t} onClick={() => setTab(t)} style={{ flex: 1, background: tab === t ? '#ff2f6d' : '#171c46', border: 0, color: '#fff', borderRadius: 12, padding: 10, textTransform: 'capitalize', fontWeight: 700 }}>{t}</button>)}
      </div>

      <div style={{ padding: '0 16px' }}>
        {tab === 'chat' && <>
          {/* YOU ROW - ONLY DROPLET ON MAIN SCREEN */}
          <div onClick={() => setOpenSelf(true)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: '1px solid #1a1f4a', cursor: 'pointer' }}>
            <Droplet o={me} w={48} />
            <div style={{ flex: 1 }}><div style={{ fontWeight: 700 }}>You (You)</div><div style={{ fontSize: 12, opacity: 0.6 }}>{myPhone} • Message yourself</div></div>
            <span style={{ opacity: 0.5 }}>›</span>
          </div>
          {visibleChats.length === 0 && <div style={{ textAlign: 'center', opacity: 0.5, marginTop: 30 }}>No chats yet<br />Tap + below to add a contact</div>}
          {visibleChats.map(c => <div key={c.phone} onClick={() => setOpenChat(c)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: '1px solid #1a1f4a', cursor: 'pointer' }}>
            <Droplet o={{ type: c.type, src: c.src }} w={48} />
            <div style={{ flex: 1 }}><div style={{ fontWeight: 700 }}>{c.name}</div><div style={{ fontSize: 12, opacity: 0.6 }}>{c.msg}</div></div>
            <div style={{ fontSize: 11, opacity: 0.5 }}>{c.time}</div>
          </div>)}
        </>}
        {tab === 'check' && <div style={{ textAlign: 'center', opacity: 0.5, marginTop: 40 }}>No Checks yet<br />Your checks will appear here</div>}
        {tab === 'call' && <div style={{ textAlign: 'center', opacity: 0.5, marginTop: 40 }}>No calls yet<br />Your calls will appear here</div>}
      </div>

      {/* BOTTOM - ONLY PLUS BUTTON, NO DUPLICATE TABS */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#0e1230', borderTop: '1px solid #1a1f4a', padding: '10px 16px calc(env(safe-area-inset-bottom) + 10px)', display: 'flex', justifyContent: 'center' }}>
        <button onClick={() => setShowPlusMenu(true)} style={{ background: '#ff2f6d', border: 0, color: '#fff', width: 56, height: 56, borderRadius: '50%', fontSize: 28, boxShadow: '0 4px 20px rgba(255,47,109,.5)' }}>+</button>
      </div>

      {showPlusMenu && <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.7)', zIndex: 90, display: 'flex', alignItems: 'flex-end' }}><div style={{ background: '#0e1230', width: '100%', borderRadius: '20px 20px 0 0', padding: 16 }}>
        <div style={{ fontWeight: 800, marginBottom: 12 }}>What do you want to do?</div>
        <button onClick={() => { setShowPlusMenu(false); setShowNewContact(true) }} style={{ display: 'block', width: '100%', background: '#171c46', border: 0, color: '#fff', borderRadius: 12, padding: 12, marginBottom: 8, textAlign: 'left' }}>👤 New Contact</button>
        <button onClick={() => { setShowPlusMenu(false); setShowSelectContact(true) }} style={{ display: 'block', width: '100%', background: '#171c46', border: 0, color: '#fff', borderRadius: 12, padding: 12, marginBottom: 8, textAlign: 'left' }}>💬 New Chat</button>
        <button onClick={() => { setShowPlusMenu(false); setOverlay('photo') }} style={{ display: 'block', width: '100%', background: '#171c46', border: 0, color: '#fff', borderRadius: 12, padding: 12, marginBottom: 8, textAlign: 'left' }}>🖼️ Set Photo Profile</button>
        <button onClick={() => { setShowPlusMenu(false); setOverlay('record') }} style={{ display: 'block', width: '100%', background: '#171c46', border: 0, color: '#fff', borderRadius: 12, padding: 12, marginBottom: 8, textAlign: 'left' }}>🎥 Record Live 7s Profile</button>
        <button onClick={() => setShowPlusMenu(false)} style={{ display: 'block', width: '100%', background: '#222', border: 0, color: '#fff', borderRadius: 12, padding: 12 }}>Close</button>
      </div></div>}

      {showNewContact && <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.7)', zIndex: 95, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}><div style={{ background: '#0e1230', width: '100%', maxWidth: 400, borderRadius: 16, padding: 16 }}>
        <div style={{ fontWeight: 800, marginBottom: 12 }}>New Contact</div>
        <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Name" style={{ background: '#171c46', border: 0, borderRadius: 10, padding: 12, color: '#fff', width: '100%', marginBottom: 10 }} />
        <input value={newPhone} onChange={e => setNewPhone(e.target.value)} placeholder="Phone number" style={{ background: '#171c46', border: 0, borderRadius: 10, padding: 12, color: '#fff', width: '100%', marginBottom: 12 }} />
        <button onClick={addNewContact} style={{ background: '#ff2f6d', border: 0, color: '#fff', borderRadius: 10, padding: 12, width: '100%', marginBottom: 8 }}>Add Contact</button>
        <button onClick={() => setShowNewContact(false)} style={{ background: '#222', border: 0, color: '#fff', borderRadius: 10, padding: 10, width: '100%' }}>Cancel</button>
      </div></div>}

      {showSelectContact && <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.7)', zIndex: 95, display: 'flex', alignItems: 'flex-end' }}><div style={{ background: '#0e1230', width: '100%', borderRadius: '20px 20px 0 0', padding: 16, maxHeight: '70vh', overflowY: 'auto' }}>
        <div style={{ fontWeight: 800, marginBottom: 10 }}>Select Contact</div>
        <input value={contactSearch} onChange={e => setContactSearch(e.target.value)} placeholder="Search contacts" style={{ background: '#171c46', border: 0, borderRadius: 10, padding: 10, color: '#fff', width: '100%', marginBottom: 10 }} />
        {visibleContacts.length === 0 && <div style={{ opacity: 0.5, textAlign: 'center', padding: 20 }}>No contacts yet</div>}
        {visibleContacts.map(c => <div key={c.phone} onClick={() => { const ch = chats.find(x => x.phone === c.phone); if (ch) setOpenChat(ch); setShowSelectContact(false) }} style={{ padding: 12, borderBottom: '1px solid #1a1f4a' }}>{c.name} • {c.phone}</div>)}
        <button onClick={() => setShowSelectContact(false)} style={{ background: '#222', border: 0, color: '#fff', borderRadius: 10, padding: 10, width: '100%', marginTop: 10 }}>Close</button>
      </div></div>}

      {showContactMenu && <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.7)', zIndex: 95, display: 'flex', alignItems: 'flex-end' }}><div style={{ background: '#0e1230', width: '100%', borderRadius: '20px 20px 0 0', padding: 16 }}>
        <button onClick={() => { setShowContactMenu(false); setShowQR(true) }} style={{ display: 'block', width: '100%', background: '#171c46', border: 0, color: '#fff', borderRadius: 12, padding: 12, marginBottom: 8, textAlign: 'left' }}>📷 My QR Code</button>
        <button onClick={() => { setShowContactMenu(false); setShowInvite(true) }} style={{ display: 'block', width: '100%', background: '#171c46', border: 0, color: '#fff', borderRadius: 12, padding: 12, marginBottom: 8, textAlign: 'left' }}>✉️ Invite Friends</button>
        <button onClick={() => { setShowContactMenu(false); setShowHelp(true) }} style={{ display: 'block', width: '100%', background: '#171c46', border: 0, color: '#fff', borderRadius: 12, padding: 12, marginBottom: 8, textAlign: 'left' }}>❓ Help</button>
        <button onClick={() => { setShowContactMenu(false); setShowBlocked(true) }} style={{ display: 'block', width: '100%', background: '#171c46', border: 0, color: '#fff', borderRadius: 12, padding: 12, marginBottom: 8, textAlign: 'left' }}>🚫 Blocked Contacts</button>
        <button onClick={() => { setShowContactMenu(false); setShowLogoutConfirm(true) }} style={{ display: 'block', width: '100%', background: '#ff2f4d', border: 0, color: '#fff', borderRadius: 12, padding: 12, marginBottom: 8, textAlign: 'left' }}>🚪 Log Out</button>
        <button onClick={() => setShowContactMenu(false)} style={{ display: 'block', width: '100%', background: '#222', border: 0, color: '#fff', borderRadius: 12, padding: 10 }}>Close</button>
      </div></div>}

      {showQR && <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.8)', zIndex: 96, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}><div style={{ background: '#0e1230', width: '100%', maxWidth: 380, borderRadius: 16, padding: 16, textAlign: 'center' }}>
        <div style={{ fontWeight: 800, marginBottom: 10 }}>QR Code</div>
        <div style={{ background: '#fff', color: '#000', padding: 20, borderRadius: 12, marginBottom: 12, fontSize: 12 }}>QR for {myPhone}<br />{myName || ''}</div>
        <input value={scanInput} onChange={e => setScanInput(e.target.value)} placeholder="Paste scanned number" style={{ background: '#171c46', border: 0, borderRadius: 10, padding: 10, color: '#fff', width: '100%', marginBottom: 10 }} />
        <button onClick={() => { if (scanInput.trim()) { showToast('Scanned: ' + scanInput); setScanInput(''); setShowQR(false) } }} style={{ background: '#ff2f6d', border: 0, color: '#fff', borderRadius: 10, padding: 10, width: '100%', marginBottom: 8 }}>Add Scanned</button>
        <button onClick={() => setShowQR(false)} style={{ background: '#222', border: 0, color: '#fff', borderRadius: 10, padding: 10, width: '100%' }}>Close</button>
      </div></div>}

      {showLogoutConfirm && <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.8)', zIndex: 97, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}><div style={{ background: '#0e1230', width: '100%', maxWidth: 360, borderRadius: 16, padding: 16, textAlign: 'center' }}>
        <div style={{ fontWeight: 800, marginBottom: 8 }}>Log out?</div><div style={{ opacity: 0.6, marginBottom: 14 }}>Are you sure you want to log out?</div>
        <button onClick={doLogout} style={{ background: '#ff2f4d', border: 0, color: '#fff', borderRadius: 10, padding: 12, width: '100%', marginBottom: 8 }}>Yes, Log Out</button>
        <button onClick={() => setShowLogoutConfirm(false)} style={{ background: '#222', border: 0, color: '#fff', borderRadius: 10, padding: 10, width: '100%' }}>Cancel</button>
      </div></div>}

      {showInvite && <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.8)', zIndex: 97, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}><div style={{ background: '#0e1230', width: '100%', maxWidth: 360, borderRadius: 16, padding: 16, textAlign: 'center' }}>
        <div style={{ fontWeight: 800, marginBottom: 8 }}>Invite Friends</div><div style={{ opacity: 0.6, marginBottom: 12 }}>Share with your friends</div>
        <button onClick={() => { showToast('Invite link copied'); setShowInvite(false) }} style={{ background: '#ff2f6d', border: 0, color: '#fff', borderRadius: 10, padding: 12, width: '100%', marginBottom: 8 }}>Copy Invite Link</button>
        <button onClick={() => setShowInvite(false)} style={{ background: '#222', border: 0, color: '#fff', borderRadius: 10, padding: 10, width: '100%' }}>Close</button>
      </div></div>}

      {showHelp && <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.8)', zIndex: 97, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}><div style={{ background: '#0e1230', width: '100%', maxWidth: 360, borderRadius: 16, padding: 16 }}>
        <div style={{ fontWeight: 800, marginBottom: 8 }}>Help</div><div style={{ opacity: 0.7, fontSize: 13, lineHeight: 1.5 }}>• Tap + to add contact or set photo / live profile<br />• Tap You to message yourself<br />• Photo and live profiles loop for 7 seconds<br />• Use 123456 as test OTP code</div>
        <button onClick={() => setShowHelp(false)} style={{ background: '#222', border: 0, color: '#fff', borderRadius: 10, padding: 10, width: '100%', marginTop: 12 }}>Close</button>
      </div></div>}

      {showBlocked && <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.8)', zIndex: 97, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}><div style={{ background: '#0e1230', width: '100%', maxWidth: 360, borderRadius: 16, padding: 16 }}>
        <div style={{ fontWeight: 800, marginBottom: 8 }}>Blocked Contacts</div><div style={{ opacity: 0.5, marginBottom: 12 }}>No blocked contacts</div>
        <button onClick={() => setShowBlocked(false)} style={{ background: '#222', border: 0, color: '#fff', borderRadius: 10, padding: 10, width: '100%' }}>Close</button>
      </div></div>}

      {overlay === 'photo' && <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.8)', zIndex: 98, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}><div style={{ background: '#0e1230', width: '100%', maxWidth: 360, borderRadius: 16, padding: 16, textAlign: 'center' }}>
        <div style={{ fontWeight: 800, marginBottom: 10 }}>Set Photo Profile</div>
        <button onClick={() => photoRef.current?.click()} style={{ background: '#ff2f6d', border: 0, color: '#fff', borderRadius: 10, padding: 12, width: '100%', marginBottom: 8 }}>Choose Photo</button>
        <button onClick={() => setOverlay(null)} style={{ background: '#222', border: 0, color: '#fff', borderRadius: 10, padding: 10, width: '100%' }}>Cancel</button>
      </div></div>}

      {overlay === 'record' && <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.8)', zIndex: 98, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}><div style={{ background: '#0e1230', width: '100%', maxWidth: 360, borderRadius: 16, padding: 16, textAlign: 'center' }}>
        <div style={{ fontWeight: 800, marginBottom: 10 }}>Record Live 7s</div><div style={{ opacity: 0.6, fontSize: 13, marginBottom: 12 }}>Your live profile will loop for 7 seconds</div>
        <button onClick={() => { setOverlay(null); showToast('Use Gallery to pick a video for now') }} style={{ background: '#ff2f6d', border: 0, color: '#fff', borderRadius: 10, padding: 12, width: '100%', marginBottom: 8 }}>Pick Video From Gallery</button>
        <button onClick={() => setOverlay(null)} style={{ background: '#222', border: 0, color: '#fff', borderRadius: 10, padding: 10, width: '100%' }}>Cancel</button>
      </div></div>}

      <input ref={galleryRef} type="file" accept="image/*,video/*" hidden onChange={handleGalleryFile} />
      <input ref={photoRef} type="file" accept="image/*" hidden onChange={handlePhotoProfile} />
      <input ref={docRef} type="file" hidden onChange={handleDocFile} />
      {toast && <div style={{ position: 'fixed', bottom: 90, left: '50%', transform: 'translateX(-50%)', background: '#fff', color: '#000', padding: '10px 16px', borderRadius: 20, zIndex: 999, whiteSpace: 'nowrap' }}>{toast}</div>}
      <style>{`.drop{box-shadow:0 4px 14px rgba(0,0,0,.35)} input::placeholder{color:#888}`}</style>
    </div>
  )
}
