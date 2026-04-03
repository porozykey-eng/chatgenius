import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence, useScroll, useTransform, useInView } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { 
  MessageSquare, Zap, Users, Shield, Settings, Database,
  ChevronDown, Play, Download, Star, Check, ArrowRight,
  Twitter, Github, MessageCircle, Bot, Sparkles, ArrowUp,
  Globe, TrendingUp, Send,
  Crown, Rocket, Target, MessageCircleQuestion, Clock,
  ShieldCheck, Award, X, Key, CreditCard, AlertCircle, CheckCircle,
  Plane, HeadsetIcon, Handshake
} from 'lucide-react'

// ==================== Animation Variants ====================
const fadeInUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } }
}

const stagger = {
  visible: { transition: { staggerChildren: 0.15 } }
}

const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.6 } }
}

// ==================== Utility Components ====================

// Animated Counter
function AnimatedCounter({ end, duration = 2, suffix = '', prefix = '' }: { end: number; duration?: number; suffix?: string; prefix?: string }) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })
  
  useEffect(() => {
    if (!isInView) return
    
    let startTime: number
    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime
      const progress = Math.min((currentTime - startTime) / (duration * 1000), 1)
      setCount(Math.floor(progress * end))
      if (progress < 1) requestAnimationFrame(animate)
    }
    requestAnimationFrame(animate)
  }, [isInView, end, duration])
  
  return <span ref={ref} className="counter">{prefix}{count.toLocaleString()}{suffix}</span>
}

// Floating Element
const FloatElement = ({ children, delay = 0, duration = 6 }: { children: React.ReactNode; delay?: number; duration?: number }) => (
  <motion.div
    animate={{ y: [-15, 15, -15] }}
    transition={{ duration, repeat: Infinity, ease: "easeInOut", delay }}
  >
    {children}
  </motion.div>
)

// Back to Top Button
function BackToTop() {
  const [show, setShow] = useState(false)
  
  useEffect(() => {
    const handleScroll = () => setShow(window.scrollY > 400)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])
  
  return (
    <AnimatePresence>
      {show && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 20 }}
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-8 right-8 z-50 w-14 h-14 bg-gradient-to-br from-violet-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-glow-lg hover:shadow-glow transition-all group"
        >
          <ArrowUp className="w-6 h-6 text-white group-hover:-translate-y-1 transition-transform" />
        </motion.button>
      )}
    </AnimatePresence>
  )
}

// Countdown Timer - 每天重置到午夜 00:00:00
function CountdownTimer() {
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 })
  
  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date()
      const midnight = new Date()
      midnight.setHours(24, 0, 0, 0) // 下一个午夜
      
      const diff = midnight.getTime() - now.getTime()
      const hours = Math.floor(diff / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((diff % (1000 * 60)) / 1000)
      
      return { hours, minutes, seconds }
    }
    
    // 初始化
    setTimeLeft(calculateTimeLeft())
    
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft())
    }, 1000)
    
    return () => clearInterval(timer)
  }, [])
  
  return (
    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/10 border border-red-500/20">
      <span className="text-sm text-red-400 font-medium animate-pulse">限时优惠</span>
      <div className="flex items-center gap-1 text-white font-mono">
        <span className="bg-red-500/20 px-2 py-0.5 rounded text-sm">{String(timeLeft.hours).padStart(2, '0')}</span>
        <span className="text-red-400">:</span>
        <span className="bg-red-500/20 px-2 py-0.5 rounded text-sm">{String(timeLeft.minutes).padStart(2, '0')}</span>
        <span className="text-red-400">:</span>
        <span className="bg-red-500/20 px-2 py-0.5 rounded text-sm">{String(timeLeft.seconds).padStart(2, '0')}</span>
      </div>
    </div>
  )
}

