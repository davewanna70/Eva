"use client"
import { useState, useEffect, useRef } from "react"
import { initializeApp, getApps, getApp } from "firebase/app"
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber, onAuthStateChanged, type ConfirmationResult } from "firebase/auth"

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

const P = 'M50,0 C70,40 100,90 100,140 C100,180 80,210 50,210 C20,210 0,180 0,140 C0,90 30,40 50,0 Z'
const T = 'translate(5,10.5) scale(.9)'

type Chat = { name: string; msg: string; time: string; ring: 'new' | 'seen' | 'none'; type: 'none' | 'photo' | 'live'; src?: string; start?: number; phone?: string }
type Me = { type: 'none' | 'photo' | 'live'; src?: string; start?: number }
type Msg = { text?: string; time: string; audioUrl?: string; kind?: 'text' | 'voice' }

const INITIAL_CHATS: Chat[] = []
const STICKERS = [{ name: 'Aki', src: 'stickers/aki.mp4', e: '😎' }, { name: 'Pawpaw', src: 'stickers/pawpaw.mp4', e: '🐶' }]

const COUNTRIES = [
  { name: 'Afghanistan', code: '+93', flag: '🇦🇫' },
  { name: 'Albania', code: '+355', flag: '🇦🇱' },
  { name: 'Algeria', code: '+213', flag: '🇩🇿' },
  { name: 'Andorra', code: '+376', flag: '🇦🇩' },
  { name: 'Angola', code: '+244', flag: '🇦🇴' },
  { name: 'Antigua and Barbuda', code: '+1268', flag: '🇦🇬' },
  { name: 'Argentina', code: '+54', flag: '🇦🇷' },
  { name: 'Armenia', code: '+374', flag: '🇦🇲' },
  { name: 'Australia', code: '+61', flag: '🇦🇺' },
  { name: 'Austria', code: '+43', flag: '🇦🇹' },
  { name: 'Azerbaijan', code: '+994', flag: '🇦🇿' },
  { name: 'Bahamas', code: '+1242', flag: '🇧🇸' },
  { name: 'Bahrain', code: '+973', flag: '🇧🇭' },
  { name: 'Bangladesh', code: '+880', flag: '🇧🇩' },
  { name: 'Barbados', code: '+1246', flag: '🇧🇧' },
  { name: 'Belarus', code: '+375', flag: '🇧🇾' },
  { name: 'Belgium', code: '+32', flag: '🇧🇪' },
  { name: 'Belize', code: '+501', flag: '🇧🇿' },
  { name: 'Benin', code: '+229', flag: '🇧🇯' },
  { name: 'Bhutan', code: '+975', flag: '🇧🇹' },
  { name: 'Bolivia', code: '+591', flag: '🇧🇴' },
  { name: 'Bosnia and Herzegovina', code: '+387', flag: '🇧🇦' },
  { name: 'Botswana', code: '+267', flag: '🇧🇼' },
  { name: 'Brazil', code: '+55', flag: '🇧🇷' },
  { name: 'Brunei', code: '+673', flag: '🇧🇳' },
  { name: 'Bulgaria', code: '+359', flag: '🇧🇬' },
  { name: 'Burkina Faso', code: '+226', flag: '🇧🇫' },
  { name: 'Burundi', code: '+257', flag: '🇧🇮' },
  { name: 'Cambodia', code: '+855', flag: '🇰🇭' },
  { name: 'Cameroon', code: '+237', flag: '🇨🇲' },
  { name: 'Canada', code: '+1', flag: '🇨🇦' },
  { name: 'Cape Verde', code: '+238', flag: '🇨🇻' },
  { name: 'Central African Republic', code: '+236', flag: '🇨🇫' },
  { name: 'Chad', code: '+235', flag: '🇹🇩' },
  { name: 'Chile', code: '+56', flag: '🇨🇱' },
  { name: 'China', code: '+86', flag: '🇨🇳' },
  { name: 'Colombia', code: '+57', flag: '🇨🇴' },
  { name: 'Comoros', code: '+269', flag: '🇰🇲' },
  { name: 'Congo', code: '+242', flag: '🇨🇬' },
  { name: 'Costa Rica', code: '+506', flag: '🇨🇷' },
  { name: 'Croatia', code: '+385', flag: '🇭🇷' },
  { name: 'Cuba', code: '+53', flag: '🇨🇺' },
  { name: 'Cyprus', code: '+357', flag: '🇨🇾' },
  { name: 'Czech Republic', code: '+420', flag: '🇨🇿' },
  { name: 'Denmark', code: '+45', flag: '🇩🇰' },
  { name: 'Djibouti', code: '+253', flag: '🇩🇯' },
  { name: 'Dominica', code: '+1767', flag: '🇩🇲' },
  { name: 'Dominican Republic', code: '+1809', flag: '🇩🇴' },
  { name: 'Ecuador', code: '+593', flag: '🇪🇨' },
  { name: 'Egypt', code: '+20', flag: '🇪🇬' },
  { name: 'El Salvador', code: '+503', flag: '🇸🇻' },
  { name: 'Equatorial Guinea', code: '+240', flag: '🇬🇶' },
  { name: 'Eritrea', code: '+291', flag: '🇪🇷' },
  { name: 'Estonia', code: '+372', flag: '🇪🇪' },
  { name: 'Eswatini', code: '+268', flag: '🇸🇿' },
  { name: 'Ethiopia', code: '+251', flag: '🇪🇹' },
  { name: 'Fiji', code: '+679', flag: '🇫🇯' },
  { name: 'Finland', code: '+358', flag: '🇫🇮' },
  { name: 'France', code: '+33', flag: '🇫🇷' },
  { name: 'Gabon', code: '+241', flag: '🇬🇦' },
  { name: 'Gambia', code: '+220', flag: '🇬🇲' },
  { name: 'Georgia', code: '+995', flag: '🇬🇪' },
  { name: 'Germany', code: '+49', flag: '🇩🇪' },
  { name: 'Ghana', code: '+233', flag: '🇬🇭' },
  { name: 'Greece', code: '+30', flag: '🇬🇷' },
  { name: 'Grenada', code: '+1473', flag: '🇬🇩' },
  { name: 'Guatemala', code: '+502', flag: '🇬🇹' },
  { name: 'Guinea', code: '+224', flag: '🇬🇳' },
  { name: 'Guinea-Bissau', code: '+245', flag: '🇬🇼' },
  { name: 'Guyana', code: '+592', flag: '🇬🇾' },
  { name: 'Haiti', code: '+509', flag: '🇭🇹' },
  { name: 'Honduras', code: '+504', flag: '🇭🇳' },
  { name: 'Hungary', code: '+36', flag: '🇭🇺' },
  { name: 'Iceland', code: '+354', flag: '🇮🇸' },
  { name: 'India', code: '+91', flag: '🇮🇳' },
  { name: 'Indonesia', code: '+62', flag: '🇮🇩' },
  { name: 'Iran', code: '+98', flag: '🇮🇷' },
  { name: 'Iraq', code: '+964', flag: '🇮🇶' },
  { name: 'Ireland', code: '+353', flag: '🇮🇪' },
  { name: 'Israel', code: '+972', flag: '🇮🇱' },
  { name: 'Italy', code: '+39', flag: '🇮🇹' },
  { name: 'Jamaica', code: '+1876', flag: '🇯🇲' },
  { name: 'Japan', code: '+81', flag: '🇯🇵' },
  { name: 'Jordan', code: '+962', flag: '🇯🇴' },
  { name: 'Kazakhstan', code: '+7', flag: '🇰🇿' },
  { name: 'Kenya', code: '+254', flag: '🇰🇪' },
  { name: 'Kiribati', code: '+686', flag: '🇰🇮' },
  { name: 'Kuwait', code: '+965', flag: '🇰🇼' },
  { name: 'Kyrgyzstan', code: '+996', flag: '🇰🇬' },
  { name: 'Laos', code: '+856', flag: '🇱🇦' },
  { name: 'Latvia', code: '+371', flag: '🇱🇻' },
  { name: 'Lebanon', code: '+961', flag: '🇱🇧' },
  { name: 'Lesotho', code: '+266', flag: '🇱🇸' },
  { name: 'Liberia', code: '+231', flag: '🇱🇷' },
  { name: 'Libya', code: '+218', flag: '🇱🇾' },
  { name: 'Liechtenstein', code: '+423', flag: '🇱🇮' },
  { name: 'Lithuania', code: '+370', flag: '🇱🇹' },
  { name: 'Luxembourg', code: '+352', flag: '🇱🇺' },
  { name: 'Madagascar', code: '+261', flag: '🇲🇬' },
  { name: 'Malawi', code: '+265', flag: '🇲🇼' },
  { name: 'Malaysia', code: '+60', flag: '🇲🇾' },
  { name: 'Maldives', code: '+960', flag: '🇲🇻' },
  { name: 'Mali', code: '+223', flag: '🇲🇱' },
  { name: 'Malta', code: '+356', flag: '🇲🇹' },
  { name: 'Marshall Islands', code: '+692', flag: '🇲🇭' },
  { name: 'Mauritania', code: '+222', flag: '🇲🇷' },
  { name: 'Mauritius', code: '+230', flag: '🇲🇺' },
  { name: 'Mexico', code: '+52', flag: '🇲🇽' },
  { name: 'Micronesia', code: '+691', flag: '🇫🇲' },
  { name: 'Moldova', code: '+373', flag: '🇲🇩' },
  { name: 'Monaco', code: '+377', flag: '🇲🇨' },
  { name: 'Mongolia', code: '+976', flag: '🇲🇳' },
  { name: 'Montenegro', code: '+382', flag: '🇲🇪' },
  { name: 'Morocco', code: '+212', flag: '🇲🇦' },
  { name: 'Mozambique', code: '+258', flag: '🇲🇿' },
  { name: 'Myanmar', code: '+95', flag: '🇲🇲' },
  { name: 'Namibia', code: '+264', flag: '🇳🇦' },
  { name: 'Nauru', code: '+674', flag: '🇳🇷' },
  { name: 'Nepal', code: '+977', flag: '🇳🇵' },
  { name: 'Netherlands', code: '+31', flag: '🇳🇱' },
  { name: 'New Zealand', code: '+64', flag: '🇳🇿' },
  { name: 'Nicaragua', code: '+505', flag: '🇳🇮' },
  { name: 'Niger', code: '+227', flag: '🇳🇪' },
  { name: 'Nigeria', code: '+234', flag: '🇳🇬' },
  { name: 'North Korea', code: '+850', flag: '🇰🇵' },
  { name: 'North Macedonia', code: '+389', flag: '🇲🇰' },
  { name: 'Norway', code: '+47', flag: '🇳🇴' },
  { name: 'Oman', code: '+968', flag: '🇴🇲' },
  { name: 'Pakistan', code: '+92', flag: '🇵🇰' },
  { name: 'Palau', code: '+680', flag: '🇵🇼' },
  { name: 'Palestine', code: '+970', flag: '🇵🇸' },
  { name: 'Panama', code: '+507', flag: '🇵🇦' },
  { name: 'Papua New Guinea', code: '+675', flag: '🇵🇬' },
  { name: 'Paraguay', code: '+595', flag: '🇵🇾' },
  { name: 'Peru', code: '+51', flag: '🇵🇪' },
  { name: 'Philippines', code: '+63', flag: '🇵🇭' },
  { name: 'Poland', code: '+48', flag: '🇵🇱' },
  { name: 'Portugal', code: '+351', flag: '🇵🇹' },
  { name: 'Qatar', code: '+974', flag: '🇶🇦' },
  { name: 'Romania', code: '+40', flag: '🇷🇴' },
  { name: 'Russia', code: '+7', flag: '🇷🇺' },
  { name: 'Rwanda', code: '+250', flag: '🇷🇼' },
  { name: 'Saint Kitts and Nevis', code: '+1869', flag: '🇰🇳' },
  { name: 'Saint Lucia', code: '+1758', flag: '🇱🇨' },
  { name: 'Saint Vincent', code: '+1784', flag: '🇻🇨' },
  { name: 'Samoa', code: '+685', flag: '🇼🇸' },
  { name: 'San Marino', code: '+378', flag: '🇸🇲' },
  { name: 'Sao Tome and Principe', code: '+239', flag: '🇸🇹' },
  { name: 'Saudi Arabia', code: '+966', flag: '🇸🇦' },
  { name: 'Senegal', code: '+221', flag: '🇸🇳' },
  { name: 'Serbia', code: '+381', flag: '🇷🇸' },
  { name: 'Seychelles', code: '+248', flag: '🇸🇨' },
  { name: 'Sierra Leone', code: '+232', flag: '🇸🇱' },
  { name: 'Singapore', code: '+65', flag: '🇸🇬' },
  { name: 'Slovakia', code: '+421', flag: '🇸🇰' },
  { name: 'Slovenia', code: '+386', flag: '🇸🇮' },
  { name: 'Solomon Islands', code: '+677', flag: '🇸🇧' },
  { name: 'Somalia', code: '+252', flag: '🇸🇴' },
  { name: 'South Africa', code: '+27', flag: '🇿🇦' },
  { name: 'South Korea', code: '+82', flag: '🇰🇷' },
  { name: 'South Sudan', code: '+211', flag: '🇸🇸' },
  { name: 'Spain', code: '+34', flag: '🇪🇸' },
  { name: 'Sri Lanka', code: '+94', flag: '🇱🇰' },
  { name: 'Sudan', code: '+249', flag: '🇸🇩' },
  { name: 'Suriname', code: '+597', flag: '🇸🇷' },
  { name: 'Sweden', code: '+46', flag: '🇸🇪' },
  { name: 'Switzerland', code: '+41', flag: '🇨🇭' },
  { name: 'Syria', code: '+963', flag: '🇸🇾' },
  { name: 'Taiwan', code: '+886', flag: '🇹🇼' },
  { name: 'Tajikistan', code: '+992', flag: '🇹🇯' },
  { name: 'Tanzania', code: '+255', flag: '🇹🇿' },
  { name: 'Thailand', code: '+66', flag: '🇹🇭' },
  { name: 'Togo', code: '+228', flag: '🇹🇬' },
  { name: 'Tonga', code: '+676', flag: '🇹🇴' },
  { name: 'Trinidad and Tobago', code: '+1868', flag: '🇹🇹' },
  { name: 'Tunisia', code: '+216', flag: '🇹🇳' },
  { name: 'Turkey', code: '+90', flag: '🇹🇷' },
  { name: 'Turkmenistan', code: '+993', flag: '🇹🇲' },
  { name: 'Tuvalu', code: '+688', flag: '🇹🇻' },
  { name: 'Uganda', code: '+256', flag: '🇺🇬' },
  { name: 'Ukraine', code: '+380', flag: '🇺🇦' },
  { name: 'United Arab Emirates', code: '+971', flag: '🇦🇪' },
  { name: 'United Kingdom', code: '+44', flag: '🇬🇧' },
  { name: 'United States', code: '+1', flag: '🇺🇸' },
  { name: 'Uruguay', code: '+598', flag: '🇺🇾' },
  { name: 'Uzbekistan', code: '+998', flag: '🇺🇿' },
  { name: 'Vanuatu', code: '+678', flag: '🇻🇺' },
  { name: 'Vatican City', code: '+379', flag: '🇻🇦' },
  { name: 'Venezuela', code: '+58', flag: '🇻🇪' },
  { name: 'Vietnam', code: '+84', flag: '🇻🇳' },
  { name: 'Yemen', code: '+967', flag: '🇾🇪' },
  { name: 'Zambia', code: '+260', flag: '🇿🇲' },
  { name: 'Zimbabwe', code: '+263', flag: '🇿🇼' },
]

