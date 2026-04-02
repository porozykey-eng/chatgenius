import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Key, DollarSign, TrendingUp, Copy, Check,
  Trash2, Download, Search, RefreshCw,
  Lock, LogOut, BarChart3, Package,
  AlertCircle, CheckCircle
} from 'lucide-react'

// ==================== Types ====================
interface LicenseKey {
  id: string
  code: string
  type: 'year' | 'lifetime'
  price: number
  status: 'unused' | 'used' | 'expired'
  createdAt: string
  usedAt?: string
  usedBy?: string
  orderId?: string
}

interface Order {
  id: string
  licenseKey: string
  type: 'year' | 'lifetime'
  price: number
  status: 'completed' | 'pending' | 'refunded'
  channel?: 'alipay' | 'wechat' | 'paypal'
  createdAt: string
  customerEmail?: string
}

interface AdminStats {
  totalRevenue: number
  totalOrders: number
  totalKeys: number
  usedKeys: number
  yearRevenue: number
  lifetimeRevenue: number
  alipayRevenue: number
  wechatRevenue: number
  paypalRevenue: number
}

// ==================== Storage Helper ====================
const STORAGE_KEYS = {
  LICENSES: 'chatgenius_licenses',
  ORDERS: 'chatgenius_orders',
  AUTH: 'chatgenius_admin_auth'
}

const DEFAULT_ADMIN_KEY = 'CG-ADMIN-2024'

function getStorage<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key)
    return item ? JSON.parse(item) : defaultValue
  } catch {
    return defaultValue
  }
}

function setStorage<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value))
}

// ==================== License Generator ====================
function generateLicenseKey(type: 'year' | 'lifetime'): string {
  const prefix = type === 'year' ? 'YEAR' : 'PRO'
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return `${prefix}-${code}`
}

// ==================== Login Screen ====================
function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const [key, setKey] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = () => {
    setLoading(true)
    setTimeout(() => {
      if (key === DEFAULT_ADMIN_KEY) {
        setStorage(STORAGE_KEYS.AUTH, true)
        onLogin()
      } else {
        setError('管理密钥错误')
      }
      setLoading(false)
    }, 500)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/10 shadow-2xl">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Lock className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">管理后台</h1>
            <p className="text-white/50 text-sm">ChatGenius AI Admin Panel</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm text-white/60 mb-2 block">管理密钥</label>
              <input
                type="password"
                value={key}
                onChange={(e) => {
                  setKey(e.target.value.toUpperCase())
                  setError('')
                }}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                placeholder="请输入管理密钥"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-violet-500 transition-colors"
              />
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 text-red-400 text-sm"
              >
                <AlertCircle className="w-4 h-4" />
                {error}
              </motion.div>
            )}

            <button
              onClick={handleLogin}
              disabled={loading || !key}
              className="w-full py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <RefreshCw className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Lock className="w-5 h-5" />
                  进入后台
                </>
              )}
            </button>
          </div>

          <div className="mt-6 pt-6 border-t border-white/10 text-center">
            <p className="text-white/30 text-xs">默认密钥: {DEFAULT_ADMIN_KEY}</p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

