import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence, useScroll, useTransform, useInView } from 'framer-motion'
import { QRCodeSVG } from 'qrcode.react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { 
  MessageSquare, Zap, Users, Shield, Settings, Database,
  ChevronDown, Play, Download, Check, ArrowRight,
  MessageCircle, Bot, Sparkles, ArrowUp,
  Globe, TrendingUp, Send,
  Crown, Rocket, Target, MessageCircleQuestion, Clock,
  ShieldCheck, Award, X, AlertCircle, CheckCircle,
  Plane, HeadsetIcon, Handshake, Star, Twitter, Facebook, Linkedin, Github, BookOpen
} from 'lucide-react'
import { activationService } from './services/activationService'
import { invoiceService } from './services/invoiceService'

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
          className="fixed bottom-24 right-4 sm:bottom-8 sm:right-8 z-50 w-10 h-10 sm:w-14 sm:h-14 bg-gradient-to-br from-violet-600 to-purple-600 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-glow-lg hover:shadow-glow transition-all group"
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
  const [step, setStep] = useState<'payment' | 'qrcode' | 'success'>('payment')
  const [activationCode, setActivationCode] = useState('')
  const [codeError, setCodeError] = useState('')
  const [loading, setLoading] = useState(false)
  const [paymentChannel, setPaymentChannel] = useState<'alipay' | 'wechat' | null>(null)
  const [orderNo, setOrderNo] = useState('')
  const [qrCode, setQrCode] = useState('')
  const [pollingTimer, setPollingTimer] = useState<ReturnType<typeof setInterval> | null>(null)

  // Handle payment channel selection - create order via server API
  const handlePayment = async (channel: 'alipay' | 'wechat') => {
    setPaymentChannel(channel)
    setLoading(true)
    setCodeError('')

    const result = await activationService.createOrder(
      plan?.name || '',
      plan?.price || '',
      plan?.type || 'lifetime',
      channel
    )

    setLoading(false)

    if (result.success) {
      setOrderNo(result.orderNo || '')
      if (result.orderNo) {
        sessionStorage.setItem('chatgenius_pending_order', result.orderNo)
      }

      if (channel === 'wechat' && result.codeUrl) {
        setQrCode(result.codeUrl)
        setStep('qrcode')
      } else if (result.payForm) {
        const newWindow = window.open('', '_blank')
        if (newWindow) {
          newWindow.document.write(result.payForm)
          newWindow.document.close()
        } else {
          document.write(result.payForm)
        }
      }
    } else {
      setCodeError(result.error || '创建订单失败')
    }
  }

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingTimer) clearInterval(pollingTimer)
    }
  }, [pollingTimer])

  const resetModal = () => {
    setStep('payment')
    setActivationCode('')
    setCodeError('')
    setPaymentChannel(null)
    setOrderNo('')
    setQrCode('')
    if (pollingTimer) {
      clearInterval(pollingTimer)
      setPollingTimer(null)
    }
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
                      disabled={loading}
                      className="w-full p-4 bg-[#1677FF]/10 hover:bg-[#1677FF]/20 border border-[#1677FF]/30 rounded-xl text-left transition-colors flex items-center gap-4 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <div className="w-10 h-10 bg-[#1677FF] rounded-lg flex items-center justify-center">
                        <span className="text-white font-bold text-lg">支</span>
                      </div>
                      <div className="flex-1">
                        <div className="text-white font-semibold">支付宝</div>
                        <div className="text-xs text-white/50">推荐中国大陆用户使用</div>
                      </div>
                      {loading && paymentChannel === 'alipay' ? (
                        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
                          <Sparkles className="w-5 h-5 text-white/60" />
                        </motion.div>
                      ) : (
                        <ArrowRight className="w-5 h-5 text-white/60" />
                      )}
                    </button>
                    <button
                      onClick={() => handlePayment('wechat')}
                      disabled={loading}
                      className="w-full p-4 bg-[#07C160]/10 hover:bg-[#07C160]/20 border border-[#07C160]/30 rounded-xl text-left transition-colors flex items-center gap-4 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <div className="w-10 h-10 bg-[#07C160] rounded-lg flex items-center justify-center">
                        <span className="text-white font-bold text-lg">微</span>
                      </div>
                      <div className="flex-1">
                        <div className="text-white font-semibold">微信支付</div>
                        <div className="text-xs text-white/50">微信扫码支付</div>
                      </div>
                      {loading && paymentChannel === 'wechat' ? (
                        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
                          <Sparkles className="w-5 h-5 text-white/60" />
                        </motion.div>
                      ) : (
                        <ArrowRight className="w-5 h-5 text-white/60" />
                      )}
                    </button>
                  </div>

                  {codeError && (
                    <motion.div
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg p-3"
                    >
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      <span>{codeError}</span>
                    </motion.div>
                  )}

                  <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 flex items-start gap-2">
                    <span className="text-amber-400 text-sm flex-shrink-0 mt-0.5">⚠️</span>
                    <p className="text-xs text-amber-200/90 leading-relaxed">
                      <span className="font-semibold">温馨提示：</span>如遇支付失败或风险提示，请暂时关闭全局代理/VPN，或使用手机流量扫码支付。
                    </p>
                  </div>
                </div>
              )}

              {step === 'qrcode' && (
                <div className="space-y-4 text-center">
                  <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                    {qrCode ? (
                      <div className="bg-white rounded-xl p-4 mx-auto mb-4 inline-block">
                        <QRCodeSVG value={qrCode} size={180} level="M" />
                      </div>
                    ) : (
                      <div className="w-32 h-32 bg-white rounded-xl mx-auto mb-4 flex items-center justify-center">
                        <div className="text-6xl">💳</div>
                      </div>
                    )}
                    <p className="text-white font-medium mb-2">
                      {paymentChannel === 'alipay' ? '支付宝扫码支付' : '微信扫码支付'}
                    </p>
                    <p className="text-white/50 text-sm mb-3">
                      支付金额: <span className="text-white font-bold">{plan.price}</span>
                    </p>
                    <p className="text-xs text-white/60">
                      订单号: {orderNo}
                    </p>
                  </div>
                  
                  <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
                    <p className="text-sm text-amber-300 font-medium mb-1">⏳ 等待支付</p>
                    <p className="text-xs text-white/60 mb-2">
                      请使用{paymentChannel === 'alipay' ? '支付宝' : '微信'}扫描二维码完成支付，支付成功后将自动跳转。
                    </p>
                    <p className="text-xs text-amber-200/90 leading-relaxed">
                      <span className="font-semibold">⚠️ 温馨提示：</span>如遇支付失败或风险提示，请暂时关闭全局代理/VPN，或使用手机流量扫码支付。
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => { if (pollingTimer) clearInterval(pollingTimer); setStep('payment') }}
                      className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-medium transition-colors"
                    >
                      重新选择
                    </button>
                    <button
                      onClick={() => {
                        if (navigator.clipboard && qrCode) {
                          navigator.clipboard.writeText(qrCode)
                        }
                      }}
                      className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-medium transition-colors"
                    >
                      复制二维码链接
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
                    <div className="bg-white/5 rounded-xl p-4 mb-4">
                      <p className="text-xs text-white/60 mb-2">您的激活码（请复制并在扩展中输入）</p>
                      <p className="text-lg font-mono text-white mb-3">{activationCode}</p>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(activationCode);
                        }}
                        className="px-3 py-1 bg-violet-600 hover:bg-violet-700 text-white text-sm rounded-lg transition-colors"
                      >
                        复制激活码
                      </button>
                    </div>
                  )}
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 mb-4 text-left">
                    <p className="text-sm text-blue-300 mb-2 font-semibold">📌 下一步：在浏览器扩展中激活</p>
                    <ol className="text-xs text-white/70 space-y-1 list-decimal list-inside">
                      <li>点击浏览器工具栏的 ChatGenius 扩展图标</li>
                      <li>选择"设置"或"Options"</li>
                      <li>在页面底部找到"激活产品"区域</li>
                      <li>粘贴激活码并点击"激活"</li>
                    </ol>
                  </div>
                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 mb-4 text-left">
                    <p className="text-xs text-amber-200/90 leading-relaxed">
                      <span className="font-semibold">📧 邮件提醒：</span>激活码已发送至您的邮箱，若未收到，请检查垃圾邮件夹（Spam Folder）。如有问题请联系客服。
                    </p>
                  </div>
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
                <div className="flex items-center justify-center gap-4 text-xs text-white/60">
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

