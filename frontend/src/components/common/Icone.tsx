import {
  ArrowUp, ArrowDown, ArrowRight, ArrowLeft, ArrowUpRight, ArrowDownRight,
  Plus, Minus, X, Check, ChevronRight, ChevronLeft, ChevronUp, ChevronDown,
  Inbox, AlertTriangle, Info, AlertCircle, CheckCircle2, XCircle,
  Search, Filter, RefreshCw, Settings, Bell, User, LogOut, LogIn, UserPlus,
  Wallet, Tags, Target, Heart, Calculator, LayoutDashboard, ChartLine, BarChart3, PieChart,
  Home, Calendar, Clock, Mail, Lock, Eye, EyeOff, Edit2, Edit3, Trash2,
  Save, Share2, Download, Upload, Copy, ExternalLink, Link as LinkIcon,
  Sun, Moon, Star, Bookmark, MoreHorizontal, MoreVertical,
  Car, Building2, Banknote, CreditCard, Coins, DollarSign, CircleDollarSign, TrendingUp, TrendingDown,
  File, FileText, Folder, Image, Camera, Paperclip,
  ShoppingCart, ShoppingBag, Gift, Receipt, PiggyBank,
  Phone, MessageSquare, Send, Globe, MapPin, Briefcase,
  Loader2, HelpCircle, Menu as MenuIcon, Grid3x3, List, Maximize2, Minimize2,
  PowerOff, Play, Pause, RotateCw, RotateCcw,
  Users, UserCheck, UserX, Shield, Key, Unlock,
  Zap, Sparkles, Award, Crown,
  ThumbsUp, ThumbsDown,
  Sigma, Percent, Hash, AtSign,
} from 'lucide-react'
import type { LucideIcon, LucideProps } from 'lucide-react'

/**
 * Mapeamento de nomes pi-* (PrimeIcons) para Lucide Icons.
 * Permite migrar progressivamente sem quebrar componentes que ainda
 * passam strings "pi-foo" como prop.
 */