// ==================== Dashboard Stats ====================
function StatsCards({ stats }: { stats: AdminStats }) {
  const cards = [
    { label: '总收入', value: `$${stats.totalRevenue.toFixed(2)}`, icon: DollarSign, color: 'from-green-500 to-emerald-500' },
    { label: '订单数', value: stats.totalOrders, icon: Package, color: 'from-blue-500 to-cyan-500' },
    { label: '激活码', value: stats.totalKeys, icon: Key, color: 'from-violet-500 to-purple-500' },
    { label: '已使用', value: stats.usedKeys, icon: CheckCircle, color: 'from-orange-500 to-amber-500' },
  ]

  const channelStats = [
    { label: '支付宝', value: `$${stats.alipayRevenue.toFixed(2)}`, color: 'bg-[#1677FF]' },
    { label: '微信支付', value: `$${stats.wechatRevenue.toFixed(2)}`, color: 'bg-[#07C160]' },
    { label: 'PayPal', value: `$${stats.paypalRevenue.toFixed(2)}`, color: 'bg-[#003087]' },
  ]

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white/5 backdrop-blur rounded-2xl p-5 border border-white/10"
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center`}>
                <card.icon className="w-5 h-5 text-white" />
              </div>
            </div>
            <div className="text-2xl font-bold text-white">{card.value}</div>
            <div className="text-sm text-white/50">{card.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Payment Channel Stats */}
      <div className="bg-white/5 backdrop-blur rounded-2xl p-5 border border-white/10">
        <h3 className="text-sm text-white/60 mb-4">支付渠道收入</h3>
        <div className="grid grid-cols-3 gap-4">
          {channelStats.map((stat, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${stat.color}`}></div>
              <div>
                <div className="text-lg font-bold text-white">{stat.value}</div>
                <div className="text-xs text-white/50">{stat.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ==================== Revenue Chart ====================
function RevenueChart({ orders }: { orders: Order[] }) {
  // Calculate daily revenue for last 7 days
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date()
    date.setDate(date.getDate() - (6 - i))
    return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
  })

  const dailyRevenue = last7Days.map((day) => {
    const dayOrders = orders.filter(o => {
      const orderDate = new Date(o.createdAt).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
      return orderDate === day && o.status === 'completed'
    })
    return dayOrders.reduce((sum, o) => sum + o.price, 0)
  })

  const maxRevenue = Math.max(...dailyRevenue, 1)

  return (
    <div className="bg-white/5 backdrop-blur rounded-2xl p-6 border border-white/10">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white">近7天收入</h3>
        <TrendingUp className="w-5 h-5 text-white/40" />
      </div>
      <div className="flex items-end justify-between gap-2 h-40">
        {dailyRevenue.map((revenue, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-2">
            <div className="w-full bg-white/5 rounded-lg relative overflow-hidden" style={{ height: '100%' }}>
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${(revenue / maxRevenue) * 100}%` }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                className="absolute bottom-0 w-full bg-gradient-to-t from-violet-600 to-purple-500 rounded-lg"
              />
            </div>
            <span className="text-xs text-white/40">{last7Days[i]}</span>
            <span className="text-xs text-white/60 font-medium">${revenue}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ==================== Key Generator ====================
function KeyGenerator({ onGenerate }: { onGenerate: (keys: LicenseKey[]) => void }) {
  const [type, setType] = useState<'year' | 'lifetime'>('lifetime')
  const [count, setCount] = useState(10)
  const [generated, setGenerated] = useState<LicenseKey[]>([])
  const [copied, setCopied] = useState(false)

  const handleGenerate = () => {
    const keys: LicenseKey[] = []
    for (let i = 0; i < count; i++) {
      keys.push({
        id: `key_${Date.now()}_${i}`,
        code: generateLicenseKey(type),
        type,
        price: type === 'year' ? 9.9 : 9.9,
        status: 'unused',
        createdAt: new Date().toISOString()
      })
    }
    setGenerated(keys)
    onGenerate(keys)
  }

  const copyAllKeys = () => {
    const text = generated.map(k => k.code).join('\n')
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="bg-white/5 backdrop-blur rounded-2xl p-6 border border-white/10">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white">生成激活码</h3>
        <Key className="w-5 h-5 text-white/40" />
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <label className="text-sm text-white/60 mb-2 block">类型</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as 'year' | 'lifetime')}
            className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-violet-500"
          >
            <option value="lifetime">永久版 ($9.9)</option>
            <option value="year">年付版 ($9.9)</option>
          </select>
        </div>
        <div>
          <label className="text-sm text-white/60 mb-2 block">数量</label>
          <input
            type="number"
            value={count}
            onChange={(e) => setCount(Math.max(1, Math.min(100, parseInt(e.target.value) || 1)))}
            className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-violet-500"
          />
        </div>
      </div>

      <button
        onClick={handleGenerate}
        className="w-full py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
      >
        <RefreshCw className="w-5 h-5" />
        生成 {count} 个激活码
      </button>

      {generated.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-white/60">已生成 {generated.length} 个</span>
            <button
              onClick={copyAllKeys}
              className="flex items-center gap-2 text-sm text-violet-400 hover:text-violet-300"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? '已复制' : '复制全部'}
            </button>
          </div>
          <div className="bg-white/5 rounded-xl p-4 max-h-40 overflow-y-auto space-y-1">
            {generated.map((key) => (
              <div key={key.id} className="flex items-center justify-between text-sm">
                <span className="text-white font-mono">{key.code}</span>
                <span className={`text-xs px-2 py-0.5 rounded ${key.type === 'lifetime' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-blue-500/20 text-blue-400'}`}>
                  {key.type === 'lifetime' ? '永久' : '月付'}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  )
}

// ==================== Keys List ====================
function KeysList({ keys, onDelete }: { keys: LicenseKey[]; onDelete: (id: string) => void }) {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'unused' | 'used'>('all')

  const filtered = keys.filter(k => {
    const matchSearch = k.code.toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'all' || k.status === filter
    return matchSearch && matchFilter
  })

  return (
    <div className="bg-white/5 backdrop-blur rounded-2xl p-6 border border-white/10">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white">激活码管理</h3>
        <span className="text-sm text-white/40">{keys.length} 个</span>
      </div>

      <div className="flex gap-3 mb-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索激活码..."
            className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-violet-500"
          />
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as 'all' | 'unused' | 'used')}
          className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-violet-500"
        >
          <option value="all">全部</option>
          <option value="unused">未使用</option>
          <option value="used">已使用</option>
        </select>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-left py-3 text-white/50 font-medium">激活码</th>
              <th className="text-left py-3 text-white/50 font-medium">类型</th>
              <th className="text-left py-3 text-white/50 font-medium">价格</th>
              <th className="text-left py-3 text-white/50 font-medium">状态</th>
              <th className="text-left py-3 text-white/50 font-medium">创建时间</th>
              <th className="text-right py-3 text-white/50 font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {filtered.slice(0, 20).map((key) => (
              <tr key={key.id} className="border-b border-white/5 hover:bg-white/5">
                <td className="py-3 font-mono text-white">{key.code}</td>
                <td className="py-3">
                  <span className={`px-2 py-0.5 rounded text-xs ${key.type === 'lifetime' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-blue-500/20 text-blue-400'}`}>
                    {key.type === 'lifetime' ? '永久' : '月付'}
                  </span>
                </td>
                <td className="py-3 text-white/60">${key.price}</td>
                <td className="py-3">
                  <span className={`flex items-center gap-1 ${key.status === 'unused' ? 'text-green-400' : key.status === 'used' ? 'text-blue-400' : 'text-red-400'}`}>
                    {key.status === 'unused' ? <CheckCircle className="w-4 h-4" /> : key.status === 'used' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                    {key.status === 'unused' ? '未使用' : key.status === 'used' ? '已使用' : '已过期'}
                  </span>
                </td>
                <td className="py-3 text-white/40">{new Date(key.createdAt).toLocaleDateString('zh-CN')}</td>
                <td className="py-3 text-right">
                  <button
                    onClick={() => onDelete(key.id)}
                    className="text-red-400 hover:text-red-300 p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length > 20 && (
          <div className="text-center py-4 text-white/40 text-sm">
            显示前 20 条，共 {filtered.length} 条
          </div>
        )}
        {filtered.length === 0 && (
          <div className="text-center py-8 text-white/40">
            暂无数据
          </div>
        )}
      </div>
    </div>
  )
}