// ==================== Payment Modal ====================
function PaymentModal({ 
  isOpen, 
  onClose, 
  plan 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  plan: { name: string; price: string; type: 'year' | 'lifetime' } | null 
}) {
  const [step, setStep] = useState<'select' | 'code' | 'payment' | 'qrcode' | 'success'>('select')
  const [activationCode, setActivationCode] = useState('')
  const [codeError, setCodeError] = useState('')
  const [loading, setLoading] = useState(false)
  const [paymentChannel, setPaymentChannel] = useState<'alipay' | 'wechat' | 'paypal' | null>(null)
  const [orderNo, setOrderNo] = useState('')

  // Generate order number
  const generateOrderNo = () => {
    const timestamp = Date.now().toString(36).toUpperCase()
    const random = Math.random().toString(36).substring(2, 6).toUpperCase()
    return `CG${timestamp}${random}`
  }

  // Check activation code
  const handleActivate = () => {
    if (!activationCode.trim()) {
      setCodeError('请输入激活码')
      return
    }
    
    setLoading(true)
    // Simulate API call
    setTimeout(() => {
      const validPrefixes = ['PRO-', 'YEAR-', 'FREE-']
      const isValid = validPrefixes.some(p => activationCode.toUpperCase().startsWith(p)) && activationCode.length >= 10
      
      if (isValid) {
        setStep('success')
        setCodeError('')
      } else {
        setCodeError('激活码无效或已使用')
      }
      setLoading(false)
    }, 1000)
  }

  // Handle payment channel selection
  const handlePayment = (channel: 'alipay' | 'wechat' | 'paypal') => {
    setPaymentChannel(channel)
    const newOrderNo = generateOrderNo()
    setOrderNo(newOrderNo)
    
    // Save order to localStorage for tracking
    const order = {
      orderNo: newOrderNo,
      plan: plan?.name,
      price: plan?.price,
      type: plan?.type,
      channel,
      status: 'pending',
      createdAt: new Date().toISOString()
    }
    const orders = JSON.parse(localStorage.getItem('chatgenius_orders') || '[]')
    orders.unshift(order)
    localStorage.setItem('chatgenius_orders', JSON.stringify(orders))

    // Open payment in new window
    if (channel === 'alipay') {
      // Alipay payment URL (replace with actual payment URL)
      const payUrl = `https://qr.alipay.com/bax00${newOrderNo.toLowerCase()}`
      window.open(payUrl, '_blank')
    } else if (channel === 'wechat') {
      // WeChat Pay URL (replace with actual payment URL)
      const payUrl = `weixin://wxpay/bizpayurl?pr=${newOrderNo.toLowerCase()}`
      window.open(payUrl, '_blank')
    } else if (channel === 'paypal') {
      // PayPal payment URL (replace with actual payment URL)
      const payUrl = `https://www.paypal.com/cgi-bin/webscr?cmd=_xclick&business=sales@chatgenius.ai&item_name=${encodeURIComponent(plan?.name || '')}&amount=${plan?.price?.replace('$', '')}`
      window.open(payUrl, '_blank')
    }

    setStep('qrcode')
  }

  // Simulate payment confirmation
  const confirmPayment = () => {
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      setActivationCode(paymentChannel === 'wechat' ? 'WX-' + Math.random().toString(36).substring(2, 10).toUpperCase() :
                        paymentChannel === 'alipay' ? 'ALI-' + Math.random().toString(36).substring(2, 10).toUpperCase() :
                        'PP-' + Math.random().toString(36).substring(2, 10).toUpperCase())
      setStep('success')
    }, 1000)
  }

  const resetModal = () => {
    setStep('select')
    setActivationCode('')
    setCodeError('')
    setPaymentChannel(null)
    setOrderNo('')
  }

  if (!plan) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl border border-white/10 shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="relative px-6 py-5 border-b border-white/10 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">
                  {step === 'success' ? '支付成功' : `升级 ${plan.name}`}
                </h2>
                <p className="text-sm text-white/50">
                  {step === 'success' ? '感谢您的支持' : `${plan.price}${plan.type === 'year' ? '/年' : ' 永久'}`}
                </p>
              </div>
              <button
                onClick={() => { resetModal(); onClose() }}
                className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              {step === 'select' && (
                <div className="space-y-4">
                  <button
                    onClick={() => setStep('code')}
                    className="w-full p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-left transition-colors group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                        <Key className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="text-white font-semibold">我有激活码</div>
                        <div className="text-sm text-white/50">输入激活码直接升级</div>
                      </div>
                      <ArrowRight className="w-5 h-5 text-white/40 group-hover:text-white group-hover:translate-x-1 transition-all" />
                    </div>
                  </button>

                  <button
                    onClick={() => setStep('payment')}
                    className="w-full p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-left transition-colors group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                        <CreditCard className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="text-white font-semibold">在线购买</div>
                        <div className="text-sm text-white/50">支持支付宝、微信、PayPal</div>
                      </div>
                      <ArrowRight className="w-5 h-5 text-white/40 group-hover:text-white group-hover:translate-x-1 transition-all" />
                    </div>
                  </button>

                  <div className="pt-4 border-t border-white/10">
                    <p className="text-xs text-white/40 text-center">
                      购买后激活码将发送至您的邮箱
                    </p>
                  </div>
                </div>
              )}

              {step === 'code' && (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-white/60 mb-2 block">激活码</label>
                    <input
                      type="text"
                      value={activationCode}
                      onChange={(e) => {
                        setActivationCode(e.target.value.toUpperCase())
                        setCodeError('')
                      }}
                      placeholder="请输入激活码 (如: PRO-XXXXXXXX)"
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-violet-500 font-mono tracking-wider"
                    />
                    {codeError && (
                      <motion.div
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-2 mt-2 text-red-400 text-sm"
                      >
                        <AlertCircle className="w-4 h-4" />
                        {codeError}
                      </motion.div>
                    )}
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => setStep('select')}
                      className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-medium transition-colors"
                    >
                      返回
                    </button>
                    <button
                      onClick={handleActivate}
                      disabled={loading}
                      className="flex-1 py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                        >
                          <Sparkles className="w-5 h-5" />
                        </motion.div>
                      ) : '激活'}
                    </button>
                  </div>
                </div>
              )}

              {step === 'payment' && (
                <div className="space-y-4">
                  <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-white/60">方案</span>
                      <span className="text-white font-semibold">{plan.name}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-white/60">金额</span>
                      <span className="text-2xl font-bold text-gradient">{plan.price}</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <p className="text-sm text-white/60">选择支付方式</p>
                    <button
                      onClick={() => handlePayment('alipay')}
                      className="w-full p-4 bg-[#1677FF]/10 hover:bg-[#1677FF]/20 border border-[#1677FF]/30 rounded-xl text-left transition-colors flex items-center gap-4"
                    >
                      <div className="w-10 h-10 bg-[#1677FF] rounded-lg flex items-center justify-center">
                        <span className="text-white font-bold text-lg">支</span>
                      </div>
                      <div className="flex-1">
                        <div className="text-white font-semibold">支付宝</div>
                        <div className="text-xs text-white/50">推荐中国大陆用户使用</div>
                      </div>
                      <ArrowRight className="w-5 h-5 text-white/40" />
                    </button>
                    <button
                      onClick={() => handlePayment('wechat')}
                      className="w-full p-4 bg-[#07C160]/10 hover:bg-[#07C160]/20 border border-[#07C160]/30 rounded-xl text-left transition-colors flex items-center gap-4"
                    >
                      <div className="w-10 h-10 bg-[#07C160] rounded-lg flex items-center justify-center">
                        <span className="text-white font-bold text-lg">微</span>
                      </div>
                      <div className="flex-1">
                        <div className="text-white font-semibold">微信支付</div>
                        <div className="text-xs text-white/50">微信扫码支付</div>
                      </div>
                      <ArrowRight className="w-5 h-5 text-white/40" />
                    </button>
                    <button
                      onClick={() => handlePayment('paypal')}
                      className="w-full p-4 bg-[#003087]/10 hover:bg-[#003087]/20 border border-[#003087]/30 rounded-xl text-left transition-colors flex items-center gap-4"
                    >
                      <div className="w-10 h-10 bg-[#003087] rounded-lg flex items-center justify-center">
                        <span className="text-white font-bold text-lg">P</span>
                      </div>
                      <div className="flex-1">
                        <div className="text-white font-semibold">PayPal</div>
                        <div className="text-xs text-white/50">国际信用卡支付</div>
                      </div>
                      <ArrowRight className="w-5 h-5 text-white/40" />
                    </button>
                  </div>

                  <button
                    onClick={() => setStep('select')}
                    className="w-full py-2 text-white/50 hover:text-white text-sm transition-colors"
                  >
                    返回选择
                  </button>
                </div>
              )}

              {step === 'qrcode' && (
                <div className="space-y-4 text-center">
                  <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                    <div className="w-32 h-32 bg-white rounded-xl mx-auto mb-4 flex items-center justify-center">
                      <div className="text-6xl">
                        {paymentChannel === 'alipay' ? '💳' : paymentChannel === 'wechat' ? '💚' : '🅿️'}
                      </div>
                    </div>
                    <p className="text-white font-medium mb-2">
                      {paymentChannel === 'alipay' ? '支付宝扫码支付' : 
                       paymentChannel === 'wechat' ? '微信扫码支付' : 'PayPal 支付'}
                    </p>
                    <p className="text-white/50 text-sm mb-3">
                      支付金额: <span className="text-white font-bold">{plan.price}</span>
                    </p>
                    <p className="text-xs text-white/40">
                      订单号: {orderNo}
                    </p>
                  </div>
                  
                  <p className="text-xs text-white/50">
                    支付页面已在新窗口打开，完成支付后点击下方按钮
                  </p>

                  <div className="flex gap-3">
                    <button
                      onClick={() => setStep('payment')}
                      className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-medium transition-colors"
                    >
                      重新选择
                    </button>
                    <button
                      onClick={confirmPayment}
                      disabled={loading}
                      className="flex-1 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                        >
                          <Sparkles className="w-5 h-5" />
                        </motion.div>
                      ) : '我已支付'}
                    </button>
                  </div>
                </div>
              )}

              {step === 'success' && (
                <div className="text-center py-4">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4"
                  >
                    <CheckCircle className="w-10 h-10 text-white" />
                  </motion.div>
                  <h3 className="text-xl font-bold text-white mb-2">激活成功！</h3>
                  <p className="text-white/60 mb-4">您已成功升级到 {plan.name}</p>
                  {activationCode && (
                    <div className="bg-white/5 rounded-xl p-3 mb-4">
                      <p className="text-xs text-white/40 mb-1">您的激活码</p>
                      <p className="text-lg font-mono text-white">{activationCode}</p>
                    </div>
                  )}
                  <button
                    onClick={() => { resetModal(); onClose() }}
                    className="w-full py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl font-semibold hover:opacity-90 transition-opacity"
                  >
                    开始使用
                  </button>
                </div>
              )}
            </div>

            {/* Footer */}
            {step !== 'success' && step !== 'qrcode' && (
              <div className="px-6 py-4 bg-white/5 border-t border-white/10">
                <div className="flex items-center justify-center gap-4 text-xs text-white/40">
                  <span className="flex items-center gap-1">
                    <ShieldCheck className="w-4 h-4" />
                    安全支付
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    即时开通
                  </span>
                  <span className="flex items-center gap-1">
                    <Award className="w-4 h-4" />
                    7天退款
                  </span>
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ==================== Navigation ====================
function Navigation({ onDownload, isDownloading }: { onDownload: () => void, isDownloading: boolean }) {
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [showQRCode, setShowQRCode] = useState(false)
  
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <>
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled ? 'glass-dark py-3 border-b border-white/5' : 'py-5 bg-transparent'
      }`}>
        <div className="container max-w-7xl mx-auto flex items-center justify-between px-6">
          <a href="#" className="flex items-center gap-3 group">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-glow group-hover:shadow-glow-lg transition-all">
              <MessageSquare className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white">ChatGenius AI</span>
          </a>
          
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-white/60 hover:text-white transition-colors font-medium">功能</a>
            <a href="#models" className="text-white/60 hover:text-white transition-colors font-medium">模型</a>
            <a href="#pricing" className="text-white/60 hover:text-white transition-colors font-medium">定价</a>
            <a href="#testimonials" className="text-white/60 hover:text-white transition-colors font-medium">评价</a>
            
            {/* 滚动后显示免费安装按钮 */}
            {scrolled && (
              <motion.button
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                onClick={onDownload}
                disabled={isDownloading}
                className={`flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-lg font-medium text-sm transition-all ${
                  isDownloading 
                    ? 'opacity-50 cursor-not-allowed' 
                    : 'hover:opacity-90'
                }`}
              >
                {isDownloading ? (
                  <>
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                    </svg>
                    <span>下载中...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>免费安装扩展</span>
                  </>
                )}
              </motion.button>
            )}
            
            <Button 
              onClick={() => setShowQRCode(true)}
              className="bg-gradient-to-r from-violet-600 to-purple-600 hover:opacity-90 shadow-glow" 
              size="sm"
            >
              <MessageCircle className="w-4 h-4 mr-1" />
              咨询客服
            </Button>
          </div>
          
          {/* Mobile menu button */}
          <button 
            className="md:hidden w-10 h-10 flex items-center justify-center text-white"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
        
        {/* Mobile menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden glass-dark border-t border-white/5"
            >
              <div className="container max-w-7xl mx-auto px-6 py-4 flex flex-col gap-4">
                <a href="#features" onClick={() => setMobileMenuOpen(false)} className="text-white/60 hover:text-white transition-colors font-medium py-2">功能</a>
                <a href="#models" onClick={() => setMobileMenuOpen(false)} className="text-white/60 hover:text-white transition-colors font-medium py-2">模型</a>
                <a href="#pricing" onClick={() => setMobileMenuOpen(false)} className="text-white/60 hover:text-white transition-colors font-medium py-2">定价</a>
                <a href="#testimonials" onClick={() => setMobileMenuOpen(false)} className="text-white/60 hover:text-white transition-colors font-medium py-2">评价</a>
                <Button 
                  onClick={() => { setShowQRCode(true); setMobileMenuOpen(false); }}
                  className="bg-gradient-to-r from-violet-600 to-purple-600 hover:opacity-90 shadow-glow w-full"
                >
                  <MessageCircle className="w-4 h-4 mr-1" />
                  咨询客服
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* 客服二维码弹窗 */}
      <AnimatePresence>
        {showQRCode && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowQRCode(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl border border-white/10 shadow-2xl p-8 text-center max-w-sm"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">扫码咨询客服</h3>
              <p className="text-white/50 text-sm mb-6">微信扫码，获取专业解答</p>
              <div className="w-48 h-48 bg-white rounded-2xl mx-auto mb-6 flex items-center justify-center">
                {/* 二维码图片占位 - 实际使用时替换为真实二维码 */}
                <div className="text-center">
                  <div className="w-32 h-32 bg-gray-100 rounded-lg flex items-center justify-center mb-2">
                    <svg className="w-24 h-24 text-gray-300" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M3 3h6v6H3V3zm2 2v2h2V5H5zm8-2h6v6h-6V3zm2 2v2h2V5h-2zM3 13h6v6H3v-6zm2 2v2h2v-2H5zm13-2h1v1h-1v-1zm-3 0h1v1h-1v-1zm1 1h1v1h-1v-1zm-1 1h1v1h-1v-1zm1 1h1v1h-1v-1zm1 1h1v1h-1v-1zm-3 0h1v1h-1v-1zm1 1h1v1h-1v-1zm1 1h1v1h-1v-1zm3-4h1v1h-1v-1zm0 2h1v1h-1v-1zm0 2h1v1h-1v-1zm-4-2h1v1h-1v-1zm1 1h1v1h-1v-1zm1 1h1v1h-1v-1z"/>
                    </svg>
                  </div>
                  <span className="text-xs text-gray-400">微信客服二维码</span>
                </div>
              </div>
              <button
                onClick={() => setShowQRCode(false)}
                className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg font-medium transition-colors"
              >
                关闭
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

// ==================== Hero Section ====================
function HeroSection({ onDownload, isDownloading }: { onDownload: () => void, isDownloading: boolean }) {
  const [inputText, setInputText] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [showUserMessage, setShowUserMessage] = useState(false)
  
  const customerMessage = "Hi, I'm interested in your products. Can you send me the catalog and price list?"
  const aiReplyText = "Hello! Thank you for your interest. I'd be happy to send you our latest catalog. Could you please provide your email? We also offer 10% discount for first-time customers!"
  
  // Animation cycle
  useEffect(() => {
    const runAnimation = () => {
      // Step 1: Type in input box
      setIsTyping(true)
      let i = 0
      const typeInterval = setInterval(() => {
        if (i <= aiReplyText.length) {
          setInputText(aiReplyText.slice(0, i))
          i++
        } else {
          clearInterval(typeInterval)
          setIsTyping(false)
          
          // Step 2: Show user message after a delay
          setTimeout(() => {
            setShowUserMessage(true)
            setInputText('')
            
            // Step 3: Reset and restart
            setTimeout(() => {
              setShowUserMessage(false)
              runAnimation()
            }, 6000)
          }, 800)
        }
      }, 30)
    }
    
    // Start animation after initial delay
    const timer = setTimeout(runAnimation, 1500)
    return () => clearTimeout(timer)
  }, [])
  
  const { scrollY } = useScroll()
  const y = useTransform(scrollY, [0, 500], [0, 150])
  const opacity = useTransform(scrollY, [0, 300], [1, 0])
  
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20 noise" style={{ backgroundColor: 'hsl(220 20% 6%)' }}>
      {/* Animated Background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-hero" style={{ background: 'radial-gradient(ellipse 80% 50% at 50% -20%, hsl(262 95% 65% / 0.15), hsl(220 20% 6%))' }} />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-transparent" />
        
        <FloatElement delay={0} duration={8}>
          <div className="absolute top-20 right-10 w-[600px] h-[600px] bg-gradient-to-br from-violet-600/20 to-purple-600/10 rounded-full blur-3xl" />
        </FloatElement>
        <FloatElement delay={2} duration={10}>
          <div className="absolute bottom-20 left-10 w-[500px] h-[500px] bg-gradient-to-br from-cyan-600/15 to-blue-600/10 rounded-full blur-3xl" />
        </FloatElement>
        <FloatElement delay={1} duration={12}>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-br from-fuchsia-600/10 to-pink-600/5 rounded-full blur-3xl" />
        </FloatElement>
        
        <div className="absolute inset-0 bg-[linear-gradient(rgba(139,92,246,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(139,92,246,0.03)_1px,transparent_1px)] bg-[size:80px_80px]" />
        
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-violet-500 rounded-full animate-pulse shadow-glow" />
        <div className="absolute top-3/4 right-1/4 w-3 h-3 bg-cyan-500 rounded-full animate-pulse shadow-glow-cyan" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/3 right-1/3 w-2 h-2 bg-fuchsia-500 rounded-full animate-pulse" style={{ animationDelay: '2s' }} />
      </div>
      
      <motion.div style={{ y, opacity }} className="container max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <motion.div 
            initial="hidden" 
            animate="visible" 
            variants={stagger}
            className="text-center lg:text-left"
          >
            <motion.div variants={fadeInUp} className="inline-flex items-center gap-2 glass rounded-full px-5 py-2 mb-8 border border-white/10">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-sm font-medium text-white/80">支持 DeepSeek V3 / GPT-4.5 / Kimi K2.5</span>
            </motion.div>
            
            <motion.h1 variants={fadeInUp} className="text-5xl md:text-6xl lg:text-7xl font-black tracking-tight mb-6 leading-[1.1]">
              <span className="text-white">让 AI 帮你</span>
              <br />
              <span className="text-gradient">秒回消息</span>
            </motion.h1>
            
            <motion.p variants={fadeInUp} className="text-lg md:text-xl text-white/60 mb-6 max-w-lg mx-auto lg:mx-0 leading-relaxed">
              支持 40+ 主流 AI 模型，一键生成专业回复。适用于 WhatsApp Web 和 Messenger Web，外贸、客服、销售的必备神器。
            </motion.p>
            
            {/* Support badges */}
            <motion.div variants={fadeInUp} className="flex flex-wrap gap-3 justify-center lg:justify-start mb-10">
              <a href="https://web.whatsapp.com/" target="_blank" rel="nofollow" className="flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/20 hover:bg-green-500/20 transition-colors">
                <img src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" alt="WhatsApp" className="w-5 h-5" />
                <span className="text-sm text-green-400 font-medium">WhatsApp Web</span>
              </a>
              <a href="https://www.messenger.com/" target="_blank" rel="nofollow" className="flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/20 transition-colors">
                <img src="https://upload.wikimedia.org/wikipedia/commons/b/be/Facebook_Messenger_logo_2020.svg" alt="Messenger" className="w-5 h-5" />
                <span className="text-sm text-blue-400 font-medium">Messenger Web</span>
              </a>
            </motion.div>
            
            <motion.div variants={fadeInUp} className="flex flex-wrap gap-4 justify-center lg:justify-start mb-12">
              <Button 
                onClick={onDownload}
                disabled={isDownloading}
                className={`bg-gradient-to-r from-violet-600 to-purple-600 hover:opacity-90 shadow-glow-lg hover:shadow-glow text-white px-8 py-7 text-lg rounded-2xl group shimmer cursor-pointer transition-all ${
                  isDownloading ? 'opacity-50 cursor-not-allowed' : ''
                }`} 
                size="xl"
              >
                {isDownloading ? (
                  <>
                    <svg className="animate-spin w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                    </svg>
                    <span>下载中...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-5 h-5 mr-2" />
                    <span>免费安装扩展</span>
                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </Button>
              <Button variant="outline" className="px-8 py-7 text-lg rounded-2xl border-white/20 text-white hover:bg-white/10" size="xl">
                <Play className="w-5 h-5 mr-2" />
                观看演示
              </Button>
            </motion.div>
            
            <motion.div variants={fadeInUp} className="grid grid-cols-3 gap-8">
              {[
                { value: 40, suffix: '+', label: 'AI 模型' },
                { value: 8000, suffix: '+', label: '活跃用户' },
                { value: 10, suffix: 'x', label: '效率提升' },
              ].map((stat, i) => (
                <div key={i} className="text-center lg:text-left">
                  <div className="text-3xl md:text-4xl font-black text-gradient">
                    <AnimatedCounter end={stat.value} suffix={stat.suffix} />
                  </div>
                  <div className="text-sm text-white/40 mt-1">{stat.label}</div>
                </div>
              ))}
            </motion.div>
            
            {/* Chrome Store Rating */}
            <motion.div variants={fadeInUp} className="flex items-center gap-4 mt-8 justify-center lg:justify-start">
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-yellow-500/10 border border-yellow-500/20">
                <div className="flex">
                  {[1,2,3,4,5].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <span className="text-sm text-yellow-400 font-semibold">4.9</span>
                <span className="text-xs text-white/40">(2,847 条评价)</span>
              </div>
            </motion.div>
          </motion.div>
          
          {/* Demo Window with Animated Input */}
          <motion.div 
            initial={{ opacity: 0, x: 50, rotateY: -10 }}
            animate={{ opacity: 1, x: 0, rotateY: 0 }}
            transition={{ duration: 1, delay: 0.3 }}
            className="relative"
          >
            <FloatElement duration={5}>
              <div className="relative">
                <div className="absolute -inset-4 bg-gradient-to-br from-violet-600/30 to-purple-600/20 rounded-3xl blur-2xl" />
                
                <div className="relative glass rounded-3xl border border-white/10 overflow-hidden shadow-2xl">
                  <div className="bg-white/5 px-6 py-4 flex items-center gap-3 border-b border-white/5">
                    <div className="flex gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500" />
                      <div className="w-3 h-3 rounded-full bg-yellow-500" />
                      <div className="w-3 h-3 rounded-full bg-green-500" />
                    </div>
                    <span className="text-sm text-white/50 flex-1 text-center font-medium">WhatsApp Web</span>
                  </div>
                  
                  <div className="p-6 space-y-4 bg-gradient-to-b from-white/5 to-transparent min-h-[320px]">
                    {/* Customer message (left side) */}
                    <div className="flex justify-start">
                      <div className="bg-white/10 backdrop-blur px-5 py-3 rounded-2xl rounded-bl-md max-w-[85%] border border-white/5">
                        <span className="text-white/90">{customerMessage}</span>
                      </div>
                    </div>
                    
                    {/* User reply message (right side) - shows after sending (no AI badge) */}
                    {showUserMessage && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex justify-end"
                      >
                        <div className="bg-gradient-to-r from-violet-600 to-purple-600 text-white px-5 py-3 rounded-2xl rounded-br-md max-w-[85%] shadow-lg">
                          {aiReplyText}
                        </div>
                      </motion.div>
                    )}
                    
                    {/* Input Area - shows AI badge while typing */}
                    <div className="flex gap-3 pt-4 border-t border-white/5">
                      <div className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm flex items-center min-h-[48px] relative">
                        {inputText ? (
                          <span className="text-white">{inputText}<span className="animate-pulse">|</span></span>
                        ) : (
                          <span className="text-white/30">输入消息...</span>
                        )}
                        {isTyping && inputText && (
                          <div className="absolute -top-2 right-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-glow-cyan animate-pulse">
                            AI
                          </div>
                        )}
                      </div>
                      <Button className={`bg-gradient-to-r from-violet-600 to-purple-600 shadow-glow ${isTyping ? 'opacity-50' : ''}`}>
                        <Send className="w-5 h-5" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </FloatElement>
          </motion.div>
        </div>
      </motion.div>
    </section>
  )
}

// ==================== Browser Marquee ====================
function BrowserMarquee() {
  const browsers = [
    { name: 'Chrome', logo: '/icons/chrome.svg' },
    { name: 'Edge', logo: '/icons/edge.svg' },
    { name: 'Brave', logo: '/icons/brave.svg' },
    { name: 'Opera', logo: '/icons/opera.svg' },
    { name: 'Vivaldi', logo: '/icons/vivaldi.svg' },
  ]

  return (
    <section className="py-10 border-y border-white/5 bg-white/[0.02]">
      <div className="container max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-center gap-8 flex-wrap">
          <span className="text-white/50 text-base font-medium">支持主流 Chrome 内核浏览器</span>
          <div className="flex items-center gap-6 flex-wrap justify-center">
            {browsers.map((browser, i) => (
              <div
                key={i}
                className="flex items-center gap-2 group cursor-pointer"
              >
                <div className="w-14 h-14 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <img
                    src={browser.logo}
                    alt={browser.name}
                    className="w-12 h-12"
                    style={{ objectFit: 'contain' }}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      const fallbackUrl = `https://www.google.com/s2/favicons?domain=${browser.name.toLowerCase()}.com&sz=64`
                      if (target.src !== fallbackUrl) {
                        target.src = fallbackUrl
                      }
                    }}
                  />
                </div>
                <span className="text-sm font-semibold text-white/60 group-hover:text-white transition-colors">
                  {browser.name}
                </span>
              </div>
            ))}
            <div className="flex items-center justify-center group-hover:scale-110 transition-transform cursor-pointer">
              <span className="text-xl font-bold text-white/60 group-hover:text-white transition-colors">+</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ==================== Trust Badges Section ====================