const PI_TO_LUCIDE: Record<string, LucideIcon> = {
  // Setas
  'arrow-up': ArrowUp,
  'arrow-down': ArrowDown,
  'arrow-right': ArrowRight,
  'arrow-left': ArrowLeft,
  'arrow-up-right': ArrowUpRight,
  'arrow-down-right': ArrowDownRight,

  // Chevrons
  'chevron-right': ChevronRight,
  'chevron-left': ChevronLeft,
  'chevron-up': ChevronUp,
  'chevron-down': ChevronDown,
  'angle-right': ChevronRight,
  'angle-left': ChevronLeft,
  'angle-up': ChevronUp,
  'angle-down': ChevronDown,

  // Operações
  'plus': Plus,
  'minus': Minus,
  'times': X,
  'check': Check,
  'check-circle': CheckCircle2,
  'times-circle': XCircle,
  'ban': XCircle,

  // Estado
  'info-circle': Info,
  'info': Info,
  'exclamation-triangle': AlertTriangle,
  'exclamation-circle': AlertCircle,
  'question-circle': HelpCircle,

  // Ações comuns
  'search': Search,
  'filter': Filter,
  'refresh': RefreshCw,
  'sync': RefreshCw,
  'cog': Settings,
  'bell': Bell,
  'inbox': Inbox,

  // Usuário / Conta
  'user': User,
  'user-plus': UserPlus,
  'user-edit': UserCheck,
  'user-minus': UserX,
  'users': Users,
  'sign-out': LogOut,
  'sign-in': LogIn,
  'lock': Lock,
  'unlock': Unlock,
  'key': Key,
  'shield': Shield,
  'eye': Eye,
  'eye-slash': EyeOff,

  // Navegação principal
  'home': Home,
  'th-large': LayoutDashboard,
  'wallet': Wallet,
  'money-bill': Banknote,
  'dollar': DollarSign,
  'credit-card': CreditCard,
  'tag': Tags,
  'tags': Tags,
  'flag': Target,
  'heart': Heart,
  'heart-fill': Heart,
  'calculator': Calculator,
  'chart-line': ChartLine,
  'chart-bar': BarChart3,
  'chart-pie': PieChart,

  // Tempo
  'calendar': Calendar,
  'calendar-plus': Calendar,
  'calendar-minus': Calendar,
  'clock': Clock,
  'history': RotateCcw,

  // Edição
  'pencil': Edit2,
  'edit': Edit3,
  'save': Save,
  'trash': Trash2,
  'copy': Copy,
  'share-alt': Share2,
  'send': Send,
  'envelope': Mail,
  'comment': MessageSquare,
  'comments': MessageSquare,
  'paperclip': Paperclip,

  // Arquivos
  'file': File,
  'file-edit': FileText,
  'folder': Folder,
  'image': Image,
  'camera': Camera,
  'download': Download,
  'upload': Upload,
  'external-link': ExternalLink,
  'link': LinkIcon,

  // Financeiro
  'shopping-cart': ShoppingCart,
  'shopping-bag': ShoppingBag,
  'gift': Gift,
  'receipt': Receipt,
  'piggy-bank': PiggyBank,
  'building': Building2,
  'car': Car,
  'briefcase': Briefcase,
  'globe': Globe,
  'phone': Phone,
  'map-marker': MapPin,

  // Tema / UI
  'sun': Sun,
  'moon': Moon,
  'star': Star,
  'star-fill': Star,
  'bookmark': Bookmark,
  'bars': MenuIcon,
  'th': Grid3x3,
  'list': List,
  'expand': Maximize2,
  'window-minimize': Minimize2,
  'ellipsis-h': MoreHorizontal,
  'ellipsis-v': MoreVertical,

  // Estado de loading
  'spinner': Loader2,
  'spin': Loader2,

  // Reações
  'thumbs-up': ThumbsUp,
  'thumbs-down': ThumbsDown,

  // Tendência
  'arrow-up-circle': TrendingUp,
  'arrow-down-circle': TrendingDown,

  // Conquistas
  'star-half': Award,
  'crown': Crown,

  // Especiais
  'sparkles': Sparkles,
  'bolt': Zap,
  'power-off': PowerOff,
  'play': Play,
  'pause': Pause,
  'undo': RotateCcw,
  'redo': RotateCw,

  // Símbolos
  'percentage': Percent,
  'hashtag': Hash,
  'at': AtSign,
  'sigma': Sigma,
  'coins': Coins,
  'circle-dollar': CircleDollarSign,
}

export interface IconProps extends Omit<LucideProps, 'ref' | 'name'> {
  /** Nome do ícone: aceita "pi-foo", "foo" ou um componente Lucide */
  name: string | LucideIcon
}

/**
 * Icon — wrapper compatível com nomes pi-* (PrimeIcons) que renderiza
 * o equivalente em Lucide quando disponível. Mantém fallback visual
 * (i.pi.pi-*) caso o nome não esteja mapeado.
 */
const Icon = ({ name, size = 18, strokeWidth = 1.75, className, ...rest }: IconProps) => {
  // Se já é um componente Lucide, renderiza direto
  if (typeof name !== 'string') {
    const LucideComp = name
    return <LucideComp size={size} strokeWidth={strokeWidth} className={className} {...rest} />
  }

  // Normaliza: remove prefixos "pi pi-" / "pi-" e espaços
  const clean = name.replace(/^pi\s+pi-/, '').replace(/^pi-/, '').trim()
  const LucideComp = PI_TO_LUCIDE[clean]

  if (LucideComp) {
    return <LucideComp size={size} strokeWidth={strokeWidth} className={className} {...rest} />
  }

  // Fallback: renderiza PrimeIcons original
  return <i className={`pi pi-${clean} ${className || ''}`.trim()} />
}

export default Icon