// ==================== Orders List ====================
function OrdersList({ orders }: { orders: Order[] }) {
  const getChannelIcon = (channel?: 'alipay' | 'wechat' | 'paypal') => {
    if (!channel) return '-'
    const icons = {
      alipay: <span className="text-[#1677FF]">支付宝</span>,
      wechat: <span className="text-[#07C160]">微信</span>,
      paypal: <span className="text-[#003087]">PayPal</span>,
    }
    return icons[channel]
  }

  return (
    <div className="bg-white/5 backdrop-blur rounded-2xl p-6 border border-white/10">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white">订单记录</h3>
        <span className="text-sm text-white/40">{orders.length} 笔</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-left py-3 text-white/50 font-medium">订单ID</th>
              <th className="text-left py-3 text-white/50 font-medium">激活码</th>
              <th className="text-left py-3 text-white/50 font-medium">类型</th>
              <th className="text-left py-3 text-white/50 font-medium">金额</th>
              <th className="text-left py-3 text-white/50 font-medium">支付渠道</th>
              <th className="text-left py-3 text-white/50 font-medium">状态</th>
              <th className="text-left py-3 text-white/50 font-medium">时间</th>
            </tr>
          </thead>
          <tbody>
            {orders.slice(0, 20).map((order) => (
              <tr key={order.id} className="border-b border-white/5 hover:bg-white/5">
                <td className="py-3 font-mono text-white/60 text-xs">{order.id.slice(0, 12)}...</td>
                <td className="py-3 font-mono text-white">{order.licenseKey}</td>
                <td className="py-3">
                  <span className={`px-2 py-0.5 rounded text-xs ${order.type === 'lifetime' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-blue-500/20 text-blue-400'}`}>
                    {order.type === 'lifetime' ? '永久' : '年付'}
                  </span>
                </td>
                <td className="py-3 text-green-400 font-medium">${order.price}</td>
                <td className="py-3 text-xs font-medium">{getChannelIcon(order.channel)}</td>
                <td className="py-3">
                  <span className={`px-2 py-0.5 rounded text-xs ${order.status === 'completed' ? 'bg-green-500/20 text-green-400' : order.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'}`}>
                    {order.status === 'completed' ? '已完成' : order.status === 'pending' ? '待支付' : '已退款'}
                  </span>
                </td>
                <td className="py-3 text-white/40">{new Date(order.createdAt).toLocaleString('zh-CN')}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {orders.length === 0 && (
          <div className="text-center py-8 text-white/40">
            暂无订单
          </div>
        )}
      </div>
    </div>
  )
}

// ==================== Main Dashboard ====================
function Dashboard() {
  const [keys, setKeys] = useState<LicenseKey[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [activeTab, setActiveTab] = useState<'dashboard' | 'keys' | 'orders'>('dashboard')

  useEffect(() => {
    setKeys(getStorage(STORAGE_KEYS.LICENSES, []))
    setOrders(getStorage(STORAGE_KEYS.ORDERS, []))
  }, [])

  const stats: AdminStats = {
    totalRevenue: orders.filter(o => o.status === 'completed').reduce((s, o) => s + o.price, 0),
    totalOrders: orders.filter(o => o.status === 'completed').length,
    totalKeys: keys.length,
    usedKeys: keys.filter(k => k.status === 'used').length,
    yearRevenue: orders.filter(o => o.type === 'year' && o.status === 'completed').reduce((s, o) => s + o.price, 0),
    lifetimeRevenue: orders.filter(o => o.type === 'lifetime' && o.status === 'completed').reduce((s, o) => s + o.price, 0),
    alipayRevenue: orders.filter(o => o.channel === 'alipay' && o.status === 'completed').reduce((s, o) => s + o.price, 0),
    wechatRevenue: orders.filter(o => o.channel === 'wechat' && o.status === 'completed').reduce((s, o) => s + o.price, 0),
    paypalRevenue: orders.filter(o => o.channel === 'paypal' && o.status === 'completed').reduce((s, o) => s + o.price, 0),
  }

  const handleGenerateKeys = (newKeys: LicenseKey[]) => {
    const updated = [...newKeys, ...keys]
    setKeys(updated)
    setStorage(STORAGE_KEYS.LICENSES, updated)
  }

  const handleDeleteKey = (id: string) => {
    const updated = keys.filter(k => k.id !== id)
    setKeys(updated)
    setStorage(STORAGE_KEYS.LICENSES, updated)
  }

  // Simulate a new order (for demo)
  const simulateOrder = () => {
    const unusedKeys = keys.filter(k => k.status === 'unused')
    if (unusedKeys.length === 0) {
      alert('没有可用的激活码，请先生成')
      return
    }
    const key = unusedKeys[0]
    const channels: ('alipay' | 'wechat' | 'paypal')[] = ['alipay', 'wechat', 'paypal']
    const randomChannel = channels[Math.floor(Math.random() * channels.length)]
    const order: Order = {
      id: `order_${Date.now()}`,
      licenseKey: key.code,
      type: key.type,
      price: key.price,
      status: 'completed',
      channel: randomChannel,
      createdAt: new Date().toISOString(),
    }
    const updatedOrders = [order, ...orders]
    setOrders(updatedOrders)
    setStorage(STORAGE_KEYS.ORDERS, updatedOrders)

    // Mark key as used
    const updatedKeys = keys.map(k => k.id === key.id ? { ...k, status: 'used' as const, usedAt: new Date().toISOString() } : k)
    setKeys(updatedKeys)
    setStorage(STORAGE_KEYS.LICENSES, updatedKeys)
  }

  const handleLogout = () => {
    setStorage(STORAGE_KEYS.AUTH, false)
    window.location.reload()
  }

  const exportData = () => {
    const data = { keys, orders, exportDate: new Date().toISOString() }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `chatgenius-backup-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/20 backdrop-blur sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Key className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">ChatGenius Admin</h1>
              <p className="text-xs text-white/40">管理后台</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={exportData}
              className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-white/60 hover:text-white text-sm transition-colors"
            >
              <Download className="w-4 h-4" />
              导出数据
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-red-500/20 rounded-lg text-white/60 hover:text-red-400 text-sm transition-colors"
            >
              <LogOut className="w-4 h-4" />
              退出
            </button>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="container mx-auto px-6 py-4">
        <div className="flex gap-2">
          {[
            { id: 'dashboard', label: '概览', icon: BarChart3 },
            { id: 'keys', label: '激活码', icon: Key },
            { id: 'orders', label: '订单', icon: Package },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as 'dashboard' | 'keys' | 'orders')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-violet-600 text-white'
                  : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-6 pb-12">
        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <StatsCards stats={stats} />

              <div className="grid lg:grid-cols-2 gap-6">
                <RevenueChart orders={orders} />
                <KeyGenerator onGenerate={handleGenerateKeys} />
              </div>

              {/* Quick Actions */}
              <div className="bg-white/5 backdrop-blur rounded-2xl p-6 border border-white/10">
                <h3 className="text-lg font-semibold text-white mb-4">快速操作</h3>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={simulateOrder}
                    className="flex items-center gap-2 px-4 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg text-sm transition-colors"
                  >
                    <CheckCircle className="w-4 h-4" />
                    模拟订单（测试）
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'keys' && (
            <motion.div
              key="keys"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <KeyGenerator onGenerate={handleGenerateKeys} />
              <KeysList keys={keys} onDelete={handleDeleteKey} />
            </motion.div>
          )}

          {activeTab === 'orders' && (
            <motion.div
              key="orders"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <OrdersList orders={orders} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  )
}

// ==================== Main App ====================
function AdminApp() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)

  useEffect(() => {
    const auth = getStorage(STORAGE_KEYS.AUTH, false)
    setIsAuthenticated(auth)
  }, [])

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <RefreshCw className="w-8 h-8 text-violet-500 animate-spin" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <LoginScreen onLogin={() => setIsAuthenticated(true)} />
  }

  return <Dashboard />
}

export default AdminApp
