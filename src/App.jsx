import { useState, useEffect, useRef } from 'react'
import { sendOrderPhoto, getManagerLink } from './utils/telegram'
import { categories, reviews, sizesShoes, sizesClothes } from './data/catalog'
import { defaultProducts } from './data/products'
import CloseIcon from './components/CloseIcon'
import AudioPlayer from './components/AudioPlayer'
import SplashScreen from './components/SplashScreen'
import AdminPanel from './components/AdminPanel'
import { AnimatePresence, motion } from 'framer-motion'

const HERO_BG = "/hero-bg-CtGpMX4r.jpg"
const AUDIO_SRC = "/1234567.ogg"

const loadProducts = () => {
  try {
    const cached = localStorage.getItem("vibestore_products")
    if (cached) {
      const parsed = JSON.parse(cached)
      if (Array.isArray(parsed) && parsed.length > 0) return parsed
    }
  } catch {}
  return defaultProducts
}

const saveProducts = (products) => {
  localStorage.setItem("vibestore_products", JSON.stringify(products))
}

function App() {
  const isAdminRoute = () => window.location.hash === "#/admin" || window.location.pathname === "/admin"
  const [splashDone, setSplashDone] = useState(() => isAdminRoute())
  const [adminOpen, setAdminOpen] = useState(() => isAdminRoute())
  const [logoTaps, setLogoTaps] = useState(0)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [selectedSize, setSelectedSize] = useState(null)
  const [catalogOpen, setCatalogOpen] = useState(false)
  const [cartOpen, setCartOpen] = useState(false)
  const [modalClosing, setModalClosing] = useState(false)
  const [rulesOpen, setRulesOpen] = useState(false)
  const [activeCategory, setActiveCategory] = useState("Усі товари")
  const [titleVisible, setTitleVisible] = useState(false)
  const [products, setProducts] = useState(loadProducts)
  const [cart, setCart] = useState(() => {
    try { return JSON.parse(localStorage.getItem("vibestore_cart") || "[]") }
    catch { return [] }
  })
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [checkoutStep, setCheckoutStep] = useState(1)
  const [clientInfo, setClientInfo] = useState({ fullName: "", phone: "", city: "", novaPoshta: "" })
  const [paymentMethod, setPaymentMethod] = useState(null)
  const [paymentType, setPaymentType] = useState(null)
  const [paymentConfirmed, setPaymentConfirmed] = useState(false)
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [screenshotFile, setScreenshotFile] = useState(null)
  const [orderSent, setOrderSent] = useState(false)
  const [sending, setSending] = useState(false)

  const titleRef = useRef()
  const footerRef = useRef()

  useEffect(() => {
    const checkHash = () => {
      if (window.location.hash === "#/admin") setAdminOpen(true)
    }
    window.addEventListener("hashchange", checkHash)
    checkHash()
    return () => window.removeEventListener("hashchange", checkHash)
  }, [])

  useEffect(() => {
    localStorage.setItem("vibestore_cart", JSON.stringify(cart))
  }, [cart])

  useEffect(() => {
    if (window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp
      tg.ready()
      tg.expand()
      tg.setHeaderColor("#0a0f1a")
    }
  }, [])

  useEffect(() => {
    const obs = new IntersectionObserver(
      entries => { entries.forEach(e => { if (e.isIntersecting) e.target.classList.add("is-visible") }) },
      { threshold: 0.1, rootMargin: "0px 0px -50px 0px" }
    )
    setTimeout(() => {
      document.querySelectorAll(".animated-title").forEach(el => obs.observe(el))
      if (titleRef.current) obs.observe(titleRef.current)
      if (footerRef.current) obs.observe(footerRef.current)
    }, 100)
    return () => obs.disconnect()
  }, [activeCategory])

  const handleLogoClick = () => {
    const next = logoTaps + 1
    setLogoTaps(next)
    if (next === 5) {
      setAdminOpen(true)
      setLogoTaps(0)
    }
    setTimeout(() => setLogoTaps(0), 2000)
  }

  const handleDeleteProduct = (id) => {
    if (!confirm("Видалити цей товар?")) return
    const updated = products.filter(p => p.id !== id)
    setProducts(updated)
    saveProducts(updated)
  }

  const addToCart = (product, size) => {
    setCart(prev => [...prev, { ...product, selectedSize: size, cartId: Date.now() }])
    setSelectedProduct(null)
    setSelectedSize(null)
  }

  const removeFromCart = (cartId) => {
    setCart(prev => prev.filter(item => item.cartId !== cartId))
  }

  const getCartTotal = () => {
    return cart.reduce((sum, item) => {
      const price = parseInt(item.price.replace(/\s/g, ""), 10) || 0
      return sum + price
    }, 0)
  }

  const getFilteredProducts = () => {
    if (activeCategory === "Усі товари") return products
    return products.filter(p => p.category === activeCategory)
  }

  const filteredProducts = getFilteredProducts()

  const openProductModal = (product) => {
    setSelectedProduct(product)
    setSelectedSize(null)
    setModalClosing(false)
  }

  const closeProductModal = () => {
    setModalClosing(true)
    setTimeout(() => {
      setSelectedProduct(null)
      setModalClosing(false)
    }, 300)
  }

  const isCheckoutReady = paymentConfirmed && termsAccepted && screenshotFile

  const submitOrder = async () => {
    if (!isCheckoutReady) return
    setSending(true)

    const total = getCartTotal()
    const half = Math.ceil(total / 2)
    const amountToPayNow = paymentType === "full" ? total : half
    const remainder = paymentType === "full" ? 0 : half

    const productList = cart.map(item => `- ${item.name} (${item.selectedSize}) — ${item.price} грн`).join("\n")
    const paymentLabel = { card: "Картка (Mono)", iban: "IBAN (ФОП ПУМБ)" }[paymentMethod] || "Не вибрано"
    const paymentTypeLabel = paymentType === "full" ? "Повна оплата (100%)" : "Передплата (50%)"

    const caption = `🚨 НОВЕ ЗАМОВЛЕННЯ — ПОТРЕБУЄ РУЧНОЇ ПЕРЕВІРКИ ОПЛАТИ

👤 КЛІЄНТ: ${clientInfo.fullName}
📞 ТЕЛЕФОН: ${clientInfo.phone}
📍 ЛОКАЦІЯ: ${clientInfo.city}, ${clientInfo.novaPoshta}
💳 ОПЛАТА: ${paymentLabel}
📊 ТИП ОПЛАТИ: ${paymentTypeLabel}
📦 ТОВАР:
${productList}

💰 СУМА ДО СПЛАТИ ЗАРАЗ: ${amountToPayNow} грн
📉 ЗАЛИШОК (ДОПЛАТА): ${remainder} грн`

    try {
      await sendOrderPhoto(screenshotFile, caption)
      setOrderSent(true)
      setCart([])

      setTimeout(() => {
        setCheckoutOpen(false)
        setClientInfo({ fullName: "", phone: "", city: "", novaPoshta: "" })
        setPaymentMethod(null)
        setPaymentType(null)
        setPaymentConfirmed(false)
        setTermsAccepted(false)
        setScreenshotFile(null)
        setOrderSent(false)
        setCheckoutStep(1)
      }, 3000)
    } catch (err) {
      console.error(err)
    }
    setSending(false)
  }

  const allSizes = selectedProduct?.category === "Кросівки"
    ? sizesShoes
    : sizesClothes

  if (adminOpen) {
    return (
      <AdminPanel
        products={products}
        setProducts={setProducts}
        saveProducts={saveProducts}
        onClose={() => { setAdminOpen(false); window.location.hash = "" }}
      />
    )
  }

  return (
    <div className="app-container">
      {!splashDone && <SplashScreen onDone={() => setSplashDone(true)} />}

      {/* ── Header ── */}
      <header className="main-header">
        <div className="nav-buttons">
          <button onClick={() => setCatalogOpen(true)} className="nav-pill-btn">КАТАЛОГ</button>
          <button onClick={() => setCartOpen(true)} className="nav-pill-btn">
            КОШИК [{cart.length}]
          </button>
        </div>
        <div className="logo-wrap">
          <h1 className="main-logo" onClick={handleLogoClick}>VIBE STORE</h1>
        </div>
      </header>

      {/* ── Drawer Overlay ── */}
      <div className={`drawer-overlay ${(catalogOpen || cartOpen) ? "visible" : ""}`}
        onClick={() => { setCatalogOpen(false); setCartOpen(false) }} />

      {/* ── Catalog Drawer ── */}
      <div className={`side-drawer left-drawer ${catalogOpen ? "open" : ""}`}>
        <CloseIcon onClick={() => setCatalogOpen(false)} />
        <h2 className="drawer-title">КАТАЛОГ</h2>
        <div className="catalog-content">
          <div className="catalog-section">
            <ul className="catalog-list">
              <li
                className={activeCategory === "Усі товари" ? "active-category" : ""}
                onClick={() => { setActiveCategory("Усі товари"); setCatalogOpen(false) }}
              >
                Усі товари
              </li>
            </ul>
          </div>
          {categories.map((section, idx) => (
            <div key={idx} className="catalog-section">
              <div className="catalog-subtitle">{section.title}</div>
              <ul className="catalog-list">
                {section.items.map(item => (
                  <li
                    key={item}
                    className={activeCategory === item ? "active-category" : ""}
                    onClick={() => { setActiveCategory(item); setCatalogOpen(false) }}
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* ── Cart Drawer ── */}
      <div className={`side-drawer right-drawer ${cartOpen ? "open" : ""}`}>
        <CloseIcon onClick={() => setCartOpen(false)} />
        <h2 className="drawer-title">КОШИК</h2>
        <div className="cart-items-container">
          {cart.length === 0 ? (
            <div className="empty-cart-message">
              <span style={{ fontSize: 40 }}>🛒</span>
              <span>Кошик порожній</span>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.cartId} className="cart-item">
                <div className="cart-item-row">
                  <img src={item.images?.[0] || "https://via.placeholder.com/150"} alt={item.name} className="cart-item-img" />
                  <div className="cart-item-info">
                    <div className="cart-item-name">{item.name}</div>
                    <div className="cart-item-size">Розмір: {item.selectedSize}</div>
                  </div>
                  <div className="cart-item-price-block">
                    <div className="cart-item-price">{item.price} грн</div>
                    <span className="cart-item-delete" onClick={() => removeFromCart(item.cartId)}>🗑</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        {cart.length > 0 && (
          <div className="cart-footer">
            <div className="cart-total">
              <span>Разом:</span>
              <span className="cart-total-price">{getCartTotal()} грн</span>
            </div>
            <button className="checkout-main-btn" onClick={() => { setCartOpen(false); setCheckoutOpen(true); setCheckoutStep(1) }}>
              Оформити замовлення
            </button>
            <a href={getManagerLink(clientInfo.phone, getCartTotal())} target="_blank" rel="noopener noreferrer"
              style={{ display: "block", textAlign: "center", color: "#1a73e8", marginTop: 12, fontWeight: 600, textDecoration: "none" }}>
              Написати менеджеру
            </a>
          </div>
        )}
      </div>

      {/* ── Main Content ── */}
      <main className="main-content">
        {/* Hero */}
        <section className="hero-section">
          <div className="hero-mobile">
            <img src={HERO_BG} alt="Vibe Store" className="hero-mobile-img" />
            <button className="cta-button cta-mobile" onClick={() => setCatalogOpen(true)}>
              Дивитись товари
            </button>
          </div>
          <div className="hero-desktop">
            <img src={HERO_BG} alt="Vibe Store" className="hero-desktop-img" />
            <button className="cta-button" onClick={() => setCatalogOpen(true)}>
              Дивитись товари
            </button>
          </div>
          <div className="hero-description-box">
            <div className="animated-gradient-box">
              <strong>VIBE STORE</strong> — це онлайн-магазин люксових речей під замовлення з Китаю 🇨🇳<br/><br/>
              Ми підбираємо одяг, взуття та аксесуари під клієнта з увагою до деталей: розмір, колір і якість.<br/><br/>
              Працюємо чесно і прозоро, супроводжуємо замовлення від покупки до отримання.<br/><br/>
              ⭐️ 500+ позитивних відгуків<br/><br/>
              <strong>VIBE STORE</strong> — коли хочеш виглядати стильно без переплат 💙
            </div>
          </div>
        </section>

        {/* Products grid */}
        <section className="shop-section all-products-section">
          <div className={`animated-title ${titleVisible ? "is-visible" : ""}`}>
            {activeCategory === "Усі товари" ? "УСІ ТОВАРИ" : activeCategory.toUpperCase()}
          </div>
          <div className="all-products-grid">
            {filteredProducts.length > 0 ? (
              filteredProducts.map(product => (
                <div key={product.id} className="product-scroll-anim" onClick={() => openProductModal(product)}>
                  <div className="product-card">
                    {adminOpen && (
                      <div className="delete-icon" onClick={(e) => { e.stopPropagation(); handleDeleteProduct(product.id) }}>🗑</div>
                    )}
                    <div className="product-image-wrapper">
                      <img src={product.images?.[0] || "https://via.placeholder.com/150"} alt={product.name} className="product-image" />
                    </div>
                    <div className="product-title">{product.name}</div>
                    <div className="product-price">{product.price} грн</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="no-products">
                <p>Товарів не знайдено</p>
                <button className="reset-filter" onClick={() => setActiveCategory("Усі товари")}>Скинути фільтр</button>
              </div>
            )}
          </div>
        </section>
      </main>

      {/* ── Product Modal ── */}
      {selectedProduct && (
        <div className={`modal-overlay ${modalClosing ? "closing" : ""}`} onClick={closeProductModal}>
          <div className={`compact-modal ${modalClosing ? "closing" : ""}`} onClick={e => e.stopPropagation()}>
            <CloseIcon onClick={closeProductModal} className="close-icon-wrapper modal-close-pos" />
            <div className="modal-drag-indicator" />
            <div className="slider-modal-container">
              <div className="slider-image-wrapper">
                <img
                  src={selectedProduct.images?.[selectedProduct.currentImageIndex || 0] || "https://via.placeholder.com/300"}
                  alt={selectedProduct.name}
                  className="slider-image"
                />
              </div>
            </div>
            <h2 className="modal-product-title">{selectedProduct.name}</h2>
            <p className="modal-product-desc">{selectedProduct.desc}</p>
            <div className="modal-size-label">ОБЕРІТЬ РОЗМІР</div>
            <div className="modal-sizes">
              {allSizes.map(size => (
                <button
                  key={size}
                  className={`size-btn ${selectedSize === size ? "selected" : ""}`}
                  onClick={() => setSelectedSize(size)}
                >
                  {size}
                </button>
              ))}
            </div>
            <button
              className={`main-action-btn ${selectedSize ? "" : "disabled"}`}
              disabled={!selectedSize}
              onClick={() => selectedSize && addToCart(selectedProduct, selectedSize)}
            >
              {selectedSize ? `Додати в кошик — ${selectedProduct.price} грн` : "Оберіть розмір"}
            </button>
            <div className="reviews-section">
              <h3>ВІДГУКИ</h3>
              {reviews.map((review, idx) => (
                <div key={idx} className="review-card">
                  <div className="review-header">
                    <span className="review-name">{review.name}</span>
                    <span className="review-stars">★★★★★</span>
                  </div>
                  <div className="review-text">{review.text}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Rules Modal ── */}
      {rulesOpen && (
        <div className="rules-overlay" onClick={() => setRulesOpen(false)}>
          <div className="rules-modal" onClick={e => e.stopPropagation()}>
            <button className="rules-close" onClick={() => setRulesOpen(false)}>✕</button>
            <h2 className="rules-title">Правила магазину</h2>
            <div className="rules-content">
              <h3>1. Доставка</h3>
              <p>Доставка здійснюється через Нову Пошту. Термін доставки 1-3 робочі дні. Безкоштовна доставка при замовленні від 3000 грн.</p>
              <h3>2. Оплата</h3>
              <p>Приймаємо оплату на карту MonoBank або через IBAN (ФОП ПУМБ). Можлива повна оплата або передплата 50%.</p>
              <h3>3. Повернення</h3>
              <p>Повернення можливе протягом 14 днів отримання товару. Товар повинен бути без слідів використання та з оригінальними бірками.</p>
              <h3>4. Гарантія</h3>
              <p>Надаємо гарантію на всі товари. Термін гарантії залежить від категорії товару.</p>
              <h3>5. Зв'язок з менеджером</h3>
              <p>З будь-яких питань звертайтесь до нашого менеджера в Telegram: @vibestore_manager</p>
            </div>
          </div>
        </div>
      )}

      {/* ── Fullscreen Checkout ── */}
      <AnimatePresence>
        {checkoutOpen && (
          <motion.div
            className="fullscreen-checkout-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="checkout-container">
              <button className="checkout-close-btn" onClick={() => { setCheckoutOpen(false); setOrderSent(false); setCheckoutStep(1) }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>

              {orderSent ? (
                <div className="checkout-success-full">
                  <div className="success-icon">✓</div>
                  <h2>Замовлення надіслано!</h2>
                  <p>Дякуємо за замовлення. Наш менеджер зв'яжеться з вами найближчим часом.</p>
                </div>
              ) : (
                <>
                  <div className="step-indicator">
                    <div className={`step ${checkoutStep >= 1 ? "active" : ""}`}>
                      <span>1</span> Клієнт
                    </div>
                    <div className={`step-line ${checkoutStep >= 2 ? "active" : ""}`} />
                    <div className={`step ${checkoutStep >= 2 ? "active" : ""}`}>
                      <span>2</span> Оплата
                    </div>
                    <div className={`step-line ${checkoutStep >= 3 ? "active" : ""}`} />
                    <div className={`step ${checkoutStep >= 3 ? "active" : ""}`}>
                      <span>3</span> Підтвердження
                    </div>
                  </div>

                  <div className="checkout-step-content">
                    <div className="step-panel">
                      {checkoutStep === 1 && (
                        <>
                          <h3>Клієнт</h3>
                          <div className="input-group">
                            <span className="input-icon-emoji">👤</span>
                            <input type="text" placeholder="ПІБ" value={clientInfo.fullName}
                              onChange={e => setClientInfo(p => ({ ...p, fullName: e.target.value }))} />
                          </div>
                          <div className="input-group">
                            <span className="input-icon-emoji">📞</span>
                            <input type="tel" placeholder="Телефон" value={clientInfo.phone}
                              onChange={e => setClientInfo(p => ({ ...p, phone: e.target.value }))} />
                          </div>
                          <div className="input-group">
                            <span className="input-icon-emoji">📍</span>
                            <input type="text" placeholder="Місто" value={clientInfo.city}
                              onChange={e => setClientInfo(p => ({ ...p, city: e.target.value }))} />
                          </div>
                          <div className="input-group">
                            <span className="input-icon-emoji">📦</span>
                            <input type="text" placeholder="Відділення Нової Пошти" value={clientInfo.novaPoshta}
                              onChange={e => setClientInfo(p => ({ ...p, novaPoshta: e.target.value }))} />
                          </div>
                          <button className="step-next-btn"
                            disabled={!clientInfo.fullName || !clientInfo.phone || !clientInfo.city || !clientInfo.novaPoshta}
                            onClick={() => setCheckoutStep(2)}>
                            Далі
                          </button>
                        </>
                      )}

                      {checkoutStep === 2 && (
                        <>
                          <h3>Оплата</h3>
                          <div className="payment-methods">
                            <div className={`payment-option ${paymentMethod === "card" ? "active" : ""}`}
                              onClick={() => setPaymentMethod("card")}>💳 Картка (Mono)</div>
                            <div className={`payment-option ${paymentMethod === "iban" ? "active" : ""}`}
                              onClick={() => setPaymentMethod("iban")}>🏦 IBAN (ФОП ПУМБ)</div>
                          </div>

                          {paymentMethod === "card" && (
                            <div className="payment-details">
                              <p>Картка: <strong>4441 1144 0147 7805</strong></p>
                              <p>Отримувач: <strong>Влад В.</strong></p>
                            </div>
                          )}
                          {paymentMethod === "iban" && (
                            <div className="payment-details">
                              <p>IBAN: <strong>UA413348510000000026006332215</strong></p>
                              <p>Отримувач: <strong>ФОП Олійник Олександр Олександрович</strong></p>
                              <p>Банк: <strong>ПУМБ</strong></p>
                            </div>
                          )}

                          <div className="payment-methods">
                            <div className={`payment-option ${paymentType === "full" ? "active" : ""}`}
                              onClick={() => setPaymentType("full")}>Повна оплата (100%)</div>
                            <div className={`payment-option ${paymentType === "half" ? "active" : ""}`}
                              onClick={() => setPaymentType("half")}>Передплата (50%)</div>
                          </div>

                          <AudioPlayer src={AUDIO_SRC} />

                          <div className="screenshot-upload-section">
                            <div className="screenshot-label">
                              <span className="screenshot-icon">📸</span> Скріншот оплати
                            </div>
                            <input type="file" accept="image/*" id="payment-screenshot" style={{ display: "none" }}
                              onChange={e => { const f = e.target.files?.[0]; if (f) setScreenshotFile(f) }} />
                            {screenshotFile ? (
                              <div className="screenshot-preview">
                                <span>✅ {screenshotFile.name}</span>
                                <button className="remove-screenshot" onClick={() => setScreenshotFile(null)}>✕</button>
                              </div>
                            ) : (
                              <label htmlFor="payment-screenshot" className="screenshot-upload-area">
                                <div className="upload-placeholder">
                                  <span>📤</span><span>Натисніть для завантаження</span>
                                </div>
                              </label>
                            )}
                          </div>

                          <label className="payment-confirm-checkbox">
                            <input type="checkbox" checked={paymentConfirmed} onChange={e => setPaymentConfirmed(e.target.checked)} />
                            Я підтверджую оплату
                          </label>
                          <label className="payment-confirm-checkbox">
                            <input type="checkbox" checked={termsAccepted} onChange={e => setTermsAccepted(e.target.checked)} />
                            <span>Я погоджуюсь з <a href="#" onClick={e => { e.preventDefault(); setRulesOpen(true) }} style={{ color: "#007AFF" }}>правилами магазину</a></span>
                          </label>

                          <button className="step-back-btn" onClick={() => setCheckoutStep(1)}>Назад</button>
                          <button className="step-next-btn"
                            disabled={!paymentMethod || !paymentType || !isCheckoutReady}
                            onClick={() => setCheckoutStep(3)}>
                            Далі
                          </button>
                        </>
                      )}

                      {checkoutStep === 3 && (
                        <>
                          <h3>Підтвердження</h3>
                          <div className="total-amount-box">
                            <div className="total-value">
                              {paymentType === "full" ? getCartTotal() : Math.ceil(getCartTotal() / 2)} грн
                            </div>
                            <div style={{ fontSize: 14, color: "#64748b", marginTop: 4 }}>
                              {paymentType === "full" ? "Повна оплата" : "Передплата (50%)"}
                            </div>
                          </div>
                          <button className="step-back-btn" onClick={() => setCheckoutStep(2)}>Назад</button>
                          <button className={`confirm-order-btn ${isCheckoutReady ? "active" : "disabled"}`}
                            disabled={!isCheckoutReady || sending} onClick={submitOrder}>
                            {sending ? "Надсилаємо..." : "Підтвердити замовлення"}
                          </button>
                          <div className="telegram-manager-link">
                            <a href={getManagerLink(clientInfo.phone, getCartTotal())} target="_blank" rel="noopener noreferrer">
                              Написати менеджеру в Telegram
                            </a>
                          </div>
                        </>
                      )}
                    </div>

                    <div className="checkout-summary">
                      <h3>Ваше замовлення</h3>
                      <div className="summary-items">
                        {cart.map(item => (
                          <div key={item.cartId} className="summary-item">
                            <div>
                              <div className="summary-item-name">{item.name}</div>
                              <div style={{ fontSize: 12, color: "#64748b" }}>Розмір: {item.selectedSize}</div>
                            </div>
                            <div className="summary-item-price">{item.price} грн</div>
                          </div>
                        ))}
                      </div>
                      <div className="summary-total">
                        <span>Разом:</span>
                        <span className="total-amount">{getCartTotal()} грн</span>
                      </div>
                      <div className="summary-note">Остаточна сума залежить від типу оплати</div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Footer ── */}
      <footer className="main-footer">
        <div className="footer-content">
          <div className="footer-logo-section">
            <div className="footer-logo">VIBE STORE</div>
            <p>Оригінальний одяг та взуття</p>
          </div>
          <div className="footer-links">
            <div className="footer-column">
              <h4>Каталог</h4>
              {["Кросівки", "Худі та світшоти", "Футболки", "Шкарпетки"].map(item => (
                <span key={item} className="footer-link" onClick={() => { setActiveCategory(item); window.scrollTo(0, 0) }}>{item}</span>
              ))}
            </div>
            <div className="footer-column">
              <h4>Соцмережі</h4>
              <a href="https://instagram.com/vibestoree.ua" target="_blank" rel="noopener noreferrer" className="footer-link">Instagram</a>
              <a href="https://tiktok.com/@vibestore.ua" target="_blank" rel="noopener noreferrer" className="footer-link">TikTok</a>
              <a href="https://t.me/vibestore_manager" target="_blank" rel="noopener noreferrer" className="footer-link">Telegram</a>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          © 2024 VIBE STORE. Усі права захищені.
        </div>
      </footer>
    </div>
  )
}

export default App