function TrustBadgesSection() {
  const badges = [
    { icon: ShieldCheck, label: '数据安全', desc: '本地加密存储' },
    { icon: Award, label: '4.9 评分', desc: 'Chrome 商店' },
    { icon: Users, label: '8,000+', desc: '活跃用户' },
    { icon: Zap, label: '3秒响应', desc: '极速AI生成' },
  ]
  
  return (
    <section className="py-12 border-y border-white/5 bg-white/[0.02]">
      <div className="container max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {badges.map((badge, i) => (
            <div key={i} className="flex items-center gap-3 justify-center md:justify-start">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-600/20 to-purple-600/20 flex items-center justify-center">
                <badge.icon className="w-6 h-6 text-violet-400" />
              </div>
              <div>
                <div className="text-white font-bold">{badge.label}</div>
                <div className="text-xs text-white/40">{badge.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ==================== Features Section ====================
function FeaturesSection() {
  const features = [
    { 
      icon: Zap, 
      title: '一键智能回复', 
      desc: '点击悬浮按钮，AI 自动分析聊天上下文，3秒内生成专业回复，直接填入输入框。',
      gradient: 'from-amber-500 to-orange-500',
      stat: '3s',
      highlight: '秒级响应'
    },
    { 
      icon: Bot, 
      title: '40+ AI 模型', 
      desc: '支持 DeepSeek、GPT-4.5、Kimi、通义千问等主流模型，按需切换。',
      gradient: 'from-violet-500 to-purple-500',
      stat: '40+',
      highlight: '海量模型'
    },
    { 
      icon: Users, 
      title: '自定义 AI 角色', 
      desc: '创建专属角色人设，设置专业领域和回复风格，让 AI 以您的身份沟通。',
      gradient: 'from-cyan-500 to-blue-500',
      stat: '∞',
      highlight: '无限角色'
    },
    { 
      icon: Database, 
      title: '知识库问答', 
      desc: '导入产品 FAQ、公司政策，AI 自动融入回复，信息准确统一。',
      gradient: 'from-emerald-500 to-teal-500',
      stat: 'KB',
      highlight: '智能记忆'
    },
    { 
      icon: Settings, 
      title: '灵活配置', 
      desc: '自定义回复语气、长度，支持专业、友好、共情等多种风格。',
      gradient: 'from-pink-500 to-rose-500',
      stat: '24',
      highlight: '多种风格'
    },
    { 
      icon: Shield, 
      title: '隐私安全', 
      desc: 'API Key 本地存储，不上传服务器，对话数据仅用于生成回复。',
      gradient: 'from-indigo-500 to-violet-500',
      stat: '🔒',
      highlight: '数据安全'
    },
  ]

  return (
    <section id="features" className="py-32 relative overflow-hidden bg-background">
      {/* Background decorations */}
      <div className="absolute top-1/4 -left-32 w-64 h-64 bg-violet-600/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 -right-32 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl" />
      
      <div className="container max-w-7xl mx-auto px-6">
        <motion.div 
          initial="hidden" 
          whileInView="visible" 
          viewport={{ once: true, margin: "-100px" }}
          variants={stagger}
          className="text-center mb-20"
        >
          <motion.div variants={fadeInUp} className="inline-flex items-center gap-2 glass rounded-full px-4 py-1.5 mb-6 border border-white/10">
            <Sparkles className="w-4 h-4 text-violet-400" />
            <span className="text-sm font-medium text-violet-300">功能特性</span>
          </motion.div>
          <motion.h2 variants={fadeInUp} className="text-4xl md:text-5xl lg:text-6xl font-black mb-6">
            <span className="text-white">为高效沟通</span>
            <span className="text-gradient">而生</span>
          </motion.h2>
          <motion.p variants={fadeInUp} className="text-white/50 text-lg max-w-2xl mx-auto">
            专为外贸、客服、销售场景设计，让每一句回复都专业高效
          </motion.p>
        </motion.div>
        
        <motion.div 
          initial="hidden" 
          whileInView="visible" 
          viewport={{ once: true, margin: "-50px" }}
          variants={stagger}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {features.map((feature, i) => (
            <motion.div key={i} variants={fadeInUp}>
              <Card className="h-full bg-white/[0.03] hover:bg-white/[0.06] border-white/5 hover:border-white/15 transition-all duration-500 group overflow-hidden relative">
                {/* Background gradient decoration - always visible */}
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-[0.03] group-hover:opacity-[0.08] transition-opacity duration-500`} />
                
                {/* Corner decoration */}
                <div className={`absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br ${feature.gradient} opacity-10 rounded-full blur-2xl group-hover:opacity-20 transition-opacity`} />
                
                {/* Bottom line decoration - always visible */}
                <div className={`absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r ${feature.gradient} opacity-30 group-hover:opacity-100 transition-opacity`} />
                
                <CardHeader className="p-8 relative z-10">
                  <div className="flex items-start justify-between mb-5">
                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 relative`}>
                      <feature.icon className="w-8 h-8 text-white" />
                      {/* Icon glow */}
                      <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} rounded-2xl blur-xl opacity-50`} />
                    </div>
                    <div className="text-right">
                      <div className={`text-3xl font-black bg-gradient-to-br ${feature.gradient} bg-clip-text text-transparent`}>
                        {feature.stat}
                      </div>
                      <div className="text-xs text-white/40 mt-1">{feature.highlight}</div>
                    </div>
                  </div>
                  <CardTitle className="text-xl mb-2 text-white group-hover:text-gradient transition-all duration-300">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent className="p-8 pt-0 relative z-10">
                  <CardDescription className="text-base leading-relaxed text-white/50 group-hover:text-white/70 transition-colors">{feature.desc}</CardDescription>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

// ==================== Models Section ====================
function ModelsSection() {
  const models = [
    { nameCn: 'DeepSeek', nameEn: '深度求索 · 性价比之王', logo: '/icons/deepseek.png' },
    { nameCn: 'OpenAI', nameEn: 'GPT-4.5 · 行业标杆', logo: '/icons/openai.svg' },
    { nameCn: 'Kimi', nameEn: '月之暗面 · 超长上下文', logo: '/icons/kimi.png' },
    { nameCn: 'Qwen', nameEn: '通义千问 · 阿里出品', logo: '/icons/qwen.png' },
    { nameCn: 'GLM', nameEn: '智谱清言 · 中文优化', logo: '/icons/zhipu.png' },
    { nameCn: 'Doubao', nameEn: '豆包 · 字节跳动', logo: '/icons/doubao.png' },
    { nameCn: 'Gemini', nameEn: '谷歌双子 · 多模态', logo: '/icons/gemini.png' },
    { nameCn: 'Custom', nameEn: '自定义API · 灵活接入', logo: null },
  ]

  return (
    <section id="models" className="py-32 relative overflow-hidden bg-gradient-to-b from-background via-violet-950/20 to-background">
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(139,92,246,0.1),transparent_60%)]" />
        <FloatElement duration={15}>
          <div className="absolute top-20 left-20 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl" />
        </FloatElement>
        <FloatElement delay={5} duration={20}>
          <div className="absolute bottom-20 right-20 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-3xl" />
        </FloatElement>
      </div>
      
      <div className="container max-w-7xl mx-auto px-6 relative z-10">
        <motion.div 
          initial="hidden" 
          whileInView="visible" 
          viewport={{ once: true }}
          variants={stagger}
          className="text-center mb-20"
        >
          <motion.div variants={fadeInUp} className="inline-flex items-center gap-2 glass rounded-full px-4 py-1.5 mb-6 border border-white/10">
            <Globe className="w-4 h-4 text-cyan-400" />
            <span className="text-sm font-medium text-cyan-300">AI 模型</span>
          </motion.div>
          <motion.h2 variants={fadeInUp} className="text-4xl md:text-5xl lg:text-6xl font-black mb-6 text-white">
            支持 <span className="text-gradient">40+</span> 主流模型
          </motion.h2>
          <motion.p variants={fadeInUp} className="text-white/50 text-lg max-w-2xl mx-auto">
            按需选择，灵活切换，总能找到最适合您的模型
          </motion.p>
        </motion.div>
        
        <motion.div 
          initial="hidden" 
          whileInView="visible" 
          viewport={{ once: true }}
          variants={stagger}
          className="grid grid-cols-2 md:grid-cols-4 gap-5"
        >
          {models.map((model, i) => (
            <motion.div
              key={i}
              variants={scaleIn}
              whileHover={{ y: -8, scale: 1.02 }}
              className="group cursor-pointer"
            >
              <div className="text-center p-6 transition-all h-full">
                <div className="w-20 h-20 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-all rounded-2xl bg-white/5 p-3">
                  {model.logo ? (
                    <img 
                      src={model.logo} 
                      alt={model.nameCn} 
                      className="w-full h-full"
                      style={{ objectFit: 'contain' }}
                      loading="lazy"
                    />
                  ) : (
                    <Globe className="w-10 h-10 text-white/60" />
                  )}
                </div>
                <h3 className="font-bold text-lg text-white mb-0.5">{model.nameCn}</h3>
                <p className="text-sm text-white/40">{model.nameEn}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

// ==================== Use Cases Section ====================
function UseCasesSection() {
  const cases = [
    {
      icon: Plane,
      title: '外贸业务',
      subtitle: '跨境电商 · 外贸B2B',
      desc: '快速回复海外客户询盘，AI 自动生成专业的英文商务回复，支持多语言翻译。',
      features: ['智能翻译 100+ 语言', '专业商务表达', '产品描述生成'],
      gradient: 'from-blue-500 via-cyan-500 to-teal-500',
    },
    {
      icon: HeadsetIcon,
      title: '在线客服',
      subtitle: '电商平台 · 客服中心',
      desc: '高效处理客户咨询，基于知识库自动生成标准化回复，降低培训成本。',
      features: ['知识库智能匹配', '常见问题自动回复', '情绪识别与安抚'],
      gradient: 'from-emerald-500 via-green-500 to-lime-500',
    },
    {
      icon: TrendingUp,
      title: '销售沟通',
      subtitle: 'B2B销售 · 客户跟进',
      desc: '智能跟进潜在客户，AI 根据客户画像生成个性化话术，提升成交率。',
      features: ['客户画像分析', '个性化话术生成', '异议处理建议'],
      gradient: 'from-orange-500 via-amber-500 to-yellow-500',
    },
    {
      icon: Handshake,
      title: '商务合作',
      subtitle: '渠道拓展 · 合作洽谈',
      desc: '专业商务沟通，AI 助您维护合作伙伴关系，每一步都彰显专业形象。',
      features: ['商务邮件撰写', '会议纪要整理', '合作方案生成'],
      gradient: 'from-violet-500 via-purple-500 to-fuchsia-500',
    },
  ]

  return (
    <section className="py-32 relative overflow-hidden bg-background">
      <div className="container max-w-7xl mx-auto px-6">
        <motion.div 
          initial="hidden" 
          whileInView="visible" 
          viewport={{ once: true }}
          variants={stagger}
          className="text-center mb-20"
        >
          <motion.div variants={fadeInUp} className="inline-flex items-center gap-2 glass rounded-full px-4 py-1.5 mb-6 border border-white/10">
            <Target className="w-4 h-4 text-orange-400" />
            <span className="text-sm font-medium text-orange-300">使用场景</span>
          </motion.div>
          <motion.h2 variants={fadeInUp} className="text-4xl md:text-5xl lg:text-6xl font-black mb-6">
            <span className="text-white">适用</span>
            <span className="text-gradient">各行各业</span>
          </motion.h2>
          <motion.p variants={fadeInUp} className="text-white/50 text-lg max-w-2xl mx-auto">
            无论您从事什么行业，ChatGenius 都能帮您提升沟通效率
          </motion.p>
        </motion.div>
        
        <motion.div 
          initial="hidden" 
          whileInView="visible" 
          viewport={{ once: true }}
          variants={stagger}
          className="grid md:grid-cols-2 gap-8"
        >
          {cases.map((useCase, i) => (
            <motion.div
              key={i}
              variants={fadeInUp}
              whileHover={{ y: -8 }}
              className="group"
            >
              <div className="relative glass rounded-3xl p-8 border border-white/5 hover:border-white/15 transition-all h-full overflow-hidden">
                <div className={`absolute inset-0 bg-gradient-to-br ${useCase.gradient} opacity-0 group-hover:opacity-5 transition-opacity`} />
                
                <div className="relative z-10">
                  <div className="flex items-start gap-5 mb-6">
                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${useCase.gradient} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                      <useCase.icon className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold mb-1 text-white">{useCase.title}</h3>
                      <p className={`text-sm font-medium bg-gradient-to-r ${useCase.gradient} bg-clip-text text-transparent`}>{useCase.subtitle}</p>
                    </div>
                  </div>
                  
                  <p className="text-white/60 mb-6 leading-relaxed">{useCase.desc}</p>
                  
                  <div className="space-y-3">
                    {useCase.features.map((feature, j) => (
                      <div key={j} className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-full bg-gradient-to-br ${useCase.gradient} flex items-center justify-center flex-shrink-0`}>
                          <Check className="w-3 h-3 text-white" />
                        </div>
                        <span className="text-white/70">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

// ==================== Pricing Section ====================
function PricingSection({ onDownload }: { onDownload: () => void }) {
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<{ name: string; price: string; type: 'year' | 'lifetime' } | null>(null)

  const handlePlanClick = (plan: { type: string, name: string, price: string }) => {
    if (plan.type === 'free') {
      onDownload()
    } else {
      setSelectedPlan({ name: plan.name, price: plan.price, type: plan.type as 'year' | 'lifetime' })
      setModalOpen(true)
    }
  }

  const plans = [
    {
      name: '免费版',
      price: '$0',
      period: '/ 永久',
      desc: '适合轻度用户尝鲜体验',
      features: [
        '支持 40+ AI 模型',
        'WhatsApp / Messenger',
        '1 个自定义角色',
        '5 条 FAQ 知识库',
        '每天回复 20 次',
        '基础统计面板'
      ],
      limitations: ['每天回复 20 次', '仅 1 个角色'],
      cta: '免费开始',
      popular: false,
      hot: false,
      type: 'free' as const,
    },
    {
      name: 'Pro 年付',
      price: '$9.9',
      originalPrice: null,
      period: '/ 年',
      desc: '按年订阅，每年续费',
      badge: '订阅制',
      features: [
        '免费版所有功能',
        '无限自定义角色',
        '无限 FAQ 知识库',
        '无限次回复',
        '回复历史云同步',
        '多设备同步',
        '优先技术支持',
        '每年续费使用'
      ],
      limitations: [],
      cta: '立即订阅',
      popular: false,
      hot: false,
      type: 'year' as const,
    },
    {
      name: 'Pro 永久版',
      price: '$9.9',
      originalPrice: '$19.9',
      period: '/ 永久',
      desc: '一次付费，终身使用',
      features: [
        '年付版所有功能',
        '终身免费更新',
        '永久技术支持',
        '无需续费',
        '一次投入，终身受益'
      ],
      limitations: [],
      cta: '立即订阅',
      popular: true,
      hot: true,
      type: 'lifetime' as const,
    },
  ]

  return (
    <>
      <section id="pricing" className="py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-violet-950/10 to-background" />
        
        <div className="container max-w-6xl mx-auto px-6 relative z-10">
          <motion.div 
            initial="hidden" 
            whileInView="visible" 
            viewport={{ once: true }}
            variants={stagger}
            className="text-center mb-20"
          >
            <motion.div variants={fadeInUp} className="inline-flex items-center gap-2 glass rounded-full px-4 py-1.5 mb-6 border border-white/10">
              <Crown className="w-4 h-4 text-yellow-400" />
              <span className="text-sm font-medium text-yellow-300">定价方案</span>
            </motion.div>
            <motion.h2 variants={fadeInUp} className="text-4xl md:text-5xl lg:text-6xl font-black mb-6">
              <span className="text-white">选择适合您的</span>
              <span className="text-gradient">方案</span>
            </motion.h2>
            <motion.div variants={fadeInUp} className="mb-4">
              <CountdownTimer />
            </motion.div>
            <motion.p variants={fadeInUp} className="text-lg">
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-red-500/20 border border-amber-500/30">
                <Sparkles className="w-5 h-5 text-amber-400 animate-pulse" />
                <span className="font-bold text-gradient-gold animate-pulse">Pro 版限时特惠，永久版仅需 $9.9</span>
                <Sparkles className="w-5 h-5 text-amber-400 animate-pulse" />
              </span>
            </motion.p>
          </motion.div>
          
          <motion.div 
            initial="hidden" 
            whileInView="visible" 
            viewport={{ once: true }}
            variants={stagger}
            className="grid md:grid-cols-3 gap-6 items-stretch"
          >
            {plans.map((plan, i) => (
              <motion.div
                key={i}
                variants={scaleIn}
                className="relative"
              >
                {plan.hot && (
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 z-10 whitespace-nowrap">
                    <div className="relative">
                      <div className="absolute inset-0 bg-red-500 blur-lg animate-pulse opacity-75 rounded-full" />
                      <div className="relative bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 text-white text-base font-black px-5 py-1.5 rounded-full shadow-xl tracking-wider animate-pulse">
                        🔥 限时5折
                      </div>
                    </div>
                  </div>
                )}
                {(plan as any).badge && (
                  <div className="absolute top-4 right-4 z-10">
                    <span className="text-xs font-medium text-white/50 bg-white/10 px-2 py-1 rounded">
                      {(plan as any).badge}
                    </span>
                  </div>
                )}
                <Card className={`relative h-full flex flex-col ${plan.popular 
                    ? 'bg-gradient-to-br from-violet-600/20 via-purple-600/20 to-fuchsia-600/20 border-violet-500/30 shadow-glow-lg' 
                    : 'glass border-white/10'
                } ${(plan as any).badge && !plan.hot ? 'opacity-80' : ''}`}>
                  <CardHeader className="p-6 pb-4">
                    <CardTitle className="text-xl mb-2 text-white">{plan.name}</CardTitle>
                    <div className="flex items-baseline gap-2 mb-3">
                      {plan.originalPrice && (
                        <span className="text-xl text-red-400 line-through decoration-2 font-semibold">{plan.originalPrice}</span>
                      )}
                      <span className={`text-4xl font-black ${plan.popular ? 'text-gradient-gold' : 'text-white'}`}>{plan.price}</span>
                      <span className="text-white/50 text-sm">{plan.period}</span>
                    </div>
                    <CardDescription className="text-white/50 text-sm">{plan.desc}</CardDescription>
                  </CardHeader>
                  <CardContent className="p-6 pt-0 flex flex-col flex-1">
                    <ul className="space-y-2 mb-6 flex-1">
                      {plan.features.map((feature, j) => (
                        <li key={j} className="flex items-center gap-2">
                          <Check className={`w-4 h-4 flex-shrink-0 ${plan.popular ? 'text-yellow-400' : 'text-emerald-400'}`} />
                          <span className="text-sm text-white/80">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    {plan.limitations.length > 0 && (
                      <div className="pt-4 mb-4 border-t border-white/10">
                        {plan.limitations.map((limit, j) => (
                          <p key={j} className="text-xs text-white/40">• {limit}</p>
                        ))}
                      </div>
                    )}
                    <Button 
                      onClick={() => handlePlanClick(plan)}
                      className={`w-full mt-auto ${plan.popular 
                          ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-black hover:opacity-90 shadow-glow-gold font-bold' 
                          : 'bg-white/10 text-white hover:bg-white/20 border border-white/10'
                      }`} 
                      size="lg"
                    >
                      {plan.cta}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        
        <motion.div 
          initial={{ opacity: 0 }} 
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="flex flex-wrap justify-center gap-8 mt-12 text-white/40 text-sm"
        >
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-500" />
            <span>安全支付</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-cyan-500" />
            <span>即时开通</span>
          </div>
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-yellow-500" />
            <span>终身更新</span>
          </div>
        </motion.div>
      </div>
    </section>

      <PaymentModal 
        isOpen={modalOpen} 
        onClose={() => setModalOpen(false)} 
        plan={selectedPlan} 
      />
    </>
  )
}

// ==================== Testimonials Section ====================
function TestimonialsSection() {
  const testimonials = [
    { 
      name: '李明', role: '外贸业务员 · 深圳', 
      text: '每天要回复几十个海外客户询盘，有了这个工具效率提升太多了！AI 生成的回复非常专业。',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face', rating: 5, gender: 'male',
      time: '2 天前'
    },
    { 
      name: '王芳', role: '电商客服主管 · 杭州', 
      text: '团队客服都在用，配合知识库功能，新员工也能快速上手。强烈推荐！',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face', rating: 4.5, gender: 'female',
      time: '3 天前'
    },
    { 
      name: '张伟', role: '独立开发者 · 北京', 
      text: '支持 DeepSeek 模型太棒了！成本低效果好，自定义角色功能非常实用。',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face', rating: 5, gender: 'male',
      time: '5 天前'
    },
    { 
      name: '陈思', role: '销售经理 · 上海', 
      text: '跟进客户变得轻松多了，AI 生成的回复既专业又有针对性，成交率明显提升。',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face', rating: 4.5, gender: 'female',
      time: '1 周前'
    },
    { 
      name: '刘洋', role: '跨境电商 · 广州', 
      text: '多语言支持太实用了，再也不用担心语言障碍，回复速度和准确性都大幅提升。',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face', rating: 5, gender: 'male',
      time: '1 周前'
    },
    { 
      name: '赵静', role: '运营总监 · 成都', 
      text: '团队协作效率提升了50%，知识库功能让所有人都保持一致的回复风格。',
      avatar: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=150&h=150&fit=crop&crop=face', rating: 5, gender: 'female',
      time: '2 周前'
    },
  ]

  return (
    <section id="testimonials" className="py-32 relative overflow-hidden bg-gradient-to-b from-background via-violet-950/10 to-background">
      <div className="container max-w-7xl mx-auto px-6">
        <motion.div 
          initial="hidden" 
          whileInView="visible" 
          viewport={{ once: true }}
          variants={stagger}
          className="text-center mb-20"
        >
          <motion.div variants={fadeInUp} className="inline-flex items-center gap-2 glass rounded-full px-4 py-1.5 mb-6 border border-white/10">
            <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
            <span className="text-sm font-medium text-yellow-300">用户评价</span>
          </motion.div>
          <motion.h2 variants={fadeInUp} className="text-4xl md:text-5xl lg:text-6xl font-black mb-6">
            <span className="text-white">用户</span>
            <span className="text-gradient-gold">怎么说</span>
          </motion.h2>
          <motion.p variants={fadeInUp} className="text-white/50 text-lg">
            超过 <AnimatedCounter end={8000} suffix="+" /> 用户的选择
          </motion.p>
        </motion.div>
        
        <motion.div 
          initial="hidden" 
          whileInView="visible" 
          viewport={{ once: true }}
          variants={stagger}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {testimonials.map((t, i) => (
            <motion.div key={i} variants={fadeInUp} whileHover={{ y: -5 }}>
              <Card className="h-full glass hover:border-white/20 border-white/5 transition-all overflow-hidden group">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-14 h-14 rounded-full overflow-hidden shadow-lg group-hover:scale-110 transition-transform">
                      <img 
                        src={t.avatar} 
                        alt={t.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(t.name)}&background=6366f1&color=fff&size=128`
                        }}
                      />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-base text-white">{t.name}</CardTitle>
                      <CardDescription className="text-xs text-white/50">{t.role}</CardDescription>
                    </div>
                    <span className="text-xs text-white/30">{(t as any).time}</span>
                  </div>
                  <div className="flex gap-0.5 mb-3 items-center">
                    {[1,2,3,4,5].map((star) => (
                      <span key={star} className="relative">
                        {star <= Math.floor(t.rating) ? (
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        ) : star - 0.5 === t.rating ? (
                          <span className="relative">
                            <Star className="w-4 h-4 text-yellow-400" />
                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400 absolute top-0 left-0 overflow-hidden" style={{ clipPath: 'inset(0 50% 0 0)' }} />
                          </span>
                        ) : (
                          <Star className="w-4 h-4 text-yellow-400" />
                        )}
                      </span>
                    ))}
                    <span className="text-xs text-white/50 ml-1">{t.rating}</span>
                  </div>
                  <p className="text-white/60 text-sm leading-relaxed">{t.text}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

// ==================== FAQ Section ====================
function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  
  const faqs = [
    { q: 'Pro 版真的是永久使用吗？', a: '是的，一次付费 $9.9，终身使用，所有未来功能更新完全免费，无需任何额外费用。' },
    { q: '支持哪些支付方式？', a: '我们支持支付宝、微信支付、PayPal、信用卡等多种支付方式，支付过程安全便捷。' },
    { q: '购买后可以退款吗？', a: '支持 7 天无理由退款。如果您对产品不满意，联系客服即可办理全额退款。' },
    { q: '免费版有什么限制？', a: '免费版每天回复 20 次，仅支持 1 个自定义角色和 5 条 FAQ。适合轻度用户尝鲜体验。' },
    { q: '如何获取 API Key？', a: '根据您选择的 AI 服务商，前往对应官网注册即可获取。大多数平台提供免费额度供新用户试用。' },
    { q: '我的 API Key 会被上传到服务器吗？', a: '不会。您的 API Key 仅存储在浏览器本地，所有 API 请求都直接发送到 AI 服务商，我们不经过任何中间服务器。' },
    { q: '支持哪些浏览器？', a: '目前支持 Chrome、Edge、Brave、Arc 等基于 Chromium 内核的浏览器。Firefox 和 Safari 支持正在开发中。' },
  ]

  return (
    <section id="faq" className="py-32 relative overflow-hidden bg-background">
      <div className="container max-w-3xl mx-auto px-6">
        <motion.div 
          initial="hidden" 
          whileInView="visible" 
          viewport={{ once: true }}
          variants={stagger}
          className="text-center mb-20"
        >
          <motion.div variants={fadeInUp} className="inline-flex items-center gap-2 glass rounded-full px-4 py-1.5 mb-6 border border-white/10">
            <MessageCircleQuestion className="w-4 h-4 text-cyan-400" />
            <span className="text-sm font-medium text-cyan-300">常见问题</span>
          </motion.div>
          <motion.h2 variants={fadeInUp} className="text-4xl md:text-5xl font-black text-white">FAQ</motion.h2>
        </motion.div>
        
        <motion.div 
          initial="hidden" 
          whileInView="visible" 
          viewport={{ once: true }}
          variants={stagger}
          className="space-y-4"
        >
          {faqs.map((faq, i) => (
            <motion.div key={i} variants={fadeInUp}>
              <button
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="w-full text-left glass rounded-2xl p-6 hover:border-white/20 border-white/5 transition-all group"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-lg text-white pr-4">{faq.q}</span>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                    openIndex === i ? 'bg-violet-600 rotate-180' : 'bg-white/10 group-hover:bg-white/20'
                  }`}>
                    <ChevronDown className={`w-5 h-5 transition-colors ${openIndex === i ? 'text-white' : 'text-white/60'}`} />
                  </div>
                </div>
                <AnimatePresence>
                  {openIndex === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <p className="text-white/60 pt-4 leading-relaxed">{faq.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </button>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

// ==================== CTA Section ====================
function CTASection({ onDownload, isDownloading }: { onDownload: () => void, isDownloading: boolean }) {
  return (
    <section className="py-32 relative overflow-hidden bg-background">
      <div className="absolute inset-0 bg-gradient-to-br from-violet-600/20 via-purple-600/10 to-fuchsia-600/20" />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background" />
      
      <div className="container max-w-4xl mx-auto px-6 relative z-10 text-center">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={stagger}
        >
          <motion.div variants={fadeInUp}>
            <div className="w-20 h-20 mx-auto mb-8 rounded-3xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-glow-lg">
              <Rocket className="w-10 h-10 text-white" />
            </div>
          </motion.div>
          <motion.h2 variants={fadeInUp} className="text-4xl md:text-5xl lg:text-6xl font-black text-white mb-6">
            准备好提升聊天效率了吗？
          </motion.h2>
          <motion.p variants={fadeInUp} className="text-white/60 text-xl mb-10 max-w-2xl mx-auto">
            免费安装，立即体验 AI 智能回复的魅力。Pro 版仅需 $9.9，终身使用。
          </motion.p>
          <motion.div variants={fadeInUp} className="flex flex-wrap gap-4 justify-center">
            <Button 
              onClick={onDownload}
              disabled={isDownloading}
              className={`bg-gradient-to-r from-violet-600 to-purple-600 hover:opacity-90 text-white px-8 py-7 text-lg rounded-2xl shadow-glow-lg shimmer cursor-pointer transition-all ${
                isDownloading ? 'opacity-50 cursor-not-allowed' : ''
              }`} 
              size="xl"
            >
              {isDownloading ? (
                <>
                  <svg className="animate-spin w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                  </svg>
                  <span>下载中...</span>
                </>
              ) : (
                <>
                  <Download className="w-5 h-5 mr-2" />
                  <span>免费安装 Chrome 扩展</span>
                </>
              )}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
              className="border-white/20 text-white hover:bg-white/10 px-8 py-7 text-lg rounded-2xl cursor-pointer" 
              size="xl"
            >
              <Sparkles className="w-5 h-5 mr-2" />
              升级 Pro 版
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}

// ==================== Footer ====================
function Footer() {
  return (
    <footer className="border-t border-white/5 py-16">
      <div className="container max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-5 gap-12 mb-12">
          <div className="md:col-span-2">
            <a href="#" className="flex items-center gap-3 mb-4">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-glow">
                <MessageSquare className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white">ChatGenius AI</span>
            </a>
            <p className="text-white/40 text-sm leading-relaxed max-w-xs">
              让 AI 成为您的聊天助手，提升沟通效率，释放更多时间专注于真正重要的事情。
            </p>
          </div>
          {[
            { title: '产品', links: [
              { name: '功能特性', href: '#features' },
              { name: '支持模型', href: '#models' },
              { name: '定价方案', href: '#pricing' },
              { name: '免费 API 推荐', href: 'http://127.0.0.1:1680/free-api.html', target: '_blank' }
            ]},
            { title: '资源', links: [
              { name: '使用文档', href: '#' },
              { name: '常见问题', href: '#faq' },
              { name: 'GitHub', href: 'https://github.com/porozykey-eng/airepeat-home', target: '_blank' }
            ]},
            { title: '联系', links: [
              { name: '关于我们', href: '#about' },
              { name: '隐私政策', href: '#privacy' }
            ]},
          ].map((col, i) => (
            <div key={i}>
              <h4 className="font-semibold mb-4 text-sm uppercase tracking-wider text-white/60">{col.title}</h4>
              <ul className="space-y-3">
                {col.links.map((link, j) => (
                  <li key={j}>
                    <a href={link.href} target={link.target || '_self'} className="text-white/40 hover:text-white text-sm transition-colors">{link.name}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        
        <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-white/30 text-sm">© 2025 ChatGenius AI. All rights reserved.</p>
          <div className="flex gap-3">
            {[
              { Icon: Twitter, label: 'Twitter' },
              { Icon: MessageCircle, label: 'Discord' },
              { Icon: Github, label: 'GitHub' },
            ].map(({ Icon, label }, i) => (
              <a key={i} href="#" title={label} className="w-10 h-10 rounded-xl bg-white/5 hover:bg-violet-600 flex items-center justify-center transition-all group">
                <Icon className="w-5 h-5 text-white/40 group-hover:text-white transition-colors" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}

// ==================== Main App ====================
function App() {
  const [isDownloading, setIsDownloading] = useState(false)
  const [downloadCount, setDownloadCount] = useState(0)
  const DOWNLOAD_COOLDOWN = 5000 // 5 秒冷却时间
  const MAX_DOWNLOADS_PER_SESSION = 3 // 每会话最多下载 3 次

  const handleDownload = () => {
    // 1. 防重复点击检查
    if (isDownloading) {
      console.log('下载正在进行中，请勿重复点击')
      return
    }
    
    // 2. 下载频率限制检查
    if (downloadCount >= MAX_DOWNLOADS_PER_SESSION) {
      alert('您已达到本次访问的最大下载次数，请稍后再试')
      return
    }
    
    // 3. 简单的人机验证（检查点击间隔）
    const lastDownloadTime = localStorage.getItem('lastDownloadTime')
    if (lastDownloadTime) {
      const timeDiff = Date.now() - parseInt(lastDownloadTime)
      if (timeDiff < DOWNLOAD_COOLDOWN) {
        const remainingTime = Math.ceil((DOWNLOAD_COOLDOWN - timeDiff) / 1000)
        alert(`下载过于频繁，请 ${remainingTime} 秒后再试`)
        return
      }
    }
    
    // 4. 设置下载状态和记录
    setIsDownloading(true)
    setDownloadCount(prev => prev + 1)
    localStorage.setItem('lastDownloadTime', Date.now().toString())
    
    try {
      // 5. 执行下载
      const link = document.createElement('a')
      link.href = '/chatgenius-extension.zip'
      link.download = 'ChatGenius-AI-Extension.zip'
      link.target = '_blank'
      
      // 6. 添加下载完成/失败处理
      link.onload = () => {
        setIsDownloading(false)
      }
      
      link.onerror = () => {
        alert('下载失败，请稍后重试')
        setIsDownloading(false)
      }
      
      link.click()
      
      // 7. 重置下载状态（延迟后）
      setTimeout(() => {
        setIsDownloading(false)
      }, 2000)
      
    } catch (error) {
      console.error('下载出错:', error)
      alert('下载失败，请重试')
      setIsDownloading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navigation onDownload={handleDownload} isDownloading={isDownloading} />
      <main>
        <HeroSection onDownload={handleDownload} isDownloading={isDownloading} />
        <BrowserMarquee />
        <FeaturesSection />
        <ModelsSection />
        <UseCasesSection />
        <PricingSection onDownload={handleDownload} />
        <TrustBadgesSection />
        <TestimonialsSection />
        <FAQSection />
        <CTASection onDownload={handleDownload} isDownloading={isDownloading} />
      </main>
      <Footer />
      <BackToTop />
    </div>
  )
}

export default App
