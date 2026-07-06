import { useState } from 'react'
import { adminCategories, sizesShoes, sizesClothes } from '../data/catalog'

const ADMIN_PASS = "8934"

export default function AdminPanel({ products, setProducts, saveProducts, onClose }) {
  const [loggedIn, setLoggedIn] = useState(false)
  const [loginInput, setLoginInput] = useState("")
  const [loginError, setLoginError] = useState("")

  const [form, setForm] = useState({
    name: "", price: "", category: "", desc: "", topDrop: false,
    sizes: {}, images: []
  })
  const [editingId, setEditingId] = useState(null)
  const [tab, setTab] = useState("add")

  const getSizesForCategory = (cat) => {
    if (cat === "Кросівки") return sizesShoes
    return sizesClothes
  }

  const handleLogin = () => {
    if (loginInput === ADMIN_PASS) {
      setLoggedIn(true)
      setLoginError("")
    } else {
      setLoginError("Невірний пароль")
    }
  }

  const handleCategoryChange = (cat) => {
    const sizes = getSizesForCategory(cat)
    const availability = {}
    sizes.forEach(s => { availability[s] = true })
    setForm(p => ({ ...p, category: cat, sizes: availability }))
  }

  const handleSizeToggle = (size) => {
    setForm(p => ({
      ...p,
      sizes: { ...p.sizes, [size]: !p.sizes[size] }
    }))
  }

  const handleImages = (files) => {
    const urls = Array.from(files).map(f => URL.createObjectURL(f))
    setForm(p => ({ ...p, images: [...p.images, ...urls] }))
  }

  const removeImage = (idx) => {
    setForm(p => ({ ...p, images: p.images.filter((_, i) => i !== idx) }))
  }

  const resetForm = () => {
    setForm({ name: "", price: "", category: "", desc: "", topDrop: false, sizes: {}, images: [] })
    setEditingId(null)
  }

  const handleSubmit = () => {
    if (!form.name || !form.price || !form.category) {
      return alert("Заповніть назву, ціну та категорію!")
    }
    const productData = {
      name: form.name,
      price: form.price,
      category: form.category,
      desc: form.desc,
      topDrop: form.topDrop,
      sizes: form.sizes,
      images: form.images.length > 0 ? form.images : ["https://via.placeholder.com/150"],
      currentImageIndex: 0
    }

    let updated
    if (editingId) {
      updated = products.map(p => p.id === editingId ? { ...p, ...productData } : p)
    } else {
      updated = [...products, { id: Date.now(), ...productData }]
    }
    setProducts(updated)
    saveProducts(updated)
    resetForm()
    alert(editingId ? "Товар оновлено!" : "Товар додано!")
  }

  const handleEdit = (product) => {
    setForm({
      name: product.name,
      price: product.price,
      category: product.category,
      desc: product.desc || "",
      topDrop: product.topDrop || false,
      sizes: product.sizes ? (Array.isArray(product.sizes)
        ? product.sizes.reduce((acc, s) => ({ ...acc, [s]: true }), {})
        : product.sizes) : {},
      images: product.images || []
    })
    setEditingId(product.id)
    setTab("add")
  }

  const handleDelete = (id) => {
    if (!confirm("Видалити цей товар?")) return
    const updated = products.filter(p => p.id !== id)
    setProducts(updated)
    saveProducts(updated)
    if (editingId === id) resetForm()
  }

  if (!loggedIn) {
    return (
      <div className="admin-overlay">
        <div className="admin-login-modal">
          <button className="admin-close-btn" onClick={onClose} style={{ fontSize: 18, marginBottom: 8 }}>← Назад</button>
          <h2>🔐 Вхід в адмін-панель</h2>
          <input
            type="password"
            placeholder="Пароль"
            className="admin-input"
            value={loginInput}
            onChange={e => setLoginInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleLogin()}
          />
          {loginError && <div className="admin-login-error">{loginError}</div>}
          <button className="admin-submit" onClick={handleLogin}>Увійти</button>
          <button className="admin-cancel-btn" onClick={onClose}>Скасувати</button>
        </div>
      </div>
    )
  }

  return (
    <div className="admin-overlay">
      <div className="admin-full-panel">
        <div className="admin-panel-header">
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button className="admin-close-btn" onClick={onClose} style={{ fontSize: 18 }}>← Назад</button>
          </div>
          <h2>⚡ Панель керування</h2>
          <div />
        </div>

        <div className="admin-tabs">
          <button className={`admin-tab ${tab === "add" ? "active" : ""}`} onClick={() => { setTab("add"); resetForm() }}>
            {editingId ? "Редагувати" : "Додати товар"}
          </button>
          <button className={`admin-tab ${tab === "list" ? "active" : ""}`} onClick={() => setTab("list")}>
            Список товарів ({products.length})
          </button>
        </div>

        {tab === "add" && (
          <div className="admin-form">
            <input type="text" placeholder="Назва товару" className="admin-input"
              value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />

            <div className="admin-row">
              <input type="number" placeholder="Ціна (UAH)" className="admin-input"
                value={form.price} onChange={e => setForm(p => ({ ...p, price: e.target.value }))} />
              <select className="admin-input" value={form.category}
                onChange={e => handleCategoryChange(e.target.value)}>
                <option value="">Категорія</option>
                {adminCategories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <input type="text" placeholder="Опис" className="admin-input"
              value={form.desc} onChange={e => setForm(p => ({ ...p, desc: e.target.value }))} />

            <label className="admin-checkbox-label">
              <input type="checkbox" checked={form.topDrop}
                onChange={e => setForm(p => ({ ...p, topDrop: e.target.checked }))} />
              TOP DROP (відображається на головній)
            </label>

            {form.category && (
              <div className="admin-sizes-section">
                <div className="admin-sizes-title">Наявність по розмірах:</div>
                <div className="admin-sizes-grid">
                  {getSizesForCategory(form.category).map(size => (
                    <button key={size}
                      className={`admin-size-btn ${form.sizes[size] ? "active" : "inactive"}`}
                      onClick={() => handleSizeToggle(size)}>
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="file-zone">
              <label className="file-label">Фото товару</label>
              <input type="file" accept="image/*" multiple style={{ display: "none" }}
                id="admin-images" onChange={e => handleImages(e.target.files)} />
              <label htmlFor="admin-images" className="file-trigger">Обрати файли</label>
              {form.images.length > 0 && (
                <div className="admin-preview-images">
                  {form.images.map((url, idx) => (
                    <div key={idx} className="admin-preview-thumb">
                      <img src={url} alt="" />
                      <span className="admin-preview-remove" onClick={() => removeImage(idx)}>✕</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button className="admin-submit" onClick={handleSubmit}>
              {editingId ? "Оновити товар" : "Додати товар"}
            </button>
            {editingId && (
              <button className="admin-cancel-btn" onClick={resetForm}>Скасувати редагування</button>
            )}
          </div>
        )}

        {tab === "list" && (
          <div className="admin-products-list">
            {products.length === 0 && <p className="admin-empty">Товарів ще немає</p>}
            {products.map(product => (
              <div key={product.id} className="admin-product-item">
                <img src={product.images?.[0] || "https://via.placeholder.com/50"} alt="" className="admin-product-thumb" />
                <div className="admin-product-info">
                  <div className="admin-product-name">{product.name}</div>
                  <div className="admin-product-meta">{product.price} грн · {product.category}</div>
                  {product.topDrop && <span className="admin-top-badge">TOP</span>}
                  <div className="admin-product-sizes">
                    {product.sizes && Object.entries(
                      Array.isArray(product.sizes)
                        ? product.sizes.reduce((a, s) => ({ ...a, [s]: true }), {})
                        : product.sizes
                    ).filter(([, v]) => v).map(([s]) => s).join(", ")}
                  </div>
                </div>
                <div className="admin-product-actions">
                  <button className="admin-edit-btn" onClick={() => handleEdit(product)}>✏️</button>
                  <button className="admin-delete-btn" onClick={() => handleDelete(product.id)}>🗑</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