// ==================== Demo Modal ====================
function DemoModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [currentStep, setCurrentStep] = useState(0)
  
  const demoSteps = [
    { title: '安装扩展', desc: '一键安装到 Chrome 浏览器' },
    { title: '配置 API', desc: '输入您的 AI 服务商 API Key' },
    { title: '打开 WhatsApp', desc: '访问 WhatsApp Web 或 Messenger' },
    { title: '点击生成', desc: '点击悬浮按钮，AI 自动生成回复' },
  ]
  
  useEffect(() => {
    if (!isOpen) return
    setCurrentStep(0)
    const interval = setInterval(() => {
      setCurrentStep((prev) => (prev + 1) % demoSteps.length)
    }, 2000)
    return () => clearInterval(interval)
  }, [isOpen])
  
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-4xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl border border-white/10 shadow-2xl overflow-hidden"
          >
            <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">30 秒产品演示</h2>
              <button onClick={onClose} className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-8">
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  {demoSteps.map((step, i) => (
                    <motion.div
                      key={i}
                      className={`p-4 rounded-xl border transition-all ${
                        i === currentStep 
                          ? 'bg-violet-600/20 border-violet-500/50' 
                          : 'bg-white/5 border-white/10'
                      }`}
                      animate={i === currentStep ? { scale: 1.05 } : { scale: 1 }}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          i === currentStep ? 'bg-violet-600' : 'bg-white/10'
                        }`}>
                          <span className="text-white font-bold">{i + 1}</span>
                        </div>
                        <div>
                          <div className="text-white font-semibold">{step.title}</div>
                          <div className="text-sm text-white/50">{step.desc}</div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
                
                <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                  <div className="text-center mb-4">
                    <div className="text-6xl mb-2">💬</div>
                    <p className="text-white font-medium">WhatsApp Web 演示</p>
                  </div>
                  <div className="space-y-3">
                    <div className="bg-white/10 rounded-lg p-3">
                      <p className="text-white/90 text-sm">Hi, I'm interested in your products...</p>
                    </div>
                    <motion.div 
                      className="bg-gradient-to-r from-violet-600 to-purple-600 rounded-lg p-3"
                      animate={{ opacity: currentStep === 3 ? 1 : 0.5 }}
                    >
                      <p className="text-white text-sm">Hello! Thank you for your interest...</p>
                    </motion.div>
                  </div>
                </div>
              </div>
            </div>
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
            <a href="/guide/" target="_blank" rel="noopener noreferrer" className="text-white/60 hover:text-white transition-colors font-medium flex items-center gap-1">
              <BookOpen className="w-4 h-4" />
              配置指南
            </a>
            
            {/* 滚动后显示免费安装按钮 - 带 pulse 动画 */}
            {scrolled && (
              <motion.button
                initial={{ opacity: 0, x: 20, scale: 0.9 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                onClick={onDownload}
                disabled={isDownloading}
                className={`flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl font-semibold text-sm transition-all shadow-lg hover:shadow-xl hover:scale-105 ${
                  isDownloading 
                    ? 'opacity-50 cursor-not-allowed' 
                    : 'hover:opacity-90 animate-pulse'
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
                    <span>添加到 Chrome - 免费</span>
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
                <a href="/guide/" target="_blank" rel="noopener noreferrer" onClick={() => setMobileMenuOpen(false)} className="text-white/60 hover:text-white transition-colors font-medium py-2 flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  配置指南
                </a>
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
  const [showDemoModal, setShowDemoModal] = useState(false)
  
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
    <section className="relative min-h-screen lg:min-h-[90vh] flex items-center justify-center overflow-hidden pt-20 pb-10 lg:pt-20 lg:pb-0 noise" style={{ backgroundColor: 'hsl(220 20% 6%)' }}>
      {/* Animated Background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-hero" style={{ background: 'radial-gradient(ellipse 80% 50% at 50% -20%, hsl(262 95% 65% / 0.15), hsl(220 20% 6%))' }} />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-transparent" />
        
        <FloatElement delay={0} duration={8}>
          <div className="absolute top-20 right-10 w-[300px] h-[300px] lg:w-[600px] lg:h-[600px] bg-gradient-to-br from-violet-600/20 to-purple-600/10 rounded-full blur-3xl" />
        </FloatElement>
        
        <div className="absolute inset-0 bg-[linear-gradient(rgba(139,92,246,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(139,92,246,0.03)_1px,transparent_1px)] bg-[size:80px_80px]" />
        
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-violet-500 rounded-full animate-pulse shadow-glow" />
      </div>
      
      <motion.div style={{ y, opacity }} className="container max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">
          <motion.div 
            initial="hidden" 
            animate="visible" 
            variants={stagger}
            className="text-center lg:text-left order-2 lg:order-1"
          >
            <motion.div variants={fadeInUp} className="inline-flex items-center gap-2 glass rounded-full px-5 py-2 mb-8 border border-white/10">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-sm font-medium text-white/80">支持 DeepSeek V3 / GPT-4.5 / Kimi K2.5</span>
            </motion.div>
            
            <motion.h1 variants={fadeInUp} className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tight mb-6 leading-[1.1]">
              <span className="text-white">让 AI 帮你</span>
              <br />
              <span className="text-gradient">秒回消息</span>
            </motion.h1>
            
            <motion.p variants={fadeInUp} className="text-base sm:text-lg md:text-xl text-white/60 mb-6 max-w-lg mx-auto lg:mx-0 leading-relaxed">
              支持 40+ 主流 AI 模型，一键生成专业回复。适用于 WhatsApp Web 和 Messenger Web，外贸、客服、销售的必备神器。
            </motion.p>
            
            {/* Support badges */}
            <motion.div variants={fadeInUp} className="flex flex-wrap gap-3 justify-center lg:justify-start mb-10">
              <a href="https://web.whatsapp.com/" target="_blank" rel="nofollow" className="flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/20 hover:bg-green-500/20 transition-colors">
                <img src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" alt="WhatsApp" className="w-5 h-5" loading="lazy" decoding="async" />
                <span className="text-sm text-green-400 font-medium">WhatsApp Web</span>
              </a>
              <a href="https://www.messenger.com/" target="_blank" rel="nofollow" className="flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/20 transition-colors">
                <img src="https://upload.wikimedia.org/wikipedia/commons/b/be/Facebook_Messenger_logo_2020.svg" alt="Messenger" className="w-5 h-5" loading="lazy" decoding="async" />
                <span className="text-sm text-blue-400 font-medium">Messenger Web</span>
              </a>
            </motion.div>
            
            <motion.div variants={fadeInUp} className="flex flex-wrap gap-3 sm:gap-4 justify-center lg:justify-start mb-8 sm:mb-12">
              <Button 
                onClick={onDownload}
                disabled={isDownloading}
                className={`bg-gradient-to-r from-violet-600 to-purple-600 hover:opacity-90 shadow-glow-lg hover:shadow-glow text-white px-6 py-4 sm:px-8 sm:py-7 text-base sm:text-lg rounded-xl sm:rounded-2xl group shimmer cursor-pointer transition-all ${
                  isDownloading ? 'opacity-50 cursor-not-allowed' : ''
                }`} 
                size="xl"
              >
                {isDownloading ? (
                  <>
                    <svg className="animate-spin w-4 h-4 sm:w-5 sm:h-5 mr-2" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                    </svg>
                    <span>下载中...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                    <span>添加到 Chrome - 免费</span>
                    <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowDemoModal(true)}
                className="px-6 py-4 sm:px-8 sm:py-7 text-base sm:text-lg rounded-xl sm:rounded-2xl border-white/20 text-white hover:bg-white/10" 
                size="xl"
              >
                <Play className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                30 秒演示
              </Button>
            </motion.div>
            
            <motion.div variants={fadeInUp} className="grid grid-cols-3 gap-4 sm:gap-6 md:gap-8">
              {[
                { value: 40, suffix: '+', label: 'AI 模型' },
                { value: 8000, suffix: '+', label: '活跃用户' },
                { value: 10, suffix: 'x', label: '效率提升' },
              ].map((stat, i) => (
                <div key={i} className="text-center lg:text-left">
                  <div className="text-3xl md:text-4xl font-black text-gradient">
                    <AnimatedCounter end={stat.value} suffix={stat.suffix} />
                  </div>
                  <div className="text-sm text-white/60 mt-1">{stat.label}</div>
                </div>
              ))}
            </motion.div>
          </motion.div>
          
          {/* Demo Window with Animated Input */}
          <motion.div 
            initial={{ opacity: 0, x: 50, rotateY: -10 }}
            animate={{ opacity: 1, x: 0, rotateY: 0 }}
            transition={{ duration: 1, delay: 0.3 }}
            className="relative order-1 lg:order-2 mb-8 lg:mb-0"
          >
            <FloatElement duration={5}>
              <div className="relative">
                <div className="absolute -inset-4 lg:-inset-8 bg-gradient-to-br from-violet-600/30 to-purple-600/20 rounded-3xl blur-2xl" />
                
                <div className="relative glass rounded-2xl sm:rounded-3xl border border-white/10 overflow-hidden shadow-2xl">
                  <div className="bg-white/5 px-4 sm:px-6 py-3 sm:py-4 flex items-center gap-3 border-b border-white/5">
                    <div className="flex gap-2">
                      <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-red-500" />
                      <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-yellow-500" />
                      <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-green-500" />
                    </div>
                    <span className="text-xs sm:text-sm text-white/50 flex-1 text-center font-medium">WhatsApp Web</span>
                  </div>
                  
                  <div className="p-4 sm:p-6 space-y-4 bg-gradient-to-b from-white/5 to-transparent min-h-[280px] sm:min-h-[320px]">
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
                          <span className="text-white/50">输入消息...</span>
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
      
      {/* Demo Modal */}
      <DemoModal isOpen={showDemoModal} onClose={() => setShowDemoModal(false)} />
    </section>
  )
}

// ==================== Browser Marquee ====================
function BrowserMarquee() {
  const browsers = [
    { name: 'Chrome', logo: './icons/chrome.svg' },
    { name: 'Edge', logo: './icons/edge.svg' },
    { name: 'Brave', logo: './icons/brave.svg' },
    { name: 'Opera', logo: './icons/opera.svg' },
    { name: 'Vivaldi', logo: './icons/vivaldi.svg' },
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
                    loading="lazy"
                    decoding="async"
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
                <div className="text-xs text-white/60">{badge.desc}</div>
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
                      <div className="text-xs text-white/60 mt-1">{feature.highlight}</div>
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
    { nameCn: 'DeepSeek', nameEn: '深度求索 · 性价比之王', logo: './icons/deepseek.svg', color: 'from-blue-600 to-blue-800', bgColor: 'bg-blue-600/25', borderColor: 'border-blue-500/50', hoverBg: 'hover:bg-blue-600/30' },
    { nameCn: 'OpenAI', nameEn: 'GPT-4.5 · 行业标杆', logo: './icons/openai.svg', color: 'from-emerald-500 to-green-500', bgColor: 'bg-emerald-500/20', borderColor: 'border-emerald-400/40', hoverBg: 'hover:bg-emerald-500/25' },
    { nameCn: 'Kimi', nameEn: '月之暗面 · 超长上下文', logo: './icons/kimi.svg', color: 'from-purple-500 to-pink-500', bgColor: 'bg-purple-500/20', borderColor: 'border-purple-400/40', hoverBg: 'hover:bg-purple-500/25' },
    { nameCn: 'Qwen', nameEn: '通义千问 · 阿里出品', logo: './icons/qwen.svg', color: 'from-orange-500 to-amber-500', bgColor: 'bg-orange-500/20', borderColor: 'border-orange-400/40', hoverBg: 'hover:bg-orange-500/25' },
    { nameCn: 'GLM', nameEn: '智谱清言 · 中文优化', logo: './icons/ZHIPU.svg', color: 'from-violet-500 to-indigo-500', bgColor: 'bg-violet-500/20', borderColor: 'border-violet-400/40', hoverBg: 'hover:bg-violet-500/25' },
    { nameCn: 'Doubao', nameEn: '豆包 · 字节跳动', logo: './icons/doubao.svg', color: 'from-cyan-500 to-teal-500', bgColor: 'bg-cyan-500/20', borderColor: 'border-cyan-400/40', hoverBg: 'hover:bg-cyan-500/25' },
    { nameCn: 'Gemini', nameEn: '谷歌双子 · 多模态', logo: './icons/gemini.svg', color: 'from-blue-600 to-indigo-600', bgColor: 'bg-blue-600/20', borderColor: 'border-blue-500/40', hoverBg: 'hover:bg-blue-600/25' },
    { nameCn: 'Claude', nameEn: 'Anthropic · 安全AI', logo: './icons/Claude.svg', color: 'from-red-600 to-red-800', bgColor: 'bg-red-600/25', borderColor: 'border-red-500/50', hoverBg: 'hover:bg-red-600/30' },
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
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 sm:gap-6"
        >
          {models.map((model, i) => (
            <motion.div
              key={i}
              variants={scaleIn}
              whileHover={{ y: -8, scale: 1.03 }}
              className="group cursor-pointer"
            >
              <div className={`relative overflow-hidden rounded-2xl border ${model.borderColor} ${model.bgColor} ${model.hoverBg} transition-all duration-300 h-full p-6 backdrop-blur-sm`}>
                {/* Background gradient */}
                <div className={`absolute inset-0 bg-gradient-to-br ${model.color} opacity-10 group-hover:opacity-20 transition-opacity duration-300`} />
                
                {/* Top accent line */}
                <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${model.color} opacity-80 group-hover:opacity-100 transition-opacity`} />
                
                <div className="relative z-10 text-center">
                  <div className={`w-16 h-16 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-all duration-300 rounded-xl ${
                    model.nameCn === 'DeepSeek' || model.nameCn === 'Claude' 
                      ? 'bg-white/90 shadow-lg' 
                      : `bg-gradient-to-br ${model.color} shadow-lg`
                  } p-2.5`}>
                    {model.logo ? (
                      <img 
                        src={model.logo} 
                        alt={model.nameCn} 
                        className="w-full h-full"
                        style={{ objectFit: 'contain' }}
                        loading="lazy"
                      />
                    ) : (
                      <Globe className="w-8 h-8 text-white" />
                    )}
                  </div>
                  <h3 className="font-bold text-xl text-white mb-1">{model.nameCn}</h3>
                  <p className="text-xs text-white/50 leading-relaxed">{model.nameEn}</p>
                </div>
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

// ==================== User Testimonials Section ====================
function TestimonialsSection() {
  const testimonials = [
    {
      name: '李明',
      role: '外贸业务员',
      avatar: '👨‍💼',
      rating: 5,
      content: '使用 ChatGenius 3 个月，回复效率提升了 300%！AI 生成的英文邮件非常专业，客户反馈很好。',
      metric: '效率提升 300%'
    },
    {
      name: '王芳',
      role: '客服主管',
      avatar: '👩‍💻',
      rating: 5,
      content: '团队 10 人都在用，培训成本降低了 60%。新员工上手更快，回复质量统一。',
      metric: '培训成本降低 60%'
    },
    {
      name: '张伟',
      role: '销售经理',
      avatar: '👨‍💼',
      rating: 5,
      content: '成交率提升了 45%，AI 能根据客户画像生成个性化话术，非常智能。',
      metric: '成交率提升 45%'
    },
    {
      name: '刘洋',
      role: '跨境电商 CEO',
      avatar: '👩‍💼',
      rating: 5,
      content: '这是我们团队必备的工具，每天节省至少 2 小时，ROI 非常高。',
      metric: '每天节省 2 小时'
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
            <Star className="w-4 h-4 text-yellow-400" />
            <span className="text-sm font-medium text-yellow-300">用户评价</span>
          </motion.div>
          <motion.h2 variants={fadeInUp} className="text-4xl md:text-5xl lg:text-6xl font-black mb-6">
            <span className="text-white">深受</span>
            <span className="text-gradient">用户信赖</span>
          </motion.h2>
          <motion.p variants={fadeInUp} className="text-white/50 text-lg max-w-2xl mx-auto">
            8000+ 活跃用户的共同选择，看看他们怎么说
          </motion.p>
        </motion.div>
        
        <motion.div 
          initial="hidden" 
          whileInView="visible" 
          viewport={{ once: true }}
          variants={stagger}
          className="grid md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {testimonials.map((testimonial, i) => (
            <motion.div key={i} variants={fadeInUp}>
              <div className="glass rounded-2xl p-6 border border-white/5 hover:border-white/15 transition-all h-full">
                <div className="flex items-center gap-3 mb-4">
                  <div className="text-4xl">{testimonial.avatar}</div>
                  <div>
                    <div className="text-white font-semibold">{testimonial.name}</div>
                    <div className="text-sm text-white/50">{testimonial.role}</div>
                  </div>
                </div>
                
                <div className="flex gap-1 mb-3">
                  {[...Array(testimonial.rating)].map((_, j) => (
                    <Star key={j} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
                
                <p className="text-white/70 text-sm mb-4 leading-relaxed">{testimonial.content}</p>
                
                <div className="pt-4 border-t border-white/10">
                  <div className="text-gradient font-bold">{testimonial.metric}</div>
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
      price: '¥0',
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
      price: '¥68',
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
      price: '¥98',
      originalPrice: '¥198',
      period: '/ 永久',
      desc: '一次付费，终身使用，仅比年付多 ¥30',
      features: [
        '年付版所有功能',
        '终身免费更新',
        '永久技术支持',
        '无需续费',
        '一次投入，终身受益'
      ],
      limitations: [],
      cta: '立即购买',
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
                <span className="font-bold text-gradient-gold animate-pulse">Pro 版限时特惠，永久版仅需 ¥98</span>
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
                          <p key={j} className="text-xs text-white/60">• {limit}</p>
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

// ==================== FAQ Section ====================
function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  
  const faqs = [
    { 
      q: '如何安装 Chrome 扩展？', 
      a: `安装步骤非常简单：

1. 点击页面上的"免费下载"按钮下载扩展文件
2. 解压下载的 ZIP 文件
3. 打开 Chrome 浏览器，访问 chrome://extensions/
4. 开启右上角的"开发者模式"
5. 点击"加载已解压的扩展程序"，选择解压后的文件夹

完成以上步骤即可开始使用！整个过程只需 1-2 分钟。`
    },
    { 
      q: 'Pro 版真的是永久使用吗？', 
      a: `是的，完全真实！

✅ 一次付费 ¥98，终身使用
✅ 所有未来功能更新完全免费
✅ 无需任何额外费用
✅ 永久技术支持

购买后您将收到激活码，在扩展设置中输入即可解锁 Pro 功能。`
    },
    { 
      q: '支持哪些支付方式？', 
      a: `我们支持多种支付方式：

💳 支付宝 - 推荐中国大陆用户使用
💚 微信支付 - 扫码支付便捷

所有支付过程安全加密，您的信息安全有保障。`
    },
    { 
      q: '购买后可以退款吗？', 
      a: `当然可以！

🔄 支持 7 天无理由退款
💯 如果您对产品不满意
📞 联系客服即可办理全额退款

我们承诺：无任何隐藏条款，退款流程简单快捷。`
    },
    { 
      q: '免费版有什么限制？', 
      a: `免费版功能已经非常实用：

✉️ 每天回复 20 次
👤 1 个自定义角色
📚 5 条 FAQ 知识库
🎯 支持 40+ AI 模型

适合轻度用户尝鲜体验。如需无限制使用，建议升级到 Pro 版。`
    },
    { 
      q: '如何获取 API Key？', 
      a: `根据您选择的 AI 服务商获取：

🔑 DeepSeek: platform.deepseek.com
🔑 OpenAI: platform.openai.com
🔑 Kimi: platform.moonshot.cn
🔑 通义千问: dashscope.console.aliyun.com

大多数平台提供免费额度，新用户注册即可使用。`
    },
    { 
      q: '我的 API Key 会被上传到服务器吗？', 
      a: `绝对不会！

🔒 API Key 仅存储在浏览器本地
🛡️ 所有 API 请求直接发送到 AI 服务商
❌ 我们不经过任何中间服务器
✅ 数据加密传输，安全可靠

您的隐私和数据安全是我们的首要考虑。`
    },
    { 
      q: '支持哪些浏览器？', 
      a: `目前支持的浏览器：

✅ Chrome（推荐）
✅ Edge
✅ Brave
✅ Arc
✅ 其他 Chromium 内核浏览器

🚧 Firefox 和 Safari 支持正在开发中，敬请期待！`
    },
    {
      q: '使用 ChatGenius 需要额外付费吗？',
      a: `产品本身免费，但使用 AI 功能需要：

📦 免费版：每天 20 次免费回复
🔑 Pro 版：¥98 解锁无限回复
💰 API 费用：由 AI 服务商收取

大多数平台提供免费额度，轻度使用基本免费。
大量使用建议选择 Pro 版 + 付费 API 额度。`
    },
    {
      q: '与其他 AI 回复工具相比有什么优势？',
      a: `ChatGenius 的核心优势：

🎯 支持 40+ 主流 AI 模型（竞品通常仅 1-2 个）
🔒 100% 本地存储，无中间服务器
⚡ 3 秒极速响应
👥 自定义角色 + 知识库
💰 价格仅为竞品 1/3
🌐 支持 WhatsApp 和 Messenger

我们是功能最全面、最安全的 AI 回复工具。`
    },
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
          <motion.h2 variants={fadeInUp} className="text-4xl md:text-5xl font-black text-white mb-4">FAQ</motion.h2>
          <motion.p variants={fadeInUp} className="text-white/50 text-lg">
            找不到答案？<button className="text-violet-400 hover:text-violet-300 underline">联系客服</button>
          </motion.p>
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
                  <div className={`min-w-[44px] min-h-[44px] w-8 h-8 rounded-full flex items-center justify-center transition-all active:scale-95 ${
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
                      <div className="pt-6 text-white/60 whitespace-pre-line leading-relaxed space-y-3">
                        {faq.a.split('\n').map((line, idx) => (
                          <div key={idx}>
                            {line.trim() ? (
                              <p className="text-base">{line}</p>
                            ) : (
                              <div className="h-3" />
                            )}
                          </div>
                        ))}
                      </div>
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
            免费安装，立即体验 AI 智能回复的魅力。Pro 版仅需 ¥98，终身使用。
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
        <div className="grid md:grid-cols-4 gap-12 mb-12">
          <div className="md:col-span-2">
            <a href="#" className="flex items-center gap-3 mb-4">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-glow">
                <MessageSquare className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white">ChatGenius AI</span>
            </a>
            <p className="text-white/60 text-sm leading-relaxed max-w-xs">
              让 AI 成为您的聊天助手，提升沟通效率，释放更多时间专注于真正重要的事情。
            </p>
            <div className="mt-4 flex items-center gap-2 px-3 py-2 rounded-lg bg-green-500/10 border border-green-500/20 max-w-xs">
              <Shield className="w-4 h-4 text-green-400 flex-shrink-0" />
              <span className="text-green-300/80 text-xs leading-relaxed">数据本地处理，不存储聊天记录和商业数据</span>
            </div>
          </div>
          {[
            { title: '产品', links: [
              { name: '功能特性', href: '#features' },
              { name: '支持模型', href: '#models' },
              { name: '定价方案', href: '#pricing' }
            ]},
            { title: '资源', links: [
              { name: '常见问题', href: '#faq' }
            ]},
          ].map((col, i) => (
            <div key={i}>
              <h4 className="font-semibold mb-4 text-sm uppercase tracking-wider text-white/60">{col.title}</h4>
              <ul className="space-y-3">
                {col.links.map((link, j) => (
                  <li key={j}>
                    <a href={link.href} className="text-white/60 hover:text-white text-sm transition-colors">{link.name}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row items-center justify-between gap-6">
          {/* 社交媒体链接 */}
          <div className="flex items-center gap-4">
            <span className="text-white/50 text-sm">关注我们：</span>
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" 
               className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition-all hover:scale-110">
              <Twitter className="w-5 h-5" />
            </a>
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer"
               className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition-all hover:scale-110">
              <Facebook className="w-5 h-5" />
            </a>
            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer"
               className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition-all hover:scale-110">
              <Linkedin className="w-5 h-5" />
            </a>
            <a href="https://github.com" target="_blank" rel="noopener noreferrer"
               className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition-all hover:scale-110">
              <Github className="w-5 h-5" />
            </a>
          </div>
          
          <p className="text-white/50 text-sm">© 2026 ChatGenius AI. All rights reserved.</p>
        </div>

        <div className="mt-6 pt-6 border-t border-white/5">
          <p className="text-white/40 text-xs leading-relaxed text-center max-w-3xl mx-auto">
            隐私声明：本插件仅在本地浏览器运行，聊天数据与预设 Prompt 直接与大模型厂商加密交互，我们不存储任何您的聊天记录和商业数据。
          </p>
        </div>
      </div>
    </footer>
  )
}

// ==================== Main App ====================
function App() {
  const [isDownloading, setIsDownloading] = useState(false)
  const [downloadCount, setDownloadCount] = useState(0)
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'success' | 'failed' | null>(null)
  const [paymentOrderNo, setPaymentOrderNo] = useState('')
  const [showInvoiceModal, setShowInvoiceModal] = useState(false)
  const [qqGroup, setQqGroup] = useState('')
  const [qqGroupLink, setQqGroupLink] = useState('')
  const DOWNLOAD_COOLDOWN = 5000 // 5 秒冷却时间
  const MAX_DOWNLOADS_PER_SESSION = 3 // 每会话最多下载 3 次

  // 获取售后QQ群配置
  useEffect(() => {
    fetch('/api/admin/public-settings')
      .then(res => res.json())
      .then(data => {
        if (data['contact.qqGroup']) setQqGroup(data['contact.qqGroup'])
        if (data['contact.qqGroupLink']) setQqGroupLink(data['contact.qqGroupLink'])
      })
      .catch(() => {})
  }, [])

  // 检测支付返回
  useEffect(() => {
    const pendingOrder = sessionStorage.getItem('chatgenius_pending_order')
    if (pendingOrder) {
      setPaymentOrderNo(pendingOrder)
      setPaymentStatus('pending')
      sessionStorage.removeItem('chatgenius_pending_order')

      // 轮询订单状态
      const checkPayment = async () => {
        let attempts = 0
        const maxAttempts = 20 // 最多轮询 20 次（约 1 分钟）

        const poll = async () => {
          try {
            const status = await activationService.queryPaymentStatus(pendingOrder)
            if (status.paid) {
              setPaymentStatus('success')
              return
            }
            attempts++
            if (attempts < maxAttempts) {
              setTimeout(poll, 3000) // 每 3 秒轮询一次
            } else {
              setPaymentStatus('failed')
            }
          } catch (error) {
            console.error('Payment status check error:', error)
            attempts++
            if (attempts < maxAttempts) {
              setTimeout(poll, 3000)
            } else {
              setPaymentStatus('failed')
            }
          }
        }

        poll()
      }

      checkPayment()
    }
  }, [])

  const handleDownload = async () => {
    // 1. 防重复点击检查
    if (isDownloading) {
      return
    }

    // 2. 下载频率限制检查（用 sessionStorage，关闭标签即清除，不跨会话残留）
    if (downloadCount >= MAX_DOWNLOADS_PER_SESSION) {
      console.warn('[Download] 已达本次会话下载上限')
      return
    }

    // 3. 冷却时间检查（sessionStorage，避免 localStorage 跨会话残留导致首次点击无反应）
    const lastDownloadTime = sessionStorage.getItem('lastDownloadTime')
    if (lastDownloadTime) {
      const timeDiff = Date.now() - parseInt(lastDownloadTime)
      if (timeDiff < DOWNLOAD_COOLDOWN) {
        console.warn(`[Download] 冷却中，剩余 ${Math.ceil((DOWNLOAD_COOLDOWN - timeDiff) / 1000)}s`)
        return
      }
    }

    // 4. 设置下载状态和记录
    setIsDownloading(true)
    setDownloadCount(prev => prev + 1)
    sessionStorage.setItem('lastDownloadTime', Date.now().toString())

    try {
      // 5. 用 <a download target=_blank> 触发下载，浏览器原生处理最快
      //    target=_blank 在新标签页打开，主页面 UI 不被阻塞；download 属性指定文件名
      //    服务端已设 Content-Disposition: attachment，新标签会立即触发下载后自动关闭
      const link = document.createElement('a')
      link.href = `/extension.zip?t=${Date.now()}`
      link.download = 'ChatGenius-AI-Extension.zip'
      link.target = '_blank'
      link.rel = 'noopener'
      link.style.display = 'none'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.error('[Download] 下载失败:', error)
      // 回退方案：直接跳转下载
      window.location.href = `/extension.zip?t=${Date.now()}`
    } finally {
      // 6. 快速恢复按钮（300ms 防抖即可，无需长时间禁用）
      setTimeout(() => setIsDownloading(false), 300)
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* 支付状态提示 */}
      {paymentStatus && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className={`px-6 py-4 rounded-xl shadow-2xl border backdrop-blur-xl ${
            paymentStatus === 'success' 
              ? 'bg-green-500/10 border-green-500/30 text-green-400' 
              : paymentStatus === 'failed'
              ? 'bg-red-500/10 border-red-500/30 text-red-400'
              : 'bg-blue-500/10 border-blue-500/30 text-blue-400'
          }`}>
            <div className="flex items-center gap-3">
              {paymentStatus === 'success' && <CheckCircle className="w-5 h-5" />}
              {paymentStatus === 'failed' && <AlertCircle className="w-5 h-5" />}
              {paymentStatus === 'pending' && <Clock className="w-5 h-5 animate-pulse" />}
              <div>
                {paymentStatus === 'success' && (
            <div>
              <p className="font-semibold">支付成功！</p>
              <p className="text-sm text-white/60">订单号：{paymentOrderNo}</p>
              <button
                onClick={() => setShowInvoiceModal(true)}
                className="mt-2 text-xs text-blue-400 hover:text-blue-300 transition-colors underline"
              >
                申请发票
              </button>
              {qqGroup && (
                <div className="mt-2 pt-2 border-t border-white/10">
                  <p className="text-xs text-white/60">售后交流群：</p>
                  {qqGroupLink ? (
                    <a href={qqGroupLink} target="_blank" rel="noopener noreferrer"
                       className="text-xs text-blue-400 hover:text-blue-300 transition-colors underline">
                      QQ群 {qqGroup}（点击加群）
                    </a>
                  ) : (
                    <p className="text-xs text-white/80">QQ群：{qqGroup}</p>
                  )}
                </div>
              )}
            </div>
          )}
                {paymentStatus === 'failed' && (
                  <div>
                    <p className="font-semibold">支付未完成</p>
                    <p className="text-sm text-white/60">订单号：{paymentOrderNo}</p>
                  </div>
                )}
                {paymentStatus === 'pending' && (
                  <div>
                    <p className="font-semibold">正在确认支付状态...</p>
                    <p className="text-sm text-white/60">订单号：{paymentOrderNo}</p>
                  </div>
                )}
              </div>
              <button 
                onClick={() => setPaymentStatus(null)}
                className="ml-2 text-white/40 hover:text-white/80 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
      
      <Navigation onDownload={handleDownload} isDownloading={isDownloading} />
      <main>
        <HeroSection onDownload={handleDownload} isDownloading={isDownloading} />
        <BrowserMarquee />
        <FeaturesSection />
        <ModelsSection />
        <UseCasesSection />
        <TestimonialsSection />
        <PricingSection onDownload={handleDownload} />
        <TrustBadgesSection />
        <FAQSection />
        <CTASection onDownload={handleDownload} isDownloading={isDownloading} />
      </main>
      <Footer />
      <BackToTop />

      {/* 发票申请弹窗 */}
      {showInvoiceModal && (
        <InvoiceModal
          orderNo={paymentOrderNo}
          onClose={() => setShowInvoiceModal(false)}
        />
      )}
    </div>
  )
}

// ==================== 发票申请弹窗 ====================
function InvoiceModal({ orderNo, onClose }: { orderNo: string; onClose: () => void }) {
  const [invoiceType, setInvoiceType] = useState<'personal' | 'company'>('personal')
  const [title, setTitle] = useState('')
  const [taxNumber, setTaxNumber] = useState('')
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)

  const handleSubmit = async () => {
    if (!title.trim()) {
      setResult({ success: false, message: '请填写发票抬头' })
      return
    }
    if (invoiceType === 'company' && !taxNumber.trim()) {
      setResult({ success: false, message: '企业发票必须填写纳税人识别号' })
      return
    }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setResult({ success: false, message: '请填写有效的邮箱地址' })
      return
    }

    setSubmitting(true)
    setResult(null)

    const res = await invoiceService.submitInvoice({
      orderNo,
      invoiceType,
      title: title.trim(),
      taxNumber: taxNumber.trim() || undefined,
      email: email.trim(),
    })

    setSubmitting(false)
    setResult({
      success: res.success,
      message: res.success
        ? '发票申请已提交，我们将在 1-3 个工作日内处理并发送到您的邮箱'
        : res.error || '提交失败，请稍后重试',
    })
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-md p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-zinc-900 dark:text-white">申请电子发票</h3>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {result ? (
          <div className="text-center py-6">
            {result.success ? (
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
            ) : (
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
            )}
            <p className="text-sm text-zinc-700 dark:text-zinc-300 mb-4">{result.message}</p>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              关闭
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                发票类型
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setInvoiceType('personal')}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                    invoiceType === 'personal'
                      ? 'bg-blue-600 text-white'
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                  }`}
                >
                  个人
                </button>
                <button
                  onClick={() => setInvoiceType('company')}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                    invoiceType === 'company'
                      ? 'bg-blue-600 text-white'
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                  }`}
                >
                  企业
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                发票抬头 {invoiceType === 'company' && '*'}
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={invoiceType === 'company' ? '请输入企业全称' : '请输入个人姓名'}
                className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white text-sm focus:outline-none focus:border-blue-500"
              />
            </div>

            {invoiceType === 'company' && (
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                  纳税人识别号 *
                </label>
                <input
                  type="text"
                  value={taxNumber}
                  onChange={(e) => setTaxNumber(e.target.value.toUpperCase())}
                  placeholder="18位统一社会信用代码"
                  className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                接收邮箱 *
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="发票将发送到此邮箱"
                className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white text-sm focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="text-xs text-zinc-500 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg p-3">
              订单号：{orderNo}
              <br />
              发票将在 1-3 个工作日内开具并发送到您的邮箱
            </div>

            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {submitting ? '提交中...' : '提交申请'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default App