const EMOJI_CATS: Record<string, string[]> = {
  Faces: ['😂','❤️','😍','🔥','😭','😎','🥰','😅','👏','😉','💯','😁','🤣','😘','😊','🙂','😋','🤔','😴'],
  Hands: ['👍','🙏','👏','✌️','🤞','👌','🤲','🖐️','👋','💪','🫶','👊'],
  People: ['😀','😃','😄','😁','😆','😅','😂','🤣','😊','😇','🙂','🙃','😉','😌','😍','🥰'],
  Animals: ['🐶','🐱','🦁','🐯','🐵','🐷','🐥','🦋','🐢','🦄','🐝','🦊'],
}
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
        {ring && <path d={P} fill="none" strokeWidth={o.ring === 'new' ? 4.5 : 3} stroke={o.ring === 'new' ? `url(#rg${n})` : '#7a5560'} opacity={o.ring === 'seen' ? .55 : 1} style={o.ring === 'new' ? { filter: 'drop-shadow(0 0 5px #ff2f6d) drop-shadow(0 0 10px #8a2be2)' } : {}} />}
        <g transform={T}>
          <g clipPath={`url(#c${n})`}>
            {type === 'photo' && src && <image href={src} x={0} y={0} width={100} height={210} preserveAspectRatio="xMidYMid slice" />}
            {type === 'live' && src && (
              <foreignObject x="0" y="0" width="100" height="210"><video ref={videoRef} muted={muted} playsInline autoPlay src={src} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} /></foreignObject>
            )}
            {type === 'none' && <rect x="0" y="0" width="100" height="210" fill="#1a1f4a" />}
          </g>
          <path d={P} fill={`url(#gl${n})`} stroke="rgba(255,255,255,.55)" strokeWidth="1.4" />
          <path d="M24,125 C20,100 36,64 47,32 C36,70 31,100 33,130 Z" fill="#fff" opacity=".32" />
          <path d="M22,160 C28,190 48,200 70,196" fill="none" stroke="#bfe0ff" strokeWidth="2" opacity=".45" strokeLinecap="round" />
          <path d="M78,120 C84,140 82,160 74,176" fill="none" stroke="#fff" strokeWidth="1.6" opacity=".25" strokeLinecap="round" />
        </g>
      </svg>
    </span>
  )
}

export default function ChatPage() {
  const [myPhone, setMyPhone] = useState('')
  const [isVerified, setIsVerified] = useState(false)
  const [phoneInput, setPhoneInput] = useState('')
  const [otpInput, setOtpInput] = useState('')
  const [codeSent, setCodeSent] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [sending, setSending] = useState(false)
  const [selectedCountry, setSelectedCountry] = useState(COUNTRIES.find(c => c.name === 'Nigeria') || COUNTRIES[0])
  const [showCountryPicker, setShowCountryPicker] = useState(false)
  const [countrySearch, setCountrySearch] = useState('')
  const [me, setMe] = useState<Me>({ type: 'none' })
  const [chats, setChats] = useState<Chat[]>(INITIAL_CHATS)
  const [tab, setTab] = useState<'chat' | 'check' | 'call'>('chat')
  const [overlay, setOverlay] = useState<string | null>(null)
  const [openChat, setOpenChat] = useState<Chat | null>(null)
  const [openSelf, setOpenSelf] = useState(false)
  const [selfMsgs, setSelfMsgs] = useState<Msg[]>([{ text: 'This is your space. Save notes, links, code, anything here.', time: '11:38', kind: 'text' }])
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

  const showToast = (t: string) => { setToast(t); setTimeout(() => setToast(''), 2200) }
  const close = () => { setOverlay(null); setShowPlusMenu(false) }
  const setLive = (src: string, start: number) => { setMe({ type: 'live', src, start }); close(); setTab('chat'); setFullView(null); showToast('Live sticker set ✔') }
  const nowTime = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  const formatPhone = (raw: string) => {
    let p = raw.replace(/\D/g, '')
    if (p.startsWith('0')) p = p.slice(1)
    return selectedCountry.code + p
  }

  const filteredCountries = COUNTRIES.filter(c =>
    c.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
    c.code.includes(countrySearch)
  )

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
    try {
      recaptchaRef.current = new RecaptchaVerifier(auth, recaptchaDivRef.current, { size: 'invisible' })
      recaptchaReady.current = true
    } catch {}
  }, [isVerified])

  useEffect(() => {
    const saved = localStorage.getItem('eva-my-phone')
    const verified = localStorage.getItem('eva-phone-verified')
    if (saved && verified === 'true') { setMyPhone(saved); setIsVerified(true) }
    try {
      const s = localStorage.getItem('eva-self-msgs'); if (s) setSelfMsgs(JSON.parse(s))
      const c = localStorage.getItem('eva-chat-msgs'); if (c) setChatMsgs(JSON.parse(c))
      const m = localStorage.getItem('eva-me-droplet'); if (m) setMe(JSON.parse(m))
    } catch {}
  }, [])
  useEffect(() => { try { localStorage.setItem('eva-self-msgs', JSON.stringify(selfMsgs)) } catch {} }, [selfMsgs])
  useEffect(() => { try { localStorage.setItem('eva-chat-msgs', JSON.stringify(chatMsgs)) } catch {} }, [chatMsgs])
  useEffect(() => { try { localStorage.setItem('eva-me-droplet', JSON.stringify(me)) } catch {} }, [me])
  useEffect(() => { msgsEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [selfMsgs, chatMsgs, openChat, openSelf])

  const sendCode = async () => {
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
      console.log('Firebase send error:', e)
      if (e.code === 'auth/invalid-phone-number') showToast('Invalid number for that country')
      else if (e.code === 'auth/too-many-requests') showToast('Too many tries. Wait 1 min')
      else if (e.code === 'auth/quota-exceeded') showToast('Daily SMS limit reached. Try tomorrow or upgrade Firebase Blaze')
      else if ((e.message || '').includes('already been rendered')) showToast('Reload page once and try again')
      else showToast(e.message || 'Could not send code. Check Firebase Phone Auth is enabled')
    } finally {
      setSending(false)
    }
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
      setMyPhone(phone)
      setIsVerified(true)
      showToast('Number verified ✔ Welcome to EVA Chat')
    } catch (e: any) {
      console.log('Firebase verify error:', e)
      if (e.code === 'auth/invalid-verification-code') showToast('Wrong code, try again')
      else if (e.code === 'auth/code-expired') showToast('Code expired, resend code')
      else showToast('Wrong code')
    } finally {
      setVerifying(false)
    }
  }
      useEffect(() => {
    const v = fullVideoRef.current; if (!v || !fullView || fullView.type !== 'live') return
    let raf = 0; const start = fullView.start || 0
    const go = () => {
      if (!v.isConnected) return
      const end = Math.min(start + 7, v.duration || start + 7)
      if (v.currentTime >= end - 0.04 || v.currentTime < start - 0.1) v.currentTime = start
      if (v.paused) v.play().catch(() => {})
      raf = requestAnimationFrame(go)
    }
    const onMeta = () => { v.currentTime = start }
    v.addEventListener('loadedmetadata', onMeta); raf = requestAnimationFrame(go)
    return () => { cancelAnimationFrame(raf); v.removeEventListener('loadedmetadata', onMeta) }
  }, [fullView])
  useEffect(() => { if (fullVideoRef.current) fullVideoRef.current.muted = fullMuted }, [fullMuted, fullView])
  useEffect(() => { if (searching) setTimeout(() => searchInputRef.current?.focus(), 50) }, [searching])

  const openFull = (obj: any) => { setFullView(obj); setFullMuted(true); setShowPlusMenu(false); setOverlay(null) }
  const closeFull = () => { setFullView(null); setFullMuted(true); setShowPlusMenu(false) }
  const closeSearch = () => { setSearching(false); setSearchText(''); setSearchFilter('all') }
  const sendSelf = () => { const t = selfInput.trim(); if (!t) return; setSelfMsgs(prev => [...prev, { text: t, time: nowTime(), kind: 'text' }]); setSelfInput(''); setShowEmoji(false); setShowAttach(false) }
  const sendChat = () => {
    const t = chatInput.trim(); if (!t || !openChat) return
    setChatMsgs(prev => ({ ...prev, [openChat.name]: [...(prev[openChat.name] || []), { text: t, time: nowTime(), kind: 'text' }] }))
    setChats(prev => prev.map(c => c.name === openChat.name ? { ...c, msg: t, time: nowTime() } : c))
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
        if (isSelf) setSelfMsgs(prev => [...prev, msg])
        else if (openChat) setChatMsgs(prev => ({ ...prev, [openChat.name]: [...(prev[openChat.name] || []), msg] }))
        stream.getTracks().forEach(t => t.stop()); showToast('Voice note sent 🎤')
      }
      mr.start(); voiceRecorderRef.current = mr; setIsRecordingVoice(true); showToast('Recording... tap mic again to stop')
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

  const isMeFull = fullView && fullView.isMe
  const q = searchText.trim().toLowerCase()
  const filteredChats = chats.filter(c => {
    if (searchFilter === 'unread' && c.ring !== 'new') return false
    if (searchFilter === 'photo' && c.type !== 'photo') return false
    if (searchFilter === 'live' && c.type !== 'live') return false
    if (!q) return true
    return c.name.toLowerCase().includes(q) || c.msg.toLowerCase().includes(q) || c.time.toLowerCase().includes(q)
  })
  const showYouRow = !searching || !q || 'you'.includes(q) || 'my profile'.includes(q)
  const selfLast = selfMsgs[selfMsgs.length - 1]
  const currentChatMsgs = openChat ? (chatMsgs[openChat.name] || []) : []
  const filteredEmojis = EMOJI_CATS[emojiCat].filter(e => !emojiSearch || e.includes(emojiSearch))

  const ChatBar = ({ value, onChange, onSend, isSelf }: { value: string; onChange: (v: string) => void; onSend: () => void; isSelf: boolean }) => (
    <div style={{ background: '#0b0e24', padding: '8px 10px', paddingBottom: 'calc(env(safe-area-inset-bottom) + 12px)' }}>
      {showEmoji && (
        <div style={{ background: '#1a1f4a', borderRadius: 16, padding: 10, marginBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#0e1230', borderRadius: 20, padding: '8px 12px', marginBottom: 8 }}>
            <span>🔍</span><input value={emojiSearch} onChange={e => setEmojiSearch(e.target.value)} placeholder="Search emoji..." style={{ flex: 1, background: 'transparent', border: 0, outline: 'none', color: '#fff', fontSize: 14 }} />
          </div>
          <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 6 }}>
            {Object.keys(EMOJI_CATS).map(cat => <button key={cat} onClick={() => setEmojiCat(cat as any)} style={{ background: emojiCat === cat ? '#ff2f6d' : '#2a2f5c', border: 0, color: '#fff', borderRadius: 16, padding: '6px 12px', fontSize: 12, whiteSpace: 'nowrap' }}>{cat}</button>)}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8,1fr)', gap: 4, maxHeight: 160, overflowY: 'auto' }}>
            {filteredEmojis.map(em => <button key={em} onClick={() => addEmoji(em, isSelf)} style={{ background: 'none', border: 0, fontSize: 26, cursor: 'pointer', padding: 4 }}>{em}</button>)}
          </div>
        </div>
      )}
      {showAttach && (
        <div style={{ background: '#1a1f4a', borderRadius: 16, padding: 12, marginBottom: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
            <button onClick={() => galleryRef.current?.click()} style={{ flex: 1, background: '#0e1230', border: 0, color: '#fff', borderRadius: 12, padding: 12, fontSize: 13 }}>🖼️<br/>Gallery</button>
            <button onClick={() => { setShowAttach(false); startRecord() }} style={{ flex: 1, background: '#0e1230', border: 0, color: '#fff', borderRadius: 12, padding: 12, fontSize: 13 }}>📷<br/>Camera</button>
            <button onClick={() => docRef.current?.click()} style={{ flex: 1, background: '#0e1230', border: 0, color: '#fff', borderRadius: 12, padding: 12, fontSize: 13 }}>📄<br/>Document</button>
            <button onClick={() => { setShowAttach(false); showToast('Scan opened') }} style={{ flex: 1, background: '#0e1230', border: 0, color: '#fff', borderRadius: 12, padding: 12, fontSize: 13 }}>📠<br/>Scan</button>
          </div>
          <button onClick={() => setShowAttach(false)} style={{ width: '100%', background: '#2a2f5c', border: 0, color: '#fff', borderRadius: 10, padding: 10, marginTop: 8 }}>Close</button>
        </div>
      )}
      {isRecordingVoice && <div style={{ textAlign: 'center', color: '#ff3b6b', fontSize: 13, paddingBottom: 6 }}>● Recording voice... tap mic again to stop</div>}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button onClick={() => { setShowEmoji(!showEmoji); setShowAttach(false) }} style={{ background: 'none', border: 0, fontSize: 26, cursor: 'pointer', flexShrink: 0, lineHeight: 1 }}>😊</button>
        <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', background: '#171c46', borderRadius: 26, paddingRight: 4 }}>
          <input placeholder={isSelf ? 'Message yourself...' : 'Message...'} value={value} onChange={e => onChange(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') onSend() }} style={{ flex: 1, minWidth: 0, background: 'transparent', border: 0, outline: 'none', color: '#fff', fontSize: 15, padding: '12px 12px 12px 14px' }} />
          <button onClick={() => { setShowAttach(!showAttach); setShowEmoji(false) }} style={{ background: 'none', border: 0, cursor: 'pointer', flexShrink: 0, padding: 0, lineHeight: 0 }} title="Attach"><Droplet o={{ ...me, ring: 'none' }} w={24} /></button>
        </div>
        {value.trim() ? <button onClick={onSend} style={{ width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(90deg,#ff2f6d,#8a2be2)', border: 0, color: '#fff', fontSize: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>➤</button>
        : <button onClick={() => toggleVoice(isSelf)} style={{ width: 44, height: 44, borderRadius: '50%', background: isRecordingVoice ? '#ff2f6d' : '#00c853', border: 0, fontSize: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>🎤</button>}
      </div>
    </div>
  )
  const renderMsgs = (msgs: Msg[]) => (<>{msgs.map((m, i) => (<div key={i} className="b out">{m.kind === 'voice' && m.audioUrl ? <audio controls src={m.audioUrl} style={{ width: '100%' }} /> : m.text}<small>{m.time} ✓✓</small></div>))}<div ref={msgsEndRef} /></>)
    if (!isVerified) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', background: '#050520', color: '#fff', fontFamily: 'system-ui,Arial', padding: 20, justifyContent: 'center' }}>
        <div ref={recaptchaDivRef} />
        <div style={{ textAlign: 'center', marginBottom: 24 }}><div style={{ fontSize: 48 }}>💬</div></div>
        {!codeSent ? (
          <>
            <label style={{ fontSize: 13, color: '#8a8fb0' }}>Your phone number</label>
            <div style={{ display: 'flex', gap: 0, marginTop: 8, background: '#171c46', borderRadius: 14, alignItems: 'center', overflow: 'hidden', position: 'relative' }}>
              <button onClick={() => setShowCountryPicker(!showCountryPicker)} style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'transparent', border: 0, color: '#fff', padding: '14px 10px 14px 14px', fontSize: 16, cursor: 'pointer', whiteSpace: 'nowrap', borderRight: '1px solid rgba(255,255,255,0.1)' }}>
                <span>{selectedCountry.flag}</span>
                <span>{selectedCountry.code}</span>
                <span style={{ fontSize: 10, opacity: 0.6 }}>▼</span>
              </button>
              <input value={phoneInput} onChange={e => setPhoneInput(e.target.value.replace(/[^0-9]/g, ''))} placeholder="803 123 4567" inputMode="tel" style={{ flex: 1, background: 'transparent', border: 0, outline: 'none', color: '#fff', fontSize: 16, padding: '12px 8px', minWidth: 0 }} />
            </div>
            {showCountryPicker && (
              <div style={{ marginTop: 8, background: '#1a1f4a', borderRadius: 14, overflow: 'hidden', maxHeight: 320, display: 'flex', flexDirection: 'column' }}>
                <input value={countrySearch} onChange={e => setCountrySearch(e.target.value)} placeholder="Search country" style={{ background: '#0e1230', border: 0, outline: 'none', color: '#fff', padding: '12px 14px', fontSize: 14 }} />
                <div style={{ overflowY: 'auto', flex: 1 }}>
                  {filteredCountries.map((c) => (
                    <button key={c.name + c.code} onClick={() => { setSelectedCountry(c); setShowCountryPicker(false); setCountrySearch('') }} style={{ display: 'flex', justifyContent: 'space-between', width: '100%', background: 'transparent', border: 0, color: '#fff', padding: '12px 14px', textAlign: 'left', cursor: 'pointer', fontSize: 15 }}>
                      <span>{c.flag} {c.name}</span>
                      <span style={{ color: '#8a8fb0' }}>{c.code}</span>
                    </button>
                  ))}
                  {filteredCountries.length === 0 && <div style={{ padding: 14, color: '#8a8fb0', fontSize: 14 }}>No country found</div>}
                </div>
              </div>
            )}
            <button onClick={sendCode} disabled={sending} style={{ marginTop: 16, background: 'linear-gradient(90deg,#ff2f6d,#8a2be2)', border: 0, color: '#fff', padding: 15, borderRadius: 14, fontSize: 16, fontWeight: 700, opacity: sending ? 0.6 : 1 }}>{sending ? 'Sending...' : 'Send Code'}</button>
          </>
        ) : (
          <>
            <p style={{ textAlign: 'center', color: '#8a8fb0', fontSize: 14 }}>We sent a code to<br/><b style={{ color: '#fff' }}>{myPhone}</b></p>
            <input value={otpInput} onChange={e => setOtpInput(e.target.value.replace(/[^0-9]/g, ''))} placeholder="Enter 6-digit code" inputMode="numeric" maxLength={6} style={{ marginTop: 16, background: '#171c46', border: 0, outline: 'none', color: '#fff', fontSize: 20, padding: 16, borderRadius: 14, textAlign: 'center', letterSpacing: 6 }} />
            <button onClick={verifyCode} disabled={verifying} style={{ marginTop: 16, background: 'linear-gradient(90deg,#ff2f6d,#8a2be2)', border: 0, color: '#fff', padding: 15, borderRadius: 14, fontSize: 16, fontWeight: 700, opacity: verifying ? 0.6 : 1 }}>{verifying ? 'Verifying...' : 'Verify Number'}</button>
            <button onClick={() => { setCodeSent(false); setOtpInput('') }} style={{ marginTop: 10, background: 'none', border: 0, color: '#8a8fb0', padding: 10 }}>Change number</button>
          </>
        )}
        {toast && <div id="toast">{toast}</div>}
      </div>
    )
  }

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
        .plusMenu{background:#0e1230;border:1px solid #23284f;border-radius:16px;padding:10px;width:210px;box-shadow:0 10px 30px rgba(0,0,0,.5)}
        .plusMenu button{display:block;width:100%;background:#171c46;border:0;color:#fff;padding:12px;border-radius:10px;font-size:15px;margin-bottom:8px;text-align:left}
        .sideBtn{background:#171c46;border:1px solid #2a2f5c;color:#fff;border-radius:20px;padding:7px 11px;font-size:12px;cursor:pointer;white-space:nowrap}
        .waSearchBar{display:flex;align-items:center;gap:10px;background:#1a1f4a;border-radius:22px;padding:11px 14px;color:#8a8fb0;font-size:15px;cursor:text}
        .waChip{background:#1a1f4a;border:1px solid #2a2f5c;color:#cfd3ff;border-radius:20px;padding:7px 12px;font-size:13px;white-space:nowrap;cursor:pointer}
        .waChip.on{background:#ff2f6d;border-color:#ff2f6d;color:#fff}
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 0, background: '#1a1f4a', borderRadius: 22, padding: '6px 6px 6px 2px' }}>
            <button onClick={closeSearch} style={{ background: 'none', border: 0, color: '#fff', fontSize: 22, padding: '6px 8px', cursor: 'pointer' }}>←</button>
            <input ref={searchInputRef} value={searchText} onChange={e => setSearchText(e.target.value)} placeholder="Search" style={{ flex: 1, background: 'none', border: 0, outline: 'none', color: '#fff', fontSize: 15, padding: '6px 6px 6px 0' }} />
          </div>
        </header>
      )}
      <main id="screen" style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        {openSelf ? (
          <>
            <div className="chathead"><button className="back" onClick={() => setOpenSelf(false)}>←</button><Droplet o={{ ...me, ring: 'none' }} w={36} onClick={() => openFull({ ...me, name: 'You', isMe: true })} /><div><b>You</b><div style={{ fontSize: 12, color: '#8a8fb0' }}>Message yourself • {myPhone}</div></div></div>
            <div className="msgs">{renderMsgs(selfMsgs)}</div>
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
            {filteredChats.length === 0 && <div style={{ textAlign: 'center', padding: '40px 20px', color: '#8a8fb0' }}><div style={{ fontSize: 40 }}>💬</div><b style={{ color: '#fff' }}>No chats yet</b><div style={{ fontSize: 13, marginTop: 6 }}>Next step: + Add real contact by number</div></div>}
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
        </nav>
      )}
      {fullView && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.65)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={closeFull}>
          <div style={{ width: 340, maxWidth: '100%', height: 410, maxHeight: '88dvh', background: '#0e1230', border: '1px solid #23284f', borderRadius: 22, position: 'relative', textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,.6)', overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
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
